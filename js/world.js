// Idris Play — the living home world:
//  • his own dino buddy (drawn in SVG): breathes, blinks, eyes follow his finger, giggles and jumps
//    when tickled, falls asleep when left alone, and grows bigger as he plays on more days;
//  • a home scene that answers every tap (sun/moon, clouds rain, coconuts drop, dinos roar, the
//    volcano puffs, flowers grow in the grass);
//  • day and night sky by the real clock;
//  • a dino runs across the screen when a game opens or he goes home.
(function(){
'use strict';
const { sfx, el, pick, rand, later, $ } = window.IdrisPlay;
const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

// ---------- 🦖 dino buddy ----------
const BUDDY_SVG = window.idrisBuddySVG;   // drawn in js/drawn.js
const mascot = document.getElementById('mascot');
mascot.innerHTML = BUDDY_SVG;
mascot.classList.add('buddy');
const svg = $('svg', mascot);
const pupils = [...svg.querySelectorAll('.bd-pupil')];

// Grows with the number of days he has played (from the play log in Parent Corner)
const SIZES = [['baby', 0], ['little', 3], ['big', 7]];
function growth(){
  const days = Object.values(store.get('usage', {})).filter(d => d.total >= 300).length + store.get('daysBefore', 0);
  return SIZES.filter(([, n]) => days >= n).pop()[0];
}
function applyGrowth(announce){
  const g = growth(), before = store.get('buddySize', 'baby');
  mascot.dataset.size = g;
  if(announce && g !== before){
    store.set('buddySize', g);
    later(() => { speak(`Look! I grew bigger!`); restart(mascot, 'grow'); burstConfetti(20); }, 1200);
  }
}
applyGrowth(true);

// eyes follow the finger
document.addEventListener('pointermove', e => lookAt(e.clientX, e.clientY), { passive: true });
document.addEventListener('pointerdown', e => lookAt(e.clientX, e.clientY), { passive: true });
function lookAt(x, y){
  if(currentScreen !== 'home') return;
  const r = svg.getBoundingClientRect(), cx = r.left + r.width * 0.68, cy = r.top + r.height * 0.32;
  const a = Math.atan2(y - cy, x - cx), d = Math.min(1, Math.hypot(x - cx, y - cy) / 200) * 4;
  pupils.forEach(p => p.setAttribute('transform', `translate(${(Math.cos(a) * d).toFixed(1)} ${(Math.sin(a) * d).toFixed(1)})`));
}
// blink now and then
setInterval(() => { if(!mascot.classList.contains('asleep') && Math.random() < 0.5) restart(mascot, 'blink'); }, 2600);
// fall asleep when left alone on the home screen; any touch wakes him
let quietSince = Date.now();
document.addEventListener('pointerdown', () => {
  quietSince = Date.now();
  if(mascot.classList.contains('asleep')){ mascot.classList.remove('asleep'); sfx.rise(); speak(pick(['Yawn! Hello again!', 'I was sleeping! Let us play!'])); }
}, { capture: true, passive: true });
setInterval(() => { if(currentScreen === 'home' && Date.now() - quietSince > 40000) mascot.classList.add('asleep'); }, 3000);
// tickle: giggle and jump (on top of the hello line mascotTap already says)
mascot.addEventListener('pointerdown', () => { restart(mascot, 'tickle'); sfx.giggle(); });

// ---------- 🌤️ a home world that answers every tap ----------
const scene = $('.home-scene');
scene.insertAdjacentHTML('beforeend', '<div class="hs-stars"></div><div class="hs-flowers"></div>');
const stars = $('.hs-stars', scene);
for(let i = 0; i < 40; i++){ const s = el('i'); Object.assign(s.style, { left: rand(0, 100) + '%', top: rand(0, 55) + '%', animationDelay: rand(0, 2) + 's' }); stars.appendChild(s); }
const flowers = $('.hs-flowers', scene);
const REACT = [
  ['.hs-sun', n => { restart(n, 'w-spin'); sfx.giggle(); speak(document.body.classList.contains('night') ? 'Hello, moon!' : 'Hello, sun!'); }],
  ['.hs-cloud', n => { rain(n); sfx.splash(); speak('Rain!'); }],
  ['.hs-palm', n => { restart(n, 'w-shake'); coconut(n); }],
  ['.hs-dino', n => { restart(n, 'w-jump'); sfx.rumble(0.4); sfx.tone(150, 0.4, 'sawtooth', 0.12, 80); speak('Roar!'); }],
  ['.hs-volcano', n => { restart(n, 'w-puff'); sfx.boom(); speak('Boom!'); for(let i = 0; i < 6; i++) later(() => spark(n), i * 80); }],
  ['.hs-bird', n => { restart(n, 'w-flap'); sfx.tone(1400, 0.1, 'sine', 0.15, 1900); later(() => sfx.tone(1500, 0.1, 'sine', 0.15, 2000), 140); }]
];
const inside = (n, x, y) => { const r = n.getBoundingClientRect(); return r.width && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
document.addEventListener('pointerdown', e => {
  if(currentScreen !== 'home' || document.body.classList.contains('in-game')) return;
  if(e.target.closest('button, a, input, select, .app-icon, .pp-backdrop, .launch-head')) return;
  const x = e.clientX, y = e.clientY;
  for(const [sel, fn] of REACT){
    const n = [...scene.querySelectorAll(sel)].find(m => inside(m, x, y));
    if(n){ fn(n); return; }
  }
  // empty grass grows a flower; empty sky gets a twinkle
  if(y > innerHeight * 0.72) grow(x, y); else twinkle(x, y);
}, { passive: true });
function rain(cloud){
  const r = cloud.getBoundingClientRect();
  for(let i = 0; i < 14; i++) later(() => {
    const d = el('i', 'w-drop'); d.style.left = (r.left + rand(10, r.width - 10)) + 'px'; d.style.top = (r.top + r.height * 0.6) + 'px';
    scene.appendChild(d); later(() => d.remove(), 1100);
  }, i * 60);
}
function coconut(palm){
  const r = palm.getBoundingClientRect(), c = el('div', 'w-coco', '🥥');
  c.style.left = (r.left + r.width * rand(.3, .6)) + 'px'; c.style.top = (r.top + r.height * 0.25) + 'px';
  c.style.setProperty('--fall', (innerHeight - r.top - r.height * 0.25 - 50) + 'px');
  scene.appendChild(c); later(() => { sfx.boing(); }, 600); later(() => c.remove(), 2200);
  speak('Coconut!');
}
function spark(v){
  const r = v.getBoundingClientRect(), s = el('div', 'w-spark', pick(['🔥', '✨', '💥']));
  s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top + r.height * 0.1) + 'px'; s.style.setProperty('--dx', rand(-120, 120) + 'px');
  scene.appendChild(s); later(() => s.remove(), 1200);
}
function grow(x, y){
  const f = el('div', 'w-flower', pick(['🌼', '🌸', '🌷', '🌻', '🍄', '🌺']));
  f.style.left = x + 'px'; f.style.top = y + 'px';
  flowers.appendChild(f); sfx.plink(Math.floor(rand(0, 7)));
  while(flowers.children.length > 25) flowers.firstChild.remove();
}
function twinkle(x, y){
  const t = el('div', 'w-twinkle', pick(['⭐', '✨', '💫', '🌟'])); t.style.left = x + 'px'; t.style.top = y + 'px';
  scene.appendChild(t); sfx.plink(Math.floor(rand(3, 7))); later(() => t.remove(), 1200);
}

// ---------- 🌙 day and night by the real clock ----------
function sky(){ const h = new Date().getHours(); document.body.classList.toggle('night', h >= 19 || h < 6); }
sky(); setInterval(sky, 60000);

// ---------- 🦖 a dino runs across when a game opens or he goes home ----------
const runner = el('div', 'w-runner', '<span>🦖</span>'); document.body.appendChild(runner);
function run(dir){ runner.className = 'w-runner'; void runner.offsetWidth; runner.classList.add('go', dir); sfx.whoosh(); }
const _launch = window.launchGame;
window.launchGame = function(id, node){ run('ltr'); return _launch(id, node); };
const _home = window.goHome;
window.goHome = function(){ if(currentScreen !== 'home') run('rtl'); return _home(); };

window.worldPhrases = () => ['Look! I grew bigger!', 'Yawn! Hello again!', 'I was sleeping! Let us play!', 'Hello, moon!', 'Hello, sun!', 'Rain!', 'Coconut!', 'Roar!', 'Boom!'];
})();
