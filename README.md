# Idris Play — Toddler Play & Learn (2-4 Years)

## 📱 Play on iPad (no PC needed)
Live at **https://akmalhaniff.github.io/IdrisPlay/** (GitHub Pages, from the `main` branch).
1. On the iPad open that link in **Safari**, tap **Share ⬆️ → Add to Home Screen**.
2. Open **Idris Play** from the home screen — full screen, like a real app. Keep it open on Wi-Fi for a minute the first time so it saves the games and the voice; after that it works **offline**.
3. Lock little hands in: *Settings → Accessibility → Guided Access* → on, then triple-click the top button inside the app.
4. Optional, for sentences that aren't pre-recorded: *Settings → Accessibility → Read & Speak → Voices → English → download “Ava (Premium)”* — the most natural iPad voice.

## 📱 It's an app
- Opens **full screen** from its own home-screen icon, with a splash screen, a big-icon launcher, and slide-in game screens with a big 🏠 button.
- The phone's **back button** returns to the launcher and never exits the app by accident.
- **Stars & stickers**: every little win earns a ⭐; every 5 stars unlocks a sticker in the sticker book. Saved on the device.
- **Parent Corner** (press & hold ⚙️ for 2 s): child's name, voice, sound, full screen, install, reset stars.
- **Works offline** after the first visit (`sw.js`).

## 🎙️ Natural female voice (free, no API key)
The voice is **Kokoro**, an open-source (Apache-2.0) neural voice. Every sentence the app says is **pre-recorded** into `voice/<voice>/` (MP3 + `index.json`) and published with the app, so the iPad plays it with no PC and no internet. Four female voices (Parent Corner → Voice, ▶ Listen): **Heart** (default — warm, most natural), **Bella** (lively), **Nicole** (soft), **Emma** (gentle British).

**Updating the recordings** (after adding games or speech):
1. `npm install` once, then `npm start` on the PC (first start downloads the voice model, ~330 MB).
2. Open http://localhost:3000 — the app sends the server every sentence it can say (`js/phrases.js`) and the server records the missing ones in the background (Parent Corner shows progress).
3. Commit and push the `voice/` folder → GitHub Pages updates the iPad app.

Notes:
- Plain `speak('...')` sentences are found automatically; sentences built from data need a line in `dynamicPhrases()` in `js/phrases.js` (or `window.funPhrases` in `js/fun.js`).
- Sentences with the child's name are recorded for the current name. Change the name → re-record on the PC.
- Mispronounced words can be respelled in `RESPELL` in `voice.js` (e.g. `Idris → Eedris`).
- Anything not recorded uses the device's most natural **female** voice.

## 🆕 Fun pack (`js/fun.js` + `css/fun.css`)
Six new games, shown first on the launcher with a **NEW** ribbon until played:
- **🥚 Surprise Eggs** — tap 4 times to crack an egg; a baby animal pops out and joins the shelf.
- **🛁 Bath Time** — rub the mud off a muddy pet with the sponge, then tap the shower to rinse.
- **🤪 Silly Faces** — change colour, eyes, nose, mouth and hat (🎲 = surprise). The googly eyes follow his finger; tap the face to tickle it.
- **🚀 Rocket Trip** — press GO, count down 5-4-3-2-1, blast off, tap shooting stars, land on a planet and say hi to the alien.
- **🌻 Magic Garden** — plant seeds, water them (tap, ☁️ rain or ☀️ sun), watch flowers bloom, pick them into the basket and count.
- **🎆 Fireworks** — tap the night sky for fireworks (balls, rings, hearts, stars).

Plus: animated sky home screen, a **Hooray!** celebration on big wins in every game, a daily 🎁 surprise (3 stars), a colour theme for each game, and real sound effects (pops, boings, cracks, splashes, booms).

> Installing and offline mode need the app served over **https** or **localhost** (e.g. `npm start`), not opened as a file.

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
