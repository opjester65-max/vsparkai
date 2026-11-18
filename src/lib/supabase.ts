import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { AuthUser } from '../types/studio';

export const JUDGE_DEMO_EMAIL = 'judge@vspark2026.com';
export const JUDGE_DEMO_PASSWORD = 'Vspark2026!';

const DEMO_STORAGE_KEY = 'vspark_auth_session_v1';
const LOCAL_USERS_KEY = 'vspark_local_users_v1';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function isValidSupabaseConfig(url?: string, key?: string): boolean {
  if (!url || !key) return false;
  if (url.includes('your-project-id') || key.includes('your-supabase-anon-key')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = isValidSupabaseConfig(rawSupabaseUrl, rawSupabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawSupabaseUrl!, rawSupabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function mapSupabaseUser(user: User): AuthUser {
  const email = user.email || 'creator@vspark2026.com';
  const metaName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined);
  return {
    id: user.id,
    email,
    name: metaName || email.split('@')[0],
    provider: 'supabase',
    createdAt: user.created_at || new Date().toISOString(),
  };
}

function readStoredDemoUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistLocalSession(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota errors
  }
}

interface StoredLocalCredential {
  email: string;
  password: string;
  name: string;
  id: string;
  createdAt: string;
}

function getLocalUsers(): StoredLocalCredential[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredLocalCredential[]) : [];
  } catch {
    return [];
  }
}

function saveLocalUser(entry: StoredLocalCredential) {
  const existing = getLocalUsers().filter((u) => u.email.toLowerCase() !== entry.email.toLowerCase());
  existing.push(entry);
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage errors
  }
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
  notice?: string;
}

export async function getInitialAuthUser(): Promise<AuthUser | null> {
  if (supabase) {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.user) {
      return mapSupabaseUser(data.session.user);
    }
  }
  return readStoredDemoUser();
}

export function subscribeAuthState(callback: (user: AuthUser | null) => void): () => void {
  if (!supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
    if (session?.user) {
      const mapped = mapSupabaseUser(session.user);
      persistLocalSession(null);
      callback(mapped);
    } else {
      const demo = readStoredDemoUser();
      callback(demo);
    }
  });

  return () => {
    data.subscription.unsubscribe();
  };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { user: null, error: 'Email and password are required.' };
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) {
      return { user: null, error: error.message };
    }
    if (data.user) {
      const mapped = mapSupabaseUser(data.user);
      persistLocalSession(null);
      return { user: mapped, error: null };
    }
  }

  // Fallback local verification when Supabase project keys are not yet provisioned
  if (cleanEmail === JUDGE_DEMO_EMAIL && password === JUDGE_DEMO_PASSWORD) {
    const judgeUser: AuthUser = {
      id: 'judge-vspark-2026',
      email: JUDGE_DEMO_EMAIL,
      name: 'VSPARK Judge',
      provider: 'demo',
      createdAt: new Date().toISOString(),
    };
    persistLocalSession(judgeUser);
    return { user: judgeUser, error: null };
  }

  const localUser = getLocalUsers().find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );

  if (!localUser) {
    return {
      user: null,
      error: 'Invalid credentials. Create an account or use Judge Demo Quick Login.',
    };
  }

  const authUser: AuthUser = {
    id: localUser.id,
    email: localUser.email,
    name: localUser.name,
    provider: 'demo',
    createdAt: localUser.createdAt,
  };
  persistLocalSession(authUser);
  return { user: authUser, error: null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const displayName = (fullName || cleanEmail.split('@')[0] || 'Creator').trim();

  if (!cleanEmail || password.length < 6) {
    return {
      user: null,
      error: 'Enter a valid email and a password with at least 6 characters.',
    };
  }

  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: displayName,
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user && data.session) {
      const mapped = mapSupabaseUser(data.user);
      persistLocalSession(null);
      return { user: mapped, error: null };
    }

    if (data.user && !data.session) {
      return {
        user: null,
        error: null,
        notice: 'Confirmation email sent. Verify your inbox or use Judge Demo Quick Login to preview immediately.',
      };
    }
  }

  const createdAt = new Date().toISOString();
  const id = `local-${Date.now()}`;
  saveLocalUser({
    id,
    email: cleanEmail,
    password,
    name: displayName,
    createdAt,
  });

  const authUser: AuthUser = {
    id,
    email: cleanEmail,
    name: displayName,
    provider: 'demo',
    createdAt,
  };
  persistLocalSession(authUser);
  return { user: authUser, error: null };
}

export async function loginWithJudgeDemo(): Promise<AuthResponse> {
  if (supabase) {
    const signInAttempt = await supabase.auth.signInWithPassword({
      email: JUDGE_DEMO_EMAIL,
      password: JUDGE_DEMO_PASSWORD,
    });

    if (!signInAttempt.error && signInAttempt.data.user) {
      const mapped = mapSupabaseUser(signInAttempt.data.user);
      persistLocalSession(null);
      return { user: mapped, error: null };
    }

    const signUpAttempt = await supabase.auth.signUp({
      email: JUDGE_DEMO_EMAIL,
      password: JUDGE_DEMO_PASSWORD,
      options: {
        data: { full_name: 'VSPARK Judge' },
      },
    });

    if (!signUpAttempt.error && signUpAttempt.data.session?.user) {
      const mapped = mapSupabaseUser(signUpAttempt.data.session.user);
      persistLocalSession(null);
      return { user: mapped, error: null };
    }
  }

  const judgeUser: AuthUser = {
    id: 'judge-vspark-2026',
    email: JUDGE_DEMO_EMAIL,
    name: 'VSPARK Judge',
    provider: 'demo',
    createdAt: new Date().toISOString(),
  };
  persistLocalSession(judgeUser);
  return { user: judgeUser, error: null };
}

export async function signOutSession(): Promise<void> {
  persistLocalSession(null);
  if (supabase) {
    await supabase.auth.signOut();
  }
}
