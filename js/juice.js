// Idris Play — made for 2-year-olds, across every game:
//  • everything he taps squishes like jelly, so every touch feels alive;
//  • his drawn buddy dino sits in the top bar of every game: hops when he gets something right,
//    dances on a big win, giggles when tapped — never over the game itself;
//  • the voice says less: long sentences are cut to a few happy words.
(function(){
'use strict';
const { sfx, el, later } = window.IdrisPlay;
const restart = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

// ---------- 🍮 jelly squish on every tap ----------
const TAPPABLE = 'button, [onclick], .draggable, .so-item, .lu-food, .fb-food, .pz-piece, .pb-spot, .dw-dino, .mu-key, .bp-bubble, .fi-fish, .pk-dino, .egg, .bath-pet, .color-tile, .animal-card, .shape-card, .mem-card, .wb-tile, .bs-bubble, .tr-chip, .pi-b';
document.addEventListener('pointerdown', e => {
  if(!document.body.classList.contains('in-game')) return;
  const n = e.target.closest(TAPPABLE);
  if(n && !n.closest('.game-bar')) restart(n, 'jelly');
}, { capture: true, passive: true });

// ---------- 🦖 buddy in the top bar ----------
const buddy = el('button', 'gb-buddy', window.idrisBuddySVG);
buddy.setAttribute('aria-label', 'Dino buddy');
document.getElementById('gameBar').appendChild(buddy);
buddy.addEventListener('click', () => { restart(buddy, 'giggle'); sfx.giggle(); });
// clear each move when it ends so the next one can play
buddy.addEventListener('animationend', e => { if(e.target === buddy) buddy.classList.remove('hop', 'dance', 'giggle'); });
const _confetti = window.burstConfetti;
window.burstConfetti = function(n, color){
  _confetti(n, color);
  if(n >= 28) restart(buddy, 'dance');            // a big win
  else if(n >= 6 && !buddy.classList.contains('dance')) restart(buddy, 'hop');   // a little win
};
setInterval(() => { if(document.body.classList.contains('in-game') && Math.random() < .5) restart(buddy, 'blink'); }, 3000);

// ---------- 🗣️ fewer words ----------
const SHORT = {
  'Tap the egg! What is inside?': 'Tap the egg!',
  'All soapy! Now tap the shower!': 'Shower time!',
  'Bath time! Scrub the mud away!': 'Bath time!',
  'Make a silly face! Tap the buttons!': 'Silly face!',
  'We are in space! Move the rocket and catch the stars!': 'Catch the stars!',
  'Star power! Where shall we go?': 'Pick a planet!',
  'Magic garden! Tap the dirt to plant a seed!': 'Plant a seed!',
  'Join the dots! Start at one!': 'Join the dots!',
  'I was sleeping! Let us play!': 'Yawn! Hello!',
  "Hi sweetie! I'm so happy to play with you today!": 'Hi sweetie!',
  'Good morning, friend! Ready to learn colours and A B C?': 'Good morning!',
  'Dino dig! Rub the sand to find the bones!': 'Find the bones!',
  'Dino lunch! The dino is hungry!': 'Dino is hungry!',
  'I am full! Thank you! Time for a nap!': 'All full! Nap time!',
  'Dino peekaboo! Tap the dinos when they pop out!': 'Tap the dinos!',
  'Bye bye! Time to rest! See you later!': 'Bye bye! Rest time!',
  'Peek a boo! Who is hiding? Tap to see!': 'Who is hiding?',
  'Feed your buddy! Drag the food to the mouth!': 'Feed your buddy!',
  'Pop pop pop! Pop all the bubbles!': 'Pop pop pop!',
  'Pop the bubbles! What is inside?': 'Pop the bubbles!',
  'Tap a fish to catch it!': 'Catch a fish!',
  'Puzzle time! Put the pieces in place!': 'Puzzle time!',
  'Dino world! Tap a dinosaur to say hello!': 'Dino world!',
  'T-Rex! The king of the dinosaurs! Roar!': 'T-Rex! Roar!',
  'Ankylosaurus! I have a club tail! Thump!': 'Ankylosaurus! Thump!',
  'Parasaurolophus! Toot toot! I have a trumpet on my head!': 'Parasaurolophus! Toot toot!',
  'Pachycephalosaurus! Bonk! I have a hard head!': 'Pachycephalosaurus! Bonk!',
  'Velociraptor! I am super fast! Zoom!': 'Velociraptor! Zoom!',
  'Pteranodon! I can fly! Flap flap!': 'Pteranodon! Flap flap!',
  'Mosasaurus! I swim in the water! Splash!': 'Mosasaurus! Splash!',
  'Beep beep! Tap a vehicle to drive!': 'Beep beep!',
  'Oh no! Fire! Call the fire truck!': 'Oh no! Fire truck!',
  'Hooray! The fire is out! Thank you, fire truck!': 'Hooray! Fire out!',
  'Dino band! Tap the keys to make music!': 'Dino band!',
  'Put each toy in the box with the same colour!': 'Match the colours!'
};
const RULES = [
  [/^Sparkly clean! Thank you! Happy .+!$/, 'Sparkly clean!'],
  [/^(Peek a boo! [^!]+! [^!]+!) .+$/, '$1'],
  [/^Let's play .+! Tap the shining key!$/, 'Tap the shining key!'],
  [/^You played .+! Hooray!$/, 'Hooray!'],
  [/^(Hi [^!]+!) What shall we play\?$/, '$1']
];
function shorten(text){
  const t = String(text || '').trim();
  if(SHORT[t]) return SHORT[t];
  for(const [re, to] of RULES) if(re.test(t)) return t.replace(re, to);
  return text;
}
window.shortenSpeech = shorten;
const _speak = window.speak, _speakNext = window.speakNext;
window.speak = (text, ...rest) => _speak(shorten(text), ...rest);
window.speakNext = (text, ...rest) => _speakNext(shorten(text), ...rest);
})();
