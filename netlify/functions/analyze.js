/* Serverless food analyzer + meal-summary buddy.
   Holds the Anthropic API key server-side (ANTHROPIC_API_KEY in Netlify).
   Modes:
     {type:'text'|'photo', ...}  -> returns { hint, items:[...] } (web-searches branded foods)
     {type:'summary', items, ...} -> returns { summary } (short encouraging note) */

// Haiku 4.5 — fast + cheap. Swap to 'claude-opus-4-8' for max accuracy.
const MODEL = 'claude-haiku-4-5';
const ANTHROPIC = 'https://api.anthropic.com/v1/messages';

const FOOD_GUIDE = `You estimate calories and protein for meals — accuracy on kcal and protein is the priority. Assume Indian home and street food unless told otherwise.

SPLIT: one item per distinct food. "and", "n", "&", "with", commas, or newlines separate foods.
   "4 roti n bhindi sabji 100g" -> TWO items: {roti, 4 pc} and {bhindi sabji, 100 g}.

UNIT & PORTION:
- Countable foods (roti, momo, egg, idli, dosa, samosa, paratha, chicken leg, wing, kabab piece) use unit "pc", qty = number of pieces. Estimate PER piece, then multiply for the total.
   "10 chicken momos" -> {qty:10, unit:"pc"}, ~45 kcal & ~3 g protein each -> ~450 kcal & ~30 g protein total.
- Solids by weight use "g"; liquids use "ml". If no amount is given, assume one normal serving.
- Weights for cooked meat/rice are AS SERVED (cooked), not raw.
- kcal, protein, carbs, fat are the TOTAL for the whole quantity (macros in grams) — never per 100 g.

ACCURACY RULES (this is where estimates usually go wrong — follow them):
- COOKING FAT: home sabzi, dal, curries and fried food are cooked in oil or ghee. Always include it. A normal home sabzi is ~120-160 kcal per 100 g, NOT 30-40. 1 tsp oil ≈ 40 kcal, 1 tbsp ≈ 120 kcal.
- Protein rarely exceeds ~30 g per 100 g of any food (cooked chicken, paneer, eggs are the high end; grains, veg and juices are low). Sanity-check every protein number against this before finalizing.
- Be realistic, not optimistic: restaurant and street portions are large and oily; roadside juices are loaded with sugar.

REFERENCE ANCHORS (scale for the actual portion and added oil):
- 1 roti/chapati (~40 g): 110 kcal, 3 g P
- 100 g cooked rice: 130 kcal, 2.7 g P
- 100 g dal, tempered: 120 kcal, 5 g P
- 100 g veg sabzi with oil: 140 kcal, 3 g P
- 100 g cooked chicken (curry/roast/tikka): 200 kcal, 26 g P
- 100 g paneer: 265 kcal, 18 g P
- 1 egg: 78 kcal, 6 g P
- 100 ml milk: 60 kcal, 3.3 g P

BRANDED: for named brands/outlets (KFC, McDonald's, Domino's, Starbucks, Amul, protein bars, etc.) or packaged products, USE the web_search tool and use the official published figures. For home/generic food do NOT search — use the anchors above.
QUOTED BRANDS: any text inside double quotes (e.g. "Superyou", "Yoga Bar") is a SPECIFIC brand/product name. You MUST web_search for that exact product's official nutrition label and use those numbers — do not guess.

For a PHOTO: identify each food, estimate its portion (weight, volume, or piece count) from the visible size, then apply the same rules.

Return ONLY a JSON object, no prose, no markdown fences, in exactly this shape:
{"items":[{"name":"string","qty":number,"unit":"g|ml|pc","kcal":number,"protein":number,"carbs":number,"fat":number}]}`;

const SUMMARY_GUIDE = (goalP, goalK) => `You are an upbeat, warm fitness buddy for someone with ADHD doing body recomposition (daily targets ~${goalP} g protein, ~${goalK} kcal). They just logged a meal and need a quick dopamine hit to stay consistent. Write 2-3 short sentences that:
- celebrate a genuine positive in this meal (protein hit, fibre, veggies, a solid macro),
- if relevant, gently flag ONE thing to watch (oil, sugar, low protein) with zero guilt,
- end on momentum ("keep going", "you're on track").
Be specific to the actual foods. Warm, a little playful. At most one emoji. Under 45 words. Return only the message text.`;

async function callClaude(body, KEY) {
  const r = await fetch(ANTHROPIC, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || ('Claude API ' + r.status));
  return j;
}
function allText(content) { return (content || []).filter(b => b.type === 'text').map(b => b.text).join('\n'); }
function extractJson(content) {
  const t = allText(content); const s = t.indexOf('{'); const e = t.lastIndexOf('}');
  if (s < 0 || e < 0) throw new Error('No JSON in response');
  return JSON.parse(t.slice(s, e + 1));
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Server is missing ANTHROPIC_API_KEY' }) };

  let input;
  try { input = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Bad request body' }) }; }

  try {
    /* ---------- meal summary ---------- */
    if (input.type === 'summary') {
      const g = input.goals || {}; const dt = input.dayTotals || {};
      const items = (input.items || []).map(i => `${i.qty}${i.unit} ${i.name} (${i.kcal} kcal, ${i.protein}g protein)`).join('; ');
      const userText = `Meal just logged for ${input.slot || 'a meal'}: ${items}. After this, today's running total is ${dt.kcal ?? '?'} kcal and ${dt.protein ?? '?'}g protein.`;
      const j = await callClaude({
        model: MODEL, max_tokens: 200,
        system: SUMMARY_GUIDE(g.protein || 150, g.kcal || 2350),
        messages: [{ role: 'user', content: userText }]
      }, KEY);
      return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ summary: allText(j.content).trim() }) };
    }

    /* ---------- food analysis (with web search for branded foods) ---------- */
    const content = [];
    let hint;
    if (input.type === 'photo' && typeof input.dataUrl === 'string') {
      const m = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(input.dataUrl);
      if (!m) return { statusCode: 400, body: JSON.stringify({ error: 'Bad image data' }) };
      content.push({ type: 'image', source: { type: 'base64', media_type: m[1].toLowerCase(), data: m[2] } });
      content.push({ type: 'text', text: FOOD_GUIDE + '\n\nAnalyze the food in this photo.' });
      hint = 'Here’s what I see — tweak the amounts, then add it.';
    } else {
      content.push({ type: 'text', text: FOOD_GUIDE + '\n\nAnalyze this meal:\n' + (input.text || '') });
      hint = 'Here’s what I read — tweak the amounts, then add it.';
    }

    const tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }];
    let messages = [{ role: 'user', content }];
    let j;
    for (let i = 0; i < 4; i++) {
      j = await callClaude({ model: MODEL, max_tokens: 2000, tools, messages }, KEY);
      if (j.stop_reason === 'pause_turn') { messages.push({ role: 'assistant', content: j.content }); continue; }
      break;
    }
    const parsed = extractJson(j.content);
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hint, items: parsed.items || [] }) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
