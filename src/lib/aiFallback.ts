import type { GenerationResult, PlatformOption, ToneOption } from '../types/studio';

function extractKeywords(topic: string): string[] {
  const stopWords = new Set([
    'about',
    'after',
    'with',
    'that',
    'this',
    'from',
    'into',
    'your',
    'their',
    'have',
    'been',
    'will',
    'more',
    'than',
    'when',
    'what',
    'teams',
    'using',
    'today',
    'announcing',
    'launching',
  ]);

  const words = topic
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !stopWords.has(w.toLowerCase()));

  const unique: string[] = [];
  for (const word of words) {
    const clean = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    if (!unique.includes(clean)) unique.push(clean);
    if (unique.length >= 4) break;
  }
  return unique;
}

export function buildResilientAiFallback(
  topic: string,
  tone: ToneOption,
  platform: PlatformOption
): GenerationResult {
  const cleanTopic = topic.trim().replace(/\s+/g, ' ');
  const shortTopic =
    cleanTopic.length > 140 ? `${cleanTopic.slice(0, 137)}...` : cleanTopic;
  const keywords = extractKeywords(cleanTopic);

  const toneLead: Record<ToneOption, string> = {
    Professional: 'Strategic takeaway:',
    Casual: 'Real talk from the studio:',
    Viral: 'Unpopular truth:',
    Educational: '3-step playbook:',
  };

  const platformWindow: Record<PlatformOption, { time: string; reason: string; score: number }> = {
    LinkedIn: {
      time: 'Tuesday · 09:15 AM EST',
      reason: 'Decision-makers and founders check industry feeds during morning start-of-day windows.',
      score: 94,
    },
    X: {
      time: 'Wednesday · 12:20 PM EST',
      reason: 'Midday tech discourse peaks around lunch breaks when concise takes earn rapid reposts.',
      score: 92,
    },
    Instagram: {
      time: 'Thursday · 06:30 PM EST',
      reason: 'Evening commute and post-work browsing drives highest visual saves and carousel replies.',
      score: 91,
    },
    Facebook: {
      time: 'Wednesday · 01:15 PM EST',
      reason: 'Community groups and page followers show peak afternoon comment velocity mid-week.',
      score: 89,
    },
  };

  const windowInfo = platformWindow[platform];

  const captions =
    platform === 'X'
      ? [
          {
            id: `fb-${Date.now()}-0`,
            angle: `${tone} Hook`,
            hook: `${toneLead[tone]} ${shortTopic}`,
            text: `${toneLead[tone]} ${shortTopic.slice(0, 170)} — built for speed and measurable reach.`,
          },
          {
            id: `fb-${Date.now()}-1`,
            angle: 'Contrarian Take',
            hook: 'Most teams overcomplicate this.',
            text: `Most teams overcomplicate ${keywords[0]?.toLowerCase() || 'distribution'}. Focus on clarity first: ${shortTopic.slice(0, 145)}`,
          },
          {
            id: `fb-${Date.now()}-2`,
            angle: 'Direct CTA',
            hook: 'Shipping today.',
            text: `Shipping ${keywords[0]?.toLowerCase() || 'our latest milestone'}: ${shortTopic.slice(0, 155)} What would you test first?`,
          },
        ]
      : [
          {
            id: `fb-${Date.now()}-0`,
            angle: `${tone} Narrative`,
            hook: `${toneLead[tone]} ${shortTopic}`,
            text: `${toneLead[tone]} ${cleanTopic}\n\nWhen teams align product craft with clear platform-native storytelling, every launch compounds organic reach without extra ad spend.`,
          },
          {
            id: `fb-${Date.now()}-1`,
            angle: 'Tactical Breakdown',
            hook: 'Here is what actually moved the needle:',
            text: `Here is what stood out while working on ${keywords[0]?.toLowerCase() || 'this release'}:\n\n1. Lead with a concrete outcome\n2. Keep copy scannable for ${platform} readers\n3. Pair visual proof with a clear next step\n\nContext: ${shortTopic}`,
          },
          {
            id: `fb-${Date.now()}-2`,
            angle: 'Community Question',
            hook: 'One lesson worth sharing:',
            text: `${cleanTopic}\n\nCurious how other builders approach ${keywords[0]?.toLowerCase() || 'this workflow'} in 2026 — drop your stack below.`,
          },
        ];

  const generatedTags = [
    ...keywords.map((k) => `#${k}`),
    `#${platform}Growth`,
    '#BuildInPublic',
    '#VsparkStudio',
    '#SaaS2026',
  ].slice(0, 7);

  return {
    captions,
    hashtags: generatedTags,
    engagementScore: windowInfo.score,
    engagementRationale: `Tailored ${tone.toLowerCase()} structure with scannable opening hook calibrated for ${platform} feed dwell time.`,
    bestPostingTime: windowInfo.time,
    bestPostingReason: windowInfo.reason,
    generatedAt: new Date().toISOString(),
  };
}
