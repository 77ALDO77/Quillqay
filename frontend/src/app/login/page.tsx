'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, ArrowLeft, Mail, KeyRound, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'google' | 'github' | 'email' | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading('email');
    await new Promise((r) => setTimeout(r, 800));
    setLoading(null);
    router.push('/projects');
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(provider);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(null);
    router.push('/projects');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_30%_50%,#1c1b1d_0%,#131315_100%)] text-on-surface font-display flex flex-col items-center justify-center px-4">
      {/* Background Accents */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/8 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-15%] right-[-5%] w-[40vw] h-[40vw] bg-secondary/4 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[10%] w-[20vw] h-[20vw] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Back link */}
      <Link
        href="/"
        className="relative z-10 flex items-center gap-2 text-on-surface-variant/60 hover:text-primary transition-colors text-sm mb-8 self-start ml-4 md:self-center md:ml-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Under-glow */}
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="glass-panel relative rounded-3xl border border-white/10 shadow-2xl p-8 md:p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center glow-accent">
              <Terminal className="w-5 h-5 text-on-primary-container" />
            </div>
            <div>
              <div className="text-on-surface font-bold text-lg tracking-tight">Quillqay</div>
              <div className="text-[10px] text-on-surface-variant/50 tracking-widest uppercase">Sign In</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tighter text-on-surface mb-2">Welcome back</h1>
          <p className="text-sm text-on-surface-variant/70 mb-8 leading-relaxed">
            Sign in to continue writing. Your ideas are waiting.
          </p>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {/* Google */}
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-on-surface disabled:opacity-50"
            >
              {loading === 'google' ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>{loading === 'google' ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            {/* GitHub */}
            <button
              onClick={() => handleSocialLogin('github')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium text-on-surface disabled:opacity-50"
            >
              {loading === 'github' ? (
                <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              )}
              <span>{loading === 'github' ? 'Signing in...' : 'Continue with GitHub'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-outline font-medium">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary focus:ring-0 focus:shadow-[0_0_0_2px_rgba(214,186,255,0.1)] outline-none transition-all"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-outline/50 focus:border-primary focus:ring-0 focus:shadow-[0_0_0_2px_rgba(214,186,255,0.1)] outline-none transition-all"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading !== null}
              className="w-full px-4 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:saturate-150 transition-all disabled:opacity-50"
            >
              {loading === 'email' ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-xs text-on-surface-variant/50 mt-6">
            Don&apos;t have an account?{' '}
            <span className="text-primary hover:underline cursor-pointer">Sign up</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-on-surface-variant/30">
        Quillqay &mdash; &quot;To Write&quot; in Quechua
      </p>
    </div>
  );
}
