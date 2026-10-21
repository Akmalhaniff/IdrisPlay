// Idris Play — Dino Island: the home screen as a map. Every game lives at a place on the island
// (Volcano, Jungle, Picnic, Beach, School, Music Stage, Space Pad, Art Corner, Number Hill). Tap a
// place: his buddy dino walks there along the path and the place's games open in a tray at the
// bottom. Parents can switch back to the plain game list in Parent Corner.
(function(){
'use strict';
const { sfx, el, later } = window.IdrisPlay;
const PLACES = [
  { id: 'volcano', name: 'Volcano', pic: '🌋', bg: '#FDBA74', x: 12, y: 30, games: ['dinorun', 'dig'] },
  { id: 'jungle', name: 'Jungle', pic: '🌴', bg: '#86EFAC', x: 30, y: 62, games: ['dinoworld', 'peekdino', 'eggs', 'animals', 'peekaboo'] },
  { id: 'picnic', name: 'Picnic', pic: '🧺', bg: '#FDE68A', x: 46, y: 28, games: ['lunch', 'feeding', 'garden'] },
  { id: 'beach', name: 'Beach', pic: '🏖️', bg: '#A5F3FC', x: 62, y: 66, games: ['bath', 'bubbles', 'fishing', 'popit'] },
  { id: 'school', name: 'School', pic: '🏫', bg: '#C4B5FD', x: 78, y: 30, games: ['abc', 'trace', 'words', 'bigsmall', 'clap', 'paint', 'seek'] },
  { id: 'stage', name: 'Music Stage', pic: '🎪', bg: '#F9A8D4', x: 94, y: 64, games: ['music', 'faces'] },
  { id: 'space', name: 'Space Pad', pic: '🚀', bg: '#A5B4FC', x: 110, y: 28, games: ['rocket', 'fireworks', 'vehicles'] },
  { id: 'art', name: 'Art Corner', pic: '🎨', bg: '#FBCFE8', x: 126, y: 64, games: ['draw', 'colors', 'shapes'] },
  { id: 'hill', name: 'Number Hill', pic: '🔢', bg: '#BBF7D0', x: 142, y: 30, games: ['numbers', 'count', 'sorting', 'puzzle', 'memory'] }
];
const WIDTH = 158;   // the island is this many % of the screen wide (it scrolls sideways)
const isIsland = () => store.get('homeStyle', 'island') === 'island';
window.idrisIslandPlaces = PLACES;

const home = document.getElementById('sec-home'), grid = document.getElementById('homeGrid');
const map = el('div', 'isl', `<div class="isl-scroll"><div class="isl-world" style="width:${WIDTH}%">
    <div class="isl-sea"></div><div class="isl-land"></div><svg class="isl-path" preserveAspectRatio="none"></svg>
    <div class="isl-walker"></div>
  </div></div>
  <div class="isl-tray"><div class="isl-tray-head"><span class="isl-tray-pic"></span><b></b><button class="isl-close" aria-label="Close">✕</button></div><div class="isl-games"></div></div>`);
home.insertBefore(map, grid);
const world = map.querySelector('.isl-world'), scroller = map.querySelector('.isl-scroll'), walker = map.querySelector('.isl-walker');
const tray = map.querySelector('.isl-tray'), trayGames = map.querySelector('.isl-games');
walker.innerHTML = window.idrisBuddySVG;

// places and the dotted path between them
PLACES.forEach((p, i) => {
  const b = el('button', 'isl-place', `<span class="isl-pic">${p.pic}</span><span class="isl-name">${p.name}</span>`);
  b.style.left = (p.x / WIDTH * 100) + '%'; b.style.top = p.y + '%'; b.style.setProperty('--bg', p.bg); b.style.setProperty('--i', i);
  b.dataset.place = p.id;
  b.addEventListener('click', () => go(p, b));
  world.appendChild(b);
});
function drawPath(){
  const svg = map.querySelector('.isl-path'), w = world.offsetWidth, h = world.offsetHeight;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const pts = PLACES.map(p => [p.x / WIDTH * w, p.y / 100 * h + 40]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for(let i = 1; i < pts.length; i++){ const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` C${(x0 + x1) / 2} ${y0} ${(x0 + x1) / 2} ${y1} ${x1} ${y1}`; }
  svg.innerHTML = `<path d="${d}" fill="none" stroke="#FFF7E6" stroke-width="14" stroke-linecap="round" stroke-dasharray="2 22" opacity=".95"/>`;
}

// the buddy walks to the place, then its games open in the tray
let here = store.get('islandAt', 'volcano');
function placeWalker(p, instant){
  const node = world.querySelector(`[data-place="${p.id}"]`); if(!node) return;
  walker.classList.toggle('instant', !!instant);
  walker.style.left = `calc(${p.x / WIDTH * 100}% - 20px)`; walker.style.top = `calc(${p.y}% - 30px)`;
  if(!instant) walker.classList.toggle('flip', p.x < (PLACES.find(q => q.id === here) || p).x);
}
function go(p, node){
  sfx.pop();
  const far = p.id !== here;
  placeWalker(p, false); here = p.id; store.set('islandAt', p.id);
  if(far){ walker.classList.add('walking'); sfx.tone(300, 0.12, 'sine', 0.12, 420); later(() => sfx.tone(320, 0.12, 'sine', 0.12, 440), 300); }
  later(() => { walker.classList.remove('walking'); open(p); }, far ? 900 : 50);
  node.classList.remove('picked'); void node.offsetWidth; node.classList.add('picked');
}
function open(p){
  tray.querySelector('.isl-tray-pic').textContent = p.pic;
  tray.querySelector('b').textContent = p.name;
  trayGames.innerHTML = '';
  p.games.forEach(id => { const icon = grid.querySelector(`.app-icon[data-game="${id}"]`); if(icon) trayGames.appendChild(icon.cloneNode(true)); });
  tray.classList.add('open');
  speak(p.name + '!');
}
tray.querySelector('.isl-close').addEventListener('click', () => { tray.classList.remove('open'); sfx.pop(); });

// keep the game list (hidden) as the source of icons; show the map or the list
const _renderHome = window.renderHome;
window.renderHome = function(){
  _renderHome();
  const on = isIsland();
  home.classList.toggle('island-home', on);
  if(on && tray.classList.contains('open')){ const p = PLACES.find(q => q.id === here); if(p) open(p); }
};
// every game must belong somewhere: anything new goes to the nearest fitting place
function placeOrphans(){
  const placed = new Set(PLACES.flatMap(p => p.games));
  homeGames.forEach(h => { if(!placed.has(h.id)) PLACES[PLACES.length - 1].games.push(h.id); });
}
placeOrphans();
window.renderHome();
later(() => { drawPath(); placeWalker(PLACES.find(q => q.id === here) || PLACES[0], true); }, 100);
window.addEventListener('resize', () => later(drawPath, 100));
// close the tray when a game opens; reopen it when coming home
const _switchTab = window.switchTab;
window.switchTab = function(name){ _switchTab(name); if(name === 'home') later(drawPath, 50); };

// Parent Corner switch
const box = document.querySelector('#parentPanel .pt-box') || document.querySelector('#parentPanel .pp-card');
const row = el('label', 'pp-row', `<span>🏝️ Home screen</span><select id="ptHome"><option value="island">Dino Island map</option><option value="list">Game list</option></select>`);
box.insertBefore(row, box.firstChild);
const sel = row.querySelector('select');
sel.addEventListener('change', () => { store.set('homeStyle', sel.value); window.renderHome(); later(drawPath, 50); });
const _openParent = window.openParent;
window.openParent = function(){ _openParent(); sel.value = store.get('homeStyle', 'island'); };

window.islandPhrases = () => PLACES.map(p => p.name + '!');
})();
