import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  BellRing,
  Calendar as CalendarIcon,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  Globe,
  HardDriveUpload,
  Instagram,
  LayoutGrid,
  Linkedin,
  List,
  Plus,
  Search,
  Trash2,
  Twitter,
} from 'lucide-react';
import type {
  AuthUser,
  NavTab,
  PlatformOption,
  PostStatus,
  ScheduledPost,
  UpdateScheduledPostInput,
} from '../types/studio';
import { EditPostModal } from './EditPostModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import {
  DRIVE_FOLDER_NAME,
  readDriveSyncLogs,
  syncPostsToGoogleDrive,
  type DriveExportFormat,
  type DriveSyncLogEntry,
} from '../lib/driveSyncService';
import {
  readEmailSettings,
  sendTestEmailReminder,
} from '../lib/notificationService';

interface ScheduledFeedViewProps {
  user: AuthUser;
  posts: ScheduledPost[];
  loading: boolean;
  syncNotice: string | null;
  onUpdatePost: (id: string, updates: UpdateScheduledPostInput) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
  onNavigate: (tab: NavTab) => void;
}

type FeedViewMode = 'grid' | 'timeline' | 'calendar';

const PLATFORM_FILTERS: ('All' | PlatformOption)[] = [
  'All',
  'LinkedIn',
  'X',
  'Instagram',
  'Facebook',
];

const STATUS_FILTERS: ('All' | PostStatus)[] = ['All', 'Scheduled', 'Published', 'Draft'];

function PlatformIcon({ platform }: { platform: PlatformOption }) {
  switch (platform) {
    case 'LinkedIn':
      return <Linkedin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />;
    case 'X':
      return <Twitter className="w-4 h-4 text-slate-900 dark:text-slate-100 shrink-0" />;
    case 'Instagram':
      return <Instagram className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />;
    case 'Facebook':
    default:
      return <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
  }
}

function StatusIndicator({ status }: { status: PostStatus }) {
  if (status === 'Published') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Published</span>
      </span>
    );
  }
  if (status === 'Draft') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <FileText className="w-3.5 h-3.5" />
        <span>Draft</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
      <Clock className="w-3.5 h-3.5" />
      <span>Scheduled</span>
    </span>
  );
}

function formatCountdown(targetIso: string, nowMs: number, status: PostStatus): string {
  if (status === 'Published') return 'Dispatched';
  const targetMs = new Date(targetIso).getTime();
  if (Number.isNaN(targetMs)) return 'Invalid date';

  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) return 'Due now';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `In ${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `In ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function formatScheduledLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ScheduledFeedView({
  user,
  posts,
  loading,
  syncNotice,
  onUpdatePost,
  onDeletePost,
  onNavigate,
}: ScheduledFeedViewProps) {
  const [viewMode, setViewMode] = useState<FeedViewMode>('grid');
  const [platformFilter, setPlatformFilter] = useState<'All' | PlatformOption>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | PostStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<ScheduledPost | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const [driveFormat, setDriveFormat] = useState<DriveExportFormat>('json');
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [driveLogs, setDriveLogs] = useState<DriveSyncLogEntry[]>(() =>
    readDriveSyncLogs()
  );

  const [calendarDate, setCalendarDate] = useState(() => {
    const first = posts[0]?.scheduledAt ? new Date(posts[0].scheduledAt) : new Date();
    return new Date(first.getFullYear(), first.getMonth(), 1);
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setActionToast(msg);
    window.setTimeout(() => {
      setActionToast((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      if (platformFilter !== 'All' && post.platform !== platformFilter) return false;
      if (statusFilter !== 'All' && post.status !== statusFilter) return false;
      if (q) {
        const hay = `${post.caption} ${post.hashtags.join(' ')} ${post.platform} ${post.topic}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, platformFilter, statusFilter, searchQuery]);

  const syncedPostIds = useMemo(() => {
    const set = new Set<string>();
    for (const log of driveLogs) {
      for (const id of log.postIds || []) {
        set.add(id);
      }
    }
    return set;
  }, [driveLogs]);

  const timelineGroups = useMemo(() => {
    const groups = new Map<string, ScheduledPost[]>();
    for (const post of filteredPosts) {
      const dateObj = new Date(post.scheduledAt);
      const label = Number.isNaN(dateObj.getTime())
        ? 'Unscheduled'
        : dateObj.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
      const existing = groups.get(label) || [];
      existing.push(post);
      groups.set(label, existing);
    }
    return Array.from(groups.entries());
  }, [filteredPosts]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateKey: string | null }> = [];

    for (let i = 0; i < firstDayIndex; i += 1) {
      cells.push({ day: null, dateKey: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, dateKey: key });
    }
    return cells;
  }, [calendarDate]);

  const postsByDateKey = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    for (const post of filteredPosts) {
      const key = getDateKey(post.scheduledAt);
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(post);
      map.set(key, list);
    }
    return map;
  }, [filteredPosts]);

  const handleSyncPostsToDrive = async (targetPosts: ScheduledPost[]) => {
    setSyncingDrive(true);
    try {
      const { entry, logs } = await syncPostsToGoogleDrive({
        posts: targetPosts,
        userEmail: user.email,
        format: driveFormat,
      });
      setDriveLogs(logs);
      showToast(
        `${entry.statusLabel} · ${entry.postCount} ${entry.postCount === 1 ? 'post' : 'posts'} packaged (${entry.format.toUpperCase()}) at ${new Date(entry.syncedAt).toLocaleTimeString()}.`
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Drive sync failed.');
    } finally {
      setSyncingDrive(false);
    }
  };

  const handleTestNotification = async (post: ScheduledPost) => {
    const emailSettings = readEmailSettings(user.id, user.email);
    const title = `Vspark Reminder · ${post.platform}`;
    const body = `${post.caption.slice(0, 96)}${post.caption.length > 96 ? '...' : ''}`;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            new Notification(title, { body });
          }
        }
      } catch {
        // Ignore restricted iframe notification error
      }
    }

    try {
      const { entry } = await sendTestEmailReminder({
        settings: emailSettings,
        platform: post.platform,
        previewText: post.caption,
      });
      showToast(
        `Reminder dispatched to ${entry.recipientEmail}: "${entry.subject}" (${new Date(entry.dispatchedAt).toLocaleTimeString()}).`
      );
    } catch {
      showToast(`Browser preview alert triggered for ${post.platform}.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPost) return;
    setDeletingBusy(true);
    try {
      await onDeletePost(deletingPost.id);
      showToast(`Deleted ${deletingPost.platform} post.`);
      setDeletingPost(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  const renderQuickActions = (post: ScheduledPost) => {
    const isSynced = syncedPostIds.has(post.id);
    return (
      <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        {isSynced && (
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Synced to Drive {DRIVE_FOLDER_NAME}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingPost(post)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            disabled={syncingDrive}
            onClick={() => void handleSyncPostsToDrive([post])}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60"
          >
            <HardDriveUpload className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sync to Drive</span>
          </button>

          <button
            type="button"
            onClick={() => void handleTestNotification(post)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-500" />
            <span>Test Notification</span>
          </button>

          <button
            type="button"
            onClick={() => setDeletingPost(post)}
            aria-label="Delete scheduled post"
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Publishing Queue &amp; Drive Export
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            Scheduled Feed
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Ordered chronologically by scheduled timestamp</span>
            {driveLogs[0] && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {driveLogs[0].statusLabel} ({new Date(driveLogs[0].syncedAt).toLocaleTimeString()})
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(['json', 'csv', 'both'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setDriveFormat(fmt)}
                className={`px-2 py-1 text-[11px] font-medium rounded uppercase transition-colors cursor-pointer ${
                  driveFormat === fmt
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={syncingDrive || filteredPosts.length === 0}
            onClick={() => void handleSyncPostsToDrive(filteredPosts)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-indigo-500/60 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <HardDriveUpload className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sync All to Drive</span>
          </button>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('generator')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-900/70 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
          {syncNotice}
        </div>
      )}

      {actionToast && (
        <div
          role="status"
          className="rounded-lg border border-indigo-300 dark:border-indigo-900/70 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2.5 text-xs font-medium text-indigo-700 dark:text-indigo-200"
        >
          {actionToast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {PLATFORM_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPlatformFilter(item)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  platformFilter === item
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatusFilter(item)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === item
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search captions, topics, or tags..."
            aria-label="Search scheduled posts"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-3"
            >
              <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-16 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="h-8 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-12 text-center space-y-3">
          <CalendarClock className="w-9 h-9 text-slate-400 mx-auto" />
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            No scheduled posts in this view
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Adjust your filters or create a new post in the Gemini AI Generator.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('generator')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            Open AI Generator
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 backdrop-blur-md p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <PlatformIcon platform={post.platform} />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {post.platform}
                    </span>
                    <span aria-hidden="true">·</span>
                    <StatusIndicator status={post.status} />
                  </div>

                  <div className="text-right">
                    <p className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {formatCountdown(post.scheduledAt, nowMs, post.status)}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatScheduledLabel(post.scheduledAt)}
                    </p>
                  </div>
                </div>

                {post.mediaUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                    <img
                      src={post.mediaUrl}
                      alt={`${post.platform} media attachment`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {post.caption}
                </p>

                {post.hashtags.length > 0 && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {post.hashtags.join(' ')}
                  </p>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono tabular-nums">
                    Score {post.engagementScore}/100
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {post.notifyBeforeMinutes > 0
                      ? `Alert ${post.notifyBeforeMinutes}m prior`
                      : 'No alert'}
                  </span>
                </div>
              </div>

              {renderQuickActions(post)}
            </article>
          ))}
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-8">
          {timelineGroups.map(([dateLabel, groupPosts]) => (
            <section key={dateLabel} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                  {dateLabel}
                </h2>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {groupPosts.length} {groupPosts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>

              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-4">
                {groupPosts.map((post) => (
                  <article
                    key={post.id}
                    className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 p-5 space-y-4"
                  >
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-950 absolute -left-[29px] top-6"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <PlatformIcon platform={post.platform} />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {post.platform}
                        </span>
                        <span aria-hidden="true">·</span>
                        <StatusIndicator status={post.status} />
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(post.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {formatCountdown(post.scheduledAt, nowMs, post.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      <div className={post.mediaUrl ? 'md:col-span-9 space-y-2' : 'md:col-span-12 space-y-2'}>
                        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {post.caption}
                        </p>
                        {post.hashtags.length > 0 && (
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            {post.hashtags.join(' ')}
                          </p>
                        )}
                      </div>
                      {post.mediaUrl && (
                        <div className="md:col-span-3">
                          <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                            <img
                              src={post.mediaUrl}
                              alt={`${post.platform} media`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {renderQuickActions(post)}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              {calendarDate.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setCalendarDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setCalendarDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2.5 border-r last:border-r-0 border-slate-200 dark:border-slate-800">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((cell, idx) => {
              const dayPosts = cell.dateKey ? postsByDateKey.get(cell.dateKey) || [] : [];
              return (
                <div
                  key={idx}
                  className="min-h-[116px] p-2 border-r border-b border-slate-200 dark:border-slate-800/80 last:border-r-0 bg-white/40 dark:bg-slate-950/30 space-y-1.5"
                >
                  {cell.day && (
                    <div className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      {cell.day}
                    </div>
                  )}
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setEditingPost(post)}
                      className="w-full text-left rounded-md border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1.5 space-y-0.5 hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        <span className="truncate">{post.platform}</span>
                        <span className="font-mono tabular-nums shrink-0">
                          {new Date(post.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-1">
                        {post.caption}
                      </p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={async (id, updates) => {
            await onUpdatePost(id, updates);
            showToast('Post changes saved.');
          }}
        />
      )}

      {deletingPost && (
        <DeleteConfirmModal
          post={deletingPost}
          deleting={deletingBusy}
          onCancel={() => setDeletingPost(null)}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}
    </motion.div>
  );
}
