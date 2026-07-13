/* ============================================================
   Macro + Gym Tracker — on-device prototype
   Data lives in localStorage. No account, no server.
   The analyze() function is the seam where Gemini plugs in later.
   ============================================================ */

/* ---------- tiny icon set (inline SVG, no dependency) ---------- */
const ICONS = {
  settings:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  home:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  plus:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  x:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
  camera:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  text:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7V5h16v2M9 19h6M12 5v14"/></svg>',
  sparkles:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>',
  left:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
  right:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
  download:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  trash:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  coffee:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zM6 1v3M10 1v3M14 1v3"/></svg>',
  bowl:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11h18a9 9 0 0 1-18 0zM12 2v3M8 4v2M16 4v2"/></svg>',
  moon:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  snack:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2a3 3 0 0 0-3 3c0 1 .5 2 1 3-2 1-4 3-4 7a6 6 0 0 0 12 0c0-4-2-6-4-7 .5-1 1-2 1-3a3 3 0 0 0-3-3z"/></svg>',
  flame:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-1.2.4-2.3 1-3 .1 1.2.9 2 1.8 2 .8 0 1.2-.6 1.2-1.4C11 8 9 6.5 9 4.5 9 3.4 10.5 2.4 12 2z"/></svg>',
  edit:'<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
};
function renderIcons(root=document){ root.querySelectorAll('[data-ic]').forEach(el=>{ el.innerHTML = ICONS[el.getAttribute('data-ic')]||''; }); }

/* ---------- food estimator (stand-in for Gemini) ----------
   Each food: keywords, default unit, and macros PER unit.
   analyze() parses "500ml milk + 40g protein powder" into items.
   Swap analyze() to call Gemini later; the UI stays identical. */
const FOODS = [
  { keys:['protein powder','whey','protein scoop','protein'], unit:'g', def:30, per:{kcal:3.9,p:0.78,c:0.12,f:0.06} },
  { keys:['milk'], unit:'ml', def:250, per:{kcal:0.6,p:0.033,c:0.048,f:0.033} },
  { keys:['muesli','granola'], unit:'g', def:100, per:{kcal:3.7,p:0.09,c:0.66,f:0.06} },
  { keys:['oats','oatmeal'], unit:'g', def:60, per:{kcal:3.8,p:0.13,c:0.67,f:0.07} },
  { keys:['roti','chapati','phulka'], unit:'pc', def:1, per:{kcal:110,p:3,c:22,f:1.5} },
  { keys:['biriyani','biryani'], unit:'g', def:300, per:{kcal:1.7,p:0.06,c:0.24,f:0.05} },
  { keys:['chicken leg','leg piece','drumstick'], unit:'pc', def:1, per:{kcal:185,p:22,c:0,f:10} },
  { keys:['chicken roast','chicken breast','chicken curry','chicken'], unit:'g', def:150, per:{kcal:1.65,p:0.27,c:0,f:0.06} },
  { keys:['egg'], unit:'pc', def:1, per:{kcal:78,p:6.3,c:0.6,f:5.3} },
  { keys:['rice'], unit:'g', def:200, per:{kcal:1.3,p:0.027,c:0.28,f:0.003} },
  { keys:['dal','lentil','sambar'], unit:'g', def:200, per:{kcal:1.16,p:0.09,c:0.2,f:0.02} },
  { keys:['paneer'], unit:'g', def:100, per:{kcal:2.65,p:0.18,c:0.06,f:0.2} },
  { keys:['banana'], unit:'pc', def:1, per:{kcal:105,p:1.3,c:27,f:0.3} },
  { keys:['bread','toast','slice'], unit:'pc', def:1, per:{kcal:70,p:2.6,c:13,f:1} },
  { keys:['peanut butter'], unit:'g', def:30, per:{kcal:5.9,p:0.25,c:0.2,f:0.5} },
  { keys:['curd','yogurt','dahi'], unit:'g', def:150, per:{kcal:0.6,p:0.035,c:0.047,f:0.033} },
];
function myFoodMatch(n){
  const list = (typeof DATA!=='undefined' && DATA.myFoods) || [];
  for (const f of list){ if (f.name && n.includes(f.name.toLowerCase())){ const a=(+f.amt)||1;
    return { unit:f.unit, def:f.amt, per:{ kcal:(+f.kcal||0)/a, p:(+f.protein||0)/a, c:(+f.carbs||0)/a, f:(+f.fat||0)/a } }; } }
  return null;
}
function findFood(name){
  const n = name.toLowerCase();
  const mf = myFoodMatch(n); if (mf) return mf;      // your custom foods win — no API call
  for (const f of FOODS) for (const k of f.keys) if (n.includes(k)) return f;
  return null;
}
function macrosFor(food, qty){
  const p = food ? food.per : {kcal:1.5,p:0.08,c:0.15,f:0.05}; // generic fallback per gram
  return { kcal: qty*p.kcal, p: qty*p.p, c: qty*p.c, f: qty*p.f };
}
/* parse free text into editable items */
function parseText(text){
  const parts = text.split(/[+,&]|\band\b|\bn\b|\bwith\b|\n/i).map(s=>s.trim()).filter(Boolean);
  const items = [];
  for (let part of parts){
    const m = part.match(/(\d+(?:\.\d+)?)\s*(ml|g|kg|l|pcs?|pieces?|leg|scoops?)?/i);
    let qty=null, unit=null;
    if (m){ qty=parseFloat(m[1]); unit=(m[2]||'').toLowerCase(); }
    const name = part.replace(/(\d+(?:\.\d+)?)\s*(ml|g|kg|l|pcs?|pieces?|leg|scoops?)?/i,'').trim() || part;
    const food = findFood(name);
    if (unit==='kg'){ qty*=1000; unit='g'; }
    if (unit==='l'){ qty*=1000; unit='ml'; }
    if (/pc|piece|leg|scoop/.test(unit)) unit = food?food.unit:'pc';
    if (qty==null) qty = food?food.def:100;
    if (!unit) unit = food?food.unit:'g';
    items.push({ name: titleCase(name), qty, unit, food });
  }
  return items;
}
function titleCase(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

/* Analyze food from text or photo via Claude (a Netlify function holds the key).
   Input:  {type:'text', text} or {type:'photo', dataUrl}
   Output: { hint, items:[{name,qty,unit,food}] }  (food carries per-unit macros)
   Falls back to the built-in estimator if the API is unreachable. */
async function analyze(input){
  // If everything you typed matches your built-in or custom foods, skip the API entirely.
  if (input.type==='text'){
    const local = parseText(input.text);
    if (local.length && local.every(it=>it.food)){
      return { hint:'From your saved foods — no AI used. Tweak if you like:', items: local };
    }
  }
  try {
    const res = await fetch('/.netlify/functions/analyze', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error('api '+res.status);
    const data = await res.json();
    if (!data.items || !data.items.length) throw new Error('no items');
    const items = data.items.map(it => {
      const q = (+it.qty) || 1;
      return {
        name: titleCase(it.name || 'Item'),
        qty: (+it.qty) || (it.unit==='pc' ? 1 : 100),
        unit: it.unit || 'g',
        // synthetic food = per-unit macros, so the steppers rescale correctly
        food: { per: { kcal:(+it.kcal||0)/q, p:(+it.protein||0)/q, c:(+it.carbs||0)/q, f:(+it.fat||0)/q } }
      };
    });
    return { hint: data.hint || 'Here’s what I found — tweak any amount, then add it.', items };
  } catch(e){
    if (input.type==='text'){
      return { hint:'Estimated offline — tweak the amounts:', items: parseText(input.text) };
    }
    return { hint:'Photo analysis needs internet. Type the items instead, or add them manually.', items: [] };
  }
}

/* ---------- storage ---------- */
const KEY='mgt_data_v1';
const DEFAULT={ goals:{kcal:2350, protein:150}, days:{}, myFoods:[] };
let DATA = load();
function load(){ try{ const d=Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY))||{}); if(!Array.isArray(d.myFoods)) d.myFoods=[]; return d; }catch(e){ return structuredClone(DEFAULT); } }
function save(){ localStorage.setItem(KEY, JSON.stringify(DATA)); }
function dayKey(d=new Date()){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function getDay(k){ if(!DATA.days[k]) DATA.days[k]={ meals:{breakfast:[],lunch:[],dinner:[],snacks:[]}, gym:null }; return DATA.days[k]; }

/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const r0=n=>Math.round(n);
function sumMeal(items){ return items.reduce((a,it)=>{ const m=macrosFor(it.food,it.qty); a.kcal+=m.kcal; a.p+=m.p; a.c+=m.c; a.f+=m.f; return a; },{kcal:0,p:0,c:0,f:0}); }
function sumDay(day){ const t={kcal:0,p:0,c:0,f:0}; for(const s of ['breakfast','lunch','dinner','snacks']){ const m=sumMeal(day.meals[s]); t.kcal+=m.kcal;t.p+=m.p;t.c+=m.c;t.f+=m.f; } return t; }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.add('hidden'),1900); }
const pick=a=>a[Math.floor(Math.random()*a.length)];

/* ---------- AoT easter eggs ---------- */
const SASAGEYO=['Sasageyo! Devote your heart.','Shinzou wo Sasageyo.','For the Survey Corps.','One more set. Tatakae.'];
const GOAL_HIT=['Tatakae! Protein goal smashed.','That day, you remembered… to hit your protein.','Freedom. Goal reached.','The wall is broken. Goal hit.'];
const TITLE_QUOTES=['Tatakae! Tatakae!','If you win, you live. If you lose, you die.','My soldiers, rage!','This world is cruel… but the gains are real.','Keep moving forward.','I was born into this world.'];

/* ---------- streaks (the walls) ---------- */
const MILESTONES=[ {n:3,name:'Wall Maria secured'}, {n:7,name:'Wall Rose secured'}, {n:14,name:'Scout Regiment'}, {n:30,name:'Wall Sina secured'}, {n:50,name:'Beyond the walls'}, {n:100,name:'Titan of discipline'} ];
function dayActive(k){ const d=DATA.days[k]; if(!d) return false; const meals=['breakfast','lunch','dinner','snacks'].some(s=>d.meals[s].length); return !!d.gym||meals; }
function currentStreak(){ let n=0; const d=new Date(); if(!dayActive(dayKey(d))) d.setDate(d.getDate()-1); while(dayActive(dayKey(d))){ n++; d.setDate(d.getDate()-1); } return n; }
function wallName(n){ if(n>=100)return'Titan of discipline'; if(n>=50)return'Beyond the walls'; if(n>=30)return'Wall Sina'; if(n>=14)return'Scout Regiment'; if(n>=7)return'Wall Rose'; if(n>=3)return'Wall Maria'; if(n>=1)return'Recruit'; return'Start the fight'; }
function crossedMilestone(before,after){ for(const m of MILESTONES) if(before<m.n && after>=m.n) return m.name+`! ${after}-day streak.`; return null; }

/* ---------- cinematic scenes (original SVG art) ---------- */
const WINGS_G = `
  <g fill="#2e6fb0">
    <path d="M0 30 C-30 5 -75 12 -120 50 C-88 38 -62 42 -42 58 C-74 58 -96 78 -120 110 C-80 82 -54 86 -34 94 C-62 100 -80 118 -96 148 C-54 116 -22 102 0 100 Z"/>
    <path d="M0 30 C30 5 75 12 120 50 C88 38 62 42 42 58 C74 58 96 78 120 110 C80 82 54 86 34 94 C62 100 80 118 96 148 C54 116 22 102 0 100 Z"/>
  </g>
  <g fill="#f4f4f2">
    <path d="M0 -24 C-30 -44 -74 -42 -116 -14 C-86 -20 -64 -16 -46 -3 C-77 -8 -98 5 -120 35 C-82 10 -52 12 -32 21 C-60 21 -78 35 -92 62 C-52 32 -22 24 0 27 Z"/>
    <path d="M0 -24 C30 -44 74 -42 116 -14 C86 -20 64 -16 46 -3 C77 -8 98 5 120 35 C82 10 52 12 32 21 C60 21 78 35 92 62 C52 32 22 24 0 27 Z"/>
  </g>
  <path d="M0 -56 L15 -46 L15 18 L0 34 L-15 18 L-15 -46 Z" fill="#0f0f10" stroke="#f4f4f2" stroke-width="4"/>`;

function wallLines(){
  let s=''; const x0=30,x1=270; const rows=[70,105,140,175,210,245];
  for(let i=1;i<rows.length;i++) s+=`<line x1="${x0}" y1="${rows[i]}" x2="${x1}" y2="${rows[i]}"/>`;
  for(let r=0;r<rows.length-1;r++){ const off=(r%2)?30:0; for(let x=x0+off+30;x<x1;x+=60) s+=`<line x1="${x}" y1="${rows[r]}" x2="${x}" y2="${rows[r+1]}"/>`; }
  return s;
}

function buildScene(scene){
  if (scene==='colossal') return `
  <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="cgl" cx="50%" cy="55%" r="55%">
      <stop offset="0%" stop-color="#e24b4a" stop-opacity=".9"/>
      <stop offset="55%" stop-color="#7a1a1a" stop-opacity=".45"/>
      <stop offset="100%" stop-color="#7a1a1a" stop-opacity="0"/></radialGradient></defs>
    <ellipse class="glow" cx="150" cy="160" rx="145" ry="150" fill="url(#cgl)"/>
    <g fill="#f4dede" opacity=".7">
      <circle class="steam" style="animation-delay:0s" cx="95" cy="150" r="10"/>
      <circle class="steam" style="animation-delay:.6s" cx="150" cy="118" r="13"/>
      <circle class="steam" style="animation-delay:1.1s" cx="205" cy="150" r="10"/>
      <circle class="steam" style="animation-delay:1.7s" cx="125" cy="138" r="8"/>
      <circle class="steam" style="animation-delay:.35s" cx="182" cy="134" r="9"/>
    </g>
    <g class="rise">
      <path d="M45 300 C45 210 92 185 150 183 C208 185 255 210 255 300 Z" fill="#2b0b0b"/>
      <path d="M108 196 L150 132 L192 196 Z" fill="#2b0b0b"/>
      <circle cx="150" cy="112" r="42" fill="#2b0b0b"/>
      <g stroke="#5a1414" stroke-width="3" fill="none" opacity=".85">
        <path d="M80 250 C100 235 120 235 140 250"/><path d="M160 250 C180 235 200 235 220 250"/>
        <path d="M112 214 C132 206 150 206 150 206"/><path d="M150 206 C170 206 184 210 190 218"/>
      </g>
      <ellipse cx="135" cy="108" rx="8" ry="11" fill="#0a0303"/><ellipse cx="165" cy="108" rx="8" ry="11" fill="#0a0303"/>
      <ellipse class="flick" cx="135" cy="110" rx="3" ry="4" fill="#e24b4a"/><ellipse class="flick" cx="165" cy="110" rx="3" ry="4" fill="#e24b4a"/>
      <g fill="#cbb89a"><rect x="124" y="126" width="7" height="12" rx="1"/><rect x="133" y="126" width="7" height="13" rx="1"/><rect x="142" y="126" width="7" height="14" rx="1"/><rect x="151" y="126" width="7" height="13" rx="1"/><rect x="160" y="126" width="7" height="12" rx="1"/></g>
    </g>
  </svg>`;
  if (scene==='wall') return `
  <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <g class="rise">
      <rect x="30" y="70" width="240" height="200" rx="5" fill="#3a2f28"/>
      <g stroke="#241c17" stroke-width="3" stroke-linecap="round">${wallLines()}</g>
      <path d="M152 70 L142 112 L160 150 L146 200 L156 270" stroke="#e24b4a" stroke-width="4" fill="none" class="flick"/>
    </g>
    <g transform="translate(150 46) scale(.6)"><g class="pop">${WINGS_G}</g></g>
  </svg>`;
  // wings (freedom + title tap)
  return `
  <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="wgl" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#85B7EB" stop-opacity=".55"/>
      <stop offset="100%" stop-color="#85B7EB" stop-opacity="0"/></radialGradient></defs>
    <circle class="glow" cx="150" cy="150" r="145" fill="url(#wgl)"/>
    <g transform="translate(150 140)"><g class="spread">${WINGS_G}</g></g>
  </svg>`;
}

/* Drop your own images here to replace the drawn scenes.
   Put files in the assets/ folder. PNG with transparent background looks best;
   animated GIFs also work and will actually move. If a file is missing,
   it falls back to the built-in SVG art automatically. */
const SCENE_IMG = { colossal:'assets/colossal.png', wall:'assets/wall.png', wings:'assets/wings.png' };

function playEpic(opts){
  const ep=document.getElementById('epic'); if(!ep) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){ toast(opts.title); return; }
  const stage=document.getElementById('epic-stage');
  const animCls = opts.scene==='wings' ? 'spread' : 'rise';
  const imgSrc = SCENE_IMG[opts.scene];
  if (imgSrc){
    stage.innerHTML = `<div class="epic-glow"></div><img class="epic-img ${animCls}" alt="" src="${imgSrc}" onerror="this.closest('.epic-stage').innerHTML=buildScene('${opts.scene}')">`;
  } else {
    stage.innerHTML = buildScene(opts.scene);
  }
  document.getElementById('epic-text').innerHTML = `<div class="epic-title">${opts.title}</div>`+(opts.sub?`<div class="epic-sub">${opts.sub}</div>`:'');
  ep.className='epic scene-'+opts.scene;
  void ep.offsetWidth;
  ep.classList.add('play');
  clearTimeout(ep._t); ep._t=setTimeout(dismissEpic, opts.dur||3000);
}
function dismissEpic(){ const ep=document.getElementById('epic'); if(!ep||ep.classList.contains('hidden')) return; ep.classList.add('out'); setTimeout(()=>{ ep.className='epic hidden'; }, 420); }
function isFreedom(day){ const t=sumDay(day); return t.p>=DATA.goals.protein && t.kcal<=DATA.goals.kcal && t.kcal>0; }

/* ============================================================
   TODAY VIEW
   ============================================================ */
const MEAL_META={ breakfast:{ic:'coffee',label:'Breakfast'}, lunch:{ic:'bowl',label:'Lunch'}, dinner:{ic:'moon',label:'Dinner'}, snacks:{ic:'snack',label:'Snacks'} };
const GYM_TYPES=['push','pull','legs'];
const GYM_LABEL={ push:'Push', pull:'Pull', legs:'Legs', rest:'Rest', cardio:'Cardio' };
let viewDateKey = dayKey();

function renderToday(){
  const k=viewDateKey; const day=getDay(k); const d=new Date(k);
  const isToday = k===dayKey();
  const ds=$('#date-strip');
  const dateTxt = d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'});
  ds.classList.toggle('past', !isToday);
  ds.innerHTML = isToday
    ? `<span class="ds-ic" data-ic="calendar"></span>${dateTxt}`
    : `<span class="ds-ic" data-ic="left"></span>${dateTxt} · back to today`;
  renderIcons(ds);

  const streak=currentStreak(); const chip=$('#streak-chip');
  if (streak>0){ chip.innerHTML=`<span class="ds-ic" data-ic="flame"></span>${streak} · ${wallName(streak)}`; chip.style.display=''; renderIcons(chip); }
  else { chip.textContent='Start the fight'; chip.classList.add('cold'); chip.style.display=''; }
  chip.classList.toggle('cold', streak===0);

  const t=sumDay(day); const g=DATA.goals;
  $('#kcal-val').textContent=r0(t.kcal); $('#kcal-goal').textContent='/ '+g.kcal;
  $('#protein-val').textContent=r0(t.p); $('#protein-goal').textContent='/ '+g.protein+'g';
  setRing('#ring-kcal', t.kcal/g.kcal);
  setRing('#ring-protein', t.p/g.protein);

  const remK=g.kcal-t.kcal, remP=g.protein-t.p;
  const banner=$('#remaining-banner');
  const freedom = remP<=0 && remK>=0 && t.kcal>0;   // protein hit, calories on target
  banner.classList.toggle('over', remK<0);
  banner.classList.toggle('freedom', freedom);
  if (freedom){
    $('#remaining-label').textContent='Freedom';
    $('#remaining-val').textContent=`Protein hit · ${r0(remK)} kcal to spare`;
  } else {
    $('#remaining-label').textContent = remK<0 ? 'The Rumbling has begun' : 'Left for today';
    $('#remaining-val').textContent = remK>=0
      ? `${r0(remK)} kcal · ${r0(Math.max(remP,0))}g protein`
      : `${r0(-remK)} kcal over · ${r0(Math.max(remP,0))}g protein to go`;
  }

  $('#macro-strip').innerHTML =
    `<div class="macro-pill mp-p"><div class="v">${r0(t.p)}g</div><div class="k">protein</div></div>
     <div class="macro-pill mp-carb"><div class="v">${r0(t.c)}g</div><div class="k">carbs</div></div>
     <div class="macro-pill mp-fat"><div class="v">${r0(t.f)}g</div><div class="k">fat</div></div>`;

  const list=$('#meal-list'); list.innerHTML='';
  for (const slot of ['breakfast','lunch','dinner','snacks']){
    const items=day.meals[slot]; const meta=MEAL_META[slot]; const m=sumMeal(items);
    const el=document.createElement('div');
    if (items.length){
      el.className='meal';
      el.innerHTML=`<span class="meal-ic" data-ic="${meta.ic}"></span>
        <div class="meal-body"><div class="meal-name">${meta.label}</div>
        <div class="meal-desc">${items.map(i=>i.name).join(', ')}</div></div>
        <div class="meal-macros"><div class="meal-kcal">${r0(m.kcal)}</div><div class="meal-p">${r0(m.p)}g P</div></div>`;
      el.onclick=()=>openSheet(slot);
    } else {
      el.className='meal empty';
      const emptyDesc = slot==='snacks' ? 'The basement holds the truth — tap to add' : 'Not logged — tap to add';
      el.innerHTML=`<span class="meal-ic" data-ic="${meta.ic}"></span>
        <div class="meal-body"><div class="meal-name">${meta.label}</div>
        <div class="meal-desc">${emptyDesc}</div></div>
        <span class="meal-add" data-ic="plus"></span>`;
      el.onclick=()=>openSheet(slot);
    }
    list.appendChild(el);
  }

  const gymRow=$('#gym-row'); gymRow.innerHTML='';
  for (const gt of GYM_TYPES){
    const b=document.createElement('button');
    b.className='gym-chip'+(day.gym===gt?' sel':''); b.dataset.g=gt;
    b.textContent=GYM_LABEL[gt];
    b.onclick=()=>{
      if (day.gym===gt){ day.gym=null; save(); renderToday(); return; }
      const beforeStreak=currentStreak();
      day.gym=gt; save();
      const ms=crossedMilestone(beforeStreak,currentStreak());
      renderToday();
      if (ms) playEpic({scene:'wall', title:ms}); else toast(pick(SASAGEYO));
    };
    gymRow.appendChild(b);
  }
  $('#gym-hint').textContent = day.gym ? '' : 'tap what you did';
  renderIcons(list); renderIcons($('#macro-strip'));
}
function setRing(sel,frac){ const C=2*Math.PI*18.5; const f=Math.max(0,Math.min(frac,1)); $(sel).style.strokeDasharray=`${(f*C).toFixed(1)} ${C.toFixed(1)}`; }

/* ============================================================
   ADD-MEAL SHEET
   ============================================================ */
let currentSlot='breakfast';
let currentItems=[];
let photoDataUrl=null;

function openSheet(slot){
  currentSlot=slot||autoSlot(); currentItems=[]; photoDataUrl=null;
  $('#food-input').value=''; $('#analysis-result').classList.add('hidden');
  $('#photo-preview').hidden=true; $('#photo-placeholder').hidden=false;
  switchTab('text'); renderSlotRow(); renderQuickAdds();
  $('#sheet-backdrop').classList.remove('hidden');
  renderIcons($('#add-sheet'));
}
function autoSlot(){ const h=new Date().getHours(); if(h<11)return'breakfast'; if(h<16)return'lunch'; if(h<21)return'dinner'; return'snacks'; }
function closeSheet(){ $('#sheet-backdrop').classList.add('hidden'); }
function renderSlotRow(){
  const row=$('#meal-slot-row'); row.innerHTML='';
  for (const s of ['breakfast','lunch','dinner','snacks']){
    const b=document.createElement('button');
    b.className='slot-chip'+(s===currentSlot?' sel':''); b.textContent=MEAL_META[s].label;
    b.onclick=()=>{ currentSlot=s; renderSlotRow(); $('#save-slot-name').textContent=MEAL_META[s].label.toLowerCase(); };
    row.appendChild(b);
  }
  $('#save-slot-name').textContent=MEAL_META[currentSlot].label.toLowerCase();
}
const QUICK=['500ml milk','40g protein powder','100g muesli','2 roti','200g chicken roast','1 chicken leg','2 eggs','300g biriyani'];
function renderQuickAdds(){
  const q=$('#quick-adds'); q.innerHTML='';
  const mine = (DATA.myFoods||[]).map(f=>({ text:`${f.amt}${f.unit} ${f.name}`, mine:true }));
  const chips = [...mine, ...QUICK.map(s=>({text:s}))];
  for (const s of chips){ const c=document.createElement('button'); c.className='quick-chip'+(s.mine?' mine':''); c.textContent=s.text;
    c.onclick=()=>{ const inp=$('#food-input'); inp.value = inp.value ? inp.value+' + '+s.text : s.text; }; q.appendChild(c); }
}
/* ---------- My foods (custom, skip the AI) ---------- */
let mfEditId=null;
function renderMyFoods(){
  const box=$('#myfoods-list'); if(!box) return; box.innerHTML='';
  const list=DATA.myFoods||[];
  if(!list.length){ box.innerHTML='<div class="mf-empty">None yet — add one below to log it instantly.</div>'; return; }
  for(const f of list){
    const el=document.createElement('div'); el.className='mf-item';
    el.innerHTML=`<div class="mf-info"><div class="mf-name">${f.name}</div>
      <div class="mf-sub">${r0(f.amt)}${f.unit} · ${r0(f.kcal)} kcal · ${r0(f.protein)}g P</div></div>
      <button class="icon-btn mf-edit" aria-label="Edit"><i data-ic="edit"></i></button>
      <button class="icon-btn mf-del" aria-label="Delete"><i data-ic="x"></i></button>`;
    el.querySelector('.mf-edit').onclick=()=>loadMyFoodForm(f);
    el.querySelector('.mf-del').onclick=()=>{ DATA.myFoods=DATA.myFoods.filter(x=>x.id!==f.id); save(); renderMyFoods(); renderQuickAdds(); toast('Removed '+f.name); };
    box.appendChild(el);
  }
  renderIcons(box);
}
function loadMyFoodForm(f){
  mfEditId=f.id;
  $('#mf-name').value=f.name; $('#mf-amt').value=f.amt; $('#mf-unit').value=f.unit;
  $('#mf-kcal').value=f.kcal; $('#mf-protein').value=f.protein;
  $('#mf-add-label').textContent='Update food';
  $('#mf-name').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function resetMyFoodForm(){
  mfEditId=null;
  ['mf-name','mf-amt','mf-kcal','mf-protein'].forEach(id=>{ const el=$('#'+id); if(el) el.value=''; });
  const u=$('#mf-unit'); if(u) u.value='g';
  const l=$('#mf-add-label'); if(l) l.textContent='Save food';
}

function switchTab(name){
  $$('.input-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  $('#tab-text').classList.toggle('hidden', name!=='text');
  $('#tab-photo').classList.toggle('hidden', name!=='photo');
}

async function runAnalyze(input){
  const btnIds=['#btn-analyze-text','#btn-analyze-photo'];
  btnIds.forEach(id=>{ const b=$(id); if(b){ b._html=b.innerHTML; b.innerHTML='Analyzing…'; b.disabled=true; }});
  const res=await analyze(input);
  btnIds.forEach(id=>{ const b=$(id); if(b&&b._html){ b.innerHTML=b._html; b.disabled=false; }});
  currentItems=res.items;
  $('#result-hint').innerHTML=`<span data-ic="sparkles"></span>${res.hint}`;
  renderDetected();
  $('#analysis-result').classList.remove('hidden');
  renderIcons($('#analysis-result'));
  $('#analysis-result').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function renderDetected(){
  const box=$('#detected-items'); box.innerHTML='';
  currentItems.forEach((it,idx)=>{
    const step = it.unit==='pc'?1:(it.unit==='ml'?50:10);
    const el=document.createElement('div'); el.className='det-item';
    el.innerHTML=`
      <div class="det-top">
        <input class="det-name" value="${it.name}" />
        <button class="det-remove" data-ic="x"></button>
      </div>
      <div class="qty-row">
        <div class="qty-stepper">
          <button class="q-minus">−</button>
          <input class="qty-num" value="${r0(it.qty)}" inputmode="decimal" />
          <button class="q-plus">+</button>
        </div>
        <span class="qty-unit">${it.unit}</span>
        <span class="det-kcal"></span>
      </div>`;
    const nameI=el.querySelector('.det-name'); const qtyI=el.querySelector('.qty-num'); const kc=el.querySelector('.det-kcal');
    const upd=()=>{ const m=macrosFor(it.food,it.qty); kc.textContent=`${r0(m.kcal)} kcal · ${r0(m.p)}g P`; };
    nameI.oninput=()=>{ it.name=nameI.value; it.food=findFood(it.name)||it.food; upd(); updSummary(); };
    qtyI.oninput=()=>{ it.qty=parseFloat(qtyI.value)||0; upd(); updSummary(); };
    el.querySelector('.q-minus').onclick=()=>{ it.qty=Math.max(0,it.qty-step); qtyI.value=r0(it.qty); upd(); updSummary(); };
    el.querySelector('.q-plus').onclick=()=>{ it.qty+=step; qtyI.value=r0(it.qty); upd(); updSummary(); };
    el.querySelector('.det-remove').onclick=()=>{ currentItems.splice(idx,1); renderDetected(); updSummary(); };
    upd(); box.appendChild(el);
  });
  renderIcons(box); updSummary();
}
function updSummary(){
  const t=sumMeal(currentItems);
  $('#macro-summary').innerHTML=`
    <div class="ms-top"><span class="ms-kcal">${r0(t.kcal)}</span><span class="ms-kcal-l">kcal for this meal</span></div>
    <div class="ms-grid">
      <div class="macro-pill mp-p"><div class="v">${r0(t.p)}g</div><div class="k">protein</div></div>
      <div class="macro-pill mp-carb"><div class="v">${r0(t.c)}g</div><div class="k">carbs</div></div>
      <div class="macro-pill mp-fat"><div class="v">${r0(t.f)}g</div><div class="k">fat</div></div>
    </div>`;
}

/* ============================================================
   CALENDAR VIEW
   ============================================================ */
let calYear, calMonth, calWeek=0;
function initCal(){ const n=new Date(); calYear=n.getFullYear(); calMonth=n.getMonth(); calWeek=weekOfMonth(n); }
function weekOfMonth(d){ return Math.floor((d.getDate()-1)/7); }
function weeksInMonth(y,m){ return Math.ceil(new Date(y,m+1,0).getDate()/7); }

function renderCalendar(){
  $('#month-title').textContent=new Date(calYear,calMonth,1).toLocaleDateString(undefined,{month:'long',year:'numeric'});

  // month workout tally by split
  const mCount={push:0,pull:0,legs:0}; let mTotal=0;
  const dim=new Date(calYear,calMonth+1,0).getDate();
  for(let dn=1; dn<=dim; dn++){ const g=(DATA.days[dayKey(new Date(calYear,calMonth,dn))]||{}).gym; if(g&&mCount[g]!=null){ mCount[g]++; mTotal++; } }
  const mName=new Date(calYear,calMonth,1).toLocaleDateString(undefined,{month:'long'});
  $('#month-stat').innerHTML=`<div class="ms-big">${mTotal}<small> workout${mTotal===1?'':'s'} in ${mName}</small></div>
    <div class="ms-split">
      <span class="ms-tag push">${mCount.push} Push</span>
      <span class="ms-tag pull">${mCount.pull} Pull</span>
      <span class="ms-tag legs">${mCount.legs} Legs</span>
    </div>`;
  const nWeeks=weeksInMonth(calYear,calMonth);
  if (calWeek>=nWeeks) calWeek=nWeeks-1;
  const tabs=$('#week-tabs'); tabs.innerHTML='';
  for (let w=0; w<nWeeks; w++){ const b=document.createElement('button'); b.className='week-tab'+(w===calWeek?' sel':''); b.textContent='W'+(w+1);
    b.onclick=()=>{ calWeek=w; renderCalendar(); }; tabs.appendChild(b); }

  const daysInM=new Date(calYear,calMonth+1,0).getDate();
  const start=calWeek*7+1, end=Math.min(start+6,daysInM);
  const grid=$('#day-grid'); grid.innerHTML='';
  const todayK=dayKey(); const agg={kcal:[],p:[],gym:0};
  for (let dnum=start; dnum<=end; dnum++){
    const dObj=new Date(calYear,calMonth,dnum); const k=dayKey(dObj);
    const has=DATA.days[k]; const t=has?sumDay(has):null; const gym=has?has.gym:null;
    const el=document.createElement('div'); el.className='day-block';
    const isFuture=dObj>new Date(new Date().setHours(23,59,59,999));
    if (k===todayK) el.classList.add('today'); else if (isFuture && !has) el.classList.add('future');
    if (gym && gym!=='rest') el.dataset.g=gym;
    const wd=dObj.toLocaleDateString(undefined,{weekday:'short'});
    const gymLabel = gym ? GYM_LABEL[gym] : (has ? 'Recon' : (isFuture?'—':'·'));
    const stats = t && t.kcal>0 ? `${r0(t.kcal)} · ${r0(t.p)}g` : (isFuture?'planned':'no log');
    el.innerHTML=`<div class="db-date">${wd} ${dnum}${k===todayK?' · today':''}</div>
      <div class="db-gym">${gymLabel}</div><div class="db-stats">${stats}</div>`;
    el.onclick=()=>{ viewDateKey=k; showView('today'); renderToday(); };
    grid.appendChild(el);
    if (t && t.kcal>0){ agg.kcal.push(t.kcal); agg.p.push(t.p); }
    if (gym && gym!=='rest') agg.gym++;
  }
  const avg=a=>a.length?r0(a.reduce((x,y)=>x+y,0)/a.length):0;
  const recap = agg.gym>=5?' · Full deployment 🫡':(agg.gym>=3?' · Survey Corps active':'');
  $('#week-summary-label').textContent=`Week ${calWeek+1} average (${agg.kcal.length} logged days)${recap}`;
  $('#week-summary-stats').innerHTML=
    `<div class="wss">${avg(agg.kcal)}<small> kcal</small></div>
     <div class="wss">${avg(agg.p)}<small> g P</small></div>
     <div class="wss">${agg.gym}<small> gym days</small></div>`;
}

/* ============================================================
   NAV + WIRING
   ============================================================ */
function showView(name){
  $('#view-today').classList.toggle('hidden', name!=='today');
  $('#view-calendar').classList.toggle('hidden', name!=='calendar');
  if (name==='calendar') renderCalendar();
  window.scrollTo(0,0);
}

function wire(){
  renderIcons();
  $('#btn-calendar').onclick=()=>showView('calendar');
  $('#cal-back').onclick=()=>{ viewDateKey=dayKey(); renderToday(); showView('today'); };
  $('#date-strip').onclick=()=>{ if(viewDateKey!==dayKey()){ viewDateKey=dayKey(); renderToday(); } };
  // easter egg: tap the title 3× for a quote
  let tapN=0, tapT;
  $('#brand-title').onclick=()=>{ tapN++; clearTimeout(tapT); tapT=setTimeout(()=>tapN=0,700); if(tapN>=3){ tapN=0; playEpic({scene:'wings', title:pick(TITLE_QUOTES), dur:2600}); } };
  $('#epic').onclick=dismissEpic;
  $('#sheet-close').onclick=closeSheet;
  $('#sheet-backdrop').onclick=e=>{ if(e.target.id==='sheet-backdrop') closeSheet(); };
  $$('.input-tab').forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));
  $('#btn-analyze-text').onclick=()=>{ const v=$('#food-input').value.trim(); if(!v){ toast('Type what you ate first'); return; } runAnalyze({type:'text',text:v}); };
  $('#btn-analyze-photo').onclick=()=>{ if(!photoDataUrl){ toast('Add a photo first'); return; } runAnalyze({type:'photo',dataUrl:photoDataUrl}); };
  $('#photo-file').onchange=e=>{ const f=e.target.files[0]; if(!f)return; const rd=new FileReader(); rd.onload=()=>{ photoDataUrl=rd.result; const img=$('#photo-preview'); img.src=rd.result; img.hidden=false; $('#photo-placeholder').hidden=true; }; rd.readAsDataURL(f); };
  $('#btn-add-item').onclick=()=>{ currentItems.push({name:'Item',qty:100,unit:'g',food:null}); renderDetected(); if($('#analysis-result').classList.contains('hidden')){ $('#analysis-result').classList.remove('hidden'); $('#result-hint').innerHTML='Add items manually:'; } };
  $('#btn-save-meal').onclick=()=>{
    if(!currentItems.length){ toast('Nothing to add'); return; }
    const day=getDay(viewDateKey);
    const mealKcal=sumMeal(currentItems).kcal;
    const beforeP=sumDay(day).p, beforeStreak=currentStreak(), freedomBefore=isFreedom(day);
    day.meals[currentSlot].push(...currentItems.map(i=>({name:i.name,qty:i.qty,unit:i.unit,food:i.food})));
    save();
    const afterP=sumDay(day).p, afterStreak=currentStreak(), freedomAfter=isFreedom(day);
    closeSheet(); renderToday();
    const ms=crossedMilestone(beforeStreak,afterStreak);
    if (mealKcal>1500) playEpic({scene:'colossal', title:'The Colossal Titan appeared', sub:r0(mealKcal)+' kcal in one meal'});
    else if (ms) playEpic({scene:'wall', title:ms});
    else if (!freedomBefore && freedomAfter) playEpic({scene:'wings', title:'Freedom', sub:'Protein hit. Calories on target.'});
    else if (beforeP<DATA.goals.protein && afterP>=DATA.goals.protein) toast(pick(GOAL_HIT));
    else toast('Added to '+MEAL_META[currentSlot].label.toLowerCase());
  };

  // settings
  $('#btn-settings').onclick=()=>{ $('#goal-kcal').value=DATA.goals.kcal; $('#goal-protein').value=DATA.goals.protein; resetMyFoodForm(); renderMyFoods(); $('#settings-backdrop').classList.remove('hidden'); renderIcons($('#settings-backdrop')); };
  $('#mf-add').onclick=()=>{
    const name=$('#mf-name').value.trim();
    const amt=+$('#mf-amt').value, kcal=+$('#mf-kcal').value, protein=+$('#mf-protein').value;
    if(!name || !amt || amt<=0){ toast('Enter a name and amount'); return; }
    const entry={ id: mfEditId||('f'+Date.now()), name, unit:$('#mf-unit').value, amt, kcal:kcal||0, protein:protein||0, carbs:0, fat:0 };
    if(mfEditId){ DATA.myFoods=DATA.myFoods.map(x=>x.id===mfEditId?entry:x); } else { DATA.myFoods.push(entry); }
    save(); resetMyFoodForm(); renderMyFoods(); renderQuickAdds(); toast('Saved '+name);
  };
  $('#settings-close').onclick=()=>$('#settings-backdrop').classList.add('hidden');
  $('#settings-backdrop').onclick=e=>{ if(e.target.id==='settings-backdrop') $('#settings-backdrop').classList.add('hidden'); };
  $('#btn-save-goals').onclick=()=>{ DATA.goals.kcal=parseInt($('#goal-kcal').value)||2350; DATA.goals.protein=parseInt($('#goal-protein').value)||150; save(); renderToday(); toast('Goals saved'); $('#settings-backdrop').classList.add('hidden'); };
  $('#btn-theme').onclick=()=>{ DATA.theme = DATA.theme==='yeagerist'?null:'yeagerist'; save(); applyTheme(); if(DATA.theme) toast('Yeagerists rise. 🩸'); };
  $('#btn-load-demo').onclick=()=>{ loadDemo(); save(); renderToday(); renderCalendar(); toast('Sample week loaded'); $('#settings-backdrop').classList.add('hidden'); showView('calendar'); };
  $('#btn-export').onclick=()=>{ const blob=new Blob([JSON.stringify(DATA,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='macro-tracker-backup-'+dayKey()+'.json'; a.click(); toast('Backup downloaded'); };
  $('#btn-clear').onclick=()=>{ if(confirm('Tatakae… this erases everything, forever. Continue?')){ DATA=structuredClone(DEFAULT); save(); renderToday(); toast('The Rumbling passed. All data cleared.'); $('#settings-backdrop').classList.add('hidden'); } };
}

/* seed a realistic current week so the calendar isn't empty on first look */
function loadDemo(){
  const plan=['push','pull','legs',null,'push','pull','legs']; // rest days = no gym logged
  const now=new Date(); const monday=new Date(now); monday.setDate(now.getDate()-((now.getDay()+6)%7));
  plan.forEach((gym,i)=>{ const d=new Date(monday); d.setDate(monday.getDate()+i); if(d>now) return; const day=getDay(dayKey(d)); day.gym=gym;
    // one representative breakfast that roughly hits the targets
    day.meals.breakfast=[{name:'Muesli',qty:100,unit:'g',food:findFood('muesli')},{name:'Milk',qty:500,unit:'ml',food:findFood('milk')}];
    day.meals.lunch=[{name:'Biriyani',qty:300,unit:'g',food:findFood('biriyani')},{name:'Chicken leg',qty:1,unit:'pc',food:findFood('chicken leg')}];
    day.meals.dinner=[{name:'Roti',qty:3,unit:'pc',food:findFood('roti')},{name:'Chicken roast',qty:200,unit:'g',food:findFood('chicken roast')}];
  });
}

function applyTheme(){
  if (DATA.theme==='yeagerist') document.body.setAttribute('data-theme','yeagerist');
  else document.body.removeAttribute('data-theme');
  const lbl=$('#theme-label'); if(lbl) lbl.textContent='Yeagerist mode: '+(DATA.theme==='yeagerist'?'on':'off');
}

/* ---------- boot ---------- */
initCal(); wire(); applyTheme(); renderToday();
if ('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
