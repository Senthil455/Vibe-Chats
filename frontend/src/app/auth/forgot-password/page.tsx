'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-zinc-400 mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <p className="text-white font-semibold">Check your inbox</p>
              <p className="text-zinc-400 text-sm">If that email is registered, we sent a reset link.</p>
              <Link href="/auth/login" className="block text-brand-400 hover:text-brand-300 text-sm">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition disabled:opacity-50">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
              <p className="text-center">
                <Link href="/auth/login" className="text-sm text-brand-400 hover:text-brand-300">
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
