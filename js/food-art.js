// Idris Play — drawn food, in the same soft style as the dino buddy (flat shapes, gentle highlights,
// no dark outlines). Each is a 100×100 SVG body; used by Dino Lunch.
(function(){
'use strict';
const shine = (x, y, rx = 7, ry = 11, r = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45" transform="rotate(${r} ${x} ${y})"/>`;
const leaf = (x, y, r = -30, c = '#4ADE80', s = 1) => `<path d="M0 0 Q14 -14 30 -4 Q16 10 0 0Z" fill="${c}" transform="translate(${x} ${y}) rotate(${r}) scale(${s})"/><path d="M2 -1 Q14 -6 26 -4" stroke="#22A04B" stroke-width="1.6" fill="none" opacity=".6" transform="translate(${x} ${y}) rotate(${r}) scale(${s})"/>`;
const FOOD = {
  apple: `<ellipse cx="50" cy="92" rx="26" ry="5" fill="#000" opacity=".08"/>
    <path d="M50 30 C34 18 12 26 14 52 C16 78 34 92 50 86 C66 92 84 78 86 52 C88 26 66 18 50 30Z" fill="#F43F5E"/>
    <path d="M50 30 C66 18 88 26 86 52 C84 76 70 88 58 88 C76 74 80 48 66 34Z" fill="#E11D48" opacity=".55"/>
    ${shine(32, 46)}<path d="M50 32 Q50 18 56 10" stroke="#8B5A2B" stroke-width="5" fill="none" stroke-linecap="round"/>${leaf(54, 18, -25)}`,
  watermelon: `<ellipse cx="50" cy="86" rx="40" ry="5" fill="#000" opacity=".08"/>
    <path d="M8 40 A42 42 0 0 0 92 40Z" fill="#22C55E"/><path d="M13 40 A37 37 0 0 0 87 40Z" fill="#DCFCE7"/>
    <path d="M17 40 A33 33 0 0 0 83 40Z" fill="#FB7185"/><path d="M17 40 A33 33 0 0 0 50 73 L50 40Z" fill="#F43F5E" opacity=".35"/>
    ${[[32, 50], [44, 58], [56, 58], [68, 50], [50, 47], [38, 46], [62, 46]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="3.6" fill="#3F2A1D"/>`).join('')}`,
  banana: `<ellipse cx="50" cy="88" rx="32" ry="5" fill="#000" opacity=".08"/>
    <path d="M20 30 Q16 70 50 80 Q80 86 88 64 Q66 74 48 62 Q30 50 28 28Z" fill="#FACC15"/>
    <path d="M28 28 Q30 50 48 62 Q66 74 88 64 Q84 74 74 78 Q52 80 38 64 Q26 50 24 30Z" fill="#EAB308" opacity=".6"/>
    <path d="M18 24 l10 4 -2 6 -8 -4z" fill="#8B5A2B"/><circle cx="88" cy="63" r="3" fill="#8B5A2B"/>${shine(30, 54, 4, 12, -20)}`,
  broccoli: `<ellipse cx="50" cy="92" rx="22" ry="5" fill="#000" opacity=".08"/>
    <path d="M42 56 L38 88 Q50 94 62 88 L58 56Z" fill="#A3E635"/><path d="M50 60 L50 86" stroke="#84CC16" stroke-width="3"/>
    ${[[32, 44, 15], [50, 34, 18], [68, 44, 15], [40, 56, 13], [60, 56, 13], [50, 50, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#16A34A"/>`).join('')}
    ${[[30, 40], [48, 28], [66, 40], [46, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#4ADE80" opacity=".7"/>`).join('')}`,
  leaves: `<ellipse cx="50" cy="90" rx="30" ry="5" fill="#000" opacity=".08"/>
    <path d="M50 86 Q18 70 22 30 Q46 36 54 70Z" fill="#22C55E"/><path d="M50 84 Q32 60 26 36" stroke="#15803D" stroke-width="2.5" fill="none" opacity=".6"/>
    <path d="M52 86 Q86 66 78 22 Q52 32 48 70Z" fill="#4ADE80"/><path d="M52 84 Q70 56 76 28" stroke="#16A34A" stroke-width="2.5" fill="none" opacity=".6"/>
    ${shine(34, 50, 4, 10, 20)}`,
  strawberry: `<ellipse cx="50" cy="92" rx="22" ry="5" fill="#000" opacity=".08"/>
    <path d="M50 88 C30 80 18 60 20 42 C22 30 34 28 50 32 C66 28 78 30 80 42 C82 60 70 80 50 88Z" fill="#F43F5E"/>
    ${[[34, 46], [46, 44], [58, 46], [68, 50], [30, 58], [42, 58], [54, 60], [64, 62], [40, 70], [52, 74], [60, 72]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#FDE68A"/>`).join('')}
    <path d="M30 32 L40 24 L44 32 L50 20 L56 32 L60 24 L70 32 Q50 40 30 32Z" fill="#22C55E"/>${shine(30, 48, 4, 9, 20)}`,
  carrot: `<ellipse cx="50" cy="92" rx="18" ry="4" fill="#000" opacity=".08"/>
    <path d="M36 30 Q50 24 64 30 L52 90 Q50 94 48 90Z" fill="#FB923C"/><path d="M50 26 Q60 26 64 30 L52 90Z" fill="#EA580C" opacity=".35"/>
    <path d="M40 44 h8 M44 58 h8 M46 72 h6" stroke="#C2410C" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
    <path d="M50 28 Q40 10 32 8 Q42 14 46 28Z M50 28 Q50 8 56 4 Q54 16 52 28Z M50 28 Q62 12 70 12 Q60 18 54 28Z" fill="#22C55E"/>`,
  grapes: `<ellipse cx="50" cy="92" rx="22" ry="5" fill="#000" opacity=".08"/>
    <path d="M50 26 Q52 14 60 8" stroke="#8B5A2B" stroke-width="4" fill="none" stroke-linecap="round"/>${leaf(52, 20, -10, '#4ADE80', .9)}
    ${[[36, 36], [50, 34], [64, 36], [43, 50], [57, 50], [30, 50], [70, 50], [36, 64], [50, 64], [64, 64], [43, 77], [57, 77], [50, 89]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#8B5CF6"/><circle cx="${x - 3}" cy="${y - 3}" r="2.6" fill="#fff" opacity=".45"/>`).join('')}`
};
window.idrisFood = id => FOOD[id] ? `<svg class="food-art" viewBox="0 0 100 100" aria-hidden="true">${FOOD[id]}</svg>` : '';
window.idrisFoodBodies = FOOD;
})();
