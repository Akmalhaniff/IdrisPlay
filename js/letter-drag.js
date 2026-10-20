// Idris Play — every letter in the ABC games can be picked up and dragged around with a finger.
// Lift a letter, it grows and says its name, follows the finger, and springs back home when let go.
// Where a letter has a place to go (a box, a word slot, the big letter), dropping it there counts
// just like tapping it. A tap still works as before — dragging starts only after the finger moves.
(function(){
'use strict';
const { sfx } = window.IdrisPlay;

// [letter selector, where a drop counts as a tap (or null)]
const RULES = [
  ['.running-letter-wrap', '.bini-box, .bini-boxes, #biniBoxSlots'],   // Letters in Boxes
  ['.wb-tile:not(.used)', '.wb-slots, .wb-slot'],                      // Word Builder
  ['.bs-bubble', '.bs-big'],                                          // Big & Small
  ['.abc-grid button', null],
  ['#phonicGrid button', null],
  ['.abc-letter', null],
  ['.bini-bubble-letter', null],
  ['.mp-letter', null]
];
const SEL = RULES.map(r => r[0]).join(',');
const letterOf = n => (n.dataset.letter || n.textContent.trim().match(/[A-Za-z]/)?.[0] || '').toUpperCase();

let drag = null, swallowClick = false;

document.addEventListener('pointerdown', e => {
  if(drag || e.button > 0) return;
  const node = e.target.closest(SEL);
  if(!node || !node.offsetParent) return;
  const rule = RULES.find(r => node.matches(r[0]));
  drag = { node, rule, id: e.pointerId, x0: e.clientX, y0: e.clientY, live: false };
}, true);

document.addEventListener('pointermove', e => {
  if(!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if(!drag.live){
    if(Math.hypot(dx, dy) < 12) return;
    start(e);
  }
  e.preventDefault();
  drag.ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1.3) rotate(${Math.max(-15, Math.min(15, dx / 12))}deg)`;
  const t = target(drag, e);
  if(t !== drag.over){ drag.over?.classList.remove('ld-over'); t?.classList.add('ld-over'); drag.over = t; }
}, { passive: false, capture: true });

function start(){
  const r = drag.node.getBoundingClientRect();
  const g = drag.node.cloneNode(true);
  g.removeAttribute('id'); g.removeAttribute('onclick');
  g.classList.add('ld-ghost');
  Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: 0 });
  document.body.appendChild(g);
  drag.ghost = g; drag.live = true; drag.home = r;
  drag.node.classList.add('ld-away');
  sfx.pop();
  const L = letterOf(drag.node);
  if(L) speak(L);
}

function target(d, e){
  if(!d.rule[1]) return null;
  d.ghost.style.visibility = 'hidden';
  const under = document.elementFromPoint(e.clientX, e.clientY);
  d.ghost.style.visibility = '';
  return under?.closest(d.rule[1]) || null;
}

function end(e){
  if(!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  if(!d.live) return;
  swallowClick = true; setTimeout(() => { swallowClick = false; }, 400);
  d.over?.classList.remove('ld-over');
  const t = e.type === 'pointerup' ? target(d, e) : null;
  if(t){
    // dropped where it belongs: count it as a tap
    d.ghost.remove(); d.node.classList.remove('ld-away');
    swallowClick = false; d.node.click(); swallowClick = true;
    return;
  }
  // spring back home
  d.ghost.classList.add('ld-back'); d.ghost.style.transform = '';
  sfx.boing();
  setTimeout(() => { d.ghost.remove(); d.node.classList.remove('ld-away'); }, 420);
}
document.addEventListener('pointerup', end, true);
document.addEventListener('pointercancel', end, true);

// the click that follows a drag must not also count as a tap
document.addEventListener('click', e => { if(swallowClick && e.target.closest(SEL)){ e.stopPropagation(); e.preventDefault(); } }, true);
})();
