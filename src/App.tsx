import { useCallback, useEffect, useState } from 'react';
import { Moon, Server, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AiGeneratorView } from './components/AiGeneratorView';
import { ScheduledFeedView } from './components/ScheduledFeedView';
import { SettingsView } from './components/SettingsView';
import { SubmissionArchitectureModal } from './components/SubmissionArchitectureModal';
import { DEFAULT_PROFILE } from './lib/studioData';
import {
  createScheduledPost,
  deleteScheduledPost,
  fetchScheduledPosts,
  subscribeToScheduledPosts,
  updateScheduledPost,
} from './lib/postsService';
import type {
  CreateScheduledPostInput,
  CreatorProfile,
  NavTab,
  PlatformOption,
  ScheduledPost,
  ThemeMode,
  ToneOption,
  UpdateScheduledPostInput,
} from './types/studio';

const PROFILE_STORAGE_KEY = 'vspark_creator_profile_v1';
const THEME_STORAGE_KEY = 'vspark_theme';

function getInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light') return 'light';
  } catch {
    // Ignore storage read error
  }
  return 'dark';
}

function getInitialProfile(): CreatorProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<CreatorProfile>) };
    }
  } catch {
    // Ignore storage read error
  }
  return DEFAULT_PROFILE;
}

function StudioWorkspace() {
  const { user, signOut, isSupabaseConfigured } = useAuth();
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState<NavTab>('generator');
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile>(getInitialProfile);
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const [generatorDraft, setGeneratorDraft] = useState<{
    topic: string;
    tone: ToneOption;
    platform: PlatformOption;
  } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage write error
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage write error
    }
  }, [profile]);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      const result = await fetchScheduledPosts(user);
      setPosts(result.data);
      setSyncNotice(result.warning || null);
    } finally {
      setPostsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadPosts();
    const unsubscribe = subscribeToScheduledPosts(user, () => {
      void loadPosts();
    });
    return unsubscribe;
  }, [user, loadPosts]);

  const handleSchedulePost = async (input: CreateScheduledPostInput) => {
    if (!user) return;
    const result = await createScheduledPost(user, input);
    setPosts((prev) =>
      [result.data, ...prev].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
    );
    if (result.warning) {
      setSyncNotice(result.warning);
    }
  };

  const handleUpdatePost = async (id: string, updates: UpdateScheduledPostInput) => {
    if (!user) return;
    const result = await updateScheduledPost(user, id, updates);
    if (result.data) {
      setPosts((prev) =>
        prev
          .map((post) => (post.id === id ? result.data! : post))
          .sort(
            (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          )
      );
    }
    if (result.warning) {
      setSyncNotice(result.warning);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!user) return;
    const result = await deleteScheduledPost(user, id);
    setPosts((prev) => prev.filter((post) => post.id !== id));
    if (result.warning) {
      setSyncNotice(result.warning);
    }
  };

  const handleLaunchStarter = (
    topic: string,
    tone: ToneOption,
    platform: PlatformOption
  ) => {
    setGeneratorDraft({ topic, tone, platform });
    setActiveTab('generator');
  };

  const handleSignOut = async () => {
    await signOut();
    pushToast('Signed out of Vspark Studio.', 'info');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 studio-grid-bg flex flex-col overflow-x-hidden">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={() => void handleSignOut()}
      />

      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0 truncate">
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
            {user.email}
          </span>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap">
            {user.provider === 'supabase' ? 'Supabase Sync' : 'Demo Workspace'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setArchitectureOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-500/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-indigo-500" />
            <span>Submission &amp; Docs</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            posts={posts}
            loading={postsLoading}
            userName={user.name}
            onNavigate={setActiveTab}
            onLaunchStarter={handleLaunchStarter}
          />
        )}

        {activeTab === 'generator' && (
          <AiGeneratorView
            profile={profile}
            initialDraft={generatorDraft}
            onSchedulePost={handleSchedulePost}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'feed' && (
          <ScheduledFeedView
            user={user}
            posts={posts}
            loading={postsLoading}
            syncNotice={syncNotice}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            user={user}
            posts={posts}
            isSupabaseConfigured={isSupabaseConfigured}
            theme={theme}
            onThemeChange={setTheme}
            profile={profile}
            onProfileUpdate={setProfile}
            onOpenArchitecture={() => setArchitectureOpen(true)}
            onSignOut={() => void handleSignOut()}
          />
        )}
      </main>

      {architectureOpen && (
        <SubmissionArchitectureModal
          onClose={() => setArchitectureOpen(false)}
          postCount={posts.length}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ProtectedRoute>
            <StudioWorkspace />
          </ProtectedRoute>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
