// Idris Play — twelve real dinosaurs, drawn in the dino buddy's soft style (flat shapes, gentle
// highlights, big friendly eyes, no dark outlines). Each drawing faces right in a 160×120 box.
(function(){
'use strict';
const eye = (x, y, r = 8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + r * .15}" cy="${y + r * .1}" r="${r * .55}" fill="#1F2937"/><circle cx="${x + r * .35}" cy="${y - r * .2}" r="${r * .2}" fill="#fff"/>`;
const cheek = (x, y, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FF7AA8" opacity=".55"/>`;
const smile = (x1, y1, x2, y2, d = 6) => `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + d} ${x2} ${y2}" stroke="#1F2937" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
const shade = (c, a = .18) => `opacity="${a}" fill="${c}"`;
const leg = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${c}"/>`;
const ground = `<ellipse cx="80" cy="114" rx="62" ry="5" fill="#000" opacity=".08"/>`;

const SPECIES = [
  { id: 'trex', name: 'T-Rex', say: 'T-Rex! The king of the dinosaurs! Roar!', act: 'roar', where: 'land', svg: `${ground}
    <path d="M44 84 Q10 92 4 66 Q20 80 46 72Z" fill="#F97316"/>
    <ellipse cx="70" cy="78" rx="30" ry="24" fill="#F97316"/><ellipse cx="76" cy="84" rx="16" ry="14" fill="#FED7AA"/>
    ${leg(54, 92, 12, 22, '#EA580C')}${leg(78, 92, 12, 22, '#EA580C')}
    <path d="M92 74 q10 0 10 8" stroke="#EA580C" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M84 56 Q82 24 112 22 Q146 20 150 42 Q152 58 128 62 Q104 66 96 66Z" fill="#F97316"/>
    <path d="M110 58 l4 6 4 -6 4 6 4 -6 4 6 4 -6" fill="#fff"/>${eye(112, 36, 7)}${cheek(104, 50)}${smile(116, 52, 146, 46, 4)}` },
  { id: 'triceratops', name: 'Triceratops', say: 'Triceratops! Three horns!', act: 'stomp', where: 'land', svg: `${ground}
    <path d="M30 80 Q8 84 6 70 Q18 76 32 72Z" fill="#60A5FA"/>
    <ellipse cx="66" cy="78" rx="40" ry="24" fill="#60A5FA"/><ellipse cx="66" cy="86" rx="28" ry="12" ${shade('#1E40AF', .15)}/>
    ${leg(38, 92, 13, 20, '#3B82F6')}${leg(54, 94, 13, 18, '#3B82F6')}${leg(80, 94, 13, 18, '#3B82F6')}${leg(94, 92, 13, 20, '#3B82F6')}
    <path d="M94 64 Q92 26 122 30 Q132 50 118 76Z" fill="#FBBF24"/>${[40, 50, 60, 70].map(y => `<circle cx="${y > 60 ? 116 : 112}" cy="${y}" r="3" fill="#F59E0B"/>`).join('')}
    <ellipse cx="128" cy="68" rx="22" ry="16" fill="#60A5FA"/>
    <path d="M124 54 L132 30 L136 54Z M138 58 L152 40 L146 62Z" fill="#FFF7E6"/><path d="M146 66 L158 64 L148 72Z" fill="#FFF7E6"/>
    ${eye(130, 64, 6)}${cheek(124, 74, 4)}${smile(134, 76, 146, 74, 3)}` },
  { id: 'stegosaurus', name: 'Stegosaurus', say: 'Stegosaurus! Look at my plates!', act: 'wag', where: 'land', svg: `${ground}
    ${[[44, 52], [58, 40], [74, 36], [90, 42], [104, 54]].map(([x, y]) => `<path d="M${x - 9} ${y + 18} L${x} ${y} L${x + 9} ${y + 18}Z" fill="#FB923C"/>`).join('')}
    <g class="sp-tail"><path d="M36 82 Q10 86 4 70 Q20 76 40 72Z" fill="#84CC16"/><path d="M6 70 l-4 -10 8 6z M14 74 l-2 -12 7 9z" fill="#FFF7E6"/></g>
    <ellipse cx="74" cy="78" rx="40" ry="22" fill="#84CC16"/><ellipse cx="78" cy="86" rx="26" ry="10" ${shade('#365314', .15)}/>
    ${leg(46, 92, 12, 20, '#65A30D')}${leg(62, 94, 12, 18, '#65A30D')}${leg(88, 94, 12, 18, '#65A30D')}${leg(102, 92, 12, 20, '#65A30D')}
    <path d="M108 72 Q128 62 144 70 Q150 80 136 84 Q120 86 108 82Z" fill="#84CC16"/>${eye(134, 72, 5.5)}${cheek(128, 80, 3.5)}${smile(138, 80, 148, 78, 2)}` },
  { id: 'brachiosaurus', name: 'Brachiosaurus', say: 'Brachiosaurus! I am so tall!', act: 'stretch', where: 'land', tall: true, svg: `${ground}
    <path d="M40 84 Q14 88 8 76 Q22 80 42 76Z" fill="#C084FC"/>
    <ellipse cx="66" cy="80" rx="34" ry="20" fill="#C084FC"/><ellipse cx="66" cy="88" rx="22" ry="9" ${shade('#581C87', .15)}/>
    ${leg(42, 90, 13, 22, '#A855F7')}${leg(56, 92, 13, 20, '#A855F7')}${leg(78, 92, 13, 20, '#A855F7')}${leg(90, 90, 13, 22, '#A855F7')}
    <g class="sp-neck"><path d="M86 70 Q104 44 108 22" stroke="#C084FC" stroke-width="18" fill="none" stroke-linecap="round"/>
    <ellipse cx="118" cy="18" rx="16" ry="11" fill="#C084FC"/>${eye(118, 14, 5)}${cheek(112, 22, 3.5)}${smile(122, 22, 132, 20, 2)}</g>` },
  { id: 'diplodocus', name: 'Diplodocus', say: 'Diplodocus! Long neck, long tail!', act: 'sway', where: 'land', svg: `${ground}
    <path d="M50 82 Q20 92 0 76 Q24 80 52 74Z" fill="#4ADE80"/>
    <ellipse cx="74" cy="80" rx="30" ry="18" fill="#4ADE80"/><ellipse cx="76" cy="88" rx="20" ry="8" ${shade('#14532D', .15)}/>
    ${leg(54, 90, 12, 22, '#22C55E')}${leg(68, 92, 12, 20, '#22C55E')}${leg(84, 92, 12, 20, '#22C55E')}${leg(94, 90, 12, 22, '#22C55E')}
    <g class="sp-neck"><path d="M98 74 Q124 60 136 38" stroke="#4ADE80" stroke-width="13" fill="none" stroke-linecap="round"/>
    <ellipse cx="144" cy="34" rx="13" ry="9" fill="#4ADE80"/>${eye(145, 30, 4.5)}${smile(148, 38, 156, 36, 2)}</g>` },
  { id: 'spinosaurus', name: 'Spinosaurus', say: 'Spinosaurus! A big sail on my back!', act: 'roar', where: 'land', svg: `${ground}
    <path d="M44 66 Q50 20 76 16 Q100 18 104 64Z" fill="#F43F5E"/>${[56, 68, 80, 92].map(x => `<path d="M${x} 62 L${x + 2} 26" stroke="#BE123C" stroke-width="3" opacity=".5"/>`).join('')}
    <path d="M42 84 Q10 92 4 70 Q20 80 46 74Z" fill="#38BDF8"/>
    <ellipse cx="74" cy="78" rx="32" ry="22" fill="#38BDF8"/><ellipse cx="78" cy="86" rx="18" ry="12" fill="#E0F2FE"/>
    ${leg(58, 92, 12, 22, '#0EA5E9')}${leg(82, 92, 12, 22, '#0EA5E9')}
    <path d="M98 66 Q104 52 120 52 Q152 52 156 62 Q154 70 120 70Z" fill="#38BDF8"/>${eye(116, 56, 6)}${smile(124, 64, 152, 62, 3)}` },
  { id: 'ankylosaurus', name: 'Ankylosaurus', say: 'Ankylosaurus! I have a club tail! Thump!', act: 'thump', where: 'land', svg: `${ground}
    <g class="sp-tail"><path d="M30 84 Q20 86 16 82" stroke="#F59E0B" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="13" cy="80" r="11" fill="#B45309"/></g>
    <ellipse cx="72" cy="82" rx="46" ry="20" fill="#F59E0B"/>${[[44, 74], [60, 68], [78, 66], [96, 70], [52, 84], [72, 80], [92, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#B45309"/>`).join('')}
    ${leg(42, 92, 12, 18, '#D97706')}${leg(58, 94, 12, 16, '#D97706')}${leg(86, 94, 12, 16, '#D97706')}${leg(100, 92, 12, 18, '#D97706')}
    <path d="M110 76 Q130 66 146 76 Q150 88 132 90 Q116 90 110 86Z" fill="#F59E0B"/>${eye(134, 78, 5.5)}${cheek(126, 84, 3.5)}${smile(138, 86, 148, 84, 2)}` },
  { id: 'parasaurolophus', name: 'Parasaurolophus', say: 'Parasaurolophus! Toot toot! I have a trumpet on my head!', act: 'honk', where: 'land', svg: `${ground}
    <path d="M44 82 Q12 90 6 68 Q22 78 48 72Z" fill="#FACC15"/>
    <ellipse cx="72" cy="78" rx="30" ry="22" fill="#FACC15"/><ellipse cx="76" cy="86" rx="18" ry="11" fill="#FEF9C3"/>
    ${leg(56, 92, 12, 22, '#EAB308')}${leg(80, 92, 12, 22, '#EAB308')}
    <path d="M92 66 Q96 44 108 40" stroke="#FACC15" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M104 34 Q90 20 70 18" stroke="#F97316" stroke-width="8" fill="none" stroke-linecap="round"/>
    <ellipse cx="116" cy="40" rx="18" ry="12" fill="#FACC15"/>${eye(114, 36, 5.5)}${cheek(108, 44, 3.5)}${smile(120, 46, 132, 44, 2)}` },
  { id: 'pachycephalosaurus', name: 'Pachycephalosaurus', say: 'Pachycephalosaurus! Bonk! I have a hard head!', act: 'bonk', where: 'land', svg: `${ground}
    <path d="M42 84 Q12 90 6 70 Q22 80 46 74Z" fill="#F472B6"/>
    <ellipse cx="70" cy="80" rx="28" ry="22" fill="#F472B6"/><ellipse cx="74" cy="88" rx="16" ry="10" fill="#FCE7F3"/>
    ${leg(56, 94, 12, 20, '#EC4899')}${leg(78, 94, 12, 20, '#EC4899')}
    <path d="M90 66 Q96 54 104 50" stroke="#F472B6" stroke-width="14" fill="none" stroke-linecap="round"/>
    <ellipse cx="114" cy="50" rx="20" ry="16" fill="#F472B6"/><path d="M98 44 Q112 20 130 42Z" fill="#FDF2F8"/>
    ${[[98, 50], [104, 58], [130, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#BE185D"/>`).join('')}${eye(118, 48, 5.5)}${smile(120, 58, 132, 56, 2)}` },
  { id: 'velociraptor', name: 'Velociraptor', say: 'Velociraptor! I am super fast! Zoom!', act: 'zoom', where: 'land', svg: `${ground}
    <path d="M56 76 Q20 72 4 60 Q26 70 58 68Z" fill="#2DD4BF"/>
    <ellipse cx="74" cy="74" rx="22" ry="15" fill="#2DD4BF"/><ellipse cx="78" cy="80" rx="12" ry="8" fill="#CCFBF1"/>
    <path d="M64 84 L58 112 M80 86 L84 112" stroke="#14B8A6" stroke-width="7" stroke-linecap="round"/>
    <path d="M84 74 Q96 80 92 90 Q86 84 80 82Z" fill="#F59E0B"/>
    <path d="M90 66 Q98 50 108 48" stroke="#2DD4BF" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M100 42 Q120 38 136 48 Q128 56 104 54Z" fill="#2DD4BF"/><path d="M96 40 l4 -10 4 8 4 -9 3 10" fill="#F59E0B"/>${eye(110, 46, 5)}${smile(116, 52, 132, 50, 2)}` },
  { id: 'pteranodon', name: 'Pteranodon', say: 'Pteranodon! I can fly! Flap flap!', act: 'flap', where: 'sky', svg: `
    <g class="sp-wing l"><path d="M70 58 Q36 30 4 52 Q30 56 44 66 Q58 64 70 66Z" fill="#FB7185"/></g>
    <g class="sp-wing r"><path d="M90 58 Q124 30 156 52 Q130 56 116 66 Q102 64 90 66Z" fill="#FDA4AF"/></g>
    <ellipse cx="80" cy="64" rx="14" ry="12" fill="#FB7185"/><ellipse cx="80" cy="68" rx="8" ry="7" fill="#FFE4E6"/>
    <circle cx="86" cy="50" r="11" fill="#FB7185"/><path d="M80 44 L64 34 L84 40Z" fill="#E11D48"/><path d="M94 48 L122 54 L94 56Z" fill="#FDBA74"/>${eye(88, 48, 4.5)}` },
  { id: 'mosasaurus', name: 'Mosasaurus', say: 'Mosasaurus! I swim in the water! Splash!', act: 'swim', where: 'sea', svg: `
    <path d="M30 70 Q10 60 2 74 Q12 72 14 84 Q20 72 34 76Z" fill="#3B82F6"/>
    <path d="M30 72 Q60 54 104 58 Q140 60 154 70 Q140 82 104 82 Q60 86 30 76Z" fill="#3B82F6"/><path d="M40 78 Q80 86 140 76 Q120 84 90 84 Q60 86 40 78Z" fill="#DBEAFE"/>
    <path d="M70 80 Q66 96 54 98 Q62 86 62 80Z M100 82 Q98 96 88 100 Q92 88 92 82Z" fill="#2563EB"/>
    <path d="M120 64 l4 -8 4 8 4 -8 4 8" fill="#2563EB"/>${eye(132, 66, 5)}${smile(136, 74, 152, 72, 2)}` }
];
window.idrisSpecies = SPECIES;
window.idrisSpeciesSVG = s => `<svg class="sp-art" viewBox="0 0 160 120" aria-hidden="true">${s.svg}</svg>`;
})();
