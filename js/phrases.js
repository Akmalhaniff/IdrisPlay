// Every sentence Idris Play can say. Used to pre-record the natural voice into voice/<voice>/
// so it plays on the iPad without a PC (see voice.js + server.js). When you add new speech:
//  • a plain speak('...') / pick([...]) sentence is found automatically from the source code;
//  • a sentence built from data (`${letter} is for ${word}`) needs a line in dynamicPhrases() below.
// Then run `npm start`, open http://localhost:3000 once, and the server records anything missing.
(function(){
'use strict';

const SPEECH_CALL = /\b(?:speak|speakSlow|sayLetter|singSayLetter|playAiVoice|pick)\(/g;
const LIST_DECL = /\b(?:const|let)\s+(?:praises|titles|words|lines)\s*=\s*[[{]/g;

// From `start` (just after an opening bracket) return the text up to its matching close bracket.
function balanced(src, start){
  let depth = 1, i = start, q = null;
  for(; i < src.length && depth; i++){
    const c = src[i];
    if(q){ if(c === '\\') i++; else if(c === q) q = null; continue; }
    if(c === '"' || c === "'" || c === '`') q = c;
    else if('([{'.includes(c)) depth++;
    else if(')]}'.includes(c)) depth--;
  }
  return src.slice(start, i - 1);
}

// Plain '...' / "..." strings (not template strings, and not fragments like ' is hungry!').
function literals(code){
  const out = [];
  for(const m of code.matchAll(/(['"])((?:\\.|(?!\1)[^\\])*)\1/g)){
    const s = m[2].replace(/\\(['"\\])/g, '$1');
    if(s && s === s.trim()) out.push(s);
  }
  return out;
}

function staticPhrases(src){
  const out = [];
  for(const re of [SPEECH_CALL, LIST_DECL]){
    re.lastIndex = 0;
    let m;
    while((m = re.exec(src))) out.push(...literals(balanced(src, m.index + m[0].length)));
  }
  return out;
}

function dynamicPhrases(name){
  const p = [];
  colors.forEach(c => p.push(c.name));
  animals.forEach(a => p.push(a.n, a.s));
  shapes.forEach(s => p.push(s.n));
  numWords.forEach(w => p.push(w));
  abc.forEach(({ l, w, ph }) => p.push(
    l, `${l}! ${l} says "${ph}"! ${w}!`, `${l}! Try another letter!`, `Letter ${l}! ${l} says "${ph}"! ${w}!`,
    `${l}! ${w}!`, `Peek-a-boo! Letter ${l}! /${ph}/ /${ph}/ ${w}!`, `${l}! ${l} is for ${w}!`, `${l}. ${l} for ${w}`,
    `${l}! ${ph}... ${ph}... ${w}!`, `Great job! Live Letter ${l} is alive!`));
  biniWords.forEach(b => p.push(`Awesome! You spelled ${b.word}! ${b.sound}`, `${b.word}! ${b.name}! ${b.sound}`));
  spellWords.forEach(s => p.push(s.w, `${s.w}! Hooray, you spelled ${s.w}!`));
  abcSongSteps.forEach(s => p.push(s.text));
  surpriseToys.forEach(t => p.push(`Pop! ${t.n}!`));
  sortItems.forEach(s => p.push(s.color));
  peekSpots.forEach(spot => spot.creatures.forEach(c => p.push(`Peek a boo! ${c.n}! ${c.s}`)));
  buddies.forEach(b => p.push(`${b.name} is hungry!`, `Super! ${b.cheer}`));
  vehiclesList.forEach(v => p.push(v.s, v.n));
  ['piano', 'xylophone', 'guitar', 'flute', 'drum'].forEach(i => p.push(i));
  homeGames.forEach(g => p.push(g.n));
  Object.values(AI_VOICES).forEach(v => p.push(v.sample));
  for(let n = 1; n <= 40; n++) p.push(`Your stickers! You have ${n}!`);
  p.push(`Hi ${name}! What shall we play?`, ...MASCOT_LINES(name));
  if(window.funPhrases) p.push(...window.funPhrases(name));
  if(window.learnPhrases) p.push(...window.learnPhrases(name));
  return p;
}

window.allSpeechPhrases = async function(name = kidName){
  const set = new Set();
  const add = t => { t = String(t || '').replace(/\s+/g, ' ').trim(); if(/[A-Za-z0-9]/.test(t)) set.add(t); };
  for(const f of ['index.html', 'js/fun.js', 'js/learn.js']){
    try{ staticPhrases(await (await fetch(f, { cache: 'no-store' })).text()).forEach(add); }catch(e){ console.warn('phrases: could not read', f, e); }
  }
  dynamicPhrases(name).forEach(add);
  return [...set];
};
})();
