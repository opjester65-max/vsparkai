import { useState } from 'react';
import {
  Bookmark,
  CalendarPlus,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Repeat2,
  Send,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import type { CreatorProfile, PlatformOption } from '../types/studio';
import { EDITORIAL_DESK_URL, LAUNCH_VISUAL_URL } from '../lib/studioData';

interface PlatformPreviewsProps {
  caption: string;
  hashtags: string[];
  profile: CreatorProfile;
  selectedPlatform: PlatformOption;
  includeMedia: boolean;
  mediaChoice: 'launch' | 'desk';
  uploadedMediaUrl: string | null;
  onSchedulePlatform: (platform: 'LinkedIn' | 'X' | 'Instagram') => void;
}

type PreviewFilter = 'all' | 'LinkedIn' | 'X' | 'Instagram';

const PLATFORM_LIMITS: Record<'LinkedIn' | 'X' | 'Instagram', number> = {
  LinkedIn: 3000,
  X: 280,
  Instagram: 2200,
};

function CharacterCount({ count, limit }: { count: number; limit: number }) {
  const ratio = count / limit;
  const colorClass =
    count > limit
      ? 'text-rose-600 dark:text-rose-400 font-semibold'
      : ratio > 0.85
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-slate-500 dark:text-slate-400';

  return (
    <span className={`font-mono text-xs tabular-nums ${colorClass}`}>
      {count}/{limit} chars
    </span>
  );
}

function AvatarImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-400 shrink-0">
        {name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
    />
  );
}

function MediaPreviewBlock({
  src,
  alt,
  aspectClass,
}: {
  src: string;
  alt: string;
  aspectClass: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`w-full ${aspectClass} rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 relative`}
    >
      {!failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 p-4">
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs">Campaign Media Preview</span>
        </div>
      )}
    </div>
  );
}

export function PlatformPreviews({
  caption,
  hashtags,
  profile,
  selectedPlatform,
  includeMedia,
  mediaChoice,
  uploadedMediaUrl,
  onSchedulePlatform,
}: PlatformPreviewsProps) {
  const [filter, setFilter] = useState<PreviewFilter>('all');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [reposted, setReposted] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const hashtagText = hashtags.length > 0 ? hashtags.join(' ') : '';
  const combinedCopy = [caption.trim(), hashtagText].filter(Boolean).join('\n\n');
  const xCombinedCopy = [caption.trim(), hashtags.slice(0, 3).join(' ')].filter(Boolean).join(' ');

  const resolvedMediaSrc =
    uploadedMediaUrl || (mediaChoice === 'launch' ? LAUNCH_VISUAL_URL : EDITORIAL_DESK_URL);
  const shouldShowMedia = Boolean(uploadedMediaUrl) || includeMedia;

  const toggle = (setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string) => {
    setter((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showLinkedIn = filter === 'all' || filter === 'LinkedIn';
  const showX = filter === 'all' || filter === 'X';
  const showInstagram = filter === 'all' || filter === 'Instagram';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Live Multi-Platform Previews
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time layout simulation across LinkedIn, X, and Instagram.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {(['all', 'LinkedIn', 'X', 'Instagram'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'all' ? 'All 3' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {showLinkedIn && (
          <article
            className={`rounded-xl border transition-colors bg-white/95 dark:bg-slate-900/70 backdrop-blur-md p-5 space-y-4 ${
              selectedPlatform === 'LinkedIn'
                ? 'border-indigo-500/60 dark:border-indigo-500/50'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-sky-600 dark:text-sky-400">LinkedIn</span>
                <span aria-hidden="true">·</span>
                <span>Feed Post</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CharacterCount count={combinedCopy.length} limit={PLATFORM_LIMITS.LinkedIn} />
                <button
                  type="button"
                  onClick={() => onSchedulePlatform('LinkedIn')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AvatarImage src={profile.avatarUrl} name={profile.displayName} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {profile.displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {profile.headline}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Just now · Edited
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line break-words leading-relaxed">
              {caption || 'Your tailored LinkedIn copy will render here in real time as you type or generate.'}
              {hashtags.length > 0 && (
                <p className="mt-3 text-indigo-600 dark:text-indigo-400 font-medium break-words">
                  {hashtags.join(' ')}
                </p>
              )}
            </div>

            {shouldShowMedia && (
              <MediaPreviewBlock
                src={resolvedMediaSrc}
                alt="LinkedIn post media preview"
                aspectClass="aspect-video"
              />
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => toggle(setLiked, 'li')}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors cursor-pointer ${
                  liked.li
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="tabular-nums">{liked.li ? '143' : '142'}</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="tabular-nums">18 Comments</span>
              </button>
              <button
                type="button"
                onClick={() => toggle(setReposted, 'li')}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors cursor-pointer ${
                  reposted.li
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Repeat2 className="w-3.5 h-3.5" />
                <span className="tabular-nums">{reposted.li ? '25' : '24'} Reposts</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </div>
          </article>
        )}

        {showX && (
          <article
            className={`rounded-xl border transition-colors bg-white/95 dark:bg-slate-900/70 backdrop-blur-md p-5 space-y-4 ${
              selectedPlatform === 'X'
                ? 'border-indigo-500/60 dark:border-indigo-500/50'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">X / Twitter</span>
                <span aria-hidden="true">·</span>
                <span>Single Post</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CharacterCount count={xCombinedCopy.length} limit={PLATFORM_LIMITS.X} />
                <button
                  type="button"
                  onClick={() => onSchedulePlatform('X')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AvatarImage src={profile.avatarUrl} name={profile.displayName} />
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white truncate">
                    {profile.displayName}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 truncate">
                    {profile.handle}
                  </span>
                  <span className="text-slate-400" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-slate-400 text-xs shrink-0">1m</span>
                </div>

                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line break-words leading-relaxed">
                  {caption || 'Your concise X post copy will update live here.'}
                  {hashtags.length > 0 && (
                    <span className="text-indigo-600 dark:text-indigo-400 break-words">
                      {' '}
                      {hashtags.slice(0, 3).join(' ')}
                    </span>
                  )}
                </p>

                {xCombinedCopy.length > PLATFORM_LIMITS.X && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    Exceeds 280 characters by {xCombinedCopy.length - PLATFORM_LIMITS.X} chars — trim copy or switch to X-tuned caption.
                  </p>
                )}

                {shouldShowMedia && (
                  <MediaPreviewBlock
                    src={resolvedMediaSrc}
                    alt="X post media preview"
                    aspectClass="aspect-video"
                  />
                )}

                <div className="pt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 hover:text-sky-500 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="tabular-nums">12</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(setReposted, 'x')}
                    className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      reposted.x ? 'text-emerald-500' : 'hover:text-emerald-500'
                    }`}
                  >
                    <Repeat2 className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{reposted.x ? '39' : '38'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(setLiked, 'x')}
                    className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      liked.x ? 'text-rose-500' : 'hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${liked.x ? 'fill-current' : ''}`} />
                    <span className="tabular-nums">{liked.x ? '215' : '214'}</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}

        {showInstagram && (
          <article
            className={`rounded-xl border transition-colors bg-white/95 dark:bg-slate-900/70 backdrop-blur-md p-5 space-y-4 ${
              selectedPlatform === 'Instagram'
                ? 'border-indigo-500/60 dark:border-indigo-500/50'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">Instagram</span>
                <span aria-hidden="true">·</span>
                <span>Visual Card</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <CharacterCount count={combinedCopy.length} limit={PLATFORM_LIMITS.Instagram} />
                <button
                  type="button"
                  onClick={() => onSchedulePlatform('Instagram')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Schedule</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AvatarImage src={profile.avatarUrl} name={profile.displayName} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {profile.handle.replace(/^@/, '')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    San Francisco · Studio Edition
                  </p>
                </div>
              </div>
            </div>

            <MediaPreviewBlock
              src={resolvedMediaSrc}
              alt="Instagram feed post visual"
              aspectClass="aspect-[4/3]"
            />

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => toggle(setLiked, 'ig')}
                  aria-label="Like Instagram preview"
                  className={`cursor-pointer transition-colors ${liked.ig ? 'text-rose-500' : 'hover:text-rose-500'}`}
                >
                  <Heart className={`w-5 h-5 ${liked.ig ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  aria-label="Comment on Instagram preview"
                  className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Share Instagram preview"
                  className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggle(setSaved, 'ig')}
                aria-label="Bookmark Instagram preview"
                className={`cursor-pointer transition-colors ${saved.ig ? 'text-indigo-500' : 'hover:text-indigo-500'}`}
              >
                <Bookmark className={`w-5 h-5 ${saved.ig ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line break-words">
              <span className="font-semibold mr-1.5">{profile.handle.replace(/^@/, '')}</span>
              {caption || 'Your Instagram story caption and hashtags will preview here.'}
              {hashtags.length > 0 && (
                <p className="mt-2 text-indigo-600 dark:text-indigo-400 text-xs font-medium break-words">
                  {hashtags.join(' ')}
                </p>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
