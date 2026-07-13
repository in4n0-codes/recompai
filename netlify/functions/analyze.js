/* Serverless food analyzer — holds the Anthropic API key server-side.
   The browser POSTs {type:'text', text} or {type:'photo', dataUrl};
   Claude returns structured macros per item. The key is read from the
   ANTHROPIC_API_KEY environment variable set in Netlify (never in the client). */

// Swap to 'claude-haiku-4-5' for ~5x cheaper analysis — plenty accurate for food.
const MODEL = 'claude-opus-4-8';

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

const GUIDE = `You estimate nutrition for meals, including Indian home and street food.
Break the meal into separate items. For each item return:
- name: short food name
- qty + unit: the amount, unit one of "g" (solids), "ml" (liquids), "pc" (countable pieces like roti, egg, chicken leg)
- kcal, protein, carbs, fat: the TOTAL macros for that quantity (grams for macros), not per-100g
Be realistic: roadside juices and gravies are often loaded with sugar and oil, restaurant portions are large.
When the amount is not given, estimate a normal serving. Give your best single estimate — the user will adjust.`;

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
