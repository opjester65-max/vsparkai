import { useState, type FormEvent } from 'react';
import { Bell, X } from 'lucide-react';
import type {
  PlatformOption,
  PostStatus,
  ScheduledPost,
  UpdateScheduledPostInput,
} from '../types/studio';
import { MediaUploadZone } from './MediaUploadZone';

interface EditPostModalProps {
  post: ScheduledPost;
  onClose: () => void;
  onSave: (postId: string, updates: UpdateScheduledPostInput) => Promise<void>;
}

const PLATFORMS: PlatformOption[] = ['LinkedIn', 'X', 'Instagram', 'Facebook'];
const STATUSES: PostStatus[] = ['Scheduled', 'Published', 'Draft'];

function toLocalDateTimeInput(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString.slice(0, 16);
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EditPostModal({ post, onClose, onSave }: EditPostModalProps) {
  const [platform, setPlatform] = useState<PlatformOption>(post.platform);
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [caption, setCaption] = useState(post.caption);
  const [hashtagsText, setHashtagsText] = useState(post.hashtags.join(' '));
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTimeInput(post.scheduledAt));
  const [mediaUrl, setMediaUrl] = useState<string | null>(post.mediaUrl);
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState(
    post.notifyBeforeMinutes
  );
  const [notifyEmail, setNotifyEmail] = useState(post.notifyEmail);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!caption.trim()) {
      setErrorMsg('Caption cannot be empty.');
      return;
    }

    const parsedHashtags = hashtagsText
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    setSaving(true);
    try {
      await onSave(post.id, {
        platform,
        status,
        caption: caption.trim(),
        hashtags: parsedHashtags,
        scheduledAt: new Date(scheduledAt).toISOString(),
        mediaUrl,
        notifyBeforeMinutes,
        notifyEmail,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-post-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2
              id="edit-post-title"
              className="font-display text-base font-semibold text-slate-900 dark:text-white"
            >
              Edit Scheduled Post
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update copy, target channel, media attachment, or publish window.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-rose-300 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300"
            >
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Platform
              </span>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {PLATFORMS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPlatform(item)}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      platform === item
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {STATUSES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setStatus(item)}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      status === item
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-caption"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Caption
              </label>
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                {caption.length} chars
              </span>
            </div>
            <textarea
              id="edit-caption"
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-y"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-hashtags"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Hashtags
            </label>
            <input
              id="edit-hashtags"
              type="text"
              value={hashtagsText}
              onChange={(e) => setHashtagsText(e.target.value)}
              placeholder="#SaaSGrowth #BuildInPublic"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="edit-scheduled-at"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Scheduled Timestamp
              </label>
              <input
                id="edit-scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="w-full font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-notify-lead"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Bell className="w-3.5 h-3.5 text-indigo-500" />
                <span>Reminder Lead Time</span>
              </label>
              <select
                id="edit-notify-lead"
                value={notifyBeforeMinutes}
                onChange={(e) => setNotifyBeforeMinutes(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value={0}>No reminder</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Send email &amp; browser dispatch reminder before scheduled slot</span>
          </label>

          <MediaUploadZone
            mediaUrl={mediaUrl}
            onMediaChange={setMediaUrl}
            compact
          />

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
