// Idris Play — animated pictures: where an emoji is only for show (home icons, the game bar, animal
// cards, pop-out pictures, peek-a-boo friends, hatching eggs, the dinos, celebrations) it is swapped
// for Google's animated version, so the lion turns its head and the rocket shakes. Buttons that are
// answers keep their plain emoji (games read their text). Files live in anim/ (128 px animated WebP,
// from Noto Animated Emoji by Google, CC BY 4.0); each is downloaded the first time it is shown.
(function(){
'use strict';
const MAP = {"🦴":"1f9b4","🦖":"1f996","🍽️":"1f37d","🚀":"1f680","🎆":"1f386","🤪":"1f92a","✏️":"270f","👏":"1f44f","🌿":"1f33f","🥕":"1f955","🙈":"1f648","🚗":"1f697","🫧":"1fae7","🦁":"1f981","🎣":"1f3a3","⭐":"2b50","🎯":"1f3af","🐱":"1f431","🦕":"1f995","🐒":"1f412","🐟":"1f41f","🐦":"1f426","🐻":"1f43b","🦊":"1f98a","🐸":"1f438","🦘":"1f998","🐺":"1f43a","🐼":"1f43c","🦉":"1f989","🐢":"1f422","🐧":"1f427","🦈":"1f988","🐙":"1f419","🐊":"1f40a","🦋":"1f98b","🐝":"1f41d","🐮":"1f42e","🦄":"1f984","🐥":"1f425","🎁":"1f381","🐞":"1f41e","🌈":"1f308","☁️":"2601","🎈":"1f388","💖":"1f496","🍓":"1f353","🍦":"1f366","🍪":"1f36a","🍎":"1f34e","🌟":"1f31f","🎂":"1f382","🦩":"1f9a9","🐍":"1f40d","🦎":"1f98e","🐳":"1f433","🦔":"1f994","🐡":"1f421","🐬":"1f42c","🍉":"1f349","🦀":"1f980","🥦":"1f966","🍃":"1f343","🍇":"1f347","🌸":"1f338","🌷":"1f337","🌼":"1f33c","🐛":"1f41b"};
const SPOTS = ['.app-emoji', '#gbEmoji', '.animal-card .emoji', '.pb-friend', '.pb-cover', '.egg-baby', '.egg-shelf span', '.cel-mascot',
  '.td-big', '.td-blob span', '.td-items span', '.bp-toy', '.bp-bubble span', '.dr-dino span', '.dr-obj', '.fb-face', '.fb-pick', '.lu-face',
  '.pk-dino', '.so-dino', '.dg-dino', '.rk-astro', '.rk-pilot', '.mu-dino', '.pet-emoji', '.fi-fish', '.egg-baby', '.ae-ok', '.isl-pic', '.isl-tray-pic'].join(',');
function swap(node){
  const t = node.textContent.trim(), code = MAP[t];
  if(!code || node.children.length) return;
  node.innerHTML = `<img class="ae" src="anim/${code}.webp" alt="${t}" draggable="false">`;
}
function scan(root){
  if(root.nodeType !== 1) root = root.parentElement;
  if(!root) return;
  if(root.matches(SPOTS)) swap(root);
  root.querySelectorAll(SPOTS).forEach(swap);
  const up = root.closest(SPOTS); if(up && up !== root) swap(up);
}
let pending = new Set(), queued = false;
new MutationObserver(list => {
  list.forEach(m => pending.add(m.target));
  if(!queued){ queued = true; setTimeout(() => { queued = false; const p = pending; pending = new Set(); p.forEach(scan); }, 0); }
}).observe(document.body, { childList: true, subtree: true, characterData: true });
scan(document.body);
})();
