// Idris Play — learning pack: tracing, word building, big & small letters, syllable clapping,
// magic paint, letter hide & seek, and counting / dot-to-dot. Our own designs, built on the shared
// toolkit from js/fun.js (window.IdrisPlay) and the app's data (abc, numWords, speak, store...).
(function(){
'use strict';
const { addGame, sfx, celebrate, sparkleAt, stagePoint, el, pick, rand, later, $ } = window.IdrisPlay;
const SVGNS = 'http://www.w3.org/2000/svg';
const shuffle = arr => { const a = arr.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const progress = (game, fallback) => store.get('learn_' + game, fallback);
const saveProgress = (game, value) => store.set('learn_' + game, value);
const abcOf = L => abc.find(a => a.l === L.toUpperCase()) || { l: L.toUpperCase(), w: '', ph: L.toLowerCase(), e: '' };
const wiggle = node => { node.classList.remove('lr-wiggle'); void node.offsetWidth; node.classList.add('lr-wiggle'); };
const bounce = node => { node.classList.remove('lr-bounce'); void node.offsetWidth; node.classList.add('lr-bounce'); };

// Everything the learning games say lives here, so the voice pack can pre-record it (see learnPhrases).
const SAY = {
  traceStart: (set, item) => set === 'upper' ? `Trace big ${item}.` : set === 'lower' ? `Trace little ${item}.`
    : set === 'digits' ? `Trace the number ${numWords[+item]}.` : `Let's write ${item}!`,
  traceDone: (set, item) => set === 'upper' ? `Big ${item}! Well done!` : set === 'lower' ? `Little ${item}! Well done!`
    : set === 'digits' ? `${numWords[+item]}! Well done!` : `${item}! You wrote your name!`,
  wordStart: w => `Let's spell ${w.toLowerCase()}!`,
  wordBlend: w => `${w.split('').map(l => abcOf(l).ph).join('... ')}... ${w[0] + w.slice(1).toLowerCase()}!`,
  bigSmallFind: L => `Find little ${L.toLowerCase()}!`,
  bigSmallYes: L => `Big ${L}, little ${L.toLowerCase()}!`,
  bigSmallNo: l => `That is little ${l}.`,
  clapStart: w => `${w}! Clap with me!`,
  clapDone: c => `${c.say.join(', ')}! ${c.w}! ${c.say.length === 1 ? 'One clap!' : numWords[c.say.length] + ' claps!'}`,
  seekFind: L => `Where is letter ${L}?`,
  seekFound: L => `You found ${L}!`,
  countDone: (n, plural) => `${numWords[n]} ${plural}!`,
  countPick: n => `Find the number ${numWords[n].toLowerCase()}!`,
  dotsDone: name => `A ${name}!`
};

// ======================================================================
// ✏️ TRACE IT — letters, lowercase, numbers and the child's own name
// ======================================================================
const TRACE_SETS = {
  upper: () => UPPER,
  lower: () => UPPER.map(l => l.toLowerCase()),
  digits: () => ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  name: () => [kidName]
};
const INK = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'];
addGame({
  id: 'trace', e: '✏️', n: 'Trace It', colors: ['#FDE68A', '#F59E0B', '#B45309'], stageClass: 'tr-stage', cat: 'abc',
  html: `<div class="tr-tabs">
      <button class="ng-btn tr-tab" data-set="upper">ABC</button><button class="ng-btn tr-tab" data-set="lower">abc</button>
      <button class="ng-btn tr-tab" data-set="digits">123</button><button class="ng-btn tr-tab tr-name" data-set="name">✨</button>
    </div>
    <div class="tr-board"><svg class="tr-svg"></svg></div>
    <div class="tr-nav"><button class="ng-btn tr-arrow" data-d="-1" aria-label="Back">◀</button><div class="tr-strip"></div><button class="ng-btn tr-arrow" data-d="1" aria-label="Next">▶</button></div>`,
  init(root){
    this.svg = $('.tr-svg', root); this.strip = $('.tr-strip', root);
    this.state = progress('trace', { set: 'upper', idx: { upper: 0, lower: 0, digits: 0, name: 0 }, done: {} });
    root.querySelectorAll('.tr-tab').forEach(b => b.addEventListener('click', () => { sfx.pop(); this.setSet(b.dataset.set); }));
    root.querySelectorAll('.tr-arrow').forEach(b => b.addEventListener('click', () => { sfx.pop(); this.go(this.state.idx[this.state.set] + (+b.dataset.d)); }));
    this.svg.addEventListener('pointerdown', e => this.down(e));
    this.svg.addEventListener('pointermove', e => this.move(e));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => this.svg.addEventListener(t, () => { this.tracing = false; }));
  },
  items(){ return TRACE_SETS[this.state.set](); },
  setSet(set){ this.state.set = set; saveProgress('trace', this.state); this.go(this.state.idx[set] || 0); },
  go(i){
    const items = this.items();
    i = (i + items.length) % items.length;
    this.state.idx[this.state.set] = i; saveProgress('trace', this.state);
    this.root.querySelectorAll('.tr-tab').forEach(b => b.classList.toggle('on', b.dataset.set === this.state.set));
    $('.tr-name', this.root).textContent = '✨ ' + kidName;
    this.strip.innerHTML = items.map((it, k) => `<button class="tr-chip ${k === i ? 'on' : ''} ${this.state.done[this.state.set + ':' + it] ? 'done' : ''}" data-k="${k}">${it}</button>`).join('');
    this.strip.querySelectorAll('.tr-chip').forEach(c => c.addEventListener('click', () => { sfx.pop(); this.go(+c.dataset.k); }));
    this.strip.querySelector('.on')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    this.build(items[i]);
    speak(SAY.traceStart(this.state.set, items[i]));
  },
  build(item){
    this.item = item;
    const glyphs = item.split('').filter(ch => window.STROKES[ch]);
    const gap = 8, w = glyphs.length * 100 + (glyphs.length - 1) * gap;
    this.svg.setAttribute('viewBox', `-8 -2 ${w + 16} 128`);
    this.svg.innerHTML = `<line class="tr-line" x1="-8" x2="${w + 8}" y1="100" y2="100"/><line class="tr-line dash" x1="-8" x2="${w + 8}" y1="45" y2="45"/><line class="tr-line" x1="-8" x2="${w + 8}" y1="10" y2="10"/>`;
    this.strokes = [];
    glyphs.forEach((ch, gi) => {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('transform', `translate(${gi * (100 + gap)} 0)`);
      this.svg.appendChild(g);
      const color = INK[(UPPER.indexOf(ch.toUpperCase()) + gi + (+ch || 0)) % INK.length];
      window.STROKES[ch].forEach(d => {
        const mk = (cls) => { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); g.appendChild(p); return p; };
        mk('tr-road'); mk('tr-mid');
        const ink = mk('tr-ink'); ink.style.stroke = color;
        const len = ink.getTotalLength();
        const s = { g, ink, len, dot: len < 4, pts: [], p: 0, ox: gi * (100 + gap) };
        if(s.dot){
          const pt = ink.getPointAtLength(0);
          s.pts = [{ x: pt.x + s.ox, y: pt.y }];
          ink.remove();
          s.ink = document.createElementNS(SVGNS, 'circle');
          s.ink.setAttribute('cx', pt.x); s.ink.setAttribute('cy', pt.y); s.ink.setAttribute('r', 7); s.ink.setAttribute('class', 'tr-dotink');
          s.ink.style.fill = color; g.appendChild(s.ink);
        } else {
          for(let l = 0; l <= len; l += 2){ const pt = ink.getPointAtLength(l); s.pts.push({ x: pt.x + s.ox, y: pt.y }); }
          ink.style.strokeDasharray = len; ink.style.strokeDashoffset = len;
        }
        this.strokes.push(s);
      });
    });
    this.cur = 0; this.tracing = false; this.finished = false;
    this.marker();
  },
  marker(){
    this.svg.querySelectorAll('.tr-start,.tr-arrowhead').forEach(n => n.remove());
    const s = this.strokes[this.cur]; if(!s) return;
    const a = s.pts[s.p] || s.pts[0];
    const dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('cx', a.x); dot.setAttribute('cy', a.y); dot.setAttribute('r', 7.5); dot.setAttribute('class', 'tr-start');
    this.svg.appendChild(dot);
    if(!s.dot){
      const b = s.pts[Math.min(s.pts.length - 1, s.p + 9)];
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      const arrow = document.createElementNS(SVGNS, 'path');
      arrow.setAttribute('d', 'M-5 -6 L6 0 L-5 6 Z'); arrow.setAttribute('class', 'tr-arrowhead');
      arrow.setAttribute('transform', `translate(${b.x} ${b.y}) rotate(${ang})`);
      this.svg.appendChild(arrow);
    }
  },
  toSvg(e){ const pt = this.svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(this.svg.getScreenCTM().inverse()); },
  down(e){
    if(this.finished) return;
    const s = this.strokes[this.cur]; if(!s) return;
    const p = this.toSvg(e), TOL = 17;
    if(s.dot){ if(Math.hypot(p.x - s.pts[0].x, p.y - s.pts[0].y) < TOL * 1.4) this.strokeDone(); return; }
    const a = s.pts[s.p];
    if(Math.hypot(p.x - a.x, p.y - a.y) < TOL * 1.5){ this.tracing = true; try{ this.svg.setPointerCapture(e.pointerId); }catch(_){} }
    else { const st = $('.tr-start', this.svg); if(st){ st.classList.remove('lr-pulse'); void st.getBBox(); st.classList.add('lr-pulse'); } }
  },
  move(e){
    if(!this.tracing) return;
    const s = this.strokes[this.cur]; if(!s || s.dot) return;
    const p = this.toSvg(e), TOL = 17;
    let best = -1, bestD = TOL;
    for(let k = s.p; k < Math.min(s.pts.length, s.p + 14); k++){
      const d = Math.hypot(p.x - s.pts[k].x, p.y - s.pts[k].y);
      if(d < bestD){ bestD = d; best = k; }
    }
    if(best > s.p){
      s.p = best;
      s.ink.style.strokeDashoffset = Math.max(0, s.len - s.p * 2);
      const now = Date.now();
      if(!this.tickAt || now - this.tickAt > 90){ this.tickAt = now; sfx.tone(380 + 500 * s.p / s.pts.length, 0.06, 'sine', 0.08); }
      this.marker();
      if(s.p >= s.pts.length - 3) this.strokeDone();
    }
  },
  strokeDone(){
    const s = this.strokes[this.cur];
    if(s.dot) s.ink.classList.add('on'); else s.ink.style.strokeDashoffset = 0;
    this.tracing = false; sfx.pop();
    this.cur++;
    if(this.cur < this.strokes.length){ this.marker(); return; }
    this.finished = true; this.marker();
    const key = this.state.set + ':' + this.item;
    this.state.done[key] = true; saveProgress('trace', this.state);
    this.svg.classList.remove('lr-bounce'); void this.svg.getBBox(); this.svg.classList.add('lr-bounce');
    const r = this.root.getBoundingClientRect();
    sparkleAt(this.root, r.width / 2, r.height / 2, 10);
    speak(SAY.traceDone(this.state.set, this.item));
    const done = Object.keys(this.state.done).filter(k => k.startsWith(this.state.set + ':')).length;
    burstConfetti(done % 5 === 0 ? 30 : 16);
    later(() => { if(currentScreen === 'trace') this.go(this.state.idx[this.state.set] + 1); }, 2600);
  },
  enter(){ this.go(this.state.idx[this.state.set] || 0); }
});

// ======================================================================
// 🧩 WORD BUILDER — tap letters into boxes, then hear the sounds blend
// ======================================================================
const WORDS = [
  ['CAT', '🐱'], ['DOG', '🐶'], ['SUN', '☀️'], ['PIG', '🐷'], ['BUS', '🚌'], ['HAT', '🎩'], ['BED', '🛏️'], ['CUP', '🥤'],
  ['FOX', '🦊'], ['HEN', '🐔'], ['BEE', '🐝'], ['COW', '🐄'], ['EGG', '🥚'], ['ANT', '🐜'], ['BOX', '📦'], ['CAR', '🚗'],
  ['OWL', '🦉'], ['BAT', '🦇'], ['MAP', '🗺️'], ['VAN', '🚐'],
  ['FISH', '🐟'], ['FROG', '🐸'], ['DUCK', '🦆'], ['STAR', '⭐'], ['MOON', '🌙'], ['CAKE', '🎂'], ['BOAT', '⛵'], ['BEAR', '🐻'],
  ['LION', '🦁'], ['TREE', '🌳'], ['BALL', '⚽'], ['BIRD', '🐦'], ['KITE', '🪁'], ['SHIP', '🚢'], ['MILK', '🥛'], ['SOCK', '🧦'],
  ['APPLE', '🍎'], ['HORSE', '🐴'], ['TIGER', '🐯'], ['PIZZA', '🍕'], ['HOUSE', '🏠'], ['ZEBRA', '🦓'], ['TRAIN', '🚆'],
  ['SNAKE', '🐍'], ['MOUSE', '🐭'], ['CLOCK', '🕐'], ['ROBOT', '🤖'], ['TRUCK', '🚚']
];
addGame({
  id: 'words', e: '🧩', n: 'Word Builder', colors: ['#BAE6FD', '#38BDF8', '#0369A1'], stageClass: 'wb-stage', cat: 'abc',
  html: `<div class="lr-level">⭐ <b>1</b></div><button class="wb-pic" aria-label="Hear the word">🐱</button>
    <div class="wb-slots"></div><div class="wb-tiles"></div>`,
  init(root){
    this.pic = $('.wb-pic', root); this.slots = $('.wb-slots', root); this.tiles = $('.wb-tiles', root);
    this.level = progress('words', 0);
    this.pic.addEventListener('click', () => { bounce(this.pic); speak(this.word[0] + this.word.slice(1).toLowerCase()); });
  },
  round(){
    const [word, emoji] = WORDS[this.level % WORDS.length];
    this.word = word; this.filled = 0; this.busy = false;
    $('.lr-level b', this.root).textContent = this.level + 1;
    this.pic.textContent = emoji; bounce(this.pic);
    this.slots.innerHTML = word.split('').map(l => `<div class="wb-slot"><span class="wb-ghost">${l}</span></div>`).join('');
    const extra = this.level < 10 ? 0 : this.level < 25 ? 1 : 2;
    const pool = shuffle(UPPER.filter(l => !word.includes(l))).slice(0, extra);
    this.tiles.innerHTML = shuffle([...word.split(''), ...pool]).map(l => `<button class="ng-btn wb-tile">${l}</button>`).join('');
    this.tiles.querySelectorAll('.wb-tile').forEach(t => t.addEventListener('click', () => this.tap(t)));
    speak(SAY.wordStart(word));
  },
  tap(tile){
    if(this.busy || tile.classList.contains('used')) return;
    const want = this.word[this.filled], L = tile.textContent;
    if(L !== want){ wiggle(tile); sfx.boing(); return; }
    const slot = this.slots.children[this.filled];
    const a = tile.getBoundingClientRect(), b = slot.getBoundingClientRect();
    tile.classList.add('used');
    const fly = el('div', 'wb-fly', L);
    Object.assign(fly.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(fly);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fly.style.transform = `translate(${b.left - a.left + (b.width - a.width) / 2}px, ${b.top - a.top + (b.height - a.height) / 2}px)`;
    }));
    later(() => { fly.remove(); slot.innerHTML = `<span class="wb-letter">${L}</span>`; bounce(slot); }, 380);
    sfx.plink(this.filled + 2);
    speak(abcOf(L).ph);
    this.filled++;
    if(this.filled === this.word.length){ this.busy = true; later(() => this.blend(), 700); }
  },
  blend(){
    [...this.slots.children].forEach((s, i) => later(() => { bounce(s); s.classList.add('lit'); }, i * 650));
    speak(SAY.wordBlend(this.word));
    later(() => {
      this.pic.classList.add('lr-dance');
      this.level++; saveProgress('words', this.level);
      burstConfetti(this.level % 3 === 0 ? 30 : 16);
    }, this.word.length * 650 + 300);
    later(() => { this.pic.classList.remove('lr-dance'); if(currentScreen === 'words') this.round(); }, this.word.length * 650 + 3200);
  },
  enter(){ this.round(); }
});

// ======================================================================
// 🔡 BIG & SMALL — match each capital letter with its little letter
// ======================================================================
addGame({
  id: 'bigsmall', e: '🔡', n: 'Big & Small', colors: ['#DDD6FE', '#A78BFA', '#6D28D9'], stageClass: 'bs-stage', cat: 'abc',
  html: `<div class="lr-level">⭐ <b>0</b></div><div class="bs-big"><span>A</span><i class="bs-eyes">👀</i></div><div class="bs-choices"></div>`,
  init(root){ this.big = $('.bs-big', root); this.choices = $('.bs-choices', root); this.i = progress('bigsmall', 0); this.score = 0; },
  round(){
    const L = UPPER[this.i % 26];
    this.L = L; this.busy = false;
    $('span', this.big).textContent = L; bounce(this.big);
    $('.lr-level b', this.root).textContent = this.score;
    const others = shuffle(UPPER.filter(x => x !== L)).slice(0, 2);
    this.choices.innerHTML = shuffle([L, ...others]).map((x, k) =>
      `<button class="bs-bubble" style="--d:${k * 0.4}s;--h:${(UPPER.indexOf(x) * 37) % 360}">${x.toLowerCase()}</button>`).join('');
    this.choices.querySelectorAll('.bs-bubble').forEach(b => b.addEventListener('click', () => this.tap(b)));
    speak(SAY.bigSmallFind(L));
  },
  tap(b){
    if(this.busy) return;
    const l = b.textContent;
    if(l !== this.L.toLowerCase()){ wiggle(b); sfx.boing(); speak(SAY.bigSmallNo(l)); return; }
    this.busy = true;
    const a = b.getBoundingClientRect(), t = this.big.getBoundingClientRect();
    b.style.transform = `translate(${t.left + t.width * 0.62 - a.left}px, ${t.top + t.height * 0.55 - a.top}px) scale(.8)`;
    b.classList.add('home');
    sfx.pop(); later(() => sfx.tada(), 300);
    speak(SAY.bigSmallYes(this.L));
    this.score++; this.i++; saveProgress('bigsmall', this.i);
    later(() => { bounce(this.big); sparkleAt(this.root, this.root.clientWidth / 2, this.root.clientHeight * 0.35, 8, ['💖', '✨', '⭐']); }, 450);
    burstConfetti(this.score % 5 === 0 ? 30 : 14);
    later(() => { if(currentScreen === 'bigsmall') this.round(); }, 2300);
  },
  enter(){ this.score = 0; this.round(); }
});

// ======================================================================
// 👏 CLAP & SAY — clap the syllables of a word
// ======================================================================
const CLAPS = [
  { w: 'Banana', e: '🍌', parts: ['ba', 'na', 'na'], say: ['Buh', 'Nah', 'Nuh'] },
  { w: 'Apple', e: '🍎', parts: ['ap', 'ple'], say: ['Ap', 'Pull'] },
  { w: 'Dog', e: '🐶', parts: ['dog'], say: ['Dog'] },
  { w: 'Rabbit', e: '🐰', parts: ['rab', 'bit'], say: ['Rab', 'Bit'] },
  { w: 'Elephant', e: '🐘', parts: ['el', 'e', 'phant'], say: ['El', 'Uh', 'Funt'] },
  { w: 'Sun', e: '☀️', parts: ['sun'], say: ['Sun'] },
  { w: 'Tiger', e: '🐯', parts: ['ti', 'ger'], say: ['Tie', 'Gur'] },
  { w: 'Butterfly', e: '🦋', parts: ['but', 'ter', 'fly'], say: ['But', 'Ter', 'Fly'] },
  { w: 'Pizza', e: '🍕', parts: ['piz', 'za'], say: ['Peet', 'Suh'] },
  { w: 'Dinosaur', e: '🦖', parts: ['di', 'no', 'saur'], say: ['Die', 'Nuh', 'Sore'] },
  { w: 'Monkey', e: '🐒', parts: ['mon', 'key'], say: ['Mun', 'Key'] },
  { w: 'Umbrella', e: '☂️', parts: ['um', 'brel', 'la'], say: ['Um', 'Brel', 'Luh'] },
  { w: 'Teddy', e: '🧸', parts: ['ted', 'dy'], say: ['Ted', 'Dee'] },
  { w: 'Crocodile', e: '🐊', parts: ['croc', 'o', 'dile'], say: ['Crock', 'Uh', 'Dial'] },
  { w: 'Turtle', e: '🐢', parts: ['tur', 'tle'], say: ['Ter', 'Tull'] },
  { w: 'Watermelon', e: '🍉', parts: ['wa', 'ter', 'mel', 'on'], say: ['Wah', 'Ter', 'Mel', 'Un'] },
  { w: 'Penguin', e: '🐧', parts: ['pen', 'guin'], say: ['Pen', 'Gwin'] },
  { w: 'Helicopter', e: '🚁', parts: ['hel', 'i', 'cop', 'ter'], say: ['Hel', 'Ee', 'Cop', 'Ter'] },
  { w: 'Carrot', e: '🥕', parts: ['car', 'rot'], say: ['Care', 'Rut'] },
  { w: 'Giraffe', e: '🦒', parts: ['gi', 'raffe'], say: ['Juh', 'Raff'] }
];
addGame({
  id: 'clap', e: '👏', n: 'Clap & Say', colors: ['#FECDD3', '#FB7185', '#BE123C'], stageClass: 'cs-stage', cat: 'abc',
  html: `<div class="lr-level">⭐ <b>1</b></div><button class="cs-pic" aria-label="Hear the word">🍌</button><div class="cs-chips"></div>
    <button class="ng-btn cs-clap" aria-label="Clap">👏</button>`,
  init(root){
    this.pic = $('.cs-pic', root); this.chips = $('.cs-chips', root);
    this.i = progress('clap', 0);
    $('.cs-clap', root).addEventListener('click', () => this.clap());
    this.pic.addEventListener('click', () => { bounce(this.pic); speak(this.c.w); });
  },
  round(){
    this.c = CLAPS[this.i % CLAPS.length]; this.n = 0; this.busy = false;
    $('.lr-level b', this.root).textContent = this.i + 1;
    this.pic.textContent = this.c.e; bounce(this.pic);
    this.chips.innerHTML = this.c.parts.map((p, k) => `<span class="cs-chip" style="--h:${k * 70 + 330}">${p}</span>`).join('<i>·</i>');
    speak(SAY.clapStart(this.c.w));
  },
  clap(){
    const btn = $('.cs-clap', this.root); bounce(btn);
    sfx.noise(0.08, 0.6, 2200, 'bandpass'); sfx.noise(0.05, 0.4, 900, 'bandpass');
    if(this.busy) return;
    const chip = this.chips.querySelectorAll('.cs-chip')[this.n];
    chip.classList.add('lit'); bounce(chip);
    speak(this.c.say[this.n] + '!');
    this.n++;
    if(this.n === this.c.parts.length){
      this.busy = true;
      later(() => {
        speak(SAY.clapDone(this.c)); this.pic.classList.add('lr-dance');
        this.i++; saveProgress('clap', this.i); burstConfetti(this.i % 4 === 0 ? 30 : 14);
      }, 700);
      later(() => { this.pic.classList.remove('lr-dance'); if(currentScreen === 'clap') this.round(); }, 4300);
    }
  },
  enter(){ this.round(); }
});

// ======================================================================
// 🎨 MAGIC PAINT — rub away the paint to find a hidden letter
// ======================================================================
addGame({
  id: 'paint', e: '🖌️', n: 'Magic Paint', colors: ['#FBCFE8', '#EC4899', '#9D174D'], stageClass: 'mp-stage', cat: 'abc',
  html: `<div class="mp-reveal"><div class="mp-letter">A</div><div class="mp-pic">🍎</div></div><canvas class="mp-cover"></canvas>
    <div class="ng-hint">🖌️ Rub rub rub! What is hiding?</div>`,
  init(root){
    this.cv = $('canvas', root); this.ctx = this.cv.getContext('2d', { willReadFrequently: true });
    this.i = progress('paint', 0);
    let down = false;
    root.addEventListener('pointerdown', e => { down = true; this.rub(e); });
    root.addEventListener('pointermove', e => { if(down || e.pointerType === 'touch') this.rub(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => root.addEventListener(t, () => { down = false; }));
    window.addEventListener('resize', () => { if(currentScreen === 'paint' && !this.revealed) this.round(); });
  },
  round(){
    const a = abc[this.i % abc.length];
    this.a = a; this.revealed = false; this.lastCheck = 0;
    $('.mp-letter', this.root).textContent = a.l + a.l.toLowerCase();
    $('.mp-letter', this.root).style.color = INK[this.i % INK.length];
    $('.mp-pic', this.root).textContent = a.e;
    this.root.classList.remove('shown');
    const r = this.root.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = r.width * d; this.cv.height = r.height * d; this.scale = d;
    const c = this.ctx;
    c.globalCompositeOperation = 'source-over';
    const hue = (this.i * 47) % 360;
    const g = c.createLinearGradient(0, 0, this.cv.width, this.cv.height);
    g.addColorStop(0, `hsl(${hue} 85% 70%)`); g.addColorStop(1, `hsl(${(hue + 60) % 360} 85% 65%)`);
    c.fillStyle = g; c.fillRect(0, 0, this.cv.width, this.cv.height);
    for(let k = 0; k < 60; k++){
      c.fillStyle = `hsla(${(hue + rand(-60, 120)) % 360} 90% ${rand(60, 85)}% / .8)`;
      c.beginPath(); c.arc(rand(0, this.cv.width), rand(0, this.cv.height), rand(10, 46) * d, 0, 7); c.fill();
    }
    c.font = `${70 * d}px Fredoka, sans-serif`; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.55)';
    for(let k = 0; k < 7; k++) c.fillText('?', rand(40, r.width - 40) * d, rand(80, r.height - 40) * d);
  },
  rub(e){
    if(this.revealed) return;
    const p = stagePoint(this.root, e), d = this.scale, c = this.ctx;
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(p.x * d, p.y * d, 38 * d, 0, 7); c.fill();
    const now = Date.now();
    if(now - (this.squeakAt || 0) > 120){ this.squeakAt = now; sfx.tone(rand(500, 900), 0.06, 'triangle', 0.06); }
    if(now - this.lastCheck > 350){ this.lastCheck = now; if(this.cleared() > 0.55) this.reveal(); }
  },
  cleared(){
    const { width: w, height: h } = this.cv, data = this.ctx.getImageData(0, 0, w, h).data;
    let clear = 0, total = 0;
    for(let y = 0; y < h; y += 12) for(let x = 0; x < w; x += 12){ total++; if(data[(y * w + x) * 4 + 3] < 40) clear++; }
    return clear / total;
  },
  reveal(){
    this.revealed = true;
    this.root.classList.add('shown');
    speak(`${this.a.l}! ${this.a.l} is for ${this.a.w}!`);
    sparkleAt(this.root, this.root.clientWidth / 2, this.root.clientHeight / 2, 12);
    this.i++; saveProgress('paint', this.i);
    burstConfetti(this.i % 3 === 0 ? 30 : 16);
    later(() => { if(currentScreen === 'paint') this.round(); }, 3600);
  },
  enter(){ later(() => this.round(), 60); }
});

// ======================================================================
// 🙈 LETTER HIDE & SEEK — find the letter hiding behind things
// ======================================================================
const COVERS = ['🌳', '🏠', '📦', '🎁', '🍄', '🚗', '🌻', '⛺'];
const PEEKERS = ['🐭', '🐱', '🐶', '🐰', '🐥', '🐸'];
addGame({
  id: 'seek', e: '🔍', n: 'Letter Hide & Seek', colors: ['#BBF7D0', '#22C55E', '#15803D'], stageClass: 'hs2-stage', cat: 'abc',
  html: `<div class="hs2-card"><small>Find</small><b>A</b></div><div class="hs2-spots"></div>`,
  init(root){ this.spots = $('.hs2-spots', root); this.i = progress('seek', 0); },
  round(){
    const T = UPPER[this.i % 26];
    this.T = T; this.busy = false;
    $('.hs2-card b', this.root).textContent = T; bounce($('.hs2-card', this.root));
    const covers = shuffle(COVERS).slice(0, 6);
    const others = shuffle(UPPER.filter(x => x !== T)).slice(0, 3);
    const hidden = shuffle([T, ...others, pick(PEEKERS), pick(PEEKERS)]);
    this.spots.innerHTML = covers.map((c, k) =>
      `<button class="hs2-spot" data-v="${hidden[k]}"><span class="hs2-under">${hidden[k]}</span><span class="hs2-cover">${c}</span></button>`).join('');
    this.spots.querySelectorAll('.hs2-spot').forEach(s => s.addEventListener('click', () => this.tap(s)));
    speak(SAY.seekFind(T));
  },
  tap(s){
    if(this.busy || s.classList.contains('open')) return;
    const v = s.dataset.v;
    s.classList.add('open'); sfx.whoosh();
    if(v === this.T){
      this.busy = true; sfx.tada();
      speak(SAY.seekFound(v));
      sparkleAt(this.root, s.offsetLeft + s.offsetWidth / 2, s.offsetTop + s.offsetHeight / 2, 8);
      this.i++; saveProgress('seek', this.i);
      burstConfetti(this.i % 5 === 0 ? 30 : 16);
      later(() => { if(currentScreen === 'seek') this.round(); }, 2600);
    } else {
      if(UPPER.includes(v)) speak(v + '!'); else { sfx.giggle(); speak('Peek a boo!'); }
      later(() => s.classList.remove('open'), 1300);
    }
  },
  enter(){ this.round(); }
});

// ======================================================================
// 🔢 COUNT & CONNECT — count things, pick the number, join the dots
// ======================================================================
const COUNT_THINGS = [['🍎', 'apples'], ['⭐', 'stars'], ['🐟', 'fish'], ['🎈', 'balloons'], ['🐥', 'chicks'], ['🍓', 'strawberries'], ['🚗', 'cars'], ['🦋', 'butterflies']];
const star = Array.from({ length: 10 }, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 19 : 44; return [50 + Math.cos(a) * r, 54 + Math.sin(a) * r]; });
const heart = Array.from({ length: 10 }, (_, k) => { const t = Math.PI * 2 * k / 10 + Math.PI; return [50 + 2.6 * 16 * Math.sin(t) ** 3, 48 - 2.6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 1.15]; });
const DOT_SHAPES = [
  { n: 'triangle', e: '🔺', c: '#EF4444', pts: [[50, 12], [88, 86], [12, 86]] },
  { n: 'kite', e: '🪁', c: '#F59E0B', pts: [[50, 8], [82, 44], [50, 92], [18, 44]] },
  { n: 'house', e: '🏠', c: '#F97316', pts: [[20, 90], [20, 48], [50, 16], [80, 48], [80, 90]] },
  { n: 'boat', e: '⛵', c: '#0EA5E9', pts: [[10, 62], [50, 62], [50, 12], [86, 56], [90, 62], [76, 88], [24, 88]] },
  { n: 'rocket', e: '🚀', c: '#8B5CF6', pts: [[50, 6], [66, 30], [66, 70], [82, 90], [50, 80], [18, 90], [34, 70], [34, 30]] },
  { n: 'fish', e: '🐟', c: '#06B6D4', pts: [[12, 50], [32, 30], [62, 28], [80, 48], [94, 30], [94, 70], [80, 52], [62, 72], [32, 70]] },
  { n: 'star', e: '⭐', c: '#EAB308', pts: star },
  { n: 'heart', e: '❤️', c: '#EC4899', pts: heart }
];
addGame({
  id: 'count', e: '🔢', n: 'Count & Connect', colors: ['#FDE68A', '#FBBF24', '#B45309'], stageClass: 'cc-stage', cat: '123',
  html: `<div class="lr-level">⭐ <b>1</b></div><div class="cc-area"></div><div class="cc-choices"></div><div class="ng-hint"></div>`,
  init(root){ this.area = $('.cc-area', root); this.choices = $('.cc-choices', root); this.hint = $('.ng-hint', root); this.lv = progress('count', 0); },
  round(){
    this.busy = false; this.choices.innerHTML = '';
    $('.lr-level b', this.root).textContent = this.lv + 1;
    if(this.lv % 2 === 0) this.countRound(); else this.dotsRound();
  },
  countRound(){
    const max = Math.min(10, 3 + Math.floor(this.lv / 2));
    const n = Math.max(1, Math.floor(rand(Math.max(1, max - 3), max + 1)));
    const [e, plural] = COUNT_THINGS[Math.floor(this.lv / 2) % COUNT_THINGS.length];
    this.n = n; this.counted = 0; this.plural = plural;
    this.hint.textContent = '👆 Tap each one and count!';
    const cells = shuffle(Array.from({ length: 12 }, (_, k) => k)).slice(0, n);
    this.area.className = 'cc-area';
    this.area.innerHTML = cells.map(k => {
      const x = 12 + (k % 4) * 25 + rand(-5, 5), y = 14 + Math.floor(k / 4) * 27 + rand(-5, 5);
      return `<button class="cc-thing" style="left:${x}%;top:${y}%">${e}</button>`;
    }).join('');
    this.area.querySelectorAll('.cc-thing').forEach(t => t.addEventListener('click', () => this.count(t)));
    speak(`Let's count the ${plural}!`);
  },
  count(t){
    if(t.dataset.n || this.busy) return;
    this.counted++; t.dataset.n = this.counted; bounce(t);
    sfx.plink(this.counted);
    speak(numWords[this.counted]);
    if(this.counted < this.n) return;
    this.busy = true;
    later(() => {
      speak(SAY.countDone(this.n, this.n === 1 ? this.plural.replace(/(ies|es|s)$/, m => m === 'ies' ? 'y' : '') : this.plural));
      later(() => this.pickNumber(), 1800);
    }, 700);
  },
  pickNumber(){
    if(currentScreen !== 'count') return;
    const opts = shuffle([this.n, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== this.n)).slice(0, 2)]);
    this.choices.innerHTML = opts.map(x => `<button class="ng-btn cc-num">${x}</button>`).join('');
    this.choices.querySelectorAll('.cc-num').forEach(b => b.addEventListener('click', () => {
      if(+b.textContent !== this.n){ wiggle(b); sfx.boing(); speak(numWords[+b.textContent]); return; }
      bounce(b); sfx.tada(); speak(numWords[this.n] + '!');
      this.next();
    }));
    this.hint.textContent = '👆 Which number?';
    speak(SAY.countPick(this.n));
  },
  dotsRound(){
    const shape = DOT_SHAPES[Math.floor(this.lv / 2) % DOT_SHAPES.length];
    this.shape = shape; this.next_ = 1;
    this.hint.textContent = '👆 Tap 1, 2, 3… to join the dots!';
    this.area.className = 'cc-area dots';
    const pts = shape.pts.map(([x, y]) => [x, y]);
    this.area.innerHTML = `<svg viewBox="0 0 100 100" class="cc-svg"><polygon class="cc-fill" points="${pts.map(p => p.join(',')).join(' ')}" style="fill:${shape.c}"/><polyline class="cc-path" points="" /></svg>
      ${pts.map(([x, y], k) => `<button class="cc-dot ${k === 0 ? 'next' : ''}" style="left:${x}%;top:${y}%">${k + 1}</button>`).join('')}
      <div class="cc-emoji">${shape.e}</div>`;
    this.area.querySelectorAll('.cc-dot').forEach((d, k) => d.addEventListener('click', () => this.dot(k, d)));
    speak('Join the dots! Start at one!');
  },
  dot(k, d){
    if(this.busy) return;
    if(k + 1 !== this.next_){ wiggle(this.area.querySelector('.cc-dot.next') || d); sfx.boing(); return; }
    d.classList.remove('next'); d.classList.add('done'); bounce(d);
    sfx.plink(k + 1); speak(numWords[k + 1]);
    const pts = this.shape.pts.slice(0, k + 1);
    this.next_++;
    const all = this.shape.pts.length;
    const line = this.area.querySelector('.cc-path');
    line.setAttribute('points', (this.next_ > all ? [...pts, this.shape.pts[0]] : pts).map(p => p.join(',')).join(' '));
    if(this.next_ <= all){ this.area.querySelectorAll('.cc-dot')[k + 1].classList.add('next'); return; }
    this.busy = true;
    later(() => { this.area.classList.add('complete'); speak(SAY.dotsDone(this.shape.n)); this.next(); }, 500);
  },
  next(){
    this.lv++; saveProgress('count', this.lv);
    burstConfetti(this.lv % 2 === 0 ? 30 : 16);
    later(() => { if(currentScreen === 'count') this.round(); }, 2800);
  },
  enter(){ this.round(); }
});

// ---------- every sentence above, for pre-recording the voice pack (js/phrases.js) ----------
window.learnPhrases = name => {
  const p = [];
  for(const set of ['upper', 'lower', 'digits']) for(const it of TRACE_SETS[set]()) p.push(SAY.traceStart(set, it), SAY.traceDone(set, it));
  p.push(SAY.traceStart('name', name), SAY.traceDone('name', name));
  for(const [w] of WORDS){ p.push(SAY.wordStart(w), SAY.wordBlend(w), w[0] + w.slice(1).toLowerCase()); for(const l of w) p.push(abcOf(l).ph); }
  for(const L of UPPER){ p.push(SAY.bigSmallFind(L), SAY.bigSmallYes(L), SAY.bigSmallNo(L.toLowerCase()), SAY.seekFind(L), SAY.seekFound(L), L + '!'); }
  for(const c of CLAPS){ p.push(SAY.clapStart(c.w), SAY.clapDone(c), c.w, ...c.say.map(s => s + '!')); }
  for(const [, plural] of COUNT_THINGS){
    p.push(`Let's count the ${plural}!`);
    for(let n = 1; n <= 10; n++) p.push(SAY.countDone(n, n === 1 ? plural.replace(/(ies|es|s)$/, m => m === 'ies' ? 'y' : '') : plural));
  }
  for(let n = 1; n <= 10; n++) p.push(SAY.countPick(n), numWords[n] + '!');
  for(const s of DOT_SHAPES) p.push(SAY.dotsDone(s.n));
  p.push('Join the dots! Start at one!', 'Peek a boo!');
  return p;
};

// ---------- add to the launcher ----------
const LEARN = ['trace', 'words', 'bigsmall', 'clap', 'paint', 'seek', 'count'];
const sub = { trace: 'ABC, abc, 123', words: 'Spell & read', bigsmall: 'A and a', clap: 'Clap the beats', paint: 'Find the letter', seek: 'Where is it?', count: 'Count & join dots' };
const G = window.IdrisPlay.GAMES;
const abcAt = homeGames.findIndex(h => h.id === 'abc');
homeGames.splice(abcAt + 1, 0, ...LEARN.filter(id => id !== 'count').map(id => ({ id, e: G[id].e, n: G[id].n, s: sub[id], colors: G[id].colors, cat: G[id].cat, isNew: true })));
const numAt = homeGames.findIndex(h => h.id === 'numbers');
homeGames.splice(numAt, 0, { id: 'count', e: G.count.e, n: G.count.n, s: sub.count, colors: G.count.colors, cat: '123', isNew: true });
renderHome();
})();
