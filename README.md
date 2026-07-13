# Macro + Gym Tracker

A private, on-device calorie + protein tracker with a gym calendar. No account, no server, $0.
Everything lives in your phone's browser (localStorage). Photo/text food logging, daily ledger, and a
month → week → day bird's-eye calendar with color-coded gym days (Push / Pull / Legs / Cardio / Rest).

## Run it locally
From this folder:
```
npx serve -l 5173 .
```
Then open http://localhost:5173 in a browser.

## Put it on your phone (installable web app)
1. Host the folder somewhere free — easiest options:
   - **GitHub Pages**: push this folder to a repo, enable Pages. Free HTTPS URL.
   - **Netlify / Vercel drop**: drag the folder onto their dashboard. Free HTTPS URL.
2. Open that URL on your phone → browser menu → **Add to Home Screen**.
3. It now opens full-screen like a native app and works offline.

(HTTPS is required for "install" + camera. localhost also counts as secure for testing.)

## How to use
- **+ button** → type food (e.g. `500ml milk + 40g protein powder`) or add a photo → tweak portions → add to a meal.
- **Today** → rings vs goals, what's left, per-meal breakdown, and one-tap gym log.
- **Calendar** → pick month → week → see each day's date, gym type (by color), and kcal/protein, plus weekly averages.
- **Settings (gear)** → change goals, load a sample week, **export a backup**, or clear data.

> Data lives only in this browser. Use **Export backup** regularly. Clearing browser data wipes it.

## Adding real Gemini analysis later (the one seam)
Right now food analysis uses a built-in estimator. To make it real, replace the body of
`analyze(input)` in `app.js` with a Gemini call. Input is either `{type:'text', text}` or
`{type:'photo', dataUrl}`. It must return `{ hint, items:[{name, qty, unit, food}] }` — the rest of
the UI is unchanged.

Sketch (Gemini 2.0 Flash, free tier from Google AI Studio):
```js
async function analyze(input){
  const key = 'YOUR_GEMINI_KEY';                    // keep this off the public web
  const parts = [{ text: PROMPT }];                 // ask for JSON: [{name, grams_or_ml_or_pieces, unit}]
  if (input.type === 'text') parts.push({ text: input.text });
  else parts.push({ inline_data: { mime_type:'image/jpeg', data: input.dataUrl.split(',')[1] } });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents:[{ parts }] }) });
  const json = await res.json();
  // parse json -> items, map each to findFood(name) so macros compute the same way
}
```
Note: calling Gemini directly from the browser exposes the key. For personal use that's usually fine,
but the clean version is a tiny serverless proxy (Cloudflare Worker / Vercel function, both free) that
holds the key. We can add that when you wire Gemini in.
