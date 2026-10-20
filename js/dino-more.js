// Idris Play — more dino games: Dino Dig (rub the sand to find bones, the dinosaur comes alive),
// Dino Lunch (give the hungry dino the food it asks for) and Dino Peekaboo (dinos pop out of bushes,
// tap them to count to 10). Built on the shared toolkit from js/fun.js (window.IdrisPlay).
(function(){
'use strict';
const { addGame, sfx, celebrate, sparkleAt, stagePoint, el, pick, rand, later, $ } = window.IdrisPlay;
const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
// [emoji, hue shift, name]
const DINOS = [['🦖', 0, 'T-Rex'], ['🦕', 0, 'Long Neck'], ['🦖', 170, 'Blue T-Rex'], ['🦕', 250, 'Purple Long Neck'], ['🦖', 290, 'Pink T-Rex'], ['🦕', -60, 'Orange Long Neck']];
const hueOf = h => h ? `hue-rotate(${h}deg) saturate(1.2)` : '';

// ======================================================================
// ⛏️ DINO DIG — rub the sand away, find 3 bones, the dinosaur comes alive
// ======================================================================
const DIG_SAY = {
  start: 'Dino dig! Rub the sand to find the bones!',
  bone: n => n === 1 ? 'A bone! Find more!' : n === 2 ? 'Another bone! One more!' : 'Three bones!',
  alive: n => `Wow! It is a ${n}! Roar!`
};
addGame({
  id: 'dig', e: '🦴', n: 'Dino Dig', colors: ['#FDE68A', '#D97706', '#92400E'], stageClass: 'dg-stage', cat: 'dino',
  html: `<div class="dg-tray"><span></span><span></span><span></span></div>
    <div class="dg-pit"><div class="dg-under"></div><canvas class="dg-sand"></canvas><div class="dg-dino"></div></div>
    <div class="ng-hint">👆 Rub rub rub the sand!</div>`,
  init(root){
    this.pit = $('.dg-pit', root); this.under = $('.dg-under', root); this.cv = $('.dg-sand', root);
    this.ctx = this.cv.getContext('2d'); this.dino = $('.dg-dino', root); this.tray = [...root.querySelectorAll('.dg-tray span')];
    this.round = 0;
    let down = false;
    this.cv.addEventListener('pointerdown', e => { down = true; this.rub(e); });
    this.cv.addEventListener('pointermove', e => { if(down || e.pointerType === 'touch') this.rub(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => this.cv.addEventListener(t, () => { down = false; }));
    window.addEventListener('resize', () => { if(currentScreen === 'dig') this.newDig(); });
  },
  newDig(){
    const r = this.pit.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    this.w = r.width; this.h = r.height;
    this.cv.width = this.w * d; this.cv.height = this.h * d; this.ctx.setTransform(d, 0, 0, d, 0, 0);
    // sand with little pebbles
    const c = this.ctx;
    c.globalCompositeOperation = 'source-over';
    const g = c.createLinearGradient(0, 0, 0, this.h); g.addColorStop(0, '#F2C779'); g.addColorStop(1, '#D9A35B');
    c.fillStyle = g; c.fillRect(0, 0, this.w, this.h);
    for(let i = 0; i < 260; i++){ c.fillStyle = pick(['#C98E45', '#E8B86A', '#B8783A', '#F7D79B']); c.beginPath(); c.arc(rand(0, this.w), rand(0, this.h), rand(1.5, 5), 0, 7); c.fill(); }
    // three bones in different thirds
    this.under.innerHTML = ''; this.bones = [];
    [0, 1, 2].forEach(i => {
      const x = this.w * (0.18 + i * 0.32) + rand(-this.w * 0.06, this.w * 0.06), y = this.h * rand(0.25, 0.75);
      const b = el('div', 'dg-bone', '🦴'); b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.rotate = rand(-40, 40) + 'deg';
      this.under.appendChild(b); this.bones.push({ x, y, node: b, found: false });
    });
    this.found = 0; this.dino.className = 'dg-dino'; this.cv.style.opacity = '';
    this.tray.forEach(s => { s.textContent = ''; s.className = ''; });
    this.def = DINOS[this.round % DINOS.length];
  },
  rub(e){
    if(this.found >= 3) return;
    const p = stagePoint(this.cv, e), c = this.ctx;
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.arc(p.x, p.y, Math.max(28, this.w * 0.05), 0, 7); c.fill();
    const now = Date.now();
    if(!this.scrapeAt || now - this.scrapeAt > 120){ this.scrapeAt = now; sfx.noise(0.08, 0.12, 2500); }
    if(Math.random() < 0.3){ const s = el('div', 'dg-dust'); s.style.left = p.x + 'px'; s.style.top = p.y + 'px'; this.pit.appendChild(s); later(() => s.remove(), 600); }
    this.bones.forEach(b => { if(!b.found && Math.hypot(p.x - b.x, p.y - b.y) < 90 && this.cleared(b) > 0.55) this.foundBone(b); });
  },
  // how much of the sand over a bone is gone (0..1), sampled on a small grid
  cleared(b){
    const d = this.cv.width / this.w, R = 26, data = this.ctx.getImageData((b.x - R) * d, (b.y - R) * d, 2 * R * d, 2 * R * d).data;
    let clear = 0, n = 0;
    for(let i = 3; i < data.length; i += 4 * 37){ n++; if(data[i] < 60) clear++; }
    return clear / n;
  },
  foundBone(b){
    b.found = true; this.found++;
    restart(b.node, 'got'); sfx.pop(); later(() => sfx.boing(), 120);
    sparkleAt(this.pit, b.x, b.y, 6);
    const slot = this.tray[this.found - 1]; slot.textContent = '🦴'; slot.className = 'pop-in';
    speak(DIG_SAY.bone(this.found));
    if(this.found >= 3) later(() => this.alive(), 1200);
  },
  alive(){
    const [e, hue, name] = this.def;
    this.cv.style.opacity = '0';
    this.bones.forEach(b => b.node.classList.add('gather'));
    later(() => {
      this.dino.textContent = e; this.dino.style.filter = hueOf(hue);
      restart(this.dino, 'show');
      sfx.rumble(0.8); sfx.tone(140, 0.6, 'sawtooth', 0.18, 70);
      speak(DIG_SAY.alive(name)); burstConfetti(30);
    }, 700);
    later(() => { if(currentScreen === 'dig'){ this.round++; this.newDig(); } }, 5200);
  },
  enter(){ later(() => this.newDig(), 60); speakNext(DIG_SAY.start); }
});

// ======================================================================
// 🍽️ DINO LUNCH — a picnic: the dino thinks of a food; give it the right one. All drawn, no emoji.
// ======================================================================
const FOODS = ['apple', 'watermelon', 'banana', 'broccoli', 'leaves', 'strawberry', 'carrot', 'grapes'];
const LUNCH_GOAL = 5;
const LU_SAY = {
  start: 'Dino lunch! The dino is hungry!',
  want: f => `I want ${f === 'leaves' || f === 'grapes' ? 'some ' + f : f === 'apple' ? 'an apple' : 'a ' + f}, please!`,
  yum: f => `Yum! ${f[0].toUpperCase() + f.slice(1)}! Thank you!`,
  full: 'I am full! Thank you! Time for a nap!'
};
addGame({
  id: 'lunch', e: '🍽️', n: 'Dino Lunch', colors: ['#BBF7D0', '#22C55E', '#15803D'], stageClass: 'lu-stage', cat: 'dino',
  html: `<div class="lu-hills"></div><div class="lu-blanket"></div>
    <div class="lu-tummy"><span class="lu-tummy-ico"></span><div class="lu-bar"><i></i></div></div>
    <div class="lu-dino"><div class="lu-face"></div><div class="lu-bubble"><span></span></div><div class="lu-zzz">z<b>Z</b></div></div>
    <div class="lu-tray"></div>`,
  init(root){
    this.dino = $('.lu-dino', root); this.face = $('.lu-face', root); this.bubble = $('.lu-bubble span', root);
    this.tray = $('.lu-tray', root); this.bar = $('.lu-bar i', root); this.idx = 0;
    $('.lu-tummy-ico', root).innerHTML = window.idrisFood('apple');
  },
  // One dino animation at a time (pop-in, no, chomp, happy).
  act(cls){ this.dino.classList.remove('pop-in', 'no', 'chomp', 'happy'); void this.dino.offsetWidth; this.dino.classList.add(cls); },
  newDino(){
    if(!this.face.firstChild) this.face.innerHTML = window.idrisBuddySVG || '';
    const [, hue] = DINOS[this.idx++ % DINOS.length];
    this.face.style.filter = hueOf(hue);
    this.dino.classList.remove('sleep'); this.act('pop-in');
    this.fed = 0; this.bar.style.width = '0%';
    this.ask();
  },
  ask(){
    const choices = FOODS.slice().sort(() => Math.random() - .5).slice(0, 4);
    this.want = pick(choices);
    this.bubble.innerHTML = window.idrisFood(this.want); restart(this.bubble.parentNode, 'show');
    this.tray.innerHTML = '';
    choices.forEach((f, i) => {
      const b = el('button', 'lu-food pop-in', window.idrisFood(f)); b.setAttribute('aria-label', f); b.dataset.food = f;
      b.style.animationDelay = (i * 80) + 'ms';
      b.addEventListener('click', () => this.give(f, b));
      this.tray.appendChild(b);
    });
    this.busy = false;
    later(() => speak(LU_SAY.want(this.want)), 300);
  },
  give(f, btn){
    if(this.busy) return;
    if(f !== this.want){
      this.act('no'); restart(btn, 'lr-wiggle'); sfx.tone(220, 0.25, 'triangle', 0.22, 160);
      speak(pick(['No thank you!', 'Hmm, not that one!']));
      later(() => restart(this.bubble.parentNode, 'show'), 500);
      return;
    }
    this.busy = true;
    this.dino.classList.add('open'); sfx.rise();
    // fly into the open mouth (right side of the head)
    const br = btn.getBoundingClientRect(), fr = this.face.getBoundingClientRect();
    const mx = fr.left + fr.width * 0.76, my = fr.top + fr.height * 0.52;
    btn.style.transition = 'transform .55s cubic-bezier(.5,-0.3,.6,1)';
    btn.style.transform = `translate(${mx - br.left - br.width / 2}px, ${my - br.top - br.height / 2}px) scale(.35)`;
    later(() => {
      btn.style.opacity = '0';
      this.dino.classList.remove('open'); this.act('chomp');
      sfx.crack(); later(() => sfx.pop(), 150); later(() => sfx.squeak(), 300);
      this.fed++; this.bar.style.width = (this.fed / LUNCH_GOAL * 100) + '%';
      this.bubble.parentNode.classList.remove('show');
      speak(LU_SAY.yum(f));
      if(this.fed >= LUNCH_GOAL) later(() => this.full(), 1200);
      else later(() => this.ask(), 1700);
    }, 560);
  },
  full(){
    this.tray.innerHTML = '';
    speak(LU_SAY.full); celebrate('Yum yum!'); burstConfetti(30);
    this.act('happy');
    later(() => this.dino.classList.add('sleep'), 2200);
    later(() => { if(currentScreen === 'lunch') this.newDino(); }, 6000);
  },
  enter(){ speakNext(LU_SAY.start); later(() => this.newDino(), 400); }
});

// ======================================================================
// 🌿 DINO PEEKABOO — dinos pop out of bushes; tap them and count to 10
// ======================================================================
const PEEK_GOAL = 10;
const PK_SAY = {
  start: 'Dino peekaboo! Tap the dinos when they pop out!',
  done: 'Ten dinos! You found them all!'
};
addGame({
  id: 'peekdino', e: '🌿', n: 'Dino Peekaboo', colors: ['#A7F3D0', '#10B981', '#047857'], stageClass: 'pk-stage', cat: 'dino',
  html: `<div class="pk-count">🦖 <b>0</b></div><div class="pk-volcano"></div><div class="pk-field"></div>`,
  init(root){
    this.field = $('.pk-field', root); this.countEl = $('.pk-count b', root);
    this.holes = [];
    for(let i = 0; i < 6; i++){
      const h = el('div', 'pk-hole', `<div class="pk-dino"></div><div class="pk-bush"></div>`);
      const d = $('.pk-dino', h);
      d.addEventListener('pointerdown', e => { e.stopPropagation(); this.tap(i); });
      this.field.appendChild(h); this.holes.push({ h, d, up: false });
    }
  },
  pop(){
    if(!this.running) return;
    const free = this.holes.filter(o => !o.up);
    if(free.length > 3){
      const o = pick(free), egg = Math.random() < 0.15, [e, hue] = egg ? ['🥚', 0] : pick(DINOS);
      o.d.textContent = e; o.d.style.filter = hueOf(hue); o.egg = egg;
      o.up = true; o.h.classList.remove('tapped'); restart(o.h, 'up'); sfx.tone(500, 0.12, 'sine', 0.15, 800);
      o.timer = later(() => { o.up = false; o.h.classList.remove('up'); }, rand(1800, 2600));
    }
    this.popTimer = later(() => this.pop(), rand(650, 1100));
  },
  tap(i){
    const o = this.holes[i]; if(!o.up) return;
    clearTimeout(o.timer); o.up = false;
    o.h.classList.add('tapped');
    const r = o.h.getBoundingClientRect(), sr = this.root.getBoundingClientRect();
    sparkleAt(this.root, r.left - sr.left + r.width / 2, r.top - sr.top, 5);
    if(o.egg){ sfx.crack(); speak('A dino egg!'); }
    else { sfx.rumble(0.4); sfx.tone(160, 0.4, 'sawtooth', 0.12, 80); }
    this.count++; this.countEl.textContent = this.count;
    if(!o.egg) speak(String(this.count));
    later(() => o.h.classList.remove('up', 'tapped'), 600);
    if(this.count >= PEEK_GOAL){
      this.running = false; clearTimeout(this.popTimer);
      later(() => { speak(PK_SAY.done); celebrate('Found them!'); burstConfetti(30); }, 500);
      later(() => { if(currentScreen === 'peekdino') this.start(); }, 4500);
    }
  },
  start(){ this.count = 0; this.countEl.textContent = 0; this.running = true; clearTimeout(this.popTimer); this.pop(); },
  enter(){ speakNext(PK_SAY.start); this.start(); },
  leave(){ this.running = false; clearTimeout(this.popTimer); this.holes.forEach(o => { clearTimeout(o.timer); o.up = false; o.h.classList.remove('up', 'tapped'); }); }
});

// ---------- every sentence above, for pre-recording the voice pack (js/phrases.js) ----------
window.dinoMorePhrases = () => {
  const p = [DIG_SAY.start, LU_SAY.start, LU_SAY.full, PK_SAY.start, PK_SAY.done, 'A dino egg!'];
  [1, 2, 3].forEach(n => p.push(DIG_SAY.bone(n)));
  DINOS.forEach(([, , n]) => p.push(DIG_SAY.alive(n)));
  FOODS.forEach(f => p.push(LU_SAY.want(f), LU_SAY.yum(f)));
  for(let i = 1; i <= PEEK_GOAL; i++) p.push(String(i));
  return p;
};

// ---------- launcher: in Dino Land, after Dino Run ----------
const G = window.IdrisPlay.GAMES, sub = { dig: 'Find the bones!', lunch: 'Feed the dino', peekdino: 'Tap & count' };
const at = homeGames.findIndex(h => h.id === 'dinorun') + 1;
homeGames.splice(at, 0, ...['dig', 'lunch', 'peekdino'].map(id => ({ id, e: G[id].e, n: G[id].n, s: sub[id], colors: G[id].colors, cat: 'dino', isNew: true })));
renderHome();
})();
