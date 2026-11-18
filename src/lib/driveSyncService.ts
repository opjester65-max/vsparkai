import type { ScheduledPost } from '../types/studio';

export const DRIVE_FOLDER_NAME = 'vspark-folder';
const DRIVE_SYNC_LOG_KEY = 'vspark_drive_sync_log_v1';

export type DriveExportFormat = 'json' | 'csv' | 'both';

export interface DriveSyncLogEntry {
  id: string;
  folder: string;
  format: DriveExportFormat;
  postCount: number;
  postIds: string[];
  mode: 'webhook' | 'bundle-download';
  syncedAt: string;
  statusLabel: string;
}

export function getDriveWebhookUrl(): string | undefined {
  const url = import.meta.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL?.trim();
  return url ? url : undefined;
}

export function readDriveSyncLogs(): DriveSyncLogEntry[] {
  try {
    const raw = localStorage.getItem(DRIVE_SYNC_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DriveSyncLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendDriveSyncLog(entry: DriveSyncLogEntry): DriveSyncLogEntry[] {
  const updated = [entry, ...readDriveSyncLogs()].slice(0, 12);
  try {
    localStorage.setItem(DRIVE_SYNC_LOG_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
  return updated;
}

function escapeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildDriveJsonBundle(posts: ScheduledPost[], userEmail: string): string {
  const payload = {
    driveTargetFolder: DRIVE_FOLDER_NAME,
    exportedAt: new Date().toISOString(),
    owner: userEmail,
    totalPosts: posts.length,
    posts: posts.map((p) => ({
      id: p.id,
      platform: p.platform,
      status: p.status,
      scheduledAt: p.scheduledAt,
      tone: p.tone,
      engagementScore: p.engagementScore,
      topic: p.topic,
      caption: p.caption,
      hashtags: p.hashtags,
      mediaUrl: p.mediaUrl,
      notifyBeforeMinutes: p.notifyBeforeMinutes,
      notifyEmail: p.notifyEmail,
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function buildDriveCsvBundle(posts: ScheduledPost[]): string {
  const headers = [
    'id',
    'platform',
    'status',
    'scheduled_at',
    'tone',
    'engagement_score',
    'topic',
    'caption',
    'hashtags',
    'media_url',
    'notify_before_minutes',
    'notify_email',
  ];

  const rows = posts.map((p) =>
    [
      p.id,
      p.platform,
      p.status,
      p.scheduledAt,
      p.tone,
      String(p.engagementScore),
      p.topic,
      p.caption,
      p.hashtags.join(' '),
      p.mediaUrl || '',
      String(p.notifyBeforeMinutes),
      String(p.notifyEmail),
    ]
      .map(escapeCsvCell)
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function syncPostsToGoogleDrive(params: {
  posts: ScheduledPost[];
  userEmail: string;
  format: DriveExportFormat;
}): Promise<{ entry: DriveSyncLogEntry; logs: DriveSyncLogEntry[] }> {
  const { posts, userEmail, format } = params;
  if (posts.length === 0) {
    throw new Error('Add at least one scheduled post before syncing to Google Drive.');
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const jsonContent = buildDriveJsonBundle(posts, userEmail);
  const csvContent = buildDriveCsvBundle(posts);
  const webhookUrl = getDriveWebhookUrl();

  let mode: 'webhook' | 'bundle-download' = 'bundle-download';

  if (webhookUrl) {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonContent,
    });
    if (!res.ok) {
      throw new Error(`Drive webhook responded with HTTP ${res.status}.`);
    }
    mode = 'webhook';
  }

  if (format === 'json' || format === 'both') {
    triggerFileDownload(
      `${DRIVE_FOLDER_NAME}-bundle-${stamp}.json`,
      jsonContent,
      'application/json;charset=utf-8'
    );
  }

  if (format === 'csv' || format === 'both') {
    triggerFileDownload(
      `${DRIVE_FOLDER_NAME}-schedule-${stamp}.csv`,
      csvContent,
      'text/csv;charset=utf-8'
    );
  }

  const entry: DriveSyncLogEntry = {
    id: `sync-${Date.now()}`,
    folder: DRIVE_FOLDER_NAME,
    format,
    postCount: posts.length,
    postIds: posts.map((p) => p.id),
    mode,
    syncedAt: new Date().toISOString(),
    statusLabel: `Synced to Drive ${DRIVE_FOLDER_NAME}`,
  };

  const logs = appendDriveSyncLog(entry);
  return { entry, logs };
}
