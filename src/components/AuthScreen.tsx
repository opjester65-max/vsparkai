import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { JUDGE_DEMO_EMAIL, JUDGE_DEMO_PASSWORD } from '../lib/supabase';
import { LAUNCH_VISUAL_URL } from '../lib/studioData';

export function AuthScreen() {
  const { signIn, signUp, quickJudgeLogin, isSupabaseConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNoticeMsg(null);
    setSubmitting(true);

    try {
      const response =
        mode === 'signin'
          ? await signIn(email, password)
          : await signUp(email, password, fullName);

      if (response.error) {
        setErrorMsg(response.error);
      } else if (response.notice) {
        setNoticeMsg(response.notice);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJudgeQuickLogin = async () => {
    setErrorMsg(null);
    setNoticeMsg(null);
    setMode('signin');
    setEmail(JUDGE_DEMO_EMAIL);
    setPassword(JUDGE_DEMO_PASSWORD);
    setDemoLoading(true);

    try {
      const response = await quickJudgeLogin();
      if (response.error) {
        setErrorMsg(response.error);
      }
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 studio-grid-bg flex flex-col">
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-8">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
          Vspark Studio
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
          <span>VSPARK 2026</span>
          <span aria-hidden="true">·</span>
          <span>{isSupabaseConfigured ? 'Supabase Auth Connected' : 'Local Studio Auth Ready'}</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 space-y-6"
        >
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-indigo-600 dark:text-indigo-400">
              AI Content Engine &amp; Multi-Platform Studio
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] [text-wrap:balance]">
              Turn one product brief into platform-ready social campaigns.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Generate tailored captions, viral hashtag sets, and peak posting windows powered by Gemini 2.5 Flash, then inspect live LinkedIn, X, and Instagram mockups before scheduling.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video relative">
            {!imgError ? (
              <img
                src={LAUNCH_VISUAL_URL}
                alt="Minimalist frosted architectural glass panels representing Vspark Studio content engineering"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6 text-sm text-slate-300">
                Vspark Studio Multi-Platform Workspace
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-5">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                <span>3 Tailored Captions</span>
                <span aria-hidden="true">·</span>
                <span>Live LinkedIn, X &amp; Instagram Previews</span>
                <span aria-hidden="true">·</span>
                <span>1-Click Queue Scheduling</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 w-full max-w-md mx-auto lg:ml-auto"
        >
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/75 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-950/5 dark:shadow-black/40 space-y-6">
            <div className="space-y-1.5">
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                {mode === 'signin' ? 'Sign in to Vspark Studio' : 'Create your studio account'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Access the AI Content Generator, Live Previews, and Scheduled Feed.
              </p>
            </div>

            <button
              type="button"
              onClick={handleJudgeQuickLogin}
              disabled={demoLoading || submitting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-600/25 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">
                {demoLoading ? 'Signing in Judge Demo...' : '⚡ Judge Demo Auto-Fill / Quick Login'}
              </span>
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span>or continue with email</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setNoticeMsg(null);
                }}
                className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setNoticeMsg(null);
                }}
                className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-lg border border-rose-300 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300"
              >
                {errorMsg}
              </div>
            )}

            {noticeMsg && (
              <div className="rounded-lg border border-indigo-300 dark:border-indigo-900/70 bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-2.5 text-xs text-indigo-700 dark:text-indigo-300">
                {noticeMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aarav Mehta"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="judge@vspark2026.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || demoLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <span>
                  {submitting
                    ? mode === 'signin'
                      ? 'Signing in...'
                      : 'Creating account...'
                    : mode === 'signin'
                      ? 'Sign In'
                      : 'Create Account'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Demo credentials</span>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                {JUDGE_DEMO_EMAIL}
              </span>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
