'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Mail } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSent(true);
      toast.success('Reset link sent!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-gradient">⚡ Revorax</Link>
          <p className="text-zinc-500 text-sm mt-2">AI Revenue OS</p>
        </div>

        <div className="card p-8">
          {isSent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">Check your email</h1>
              <p className="text-zinc-500 text-sm mb-6">
                We've sent a password reset link to <span className="text-zinc-300 font-medium">{email}</span>.
              </p>
              <Link href="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-zinc-100 mb-2">Reset password</h1>
              <p className="text-zinc-500 text-sm mb-8">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="label">Email address</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@business.com"
                    className="input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="text-center text-zinc-500 text-sm mt-6">
                Remembered your password?{' '}
                <Link href="/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
