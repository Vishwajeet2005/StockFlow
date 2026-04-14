import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { runSQL, queryOne, queryAll } from '../db';
import { JWT_SECRET, REFRESH_SECRET, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateTokens(userId: number, username: string) {
  const accessToken = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS).toISOString();
  runSQL('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)', [userId, hashToken(refreshToken), expiresAt]);
  return { accessToken, refreshToken };
}

// ─── Step 1: Login (password check) ────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // Check lockout
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remaining = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
    return res.status(423).json({ error: `Account locked. Try again in ${remaining} minute(s).` });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    const attempts = (user.failed_attempts || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString();
      runSQL('UPDATE users SET failed_attempts=?, locked_until=? WHERE id=?', [attempts, lockedUntil, user.id]);
      return res.status(423).json({ error: `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.` });
    }
    runSQL('UPDATE users SET failed_attempts=? WHERE id=?', [attempts, user.id]);
    return res.status(401).json({ error: `Invalid credentials. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.` });
  }

  // Reset failed attempts
  runSQL('UPDATE users SET failed_attempts=0, locked_until=NULL WHERE id=?', [user.id]);

  // If 2FA is enabled, return a partial token requiring TOTP
  if (user.totp_enabled) {
    const partialToken = jwt.sign({ id: user.id, username: user.username, partial: true }, JWT_SECRET, { expiresIn: '5m' });
    return res.json({ requires2FA: true, partialToken });
  }

  // No 2FA: issue full tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.username);
  runSQL("UPDATE users SET last_login=datetime('now') WHERE id=?", [user.id]);
  res.json({ accessToken, refreshToken, username: user.username, twoFAEnabled: false });
});

// ─── Step 2: Verify TOTP ────────────────────────────────────────────────────
router.post('/verify-2fa', (req: Request, res: Response) => {
  const { partialToken, code } = req.body;
  if (!partialToken || !code) return res.status(400).json({ error: 'partialToken and code required' });

  let decoded: any;
  try {
    decoded = jwt.verify(partialToken, JWT_SECRET) as any;
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  if (!decoded.partial) return res.status(400).json({ error: 'Not a 2FA token' });

  const user = queryOne('SELECT * FROM users WHERE id = ?', [decoded.id]);
  if (!user?.totp_secret) return res.status(401).json({ error: 'User not found' });

  const valid = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: 'base32',
    token: code.replace(/\s/g, ''),
    window: 1,
  });

  if (!valid) return res.status(401).json({ error: 'Invalid authenticator code. Please try again.' });

  const { accessToken, refreshToken } = generateTokens(user.id, user.username);
  runSQL("UPDATE users SET last_login=datetime('now'), failed_attempts=0 WHERE id=?", [user.id]);
  res.json({ accessToken, refreshToken, username: user.username, twoFAEnabled: true });
});

// ─── Refresh token ───────────────────────────────────────────────────────────
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  const tokenHash = hashToken(refreshToken);
  const stored = queryOne('SELECT * FROM refresh_tokens WHERE token_hash=? AND expires_at > datetime("now")', [tokenHash]);
  if (!stored) return res.status(401).json({ error: 'Invalid or expired refresh token' });

  const user = queryOne('SELECT * FROM users WHERE id=?', [stored.user_id]);
  if (!user) return res.status(401).json({ error: 'User not found' });

  // Rotate refresh token
  runSQL('DELETE FROM refresh_tokens WHERE token_hash=?', [tokenHash]);
  const { accessToken, refreshToken: newRefresh } = generateTokens(user.id, user.username);
  res.json({ accessToken, refreshToken: newRefresh });
});

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post('/logout', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) runSQL('DELETE FROM refresh_tokens WHERE token_hash=?', [hashToken(refreshToken)]);
  res.json({ success: true });
});

// ─── 2FA Setup: generate secret ─────────────────────────────────────────────
router.post('/2fa/setup', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = queryOne('SELECT * FROM users WHERE id=?', [req.user!.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.totp_enabled) return res.status(400).json({ error: '2FA is already enabled' });

  const secret = speakeasy.generateSecret({
    name: `StockFlow (${user.username})`,
    issuer: 'StockFlow IMS',
    length: 20,
  });

  // Save secret (not yet enabled — user must verify first)
  runSQL('UPDATE users SET totp_secret=? WHERE id=?', [secret.base32, user.id]);

  const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url!);
  res.json({ secret: secret.base32, qrCode: qrDataUrl, otpauthUrl: secret.otpauth_url });
});

// ─── 2FA Enable: verify first code ──────────────────────────────────────────
router.post('/2fa/enable', authMiddleware, (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'TOTP code required' });

  const user = queryOne('SELECT * FROM users WHERE id=?', [req.user!.id]);
  if (!user?.totp_secret) return res.status(400).json({ error: 'Run /2fa/setup first' });
  if (user.totp_enabled) return res.status(400).json({ error: '2FA already enabled' });

  const valid = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: 'base32',
    token: code.replace(/\s/g, ''),
    window: 1,
  });

  if (!valid) return res.status(400).json({ error: 'Invalid code. Make sure your authenticator app time is synced.' });

  runSQL('UPDATE users SET totp_enabled=1 WHERE id=?', [user.id]);
  res.json({ success: true, message: '2FA enabled successfully' });
});

// ─── 2FA Disable ────────────────────────────────────────────────────────────
router.post('/2fa/disable', authMiddleware, (req: AuthRequest, res: Response) => {
  const { code, password } = req.body;
  if (!code || !password) return res.status(400).json({ error: 'Current password and TOTP code required to disable 2FA' });

  const user = queryOne('SELECT * FROM users WHERE id=?', [req.user!.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Wrong password' });

  const valid = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: 'base32',
    token: code.replace(/\s/g, ''),
    window: 1,
  });
  if (!valid) return res.status(400).json({ error: 'Invalid authenticator code' });

  runSQL('UPDATE users SET totp_enabled=0, totp_secret=NULL WHERE id=?', [user.id]);
  res.json({ success: true, message: '2FA disabled' });
});

// ─── Get auth status ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = queryOne('SELECT id, username, totp_enabled, last_login, created_at FROM users WHERE id=?', [req.user!.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ...user, twoFAEnabled: !!user.totp_enabled });
});

// ─── Change password ─────────────────────────────────────────────────────────
router.post('/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });

  const user = queryOne('SELECT * FROM users WHERE id=?', [req.user!.id]);
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = bcrypt.hashSync(newPassword, 12);
  runSQL('UPDATE users SET password=? WHERE id=?', [hash, user.id]);
  // Revoke all refresh tokens on password change
  runSQL('DELETE FROM refresh_tokens WHERE user_id=?', [user.id]);
  res.json({ success: true, message: 'Password changed. Please log in again.' });
});

export default router;
