import { useEffect, useState } from 'react';
import { Check, Copy, Download, FileCode2, X } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { isEmailJsConfigured } from '../lib/notificationService';
import { getDriveWebhookUrl } from '../lib/driveSyncService';
import { useToast } from '../context/ToastContext';
import { BrandLogo3D } from './BrandLogo3D';

interface SubmissionArchitectureModalProps {
  onClose: () => void;
  postCount: number;
}

interface StudentRegistration {
  teamName: string;
  leadStudent: string;
  registrationId: string;
  institution: string;
  track: string;
}

const REG_STORAGE_KEY = 'vspark_student_registration_v1';

const DEFAULT_REGISTRATION: StudentRegistration = {
  teamName: 'Vspark Studio Builders',
  leadStudent: 'Aarav Mehta',
  registrationId: 'VSPARK-2026-0412',
  institution: 'Institute of Engineering & Technology',
  track: 'AI & Full-Stack SaaS',
};

function readRegistration(): StudentRegistration {
  try {
    const raw = localStorage.getItem(REG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_REGISTRATION, ...(JSON.parse(raw) as Partial<StudentRegistration>) };
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_REGISTRATION;
}

export function SubmissionArchitectureModal({
  onClose,
  postCount,
}: SubmissionArchitectureModalProps) {
  const { pushToast } = useToast();
  const [registration, setRegistration] = useState<StudentRegistration>(readRegistration);
  const [docTab, setDocTab] = useState<'readme' | 'env'>('readme');
  const [serverHealth, setServerHealth] = useState<{
    loading: boolean;
    ok: boolean;
    geminiConfigured: boolean;
  }>({ loading: true, ok: false, geminiConfigured: false });
  const [copiedDoc, setCopiedDoc] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(REG_STORAGE_KEY, JSON.stringify(registration));
    } catch {
      // Ignore storage write errors
    }
  }, [registration]);

  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: { ok?: boolean; geminiConfigured?: boolean }) => {
        if (active) {
          setServerHealth({
            loading: false,
            ok: Boolean(data.ok),
            geminiConfigured: Boolean(data.geminiConfigured),
          });
        }
      })
      .catch(() => {
        if (active) {
          setServerHealth({ loading: false, ok: false, geminiConfigured: false });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const generatedReadme = `# Vspark Studio — AI Social Media Content Generator & Scheduler

> **VSPARK 2026 Web Development Competition Submission**

## Team Details
- **Team Name:** ${registration.teamName}
- **Team Members / Lead:** ${registration.leadStudent}
- **Registration Numbers:** ${registration.registrationId}
- **Institution:** ${registration.institution}
- **Competition Track:** ${registration.track}
- **Google Drive Folder:** \`vspark-folder\`

## System Architecture

\`\`\`
Client (React 19 + Vite + Tailwind v4)
  ├── Supabase Auth + PostgreSQL (scheduled_posts) + Storage (post-media)
  ├── Express API Proxy (/api/gemini/generate) -> @google/genai (gemini-2.5-flash)
  ├── Live Multi-Platform Previews (LinkedIn, X/Twitter, Instagram)
  ├── Google Drive Sync & Export (vspark-folder JSON/CSV Bundle)
  └── Customizable Email Reminders (EmailJS REST API / Webhook)
\`\`\`

## Process Screenshots
- ![Login & Auth](screenshots/1-auth.png)
- ![Gemini AI Generator](screenshots/2-ai-generator.png)
- ![Supabase Media Upload](screenshots/3-cloud-storage.png)
- ![Scheduled Posts CRUD](screenshots/4-crud-dashboard.png)
- ![Live Vercel Deployment](screenshots/5-live-deployment.png)
`;

  const generatedEnvExample = `GEMINI_API_KEY=
APP_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
VITE_GOOGLE_DRIVE_WEBHOOK_URL=
`;

  const activeDocText = docTab === 'readme' ? generatedReadme : generatedEnvExample;
  const activeFilename = docTab === 'readme' ? 'README.md' : '.env.example';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeDocText);
      setCopiedDoc(docTab);
      pushToast(`Copied ${activeFilename} to clipboard.`, 'success');
      setTimeout(() => setCopiedDoc(null), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  const handleDownload = () => {
    const blob = new Blob([activeDocText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushToast(`Generated and downloaded ${activeFilename}.`, 'success');
  };

  const statusItems = [
    {
      label: 'Express & Gemini Engine',
      value: serverHealth.loading
        ? 'Checking...'
        : serverHealth.geminiConfigured
          ? 'Connected (gemini-2.5-flash)'
          : 'Resilient Fallback Ready',
      ok: serverHealth.ok,
    },
    {
      label: 'Supabase Auth & PostgreSQL',
      value: isSupabaseConfigured ? 'Connected' : 'Hybrid Demo Fallback Active',
      ok: true,
    },
    {
      label: 'Drive Sync Pipeline',
      value: getDriveWebhookUrl() ? 'Webhook + Bundle Ready' : 'vspark-folder JSON/CSV Ready',
      ok: true,
    },
    {
      label: 'Email Reminder Dispatcher',
      value: isEmailJsConfigured() ? 'EmailJS Live API' : 'Studio Webhook Active',
      ok: true,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-arch-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-auto">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo3D size="sm" />
            <div className="min-w-0">
              <h2
                id="submission-arch-title"
                className="font-display text-base font-semibold text-slate-900 dark:text-white truncate"
              >
                Submission &amp; Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                VSPARK 2026 live readiness, student registration, and 1-click documentation generator.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close submission modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Live System Status
              </h3>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {postCount} queued posts
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {statusItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1"
                >
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p
                    className={`text-xs font-semibold ${
                      item.ok
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              VSPARK 2026 Student Registration Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Team Name
                </label>
                <input
                  type="text"
                  value={registration.teamName}
                  onChange={(e) =>
                    setRegistration((prev) => ({ ...prev, teamName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Lead Student
                </label>
                <input
                  type="text"
                  value={registration.leadStudent}
                  onChange={(e) =>
                    setRegistration((prev) => ({ ...prev, leadStudent: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Registration ID
                </label>
                <input
                  type="text"
                  value={registration.registrationId}
                  onChange={(e) =>
                    setRegistration((prev) => ({ ...prev, registrationId: e.target.value }))
                  }
                  className="w-full font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Institution
                </label>
                <input
                  type="text"
                  value={registration.institution}
                  onChange={(e) =>
                    setRegistration((prev) => ({ ...prev, institution: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Competition Track
                </label>
                <input
                  type="text"
                  value={registration.track}
                  onChange={(e) =>
                    setRegistration((prev) => ({ ...prev, track: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-500" />
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  1-Click Documentation Generator
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDocTab('readme')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      docTab === 'readme'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    README.md
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocTab('env')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      docTab === 'env'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    .env.example
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {copiedDoc === docTab ? (
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

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Generate {activeFilename}</span>
                </button>
              </div>
            </div>

            <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto max-h-60 leading-relaxed">
              {activeDocText}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
