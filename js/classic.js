// Idris Play — full-screen remakes of six older games, made for 2-year-olds: Peek-a-Boo, Feed Buddy,
// Pop-It, Bubble Pop, Fishing and Puzzle. Big targets, every tap does something, nothing to read, no
// way to lose. Uses the older games' data (peekSpots, buddies, buddyFoods, surpriseToys) so their
// recorded voice lines are reused. Built on the shared toolkit from js/fun.js (window.IdrisPlay).
(function(){
'use strict';
const { addGame, sfx, celebrate, sparkleAt, stagePoint, el, pick, rand, later, $ } = window.IdrisPlay;
const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
const centerOf = (root, n) => { const r = n.getBoundingClientRect(), s = root.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }; };
const SAY = {
  peekStart: 'Peek a boo! Who is hiding? Tap to see!',
  feedStart: 'Feed your buddy! Drag the food to the mouth!',
  popitStart: 'Pop pop pop! Pop all the bubbles!',
  popitDone: 'All popped! Flip it over!',
  bubblesStart: 'Pop the bubbles! What is inside?',
  fishStart: 'Tap a fish to catch it!',
  fishDone: 'Ten fish! What a big catch!',
  puzzleStart: 'Puzzle time! Put the pieces in place!',
  puzzleDone: 'You did it! Hooray!'
};

// ======================================================================
// 🙈 PEEK-A-BOO — four big hiding places; tap one and a friend pops out
// ======================================================================
addGame({
  id: 'peekaboo', e: '🙈', n: 'Peek-a-Boo', colors: ['#FEF08A', '#FACC15', '#CA8A04'], stageClass: 'pb-stage',
  html: `<div class="pb-grid"></div>`,
  init(root){
    this.grid = $('.pb-grid', root);
    peekSpots.slice(0, 4).forEach((spot, i) => {
      const s = el('button', 'pb-spot', `<div class="pb-friend"></div><div class="pb-cover">${spot.cover}</div>`);
      s.style.setProperty('--bg', spot.bg || '#fff');
      s.addEventListener('click', () => this.open(i, s));
      this.grid.appendChild(s);
    });
  },
  open(i, s){
    if(s.classList.contains('open')){ this.close(s); return; }
    const c = pick(peekSpots[i].creatures);
    $('.pb-friend', s).textContent = c.e;
    s.classList.add('open'); sfx.boing(); later(() => sfx.giggle(), 200);
    const p = centerOf(this.root, s); sparkleAt(this.root, p.x, p.y, 6);
    speak(`Peek a boo! ${c.n}! ${c.s}`);
    clearTimeout(s._t); s._t = later(() => this.close(s), 3500);
    if(this.grid.querySelectorAll('.open').length === 4){ burstConfetti(30); }
  },
  close(s){ clearTimeout(s._t); s.classList.remove('open'); sfx.tone(400, 0.12, 'sine', 0.12, 250); },
  enter(){ this.grid.querySelectorAll('.pb-spot').forEach(s => s.classList.remove('open')); speakNext(SAY.peekStart); },
  leave(){ this.grid.querySelectorAll('.pb-spot').forEach(s => { clearTimeout(s._t); s.classList.remove('open'); }); }
});

// ======================================================================
// 🥕 FEED BUDDY — drag (or tap) food into a big hungry friend
// ======================================================================
addGame({
  id: 'feeding', e: '🥕', n: 'Feed Buddy', colors: ['#FED7AA', '#FB923C', '#C2410C'], stageClass: 'fb-stage',
  html: `<div class="fb-picker"></div><div class="fb-buddy"><span class="fb-face"></span><span class="fb-mouth"></span></div><div class="fb-tray"></div>`,
  init(root){
    this.picker = $('.fb-picker', root); this.buddy = $('.fb-buddy', root); this.face = $('.fb-face', root); this.tray = $('.fb-tray', root);
    buddies.forEach(b => { const btn = el('button', 'ng-btn fb-pick', b.face); btn.addEventListener('click', () => this.setBuddy(b)); this.picker.appendChild(btn); });
    const foods = [...new Set([...buddies.map(b => b.love), ...(window.buddyFoods || []).map(f => f.e || f)])].filter(x => typeof x === 'string').slice(0, 6);
    foods.forEach(f => {
      const n = el('div', 'fb-food', f);
      n.addEventListener('pointerdown', e => this.grab(e, n));
      this.tray.appendChild(n);
    });
    root.addEventListener('pointermove', e => this.move(e));
    root.addEventListener('pointerup', e => this.drop(e));
    root.addEventListener('pointercancel', () => this.drop(null));
    this.setBuddy(buddies[0], false);
  },
  setBuddy(b, say = true){
    this.b = b; this.face.textContent = b.face; this.fed = 0;
    this.picker.querySelectorAll('.fb-pick').forEach((x, i) => x.classList.toggle('on', buddies[i] === b));
    restart(this.buddy, 'pop-in');
    if(say){ sfx.pop(); speak(`${b.name} is hungry!`); }
  },
  grab(e, n){
    e.preventDefault(); try{ this.root.setPointerCapture(e.pointerId); }catch(_){}
    this.drag = { n, x0: e.clientX, y0: e.clientY, moved: false };
    n.classList.add('held'); sfx.pop();
    this.buddy.classList.add('open');
  },
  move(e){
    if(!this.drag) return;
    const dx = e.clientX - this.drag.x0, dy = e.clientY - this.drag.y0;
    if(Math.hypot(dx, dy) > 8) this.drag.moved = true;
    this.drag.n.style.transform = `translate(${dx}px, ${dy}px) scale(1.25)`;
  },
  drop(e){
    const d = this.drag; if(!d) return; this.drag = null;
    d.n.classList.remove('held');
    const br = this.buddy.getBoundingClientRect();
    const near = !e || !d.moved || (e.clientX > br.left - 40 && e.clientX < br.right + 40 && e.clientY > br.top - 40 && e.clientY < br.bottom + 40);
    if(!near){ d.n.style.transform = ''; this.buddy.classList.remove('open'); sfx.boing(); return; }
    // a tap also feeds: the food flies into the mouth
    const nr = d.n.getBoundingClientRect(), m = $('.fb-mouth', this.buddy).getBoundingClientRect();
    const cur = d.n.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/) || [0, 0, 0];
    d.n.style.transition = 'transform .35s ease-in';
    d.n.style.transform = `translate(${+cur[1] + m.left + m.width / 2 - nr.left - nr.width / 2}px, ${+cur[2] + m.top + m.height / 2 - nr.top - nr.height / 2}px) scale(.2)`;
    later(() => {
      d.n.style.transition = 'none'; d.n.style.transform = ''; restart(d.n, 'pop-in');
      later(() => { d.n.style.transition = ''; }, 30);
      this.buddy.classList.remove('open'); restart(this.buddy, 'chew');
      sfx.crack(); later(() => sfx.pop(), 140); later(() => sfx.squeak(), 280);
      const loved = d.n.textContent === this.b.love;
      this.face.textContent = loved ? this.b.chewingFace : this.b.face;
      later(() => { this.face.textContent = this.b.face; }, 1100);
      speak(loved ? `Super! ${this.b.cheer}` : pick(['Yum!', 'Yummy!', 'Munch munch!', 'Tasty!']));
      const p = centerOf(this.root, this.buddy); sparkleAt(this.root, p.x, p.y - 40, loved ? 8 : 4, loved ? ['💖', '✨', '⭐'] : undefined);
      if(++this.fed % 5 === 0) burstConfetti(30);
    }, 360);
  },
  enter(){ speakNext(SAY.feedStart); },
  leave(){ this.drop(null); }
});

// ======================================================================
// 🫧 POP-IT — a big rainbow board; pop them all and it flips to a new shape
// ======================================================================
const POPIT_SHAPES = ['round', 'heart', 'dino', 'star'];
addGame({
  id: 'popit', e: '🫧', n: 'Pop-It Toy', colors: ['#F9A8D4', '#EC4899', '#BE185D'], stageClass: 'pi-stage',
  html: `<div class="pi-board"></div>`,
  init(root){ this.board = $('.pi-board', root); this.shape = 0; this.build(); },
  build(){
    this.board.className = 'pi-board ' + POPIT_SHAPES[this.shape % POPIT_SHAPES.length];
    this.board.innerHTML = '';
    for(let r = 0; r < 4; r++) for(let c = 0; c < 5; c++){
      const b = el('button', 'pi-b'); b.style.setProperty('--h', ((r * 5 + c) * 18 + this.shape * 40) % 360);
      b.addEventListener('pointerdown', () => this.pop(b));
      this.board.appendChild(b);
    }
  },
  pop(b){
    if(b.classList.contains('popped') || this.flipping) return;
    b.classList.add('popped'); sfx.pop();
    const left = this.board.querySelectorAll('.pi-b:not(.popped)').length;
    if(left === 0){
      this.flipping = true; speak(SAY.popitDone); burstConfetti(30);
      later(() => { this.board.classList.add('flip'); sfx.whoosh(); }, 600);
      later(() => { this.shape++; this.build(); this.flipping = false; restart(this.board, 'pop-in'); }, 1300);
    }
  },
  enter(){ speakNext(SAY.popitStart); }
});

// ======================================================================
// 🫧 BUBBLE POP — big bubbles float up; each one hides a surprise toy
// ======================================================================
addGame({
  id: 'bubbles', e: '🫧', n: 'Bubble Pop', colors: ['#A5F3FC', '#22D3EE', '#0891B2'], stageClass: 'bp-stage',
  html: `<div class="bp-count">🫧 <b>0</b></div>`,
  init(root){ this.countEl = $('.bp-count b', root); this.count = 0; },
  spawn(){
    if(!this.running) return;
    if(this.root.querySelectorAll('.bp-bubble').length < 7){
      const t = pick(surpriseToys), size = rand(110, 190);
      const b = el('button', 'bp-bubble', `<span>${t.e}</span>`);
      Object.assign(b.style, { width: size + 'px', height: size + 'px', fontSize: (size * 0.48) + 'px', left: rand(4, 80) + '%', animationDuration: rand(7, 11) + 's' });
      b.style.setProperty('--sway', rand(-40, 40) + 'px');
      b.addEventListener('pointerdown', e => { e.stopPropagation(); this.pop(b, t); });
      b.addEventListener('animationend', () => b.remove());
      this.root.appendChild(b);
    }
    this.timer = later(() => this.spawn(), rand(700, 1300));
  },
  pop(b, t){
    if(b.classList.contains('popped')) return;
    b.classList.add('popped'); sfx.pop(); later(() => sfx.squeak(), 90);
    const p = centerOf(this.root, b);
    const toy = el('div', 'bp-toy', t.e); toy.style.left = p.x + 'px'; toy.style.top = p.y + 'px';
    this.root.appendChild(toy); later(() => toy.remove(), 1400);
    later(() => b.remove(), 250);
    this.count++; this.countEl.textContent = this.count;
    speak(`Pop! ${t.n}!`);
    if(this.count % 10 === 0) burstConfetti(30);
  },
  enter(){ this.running = true; this.spawn(); speakNext(SAY.bubblesStart); },
  leave(){ this.running = false; clearTimeout(this.timer); this.root.querySelectorAll('.bp-bubble,.bp-toy').forEach(n => n.remove()); }
});

// ======================================================================
// 🎣 FISHING — tap a fish: the line hooks it and it flies into the bucket
// ======================================================================
const FISH = ['🐟', '🐠', '🐡', '🐬', '🐙', '🐢', '🦀', '🐳'];
addGame({
  id: 'fishing', e: '🎣', n: 'Fishing Pond', colors: ['#93C5FD', '#3B82F6', '#1D4ED8'], stageClass: 'fi-stage',
  html: `<div class="fi-water"></div><div class="fi-bucket">🪣<b>0</b></div><div class="fi-boat">🛶<span>🦖</span></div>`,
  init(root){ this.bucket = $('.fi-bucket', root); this.countEl = $('.fi-bucket b', root); this.count = 0; },
  spawn(){
    if(!this.running) return;
    if(this.root.querySelectorAll('.fi-fish:not(.caught)').length < 6){
      const left = Math.random() < .5, f = el('button', 'fi-fish' + (left ? ' ltr' : ''), pick(FISH));
      f.style.top = rand(42, 82) + '%'; f.style.animationDuration = rand(8, 13) + 's'; f.style.fontSize = rand(70, 110) + 'px';
      f.addEventListener('pointerdown', e => { e.stopPropagation(); this.catchFish(f); });
      f.addEventListener('animationend', e => { if(e.animationName.startsWith('fiSwim')) f.remove(); });
      this.root.appendChild(f);
    }
    this.timer = later(() => this.spawn(), rand(900, 1600));
  },
  catchFish(f){
    if(f.classList.contains('caught')) return;
    const p = centerOf(this.root, f), b = centerOf(this.root, this.bucket);
    f.style.left = (p.x - f.offsetWidth / 2) + 'px'; f.style.top = (p.y - f.offsetHeight / 2) + 'px';
    f.classList.add('caught'); sfx.splash(); later(() => sfx.boing(), 120);
    f.style.setProperty('--tx', (b.x - p.x) + 'px'); f.style.setProperty('--ty', (b.y - p.y) + 'px');
    sparkleAt(this.root, p.x, p.y, 4, ['💧', '✨']);
    later(() => { f.remove(); restart(this.bucket, 'lr-bounce'); sfx.pop(); }, 900);
    this.count++; this.countEl.textContent = this.count;
    speak(String(this.count));
    if(this.count % 10 === 0){ later(() => { speak(SAY.fishDone); burstConfetti(30); }, 900); }
  },
  enter(){ this.running = true; this.spawn(); speakNext(SAY.fishStart); },
  leave(){ this.running = false; clearTimeout(this.timer); this.root.querySelectorAll('.fi-fish').forEach(n => n.remove()); }
});

// ======================================================================
// 🧩 PUZZLE — a big picture cut into 2, then 4, then 6 pieces; drag or tap each piece home
// ======================================================================
const PICS = ['🦖', '🦕', '🚒', '🐳', '🦁', '🚀', '🐘', '🌈', '🐢', '🚂'];
const PZ_STEPS = [[2, 1], [2, 2], [3, 2]];   // [columns, rows]
function picture(emoji, bg, W, H){
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.font = `${Math.min(W, H) * 0.78}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, W / 2, H / 2 + H * 0.04);
  return c.toDataURL();
}
addGame({
  id: 'puzzle', e: '🧩', n: 'Picture Puzzle', colors: ['#FBCFE8', '#F472B6', '#BE185D'], stageClass: 'pz-stage', cat: '123',
  html: `<div class="lr-level">⭐ <b>1</b></div><div class="pz-board"></div><div class="pz-tray"></div>`,
  init(root){
    this.board = $('.pz-board', root); this.tray = $('.pz-tray', root);
    this.level = store.get('play_puzzle', 0); this.pic = 0;
    root.addEventListener('pointermove', e => this.move(e));
    root.addEventListener('pointerup', e => this.drop(e));
    root.addEventListener('pointercancel', () => this.drop(null));
  },
  round(){
    const [cols, rows] = PZ_STEPS[Math.min(this.level, PZ_STEPS.length - 1)];
    $('.lr-level b', this.root).textContent = this.level + 1;
    const emoji = PICS[this.pic++ % PICS.length], bg = pick([['#FDE68A', '#FCA5A5'], ['#A7F3D0', '#93C5FD'], ['#DDD6FE', '#F9A8D4'], ['#BAE6FD', '#FDE68A']]);
    const sr = this.root.getBoundingClientRect();
    const portrait = sr.height > sr.width;
    const W = portrait ? Math.min(sr.width - 40, (sr.height * 0.55) * 1.2) : Math.min(sr.width * 0.55, (sr.height - 60) * 1.2), H = W / 1.2;
    const url = picture(emoji, bg, Math.round(W * 2), Math.round(H * 2));
    this.board.style.width = W + 'px'; this.board.style.height = H + 'px';
    this.board.style.gridTemplateColumns = `repeat(${cols},1fr)`; this.board.style.gridTemplateRows = `repeat(${rows},1fr)`;
    this.board.style.setProperty('--pic', `url(${url})`);
    this.board.innerHTML = ''; this.tray.innerHTML = '';
    const pw = W / cols, ph = H / rows, pieces = [];
    // loose pieces wait in the tray a bit smaller, so they all fit next to the board
    const trayW = portrait ? sr.width - 40 : sr.width - W - 80, trayH = portrait ? sr.height - H - 80 : sr.height - 40;
    const per = Math.max(1, Math.ceil(cols * rows / 2)), k = Math.min(0.9, (trayW - 20) / (pw * (portrait ? per : 2) + 28), (trayH - 20) / (ph * (portrait ? 2 : per) + 28));
    for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++){
      const slot = el('div', 'pz-slot'); slot.dataset.k = r * cols + c; this.board.appendChild(slot);
      const p = el('div', 'pz-piece'); p.dataset.k = r * cols + c;
      Object.assign(p.style, { width: pw * k + 'px', height: ph * k + 'px', backgroundImage: `url(${url})`, backgroundSize: `${W * k}px ${H * k}px`, backgroundPosition: `${-c * pw * k}px ${-r * ph * k}px` });
      p.dataset.full = JSON.stringify([`${W}px ${H}px`, `${-c * pw}px ${-r * ph}px`]);
      p.addEventListener('pointerdown', e => this.grab(e, p));
      pieces.push(p);
    }
    pieces.sort(() => Math.random() - .5).forEach(p => { p.style.rotate = rand(-8, 8) + 'deg'; this.tray.appendChild(p); });
    this.left = pieces.length; this.emoji = emoji;
  },
  grab(e, p){
    if(p.classList.contains('placed')) return;
    e.preventDefault(); try{ this.root.setPointerCapture(e.pointerId); }catch(_){}
    this.drag = { p, x0: e.clientX, y0: e.clientY, moved: false }; p.classList.add('held'); sfx.pop();
  },
  move(e){
    if(!this.drag) return;
    const dx = e.clientX - this.drag.x0, dy = e.clientY - this.drag.y0;
    if(Math.hypot(dx, dy) > 8) this.drag.moved = true;
    this.drag.p.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
  },
  drop(e){
    const d = this.drag; if(!d) return; this.drag = null;
    d.p.classList.remove('held');
    const slot = this.board.querySelector(`.pz-slot[data-k="${d.p.dataset.k}"]`);
    const sr = slot.getBoundingClientRect();
    // a tap sends the piece home; a drag must end near its own place
    const ok = !e || !d.moved || (Math.abs(e.clientX - (sr.left + sr.width / 2)) < sr.width * 0.6 && Math.abs(e.clientY - (sr.top + sr.height / 2)) < sr.height * 0.6);
    if(!ok){ d.p.style.transform = ''; sfx.boing(); restart(slot, 'pz-hint'); return; }
    const pr = d.p.getBoundingClientRect();
    const cur = d.p.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/) || [0, 0, 0];
    d.p.style.transition = 'transform .3s ease-out, rotate .3s'; d.p.style.rotate = '0deg';
    d.p.style.transform = `translate(${+cur[1] + sr.left - pr.left}px, ${+cur[2] + sr.top - pr.top}px)`;
    d.p.classList.add('placed');
    later(() => {
      const [bs, bp] = JSON.parse(d.p.dataset.full);
      d.p.style.transition = ''; d.p.style.transform = ''; d.p.style.width = d.p.style.height = '100%';
      d.p.style.backgroundSize = bs; d.p.style.backgroundPosition = bp;
      slot.appendChild(d.p); sfx.plink(4 - this.left); later(() => sfx.pop(), 80);
      const c = centerOf(this.root, slot); sparkleAt(this.root, c.x, c.y, 4);
      if(--this.left === 0) this.done();
    }, 320);
  },
  done(){
    restart(this.board, 'lr-bounce'); this.board.classList.add('whole');
    speak(SAY.puzzleDone); celebrate('Ta-da!'); burstConfetti(30);
    this.level++; store.set('play_puzzle', this.level);
    later(() => { this.board.classList.remove('whole'); if(currentScreen === 'puzzle') this.round(); }, 3200);
  },
  enter(){ later(() => this.round(), 60); speakNext(SAY.puzzleStart); },
  leave(){ this.drop(null); }
});

window.classicPhrases = () => [...Object.values(SAY), ...buddies.map(b => `${b.name} is hungry!`), ...buddies.map(b => `Super! ${b.cheer}`)];
})();
