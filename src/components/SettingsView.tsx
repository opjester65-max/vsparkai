import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Check,
  HardDriveUpload,
  MailCheck,
  Moon,
  Send,
  Server,
  Sun,
} from 'lucide-react';
import type {
  AuthUser,
  CreatorProfile,
  ScheduledPost,
  ThemeMode,
} from '../types/studio';
import {
  interpolateSubjectTemplate,
  isEmailJsConfigured,
  readEmailDispatchLogs,
  readEmailSettings,
  saveEmailSettings,
  sendTestEmailReminder,
  type AlertTimingOption,
  type EmailDispatchLogEntry,
  type EmailNotificationSettings,
} from '../lib/notificationService';
import {
  DRIVE_FOLDER_NAME,
  readDriveSyncLogs,
  syncPostsToGoogleDrive,
  type DriveExportFormat,
  type DriveSyncLogEntry,
} from '../lib/driveSyncService';
import { useToast } from '../context/ToastContext';

interface SettingsViewProps {
  user: AuthUser;
  posts: ScheduledPost[];
  isSupabaseConfigured: boolean;
  theme: ThemeMode;
  onThemeChange: (next: ThemeMode) => void;
  profile: CreatorProfile;
  onProfileUpdate: (next: CreatorProfile) => void;
  onOpenArchitecture: () => void;
  onSignOut: () => void;
}

const TIMING_OPTIONS: AlertTimingOption[] = [
  '15 mins before',
  '1 hour before',
  'Exact time',
];

export function SettingsView({
  user,
  posts,
  isSupabaseConfigured,
  theme,
  onThemeChange,
  profile,
  onProfileUpdate,
  onOpenArchitecture,
  onSignOut,
}: SettingsViewProps) {
  const { pushToast } = useToast();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [headline, setHeadline] = useState(profile.headline);
  const [profileSaved, setProfileSaved] = useState(false);

  const [emailSettings, setEmailSettings] = useState<EmailNotificationSettings>(() =>
    readEmailSettings(user.id, user.email)
  );
  const [emailSaved, setEmailSaved] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailToast, setEmailToast] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [dispatchLogs, setDispatchLogs] = useState<EmailDispatchLogEntry[]>(() =>
    readEmailDispatchLogs()
  );

  const [driveFormat, setDriveFormat] = useState<DriveExportFormat>('both');
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [driveToast, setDriveToast] = useState<string | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveLogs, setDriveLogs] = useState<DriveSyncLogEntry[]>(() =>
    readDriveSyncLogs()
  );

  const handleSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    onProfileUpdate({
      ...profile,
      displayName: displayName.trim() || profile.displayName,
      handle: handle.trim().startsWith('@')
        ? handle.trim()
        : `@${handle.trim() || 'creator'}`,
      headline: headline.trim() || profile.headline,
    });
    setProfileSaved(true);
    pushToast('Updated creator preview identity.', 'success');
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSaveEmailSettings = (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    saveEmailSettings(user.id, emailSettings);
    setEmailSaved(true);
    pushToast('Saved email notification rules.', 'success');
    setTimeout(() => setEmailSaved(false), 2000);
  };

  const handleSendTestEmail = async () => {
    setEmailError(null);
    setEmailToast(null);
    setTestingEmail(true);
    saveEmailSettings(user.id, emailSettings);

    try {
      const { entry, logs } = await sendTestEmailReminder({
        settings: emailSettings,
        platform: 'LinkedIn',
        previewText:
          posts[0]?.caption ||
          'Your scheduled multi-platform campaign is ready to go live.',
      });
      setDispatchLogs(logs);
      const msg = `Test reminder sent to ${entry.recipientEmail} via ${entry.channel === 'emailjs' ? 'EmailJS' : 'Studio Webhook'}.`;
      setEmailToast(msg);
      pushToast(msg, 'success');
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : 'Failed to dispatch test email.'
      );
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSyncDriveAll = async () => {
    setDriveError(null);
    setDriveToast(null);
    setSyncingDrive(true);

    try {
      const { entry, logs } = await syncPostsToGoogleDrive({
        posts,
        userEmail: user.email,
        format: driveFormat,
      });
      setDriveLogs(logs);
      const msg = `${entry.statusLabel} · Just now (${entry.postCount} posts · ${entry.format.toUpperCase()}).`;
      setDriveToast(msg);
      pushToast(msg, 'success');
    } catch (err) {
      setDriveError(
        err instanceof Error ? err.message : 'Failed to sync posts to Drive.'
      );
    } finally {
      setSyncingDrive(false);
    }
  };

  const previewSubject = interpolateSubjectTemplate(
    emailSettings.subjectTemplate,
    'LinkedIn',
    emailSettings.alertTiming
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            Workspace Preferences &amp; Integrations
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure email reminders, Google Drive sync exports, preview identity, and studio appearance.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenArchitecture}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-indigo-500/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Server className="w-3.5 h-3.5 text-indigo-500" />
          <span>Submission &amp; Architecture</span>
        </button>
      </div>

      {/* Customizable Email Notifications Panel */}
      <form
        onSubmit={handleSaveEmailSettings}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 p-6 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Email Notification Reminders
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize recipient address, reminder lead time, and subject template ({isEmailJsConfigured() ? 'EmailJS Live API Connected' : 'Studio Webhook + Browser Alert Ready'}).
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={emailSettings.enabled}
              onChange={(e) =>
                setEmailSettings((prev) => ({ ...prev, enabled: e.target.checked }))
              }
              className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Alerts Enabled</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="notify-recipient"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Recipient Email Address
            </label>
            <input
              id="notify-recipient"
              type="email"
              required
              value={emailSettings.recipientEmail}
              onChange={(e) =>
                setEmailSettings((prev) => ({
                  ...prev,
                  recipientEmail: e.target.value,
                }))
              }
              placeholder="creator@vspark2026.com"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Alert Timing
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {TIMING_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    setEmailSettings((prev) => ({ ...prev, alertTiming: opt }))
                  }
                  className={`py-1.5 px-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    emailSettings.alertTiming === opt
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="notify-subject-template"
              className="text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Custom Subject Template
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Tokens: [Platform] · [Time] · [Status]
            </span>
          </div>
          <input
            id="notify-subject-template"
            type="text"
            value={emailSettings.subjectTemplate}
            onChange={(e) =>
              setEmailSettings((prev) => ({
                ...prev,
                subjectTemplate: e.target.value,
              }))
            }
            placeholder="Reminder: Your [Platform] post goes live!"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preview: <span className="font-medium text-slate-800 dark:text-slate-200">{previewSubject}</span>
          </p>
        </div>

        {emailError && (
          <div
            role="alert"
            className="rounded-lg border border-rose-300 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300"
          >
            {emailError}
          </div>
        )}

        {emailToast && (
          <div
            role="status"
            className="rounded-lg border border-emerald-300 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            <MailCheck className="w-4 h-4 shrink-0" />
            <span>{emailToast}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Save Notification Rules</span>
          </button>

          <button
            type="button"
            disabled={testingEmail}
            onClick={() => void handleSendTestEmail()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {testingEmail ? 'Dispatching...' : 'Send Test Email Reminder'}
            </span>
          </button>

          {emailSaved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>

        {dispatchLogs.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Recent Dispatch Log
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {dispatchLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {log.subject} · <span className="text-slate-500">{log.recipientEmail}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {new Date(log.dispatchedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Google Drive Sync & Export Panel */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HardDriveUpload className="w-4 h-4 text-indigo-500" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Google Drive Sync &amp; Export ({DRIVE_FOLDER_NAME})
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Package your {posts.length} scheduled posts into sync-ready JSON and CSV bundles for {DRIVE_FOLDER_NAME}.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            {(['json', 'csv', 'both'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setDriveFormat(fmt)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md uppercase transition-colors cursor-pointer ${
                  driveFormat === fmt
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {driveError && (
          <div
            role="alert"
            className="rounded-lg border border-rose-300 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300"
          >
            {driveError}
          </div>
        )}

        {driveToast && (
          <div
            role="status"
            className="rounded-lg border border-emerald-300 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-300"
          >
            {driveToast}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={syncingDrive}
            onClick={() => void handleSyncDriveAll()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            <HardDriveUpload className="w-3.5 h-3.5" />
            <span>
              {syncingDrive
                ? 'Packaging Bundle...'
                : `Sync All to Drive (${DRIVE_FOLDER_NAME})`}
            </span>
          </button>

          {driveLogs[0] && (
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
              {driveLogs[0].statusLabel} · {new Date(driveLogs[0].syncedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {driveLogs.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Sync Timestamp History
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {driveLogs.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className="py-1.5 flex items-center justify-between gap-2 text-xs"
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {entry.statusLabel} · {entry.postCount} posts ({entry.format.toUpperCase()})
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {new Date(entry.syncedAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Studio Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Switch between Vercel-style dark slate and crisp light studio mode.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-600 text-white'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark Studio</span>
          </button>

          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-600 text-white'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light Studio</span>
          </button>
        </div>
      </section>

      {/* Creator Profile for Live Previews */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 p-6 space-y-4"
      >
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Live Preview Identity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customize the author name, handle, and headline rendered in LinkedIn, X, and Instagram preview cards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-handle"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Social Handle
            </label>
            <input
              id="profile-handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="profile-headline"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            LinkedIn Headline
          </label>
          <input
            id="profile-headline"
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Save Preview Identity</span>
          </button>
          {profileSaved && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              Updated
            </span>
          )}
        </div>
      </form>

      {/* Account Session */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/70 p-6 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Authentication Session
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active account protected via {isSupabaseConfigured ? 'Supabase Auth' : 'Studio Auth Session'}.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Signed-in Email</p>
            <p className="font-mono text-slate-900 dark:text-white mt-0.5">{user.email}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Session Mode</p>
            <p className="text-slate-900 dark:text-white mt-0.5">
              {user.provider === 'supabase' ? 'Supabase Verified Session' : 'Judge Demo / Local Session'}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2 rounded-lg border border-rose-300 dark:border-rose-900/70 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            Sign Out of Studio
          </button>
        </div>
      </section>
    </motion.div>
  );
}
