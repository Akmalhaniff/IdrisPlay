// Idris Play — hand-drawn home world: the walking dinosaurs and palm trees in the home scene,
// drawn as SVG in place of emoji.
(function(){
'use strict';
const K = '#2B2B2B';                                   // marker outline
const o = (w = 3.2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const eye = (x, y, r = 4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${o(2)}/><circle cx="${x + r * .25}" cy="${y + r * .15}" r="${r * .5}" fill="${K}"/>`;
const smile = (x1, y, x2, d = 6) => `<path d="M${x1} ${y} Q${(x1 + x2) / 2} ${y + d} ${x2} ${y}" fill="none" ${o(2.6)}/>`;
// a little side-view dino used by several icons (faces right)
const dino = (c = '#6BCB77', b = '#C8F5B0', extra = '') => `
  <path d="M22 64 Q6 66 6 52 Q14 60 26 56Z" fill="${c}" ${o()}/>
  <path d="M30 46 l2-9 6 6 3-9 6 7 4-8 5 8" fill="#FFB020" ${o(2.4)}/>
  <ellipse cx="44" cy="62" rx="22" ry="18" fill="${c}" ${o()}/>
  <ellipse cx="48" cy="66" rx="12" ry="11" fill="${b}"/>
  <circle cx="62" cy="38" r="16" fill="${c}" ${o()}/><ellipse cx="74" cy="44" rx="12" ry="9" fill="${c}" ${o()}/>
  <path d="M58 46 Q60 46 64 44" fill="none" stroke="${c}" stroke-width="6"/>
  ${eye(60, 34, 5)}${smile(68, 47, 82, 5)}
  <path d="M34 78 v8 M54 78 v8" ${o(5)}/>${extra}`;


// World pieces for the home scene
const LONGNECK = `<path d="M18 70 Q2 74 4 60 Q12 66 22 64Z" fill="#7DD3FC" ${o()}/>
  <ellipse cx="44" cy="68" rx="26" ry="17" fill="#7DD3FC" ${o()}/><ellipse cx="46" cy="72" rx="14" ry="9" fill="#E0F2FE"/>
  <path d="M60 60 Q66 30 70 18" fill="none" stroke="${K}" stroke-width="15" stroke-linecap="round"/><path d="M60 60 Q66 30 70 18" fill="none" stroke="#7DD3FC" stroke-width="9" stroke-linecap="round"/>
  <ellipse cx="76" cy="16" rx="13" ry="9" fill="#7DD3FC" ${o()}/>${eye(76, 13, 3.6)}${smile(80, 20, 87, 3)}
  <circle cx="32" cy="64" r="3" fill="#38BDF8"/><circle cx="48" cy="60" r="3.5" fill="#38BDF8"/>
  <path d="M30 82 v10 M40 84 v8 M52 84 v8 M60 82 v10" ${o(5)}/>`;
const PALM = `<path d="M50 96 Q46 70 52 40" fill="none" stroke="${K}" stroke-width="12" stroke-linecap="round"/><path d="M50 96 Q46 70 52 40" fill="none" stroke="#B7793F" stroke-width="7" stroke-linecap="round"/>
  <path d="M46 84 h8 M47 72 h8 M48 60 h8 M50 50 h6" ${o(2)} opacity=".5"/>
  ${[[-150, '#16A34A'], [-105, '#22C55E'], [-60, '#4ADE80'], [-15, '#22C55E'], [25, '#4ADE80'], [165, '#22C55E']].map(([a, c]) => `<path d="M52 40 Q62 16 92 22 Q84 30 90 34 Q78 38 82 44 Q66 46 52 40Z" fill="${c}" ${o(2.6)} transform="rotate(${a} 52 40)"/>`).join('')}
  <circle cx="46" cy="44" r="5" fill="#8B5A2B" ${o(2)}/><circle cx="56" cy="46" r="5" fill="#8B5A2B" ${o(2)}/>`;
const world = body => `<svg class="art" viewBox="0 0 100 100" aria-hidden="true">${body}</svg>`;
// Home world: drawn dinos and palm trees instead of emoji
document.querySelectorAll('.home-scene .hs-dino').forEach((d, i) => { d.innerHTML = world(i === 0 ? LONGNECK : dino('#6BCB77', '#C8F5B0')); d.classList.add('drawn'); });
document.querySelectorAll('.home-scene .hs-palm').forEach(p => { p.innerHTML = world(PALM); p.classList.add('drawn'); });

})();
