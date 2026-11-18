import type { CreatorProfile, ScheduledPost } from '../types/studio';

export const CREATOR_AVATAR_URL = '/src/assets/images/avatar_creator_studio_1794988831042.jpg';
export const LAUNCH_VISUAL_URL = '/src/assets/images/preview_launch_visual_1794988831744.jpg';
export const EDITORIAL_DESK_URL = '/src/assets/images/preview_editorial_desk_1794988831894.jpg';

export const DEFAULT_PROFILE: CreatorProfile = {
  displayName: 'Aarav Mehta',
  handle: '@aaravbuilds',
  headline: 'Founder & Product Architect · Vspark Studio',
  avatarUrl: CREATOR_AVATAR_URL,
};

function futureIso(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

export const INITIAL_SCHEDULED_POSTS: ScheduledPost[] = [
  {
    id: 'seed-post-1',
    userId: 'judge-vspark-2026',
    platform: 'LinkedIn',
    topic: 'Distribution velocity for SaaS product launches',
    caption:
      'Most SaaS launches fail before day one because teams optimize feature lists instead of distribution velocity.\n\nWe rebuilt our release pipeline around a single rule: every product milestone ships with three platform-native narratives tested before noon.',
    hashtags: ['#ProductEngineering', '#SaaSGrowth', '#BuildInPublic', '#DeveloperTools'],
    scheduledAt: futureIso(18),
    status: 'Scheduled',
    engagementScore: 94,
    tone: 'Professional',
    mediaUrl: LAUNCH_VISUAL_URL,
    notifyBeforeMinutes: 30,
    notifyEmail: true,
    createdAt: '2026-11-17T18:30:00.000Z',
  },
  {
    id: 'seed-post-2',
    userId: 'judge-vspark-2026',
    platform: 'X',
    topic: 'Multi-platform AI workflow speed',
    caption:
      'Shipping fast is table stakes. Shipping with a sharp narrative that lands across LinkedIn, X, and Instagram in under 60 seconds is the real unfair advantage.',
    hashtags: ['#IndieHackers', '#ShipFast', '#AIWorkflow'],
    scheduledAt: futureIso(42),
    status: 'Scheduled',
    engagementScore: 91,
    tone: 'Viral',
    mediaUrl: null,
    notifyBeforeMinutes: 15,
    notifyEmail: true,
    createdAt: '2026-11-17T19:10:00.000Z',
  },
  {
    id: 'seed-post-3',
    userId: 'judge-vspark-2026',
    platform: 'Instagram',
    topic: 'Q4 release architecture behind the scenes',
    caption:
      'Behind the desk at midnight refining our Q4 release architecture. Clean typography, zero clutter, and deterministic workflows always win over noisy dashboards.\n\nWhat is the one tool you cannot build without this year?',
    hashtags: ['#DesignEngineering', '#MinimalSetup', '#TechFounder', '#StudioLife'],
    scheduledAt: futureIso(-6),
    status: 'Published',
    engagementScore: 89,
    tone: 'Casual',
    mediaUrl: EDITORIAL_DESK_URL,
    notifyBeforeMinutes: 0,
    notifyEmail: false,
    createdAt: '2026-11-16T15:00:00.000Z',
  },
];

export const PROMPT_STARTERS = [
  {
    label: 'SaaS Product Launch',
    topic:
      'Announcing our 2.0 release with real-time collaborative workspaces, sub-50ms sync, and zero-config API webhooks for engineering teams.',
    tone: 'Professional' as const,
    platform: 'LinkedIn' as const,
  },
  {
    label: 'Contrarian Engineering Take',
    topic:
      'Why small 4-person engineering teams consistently outship 40-person departments by cutting status meetings and shipping daily.',
    tone: 'Viral' as const,
    platform: 'X' as const,
  },
  {
    label: 'Design System Breakdown',
    topic:
      'Three spacing and typography rules we used to transform a cluttered B2B dashboard into a calm, high-contrast studio interface.',
    tone: 'Educational' as const,
    platform: 'Instagram' as const,
  },
];
