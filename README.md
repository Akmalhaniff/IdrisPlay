# KidsPlay — Toddler Play & Learn (2-4 Years)

Standalone web app, **completely separate** from `SystemLogDashboard`. Zero backend, zero build tools. Just open and play.

## 📁 Folder
```
KidsPlay/
  index.html   ← single-file app (all CSS+JS inline, only Google Fonts external)
  README.md
```

> The `css/` and `js/` folders are optional — everything is already inline in `index.html` for easiest hosting.

## 🚀 Run (any one)

**Option A — Double-click (easiest)**
Just double-click `index.html` — works offline (except Google Fonts).

**Option B — Local server (recommended for tablets)**
```powershell
# PowerShell — from KidsPlay folder
python -m http.server 8080
# or
npx serve .
# open http://localhost:8080
```

**Option C — VS Code Live Server**
Right-click `index.html` → “Open with Live Server”.

## 🎮 What’s Inside — 12 Creative Play Modes
**Learn (tap):**
1. **🎨 Colors (12)** — tap → speaks name, splash + confetti
2. **🦁 Animals (12)** — Dog Woof, Cat Meow, Lion Roar… speech + blip
3. **⭐ Shapes (8)** — Circle/Square/Triangle… tap to hear
4. **🔢 Numbers 1–10** — huge number, counting dots, +/- and quick jump
5. **🔤 ABC A–Z** — big letter + word (A for Apple 🍎) + grid

**Create & Play:**
6. **✏️ Doodle Pad** — finger/mouse draw, 10 colors, brush/eraser, save PNG
7. **🫧 Bubble Pop** — floating bubbles, tap to pop, score + physics

**New — Drag & Drop + Animation:**
8. **🎯 Sorting** — drag 8 toys to matching color bins (Red/Blue/Yellow/Green), snap + wobble if wrong, progress 0/8, confetti win — **touch + mouse drag**
9. **🧩 Animal Puzzle** — 4-piece jigsaw (🦁/🐸/🐳 sets), drag pieces to slots, snap when correct, shuffle, hint
10. **🎣 Fishing Pond** — 6 fish swim across with `swim` animation + bubbles rise, **drag fish to yellow bucket**, auto-respawn, caught 0/6
11. **🎵 Music Garden** — 8 piano keys (C–C2, 261–523Hz) + drum toggle, tap/drag across to play, flowers bloom `🌸🌼🌷🌻` with floaty + dance `💃🕺`, Twinkle auto-song
12. **🧩 Memory Match** — 4×4 (8 pairs), flip + match, moves counter

All use **large touch targets**, **SpeechSynthesis** (gentle) + **Web Audio blips**, **touch + mouse drag** (clone follows finger), **CSS animations** (`floaty`, `swim`, `bubbleRise`, `dance`, `wobble`, `popIn`). **Mute toggle** at top.

## 🧒 Designed for 2-Year-Olds
- No login, no tracking, no ads
- No text-heavy UI — emoji + colors
- `user-select:none` + `tap-highlight:transparent`
- Fully responsive: phone / tablet / desktop
- Works offline once loaded

## 🔧 Customize
Edit `index.html` directly:
- Colors: `const colors = [...]`
- Animals: `const animals = [...]`
- ABC words: `const abc = [...]`
- Add Malay: change `u.lang='ms-MY'` in `speak()` and translate word lists

## 🗂️ Separation Guarantee
This folder has **no dependency** on `../SystemLogDashboard`. You can zip, move, or deploy it to any static host (GitHub Pages, Netlify, Vercel — just drag `index.html`).

## 📦 Deploy to GitHub Pages
1. Create repo `KidsPlay`
2. Push `index.html` to `main` branch
3. Settings → Pages → Deploy from `main` root
4. Done → `https://yourname.github.io/KidsPlay/`

---
Made with 💛 for tiny hands.
