// Idris Play — drawn pieces shared by the games, all in the dino buddy's soft style (flat shapes,
// gentle highlights, no dark outlines): the buddy dino itself, bones, rocks, a log, a cactus, an egg,
// a sponge and a shower head. Loaded before the games so they can use them straight away.
(function(){
'use strict';
const BUDDY_SVG = `<svg class="bd" viewBox="0 0 160 160" aria-hidden="true">
  <g class="bd-body">
    <path class="bd-tail" d="M48 112 Q12 120 6 92 Q22 104 54 96 Z" fill="#5DBB63"/>
    <path d="M34 104 l-2-20 12 10 2-22 13 15 6-22 12 18 9-20 8 18" fill="#FFB020" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="80" cy="106" rx="42" ry="36" fill="#6BCB77"/>
    <ellipse cx="88" cy="114" rx="25" ry="23" fill="#C8F5B0"/>
    <ellipse cx="64" cy="140" rx="13" ry="8" fill="#4FAE5B"/><ellipse cx="98" cy="141" rx="13" ry="8" fill="#4FAE5B"/>
    <path class="bd-arm" d="M110 104 q12 2 14 12" stroke="#4FAE5B" stroke-width="8" fill="none" stroke-linecap="round"/>
    <g class="bd-head">
      <circle cx="100" cy="60" r="34" fill="#6BCB77"/>
      <ellipse cx="120" cy="70" rx="24" ry="17" fill="#6BCB77"/>
      <circle cx="136" cy="64" r="2.2" fill="#2F7A3A"/><circle cx="131" cy="62" r="2.2" fill="#2F7A3A"/>
      <circle cx="92" cy="73" r="7" fill="#FF7AA8" opacity=".8"/>
      <path class="bd-mouth" d="M108 79 Q120 90 134 78" stroke="#1F2937" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g class="bd-open"><path d="M106 74 Q121 100 138 72 Q122 80 106 74Z" fill="#7F1D1D"/><path d="M112 84 Q121 92 130 82 Q121 86 112 84Z" fill="#FB7185"/><path d="M110 76 l3 5 3 -4 M128 75 l3 4 3 -5" fill="#fff"/></g>
      <g class="bd-eye"><circle cx="96" cy="52" r="11" fill="#fff"/><g class="bd-pupil"><circle cx="97" cy="53" r="6" fill="#1F2937"/><circle cx="99" cy="50" r="2" fill="#fff"/></g><ellipse class="bd-lid" cx="96" cy="52" rx="12" ry="12" fill="#6BCB77"/></g>
      <g class="bd-eye"><circle cx="118" cy="49" r="10" fill="#fff"/><g class="bd-pupil"><circle cx="119" cy="50" r="5.5" fill="#1F2937"/><circle cx="121" cy="47" r="1.8" fill="#fff"/></g><ellipse class="bd-lid" cx="118" cy="49" rx="11" ry="11" fill="#6BCB77"/></g>
      <g class="bd-cap"><path d="M74 38 Q100 0 128 30 Q104 26 74 38Z" fill="#6366F1"/><circle cx="128" cy="30" r="6" fill="#FDE047"/></g>
    </g>
  </g>
  <text class="bd-zzz" x="132" y="22">z</text><text class="bd-zzz z2" x="144" y="10">Z</text>
</svg>`;
const shine = (x, y, rx, ry, r = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45" transform="rotate(${r} ${x} ${y})"/>`;
const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="5" fill="#000" opacity=".1"/>`;
const PIECES = {
  bone: `${shadow(50, 80, 34)}<g transform="rotate(-20 50 50)"><rect x="22" y="42" width="56" height="16" rx="8" fill="#FFF3DC"/>
    ${[[22, 42], [22, 58], [78, 42], [78, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#FFF3DC"/>`).join('')}
    <rect x="22" y="52" width="56" height="6" fill="#F2DDB6"/><circle cx="22" cy="58" r="11" fill="#F2DDB6" opacity=".7"/><circle cx="78" cy="58" r="11" fill="#F2DDB6" opacity=".7"/>
    ${shine(24, 40, 4, 6)}</g>`,
  rock: `${shadow(50, 88, 38)}<path d="M14 84 Q8 60 26 46 Q34 26 56 30 Q80 30 88 54 Q96 74 84 86Z" fill="#9CA3AF"/>
    <path d="M14 84 Q30 70 54 74 Q74 78 84 86Z" fill="#6B7280"/>${shine(36, 46, 9, 6, -20)}<circle cx="66" cy="56" r="4" fill="#6B7280" opacity=".6"/>`,
  log: `${shadow(50, 86, 40)}<rect x="12" y="46" width="70" height="36" rx="18" fill="#A16207"/><rect x="12" y="46" width="70" height="12" rx="6" fill="#CA8A04" opacity=".5"/>
    <ellipse cx="80" cy="64" rx="12" ry="18" fill="#FDE68A"/><ellipse cx="80" cy="64" rx="7" ry="11" fill="#EAB308" opacity=".6"/><ellipse cx="80" cy="64" rx="2.5" ry="4" fill="#A16207"/>
    <path d="M40 52 q4 6 0 12 M56 70 q4 6 0 10" stroke="#854D0E" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  cactus: `${shadow(50, 92, 22)}<rect x="38" y="20" width="24" height="72" rx="12" fill="#22C55E"/>
    <path d="M38 56 H24 Q16 56 16 46 V34 Q16 28 22 28 Q28 28 28 34 V44 H38Z" fill="#16A34A"/><path d="M62 48 H76 Q84 48 84 38 V30 Q84 24 78 24 Q72 24 72 30 V38 H62Z" fill="#16A34A"/>
    <path d="M46 28 V84 M54 28 V84" stroke="#4ADE80" stroke-width="2.4" opacity=".6"/><circle cx="50" cy="20" r="7" fill="#F472B6"/><circle cx="50" cy="20" r="3" fill="#FDE047"/>`,
  egg: `${shadow(50, 92, 26)}<path d="M50 8 C74 8 86 46 84 64 C82 84 68 92 50 92 C32 92 18 84 16 64 C14 46 26 8 50 8Z" fill="#FFF7E0"/>
    <path d="M50 92 C68 92 82 84 84 64 C85 52 80 36 74 26 C80 50 74 80 50 92Z" fill="#F5E6C0" opacity=".8"/>
    <circle cx="38" cy="38" r="6" fill="#86EFAC"/><circle cx="62" cy="32" r="5" fill="#7DD3FC"/><circle cx="64" cy="66" r="7" fill="#F9A8D4"/><circle cx="34" cy="70" r="5" fill="#FDE68A"/>${shine(34, 30, 6, 10)}`,
  sponge: `${shadow(50, 86, 34)}<rect x="14" y="30" width="72" height="50" rx="16" fill="#FACC15"/><rect x="14" y="30" width="72" height="16" rx="8" fill="#FDE047"/>
    ${[[30, 54, 5], [52, 62, 6], [70, 52, 4], [40, 70, 4], [66, 70, 3.5], [28, 42, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#EAB308"/>`).join('')}
    <circle cx="74" cy="20" r="8" fill="#E0F2FE" opacity=".9"/><circle cx="86" cy="28" r="5" fill="#E0F2FE" opacity=".9"/>`,
  shower: `<path d="M30 14 Q30 6 40 6 H70 Q78 6 78 14 V24" fill="none" stroke="#94A3B8" stroke-width="8" stroke-linecap="round"/>
    <path d="M58 24 H98 L90 42 H66Z" fill="#CBD5E1"/><path d="M58 24 H98 L96 30 H60Z" fill="#E2E8F0"/>
    ${[[68, 54], [78, 58], [88, 54], [72, 70], [84, 74], [76, 86], [90, 88]].map(([x, y]) => `<path d="M${x} ${y - 6} Q${x + 4} ${y} ${x} ${y + 3} Q${x - 4} ${y} ${x} ${y - 6}Z" fill="#38BDF8"/>`).join('')}`
};
const piece = id => PIECES[id] ? `<svg class="drawn" viewBox="0 0 100 100" aria-hidden="true">${PIECES[id]}</svg>` : '';
// Buddy colours: [hue shift, name]
const COLOURS = [[0, 'green'], [170, 'blue'], [250, 'purple'], [290, 'pink'], [-60, 'orange'], [-120, 'red']];
window.idrisBuddySVG = BUDDY_SVG;
window.idrisDrawn = { piece, COLOURS, buddy: hue => `<div class="buddy-art" style="${hue ? `filter:hue-rotate(${hue}deg) saturate(1.2)` : ''}">${BUDDY_SVG}</div>` };
})();
