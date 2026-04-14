import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldOff, KeyRound, QrCode, Eye, EyeOff, CheckCircle, Loader2, X } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/layout/PageHeader';

// ── 2FA Setup Modal ────────────────────────────────────────────────────────────
function Setup2FAModal({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState<'qr' | 'verify' | 'done'>('qr');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    api.post('/auth/2fa/setup').then(r => {
      setQrCode(r.data.qrCode);
      setSecret(r.data.secret);
      setLoading(false);
    }).catch(() => { toast.error('Failed to generate QR code'); onClose(); });
  }, []);

  const handleCodeInput = (idx: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const next = [...code];
      digits.forEach((d, i) => { if (i < 6) next[i] = d; });
      setCode(next);
      codeRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[idx] = val;
    setCode(next);
    if (val && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleVerify = async () => {
    const token = code.join('');
    if (token.length < 6) { setError('Enter all 6 digits'); return; }
    setVerifying(true); setError('');
    try {
      await api.post('/auth/2fa/enable', { code: token });
      setStep('done');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Invalid code');
      setCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    } finally { setVerifying(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-500" />
            <h2 className="font-semibold text-ink-900">Set Up 2-Step Verification</h2>
          </div>
          <button className="btn btn-ghost btn-sm p-1.5 h-auto" onClick={onClose}><X size={16} /></button>
        </div>

        {step === 'qr' && (
          <div className="p-6">
            <p className="text-sm text-ink-500 mb-5">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, or any TOTP app).
            </p>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 size={28} className="animate-spin text-brand-400" /></div>
            ) : (
              <>
                <div className="flex justify-center mb-5">
                  <div className="p-3 bg-white border-2 border-surface-3 rounded-xl shadow-sm">
                    <img src={qrCode} alt="2FA QR Code" className="w-44 h-44" />
                  </div>
                </div>
                <div className="bg-surface-1 border border-surface-3 rounded-lg px-4 py-3 mb-5">
                  <p className="text-xs text-ink-400 mb-1">Can't scan? Enter this code manually:</p>
                  <p className="font-mono text-sm text-ink-700 break-all tracking-wider select-all">{secret}</p>
                </div>
                <button className="btn btn-primary w-full" onClick={() => setStep('verify')}>
                  I've scanned it — Continue
                </button>
              </>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="p-6">
            <p className="text-sm text-ink-500 mb-6">
              Enter the 6-digit code from your authenticator app to confirm setup.
            </p>
            {error && <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <div className="flex gap-2 justify-center mb-6">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => codeRefs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleCodeInput(idx, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Backspace' && !code[idx] && idx > 0) codeRefs.current[idx - 1]?.focus(); }}
                  className={`w-11 text-center text-xl font-semibold font-mono rounded-lg border transition-all focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100
                    ${digit ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-surface-3 bg-white text-ink-900'}`}
                  style={{ height: 52 }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary flex-1" onClick={() => setStep('qr')}>Back</button>
              <button className="btn btn-primary flex-1" onClick={handleVerify} disabled={verifying || code.join('').length < 6}>
                {verifying ? <><Loader2 size={14} className="animate-spin" />Verifying…</> : 'Enable 2FA'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-ink-900 mb-2">2FA Enabled!</h3>
            <p className="text-sm text-ink-500 mb-6">
              Your account is now protected with 2-step verification. You'll need your authenticator app on every login.
            </p>
            <button className="btn btn-primary w-full" onClick={() => { onEnabled(); onClose(); }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Disable 2FA Modal ──────────────────────────────────────────────────────────
function Disable2FAModal({ onClose, onDisabled }: { onClose: () => void; onDisabled: () => void }) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDisable = async () => {
    if (!password || code.length < 6) { setError('Enter your password and 6-digit code'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/2fa/disable', { password, code });
      onDisabled();
      onClose();
      toast.success('2FA has been disabled');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to disable 2FA');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-2">
          <div className="flex items-center gap-2">
            <ShieldOff size={18} className="text-red-500" />
            <h2 className="font-semibold text-ink-900">Disable 2FA</h2>
          </div>
          <button className="btn btn-ghost btn-sm p-1.5 h-auto" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            ⚠️ Disabling 2FA makes your account less secure. Both your password and current authenticator code are required.
          </div>
          {error && <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input className="input pr-10" type={showPass ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Authenticator Code</label>
            <input className="input font-mono tracking-widest text-center text-lg" placeholder="000000" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-surface-2">
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger flex-1" onClick={handleDisable} disabled={loading}>
            {loading ? <><Loader2 size={14} className="animate-spin" />Disabling…</> : 'Disable 2FA'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────────
export default function SecurityPage() {
  const { username, twoFAEnabled, set2FAEnabled } = useAuth();
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(r => setLastLogin(r.data.last_login || '')).catch(() => {});
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error('New passwords do not match'); return; }
    if (pwForm.next.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      toast.success('Password changed. You will be logged out.');
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => window.location.href = '/login', 1500);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  const pwStrength = (p: string) => {
    if (!p) return { label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 2) return { label: 'Weak', color: 'bg-red-400' };
    if (score <= 3) return { label: 'Fair', color: 'bg-yellow-400' };
    if (score <= 4) return { label: 'Strong', color: 'bg-blue-400' };
    return { label: 'Very Strong', color: 'bg-green-500' };
  };

  const strength = pwStrength(pwForm.next);

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader title="Security Settings" subtitle="Manage your account security and authentication" />

      <div className="p-6 max-w-2xl space-y-6 animate-fade-in">

        {/* Account overview */}
        <div className="card p-5">
          <h2 className="font-semibold text-ink-900 mb-4 text-sm">Account Overview</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-ink-400 mb-0.5">Username</div>
              <div className="font-mono font-medium text-ink-900">{username}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400 mb-0.5">Last Login</div>
              <div className="text-ink-700">{lastLogin ? new Date(lastLogin).toLocaleString('en-IN') : 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-ink-400 mb-0.5">2-Step Verification</div>
              <span className={`badge ${twoFAEnabled ? 'badge-green' : 'badge-red'}`}>
                {twoFAEnabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
            <div>
              <div className="text-xs text-ink-400 mb-0.5">Session Tokens</div>
              <div className="text-ink-700">15 min access · 7 day refresh</div>
            </div>
          </div>
        </div>

        {/* 2FA card */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${twoFAEnabled ? 'bg-green-100' : 'bg-surface-2'}`}>
                {twoFAEnabled ? <ShieldCheck size={20} className="text-green-600" /> : <ShieldOff size={20} className="text-ink-400" />}
              </div>
              <div>
                <h3 className="font-semibold text-ink-900 text-sm">2-Step Verification (TOTP)</h3>
                <p className="text-xs text-ink-400 mt-0.5 leading-relaxed max-w-sm">
                  {twoFAEnabled
                    ? 'Your account is secured with an authenticator app. A 6-digit code is required at every login.'
                    : 'Add an extra layer of protection. Use Google Authenticator, Authy, or any TOTP app.'}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {twoFAEnabled ? (
                <button className="btn btn-danger btn-sm" onClick={() => setShowDisable2FA(true)}>
                  <ShieldOff size={14} /> Disable
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setShow2FASetup(true)}>
                  <ShieldCheck size={14} /> Enable
                </button>
              )}
            </div>
          </div>

          {!twoFAEnabled && (
            <div className="mt-4 pt-4 border-t border-surface-2 grid grid-cols-3 gap-3">
              {[
                { step: '1', text: 'Install an authenticator app on your phone' },
                { step: '2', text: 'Scan the QR code shown during setup' },
                { step: '3', text: 'Enter the 6-digit code to confirm' },
              ].map(s => (
                <div key={s.step} className="flex gap-2 text-xs text-ink-400">
                  <span className="w-5 h-5 rounded-full bg-surface-2 flex-shrink-0 flex items-center justify-center text-ink-500 font-semibold text-xs">{s.step}</span>
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-ink-400" />
            <h3 className="font-semibold text-ink-900 text-sm">Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input className="input pr-10" type={showCurrent ? 'text' : 'password'} placeholder="••••••••" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500" onClick={() => setShowCurrent(v => !v)} tabIndex={-1}>
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input className="input pr-10" type={showNew ? 'text' : 'password'} placeholder="Min. 8 characters" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwForm.next && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color}`}
                      style={{ width: strength.label === 'Weak' ? '20%' : strength.label === 'Fair' ? '50%' : strength.label === 'Strong' ? '75%' : '100%' }} />
                  </div>
                  <span className="text-xs text-ink-400">{strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input className={`input ${pwForm.confirm && pwForm.confirm !== pwForm.next ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                type="password" placeholder="Repeat new password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
              {pwForm.confirm && pwForm.confirm !== pwForm.next && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading}>
              {pwLoading ? <><Loader2 size={14} className="animate-spin" />Saving…</> : <><KeyRound size={14} />Update Password</>}
            </button>
          </form>
        </div>

        {/* Security tips */}
        <div className="card p-5 bg-blue-50 border-blue-100">
          <h3 className="font-semibold text-blue-900 text-sm mb-3">Security Recommendations</h3>
          <ul className="space-y-1.5 text-xs text-blue-700">
            <li className="flex items-start gap-2"><span className="mt-0.5">•</span> Enable 2-step verification for maximum account protection</li>
            <li className="flex items-start gap-2"><span className="mt-0.5">•</span> Use a strong password with uppercase, numbers, and special characters</li>
            <li className="flex items-start gap-2"><span className="mt-0.5">•</span> Never share your credentials with anyone</li>
            <li className="flex items-start gap-2"><span className="mt-0.5">•</span> Always log out when using shared computers</li>
          </ul>
        </div>
      </div>

      {show2FASetup && (
        <Setup2FAModal
          onClose={() => setShow2FASetup(false)}
          onEnabled={() => set2FAEnabled(true)}
        />
      )}
      {showDisable2FA && (
        <Disable2FAModal
          onClose={() => setShowDisable2FA(false)}
          onDisabled={() => set2FAEnabled(false)}
        />
      )}
    </div>
  );
}
