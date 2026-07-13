/* Serverless food analyzer — holds the Anthropic API key server-side.
   The browser POSTs {type:'text', text} or {type:'photo', dataUrl};
   Claude returns structured macros per item. The key is read from the
   ANTHROPIC_API_KEY environment variable set in Netlify (never in the client). */

// Haiku 4.5 — fast + cheap, plenty accurate for food. Swap to 'claude-opus-4-8' for max accuracy.
const MODEL = 'claude-haiku-4-5';

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:    { type: 'string' },
          qty:     { type: 'number' },
          unit:    { type: 'string', enum: ['g', 'ml', 'pc'] },
          kcal:    { type: 'number' },
          protein: { type: 'number' },
          carbs:   { type: 'number' },
          fat:     { type: 'number' }
        },
        required: ['name', 'qty', 'unit', 'kcal', 'protein', 'carbs', 'fat'],
        additionalProperties: false
      }
    }
  },
  required: ['items'],
  additionalProperties: false
};

const GUIDE = `You estimate calories and protein for meals, including Indian home and street food.

Rules:
1. SPLIT the meal into one item per distinct food. "and", "n", "&", "with", commas, or newlines separate foods.
   Example: "4 roti n bhindi sabji 100g" -> TWO items: {roti, 4 pc} and {bhindi sabji, 100 g}.
2. Countable foods (roti, momo, egg, idli, samosa, paratha, chicken leg, kabab pieces) use unit "pc" and qty = number of pieces. Estimate PER-PIECE macros, then return the TOTAL for all pieces.
   Example: "10 chicken momos" -> {name:"Chicken momos", qty:10, unit:"pc"}, each momo ~45 kcal & ~3 g protein, so TOTAL ~450 kcal & ~30 g protein.
3. Solids by weight use "g"; liquids use "ml".
4. kcal, protein, carbs, fat are the TOTAL for the whole quantity (macros in grams) — never per 100 g.
5. Be realistic: roadside juices/gravies carry lots of sugar and oil; restaurant portions are large.
6. If an amount is missing, assume one normal serving.
For a PHOTO: identify each distinct food, estimate its portion (weight in g, volume in ml, or piece count), then output the same way.
Give your single best estimate for each item — the user will fine-tune.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return { statusCode: 500, body: JSON.stringify({ error: 'Server is missing ANTHROPIC_API_KEY' }) };

  let input;
  try { input = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Bad request body' }) }; }

  const content = [];
  let hint;
  if (input.type === 'photo' && typeof input.dataUrl === 'string') {
    const m = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(input.dataUrl);
    if (!m) return { statusCode: 400, body: JSON.stringify({ error: 'Bad image data' }) };
    content.push({ type: 'image', source: { type: 'base64', media_type: m[1].toLowerCase(), data: m[2] } });
    content.push({ type: 'text', text: GUIDE + '\n\nAnalyze the food in this photo.' });
    hint = 'Here’s what I see — tweak the amounts, then add it.';
  } else {
    content.push({ type: 'text', text: GUIDE + '\n\nAnalyze this meal:\n' + (input.text || '') });
    hint = 'Here’s what I read — tweak the amounts, then add it.';
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{ role: 'user', content }]
      })
    });
    const j = await r.json();
    if (!r.ok) {
      return { statusCode: r.status, body: JSON.stringify({ error: (j.error && j.error.message) || 'Claude API error' }) };
    }
    const textBlock = (j.content || []).find(b => b.type === 'text');
    const parsed = JSON.parse(textBlock.text);
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hint, items: parsed.items || [] })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e) }) };
  }
};
