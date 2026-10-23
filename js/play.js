// Idris Play — play pack: full-screen remakes of Vehicles (traffic light, fire rescue, a parade of
// vehicles), Music (Dino Band with four instruments and play-along songs) and Toy Sorting (toy boxes
// with dinos inside, levels from 2 to 4 colours). Built on the shared toolkit from js/fun.js.
(function(){
'use strict';
const { addGame, sfx, celebrate, sparkleAt, stagePoint, el, pick, rand, later, $ } = window.IdrisPlay;
const progress = (game, fallback) => store.get('play_' + game, fallback);
const saveProgress = (game, value) => store.set('play_' + game, value);
const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
const callSound = name => { try{ if(typeof window[name] === 'function') window[name](); }catch(e){} };

// ======================================================================
// 🚗 VEHICLES — tap a vehicle to send it down the road (with its real recorded sound), work the
// traffic light, put out the fire by tapping the flames, help the ouchie with the ambulance, and
// pick the kids up at the bus stop. Sounds: sounds/*.mp3 (real recordings, see README for credits).
// ======================================================================
// Two rows of 7 buttons, in this order
const VEHICLES = [
  { e: '🚒', n: 'Fire Truck', s: 'Wee-woo! Fire truck!', snd: 'firetruck', job: 'fire' },
  { e: '🚑', n: 'Ambulance', s: 'Nee-naw! Ambulance!', snd: 'ambulance', job: 'ouch' },
  { e: '🚓', n: 'Police Car', s: 'Whoop whoop! Police car!', snd: 'police' },
  { e: '🚌', n: 'Bus', s: 'Beep beep! Bus!', snd: 'bus', job: 'bus', speed: 0.8 },
  { e: '🚜', n: 'Tractor', s: 'Chugga chugga! Tractor!', snd: 'tractor', speed: 0.6 },
  { e: '🚛', n: 'Big Truck', s: 'Big truck! Honk!', snd: 'truck', speed: 0.8 },
  { e: '🚂', n: 'Train', s: 'Choo choo! Train!', snd: 'train', train: true },
  { e: '🚕', n: 'Taxi', s: 'Taxi! Honk honk!', snd: 'horn' },
  { e: '🏎️', n: 'Race Car', s: 'Vroom vroom! Race car!', snd: 'racecar', speed: 1.8 },
  { e: '🏍️', n: 'Motorbike', s: 'Vroom! Motorbike!', snd: 'motorbike', speed: 1.4 },
  { e: '🚲', n: 'Bicycle', s: 'Ring ring! Bicycle!', snd: 'bicycle', speed: 0.6 },
  { e: '🛻', n: 'Pickup', s: 'Pickup truck!', snd: 'pickup' },
  { e: '✈️', n: 'Airplane', s: 'Whoosh! Airplane!', snd: 'airplane', fly: true, flip: true, speed: 1.3 },
  { e: '🚁', n: 'Helicopter', s: 'Helicopter! Whirr!', snd: 'helicopter', fly: true, speed: 0.8 }
];
const VH_SAY = {
  start: 'Beep beep! Tap a vehicle!',
  red: 'Red light! Stop!',
  green: 'Green light! Go!',
  fire: 'Oh no! Fire! Fire truck!',
  hose: 'Tap the fire!',
  out: 'Fire out! Hooray!',
  ouch: 'Ouchie! Ambulance!',
  better: 'All better!',
  board: 'All aboard!'
};
// Real recorded vehicle sounds, decoded once and played through the effects mixer.
const VH_SOUND = { buffers: {}, loading: {} };
// if a recording is missing, a made-up sound plays instead
const VH_FALLBACK = {
  bicycle: () => [0, 180].forEach(d => setTimeout(() => { sfx.tone(2100, 0.35, 'sine', 0.25); sfx.tone(2600, 0.25, 'sine', 0.12); }, d)),
  horn: () => { try{ soundHonk(); }catch(e){} },
  truck: () => { try{ soundVehicleTractor(); }catch(e){} },
  pickup: () => { try{ soundHonk(); }catch(e){} }
};
function vhLoad(id){
  const ctx = getAudioCtx(); if(!ctx) return Promise.resolve(null);
  if(!VH_SOUND.loading[id]) VH_SOUND.loading[id] = fetch(`sounds/${id}.mp3`).then(r => r.ok ? r.arrayBuffer() : Promise.reject())
    .then(a => ctx.decodeAudioData(a)).then(b => { VH_SOUND.buffers[id] = b; return b; }).catch(() => null);
  return VH_SOUND.loading[id];
}
function vhSound(id, vol = 0.9){
  if(muted || !id) return;
  const ctx = getAudioCtx(); if(!ctx) return;
  const play = buf => { const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; g.gain.value = vol; s.connect(g); g.connect(ctx.destination); s.start(); };
  if(VH_SOUND.buffers[id]) return play(VH_SOUND.buffers[id]);
  vhLoad(id).then(b => { if(b) play(b); else (VH_FALLBACK[id] || VH_FALLBACK.horn)(); });
}
addGame({
  id: 'vehicles', e: '🚗', n: 'Vehicles', colors: ['#7DD3FC', '#38BDF8', '#0284C7'], stageClass: 'vh-stage',
  html: `<div class="vh-sun"></div><div class="vh-cloud c1"></div><div class="vh-cloud c2"></div>
    <div class="vh-house"><span class="vh-home">🏠</span><span class="vh-flame f1">🔥</span><span class="vh-flame f2">🔥</span><span class="vh-flame f3">🔥</span></div>
    <div class="vh-ouch"><span class="vh-kid">🧒</span><span class="vh-band">🩹</span></div>
    <div class="vh-stop"><span class="vh-sign">🚏</span><span class="vh-riders"></span></div>
    <div class="vh-trees">🌳🌲🌳</div>
    <div class="vh-road"><i></i></div>
    <button class="vh-light green" aria-label="Traffic light"><b class="r"></b><b class="g"></b></button>
    <div class="vh-bar"></div>
    <div class="ng-hint">Tap a vehicle!</div>`,
  init(root){
    this.bar = $('.vh-bar', root); this.light = $('.vh-light', root); this.house = $('.vh-house', root); this.hint = $('.ng-hint', root);
    this.ouch = $('.vh-ouch', root); this.stop = $('.vh-stop', root); this.riders = $('.vh-riders', root);
    this.cars = []; this.red = false; this.fire = false; this.hurt = false; this.sent = 0;
    // two clearly separate rows of 7
    const rows = { road: el('div', 'vh-row road'), sky: el('div', 'vh-row sky') };
    VEHICLES.forEach((v, i) => {
      const b = el('button', 'ng-btn vh-btn', v.e);
      b.dataset.job = v.job || ''; b.setAttribute('aria-label', v.n);
      b.addEventListener('click', () => this.send(i));
      rows[i < 7 ? 'road' : 'sky'].appendChild(b);
    });
    this.bar.append(rows.road, rows.sky);
    this.light.addEventListener('click', () => this.toggleLight());
    this.house.querySelectorAll('.vh-flame').forEach(f => f.addEventListener('pointerdown', e => { e.stopPropagation(); this.hose(f); }));
    this.fillStop();
  },
  size(){
    const r = this.root.getBoundingClientRect(), road = $('.vh-road', this.root).getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.roadBottom = r.bottom - road.bottom; this.roadH = road.height;
    this.S = Math.max(60, Math.min(this.h * 0.14, 110));
    this.lightX = this.w * 0.55;
    const at = n => { const b = n.getBoundingClientRect(); return { left: b.left - r.left, right: b.right - r.left }; };
    this.houseRight = at(this.house).right;
    this.ouchX = at(this.ouch).left;
    this.stopX = at(this.stop).left;
    this.speed = Math.max(140, this.w * 0.16);
  },
  send(i){
    if(this.cars.length >= 9){ sfx.boing(); return; }
    const v = VEHICLES[i];
    vhSound(v.snd); speak(v.s);
    if(this.hint){ this.hint.remove(); this.hint = null; }
    // the picture sits in a span so flipping it never moves the vehicle itself
    const node = el('div', 'vh-car' + (v.fly ? ' fly' : '') + (v.flip ? ' flip' : ''), `<span>${v.train ? '🚂🚃🚃' : v.e}</span>`);
    node.style.fontSize = (v.fly ? this.S * 0.85 : this.S) + 'px';
    if(v.fly) node.style.top = rand(6, 22) + '%';
    else node.style.bottom = (this.roadBottom + this.roadH * 0.28) + 'px';
    this.root.appendChild(node);
    const c = { v, node, x: this.w + 10, w: 0 };
    c.w = node.getBoundingClientRect().width;
    node.addEventListener('pointerdown', e => { e.stopPropagation(); this.honk(c); });
    this.cars.push(c);
    this.sent++;
    // now and then something happens that a vehicle can help with
    if(this.sent % 4 === 0) later(() => { if(!this.fire && Math.random() < .5) this.startFire(); else if(!this.hurt) this.startOuch(); }, 1500);
  },
  honk(c){ vhSound(c.v.snd, 0.8); restart(c.node, 'honk'); },
  toggleLight(){
    this.red = !this.red;
    this.light.classList.toggle('red', this.red); this.light.classList.toggle('green', !this.red);
    sfx.pop(); speak(this.red ? VH_SAY.red : VH_SAY.green);
  },
  pulse(job, on){ this.bar.querySelector(`.vh-btn[data-job="${job}"]`)?.classList.toggle('pulse', on); },
  // ---- 🔥 fire: the fire truck parks, then he taps each flame to spray it ----
  startFire(){
    if(this.fire || currentScreen !== 'vehicles') return;
    this.fire = true;
    this.house.classList.add('burning');
    this.house.querySelectorAll('.vh-flame').forEach(f => f.classList.add('on'));
    speak(VH_SAY.fire); this.pulse('fire', true);
  },
  arrivedAtFire(c){
    c.parked = true; this.hosing = c;
    this.house.classList.add('ready');
    speak(VH_SAY.hose);
    clearTimeout(this.autoHose);
    this.autoHose = later(() => this.house.querySelectorAll('.vh-flame.on').forEach((f, i) => later(() => this.hose(f), i * 600)), 7000);
  },
  hose(f){
    if(!this.hosing || !f.classList.contains('on')) return;
    const sr = this.root.getBoundingClientRect(), fr = f.getBoundingClientRect(), c = this.hosing;
    const sx = c.x + 10, sy = sr.height - (this.roadBottom + this.roadH * 0.28 + this.S * 0.7);
    for(let i = 0; i < 6; i++) later(() => {
      const d = el('div', 'vh-water', '💧');
      d.style.left = sx + 'px'; d.style.top = sy + 'px';
      d.style.setProperty('--dx', (fr.left - sr.left + fr.width / 2 - sx) + 'px');
      d.style.setProperty('--dy', (fr.top - sr.top + fr.height / 2 - sy) + 'px');
      this.root.appendChild(d); later(() => d.remove(), 800);
    }, i * 60);
    sfx.splash();
    later(() => { f.classList.remove('on'); f.classList.add('out'); sparkleAt(this.root, fr.left - sr.left + fr.width / 2, fr.top - sr.top, 4, ['💧', '✨']); this.checkFire(); }, 450);
  },
  checkFire(){
    if(this.house.querySelector('.vh-flame.on') || !this.fire) return;
    clearTimeout(this.autoHose);
    this.fire = false; this.house.classList.remove('burning', 'ready');
    this.house.querySelectorAll('.vh-flame').forEach(f => f.classList.remove('out'));
    speak(VH_SAY.out); burstConfetti(30); this.pulse('fire', false);
    const c = this.hosing; this.hosing = null;
    later(() => { if(c){ c.parked = false; c.done = true; } }, 900);
  },
  // ---- 🚑 ouchie: the ambulance stops, puts on a plaster, all better ----
  startOuch(){
    if(this.hurt || currentScreen !== 'vehicles') return;
    this.hurt = true; this.ouch.className = 'vh-ouch hurt';
    speak(VH_SAY.ouch); this.pulse('ouch', true);
  },
  arrivedAtOuch(c){
    c.parked = true; vhSound('ambulance', 0.5);
    later(() => { this.ouch.className = 'vh-ouch fixed'; sfx.tada(); speak(VH_SAY.better); burstConfetti(16); this.pulse('ouch', false); }, 900);
    later(() => { c.parked = false; c.done = true; this.hurt = false; }, 2200);
    later(() => { if(!this.hurt) this.ouch.className = 'vh-ouch'; }, 4200);
  },
  // ---- 🚌 bus stop: the bus stops and the kids hop on ----
  fillStop(){ this.riders.innerHTML = ['🧒', '👧', '👦'].slice(0, 2 + Math.floor(Math.random() * 2)).map(k => `<i>${k}</i>`).join(''); },
  arrivedAtStop(c){
    c.parked = true;
    [...this.riders.children].forEach((k, i) => later(() => { k.classList.add('hop'); sfx.boing(); }, 300 + i * 350));
    later(() => speak(VH_SAY.board), 300);
    later(() => { c.parked = false; c.done = true; vhSound('bus', 0.6); }, 1800);
    later(() => { if(currentScreen === 'vehicles') this.fillStop(); }, 6000);
  },
  step(dt){
    const road = this.cars.filter(c => !c.v.fly).sort((a, b) => a.x - b.x);
    for(const c of this.cars){
      let nx = c.x - this.speed * (c.v.speed || 1) * dt;
      if(!c.v.fly){
        let limit = -Infinity;
        if(this.red && c.x >= this.lightX + 8) limit = this.lightX + 8;
        const ahead = road.filter(a => a !== c && a.x < c.x).pop();
        if(ahead) limit = Math.max(limit, ahead.x + ahead.w + 14);
        // places where a vehicle with a job stops
        const job = c.v.job, free = !c.done && !c.parked;
        const stopAt = job === 'fire' && this.fire && free ? this.houseRight + 6
          : job === 'ouch' && this.hurt && free ? this.ouchX
          : job === 'bus' && free && this.riders.children.length ? this.stopX : null;
        if(stopAt !== null && c.x >= stopAt) limit = Math.max(limit, stopAt);
        if(c.parked) limit = c.x;
        nx = Math.max(nx, Math.min(limit, c.x));
        if(stopAt !== null && nx <= stopAt + 1 && !c.parked){
          if(job === 'fire') this.arrivedAtFire(c); else if(job === 'ouch') this.arrivedAtOuch(c); else this.arrivedAtStop(c);
        }
      }
      c.node.classList.toggle('waiting', nx === c.x);
      c.x = nx;
      c.node.style.transform = `translateX(${c.x}px)`;
    }
    this.cars = this.cars.filter(c => { if(c.x < -c.w - 30){ c.node.remove(); return false; } return true; });
  },
  loop(id, t){
    if(!this.running || id !== this.loopId) return;
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000); this.last = t;
    this.step(dt);
    requestAnimationFrame(t2 => this.loop(id, t2));
  },
  enter(){
    later(() => { this.size(); this.running = true; this.last = 0; requestAnimationFrame(t => this.loop(this.loopId = (this.loopId || 0) + 1, t)); }, 60);
    speakNext(VH_SAY.start);
    VEHICLES.forEach(v => vhLoad(v.snd));   // get the sounds ready so the first tap is instant
  },
  leave(){
    this.running = false; clearTimeout(this.autoHose);
    this.cars.forEach(c => c.node.remove()); this.cars = []; this.hosing = null;
    this.fire = false; this.hurt = false;
    this.house.classList.remove('burning', 'ready'); this.house.querySelectorAll('.vh-flame').forEach(f => f.classList.remove('on', 'out'));
    this.ouch.className = 'vh-ouch'; this.fillStop();
    this.root.querySelectorAll('.vh-water').forEach(n => n.remove());
    this.bar.querySelectorAll('.vh-btn').forEach(b => b.classList.remove('pulse'));
  }
});

// ======================================================================
// 🎵 MUSIC — Dino Band: 8 big keys, 4 instruments, play-along songs
// ======================================================================
const NOTES = [262, 294, 330, 349, 392, 440, 494, 523];
const KEY_COLORS = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'];
const INSTRUMENTS = [
  { id: 'piano', e: '🎹', say: 'Piano!' },
  { id: 'xylo', e: '🎶', say: 'Xylophone!' },
  { id: 'drums', e: '🥁', say: 'Drums!' },
  { id: 'roar', e: '🦖', say: 'Dino roars!' }
];
const DRUM_ICONS = ['🥁', '🪘', '✨', '🥁', '🪘', '👏', '🔔', '💥'];
const SONGS = [
  { n: 'Twinkle Twinkle', notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
  { n: 'Mary Had a Little Lamb', notes: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4, 2, 1, 0, 1, 2, 2, 2, 2, 1, 1, 2, 1, 0] },
  { n: 'Row Row Row Your Boat', notes: [0, 0, 0, 1, 2, 2, 1, 2, 3, 4, 7, 7, 7, 4, 4, 4, 2, 2, 2, 0, 0, 0, 4, 3, 2, 1, 0] }
];
const MU_SAY = {
  start: 'Dino band! Tap the keys to make music!',
  songStart: s => `Let's play ${s.n}! Tap the shining key!`,
  songDone: s => `You played ${s.n}! Hooray!`
};
function playInstrument(inst, i){
  const f = NOTES[i];
  if(inst === 'piano'){ sfx.tone(f, 1.3, 'triangle', 0.38); sfx.tone(f * 2, 0.7, 'sine', 0.12); }
  else if(inst === 'xylo'){ sfx.tone(f * 2, 0.7, 'sine', 0.4); sfx.tone(f * 8, 0.05, 'sine', 0.12); }
  else if(inst === 'roar'){ sfx.tone(f / 2, 0.55, 'sawtooth', 0.16, f / 4); sfx.noise(0.45, 0.25, 300 + i * 60, 'lowpass'); }
  else switch(i){
    case 0: sfx.tone(150, 0.4, 'sine', 0.6, 45); break;                                   // kick
    case 1: sfx.noise(0.18, 0.45, 1800); sfx.tone(190, 0.1, 'triangle', 0.2); break;      // snare
    case 2: sfx.noise(0.06, 0.35, 7000, 'highpass'); break;                               // hi-hat
    case 3: sfx.tone(210, 0.35, 'sine', 0.5, 90); break;                                  // low tom
    case 4: sfx.tone(300, 0.3, 'sine', 0.5, 140); break;                                  // high tom
    case 5: [0, 25, 50].forEach(d => setTimeout(() => sfx.noise(0.05, 0.4, 1400), d)); break; // clap
    case 6: sfx.tone(560, 0.3, 'square', 0.12); sfx.tone(845, 0.3, 'square', 0.1); break; // bell
    default: sfx.noise(0.9, 0.35, 5000, 'highpass');                                      // crash
  }
}
addGame({
  id: 'music', e: '🎵', n: 'Dino Band', colors: ['#C4B5FD', '#8B5CF6', '#6D28D9'], stageClass: 'mu-stage',
  html: `<div class="mu-lights"><i></i><i></i><i></i></div>
    <div class="mu-band"><span class="mu-dino d0">🦖</span><span class="mu-dino d1">🦕</span><span class="mu-dino d2">🐲</span></div>
    <div class="mu-tools"></div>
    <div class="mu-keys"></div>`,
  init(root){
    this.keys = $('.mu-keys', root); this.tools = $('.mu-tools', root); this.band = [...root.querySelectorAll('.mu-dino')];
    this.inst = 'piano'; this.song = null; this.hits = 0;
    NOTES.forEach((f, i) => {
      const k = el('div', 'mu-key', `<span class="mu-ico"></span>`);
      k.style.setProperty('--c', KEY_COLORS[i]); k.style.setProperty('--h', (100 - i * 6) + '%'); k.dataset.i = i;
      this.keys.appendChild(k);
    });
    INSTRUMENTS.forEach(ins => {
      const b = el('button', 'ng-btn mu-inst', ins.e); b.dataset.inst = ins.id; b.setAttribute('aria-label', ins.say);
      b.addEventListener('click', () => this.setInst(ins.id));
      this.tools.appendChild(b);
    });
    const sb = el('button', 'ng-btn mu-song', '⭐🎵'); sb.setAttribute('aria-label', 'Play a song');
    sb.addEventListener('click', () => this.startSong());
    this.tools.appendChild(sb);
    // tap or slide a finger across the keys
    let down = false, lastKey = -1;
    const hit = e => {
      const k = document.elementFromPoint(e.clientX, e.clientY)?.closest('.mu-key');
      if(!k || +k.dataset.i === lastKey) return;
      lastKey = +k.dataset.i; this.play(lastKey);
    };
    this.keys.addEventListener('pointerdown', e => { down = true; lastKey = -1; try{ this.keys.releasePointerCapture(e.pointerId); }catch(_){} hit(e); });
    this.keys.addEventListener('pointermove', e => { if(down) hit(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => this.keys.addEventListener(t, () => { down = false; lastKey = -1; }));
    this.setInst('piano', false);
  },
  setInst(id, say = true){
    this.inst = id;
    this.tools.querySelectorAll('.mu-inst').forEach(b => b.classList.toggle('on', b.dataset.inst === id));
    this.keys.querySelectorAll('.mu-key').forEach((k, i) => {
      k.querySelector('.mu-ico').textContent = id === 'drums' ? DRUM_ICONS[i] : id === 'roar' ? '🦖' : '♪';
    });
    this.root.classList.toggle('drums', id === 'drums');
    if(say){ sfx.pop(); speak(INSTRUMENTS.find(i => i.id === id).say); playInstrument(id, 4); }
  },
  play(i){
    playInstrument(this.inst, i);
    const k = this.keys.children[i];
    restart(k, 'hit');
    // a note floats up from the key
    const kr = k.getBoundingClientRect(), sr = this.root.getBoundingClientRect();
    const n = el('div', 'mu-note', this.inst === 'roar' ? pick(['🦖', '💥', '🔊']) : pick(['♪', '♫', '♬']));
    n.style.left = (kr.left - sr.left + kr.width / 2) + 'px'; n.style.top = (kr.top - sr.top) + 'px';
    n.style.color = KEY_COLORS[i]; n.style.setProperty('--dx', rand(-60, 60) + 'px');
    this.root.appendChild(n); later(() => n.remove(), 1400);
    const d = this.band[i % 3]; restart(d, 'bop');
    this.hits++;
    if(this.song) this.songStep(i);
  },
  startSong(){
    const s = SONGS[(this.songIdx = ((this.songIdx ?? -1) + 1) % SONGS.length)];
    this.song = s; this.pos = 0;
    speak(MU_SAY.songStart(s));
    this.glow();
  },
  glow(){
    this.keys.querySelectorAll('.mu-key').forEach(k => k.classList.remove('next'));
    if(this.song) this.keys.children[this.song.notes[this.pos]].classList.add('next');
  },
  songStep(i){
    if(i !== this.song.notes[this.pos]) return;
    this.pos++;
    if(this.pos >= this.song.notes.length){
      const s = this.song; this.song = null; this.glow();
      this.band.forEach(d => d.classList.add('party')); later(() => this.band.forEach(d => d.classList.remove('party')), 2600);
      later(() => { speak(MU_SAY.songDone(s)); celebrate('Bravo!'); burstConfetti(30); }, 500);
      return;
    }
    this.glow();
  },
  enter(){ speakNext(MU_SAY.start); },
  leave(){ this.song = null; this.glow(); }
});

// ======================================================================
// 🎯 TOY SORTING — put each toy in the box of its colour; a dino in the box cheers
// ======================================================================
const SORT_COLORS = {
  red: { hex: '#EF4444', light: '#FEE2E2', hue: -120, items: ['🍎', '🍓', '🚗', '🎈', '🍒', '🍅', '❤️', '🌶️'] },
  blue: { hex: '#3B82F6', light: '#DBEAFE', hue: 95, items: ['🐳', '💧', '🧢', '🫐', '🚙', '💙', '🐋', '🧊'] },
  yellow: { hex: '#EAB308', light: '#FEF9C3', hue: -60, items: ['⭐', '🌻', '🍋', '🐥', '🍌', '💛', '🌙', '🧀'] },
  green: { hex: '#22C55E', light: '#DCFCE7', hue: 0, items: ['🐸', '🥦', '🌳', '🍏', '🥒', '💚', '🍀', '🐢'] }
};
const SORT_LEVELS = [{ colors: 2, count: 6 }, { colors: 3, count: 8 }, { colors: 4, count: 10 }];
const SO_SAY = {
  start: 'Put each toy in the box with the same colour!',
  color: c => c[0].toUpperCase() + c.slice(1) + '!',
  hint: c => `It is ${c}!`,
  done: 'All sorted! Hooray!'
};
addGame({
  id: 'sorting', e: '🎯', n: 'Toy Sorting', colors: ['#FDE68A', '#FBBF24', '#D97706'], stageClass: 'so-stage', cat: '123',
  html: `<div class="lr-level">⭐ <b>1</b></div><div class="so-count"></div>
    <div class="so-spot"></div><div class="so-boxes"></div><div class="ng-hint">👆 Drag the toy to its box!</div>`,
  init(root){
    this.spot = $('.so-spot', root); this.boxes = $('.so-boxes', root); this.countEl = $('.so-count', root);
    this.level = progress('sorting', 0);
    // drag the toy, or tap a box
    root.addEventListener('pointerdown', e => {
      const item = e.target.closest('.so-item');
      if(item && !this.busy){
        this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
        try{ root.setPointerCapture(e.pointerId); }catch(_){}
        item.classList.add('held'); return;
      }
      const box = e.target.closest('.so-box');
      if(box && this.item && !this.busy) this.tryBox(box);
    });
    root.addEventListener('pointermove', e => {
      if(!this.drag || e.pointerId !== this.drag.id) return;
      const dx = e.clientX - this.drag.x0, dy = e.clientY - this.drag.y0;
      if(Math.hypot(dx, dy) > 8) this.drag.moved = true;
      this.item.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
      const box = this.boxAt(e.clientX, e.clientY);
      this.boxes.querySelectorAll('.so-box').forEach(b => b.classList.toggle('over', b === box));
    });
    const up = e => {
      if(!this.drag || e.pointerId !== this.drag.id) return;
      const moved = this.drag.moved; this.drag = null;
      this.item.classList.remove('held');
      this.boxes.querySelectorAll('.so-box').forEach(b => b.classList.remove('over'));
      const box = this.boxAt(e.clientX, e.clientY);
      if(box) this.tryBox(box);
      else { this.item.style.transform = ''; if(!moved) speak(SO_SAY.hint(this.item.dataset.color)); }
    };
    root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  },
  boxAt(x, y){ return [...this.boxes.querySelectorAll('.so-box')].find(b => { const r = b.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top - 30 && y <= r.bottom; }); },
  setup(){
    const L = SORT_LEVELS[Math.min(this.level, SORT_LEVELS.length - 1)];
    $('.lr-level b', this.root).textContent = this.level + 1;
    const cols = Object.keys(SORT_COLORS).sort(() => Math.random() - .5).slice(0, L.colors);
    this.boxes.innerHTML = '';
    cols.forEach(c => {
      const C = SORT_COLORS[c];
      const b = el('div', 'so-box', `<div class="so-dino">🦖</div><div class="so-front"><div class="so-pile"></div></div>`);
      b.dataset.color = c; b.style.setProperty('--c', C.hex); b.style.setProperty('--l', C.light);
      $('.so-dino', b).style.filter = C.hue ? `hue-rotate(${C.hue}deg) saturate(1.3)` : '';
      this.boxes.appendChild(b);
    });
    this.queue = [];
    for(let k = 0; k < L.count; k++){ const c = cols[k % cols.length]; this.queue.push([c, pick(SORT_COLORS[c].items)]); }
    this.queue.sort(() => Math.random() - .5);
    this.total = L.count; this.done = 0; this.wrong = 0;
    this.next();
  },
  next(){
    this.countEl.textContent = '🧸 ' + this.done + ' / ' + this.total;
    if(!this.queue.length) return this.finish();
    const [c, e] = this.queue.shift();
    this.spot.innerHTML = '';
    this.item = el('div', 'so-item pop-in', e); this.item.dataset.color = c;
    this.spot.appendChild(this.item);
    this.busy = false; this.wrong = 0;
  },
  tryBox(box){
    const want = this.item.dataset.color;
    if(box.dataset.color !== want){
      this.wrong++;
      sfx.tone(220, 0.25, 'triangle', 0.25, 160);
      restart(box, 'nope');
      this.item.style.transform = '';
      restart(this.item, 'lr-wiggle');
      speak(this.wrong >= 2 ? SO_SAY.hint(want) : pick(['Oops! Try another box!', 'Not this one!']));
      if(this.wrong >= 2) restart(this.boxes.querySelector(`.so-box[data-color="${want}"]`), 'help');
      return;
    }
    this.busy = true;
    const ir = this.item.getBoundingClientRect(), br = box.getBoundingClientRect();
    const cur = this.item.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/) || [0, 0, 0];
    this.item.style.transition = 'transform .45s cubic-bezier(.5,-0.3,.6,1)';
    this.item.style.transform = `translate(${+cur[1] + br.left + br.width / 2 - ir.left - ir.width / 2}px, ${+cur[2] + br.top + br.height * 0.55 - ir.top - ir.height / 2}px) scale(.4)`;
    sfx.boing(); speak(SO_SAY.color(want));
    $('.ng-hint', this.root)?.remove();
    later(() => {
      const pile = $('.so-pile', box); pile.appendChild(el('span', null, this.item.textContent));
      while(pile.children.length > 4) pile.firstChild.remove();
      this.item.remove(); this.item = null;
      restart(box, 'yum'); sfx.pop(); later(() => sfx.squeak(), 120);
      sparkleAt(this.root, br.left - this.root.getBoundingClientRect().left + br.width / 2, br.top - this.root.getBoundingClientRect().top, 4);
      this.done++;
      later(() => this.next(), 350);
    }, 460);
  },
  finish(){
    this.spot.innerHTML = '';
    this.boxes.querySelectorAll('.so-box').forEach(b => b.classList.add('party'));
    speak(SO_SAY.done); celebrate('Sorted!'); burstConfetti(30);
    this.level++; saveProgress('sorting', this.level);
    later(() => { if(currentScreen === 'sorting') this.setup(); }, 3200);
  },
  enter(){ this.setup(); speakNext(SO_SAY.start); },
  leave(){ this.drag = null; }
});

// ---------- every sentence above, for pre-recording the voice pack (js/phrases.js) ----------
window.playPhrases = () => {
  const p = [...Object.values(VH_SAY), MU_SAY.start, SO_SAY.start, SO_SAY.done];
  VEHICLES.forEach(v => p.push(v.s));
  SONGS.forEach(s => p.push(MU_SAY.songStart(s), MU_SAY.songDone(s)));
  INSTRUMENTS.forEach(i => p.push(i.say));
  Object.keys(SORT_COLORS).forEach(c => p.push(SO_SAY.color(c), SO_SAY.hint(c)));
  return p;
};

// ---------- launcher: these replace the old Vehicles, Music Garden and Toy Sorting pages ----------
const G = window.IdrisPlay.GAMES;
for(const id of ['vehicles', 'music', 'sorting']){
  const h = homeGames.find(x => x.id === id);
  if(h) Object.assign(h, { e: G[id].e, n: G[id].n, colors: G[id].colors });
}
renderHome();
})();
