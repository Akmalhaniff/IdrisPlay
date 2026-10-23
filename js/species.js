// Idris Play — the dinosaurs of Dino World, using the cartoon dinosaur pack (js/pack.js, art/dinos/).
// Each has a name, a short line to say, a move for when it's tapped, where it lives, and three poses.
(function(){
'use strict';
const P = window.idrisPack;
const info = {
  trex: { say: 'T-Rex! Roar!', act: 'roar' },
  triceratops: { say: 'Triceratops! Three horns!', act: 'stomp' },
  stegosaurus: { say: 'Stegosaurus! Look at my plates!', act: 'wag' },
  brontosaurus: { say: 'Brontosaurus! I am so tall!', act: 'stretch', tall: true },
  ankylosaurus: { say: 'Ankylosaurus! Thump!', act: 'thump' },
  parasaurolophus: { say: 'Parasaurolophus! Toot toot!', act: 'honk' },
  pachycephalosaurus: { say: 'Pachycephalosaurus! Bonk!', act: 'bonk' },
  dilophosaurus: { say: 'Dilophosaurus! Look at my frill!', act: 'roar' },
  dimetrodon: { say: 'Dimetrodon! A sail on my back!', act: 'sway' },
  velociraptor: { say: 'Velociraptor! Zoom!', act: 'zoom' },
  pteranodon: { say: 'Pteranodon! Flap flap!', act: 'flap', where: 'sky' },
  plesiosaur: { say: 'Plesiosaur! Splash!', act: 'swim', where: 'sea' }
};
const SPECIES = P.DINOS.map(([id, name, poses]) => ({ id, name, poses, where: 'land', ...info[id] }));
window.idrisSpecies = SPECIES;
// the picture for a species (pose 0 unless another is asked for)
window.idrisSpeciesSVG = (s, pose = 0) => `<span class="sp-art">${P.img(s.poses[pose % s.poses.length])}</span>`;
})();
