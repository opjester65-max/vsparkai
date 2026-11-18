import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

interface GenerateRequestBody {
  topic?: string;
  tone?: string;
  platform?: string;
}

const VALID_TONES = ['Professional', 'Casual', 'Viral', 'Educational'] as const;
const VALID_PLATFORMS = ['LinkedIn', 'X', 'Instagram', 'Facebook'] as const;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    captions: {
      type: Type.ARRAY,
      description: 'Exactly 3 distinct, high-performing social media captions tailored to the topic, tone, and target platform.',
      items: {
        type: Type.OBJECT,
        properties: {
          angle: {
            type: Type.STRING,
            description: 'Short label for the copywriting angle (e.g., Storytelling Hook, Data-Driven Insight, Direct Contrarian).',
          },
          hook: {
            type: Type.STRING,
            description: 'Opening hook line designed to stop the scroll.',
          },
          text: {
            type: Type.STRING,
            description: 'Full ready-to-publish caption body without trailing hashtag spam.',
          },
        },
        required: ['angle', 'hook', 'text'],
      },
    },
    hashtags: {
      type: Type.ARRAY,
      description: '6 to 8 relevant, high-reach hashtags formatted with leading #.',
      items: {
        type: Type.STRING,
      },
    },
    engagementScore: {
      type: Type.INTEGER,
      description: 'Predicted engagement score from 60 to 99 based on hook strength, clarity, and platform fit.',
    },
    engagementRationale: {
      type: Type.STRING,
      description: 'Concise 1-sentence breakdown explaining why this post achieves the predicted engagement score.',
    },
    bestPostingTime: {
      type: Type.STRING,
      description: 'Recommended day and time window for peak reach (e.g., Tuesday · 09:15 AM EST).',
    },
    bestPostingReason: {
      type: Type.STRING,
      description: 'Concise 1-sentence reason explaining the audience activity window.',
    },
  },
  required: [
    'captions',
    'hashtags',
    'engagementScore',
    'engagementRationale',
    'bestPostingTime',
    'bestPostingReason',
  ],
};

function getApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return undefined;
  }
  return key;
}

function isNotFoundModelError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const errObj = error as { status?: number; code?: number; message?: string };
  if (errObj.status === 404 || errObj.code === 404) return true;
  const msg = (errObj.message || '').toLowerCase();
  return msg.includes('404') || msg.includes('not found') || msg.includes('is not found for api version');
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(getApiKey()),
  });
});

app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  const { topic, tone, platform } = (req.body || {}) as GenerateRequestBody;

  const trimmedTopic = typeof topic === 'string' ? topic.trim() : '';
  const selectedTone = VALID_TONES.includes(tone as (typeof VALID_TONES)[number])
    ? (tone as string)
    : 'Professional';
  const selectedPlatform = VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])
    ? (platform as string)
    : 'LinkedIn';

  if (trimmedTopic.length < 3) {
    res.status(400).json({
      error: 'Please enter a topic or prompt of at least 3 characters.',
    });
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(503).json({
      error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.',
    });
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const systemInstruction = `You are a senior social media strategist and conversion copywriter.
Generate structured, high-performing social media content tailored strictly to the requested platform, tone, and topic.
Rules:
- Produce exactly 3 distinct captions with different angles (e.g., Founder Insight, Tactical Breakdown, Bold Contrarian).
- Respect platform norms:
  * X (Twitter): punchy, concise, ideally under 240 characters per caption so hashtags fit within 280 chars.
  * LinkedIn: crisp line breaks, strong opening hook, clear takeaway, ~400-900 characters.
  * Instagram: vivid storytelling hook, scannable spacing, engaging question CTA.
  * Facebook: conversational community-driven tone, clear value proposition.
- Return 6 to 8 clean hashtags with leading # symbols (no spaces inside hashtags).
- Give a realistic engagementScore integer between 72 and 98 and a concise, concrete rationale.
- Give a specific bestPostingTime formatted like "Tuesday · 09:15 AM EST" and a 1-sentence reason.`;

  const userPrompt = `Topic / Prompt: ${trimmedTopic}
Tone: ${selectedTone}
Target Platform: ${selectedPlatform}`;

  const callModel = async (modelName: string) => {
    return ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
  };

  try {
    let response;
    try {
      response = await callModel('gemini-2.5-flash');
    } catch (primaryError) {
      if (isNotFoundModelError(primaryError)) {
        response = await callModel('gemini-4-hydrogen');
      } else {
        throw primaryError;
      }
    }

    const rawText = response.text?.trim();
    if (!rawText) {
      res.status(502).json({
        error: 'Gemini returned an empty response. Please try generating again.',
      });
      return;
    }

    const parsed = JSON.parse(rawText);
    const normalizedCaptions = Array.isArray(parsed.captions)
      ? parsed.captions.slice(0, 3).map((item: { angle?: string; hook?: string; text?: string }, idx: number) => ({
          id: `caption-${Date.now()}-${idx}`,
          angle: String(item.angle || `Option ${idx + 1}`),
          hook: String(item.hook || ''),
          text: String(item.text || ''),
        }))
      : [];

    const normalizedHashtags = Array.isArray(parsed.hashtags)
      ? parsed.hashtags
          .map((tag: unknown) => {
            const cleaned = String(tag || '').trim().replace(/\s+/g, '');
            return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
          })
          .filter((tag: string) => tag.length > 1)
      : [];

    const rawScore = Number(parsed.engagementScore);
    const engagementScore = Number.isFinite(rawScore)
      ? Math.max(1, Math.min(100, Math.round(rawScore)))
      : 88;

    res.json({
      captions: normalizedCaptions,
      hashtags: normalizedHashtags,
      engagementScore,
      engagementRationale: String(parsed.engagementRationale || 'Strong scroll-stopping opener aligned with platform cadence.'),
      bestPostingTime: String(parsed.bestPostingTime || 'Tuesday · 09:15 AM EST'),
      bestPostingReason: String(parsed.bestPostingReason || 'Mid-morning weekday window captures peak professional feed activity.'),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as { status?: number; message?: string };
    const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
    console.error('Gemini generation error:', err.message || error);

    if (statusCode === 403 || statusCode === 400) {
      res.status(statusCode).json({
        error: 'Gemini API key was rejected or invalid. Verify GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    if (statusCode === 429) {
      res.status(429).json({
        error: 'Gemini API rate limit reached. Please wait a moment and try again.',
      });
      return;
    }

    res.status(statusCode).json({
      error: err.message || 'Failed to generate content with Gemini AI.',
    });
  }
});

interface TestEmailRequestBody {
  recipientEmail?: string;
  subject?: string;
  platform?: string;
  timing?: string;
  previewText?: string;
}

app.post('/api/notifications/test-email', (req: Request, res: Response) => {
  const { recipientEmail, subject, platform, timing, previewText } =
    (req.body || {}) as TestEmailRequestBody;

  const email = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Please provide a valid recipient email address.' });
    return;
  }

  const dispatchedAt = new Date().toISOString();
  res.json({
    ok: true,
    channel: 'studio-webhook',
    recipientEmail: email,
    subject: subject || `Reminder: Your ${platform || 'LinkedIn'} post goes live!`,
    timing: timing || '15 mins before',
    previewText: previewText || '',
    dispatchedAt,
  });
});

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Vspark Studio server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
