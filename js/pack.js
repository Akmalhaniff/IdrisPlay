// Idris Play — the cartoon dinosaur pack ("Cute Dinosaurs Color Clip Art" by HalieKStudio on Creative
// Fabrica, used under its commercial licence). Only app-sized PNGs are kept in art/dinos/ — never the
// original files. Each dinosaur has three poses; tapping one in Dino World flips through them.
(function(){
'use strict';
const url = name => `art/dinos/${name}.png`;
const img = (name, cls = '') => `<img class="pack-dino ${cls}" src="${url(name)}" alt="" draggable="false">`;
// [id, name, poses]
const DINOS = [
  ['trex', 'T-Rex', ['trex-1', 'trex-3', 'trex-2']],
  ['triceratops', 'Triceratops', ['triceratops-1', 'triceratops-3', 'triceratops-2']],
  ['stegosaurus', 'Stegosaurus', ['stegosaurus-2', 'stegosaurus-1', 'stegosaurus-3']],
  ['brontosaurus', 'Brontosaurus', ['brontosaurus-3', 'brontosaurus-2', 'brontosaurus-1']],
  ['ankylosaurus', 'Ankylosaurus', ['ankylosaurus-2', 'ankylosaurus-1', 'ankylosaurus-3']],
  ['parasaurolophus', 'Parasaurolophus', ['parasaurolophus-2', 'parasaurolophus-1', 'parasaurolophus-3']],
  ['pachycephalosaurus', 'Pachycephalosaurus', ['pachycephalosaurus-1', 'pachycephalosaurus-3', 'pachycephalosaurus-2']],
  ['dilophosaurus', 'Dilophosaurus', ['dilophosaurus-1', 'dilophosaurus-2', 'dilophosaurus-3']],
  ['dimetrodon', 'Dimetrodon', ['dimetrodon-3', 'dimetrodon-1', 'dimetrodon-2']],
  ['velociraptor', 'Velociraptor', ['velociraptor-2', 'velociraptor-1', 'velociraptor-3']],
  ['pteranodon', 'Pteranodon', ['pteranodon-2', 'pteranodon-1', 'pteranodon-3']],
  ['plesiosaur', 'Plesiosaur', ['plesiosaur-3', 'plesiosaur-1', 'plesiosaur-2']]
];
const LAND = DINOS.filter(d => !['pteranodon', 'plesiosaur'].includes(d[0]));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
window.idrisPack = {
  url, img, DINOS, LAND,
  egg: (n = 1) => img('egg-' + n, 'egg'),
  baby: () => img(pick(['baby-1', 'baby-2', 'baby-3'])),
  randomLand: () => pick(LAND)
};
// the drawn egg everywhere becomes the pack's egg
if(window.idrisDrawn){ const piece = window.idrisDrawn.piece; window.idrisDrawn.piece = id => id === 'egg' ? img('egg-1', 'egg') : piece(id); }
})();
