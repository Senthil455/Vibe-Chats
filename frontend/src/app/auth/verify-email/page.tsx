'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function VerifyEmailPage() {
  const router = useRouter();
  const updateUser = useAuthStore((s) => s.updateUser);
  const user = useAuthStore((s) => s.user);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true); setError('');
    try {
      await authApi.verifyEmail(code);
      updateUser({ isEmailVerified: true });
      router.push('/chat');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.resendOTP();
      setResent(true);
      setTimeout(() => setResent(false), 30000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to resend');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 mb-6">
          <span className="text-2xl">✉️</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
        <p className="text-zinc-400 mb-8">
          We sent a 6-digit code to <span className="text-white font-medium">{user?.email}</span>
        </p>

        <div className="glass rounded-2xl p-8">
          <div className="flex gap-3 justify-center mb-6">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                maxLength={1}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-surface-2 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition disabled:opacity-50 mb-4"
          >
            {loading ? 'Verifying…' : 'Verify Email'}
          </button>

          <button
            onClick={handleResend}
            disabled={resent}
            className="text-sm text-brand-400 hover:text-brand-300 disabled:text-zinc-500 disabled:cursor-not-allowed"
          >
            {resent ? 'Code sent! Check your inbox' : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
}
