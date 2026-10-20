// Idris Play — Dino World: one wide jungle where twelve real dinosaurs live (drawn in js/species.js).
// Swipe (or tap the arrows) to walk through it; tap a dinosaur and it roars, stomps, flaps or splashes,
// says its name, and a little name tag pops up above it. Like the Animals page, but for dinosaurs.
(function(){
'use strict';
const { addGame, sfx, sparkleAt, el, pick, later, $ } = window.IdrisPlay;
const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
const SPECIES = window.idrisSpecies;
const START = 'Dino world! Tap a dinosaur to say hello!';
const SOUNDS = {
  roar: () => { sfx.rumble(0.7); sfx.tone(150, 0.7, 'sawtooth', 0.18, 70); },
  stomp: () => { sfx.boom(); later(() => sfx.boom(), 260); },
  wag: () => { sfx.boing(); later(() => sfx.boing(), 200); },
  stretch: () => sfx.rise(),
  sway: () => [0, 1, 2, 3].forEach(i => later(() => sfx.plink(i + 2), i * 140)),
  thump: () => { sfx.boom(); sfx.crack(); },
  honk: () => { sfx.tone(240, 0.6, 'square', 0.12, 330); later(() => sfx.tone(240, 0.5, 'square', 0.12, 300), 300); },
  bonk: () => { sfx.crack(); later(() => sfx.boing(), 120); },
  zoom: () => sfx.whoosh(),
  flap: () => { sfx.whoosh(); later(() => sfx.whoosh(), 300); },
  swim: () => { sfx.splash(); later(() => sfx.splash(), 250); }
};
// where each one stands: x in px along the world, y as % from the bottom (sky and sea are special)
const STEP = 300;

addGame({
  id: 'dinoworld', e: '🦕', n: 'Dino World', colors: ['#A7F3D0', '#34D399', '#047857'], stageClass: 'dw-stage', cat: 'dino',
  html: `<div class="dw-scroll"><div class="dw-world">
      <div class="dw-mountains"></div><div class="dw-volcano"><b></b></div><div class="dw-ground"></div><div class="dw-lake"></div>
    </div></div>
    <button class="ng-btn dw-arrow l" aria-label="Back">◀</button><button class="ng-btn dw-arrow r" aria-label="More">▶</button>`,
  init(root){
    this.scroll = $('.dw-scroll', root); this.world = $('.dw-world', root);
    const land = SPECIES.filter(s => s.where === 'land'), sky = SPECIES.filter(s => s.where === 'sky'), sea = SPECIES.filter(s => s.where === 'sea');
    const width = 120 + land.length * STEP + 520;
    this.world.style.width = width + 'px';
    $('.dw-lake', root).style.left = (width - 480) + 'px';
    $('.dw-volcano', root).style.left = (land.length * STEP * 0.45) + 'px';
    land.forEach((s, i) => this.place(s, 80 + i * STEP, i % 2 ? 'low' : 'high'));
    sky.forEach((s, i) => this.place(s, 500 + i * 1400, 'sky'));
    sea.forEach(s => this.place(s, width - 400, 'sea'));
    // a few bushes and flowers so the world feels alive
    for(let x = 200; x < width - 500; x += 260){ const b = el('div', 'dw-bush'); b.style.left = x + 'px'; this.world.appendChild(b); }
    root.querySelector('.dw-arrow.l').addEventListener('click', () => this.go(-1));
    root.querySelector('.dw-arrow.r').addEventListener('click', () => this.go(1));
  },
  place(s, x, where){
    const d = el('button', 'dw-dino ' + where + (s.tall ? ' tall' : ''), `${window.idrisSpeciesSVG(s)}<span class="dw-tag">${s.name}</span>`);
    d.style.left = x + 'px'; d.dataset.act = s.act; d.setAttribute('aria-label', s.name);
    d.addEventListener('click', () => this.tap(s, d));
    this.world.appendChild(d);
  },
  tap(s, d){
    restart(d, 'act-' + s.act); restart(d, 'show-tag');
    clearTimeout(d._t); d._t = later(() => d.classList.remove('act-' + s.act, 'show-tag'), 2600);
    (SOUNDS[s.act] || SOUNDS.roar)();
    speak(s.say);
    const r = d.getBoundingClientRect(), sr = this.root.getBoundingClientRect();
    sparkleAt(this.root, r.left - sr.left + r.width / 2, r.top - sr.top + r.height * 0.3, 5, s.act === 'swim' ? ['💧', '✨'] : undefined);
  },
  go(dir){ sfx.pop(); this.scroll.scrollBy({ left: dir * this.scroll.clientWidth * 0.7, behavior: 'smooth' }); },
  enter(){ this.scroll.scrollLeft = 0; speakNext(START); }
});

window.dinoWorldPhrases = () => [START, ...SPECIES.map(s => s.say)];
const G = window.IdrisPlay.GAMES;
const at = homeGames.findIndex(h => h.id === 'dinorun') + 1;
homeGames.splice(at, 0, { id: 'dinoworld', e: G.dinoworld.e, n: G.dinoworld.n, s: 'Meet the dinosaurs', colors: G.dinoworld.colors, cat: 'dino', isNew: true });
renderHome();
})();
