import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  CalendarPlus,
  Check,
  Clock,
  Copy,
  Hash,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type {
  CreateScheduledPostInput,
  CreatorProfile,
  GenerationResult,
  NavTab,
  PlatformOption,
  ToneOption,
} from '../types/studio';
import {
  EDITORIAL_DESK_URL,
  LAUNCH_VISUAL_URL,
  PROMPT_STARTERS,
} from '../lib/studioData';
import { PlatformPreviews } from './PlatformPreviews';
import { MediaUploadZone } from './MediaUploadZone';

interface AiGeneratorViewProps {
  profile: CreatorProfile;
  initialDraft?: {
    topic: string;
    tone: ToneOption;
    platform: PlatformOption;
  } | null;
  onSchedulePost: (post: CreateScheduledPostInput) => Promise<void>;
  onNavigate: (tab: NavTab) => void;
}

const TONES: ToneOption[] = ['Professional', 'Casual', 'Viral', 'Educational'];
const PLATFORMS: PlatformOption[] = ['LinkedIn', 'X', 'Instagram', 'Facebook'];

function getDefaultScheduleDateTime(): string {
  const next = new Date(Date.now() + 24 * 60 * 60 * 1000);
  next.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

export function AiGeneratorView({
  profile,
  initialDraft,
  onSchedulePost,
  onNavigate,
}: AiGeneratorViewProps) {
  const [topic, setTopic] = useState(
    initialDraft?.topic ||
      'Launching Vspark Studio 2.0: an AI-native publishing workspace that turns one product brief into platform-calibrated LinkedIn, X, and Instagram campaigns.'
  );
  const [tone, setTone] = useState<ToneOption>(initialDraft?.tone || 'Professional');
  const [platform, setPlatform] = useState<PlatformOption>(initialDraft?.platform || 'LinkedIn');

  const [generating, setGenerating] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const [selectedCaptionIndex, setSelectedCaptionIndex] = useState(0);
  const [editableCaption, setEditableCaption] = useState(
    'Launching Vspark Studio 2.0 today.\n\nInstead of rewriting the same announcement four times, teams can draft one core brief and preview live LinkedIn, X, and Instagram layouts before scheduling.'
  );
  const [activeHashtags, setActiveHashtags] = useState<string[]>([
    '#SaaSLaunch',
    '#ProductEngineering',
    '#ContentStudio',
    '#BuildInPublic',
  ]);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [mediaChoice, setMediaChoice] = useState<'launch' | 'desk'>('launch');
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState(getDefaultScheduleDateTime);
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState(30);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scheduleConfirmation, setScheduleConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (initialDraft) {
      setTopic(initialDraft.topic);
      setTone(initialDraft.tone);
      setPlatform(initialDraft.platform);
    }
  }, [initialDraft]);

  const handleGenerate = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setScheduleConfirmation(null);

    if (topic.trim().length < 3) {
      setErrorMsg('Please describe your topic or campaign prompt (at least 3 characters).');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          tone,
          platform,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to generate content with Gemini AI.');
      }

      const generated = payload as GenerationResult;
      setResult(generated);
      setSelectedCaptionIndex(0);

      if (generated.captions.length > 0) {
        setEditableCaption(generated.captions[0].text);
      }
      if (generated.hashtags.length > 0) {
        setActiveHashtags(generated.hashtags);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error calling Gemini AI service.';
      setErrorMsg(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectCaption = (idx: number) => {
    setSelectedCaptionIndex(idx);
    if (result?.captions[idx]) {
      setEditableCaption(result.captions[idx].text);
    }
  };

  const toggleHashtag = (tag: string) => {
    setActiveHashtags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard blocked in restricted iframe context
    }
  };

  const triggerSchedule = async (targetPlatform: PlatformOption = platform) => {
    const cleanCaption = editableCaption.trim();
    if (!cleanCaption) {
      setErrorMsg('Caption cannot be empty when scheduling a post.');
      return;
    }

    setErrorMsg(null);
    setScheduling(true);

    const resolvedMedia =
      uploadedMediaUrl ||
      (includeMedia
        ? mediaChoice === 'launch'
          ? LAUNCH_VISUAL_URL
          : EDITORIAL_DESK_URL
        : null);

    try {
      await onSchedulePost({
        platform: targetPlatform,
        topic: topic.trim(),
        caption: cleanCaption,
        hashtags: activeHashtags,
        scheduledAt: new Date(scheduledFor).toISOString(),
        status: 'Scheduled',
        engagementScore: result?.engagementScore ?? 90,
        tone,
        mediaUrl: resolvedMedia,
        notifyBeforeMinutes,
        notifyEmail,
      });

      setScheduleConfirmation(
        `Scheduled for ${targetPlatform} at ${scheduledFor.replace('T', ' ')}.`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to save scheduled post.'
      );
    } finally {
      setScheduling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Google Gemini 2.5 Flash Engine
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            AI Content Generator &amp; Live Previews
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PROMPT_STARTERS.map((starter) => (
            <button
              key={starter.label}
              type="button"
              onClick={() => {
                setTopic(starter.topic);
                setTone(starter.tone);
                setPlatform(starter.platform);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-500/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              {starter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-6 space-y-6">
          <form
            onSubmit={handleGenerate}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="ai-topic"
                  className="text-sm font-semibold text-slate-900 dark:text-white"
                >
                  Topic or Campaign Brief
                </label>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {topic.length} chars
                </span>
              </div>
              <textarea
                id="ai-topic"
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe your product announcement, key insight, or story..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-y"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tone of Voice
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {TONES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTone(item)}
                    className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      tone === item
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Primary Target Platform
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {PLATFORMS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPlatform(item)}
                    className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      platform === item
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIncludeMedia((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    includeMedia || uploadedMediaUrl
                      ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>
                    {uploadedMediaUrl
                      ? 'Custom Upload'
                      : includeMedia
                        ? 'Preset Media'
                        : 'Text Only'}
                  </span>
                </button>

                {includeMedia && !uploadedMediaUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setMediaChoice((prev) => (prev === 'launch' ? 'desk' : 'launch'))
                    }
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Visual: {mediaChoice === 'launch' ? 'Prism Glass' : 'Studio Desk'}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={generating}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 shadow-sm shadow-indigo-600/25 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                <span>{generating ? 'Generating with Gemini...' : 'Generate Content'}</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-rose-300 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 p-4 flex items-start justify-between gap-4 text-sm text-rose-700 dark:text-rose-300"
            >
              <p>{errorMsg}</p>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="inline-flex items-center gap-1 text-xs font-semibold underline shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {generating && (
            <div
              aria-busy="true"
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-16 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="h-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="h-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
          )}

          {!generating && result && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Engagement Score</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {result.engagementScore}/100
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {result.engagementRationale}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Best Posting Time</span>
                  </div>
                  <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white tabular-nums">
                    {result.bestPostingTime}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {result.bestPostingReason}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                    3 Tailored Captions
                  </h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Click any option to load into live previews
                  </span>
                </div>

                <div className="space-y-2.5">
                  {result.captions.map((item, idx) => {
                    const isSelected = selectedCaptionIndex === idx;
                    return (
                      <div
                        key={item.id || idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectCaption(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectCaption(idx);
                          }
                        }}
                        className={`rounded-lg border p-4 transition-colors cursor-pointer space-y-2 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            0{idx + 1}. {item.angle}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleCopy(item.text, `cap-${idx}`);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                          >
                            {copiedId === `cap-${idx}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                    <Hash className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Viral Hashtags</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopy(activeHashtags.join(' '), 'hashtags')}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  >
                    {copiedId === 'hashtags' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Active</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map((tag) => {
                    const active = activeHashtags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleHashtag(tag)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Live Caption Editor, Cloud Storage Media Upload & Schedule Bar */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 backdrop-blur-md p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="live-caption-editor"
                className="text-sm font-semibold text-slate-900 dark:text-white"
              >
                Composer &amp; Schedule Settings
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Syncs live to LinkedIn, X &amp; Instagram
              </span>
            </div>

            <textarea
              id="live-caption-editor"
              rows={4}
              value={editableCaption}
              onChange={(e) => setEditableCaption(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 resize-y"
            />

            <MediaUploadZone
              mediaUrl={uploadedMediaUrl}
              onMediaChange={setUploadedMediaUrl}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label
                  htmlFor="schedule-datetime"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Schedule Timestamp
                </label>
                <input
                  id="schedule-datetime"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="notify-lead"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  <Bell className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Pre-Publish Alert</span>
                </label>
                <select
                  id="notify-lead"
                  value={notifyBeforeMinutes}
                  onChange={(e) => setNotifyBeforeMinutes(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value={0}>No reminder</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Email + push dispatch reminder</span>
              </label>

              <button
                type="button"
                disabled={scheduling}
                onClick={() => void triggerSchedule(platform)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>
                  {scheduling ? 'Saving...' : `Schedule This Post (${platform})`}
                </span>
              </button>
            </div>

            {scheduleConfirmation && (
              <div className="rounded-lg border border-emerald-300 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-emerald-700 dark:text-emerald-300">
                <span>{scheduleConfirmation}</span>
                <button
                  type="button"
                  onClick={() => onNavigate('feed')}
                  className="font-semibold underline whitespace-nowrap cursor-pointer"
                >
                  Open Scheduled Feed
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-6">
          <PlatformPreviews
            caption={editableCaption}
            hashtags={activeHashtags}
            profile={profile}
            selectedPlatform={platform}
            includeMedia={includeMedia}
            mediaChoice={mediaChoice}
            uploadedMediaUrl={uploadedMediaUrl}
            onSchedulePlatform={(target) => void triggerSchedule(target)}
          />
        </div>
      </div>
    </motion.div>
  );
}
