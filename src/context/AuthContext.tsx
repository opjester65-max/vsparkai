import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getInitialAuthUser,
  isSupabaseConfigured,
  loginWithJudgeDemo,
  signInWithEmail,
  signOutSession,
  signUpWithEmail,
  subscribeAuthState,
  type AuthResponse,
} from '../lib/supabase';
import type { AuthUser } from '../types/studio';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthResponse>;
  quickJudgeLogin: () => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    getInitialAuthUser()
      .then((initialUser) => {
        if (active) {
          setUser(initialUser);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = subscribeAuthState((nextUser) => {
      if (active) {
        setUser(nextUser);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const result = await signUpWithEmail(email, password, fullName);
    if (result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const quickJudgeLogin = useCallback(async () => {
    const result = await loginWithJudgeDemo();
    if (result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await signOutSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseConfigured,
        signIn,
        signUp,
        quickJudgeLogin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
