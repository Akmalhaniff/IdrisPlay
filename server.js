import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());

import fs from 'fs';

// If running in an environment where .env was populated or contains the actual key
if (fs.existsSync('.env')) {
  try {
    const envFile = fs.readFileSync('.env', 'utf8');
    for (const line of envFile.split('\n')) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
      if (m) {
        const k = m[1];
        const v = (m[2] || '').trim().replace(/^['"]|['"]$/g, '');
        if (v && (!process.env[k] || process.env[k] === 'MY_GEMINI_API_KEY')) {
          process.env[k] = v;
        }
      }
    }
  } catch (e) {
    console.error('Failed reading .env:', e.message);
  }
}

// Initialize Google GenAI with required headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// In-memory cache for synthesized audio to ensure sub-10ms instant replay for kids
const ttsCache = new Map();

// High quality kid-friendly voices supported by gemini-3.8-flash-lite-tts
// Supported prebuilt voices: 'Puck', 'Kore', 'Zephyr', 'Fenrir', 'Charon'
const VOICES = {
  Puck: {
    name: 'Puck',
    label: '🧸 Puck (Playful Kid)',
    role: 'Playful bouncy cartoon buddy',
    stylePrompt: 'Joyful, bouncy, playful, friendly kid voice speaking cheerfully with delight to a 2-year-old child',
    emoji: '🧸'
  },
  Kore: {
    name: 'Kore',
    label: '🌸 Kore (Sweet & Gentle)',
    role: 'Warm preschool teacher',
    stylePrompt: 'Warm, soft, loving, clear, soothing preschool teacher speaking encouragingly to a toddler',
    emoji: '🌸'
  },
  Zephyr: {
    name: 'Zephyr',
    label: '🌟 Zephyr (Sunny & Bright)',
    role: 'Enthusiastic storybook narrator',
    stylePrompt: 'Bright, crisp, sunny, vibrant, cheerful voice saying words with lively expression',
    emoji: '🌟'
  }
};

const DEFAULT_VOICE = 'Puck';

app.get('/api/tts/voices', (req, res) => {
  res.json({
    voices: VOICES,
    default: DEFAULT_VOICE
  });
});

async function synthesizeSpeech(rawText, reqVoice) {
  const voiceName = (reqVoice && VOICES[reqVoice]) ? reqVoice : DEFAULT_VOICE;
  const voiceInfo = VOICES[voiceName];
  const cleanText = (rawText || '').trim().slice(0, 160);

  if (!cleanText) {
    throw new Error('Text parameter is empty');
  }

  const cacheKey = `${voiceName}:${cleanText.toLowerCase()}`;
  if (ttsCache.has(cacheKey)) {
    return { ...ttsCache.get(cacheKey), cacheHit: true };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: cleanText,
            speechMetadata: {
              style: voiceInfo.stylePrompt,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName
          }
        }
      }
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  const base64Data = part?.inlineData?.data;
  if (!base64Data) {
    throw new Error('No audio returned from Gemini TTS');
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const mimeType = part?.inlineData?.mimeType || 'audio/wav';

  // Keep cache bounded to 800 items
  if (ttsCache.size > 800) {
    const oldestKey = ttsCache.keys().next().value;
    ttsCache.delete(oldestKey);
  }

  const cacheItem = { buffer, mimeType, base64: base64Data };
  ttsCache.set(cacheKey, cacheItem);
  return { ...cacheItem, cacheHit: false };
}

// GET /api/tts?text=Apple&voice=Puck - streamable WAV binary for <audio> elements
app.get('/api/tts', async (req, res) => {
  try {
    const text = req.query.text;
    const voice = req.query.voice;
    const { buffer, mimeType, cacheHit } = await synthesizeSpeech(text, voice);

    res.set('Content-Type', mimeType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('X-TTS-Cache', cacheHit ? 'HIT' : 'MISS');
    return res.send(buffer);
  } catch (err) {
    console.error('Error in GET /api/tts:', err.message);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// POST /api/tts - returns JSON with base64 data URL for instant playback
app.post('/api/tts', async (req, res) => {
  try {
    const text = req.body?.text;
    const voice = req.body?.voice;
    const { base64, mimeType, cacheHit } = await synthesizeSpeech(text, voice);

    res.set('X-TTS-Cache', cacheHit ? 'HIT' : 'MISS');
    return res.json({
      audioUrl: `data:${mimeType};base64,${base64}`,
      mimeType,
      cacheHit
    });
  } catch (err) {
    console.error('Error in POST /api/tts:', err.message);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Send index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`KidsPlay server running with Gemini AI Kid Voice at http://${HOST}:${PORT}`);
});
