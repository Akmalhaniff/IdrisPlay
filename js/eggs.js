// Idris Play — dino eggs as the reward that ties the games together.
// Finishing a round in any game (a big win) earns an egg. It waits quietly in the top bar (or next to
// the greeting at home); he taps it, it cracks right there, a baby dinosaur pops out, says hello and
// walks off to live in Dino World. Dino World starts with three dinosaurs; each egg brings a new one.
(function(){
'use strict';
const { sfx, el, later } = window.IdrisPlay;
const SPECIES = window.idrisSpecies;
const START = ['trex', 'triceratops', 'stegosaurus'];
const MAX_WAITING = 3, GAP_MS = 60000;   // at most one egg a minute, three waiting at once

const owned = () => { const o = store.get('dinos', null); return Array.isArray(o) && o.length ? o : START.slice(); };
const waiting = () => store.get('eggsWaiting', 0);
window.idrisOwnedDinos = owned;
const SAY = {
  earn: 'You got a dino egg! Tap it!',
  baby: s => `A baby ${s.name}! Off to Dino World!`,
  again: 'Another dino friend!'
};

// ---------- the egg buttons: one in the game bar, one at home ----------
const EGG = () => window.idrisDrawn.piece('egg');
function makeBtn(){
  const b = el('button', 'egg-reward', `<span class="er-egg">${EGG()}</span><b class="er-count"></b><span class="er-baby"></span>`);
  b.setAttribute('aria-label', 'Dino egg');
  b.addEventListener('click', e => { e.stopPropagation(); hatch(b); });
  return b;
}
const barBtn = makeBtn(), homeBtn = makeBtn();
document.getElementById('gameBar').appendChild(barBtn);
document.querySelector('.home-hero').appendChild(homeBtn);
function show(){
  const n = waiting();
  [barBtn, homeBtn].forEach(b => {
    b.classList.toggle('has', n > 0);
    b.querySelector('.er-count').textContent = n > 1 ? n : '';
  });
}
show();

// ---------- earning: every big win (the 30-piece confetti) can give an egg ----------
let lastEgg = 0;
const _confetti = window.burstConfetti;
window.burstConfetti = function(n, color){
  _confetti(n, color);
  if(n >= 28) later(earn, 1800);
};
function earn(){
  const now = Date.now();
  if(now - lastEgg < GAP_MS || waiting() >= MAX_WAITING) return;
  lastEgg = now;
  store.set('eggsWaiting', waiting() + 1);
  show();
  [barBtn, homeBtn].forEach(b => { b.classList.remove('arrive'); void b.offsetWidth; b.classList.add('arrive'); });
  sfx.tone(700, 0.15, 'sine', 0.2, 1100); later(() => sfx.tone(900, 0.2, 'sine', 0.2, 1400), 150);
  speakNext(SAY.earn);
}
window.idrisEarnEgg = earn;

// ---------- hatching, right where the egg is ----------
function hatch(b){
  if(!waiting() || b.classList.contains('cracking')) return;
  b.classList.add('cracking');
  sfx.crack(); later(() => sfx.crack(), 250); later(() => sfx.crack(), 500);
  later(() => {
    const have = owned();
    const next = SPECIES.find(s => !have.includes(s.id)) || SPECIES[Math.floor(Math.random() * SPECIES.length)];
    const isNew = !have.includes(next.id);
    if(isNew){ have.push(next.id); store.set('dinos', have); }
    store.set('eggsWaiting', Math.max(0, waiting() - 1));
    const baby = b.querySelector('.er-baby');
    baby.innerHTML = window.idrisSpeciesSVG(next);
    b.classList.remove('cracking'); b.classList.add('hatched');
    sfx.pop(); later(() => sfx.boing(), 120);
    burstConfettiSmall();
    speak(isNew ? SAY.baby(next) : SAY.again);
    if(isNew) window.dispatchEvent(new CustomEvent('idris-dino-hatched', { detail: next.id }));
    later(() => { b.classList.remove('hatched'); baby.innerHTML = ''; show(); }, 3200);
  }, 800);
}
// a little confetti that doesn't count as a win (so it can't earn another egg)
function burstConfettiSmall(){ try{ _confetti(14); }catch(e){} }

window.eggPhrases = () => [SAY.earn, SAY.again, ...SPECIES.map(SAY.baby)];
})();
