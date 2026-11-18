import { supabase } from './supabase';
import { INITIAL_SCHEDULED_POSTS } from './studioData';
import type {
  AuthUser,
  CreateScheduledPostInput,
  PlatformOption,
  PostStatus,
  ScheduledPost,
  ToneOption,
  UpdateScheduledPostInput,
} from '../types/studio';

interface DbScheduledPostRow {
  id: string;
  user_id: string;
  platform: PlatformOption;
  topic: string | null;
  caption: string;
  hashtags: string[] | null;
  media_url: string | null;
  scheduled_at: string;
  notify_before_minutes: number | null;
  notify_email: boolean | null;
  status: PostStatus;
  engagement_score: number | null;
  tone: ToneOption | null;
  created_at: string;
  updated_at?: string | null;
}

export interface PostsServiceResult<T> {
  data: T;
  source: 'supabase' | 'local';
  warning?: string;
}

function getLocalStorageKey(userId: string): string {
  return `vspark_scheduled_posts_${userId}`;
}

function sortByScheduledAt(posts: ScheduledPost[]): ScheduledPost[] {
  return [...posts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

function readLocalPosts(userId: string): ScheduledPost[] {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as ScheduledPost[];
      if (Array.isArray(parsed)) {
        return sortByScheduledAt(parsed);
      }
    }
  } catch {
    // Ignore parse errors
  }

  const seeded = INITIAL_SCHEDULED_POSTS.map((item) => ({
    ...item,
    userId,
  }));
  writeLocalPosts(userId, seeded);
  return sortByScheduledAt(seeded);
}

function writeLocalPosts(userId: string, posts: ScheduledPost[]) {
  try {
    localStorage.setItem(getLocalStorageKey(userId), JSON.stringify(sortByScheduledAt(posts)));
  } catch {
    // Ignore storage quota errors
  }
}

function mapRowToPost(row: DbScheduledPostRow): ScheduledPost {
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    topic: row.topic || '',
    caption: row.caption,
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    mediaUrl: row.media_url,
    scheduledAt: row.scheduled_at,
    notifyBeforeMinutes: row.notify_before_minutes ?? 30,
    notifyEmail: row.notify_email ?? true,
    status: row.status,
    engagementScore: row.engagement_score ?? 90,
    tone: row.tone || 'Professional',
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

function shouldUseSupabaseDb(user: AuthUser): boolean {
  return Boolean(supabase && user.provider === 'supabase');
}

export async function fetchScheduledPosts(
  user: AuthUser
): Promise<PostsServiceResult<ScheduledPost[]>> {
  if (shouldUseSupabaseDb(user) && supabase) {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (error) {
        throw error;
      }

      const mapped = ((data || []) as DbScheduledPostRow[]).map(mapRowToPost);
      writeLocalPosts(user.id, mapped);
      return { data: mapped, source: 'supabase' };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Supabase table unavailable';
      return {
        data: readLocalPosts(user.id),
        source: 'local',
        warning: `Using local studio cache (${message}). Run supabase/schema.sql to enable remote sync.`,
      };
    }
  }

  return {
    data: readLocalPosts(user.id),
    source: 'local',
  };
}

export async function createScheduledPost(
  user: AuthUser,
  input: CreateScheduledPostInput
): Promise<PostsServiceResult<ScheduledPost>> {
  const scheduledAtIso = new Date(input.scheduledAt).toISOString();

  if (shouldUseSupabaseDb(user) && supabase) {
    try {
      const insertPayload = {
        user_id: user.id,
        platform: input.platform,
        topic: input.topic,
        caption: input.caption,
        hashtags: input.hashtags,
        media_url: input.mediaUrl || null,
        scheduled_at: scheduledAtIso,
        notify_before_minutes: input.notifyBeforeMinutes ?? 30,
        notify_email: input.notifyEmail ?? true,
        status: input.status || 'Scheduled',
        engagement_score: input.engagementScore,
        tone: input.tone,
      };

      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const mapped = mapRowToPost(data as DbScheduledPostRow);
      const existing = readLocalPosts(user.id);
      writeLocalPosts(user.id, [mapped, ...existing]);
      return { data: mapped, source: 'supabase' };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Supabase insert failed';

      const fallbackPost: ScheduledPost = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        platform: input.platform,
        topic: input.topic,
        caption: input.caption,
        hashtags: input.hashtags,
        mediaUrl: input.mediaUrl || null,
        scheduledAt: scheduledAtIso,
        notifyBeforeMinutes: input.notifyBeforeMinutes ?? 30,
        notifyEmail: input.notifyEmail ?? true,
        status: input.status || 'Scheduled',
        engagementScore: input.engagementScore,
        tone: input.tone,
        createdAt: new Date().toISOString(),
      };
      const existing = readLocalPosts(user.id);
      writeLocalPosts(user.id, [fallbackPost, ...existing]);

      return {
        data: fallbackPost,
        source: 'local',
        warning: `Saved locally (${message}).`,
      };
    }
  }

  const localPost: ScheduledPost = {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: user.id,
    platform: input.platform,
    topic: input.topic,
    caption: input.caption,
    hashtags: input.hashtags,
    mediaUrl: input.mediaUrl || null,
    scheduledAt: scheduledAtIso,
    notifyBeforeMinutes: input.notifyBeforeMinutes ?? 30,
    notifyEmail: input.notifyEmail ?? true,
    status: input.status || 'Scheduled',
    engagementScore: input.engagementScore,
    tone: input.tone,
    createdAt: new Date().toISOString(),
  };

  const existing = readLocalPosts(user.id);
  writeLocalPosts(user.id, [localPost, ...existing]);

  return {
    data: localPost,
    source: 'local',
  };
}

export async function updateScheduledPost(
  user: AuthUser,
  postId: string,
  updates: UpdateScheduledPostInput
): Promise<PostsServiceResult<ScheduledPost | null>> {
  const normalizedUpdates: UpdateScheduledPostInput = {
    ...updates,
    scheduledAt: updates.scheduledAt
      ? new Date(updates.scheduledAt).toISOString()
      : undefined,
  };

  if (shouldUseSupabaseDb(user) && supabase && !postId.startsWith('local-') && !postId.startsWith('seed-') && !postId.startsWith('post-')) {
    try {
      const dbPatch: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (normalizedUpdates.platform !== undefined) dbPatch.platform = normalizedUpdates.platform;
      if (normalizedUpdates.topic !== undefined) dbPatch.topic = normalizedUpdates.topic;
      if (normalizedUpdates.caption !== undefined) dbPatch.caption = normalizedUpdates.caption;
      if (normalizedUpdates.hashtags !== undefined) dbPatch.hashtags = normalizedUpdates.hashtags;
      if (normalizedUpdates.mediaUrl !== undefined) dbPatch.media_url = normalizedUpdates.mediaUrl;
      if (normalizedUpdates.scheduledAt !== undefined) dbPatch.scheduled_at = normalizedUpdates.scheduledAt;
      if (normalizedUpdates.notifyBeforeMinutes !== undefined) {
        dbPatch.notify_before_minutes = normalizedUpdates.notifyBeforeMinutes;
      }
      if (normalizedUpdates.notifyEmail !== undefined) dbPatch.notify_email = normalizedUpdates.notifyEmail;
      if (normalizedUpdates.status !== undefined) dbPatch.status = normalizedUpdates.status;

      const { data, error } = await supabase
        .from('scheduled_posts')
        .update(dbPatch)
        .eq('id', postId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const mapped = mapRowToPost(data as DbScheduledPostRow);
      const localList = readLocalPosts(user.id).map((p) => (p.id === postId ? mapped : p));
      writeLocalPosts(user.id, localList);
      return { data: mapped, source: 'supabase' };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Supabase update failed';

      let updatedItem: ScheduledPost | null = null;
      const localList = readLocalPosts(user.id).map((p) => {
        if (p.id !== postId) return p;
        updatedItem = {
          ...p,
          ...normalizedUpdates,
          scheduledAt: normalizedUpdates.scheduledAt ?? p.scheduledAt,
          updatedAt: new Date().toISOString(),
        };
        return updatedItem;
      });
      writeLocalPosts(user.id, localList);

      return {
        data: updatedItem,
        source: 'local',
        warning: `Updated in local cache (${message}).`,
      };
    }
  }

  let updatedItem: ScheduledPost | null = null;
  const localList = readLocalPosts(user.id).map((p) => {
    if (p.id !== postId) return p;
    updatedItem = {
      ...p,
      ...normalizedUpdates,
      scheduledAt: normalizedUpdates.scheduledAt ?? p.scheduledAt,
      updatedAt: new Date().toISOString(),
    };
    return updatedItem;
  });
  writeLocalPosts(user.id, localList);

  return {
    data: updatedItem,
    source: 'local',
  };
}

export async function deleteScheduledPost(
  user: AuthUser,
  postId: string
): Promise<PostsServiceResult<boolean>> {
  if (shouldUseSupabaseDb(user) && supabase && !postId.startsWith('local-') && !postId.startsWith('seed-') && !postId.startsWith('post-')) {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const remaining = readLocalPosts(user.id).filter((p) => p.id !== postId);
      writeLocalPosts(user.id, remaining);
      return { data: true, source: 'supabase' };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Supabase delete failed';
      const remaining = readLocalPosts(user.id).filter((p) => p.id !== postId);
      writeLocalPosts(user.id, remaining);
      return {
        data: true,
        source: 'local',
        warning: `Removed from local cache (${message}).`,
      };
    }
  }

  const remaining = readLocalPosts(user.id).filter((p) => p.id !== postId);
  writeLocalPosts(user.id, remaining);
  return {
    data: true,
    source: 'local',
  };
}

export function subscribeToScheduledPosts(
  user: AuthUser,
  onChange: () => void
): () => void {
  if (!shouldUseSupabaseDb(user) || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel(`scheduled_posts_${user.id}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'scheduled_posts',
        filter: `user_id=eq.${user.id}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
