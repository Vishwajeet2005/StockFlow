import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff, ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type Step = 'password' | 'totp';

export default function LoginPage() {
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('password');
  const [form, setForm] = useState({ username: '', password: '' });
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'totp') totpRefs.current[0]?.focus();
  }, [step]);

  // ── Step 1: Password ────────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const { requires2FA } = await login(form.username, form.password);
      if (requires2FA) {
        setStep('totp');
        toast('Enter the code from your authenticator app', { icon: '🔐' });
      } else {
        navigate('/');
      }
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: TOTP ────────────────────────────────────────────────────────────
  const handleTotpInput = (idx: number, val: string) => {
    // Handle paste of full code
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const next = [...totpCode];
      digits.forEach((d, i) => { if (i < 6) next[i] = d; });
      setTotpCode(next);
      totpRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...totpCode];
    next[idx] = val;
    setTotpCode(next);
    if (val && idx < 5) totpRefs.current[idx + 1]?.focus();
  };

  const handleTotpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !totpCode[idx] && idx > 0) {
      totpRefs.current[idx - 1]?.focus();
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = totpCode.join('');
    if (code.length < 6) { setErrorMsg('Enter all 6 digits'); return; }
    setErrorMsg('');
    setLoading(true);
    try {
      await verify2FA(code);
      navigate('/');
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Invalid code. Please try again.';
      setErrorMsg(msg);
      setTotpCode(['', '', '', '', '', '']);
      totpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-md shadow-brand-200">
            <Building2 size={20} color="#fff" />
          </div>
          <div>
            <div className="font-semibold text-ink-900 text-lg leading-tight">StockFlow</div>
            <div className="text-xs text-ink-400">Inventory Management System</div>
          </div>
        </div>

        {step === 'password' ? (
          <div className="card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={16} className="text-ink-400" />
              <h2 className="text-lg font-semibold text-ink-900">Sign in</h2>
            </div>
            <p className="text-sm text-ink-400 mb-6">Enter your credentials to continue</p>

            {errorMsg && (
              <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 leading-snug">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  className="input"
                  placeholder="admin"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 transition-colors"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full mt-1"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : 'Continue'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-surface-2">
              <div className="flex items-center gap-1.5 text-xs text-ink-300">
                <ShieldCheck size={13} />
                <span>Protected by 2-step verification</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 animate-fade-in">
            <button
              className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-700 mb-4 transition-colors"
              onClick={() => { setStep('password'); setErrorMsg(''); setTotpCode(['','','','','','']); }}
            >
              <ArrowLeft size={14} /> Back to login
            </button>

            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-brand-500" />
              <h2 className="text-lg font-semibold text-ink-900">2-Step Verification</h2>
            </div>
            <p className="text-sm text-ink-400 mb-6">
              Open your authenticator app and enter the 6-digit code for <strong className="text-ink-700">StockFlow</strong>.
            </p>

            {errorMsg && (
              <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTotpSubmit}>
              {/* OTP input boxes */}
              <div className="flex gap-2 justify-center mb-6">
                {totpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => totpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={e => handleTotpInput(idx, e.target.value)}
                    onKeyDown={e => handleTotpKeyDown(idx, e)}
                    onFocus={e => e.target.select()}
                    className={`w-11 h-13 text-center text-xl font-semibold font-mono rounded-lg border transition-all focus:outline-none
                      ${digit ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-surface-3 bg-white text-ink-900'}
                      focus:border-brand-500 focus:ring-2 focus:ring-brand-100`}
                    style={{ height: 52 }}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading || totpCode.join('').length < 6}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </span>
                ) : 'Verify & Sign In'}
              </button>
            </form>

            <p className="text-xs text-ink-300 text-center mt-4">
              Code changes every 30 seconds. If it's not working, check your device clock is synced.
            </p>
          </div>
        )}

        <p className="text-xs text-ink-300 text-center mt-5">
          Default credentials: <span className="font-mono">admin</span> / <span className="font-mono">Admin@123</span>
        </p>
      </div>
    </div>
  );
}
