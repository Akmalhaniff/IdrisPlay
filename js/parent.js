// Idris Play — parent tools, all kept on this device only (nothing is sent anywhere):
//  • play timer: when today's time is up a sleepy dino says goodbye and the games rest until a
//    grown-up holds the moon for 3 seconds (that gives 15 more minutes);
//  • play summary: minutes per day for the last week and the most played games;
//  • quiet mode: softer sounds and voice, no big celebrations — for bedtime.
(function(){
'use strict';
const { el, sfx, later, GAMES } = window.IdrisPlay;

// ---------- 📊 play time, counted only while the app is open and visible ----------
const DAYS = 14;
function usage(){ return store.get('usage', {}); }
function tick(){
  if(document.hidden || isLocked()) return;
  const u = usage(), day = todayKey();
  const d = u[day] || (u[day] = { total: 0, games: {} });
  d.total += 10;
  if(currentScreen && currentScreen !== 'home') d.games[currentScreen] = (d.games[currentScreen] || 0) + 10;
  const keys = Object.keys(u).sort((a, b) => new Date(a) - new Date(b));
  while(keys.length > DAYS) delete u[keys.shift()];
  store.set('usage', u);
  checkTimer();
}
setInterval(tick, 10000);
const todaySecs = () => (usage()[todayKey()] || {}).total || 0;
function topGames(days = 7, n = 5){
  const u = usage(), sum = {};
  Object.entries(u).slice(-days).forEach(([, d]) => Object.entries(d.games).forEach(([g, s]) => { sum[g] = (sum[g] || 0) + s; }));
  return Object.entries(sum).sort((a, b) => b[1] - a[1]).slice(0, n);
}
window.idrisTopGames = topGames;

// ---------- ⏰ play timer ----------
const SLEEP_SAY = 'Bye bye! Time to rest! See you later!';
const lock = el('div', 'pt-lock', `<div class="pt-moon" aria-label="Grown-ups: hold for 3 seconds">🌙<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18"/></svg></div>
  <div class="pt-dino">🦖<span>💤</span></div><div class="pt-text">Time to rest!</div><div class="pt-tip">Grown-ups: hold the 🌙 for 3 seconds</div>`);
document.body.appendChild(lock);
function isLocked(){ return lock.classList.contains('show'); }
function limitSecs(){ const m = store.get('timerMin', 0); return m ? (m + (store.get('timerExtra', { day: '' }).day === todayKey() ? store.get('timerExtra').min : 0)) * 60 : 0; }
function checkTimer(){
  const lim = limitSecs();
  if(!lim || isLocked() || todaySecs() < lim) return;
  if(currentScreen !== 'home') try{ goHome(); }catch(e){}
  lock.classList.add('show');
  speak(SLEEP_SAY);
  sfx.tone(520, 0.6, 'sine', 0.2, 260);
}
// hold the moon for 3 s to add 15 minutes
(function(){
  const moon = lock.querySelector('.pt-moon'); let t = null;
  const stop = () => { clearTimeout(t); moon.classList.remove('holding'); };
  moon.addEventListener('pointerdown', e => {
    e.preventDefault(); moon.classList.add('holding');
    t = setTimeout(() => {
      stop();
      const ex = store.get('timerExtra', { day: '', min: 0 });
      store.set('timerExtra', { day: todayKey(), min: (ex.day === todayKey() ? ex.min : 0) + 15 });
      lock.classList.remove('show'); sfx.rise();
    }, 3000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => moon.addEventListener(ev, stop));
})();

// ---------- 🌙 quiet mode ----------
function applyQuiet(){
  const q = window.quietMode = !!store.get('quiet', false);
  document.body.classList.toggle('quiet', q);
  try{ const ctx = getAudioCtx(); if(ctx && ctx.voiceBus) ctx.voiceBus.gain.value = q ? 1.3 : 2.6; if(ctx && ctx.sfxBus) ctx.sfxBus.gain.value = q ? 0.35 : 0.85; }catch(e){}
}
// sound effects dip while the voice talks, from a lower level in quiet mode
window.duckEffects = function(on){
  try{ const ctx = getAudioCtx(); if(ctx && ctx.sfxBus) ctx.sfxBus.gain.setTargetAtTime((on ? 0.3 : 0.85) * (window.quietMode ? 0.4 : 1), ctx.currentTime, 0.05); }catch(e){}
};
document.addEventListener('pointerdown', applyQuiet, { once: true });
applyQuiet();

// ---------- ⚙️ Parent Corner rows ----------
const card = document.querySelector('#parentPanel .pp-card');
const box = el('div', 'pt-box', `
  <label class="pp-row"><span>⏰ Play timer (per day)</span><select id="ptTimer">
    <option value="0">Off</option><option value="10">10 min</option><option value="15">15 min</option><option value="20">20 min</option>
    <option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hour</option></select></label>
  <label class="pp-row"><span>🌙 Quiet mode (bedtime)</span><input type="checkbox" id="ptQuiet" class="pt-switch"></label>
  <div class="pp-row pt-col"><span>📊 Play time this week</span><div class="pt-week"></div><div class="pt-top"></div></div>`);
const anchor = card.querySelector('.pp-note');
card.insertBefore(box, anchor);
const timerSel = box.querySelector('#ptTimer'), quietBox = box.querySelector('#ptQuiet');
timerSel.addEventListener('change', () => { store.set('timerMin', +timerSel.value); store.set('timerExtra', { day: '', min: 0 }); });
quietBox.addEventListener('change', () => { store.set('quiet', quietBox.checked); applyQuiet(); });
const nameOf = id => (homeGames.find(h => h.id === id) || GAMES[id] || { n: id }).n;
const emojiOf = id => (homeGames.find(h => h.id === id) || GAMES[id] || { e: '🎮' }).e;
const mins = s => Math.round(s / 60);
function renderParent(){
  timerSel.value = String(store.get('timerMin', 0));
  quietBox.checked = !!store.get('quiet', false);
  // last 7 days as little bars
  const u = usage(), days = [];
  for(let i = 6; i >= 0; i--){ const d = new Date(); d.setDate(d.getDate() - i); const k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); days.push([d, (u[k] || {}).total || 0]); }
  const max = Math.max(600, ...days.map(d => d[1]));
  box.querySelector('.pt-week').innerHTML = days.map(([d, s]) => `<div class="pt-day"><b>${mins(s)}m</b><i style="height:${Math.max(3, s / max * 70)}px"></i><small>${'SMTWTFS'[d.getDay()]}</small></div>`).join('');
  const top = topGames();
  box.querySelector('.pt-top').innerHTML = top.length ? 'Most played: ' + top.map(([g, s]) => `${emojiOf(g)} ${nameOf(g)} <b>${mins(s)}m</b>`).join(' · ') : 'No play time yet.';
}
const _openParent = window.openParent;
window.openParent = function(){ _openParent(); renderParent(); };

window.parentPhrases = () => [SLEEP_SAY];
})();
