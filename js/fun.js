// Idris Play — fun pack: sound effects, celebrations, animated home, daily gift and six new games.
// Loaded after the main inline script, so it can use its globals (speak, blip, getAudioCtx, muted,
// burstConfetti, homeGames, renderHome, switchTab, store, addStar, currentScreen, kidName).
(function(){
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
const later = (fn, ms) => setTimeout(() => { try{ fn(); }catch(e){ console.error(e); } }, ms);

// ===================== 🔊 Sound effects =====================
const sfx = {
  tone(freq, dur, type = 'sine', vol = 0.3, slideTo){
    if(muted) return;
    const ctx = getAudioCtx(); if(!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.3, freq = 1200, type = 'bandpass'){
    if(muted) return;
    const ctx = getAudioCtx(); if(!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    src.buffer = buf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(t);
  },
  pop(){ this.tone(rand(500, 700), 0.12, 'sine', 0.35, 1400); },
  boing(){ this.tone(170, 0.45, 'triangle', 0.35, 560); },
  whoosh(){ this.noise(0.5, 0.3, 900); },
  crack(){ this.noise(0.1, 0.6, 2600, 'highpass'); this.tone(320, 0.08, 'square', 0.12, 180); },
  splash(){ this.noise(0.35, 0.3, 1600); },
  squeak(){ this.tone(rand(1200, 1700), 0.08, 'sine', 0.12, rand(1800, 2200)); },
  tada(){ [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, 'triangle', 0.3), i * 110)); },
  giggle(){ for(let i = 0; i < 5; i++) setTimeout(() => this.tone(rand(700, 1000), 0.09, 'sine', 0.25, rand(1000, 1400)), i * 85); },
  boom(){ this.noise(0.9, 0.55, 260, 'lowpass'); this.tone(110, 0.5, 'sine', 0.35, 40); },
  rumble(dur){ this.noise(dur, 0.45, 180, 'lowpass'); },
  plink(i){ const s = [523, 587, 659, 784, 880, 1047, 1175]; this.tone(s[((i % s.length) + s.length) % s.length], 0.35, 'triangle', 0.28); },
  rise(){ this.tone(300, 0.6, 'sine', 0.2, 1200); }
};
window.sfx = sfx;

// ===================== 🎉 Celebration overlay =====================
const cel = el('div', 'cel', '<div class="cel-rays"></div><div class="cel-box"><div class="cel-mascot">🦁</div><div class="cel-text">Hooray!</div></div>');
document.body.appendChild(cel);
let celAt = 0, celTimer = null;
function celebrate(text){
  const now = Date.now();
  if(now - celAt < 4000) return;
  celAt = now;
  $('.cel-text', cel).textContent = text || pick(['Hooray!', 'Yay!', 'Great job!', 'Super!', 'Wow!', 'Amazing!']);
  $('.cel-mascot', cel).textContent = pick(['🦁', '🐻', '🐰', '🐶', '🐼', '🦄']);
  cel.classList.add('show');
  sfx.tada();
  clearTimeout(celTimer);
  celTimer = setTimeout(() => cel.classList.remove('show'), 1700);
}
window.celebrate = celebrate;
// Big confetti moments in every game (wins, completions) get the full celebration.
const _bc = burstConfetti;
burstConfetti = function(n, color){ _bc(n, color); if(n >= 28) celebrate(); };

// ===================== 🌤️ Animated home scene =====================
document.body.insertBefore(el('div', 'home-scene',
  '<div class="hs-sun"></div><div class="hs-cloud c1"></div><div class="hs-cloud c2"></div><div class="hs-cloud c3"></div>' +
  '<div class="hs-bird">🐦</div><div class="hs-hills"><i></i><i></i><i></i></div>'), document.body.firstChild);
const scene = $('.home-scene'); scene.setAttribute('aria-hidden', 'true');

// ===================== 🎁 Daily surprise gift =====================
function renderGift(){
  const hero = $('.home-hero'); if(!hero) return;
  let g = $('.gift-btn', hero);
  const claimed = store.get('gift', '') === todayKey();
  if(claimed){ if(g) g.remove(); return; }
  if(!g){
    g = el('button', 'gift-btn', '🎁'); g.setAttribute('aria-label', 'Surprise present');
    g.onclick = openGift;
    hero.insertBefore(g, $('.star-pill', hero));
  }
}
function openGift(){
  const g = $('.gift-btn'); if(!g || g.classList.contains('opening')) return;
  g.classList.add('opening'); sfx.rise();
  later(() => {
    store.set('gift', todayKey());
    g.textContent = '✨'; sfx.tada(); _bc(40);
    speak('A present for you, ' + kidName + '! Three stars!');
    const from = gPos(g);
    [0, 1, 2].forEach(i => later(() => { lastPointer = from; addStar(true); }, 300 + i * 950));
    later(() => g.remove(), 1200);
  }, 750);
}
function gPos(node){ const r = node.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

// ===================== 🎮 New games registry =====================
const GAMES = {};
window.idrisGames = GAMES;  // handy for debugging from the console
function addGame(def){
  GAMES[def.id] = def;
  const s = el('section', 'kid-section ng-section');
  s.id = 'sec-' + def.id;
  s.innerHTML = `<div style="display:none"><h2 class="section-title">${def.e} ${def.n}</h2></div><div class="ng-stage ${def.stageClass}">${def.html}</div>`;
  $('.wrap').appendChild(s);
  def.root = $('.ng-stage', s);
  try{ def.init && def.init(def.root); }catch(e){ console.error('init ' + def.id, e); }
}
function themeFor(id){
  const h = homeGames.find(g => g.id === id);
  if(h && h.colors) return h.colors[1];
  const i = homeGames.indexOf(h);
  return i >= 0 ? ICON_COLORS[i % ICON_COLORS.length][1] : '#FFD93D';
}
// Wrap navigation so new games get enter/leave hooks and every game gets its own colour theme.
const _switchTab = switchTab;
switchTab = function(name){
  const prev = currentScreen;
  if(prev !== name && GAMES[prev]){ try{ GAMES[prev].leave && GAMES[prev].leave(); }catch(e){ console.error(e); } }
  _switchTab(name);
  document.body.style.setProperty('--theme', themeFor(name));
  document.body.classList.toggle('ng-game', !!GAMES[name]);
  if(GAMES[name]){ try{ GAMES[name].enter && GAMES[name].enter(); }catch(e){ console.error(e); } }
  if(name === 'home') renderGift();
};

// Shared helpers for games
function stagePoint(root, e){ const r = root.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; }
function sparkleAt(root, x, y, n = 6, chars = ['✨', '⭐', '💫']){
  for(let i = 0; i < n; i++){
    const s = el('div', 'sparkle-star', pick(chars));
    s.style.left = (x + rand(-90, 90)) + 'px'; s.style.top = (y + rand(-90, 90)) + 'px';
    s.style.animationDelay = (i * 70) + 'ms';
    root.appendChild(s); later(() => s.remove(), 1500);
  }
}

// ===================== 🥚 Surprise Eggs =====================
const BABIES = [['🐥','chick'],['🦖','dinosaur'],['🦕','long neck dinosaur'],['🐢','turtle'],['🐊','crocodile'],['🐧','penguin'],['🦜','parrot'],['🦉','owl'],['🦆','duckling'],['🐲','dragon'],['🦄','unicorn'],['🐍','snake'],['🦩','flamingo'],['🐸','frog'],['🦎','lizard'],['🐙','octopus'],['🐳','whale'],['🦔','hedgehog']];
const EGG_LOOKS = [
  ['#FFE4F1', 'radial-gradient(circle at 30% 30%,#FF8FC7 0 9%,transparent 10%),radial-gradient(circle at 70% 55%,#FF8FC7 0 11%,transparent 12%),radial-gradient(circle at 40% 78%,#FF8FC7 0 8%,transparent 9%)'],
  ['#DDF4FF', 'repeating-linear-gradient(160deg,transparent 0 18px,#7CC8FF 18px 30px)'],
  ['#FFF4C2', 'radial-gradient(circle at 25% 40%,#FFB020 0 6%,transparent 7%),radial-gradient(circle at 60% 25%,#FFB020 0 7%,transparent 8%),radial-gradient(circle at 70% 70%,#FFB020 0 6%,transparent 7%),radial-gradient(circle at 35% 75%,#FFB020 0 5%,transparent 6%)'],
  ['#E6FCE6', 'repeating-linear-gradient(0deg,transparent 0 22px,#6BCB77 22px 30px)'],
  ['#F1E6FF', 'radial-gradient(circle at 50% 50%,transparent 0 18%,#B57BFF 18% 24%,transparent 24% 36%,#B57BFF 36% 42%,transparent 42%)'],
  ['#FFE9DC', 'repeating-linear-gradient(45deg,transparent 0 14px,#FF9D5C 14px 22px),repeating-linear-gradient(-45deg,transparent 0 14px,rgba(255,157,92,.5) 14px 22px)']
];
addGame({
  id: 'eggs', e: '🥚', n: 'Surprise Eggs', colors: ['#FFF3B0', '#FFD93D', '#E0A800'], stageClass: 'egg-stage',
  html: `<div class="egg-shelf"></div>
    <div class="egg-center"><div class="egg"><svg viewBox="0 0 100 128" preserveAspectRatio="none">
      <polyline points="30,40 38,48 33,56 42,62"/><polyline points="62,36 56,46 64,54 58,64 66,70"/>
      <polyline points="8,66 22,60 30,70 44,62 56,72 70,62 82,70 94,64"/></svg></div><div class="egg-nest"></div></div>
    <div class="egg-baby"></div><div class="ng-hint">👆 Tap tap tap the egg!</div>`,
  init(root){
    this.egg = $('.egg', root); this.baby = $('.egg-baby', root); this.shelf = $('.egg-shelf', root);
    this.hatched = 0;
    this.egg.addEventListener('pointerdown', e => this.tap(e));
    this.newEgg(false);
  },
  newEgg(roll = true){
    this.taps = 0; this.busy = false;
    const [base, pat] = pick(EGG_LOOKS);
    this.egg.className = 'egg' + (roll ? ' roll-in' : '');
    this.egg.querySelectorAll('.egg-half').forEach(h => h.remove());
    this.egg.style.background = `${pat},${base}`;
    this.egg.querySelectorAll('polyline').forEach(p => p.classList.remove('show'));
    if(roll) sfx.boing();
  },
  tap(e){
    if(this.busy) return;
    this.taps++;
    this.egg.classList.remove('wobble', 'roll-in'); void this.egg.offsetWidth; this.egg.classList.add('wobble');
    sfx.crack();
    const lines = this.egg.querySelectorAll('polyline');
    if(this.taps <= 3) lines[this.taps - 1].classList.add('show');
    if(this.taps === 1) speak('Crack!');
    if(this.taps >= 4) this.hatch();
  },
  hatch(){
    this.busy = true;
    const [emoji, name] = pick(BABIES);
    ['top', 'bot'].forEach(c => this.egg.appendChild(el('div', 'egg-half ' + c)));
    this.egg.classList.add('cracked');
    this.egg.querySelectorAll('.egg-half').forEach(h => { h.style.background = this.egg.style.background; });
    sfx.crack(); later(() => sfx.pop(), 120); later(() => sfx.boing(), 250);
    this.baby.textContent = emoji;
    this.baby.className = 'egg-baby'; void this.baby.offsetWidth; this.baby.classList.add('show');
    this.hatched++;
    burstConfetti(this.hatched % 5 === 0 ? 30 : 16);
    later(() => speak('Wow! A baby ' + name + '!'), 250);
    later(() => {
      this.baby.classList.add('fly');
      later(() => {
        const s = el('span', null, emoji); this.shelf.appendChild(s);
        while(this.shelf.children.length > 12) this.shelf.firstChild.remove();
        this.baby.className = 'egg-baby'; this.newEgg(true);
      }, 700);
    }, 2600);
  },
  enter(){ later(() => speak('Tap the egg! What is inside?'), 900); }
});

// ===================== 🛁 Bath Time =====================
const PETS = [['🐶','puppy'],['🐷','piggy'],['🐱','kitty'],['🐻','bear'],['🐼','panda'],['🐵','monkey'],['🐰','bunny'],['🐯','tiger'],['🐮','cow'],['🐨','koala'],['🦁','lion'],['🐸','froggy']];
addGame({
  id: 'bath', e: '🛁', n: 'Bath Time', colors: ['#A5F3FC', '#22D3EE', '#0891B2'], stageClass: 'bath-stage',
  html: `<div class="bath-meter"><i></i></div>
    <div class="bath-pet dirty"><span class="pet-emoji">🐶</span></div>
    <div class="bath-tub"></div>
    <div class="bath-tools"><button class="ng-btn bath-tool active" data-tool="sponge" aria-label="Sponge">🧽</button><button class="ng-btn bath-tool" data-tool="shower" aria-label="Shower">🚿</button></div>
    <div class="ng-hint">🧽 Rub rub rub the mud!</div>`,
  init(root){
    this.pet = $('.bath-pet', root); this.meter = $('.bath-meter i', root); this.hint = $('.ng-hint', root);
    this.tool = 'sponge';
    root.querySelectorAll('.bath-tool').forEach(b => b.addEventListener('click', () => this.setTool(b.dataset.tool)));
    let down = false;
    root.addEventListener('pointerdown', e => { if(e.target.closest('.bath-tool')) return; down = true; this.rub(e); });
    root.addEventListener('pointermove', e => { if(down || e.pointerType === 'touch') this.rub(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => root.addEventListener(ev, () => { down = false; }));
    this.newPet();
  },
  setTool(t){
    this.tool = t; sfx.pop();
    this.root.querySelectorAll('.bath-tool').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
    if(t === 'shower'){ this.root.querySelector('[data-tool=shower]').classList.remove('pulse'); if(this.phase === 'rinse') this.shower(); else speak('Shower!'); }
  },
  newPet(){
    const [emoji, name] = pick(PETS);
    this.name = name; this.phase = 'scrub'; this.lastSqueak = 0;
    this.pet.className = 'bath-pet dirty';
    this.pet.innerHTML = `<span class="pet-emoji pop-in">${emoji}</span>`;
    this.spots = [];
    for(let i = 0; i < 9; i++){
      const m = el('div', 'mud'), size = rand(11, 18);
      const x = rand(20, 80 - size), y = rand(18, 72 - size);
      Object.assign(m.style, { width: size + '%', height: size * rand(.8, 1.1) + '%', left: x + '%', top: y + '%', transform: `rotate(${rand(0, 360)}deg)` });
      m.dirt = 1; m.cx = x + size / 2; m.cy = y + size / 2;
      this.pet.appendChild(m); this.spots.push(m);
    }
    this.setTool('sponge');
    this.hint.textContent = '🧽 Rub rub rub the mud!';
    this.updateMeter();
  },
  rub(e){
    const r = this.pet.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * 100, py = (e.clientY - r.top) / r.height * 100;
    if(px < 0 || px > 100 || py < 0 || py > 100) return;
    if(this.tool === 'shower'){ if(this.phase === 'rinse') this.shower(); return; }
    if(this.phase !== 'scrub') return;
    let hit = false;
    this.spots.forEach(m => {
      if(m.dirt > 0 && Math.hypot(m.cx - px, m.cy - py) < 20){ m.dirt = Math.max(0, m.dirt - 0.09); m.style.opacity = m.dirt; hit = true; }
    });
    if(this.pet.querySelectorAll('.foam').length < 45 && Math.random() < .6){
      const f = el('div', 'foam'), s = rand(6, 14);
      Object.assign(f.style, { width: s + '%', height: s + '%', left: (px - s / 2) + '%', top: (py - s / 2) + '%' });
      this.pet.appendChild(f);
    }
    const now = Date.now();
    if(hit && now - this.lastSqueak > 140){ this.lastSqueak = now; sfx.squeak(); }
    this.updateMeter();
    if(this.spots.every(m => m.dirt <= 0)){
      this.phase = 'rinse';
      this.pet.classList.remove('dirty');
      this.hint.textContent = '🚿 Now tap the shower!';
      this.root.querySelector('[data-tool=shower]').classList.add('pulse');
      speak('All soapy! Now tap the shower!');
    }
  },
  updateMeter(){
    const left = this.spots.reduce((a, m) => a + m.dirt, 0) / this.spots.length;
    this.meter.style.width = ((1 - left) * (this.phase === 'done' ? 100 : 85)) + '%';
  },
  shower(){
    if(this.phase !== 'rinse') return;
    this.phase = 'done';
    sfx.splash(); later(() => sfx.splash(), 350); later(() => sfx.splash(), 700);
    const r = this.pet.getBoundingClientRect(), sr = this.root.getBoundingClientRect();
    for(let i = 0; i < 46; i++){
      later(() => {
        const d = el('div', 'drop');
        d.style.left = (r.left - sr.left + rand(0, r.width)) + 'px'; d.style.top = (r.top - sr.top - 30) + 'px';
        this.root.appendChild(d); later(() => d.remove(), 750);
      }, i * 30);
    }
    later(() => this.pet.querySelectorAll('.foam').forEach(f => { f.style.opacity = 0; f.style.transform = 'translateY(40px)'; }), 400);
    later(() => {
      this.meter.style.width = '100%';
      this.pet.classList.add('happy');
      sparkleAt(this.root, r.left - sr.left + r.width / 2, r.top - sr.top + r.height / 2, 10);
      this.hint.textContent = '✨ Sparkly clean!';
      speak('Sparkly clean! Thank you! Happy ' + this.name + '!');
      burstConfetti(30);
    }, 1500);
    later(() => this.newPet(), 4600);
  },
  enter(){ later(() => speak('Bath time! Scrub the mud away!'), 900); }
});

// ===================== 🤪 Silly Faces =====================
const SF = {
  colors: ['#FFD93D', '#FFB3C7', '#8BE38B', '#7EC8FF', '#C9A0FF', '#FFA94D', '#9AF0E0'],
  eyes: [['googly', 'Googly eyes!'], ['big', 'Big eyes!'], ['sleepy', 'Sleepy eyes!'], ['hearts', 'Love eyes!'], ['stars', 'Star eyes!'], ['cyclops', 'One big eye!'], ['shades', 'Cool glasses!']],
  noses: [['clown', 'Clown nose!'], ['pig', 'Piggy nose!'], ['carrot', 'Carrot nose!'], ['dot', 'Tiny nose!'], ['button', 'Button nose!']],
  mouths: [['smile', 'Happy!'], ['laugh', 'Ha ha ha!'], ['o', 'Oooh!'], ['tongue', 'Bleh!'], ['teeth', 'Big teeth!'], ['mustache', 'Mustache!']],
  hats: [['', 'No hat!'], ['👑', 'A crown!'], ['🎩', 'Top hat!'], ['🧢', 'A cap!'], ['🎀', 'A bow!'], ['🌸', 'A flower!'], ['🎓', 'Smart hat!'], ['🍓', 'Strawberry!']]
};
const heart = (x, y, s) => `<path d="M${x} ${y + s * .35} C${x - s} ${y - s * .5},${x - s * .45} ${y - s * 1.1},${x} ${y - s * .45} C${x + s * .45} ${y - s * 1.1},${x + s} ${y - s * .5},${x} ${y + s * .35}Z" fill="#FF3B6B"/>`;
const starPts = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r : R; return (cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1); }).join(' ');
function sfEyes(kind, skin){
  const eye = (x, R, p) => `<circle cx="${x}" cy="88" r="${R}" fill="#fff" stroke="#2d2d2d" stroke-width="3"/><circle class="pupil" data-r="${R - p - 2}" cx="${x}" cy="88" r="${p}" fill="#2d2d2d"/><circle cx="${x + p * .35}" cy="${88 - p * .35}" r="${p * .3}" fill="#fff" class="pupil" data-r="${R - p - 2}"/>`;
  switch(kind){
    case 'big': return eye(68, 24, 10) + eye(132, 24, 10);
    case 'sleepy': return eye(68, 16, 7) + eye(132, 16, 7) + `<path d="M50 88 A18 18 0 0 1 86 88Z M114 88 A18 18 0 0 1 150 88Z" fill="${skin}" stroke="#2d2d2d" stroke-width="3"/>`;
    case 'hearts': return heart(68, 92, 18) + heart(132, 92, 18);
    case 'stars': return `<polygon points="${starPts(68, 88, 20, 9)}" fill="#FFC300" stroke="#B45309" stroke-width="2"/><polygon points="${starPts(132, 88, 20, 9)}" fill="#FFC300" stroke="#B45309" stroke-width="2"/>`;
    case 'cyclops': return eye(100, 30, 13);
    case 'shades': return `<rect x="40" y="74" width="52" height="30" rx="12" fill="#1F2937"/><rect x="108" y="74" width="52" height="30" rx="12" fill="#1F2937"/><path d="M92 84 H108" stroke="#1F2937" stroke-width="5"/><path d="M48 80 l14 0" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/><path d="M116 80 l14 0" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`;
    default: return eye(68, 18, 8) + eye(132, 18, 8);
  }
}
function sfNose(kind){
  switch(kind){
    case 'pig': return `<ellipse cx="100" cy="118" rx="18" ry="13" fill="#FF9EB5" stroke="#E5739A" stroke-width="3"/><ellipse cx="93" cy="118" rx="3.5" ry="5" fill="#B4466A"/><ellipse cx="107" cy="118" rx="3.5" ry="5" fill="#B4466A"/>`;
    case 'carrot': return `<path d="M98 110 L142 120 L98 128Z" fill="#FF8C42" stroke="#C2410C" stroke-width="2"/>`;
    case 'dot': return `<circle cx="100" cy="118" r="5" fill="#2d2d2d"/>`;
    case 'button': return `<ellipse cx="100" cy="118" rx="9" ry="7" fill="#A0522D"/><circle cx="97" cy="116" r="2" fill="#fff" opacity=".6"/>`;
    default: return `<circle cx="100" cy="118" r="14" fill="#EF4444"/><circle cx="95" cy="113" r="4" fill="#fff" opacity=".7"/>`;
  }
}
function sfMouth(kind){
  switch(kind){
    case 'laugh': return `<path d="M66 140 Q100 196 134 140Z" fill="#7A1F2B" stroke="#2d2d2d" stroke-width="3"/><ellipse cx="100" cy="165" rx="16" ry="9" fill="#FF6B8A"/><rect x="80" y="140" width="40" height="9" fill="#fff"/>`;
    case 'o': return `<ellipse cx="100" cy="156" rx="14" ry="18" fill="#7A1F2B" stroke="#2d2d2d" stroke-width="3"/>`;
    case 'tongue': return `<path d="M72 146 Q100 170 128 146" fill="none" stroke="#2d2d2d" stroke-width="5" stroke-linecap="round"/><path d="M92 156 Q100 186 110 156Z" fill="#FF6B8A" stroke="#2d2d2d" stroke-width="2"/>`;
    case 'teeth': return `<rect x="70" y="140" width="60" height="28" rx="12" fill="#fff" stroke="#2d2d2d" stroke-width="3"/><path d="M85 140 V168 M100 140 V168 M115 140 V168 M70 154 H130" stroke="#2d2d2d" stroke-width="2"/>`;
    case 'mustache': return `<path d="M76 158 Q100 174 124 158" fill="none" stroke="#2d2d2d" stroke-width="5" stroke-linecap="round"/><path d="M100 140 C88 128,66 132,58 148 C70 142,84 146,100 146 C116 146,130 142,142 148 C134 132,112 128,100 140Z" fill="#5B3A1A"/>`;
    default: return `<path d="M70 144 Q100 178 130 144" fill="none" stroke="#2d2d2d" stroke-width="6" stroke-linecap="round"/>`;
  }
}
addGame({
  id: 'faces', e: '🤪', n: 'Silly Faces', colors: ['#FBCFE8', '#F472B6', '#BE185D'], stageClass: 'sf-stage',
  html: `<div class="sf-face"><svg viewBox="-10 -40 220 250"></svg></div>
    <div class="sf-controls">
      <button class="ng-btn sf-btn" data-part="color" aria-label="Colour">🎨</button>
      <button class="ng-btn sf-btn" data-part="eyes" aria-label="Eyes">👀</button>
      <button class="ng-btn sf-btn" data-part="nose" aria-label="Nose">👃</button>
      <button class="ng-btn sf-btn" data-part="mouth" aria-label="Mouth">👄</button>
      <button class="ng-btn sf-btn" data-part="hat" aria-label="Hat">🎩</button>
      <button class="ng-btn sf-btn dice" data-part="all" aria-label="Surprise">🎲</button>
    </div>`,
  init(root){
    this.svg = $('svg', root);
    this.st = { color: 0, eyes: 0, nose: 0, mouth: 0, hat: 0 };
    this.draw();
    root.querySelectorAll('.sf-btn').forEach(b => b.addEventListener('click', () => this.change(b.dataset.part)));
    this.svg.addEventListener('pointerdown', () => this.tickle());
    document.addEventListener('pointermove', e => { if(currentScreen === 'faces') this.look(e.clientX, e.clientY); }, { passive: true });
  },
  draw(changed){
    const st = this.st, skin = SF.colors[st.color];
    this.svg.innerHTML = `
      <g class="sf-part ${changed === 'color' ? 'pop' : ''}">
        <circle cx="22" cy="40" r="26" fill="${skin}" stroke="#2d2d2d" stroke-width="4"/><circle cx="178" cy="40" r="26" fill="${skin}" stroke="#2d2d2d" stroke-width="4"/>
        <circle cx="100" cy="105" r="92" fill="${skin}" stroke="#2d2d2d" stroke-width="4"/>
        <circle cx="48" cy="128" r="13" fill="#FF8FB1" opacity=".6"/><circle cx="152" cy="128" r="13" fill="#FF8FB1" opacity=".6"/></g>
      <g class="sf-part sf-eyes ${changed === 'eyes' ? 'pop' : ''}">${sfEyes(SF.eyes[st.eyes][0], skin)}</g>
      <g class="sf-part ${changed === 'nose' ? 'pop' : ''}">${sfNose(SF.noses[st.nose][0])}</g>
      <g class="sf-part ${changed === 'mouth' ? 'pop' : ''}">${sfMouth(SF.mouths[st.mouth][0])}</g>
      <text class="sf-part ${changed === 'hat' ? 'pop' : ''}" x="100" y="22" font-size="84" text-anchor="middle">${SF.hats[st.hat][0]}</text>`;
  },
  change(part){
    const lists = { color: SF.colors, eyes: SF.eyes, nose: SF.noses, mouth: SF.mouths, hat: SF.hats };
    if(part === 'all'){
      Object.keys(lists).forEach(k => { this.st[k] = Math.floor(Math.random() * lists[k].length); });
      this.draw('color'); this.svg.querySelectorAll('.sf-part').forEach(p => p.classList.add('pop'));
      sfx.whoosh(); later(() => sfx.boing(), 150); speak(pick(['Surprise!', 'So silly!', 'Who is that?']));
      burstConfetti(12);
      return;
    }
    this.st[part] = (this.st[part] + 1) % lists[part].length;
    this.draw(part);
    pick([() => sfx.boing(), () => sfx.pop(), () => sfx.squeak()])();
    const item = lists[part][this.st[part]];
    speak(part === 'color' ? pick(['New colour!', 'Pretty!', 'Ooh!']) : item[1]);
  },
  tickle(){
    this.svg.classList.remove('giggle'); void this.svg.offsetWidth; this.svg.classList.add('giggle');
    sfx.giggle(); speak(pick(['Hee hee!', 'That tickles!', 'Ha ha!', 'Silly ' + kidName + '!']));
  },
  look(cx, cy){
    this.svg.querySelectorAll('.pupil').forEach(p => {
      const ox = +p.getAttribute('cx'), oy = +p.getAttribute('cy'), max = +p.dataset.r;
      const r = this.svg.getBoundingClientRect(), vb = this.svg.viewBox.baseVal, k = r.width / vb.width;
      const ex = r.left + (ox - vb.x) * k, ey = r.top + (oy - vb.y) * k;
      const a = Math.atan2(cy - ey, cx - ex), d = Math.min(max, Math.hypot(cx - ex, cy - ey) / 12);
      p.setAttribute('transform', `translate(${(Math.cos(a) * d).toFixed(1)} ${(Math.sin(a) * d).toFixed(1)})`);
    });
  },
  enter(){
    later(() => speak('Make a silly face! Tap the buttons!'), 900);
    clearInterval(this.blinker);
    this.blinker = setInterval(() => { const g = this.svg.querySelector('.sf-eyes'); if(g){ g.classList.remove('blink'); this.svg.getBoundingClientRect(); g.classList.add('blink'); later(() => g.classList.remove('blink'), 200); } }, 3500);
  },
  leave(){ clearInterval(this.blinker); }
});

// ===================== 🚀 Rocket Trip =====================
const PLANETS = [['moon', 'the Moon'], ['mars', 'Mars, the red planet'], ['jupiter', 'Jupiter, the biggest planet'], ['candy', 'Candy Planet'], ['ice', 'the Ice Planet']];
addGame({
  id: 'rocket', e: '🚀', n: 'Rocket Trip', colors: ['#A5B4FC', '#6366F1', '#4338CA'], stageClass: 'rk-stage',
  html: `<div class="rk-stars"></div><div class="rk-tower"></div><div class="rk-pad"></div><div class="rk-planet"></div>
    <div class="rk-rocket"><span>🚀</span><div class="rk-flame"></div></div>
    <div class="rk-alien">👽</div><div class="rk-count"></div>
    <button class="ng-btn rk-go" aria-label="Launch">GO!</button>
    <button class="ng-btn rk-home" style="display:none">🏠 Fly home</button>
    <div class="ng-hint">🔴 Press GO to blast off!</div>`,
  init(root){
    this.rocket = $('.rk-rocket', root); this.go = $('.rk-go', root); this.homeBtn = $('.rk-home', root);
    this.count = $('.rk-count', root); this.planet = $('.rk-planet', root); this.alien = $('.rk-alien', root); this.hint = $('.ng-hint', root);
    const stars = $('.rk-stars', root);
    for(let i = 0; i < 70; i++){
      const s = el('i'); Object.assign(s.style, { left: rand(0, 100) + '%', top: rand(0, 100) + '%', animationDelay: rand(0, 1.6) + 's', width: rand(2, 5) + 'px' });
      s.style.height = s.style.width; stars.appendChild(s);
    }
    this.go.addEventListener('click', () => this.launch());
    this.homeBtn.addEventListener('click', () => this.flyHome());
    this.alien.addEventListener('pointerdown', e => { e.stopPropagation(); sfx.giggle(); speak(pick(['Hello ' + kidName + '!', 'Beep boop! Hi!', 'Welcome to my planet!'])); });
    root.addEventListener('pointerdown', e => {
      if(!root.classList.contains('space') || e.target.closest('button')) return;
      const p = stagePoint(root, e), s = el('div', 'rk-shoot');
      s.style.left = p.x + 'px'; s.style.top = p.y + 'px'; root.appendChild(s); later(() => s.remove(), 750);
      sfx.plink(Math.floor(rand(0, 7)));
    });
    this.state = 'ground';
  },
  timers: [],
  t(fn, ms){ this.timers.push(later(fn, ms)); },
  smoke(n){
    const r = this.rocket.getBoundingClientRect(), sr = this.root.getBoundingClientRect();
    for(let i = 0; i < n; i++){
      const s = el('div', 'rk-smoke'), size = rand(30, 60);
      Object.assign(s.style, { width: size + 'px', height: size + 'px', left: (r.left - sr.left + r.width / 2 - size / 2 + rand(-40, 40)) + 'px', top: (r.bottom - sr.top - size / 2) + 'px', animationDelay: (i * 40) + 'ms' });
      s.style.setProperty('--dx', rand(-120, 120) + 'px');
      this.root.appendChild(s); later(() => s.remove(), 1800);
    }
  },
  launch(){
    if(this.state !== 'ground') return;
    this.state = 'counting';
    this.go.style.display = 'none'; this.hint.textContent = '🔢 Count with me!';
    const words = ['Five', 'Four', 'Three', 'Two', 'One'];
    this.rocket.classList.add('shake');
    words.forEach((w, i) => this.t(() => {
      this.count.innerHTML = `<b>${5 - i}</b>`; speak(w); sfx.tone(440, 0.15, 'square', 0.15);
      this.smoke(2 + i);
    }, i * 1100));
    this.t(() => {
      this.count.innerHTML = ''; speak('Blast off!');
      this.rocket.classList.add('burn'); sfx.rumble(2.2); sfx.whoosh(); this.smoke(14);
      this.rocket.style.bottom = '130%';
      this.hint.textContent = '🚀 Whoooosh!';
    }, 5600);
    this.t(() => {
      this.state = 'space';
      this.root.classList.add('space', 'flying');
      this.rocket.style.transition = 'none'; this.rocket.style.bottom = '-30%';
      void this.rocket.offsetWidth;
      this.rocket.style.transition = 'bottom 1.4s ease-out'; this.rocket.style.bottom = '38%';
      this.rocket.classList.remove('shake');
      this.hint.textContent = '✨ Tap the stars!';
      speak('We are in space! Tap the stars!');
    }, 7300);
    this.t(() => this.rocket.classList.add('hover'), 8800);
    this.t(() => this.land(), 14500);
  },
  land(){
    const [cls, name] = pick(PLANETS);
    this.planet.className = 'rk-planet ' + cls;
    this.root.classList.remove('flying');
    void this.planet.offsetWidth; this.planet.classList.add('arrive');
    speak('Look! It is ' + name + '!');
    this.rocket.classList.remove('hover');
    this.t(() => { this.rocket.style.transition = 'bottom 1.6s ease-in-out'; this.rocket.style.bottom = '29%'; }, 1800);
    this.t(() => {
      this.rocket.classList.remove('burn'); sfx.boing();
      speak('We landed on ' + name + '!'); burstConfetti(30);
      this.alien.classList.add('show'); this.state = 'landed';
      this.homeBtn.style.display = ''; this.hint.textContent = '👽 Say hi to the alien!';
    }, 3500);
  },
  flyHome(){
    if(this.state !== 'landed') return;
    this.state = 'returning'; this.homeBtn.style.display = 'none'; this.alien.classList.remove('show');
    speak('Bye bye! Back home!'); sfx.whoosh();
    this.rocket.classList.add('burn'); this.rocket.style.transition = 'bottom 1.4s ease-in'; this.rocket.style.bottom = '130%';
    this.t(() => this.reset(), 1500);
  },
  reset(){
    this.timers.forEach(clearTimeout); this.timers = [];
    this.root.classList.remove('space', 'flying');
    this.planet.className = 'rk-planet'; this.alien.classList.remove('show');
    this.rocket.className = 'rk-rocket'; this.rocket.style.transition = 'none'; this.rocket.style.bottom = '';
    void this.rocket.offsetWidth; this.rocket.style.transition = '';
    this.count.innerHTML = ''; this.go.style.display = ''; this.homeBtn.style.display = 'none';
    this.hint.textContent = '🔴 Press GO to blast off!';
    this.state = 'ground';
  },
  enter(){ this.reset(); later(() => speak('Rocket trip! Press the big red button!'), 900); },
  leave(){ this.reset(); }
});

// ===================== 🌻 Magic Garden =====================
const FLOWERS = [['🌻', 'sunflower'], ['🌷', 'tulip'], ['🌹', 'rose'], ['🌼', 'daisy'], ['🌸', 'blossom'], ['🌺', 'hibiscus'], ['🍓', 'strawberry'], ['🍄', 'mushroom'], ['🥕', 'carrot']];
const GROW = ['', '🌰', '🌱', '🌿'];
addGame({
  id: 'garden', e: '🌻', n: 'Magic Garden', colors: ['#BBF7D0', '#4ADE80', '#16A34A'], stageClass: 'gd-stage',
  html: `<button class="gd-sun" aria-label="Sun">😊</button><button class="gd-cloud" aria-label="Rain cloud">🌧️</button>
    <div class="gd-plots">${'<button class="gd-plot"><span class="gd-plant"></span></button>'.repeat(5)}</div>
    <div class="gd-basket">💐 <b>0</b></div><div class="ng-hint">👆 Tap the dirt to plant!</div>`,
  init(root){
    this.plots = [...root.querySelectorAll('.gd-plot')].map(b => ({ b, plant: $('.gd-plant', b), stage: 0, flower: null }));
    this.picked = 0; this.bloomed = false;
    this.plots.forEach(p => p.b.addEventListener('click', () => this.tapPlot(p)));
    $('.gd-sun', root).addEventListener('click', e => { const s = e.currentTarget; s.classList.remove('shine'); void s.offsetWidth; s.classList.add('shine'); sfx.rise(); speak('Sunny day!'); this.growAll(); });
    $('.gd-cloud', root).addEventListener('click', () => this.rain());
  },
  setStage(p, stage){
    p.stage = stage;
    if(stage === 4 && !p.flower) p.flower = pick(FLOWERS);
    p.plant.textContent = stage === 4 ? p.flower[0] : GROW[stage];
    p.plant.className = 'gd-plant s' + stage + ' grow';
  },
  tapPlot(p){
    if(p.stage === 0){ this.setStage(p, 1); sfx.pop(); speak('A seed!'); this.droplets(p, 0); return; }
    if(p.stage < 4){ this.droplets(p, 8); sfx.splash(); this.setStage(p, p.stage + 1); if(p.stage === 4) this.bloom(p); return; }
    this.pick(p);
  },
  droplets(p, n){
    const r = p.b.getBoundingClientRect(), sr = this.root.getBoundingClientRect();
    for(let i = 0; i < n; i++){
      const d = el('div', 'gd-rain');
      d.style.left = (r.left - sr.left + r.width / 2 + rand(-30, 30)) + 'px'; d.style.top = (r.top - sr.top + rand(-60, 0)) + 'px';
      d.style.animationDuration = '.5s'; this.root.appendChild(d); later(() => d.remove(), 520);
    }
  },
  bloom(p){
    sfx.plink(this.plots.indexOf(p) + 2); later(() => sfx.plink(this.plots.indexOf(p) + 4), 120);
    speak('A ' + p.flower[1] + '!');
    if(!this.bloomed && this.plots.every(q => q.stage === 4)){
      this.bloomed = true;
      later(() => { speak('Wow! A beautiful garden!'); burstConfetti(35); this.visitors(); }, 900);
    }
  },
  growAll(){ this.plots.forEach((p, i) => later(() => { if(p.stage > 0 && p.stage < 4){ this.setStage(p, p.stage + 1); if(p.stage === 4) this.bloom(p); } }, i * 150)); },
  rain(){
    const c = $('.gd-cloud', this.root); if(c.classList.contains('raining')) return;
    c.classList.add('raining'); speak('Rain! Pitter patter!');
    const sr = this.root.getBoundingClientRect();
    for(let i = 0; i < 70; i++) later(() => {
      const d = el('div', 'gd-rain'); d.style.left = rand(0, sr.width) + 'px'; d.style.top = rand(-20, 60) + 'px';
      this.root.appendChild(d); later(() => d.remove(), 850);
      if(i % 10 === 0) sfx.noise(0.2, 0.12, 3000, 'highpass');
    }, i * 28);
    later(() => { this.plots.forEach(p => { if(p.stage === 0) this.setStage(p, 1); }); this.growAll(); }, 900);
    later(() => c.classList.remove('raining'), 2100);
  },
  pick(p){
    const r = p.plant.getBoundingClientRect(), sr = this.root.getBoundingClientRect(), basket = $('.gd-basket', this.root).getBoundingClientRect();
    const f = el('div', 'gd-picked', p.flower[0]);
    f.style.left = (r.left - sr.left) + 'px'; f.style.top = (r.top - sr.top) + 'px';
    this.root.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.left = (basket.left - sr.left) + 'px'; f.style.top = (basket.top - sr.top) + 'px'; f.style.transform = 'scale(.4)'; f.style.opacity = '.4'; }));
    later(() => f.remove(), 850);
    this.picked++; $('.gd-basket b', this.root).textContent = this.picked;
    sfx.pop(); speak(String(this.picked));
    p.stage = 0; p.flower = null; p.plant.textContent = ''; p.plant.className = 'gd-plant';
    this.bloomed = false;
    if(this.picked % 5 === 0) later(() => { speak(this.picked + ' flowers! Well done!'); burstConfetti(30); }, 600);
  },
  visitors(){
    this.root.querySelectorAll('.gd-flyer').forEach(f => f.remove());
    ['🦋', '🐝', '🦋', '🐞'].forEach((e, i) => {
      const f = el('div', 'gd-flyer', e); f.style.left = (i % 2 ? 110 : -10) + '%'; f.style.top = rand(20, 50) + '%';
      this.root.appendChild(f);
      const hop = () => { if(!f.isConnected) return; f.style.left = rand(5, 85) + '%'; f.style.top = rand(15, 55) + '%'; f.timer = later(hop, 2400); };
      later(hop, 50 + i * 300);
    });
  },
  enter(){ later(() => speak('Magic garden! Tap the dirt to plant a seed!'), 900); },
  leave(){ this.root.querySelectorAll('.gd-flyer').forEach(f => f.remove()); }
});

// ===================== 🎆 Fireworks =====================
addGame({
  id: 'fireworks', e: '🎆', n: 'Fireworks', colors: ['#C4B5FD', '#7C3AED', '#4C1D95'], stageClass: 'fw-stage',
  html: `<canvas></canvas><div class="fw-city"></div><div class="ng-hint fw-hint">👆 Tap the sky!</div>`,
  init(root){
    this.cv = $('canvas', root); this.ctx = this.cv.getContext('2d');
    this.parts = []; this.rockets = []; this.bursts = 0; this.running = false;
    root.addEventListener('pointerdown', e => { const p = stagePoint(root, e); this.fire(p.x, p.y); });
    window.addEventListener('resize', () => { if(currentScreen === 'fireworks') this.size(); });
  },
  size(){
    const r = this.root.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = r.width * d; this.cv.height = r.height * d; this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.w = r.width; this.h = r.height;
  },
  fire(x, y){
    this.rockets.push({ x: this.w / 2 + rand(-this.w / 4, this.w / 4), y: this.h, tx: x, ty: y, hue: rand(0, 360) });
    sfx.tone(300, 0.35, 'sine', 0.12, 900);
  },
  explode(x, y, hue){
    const shape = pick(['ball', 'ball', 'ring', 'heart', 'star']), n = 70;
    for(let i = 0; i < n; i++){
      const a = Math.PI * 2 * i / n;
      let sp = shape === 'ring' ? 4 : rand(1, 5.5), vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
      if(shape === 'heart'){ const t = a; vx = 16 * Math.sin(t) ** 3 / 4.2; vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 4.2; }
      if(shape === 'star'){ const k = (i % 14) < 7 ? 5 : 2.4; vx = Math.cos(a) * k; vy = Math.sin(a) * k; }
      this.parts.push({ x, y, vx, vy, life: 1, hue: (hue + rand(-20, 20) + 360) % 360, size: rand(2, 3.5) });
    }
    sfx.boom();
    this.bursts++;
    if(this.bursts % 8 === 0){ speak(pick(['Wow! So pretty!', 'Boom! Beautiful!', 'Ooooh! Aaaah!'])); burstConfetti(12); }
  },
  loop(id){
    if(!this.running || id !== this.loopId) return;
    const c = this.ctx;
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(0, 0, this.w, this.h);
    c.globalCompositeOperation = 'lighter';
    this.rockets = this.rockets.filter(r => {
      r.y += (r.ty - r.y) * 0.12 - 2; r.x += (r.tx - r.x) * 0.12;
      c.fillStyle = `hsl(${r.hue} 100% 75%)`; c.beginPath(); c.arc(r.x, r.y, 3, 0, 7); c.fill();
      if(r.y <= r.ty + 4){ this.explode(r.tx, r.ty, r.hue); return false; }
      return true;
    });
    this.parts = this.parts.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.vx *= 0.985; p.vy *= 0.985; p.life -= 0.013;
      c.fillStyle = `hsla(${p.hue} 100% 65% / ${Math.max(0, p.life)})`; c.beginPath(); c.arc(p.x, p.y, p.size, 0, 7); c.fill();
      return p.life > 0;
    });
    c.globalCompositeOperation = 'source-over';
    requestAnimationFrame(() => this.loop(id));
  },
  enter(){
    later(() => { this.size(); this.running = true; this.loop(this.loopId = (this.loopId || 0) + 1); this.fire(this.w / 2, this.h * 0.3); }, 60);
    later(() => speak('Fireworks! Tap the sky!'), 900);
  },
  leave(){ this.running = false; this.parts = []; this.rockets = []; }
});

// Sentences built from game data, for pre-recording the natural voice (see js/phrases.js).
window.funPhrases = name => {
  const p = [];
  BABIES.forEach(([, n]) => p.push('Wow! A baby ' + n + '!'));
  PETS.forEach(([, n]) => p.push('Sparkly clean! Thank you! Happy ' + n + '!'));
  [SF.eyes, SF.noses, SF.mouths, SF.hats].forEach(list => list.forEach(([, say]) => p.push(say)));
  PLANETS.forEach(([, n]) => p.push('Look! It is ' + n + '!', 'We landed on ' + n + '!'));
  FLOWERS.forEach(([, n]) => p.push('A ' + n + '!'));
  for(let i = 1; i <= 30; i++) p.push(String(i));
  for(let i = 5; i <= 50; i += 5) p.push(i + ' flowers! Well done!');
  p.push('Silly ' + name + '!', 'Hello ' + name + '!', 'A present for you, ' + name + '! Three stars!');
  return p;
};

// Shared toolkit for other game packs (js/learn.js).
window.IdrisPlay = { addGame, sfx, celebrate, sparkleAt, stagePoint, el, pick, rand, later, $, GAMES };

// ===================== Launcher: new games go first with a NEW ribbon =====================
const NEW_ORDER = ['eggs', 'bath', 'faces', 'rocket', 'garden', 'fireworks'];
const meta = { eggs: 'Tap to hatch!', bath: 'Scrub-a-dub!', faces: 'Make me silly', rocket: 'Blast off!', garden: 'Grow flowers', fireworks: 'Boom! Sparkle!' };
homeGames.unshift(...NEW_ORDER.map(id => ({ id, e: GAMES[id].e, n: GAMES[id].n, s: meta[id], c: '#fff', colors: GAMES[id].colors, isNew: true })));
renderHome();
renderGift();
})();
