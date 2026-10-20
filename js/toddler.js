// Idris Play — toddler helpers for every game (made for 2-year-olds):
//  • a sparkle under the finger on every touch, so every tap does something;
//  • a dino helper that peeks in after a few quiet seconds and points at what to tap;
//  • a big "spotlight" pop-out for Colours, Shapes and Animals, and counting out loud in Numbers.
(function(){
'use strict';
const { sfx, el, pick, later, GAMES } = window.IdrisPlay;

// ---------- ✨ finger sparkle ----------
document.addEventListener('pointerdown', e => {
  if(!document.body.classList.contains('in-game')) return;
  const s = el('div', 'td-touch');
  s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
  for(let i = 0; i < 4; i++){ const b = el('i', null, pick(['✨', '⭐', '💫', '💚'])); b.style.setProperty('--a', (i * 90 + Math.random() * 40) + 'deg'); s.appendChild(b); }
  document.body.appendChild(s); later(() => s.remove(), 700);
}, { passive: true, capture: true });

// ---------- 🦖 idle helper ----------
// Games can say exactly what to point at (the right answer); otherwise something tappable is picked.
const HINTS = {
  words: () => { const g = GAMES.words; return g?.word && [...g.tiles.querySelectorAll('.wb-tile:not(.used)')].find(t => t.textContent === g.word[g.filled]); },
  bigsmall: () => { const g = GAMES.bigsmall; return g?.L && [...g.choices.children].find(b => b.textContent === g.L.toLowerCase()); },
  sorting: () => { const g = GAMES.sorting; return g?.item && g.boxes.querySelector(`.so-box[data-color="${g.item.dataset.color}"]`); },
  lunch: () => { const g = GAMES.lunch; return g?.want && [...g.tray.children].find(b => b.textContent === g.want[0]); },
  music: () => document.querySelector('#sec-music .mu-key.next') || document.querySelector('#sec-music .mu-key'),
  rocket: () => document.querySelector('#sec-rocket .rk-go:not([style*="none"])') || document.querySelector('#sec-rocket .rk-pick') || document.querySelector('#sec-rocket .rk-home:not([style*="none"])'),
  eggs: () => document.querySelector('#sec-eggs .egg'),
  dig: () => document.querySelector('#sec-dig .dg-sand'),
  peekdino: () => document.querySelector('#sec-peekdino .pk-hole.up .pk-dino'),
  dinorun: () => document.querySelector('#sec-dinorun .dr-dino'),
  vehicles: () => pick([...document.querySelectorAll('#sec-vehicles .vh-btn')])
};
const SKIP = new Set(['draw', 'fireworks', 'home']);   // free play: no nudging
const LINES = ['Tap here!', 'Try this one!', 'Your turn!'];
const helper = el('div', 'td-helper', '<span class="td-dino">🦖</span><span class="td-hand">👆</span>');
document.body.appendChild(helper);
let lastTouch = Date.now(), shownAt = 0, glowEl = null;
const hide = () => { helper.classList.remove('show'); glowEl?.classList.remove('td-glow'); glowEl = null; };
document.addEventListener('pointerdown', () => { lastTouch = Date.now(); hide(); }, { passive: true, capture: true });

function visible(n){ if(!n || !n.isConnected) return false; const r = n.getBoundingClientRect(); return r.width > 10 && r.height > 10 && r.bottom > 60 && r.top < innerHeight && r.left < innerWidth && r.right > 0 && getComputedStyle(n).visibility !== 'hidden'; }
function pickTarget(id){
  let t = null;
  try{ t = HINTS[id]?.(); }catch(e){}
  if(visible(t)) return t;
  const sec = document.getElementById('sec-' + id); if(!sec) return null;
  const all = [...sec.querySelectorAll('.pulse, .next, .ng-btn, button, [onclick], .draggable, .peek-card, .fish, .popit-bubble:not(.popped), .mem-card:not(.matched)')].filter(visible);
  return all.length ? pick(all) : null;
}
setInterval(() => {
  const id = currentScreen;
  if(!document.body.classList.contains('in-game') || SKIP.has(id)) return;
  const now = Date.now();
  if(now - lastTouch < 9000 || now - shownAt < 16000) return;
  const t = pickTarget(id); if(!t) return;
  shownAt = now;
  const r = t.getBoundingClientRect();
  helper.style.setProperty('--x', Math.min(innerWidth - 60, Math.max(10, r.left + r.width / 2 - 20)) + 'px');
  helper.style.setProperty('--y', Math.min(innerHeight - 70, r.top + r.height / 2) + 'px');
  helper.classList.remove('show'); void helper.offsetWidth; helper.classList.add('show');
  glowEl = t; t.classList.add('td-glow');
  sfx.tone(660, 0.15, 'sine', 0.15, 880);
  speakNext(pick(LINES));
  later(() => { if(glowEl === t) hide(); }, 5000);
}, 1000);

// ---------- 🌟 spotlight: the tapped thing pops out big in the middle ----------
const spot = el('div', 'td-spot'); document.body.appendChild(spot);
let spotTimer = null;
function spotlight(html, bg){
  spot.innerHTML = `<div class="td-spot-card" style="${bg ? '--bg:' + bg : ''}">${html}</div>`;
  spot.classList.remove('show'); void spot.offsetWidth; spot.classList.add('show');
  clearTimeout(spotTimer); spotTimer = setTimeout(() => spot.classList.remove('show'), 1700);
}
window.spotlight = spotlight;

// Colours: a big paint blob with a dino
const _tapColor = window.tapColor;
window.tapColor = function(name, hex, e){
  _tapColor(name, hex, e);
  spotlight(`<div class="td-blob" style="background:${hex}"><span>🦖</span></div><b>${name}</b>`);
};
// Animals: the animal jumps out big
const _tapAnimal = window.tapAnimal;
window.tapAnimal = function(name, sound){
  _tapAnimal(name, sound);
  const a = animals.find(x => x.n === name);
  if(a) spotlight(`<div class="td-big td-hop">${a.e}</div><b>${name}</b>`);
};
// Shapes: the shape spins out big
const _tapShape = window.tapShape;
window.tapShape = function(name){
  _tapShape(name);
  const s = shapes.find(x => x.n === name);
  if(s) spotlight(`<div class="td-big td-spin" style="color:${s.c}">${s.e}</div><b>${name}</b>`);
};
// Numbers: things pop in one by one while we count out loud
const _setNum = window.setNum;
let countRun = 0;
window.setNum = function(n){
  _setNum(n);
  const run = ++countRun, item = numEmoji[n] || '⭐';
  spot.innerHTML = `<div class="td-spot-card td-count"><div class="td-items"></div><b>${n}</b></div>`;
  spot.classList.remove('show'); void spot.offsetWidth; spot.classList.add('show', 'stay');
  clearTimeout(spotTimer);
  const box = spot.querySelector('.td-items');
  for(let i = 1; i <= n; i++) later(() => {
    if(run !== countRun) return;
    box.appendChild(el('span', 'pop-in', item)); sfx.plink(i);
    speakNext(numWords[i]);
  }, 600 + i * 750);
  spotTimer = setTimeout(() => { if(run === countRun) spot.classList.remove('show', 'stay'); }, 1400 + n * 750 + 900);
};
document.addEventListener('pointerdown', e => { if(spot.classList.contains('stay') && !e.target.closest('#sec-numbers')){ countRun++; spot.classList.remove('show', 'stay'); } }, true);

window.toddlerPhrases = () => [...LINES];
})();
