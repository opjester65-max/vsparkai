import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from './AuthScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-8 space-y-4">
          <div className="h-5 w-36 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
