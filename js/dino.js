// Idris Play — dino pack: Dino Run. The dinosaur runs by itself; tap anywhere to jump over rocks
// and munch leaves and fruit. Bumping a rock never ends the game, it just rolls away. Every 10 treats
// a new dino friend joins. Built on the shared toolkit from js/fun.js (window.IdrisPlay).
(function(){
'use strict';
const { addGame, sfx, celebrate, sparkleAt, el, pick, rand, later, $ } = window.IdrisPlay;

// [emoji, hue shift, name] — the hue shift recolours the emoji so each friend looks different.
// [hue shift, name] — the drawn buddy in a new colour each time
const FRIENDS = window.idrisDrawn.COLOURS.map(([hue, c]) => [hue, c[0].toUpperCase() + c.slice(1) + ' Dino']);
const TREATS = ['leaves', 'watermelon', 'apple', 'banana', 'strawberry', 'broccoli', 'carrot', 'grapes'];
const ROCKS = ['rock', 'rock', 'log', 'cactus'];
const GOAL = 10;

// Everything Dino Run says, so the voice pack can pre-record it (see dinoPhrases).
const SAY = {
  start: 'Dino run! Tap to jump!',
  friend: n => `Here comes ${n}!`,
  full: n => `Yum yum! ${n} is full!`,
  count: n => String(n)
};

addGame({
  id: 'dinorun', e: '🦖', n: 'Dino Run', colors: ['#BBF7D0', '#4ADE80', '#15803D'], stageClass: 'dr-stage', cat: 'dino',
  html: `<div class="dr-sun"></div><div class="dr-volcano"><b></b><i></i></div>
    <div class="dr-far"></div><div class="dr-near"></div><div class="dr-ground"></div>
    <div class="dr-tummy"><span class="dr-tummy-e"></span><div class="dr-bar"><i></i></div><b>0</b></div>
    <div class="dr-dino running"><span></span></div>
    <button class="ng-btn dr-roar" aria-label="Roar"><span class="dr-roar-dino"></span><small>ROAR</small></button>
    <div class="ng-hint">Tap to jump!</div>`,
  init(root){
    this.dino = $('.dr-dino', root); this.face = $('.dr-dino span', root);
    this.bar = $('.dr-bar i', root); this.countEl = $('.dr-tummy b', root); this.hint = $('.ng-hint', root);
    this.objs = []; this.running = false; this.friend = 0; this.eaten = 0; this.total = 0;
    this.jy = 0; this.vy = 0; this.scroll = 0; this.sinceSpawn = 0; this.bonkUntil = 0;
    root.addEventListener('pointerdown', e => {
      if(e.target.closest('.dr-roar')) return;
      this.jump();
    });
    $('.dr-roar', root).addEventListener('click', () => this.roar());
    this.face.addEventListener('animationend', e => { if(e.animationName !== 'drRun') this.dino.classList.remove('pop-in', 'munch', 'bonk', 'roaring'); });
    window.addEventListener('resize', () => { if(currentScreen === 'dinorun') this.size(); });
    this.setFriend(0, false);
  },
  size(){
    const r = this.root.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.ground = Math.round(this.h * 0.2);                   // ground strip height (px from bottom)
    this.D = Math.max(90, Math.min(this.h * 0.24, this.w * 0.2, 190)); // dino size
    this.dinoX = this.w * 0.12;
    this.peak = Math.min(this.h * 0.42, this.D * 2.1);        // how high a jump goes
    const tUp = 0.48;                                         // seconds to the top of a jump
    this.g = 2 * this.peak / (tUp * tUp); this.jumpV = this.g * tUp;
    this.speed = Math.max(170, this.w * 0.3);                 // px per second, slow for little ones
    this.root.style.setProperty('--ground', this.ground + 'px');
    this.dino.style.fontSize = this.D + 'px';
  },
  setFriend(i, announce = true){
    this.friend = i % FRIENDS.length;
    const [hue, name] = FRIENDS[this.friend];
    if(!this.face.firstChild){ this.face.innerHTML = window.idrisPack.img('trex-1'); $('.dr-roar-dino', this.root).innerHTML = window.idrisPack.img('trex-2'); $('.dr-tummy-e', this.root).innerHTML = window.idrisFood('leaves'); }
    this.face.style.filter = hue ? `hue-rotate(${hue}deg) saturate(1.2)` : '';
    this.act('pop-in');
    if(announce){ sfx.boing(); speak(SAY.friend(name)); }
  },
  // One-shot dino animation (munch, bonk, roar, pop-in): only one at a time, cleared when it ends.
  act(cls){
    this.dino.classList.remove('pop-in', 'munch', 'bonk', 'roaring'); void this.dino.offsetWidth;
    this.dino.classList.add(cls);
  },
  jump(){
    if(!this.running) return;
    if(this.jy > this.peak * 0.25) return;                   // already flying high
    this.vy = this.jumpV;
    this.dino.classList.remove('running'); this.dino.classList.add('jumping');
    sfx.boing();
    if(this.hint && this.total + this.jumps > 2){ this.hint.remove(); this.hint = null; }
    this.jumps = (this.jumps || 0) + 1;
  },
  roar(){
    sfx.rumble(0.7); sfx.tone(140, 0.6, 'sawtooth', 0.18, 70);
    speak(pick(['Roar!', 'Roooar!', 'Big dino roar!']));
    this.root.classList.remove('dr-shake'); void this.root.offsetWidth; this.root.classList.add('dr-shake');
    this.act('roaring');
    const v = $('.dr-volcano', this.root); v.classList.remove('puff'); void v.offsetWidth; v.classList.add('puff');
  },
  spawn(){
    const kind = Math.random() < 0.42 ? 'rock' : 'treat';
    const high = kind === 'treat' && Math.random() < 0.5;    // some treats need a jump to reach
    const S = this.D * (kind === 'rock' ? 0.5 : 0.42);
    const o = { kind, x: this.w + S, y: high ? this.peak * rand(0.55, 0.8) : 0, S, e: kind === 'rock' ? pick(ROCKS) : pick(TREATS) };
    o.node = el('div', 'dr-obj ' + kind, kind === 'rock' ? window.idrisDrawn.piece(o.e) : window.idrisFood(o.e));
    o.node.style.fontSize = S + 'px';
    this.root.appendChild(o.node);
    this.objs.push(o);
  },
  eat(o){
    o.done = true; o.node.classList.add('eaten');
    later(() => o.node.remove(), 400);
    sfx.pop(); later(() => sfx.squeak(), 90);
    this.eaten++; this.total++;
    this.countEl.textContent = this.eaten;
    this.bar.style.width = Math.min(100, this.eaten / GOAL * 100) + '%';
    $('.dr-tummy-e', this.root).innerHTML = window.idrisFood(o.e);
    this.act('munch');
    sparkleAt(this.root, this.dinoX + this.D / 2, this.h - this.ground - this.jy - this.D / 2, 3, ['✨', '💚', '⭐']);
    if(this.eaten >= GOAL) return this.full();
    if(this.eaten % 3 === 0) speak(pick(['Yum!', 'Yummy!', 'Munch munch!', 'Crunch!', 'Tasty!']));
    else speak(SAY.count(this.eaten));
  },
  full(){
    const name = FRIENDS[this.friend][1];
    speak(SAY.full(name));
    celebrate('Yum yum!');
    burstConfetti(30);
    this.eaten = 0;
    later(() => { this.countEl.textContent = 0; this.bar.style.width = '0%'; }, 900);
    later(() => { if(currentScreen === 'dinorun') this.setFriend(this.friend + 1); }, 2400);
  },
  bonk(o){
    o.done = true; o.node.classList.add('rolled');
    later(() => o.node.remove(), 900);
    sfx.tone(220, 0.25, 'triangle', 0.25, 110);
    this.bonkUntil = performance.now() + 500;
    this.act('bonk');
    if(Math.random() < 0.6) speak(pick(['Oops! Jump!', 'Bonk! Jump over!', 'Uh oh! Jump!']));
  },
  cleared(o){
    o.done = true;
    if(Math.random() < 0.35) speak(pick(['Jump!', 'Whee!', 'Good jump!', 'Over the rock!']));
    sparkleAt(this.root, o.x, this.h - this.ground - o.S, 2);
  },
  step(dt){
    const slow = performance.now() < this.bonkUntil ? 0.35 : 1;
    const dx = this.speed * dt * slow;
    this.scroll += dx;
    this.root.style.setProperty('--scroll', (-this.scroll).toFixed(1) + 'px');
    // jump physics
    if(this.jy > 0 || this.vy > 0){
      this.vy -= this.g * dt; this.jy += this.vy * dt;
      if(this.jy <= 0){ this.jy = 0; this.vy = 0; this.dino.classList.remove('jumping'); this.dino.classList.add('running'); sfx.tone(120, 0.08, 'sine', 0.15); }
    }
    this.dino.style.transform = `translate(${this.dinoX}px, ${-this.jy}px)`;
    // spawn with enough room between things to land and jump again
    this.sinceSpawn += dx;
    if(this.sinceSpawn > Math.max(this.w * 0.45, this.D * 3.2) * rand(1, 1.5)){ this.sinceSpawn = 0; this.spawn(); }
    // move + collide
    const dl = this.dinoX + this.D * 0.22, dr = this.dinoX + this.D * 0.8, db = this.jy, dt2 = this.jy + this.D * 0.8;
    for(const o of this.objs){
      o.x -= dx;
      o.node.style.transform = `translate(${o.x}px, ${-o.y}px)`;
      if(o.done) continue;
      const ol = o.x + o.S * 0.15, or = o.x + o.S * 0.85, ob = o.y, ot = o.y + o.S * 0.8;
      const hit = ol < dr && or > dl && ob < dt2 && ot > db;
      if(hit && o.kind === 'treat') this.eat(o);
      else if(hit && o.kind === 'rock' && this.jy < o.S * 0.6) this.bonk(o);
      else if(o.kind === 'rock' && or < dl) this.cleared(o);
    }
    this.objs = this.objs.filter(o => { if(o.x < -o.S * 2){ o.node.remove(); return false; } return o.node.isConnected; });
  },
  loop(id, t){
    if(!this.running || id !== this.loopId) return;
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000); this.last = t;
    this.step(dt);
    requestAnimationFrame(t2 => this.loop(id, t2));
  },
  enter(){
    later(() => {
      this.size(); this.running = true; this.last = 0;
      requestAnimationFrame(t => this.loop(this.loopId = (this.loopId || 0) + 1, t));
    }, 60);
    speakNext(SAY.start);
  },
  leave(){
    this.running = false;
    this.objs.forEach(o => o.node.remove()); this.objs = [];
    this.jy = 0; this.vy = 0; this.sinceSpawn = 0;
    this.dino.classList.remove('jumping'); this.dino.classList.add('running');
  }
});

// ---------- every sentence above, for pre-recording the voice pack (js/phrases.js) ----------
window.dinoPhrases = () => {
  const p = [SAY.start];
  FRIENDS.forEach(([, n]) => p.push(SAY.friend(n), SAY.full(n)));
  for(let i = 1; i <= GOAL; i++) p.push(SAY.count(i));
  return p;
};

// ---------- add to the launcher: first, in Dino Land ----------
homeGames.unshift({ id: 'dinorun', e: '🦖', n: 'Dino Run', s: 'Jump & munch!', colors: window.IdrisPlay.GAMES.dinorun.colors, cat: 'dino', isNew: true });
renderHome();
})();
