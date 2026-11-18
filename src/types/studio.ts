export type ToneOption = 'Professional' | 'Casual' | 'Viral' | 'Educational';

export type PlatformOption = 'LinkedIn' | 'X' | 'Instagram' | 'Facebook';

export type NavTab = 'dashboard' | 'generator' | 'feed' | 'settings';

export type ThemeMode = 'dark' | 'light';

export interface GeneratedCaption {
  id: string;
  angle: string;
  hook: string;
  text: string;
}

export interface GenerationResult {
  captions: GeneratedCaption[];
  hashtags: string[];
  engagementScore: number;
  engagementRationale: string;
  bestPostingTime: string;
  bestPostingReason: string;
  generatedAt: string;
}

export type PostStatus = 'Scheduled' | 'Published' | 'Draft';

export interface NotificationSettings {
  notifyBeforeMinutes: number;
  notifyEmail: boolean;
}

export interface ScheduledPost {
  id: string;
  userId: string;
  platform: PlatformOption;
  topic: string;
  caption: string;
  hashtags: string[];
  scheduledAt: string;
  status: PostStatus;
  engagementScore: number;
  tone: ToneOption;
  mediaUrl: string | null;
  notifyBeforeMinutes: number;
  notifyEmail: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateScheduledPostInput {
  platform: PlatformOption;
  topic: string;
  caption: string;
  hashtags: string[];
  scheduledAt: string;
  status?: PostStatus;
  engagementScore: number;
  tone: ToneOption;
  mediaUrl?: string | null;
  notifyBeforeMinutes?: number;
  notifyEmail?: boolean;
}

export interface UpdateScheduledPostInput {
  platform?: PlatformOption;
  topic?: string;
  caption?: string;
  hashtags?: string[];
  scheduledAt?: string;
  status?: PostStatus;
  mediaUrl?: string | null;
  notifyBeforeMinutes?: number;
  notifyEmail?: boolean;
}

export interface CreatorProfile {
  displayName: string;
  handle: string;
  headline: string;
  avatarUrl: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: 'supabase' | 'demo';
  createdAt: string;
}
