// Idris Play — "English + Melayu": when switched on in Parent Corner, key words (colours, numbers,
// animals, shapes and praise) are spoken in Malay by the device's own Malay voice; every other
// sentence keeps the natural English voice. The natural voice (Kokoro) has no Malay, so this uses
// the iPad's built-in voice (Settings → Accessibility → Spoken Content → Voices → Malay).
(function(){
'use strict';
const { el } = window.IdrisPlay;
const BM = {
  // colours
  red: 'Merah', blue: 'Biru', yellow: 'Kuning', green: 'Hijau', orange: 'Oren', purple: 'Ungu', pink: 'Merah jambu',
  brown: 'Coklat', black: 'Hitam', white: 'Putih', cyan: 'Biru muda', lime: 'Hijau muda',
  // numbers (words and digits)
  zero: 'Sifar', one: 'Satu', two: 'Dua', three: 'Tiga', four: 'Empat', five: 'Lima', six: 'Enam', seven: 'Tujuh', eight: 'Lapan', nine: 'Sembilan', ten: 'Sepuluh',
  1: 'Satu', 2: 'Dua', 3: 'Tiga', 4: 'Empat', 5: 'Lima', 6: 'Enam', 7: 'Tujuh', 8: 'Lapan', 9: 'Sembilan', 10: 'Sepuluh',
  // shapes
  circle: 'Bulatan', square: 'Segi empat sama', triangle: 'Segi tiga', star: 'Bintang', heart: 'Hati', diamond: 'Berlian', oval: 'Bujur', rectangle: 'Segi empat tepat',
  // animals
  't-rex': 'T-Rex', dinosaur: 'Dinosaur', dog: 'Anjing', cat: 'Kucing', lion: 'Singa', elephant: 'Gajah', monkey: 'Monyet', cow: 'Lembu', duck: 'Itik',
  frog: 'Katak', bird: 'Burung', fish: 'Ikan', bear: 'Beruang', rabbit: 'Arnab', tiger: 'Harimau', fox: 'Musang', wolf: 'Serigala', horse: 'Kuda',
  zebra: 'Zebra', giraffe: 'Zirafah', kangaroo: 'Kanggaru', koala: 'Koala', panda: 'Panda', penguin: 'Penguin', owl: 'Burung hantu', turtle: 'Penyu',
  crocodile: 'Buaya', shark: 'Jerung', octopus: 'Sotong kurita', butterfly: 'Rama-rama', bee: 'Lebah', ladybug: 'Kumbang kura-kura', unicorn: 'Unikorn',
  // praise and little words
  'yay': 'Yeay!', 'great job': 'Bagus!', 'hooray': 'Hore!', 'super': 'Hebat!', 'wow': 'Wah!', 'amazing': 'Pandai!', 'well done': 'Syabas!',
  'yum': 'Sedapnya!', 'yummy': 'Sedap!', 'tap here': 'Tekan sini!', 'your turn': 'Giliran kamu!', 'try this one': 'Cuba yang ini!',
  'blast off': 'Pelancaran!', 'bye bye': 'Selamat tinggal!'
};
const key = t => String(t || '').toLowerCase().replace(/[!.?,]/g, '').trim();
const isOn = () => store.get('lang', 'en') === 'bm';
let msVoice = null;
function pickVoice(){ try{ msVoice = speechSynthesis.getVoices().find(v => /^ms([-_]|$)/i.test(v.lang)) || null; }catch(e){} }
try{ speechSynthesis.addEventListener('voiceschanged', pickVoice); }catch(e){}
pickVoice();

function sayMalay(text){
  if(muted) return true;
  try{
    if(typeof stopVoiceSource === 'function') stopVoiceSource(0.08);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ms-MY'; if(msVoice) u.voice = msVoice;
    u.rate = 0.85; u.pitch = 1.15; u.volume = window.quietMode ? 0.6 : 1;
    speechSynthesis.speak(u);
    return true;
  }catch(e){ return false; }
}
// Wrap the app's voice: a key word goes to Malay, everything else to the natural English voice.
const _speak = window.speak, _speakNext = window.speakNext;
window.speak = function(text, ...rest){ const m = isOn() && BM[key(text)]; if(m && sayMalay(m)) return; return _speak(text, ...rest); };
window.speakNext = function(text, ...rest){ const m = isOn() && BM[key(text)]; if(m && sayMalay(m)) return; return _speakNext(text, ...rest); };

// Parent Corner switch
const box = document.querySelector('#parentPanel .pt-box') || document.querySelector('#parentPanel .pp-card');
const row = el('label', 'pp-row', `<span>🗣️ Language</span><select id="ptLang"><option value="en">English</option><option value="bm">English + Melayu</option></select>`);
box.insertBefore(row, box.firstChild);
const sel = row.querySelector('select'), help = el('div', 'pp-help pt-lang-help');
row.after(help);
const update = () => {
  sel.value = store.get('lang', 'en'); pickVoice();
  help.textContent = sel.value === 'bm' ? (msVoice ? `Malay words use the iPad voice "${msVoice.name}".`
    : 'No Malay voice found on this device yet: on the iPad go to Settings → Accessibility → Spoken Content → Voices → Malay and download it.') : '';
};
sel.addEventListener('change', () => { store.set('lang', sel.value); update(); if(sel.value === 'bm') sayMalay('Merah, kuning, hijau! Satu, dua, tiga!'); });
const _open = window.openParent;
window.openParent = function(){ _open(); update(); };
update();
})();
