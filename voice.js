// Natural female voice for Idris Play, generated on this PC with Kokoro (open-source, Apache-2.0).
// No API key, no account. The first start downloads the voice model (~330 MB), then it works offline.
//
// Two outputs:
//  • live speech for /api/tts (WAV, cached in .voice-cache/) when the app is used through `npm start`;
//  • the "voice pack" (voice/<voice>/*.mp3 + index.json) — every sentence pre-recorded, committed to git
//    and published with the app, so the iPad plays the natural voice with no PC and no internet.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { KokoroTTS } from 'kokoro-js';
import { Mp3Encoder } from '@breezystack/lamejs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const SAMPLE_RATE = 24000;

// Kokoro's best female voices. speed < 1 = a little slower and clearer for a toddler.
export const VOICES = {
  af_heart: { name: 'Heart', emoji: '💖', role: 'Warm, sweet and very natural', speed: 0.92 },
  af_bella: { name: 'Bella', emoji: '🎈', role: 'Bright, lively and cheerful', speed: 0.95 },
  af_nicole: { name: 'Nicole', emoji: '🌙', role: 'Soft, calm and gentle', speed: 0.92 },
  bf_emma: { name: 'Emma', emoji: '🌷', role: 'Gentle British storyteller', speed: 0.92 }
};
export const DEFAULT_VOICE = 'af_heart';

// Words the speech engine mispronounces, respelled so they sound right.
const RESPELL = {
  idris: 'Eedris',            // Malay "Idris", not English "EYE-dris"
  grrr: 'Gurrr', grr: 'Gurrr', brrr: 'Burrr', brr: 'Burrr',
  mmm: 'Hmmm', mm: 'Hmmm', shhh: 'Shush', shh: 'Shush', zzz: 'Snore', zzzz: 'Snore',
  ooo: 'Ooh', oooh: 'Ooh', ooooh: 'Ooh', aaah: 'Aah', aaaah: 'Aah'
};

// Same rule as phraseKey() in index.html, so the iPad finds the recording for a sentence.
export const phraseKey = t => String(t || '').replace(/\s+/g, ' ').trim().toLowerCase();

export function prepareText(raw) {
  let t = String(raw || '')
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '')   // emoji are not spoken
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  t = t.replace(/[A-Za-z]+/g, w => RESPELL[w.toLowerCase()] || w);
  // The letter "A" (e.g. "A! A is for Apple") — not the word "a" as in "a baby dinosaur".
  t = t.replace(/\bA\b(?=\s*[!.,?;:]|\s*$|\s+(?:is|for)\b)/g, 'Eh');
  return t;
}

// ---------- model loading ----------
let tts = null;
let state = { ready: false, loading: false, error: null };
export function status() { return { ...state, pack: packProgress() }; }

export function load() {
  if (state.ready || state.loading) return;
  state = { ready: false, loading: true, error: null };
  const t0 = Date.now();
  console.log('🎙️  Loading natural voice (first start downloads the voice model, ~330 MB)...');
  KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'fp32', device: 'cpu' })
    .then(async model => {
      tts = model;
      await tts.generate('Hello.', { voice: DEFAULT_VOICE });   // warm-up makes the first real phrase fast
      state = { ready: true, loading: false, error: null };
      console.log(`🎙️  Natural voice ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      pump();
    })
    .catch(err => {
      state = { ready: false, loading: false, error: String(err.message || err) };
      console.error('🎙️  Could not load the natural voice — the app will use the device voice.', err.message || err);
    });
}

// ---------- audio helpers ----------
// Trim silence at the ends (snappier for little taps) and normalise loudness for tablet speakers.
function tidy(samples) {
  const gate = 0.01;
  let a = 0, b = samples.length - 1;
  while (a < b && Math.abs(samples[a]) < gate) a++;
  while (b > a && Math.abs(samples[b]) < gate) b--;
  a = Math.max(0, a - Math.round(SAMPLE_RATE * 0.03));
  b = Math.min(samples.length - 1, b + Math.round(SAMPLE_RATE * 0.08));
  const out = samples.slice(a, b + 1);
  let peak = 0;
  for (const s of out) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? Math.min(4, 0.92 / peak) : 1;
  for (let i = 0; i < out.length; i++) out[i] *= gain;
  return out;
}

function toInt16(samples) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
  return pcm;
}

function toWav(samples) {
  const pcm = toInt16(samples);
  const buf = Buffer.alloc(44 + pcm.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + pcm.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24); buf.writeUInt32LE(SAMPLE_RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(pcm.length * 2, 40);
  Buffer.from(pcm.buffer).copy(buf, 44);
  return buf;
}

function toMp3(samples) {
  const enc = new Mp3Encoder(1, SAMPLE_RATE, 40);
  return Buffer.concat([Buffer.from(enc.encodeBuffer(toInt16(samples))), Buffer.from(enc.flush())]);
}

// ---------- one generation queue: live requests jump ahead of voice-pack recording ----------
const queue = [];
const inflight = new Map();
let busy = false;

function render(voice, text, lowPriority) {
  const id = voice + '|' + phraseKey(text);
  if (inflight.has(id)) {
    if (!lowPriority) {   // someone is waiting now: move a queued pack job to the front
      const i = queue.findIndex(j => j.id === id);
      if (i > 0) queue.unshift(queue.splice(i, 1)[0]);
    }
    return inflight.get(id);
  }
  const p = new Promise((resolve, reject) => {
    const job = { id, voice, text, resolve, reject };
    if (lowPriority) queue.push(job); else queue.unshift(job);
  }).finally(() => inflight.delete(id));
  inflight.set(id, p);
  pump();
  return p;
}

async function pump() {
  if (busy || !state.ready) return;
  busy = true;
  while (queue.length) {
    const job = queue.shift();
    try {
      const spoken = prepareText(job.text);
      if (!spoken) throw Object.assign(new Error('Nothing to say'), { code: 'empty' });
      const audio = await tts.generate(spoken, { voice: job.voice, speed: VOICES[job.voice].speed });
      const samples = tidy(audio.audio);
      addToPack(job.voice, job.text, samples);
      job.resolve(samples);
    } catch (e) {
      job.reject(e);
    }
  }
  busy = false;
}

// ---------- voice pack (voice/<voice>/index.json + mp3 files) ----------
const PACK_DIR = path.join(ROOT, 'voice');
const packs = {};          // voice -> { phrases: {key: file} }
const packTimers = {};
let packTarget = 0, packDone = 0;

function pack(voice) {
  if (!packs[voice]) {
    try { packs[voice] = JSON.parse(fs.readFileSync(path.join(PACK_DIR, voice, 'index.json'), 'utf8')); }
    catch { packs[voice] = { phrases: {} }; }
  }
  return packs[voice];
}

// Save the list at most every 2 s while recording (not only when recording stops).
function savePackSoon(voice) {
  if (packTimers[voice]) return;
  packTimers[voice] = setTimeout(() => {
    packTimers[voice] = null;
    const p = pack(voice);
    const sorted = Object.fromEntries(Object.entries(p.phrases).sort(([a], [b]) => a.localeCompare(b)));
    const target = path.join(PACK_DIR, voice, 'index.json');
    try {
      fs.writeFileSync(target + '.tmp', JSON.stringify({ voice, phrases: sorted }));
      fs.renameSync(target + '.tmp', target);   // atomic: the app never reads a half-written list
    } catch (e) {
      savePackSoon(voice);                       // file busy (Windows) — try again shortly
    }
  }, 2000);
}

const packFile = key => crypto.createHash('sha1').update(key).digest('hex').slice(0, 12) + '.mp3';

function addToPack(voice, text, samples) {
  const key = phraseKey(text);
  const p = pack(voice);
  if (p.phrases[key]) return;
  const file = packFile(key);
  fs.mkdirSync(path.join(PACK_DIR, voice), { recursive: true });
  fs.writeFileSync(path.join(PACK_DIR, voice, file), toMp3(samples));
  p.phrases[key] = file;
  savePackSoon(voice);
}

function packProgress() {
  return packTarget ? { done: packDone, total: packTarget } : null;
}

// Record every sentence the app can say, for every voice (default voice first). Returns how many were missing.
export function ensurePack(phrases) {
  const list = [...new Set(phrases.map(t => String(t || '').replace(/\s+/g, ' ').trim()).filter(t => prepareText(t)))];
  const voices = [DEFAULT_VOICE, ...Object.keys(VOICES).filter(v => v !== DEFAULT_VOICE)];
  let missing = 0;
  for (const voice of voices) {
    const have = pack(voice).phrases;
    for (const text of list) {
      const key = phraseKey(text);
      if (have[key] || inflight.has(voice + '|' + key)) continue;
      if (fs.existsSync(path.join(PACK_DIR, voice, packFile(key)))) {   // recorded before, just not listed yet
        have[key] = packFile(key); savePackSoon(voice); continue;
      }
      missing++; packTarget++;
      render(voice, text, true).then(() => { packDone++; }, () => { packDone++; });
    }
  }
  if (missing) console.log(`🎙️  Recording ${missing} new sentences into the voice pack (runs in the background)...`);
  return missing;
}

// ---------- live speech for /api/tts ----------
const CACHE_DIR = path.join(ROOT, '.voice-cache');
const memory = new Map();

export async function synthesize(rawText, reqVoice) {
  const voice = VOICES[reqVoice] ? reqVoice : DEFAULT_VOICE;
  const text = String(rawText || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!prepareText(text)) throw Object.assign(new Error('Nothing to say'), { code: 'empty' });

  const key = voice + '|' + phraseKey(text);
  if (memory.has(key)) return { buffer: memory.get(key), cacheHit: true };
  const file = path.join(CACHE_DIR, voice, crypto.createHash('sha1').update(key).digest('hex') + '.wav');
  try {
    const buf = await fs.promises.readFile(file);
    memory.set(key, buf);
    return { buffer: buf, cacheHit: true };
  } catch { /* not cached yet */ }

  if (!state.ready) {
    throw Object.assign(new Error(state.error ? 'Voice failed to load: ' + state.error : 'Voice is still loading'),
      { code: state.error ? 'error' : 'loading' });
  }
  const wav = toWav(await render(voice, text, false));
  memory.set(key, wav);
  if (memory.size > 1500) memory.delete(memory.keys().next().value);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFile(file, wav, () => {});
  return { buffer: wav, cacheHit: false };
}
