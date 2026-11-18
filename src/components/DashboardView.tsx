import { ArrowRight, CalendarClock, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { NavTab, PlatformOption, ScheduledPost, ToneOption } from '../types/studio';
import { PROMPT_STARTERS } from '../lib/studioData';

interface DashboardViewProps {
  posts: ScheduledPost[];
  loading: boolean;
  userName: string;
  onNavigate: (tab: NavTab) => void;
  onLaunchStarter: (topic: string, tone: ToneOption, platform: PlatformOption) => void;
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardView({
  posts,
  loading,
  userName,
  onNavigate,
  onLaunchStarter,
}: DashboardViewProps) {
  const scheduledCount = posts.filter((p) => p.status === 'Scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'Published').length;
  const avgScore =
    posts.length > 0
      ? Math.round(posts.reduce((sum, p) => sum + p.engagementScore, 0) / posts.length)
      : 0;
  const activeChannels = new Set(posts.map((p) => p.platform)).size;

  const recentPosts = posts.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Studio Overview
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Manage upcoming multi-platform campaigns, generate Gemini-powered captions, and inspect live previews before publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('generator')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New AI Campaign</span>
        </button>
      </section>

      <section aria-label="Workspace Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Scheduled Posts
          </p>
          {loading ? (
            <div className="h-8 w-14 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : (
            <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
              {scheduledCount}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Queued across channels
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Avg. Engagement Score
          </p>
          {loading ? (
            <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : (
            <p className="font-mono text-2xl font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {avgScore > 0 ? `${avgScore}/100` : '—'}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gemini forecast benchmark
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Published Posts
          </p>
          {loading ? (
            <div className="h-8 w-14 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : (
            <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
              {publishedCount}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Completed dispatches
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Active Channels
          </p>
          {loading ? (
            <div className="h-8 w-14 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : (
            <p className="font-mono text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">
              {activeChannels}
            </p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            LinkedIn · X · Instagram
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Upcoming &amp; Recent Queue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ordered chronologically by scheduled publish slot.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('feed')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="h-14 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <CalendarClock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                No scheduled posts yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Use the Gemini AI Generator to craft platform-ready copy and queue it with one click.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('generator')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                Open AI Generator
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {post.platform}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{post.tone}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          post.status === 'Published'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : post.status === 'Scheduled'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {post.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-1">
                      {post.caption}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="font-mono text-xs font-medium text-slate-900 dark:text-slate-200 tabular-nums">
                      {post.engagementScore}/100
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatShortDate(post.scheduledAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Quick Campaign Starters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Load a proven brief directly into the Gemini AI Generator.
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {PROMPT_STARTERS.map((starter) => (
              <div key={starter.label} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {starter.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {starter.platform} · {starter.tone}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {starter.topic}
                </p>
                <button
                  type="button"
                  onClick={() => onLaunchStarter(starter.topic, starter.tone, starter.platform)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <span>Load in AI Generator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
