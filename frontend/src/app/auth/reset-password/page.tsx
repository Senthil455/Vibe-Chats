'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { authApi } from '@/lib/api';

interface Form { newPassword: string; confirm: string; }

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const userId = params.get('id') || '';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Form>();

  const onSubmit = async ({ newPassword }: Form) => {
    setLoading(true); setError('');
    try {
      await authApi.resetPassword({ userId, token, newPassword });
      router.push('/auth/login');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Reset failed. Link may be expired.');
    } finally { setLoading(false); }
  };

  if (!token || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="text-center text-zinc-400">
          <p className="text-xl mb-2">❌ Invalid reset link</p>
          <a href="/auth/forgot-password" className="text-brand-400 hover:text-brand-300">Request a new one</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">New Password</h1>
        </div>
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">New Password</label>
              <input
                {...register('newPassword', { required: true, minLength: { value: 6, message: 'Min 6 chars' } })}
                type="password" placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm Password</label>
              <input
                {...register('confirm', { validate: (v) => v === watch('newPassword') || 'Passwords do not match' })}
                type="password" placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm.message}</p>}
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition disabled:opacity-50">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
