/* Serverless food analyzer + meal-summary buddy.
   Holds the Anthropic API key server-side (ANTHROPIC_API_KEY in Netlify).
   Modes:
     {type:'text'|'photo', ...}  -> returns { hint, items:[...] } (web-searches branded foods)
     {type:'summary', items, ...} -> returns { summary } (short encouraging note) */

// Haiku 4.5 — fast + cheap. Swap to 'claude-opus-4-8' for max accuracy.
const MODEL = 'claude-haiku-4-5';
const ANTHROPIC = 'https://api.anthropic.com/v1/messages';

const FOOD_GUIDE = `You estimate calories and protein for meals, including Indian home and street food.

Rules:
1. SPLIT the meal into one item per distinct food. "and", "n", "&", "with", commas, or newlines separate foods.
   "4 roti n bhindi sabji 100g" -> TWO items: {roti, 4 pc} and {bhindi sabji, 100 g}.
2. Countable foods (roti, momo, egg, idli, samosa, paratha, chicken leg, wings, kabab pieces) use unit "pc" and qty = number of pieces. Estimate PER-PIECE macros, then return the TOTAL for all pieces.
   "10 chicken momos" -> {qty:10, unit:"pc"}, each ~45 kcal & ~3 g protein -> TOTAL ~450 kcal & ~30 g protein.
3. Solids by weight use "g"; liquids use "ml".
4. kcal, protein, carbs, fat are the TOTAL for the whole quantity (macros in grams) — never per 100 g.
5. ACCURACY: For BRANDED or restaurant foods (KFC, McDonald's, Domino's, Starbucks, etc.) or packaged products, USE the web_search tool to find the official published nutrition and use those exact figures. For home-cooked or generic foods, do NOT search — estimate directly. Home food is most meals; only search when a brand/outlet is named.
6. If an amount is missing, assume one normal serving. Street juices/gravies carry lots of sugar and oil.
For a PHOTO: identify each distinct food, estimate its portion, then output the same way.

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
