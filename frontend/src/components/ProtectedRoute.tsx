import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_30%_50%,#1c1b1d_0%,#131315_100%)] flex flex-col items-center justify-center">
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center gap-3 border border-white/10 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs text-on-surface-variant font-mono tracking-wider uppercase">
            Checking session...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
