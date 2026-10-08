import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as voice from './voice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional .env (e.g. PORT=3000)
if (fs.existsSync('.env')) {
  try {
    for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = (m[2] || '').trim().replace(/^['"]|['"]$/g, '');
    }
  } catch (e) {
    console.error('Failed reading .env:', e.message);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

voice.load();
app.use(express.json({ limit: '2mb' }));

app.get('/api/tts/voices', (req, res) => {
  res.json({ voices: voice.VOICES, default: voice.DEFAULT_VOICE });
});

// GET /api/tts/status - lets the Parent Corner show whether the natural voice is ready
app.get('/api/tts/status', (req, res) => {
  const s = voice.status();
  res.json(s.ready ? { ok: true, engine: 'kokoro', pack: s.pack }
    : { ok: false, engine: 'kokoro', reason: s.error ? 'error' : 'loading', message: s.error || 'Voice is loading', pack: s.pack });
});

// POST /api/voice/phrases {phrases:[...]} - the app sends every sentence it can say; missing ones are
// recorded into the voice pack (voice/<voice>/) in the background, ready to publish for the iPad.
app.post('/api/voice/phrases', (req, res) => {
  const phrases = Array.isArray(req.body?.phrases) ? req.body.phrases.slice(0, 5000) : [];
  res.json({ missing: voice.ensurePack(phrases) });
});

// The voice pack list changes while recording, so read it whole before sending (no half-sent copies).
app.get('/voice/:voice/index.json', async (req, res) => {
  if (!voice.VOICES[req.params.voice]) return res.sendStatus(404);
  try {
    res.type('application/json').set('Cache-Control', 'no-cache')
      .send(await fs.promises.readFile(path.join(__dirname, 'voice', req.params.voice, 'index.json')));
  } catch { res.sendStatus(404); }
});

// GET /api/tts?text=Apple&voice=af_heart - WAV audio
app.get('/api/tts', async (req, res) => {
  try {
    const { buffer, cacheHit } = await voice.synthesize(req.query.text, req.query.voice);
    res.set('Content-Type', 'audio/wav');
    res.set('Cache-Control', 'public, max-age=604800');
    res.set('X-TTS-Cache', cacheHit ? 'HIT' : 'MISS');
    res.send(buffer);
  } catch (err) {
    res.status(err.code === 'loading' ? 503 : err.code === 'empty' ? 400 : 500).json({ error: err.message || 'TTS failed' });
  }
});

// Serve static assets from project root (but never the server's private files)
app.use((req, res, next) => (/^\/(\.env|\.voice-cache|node_modules)/.test(req.path) ? res.sendStatus(404) : next()));
app.use(express.static(__dirname));

// Send index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Idris Play running at http://localhost:${PORT}`);
});
