import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { prisma } from '../db';
import { JWT_SECRET, REFRESH_SECRET, authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { validateData } from '../middleware/validate';
import { auditLog } from '../utils/logger';

const router = Router();
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function generateTokens(userId: number, username: string, companyId: number, role: string) {
  const accessToken = jwt.sign({ id: userId, username, company_id: companyId, role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);
  
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    }
  });
  
  return { accessToken, refreshToken };
}

const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  })
});

// ─── Step 1: Login (password check) ────────────────────────────────────────
router.post('/login', validateData(loginSchema), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({ error: `Account locked. Try again in ${remaining} minute(s).` });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
        await prisma.user.update({ where: { id: user.id }, data: { failedAttempts: attempts, lockedUntil } });
        return res.status(423).json({ error: `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.` });
      }
      await prisma.user.update({ where: { id: user.id }, data: { failedAttempts: attempts } });
      return res.status(401).json({ error: `Invalid credentials. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.` });
    }

    // Reset failed attempts
    await prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } });

    // If 2FA is enabled, return a partial token requiring TOTP
    if (user.totpEnabled) {
      const partialToken = jwt.sign({ id: user.id, username: user.username, company_id: user.companyId, role: user.role, partial: true }, JWT_SECRET, { expiresIn: '5m' });
      return res.json({ requires2FA: true, partialToken });
    }

    // No 2FA: issue full tokens
    const { accessToken, refreshToken } = await generateTokens(user.id, user.username, user.companyId, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    res.json({ accessToken, refreshToken, username: user.username, role: user.role, twoFAEnabled: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const registerSchema = z.object({
  body: z.object({
    company_name: z.string().min(1, 'Company name is required'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
  })
});

// ─── Registration (New Company) ──────────────────────────────────────────────
router.post('/register', validateData(registerSchema), async (req: Request, res: Response) => {
  try {
    const { company_name, username, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const hash = bcrypt.hashSync(password, 12);
    
    // Create Company and Admin User in a transaction
    const company = await prisma.company.create({
      data: {
        name: company_name,
        users: {
          create: {
            username,
            password: hash,
            role: 'admin'
          }
        }
      },
      include: {
        users: true
      }
    });
    
    const user = company.users[0];
    const { accessToken, refreshToken } = await generateTokens(user.id, user.username, user.companyId, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    res.json({ accessToken, refreshToken, username: user.username, role: user.role, twoFAEnabled: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const verify2faSchema = z.object({
  body: z.object({
    partialToken: z.string().min(1, 'partialToken required'),
    code: z.string().min(1, 'code required'),
  })
});

// ─── Step 2: Verify TOTP ────────────────────────────────────────────────────
router.post('/verify-2fa', validateData(verify2faSchema), async (req: Request, res: Response) => {
  try {
    const { partialToken, code } = req.body;

    let decoded: any;
    try {
      decoded = jwt.verify(partialToken, JWT_SECRET) as any;
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    if (!decoded.partial) return res.status(400).json({ error: 'Not a 2FA token' });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user?.totpSecret) return res.status(401).json({ error: 'User not found' });

    const valid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });

    if (!valid) return res.status(401).json({ error: 'Invalid authenticator code. Please try again.' });

    const { accessToken, refreshToken } = await generateTokens(user.id, user.username, user.companyId, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date(), failedAttempts: 0 } });
    res.json({ accessToken, refreshToken, username: user.username, role: user.role, twoFAEnabled: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  })
});

// ─── Refresh token ───────────────────────────────────────────────────────────
router.post('/refresh', validateData(refreshSchema), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.expiresAt <= new Date()) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { tokenHash } });
    const { accessToken, refreshToken: newRefresh } = await generateTokens(user.id, user.username, user.companyId, user.role);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const hash = hashToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { tokenHash: hash } });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── 2FA Setup: generate secret ─────────────────────────────────────────────
router.post('/2fa/setup', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.totpEnabled) return res.status(400).json({ error: '2FA is already enabled' });

    const secret = speakeasy.generateSecret({
      name: `StockFlow (${user.username})`,
      issuer: 'StockFlow IMS',
      length: 20,
    });

    await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret.base32 } });
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url!);
    res.json({ secret: secret.base32, qrCode: qrDataUrl, otpauthUrl: secret.otpauth_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const enable2faSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'TOTP code required'),
  })
});

// ─── 2FA Enable: verify first code ──────────────────────────────────────────
router.post('/2fa/enable', authMiddleware, validateData(enable2faSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.totpSecret) return res.status(400).json({ error: 'Run /2fa/setup first' });
    if (user.totpEnabled) return res.status(400).json({ error: '2FA already enabled' });

    const valid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });

    if (!valid) return res.status(400).json({ error: 'Invalid code. Make sure your authenticator app time is synced.' });

    await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const disable2faSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'TOTP code required'),
    password: z.string().min(1, 'Current password required'),
  })
});

// ─── 2FA Disable ────────────────────────────────────────────────────────────
router.post('/2fa/disable', authMiddleware, validateData(disable2faSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { code, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Wrong password' });

    const valid = speakeasy.totp.verify({
      secret: user.totpSecret!,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1,
    });
    if (!valid) return res.status(400).json({ error: 'Invalid authenticator code' });

    await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null } });
    res.json({ success: true, message: '2FA disabled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Get auth status ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user!.id },
      include: { company: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      totp_enabled: user.totpEnabled, 
      last_login: user.lastLogin, 
      created_at: user.createdAt, 
      company_name: user.company.name,
      twoFAEnabled: user.totpEnabled 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const staffSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username required'),
    password: z.string().min(1, 'Password required'),
  })
});

// ─── Create Staff Account (Admin only) ───────────────────────────────────────
router.post('/staff', authMiddleware, validateData(staffSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Only Admins can create staff accounts' });
    const { username, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const hash = bcrypt.hashSync(password, 12);
    await prisma.user.create({
      data: {
        companyId: req.user!.company_id,
        username,
        password: hash,
        role: 'staff'
      }
    });
    res.json({ success: true, message: 'Staff account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/staff', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Only Admins can view staff accounts' });
    const staff = await prisma.user.findMany({
      where: { companyId: req.user!.company_id, role: 'staff' },
      select: { id: true, username: true, role: true, lastLogin: true, createdAt: true }
    });
    // Transform to match old snake_case format for frontend compatibility
    const mapped = staff.map(s => ({
      ...s,
      last_login: s.lastLogin,
      created_at: s.createdAt
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/staff/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Only Admins can delete staff accounts' });
    const staffId = parseInt(req.params.id);
    const existing = await prisma.user.findFirst({ where: { id: staffId, companyId: req.user!.company_id, role: 'staff' } });
    if (!existing) return res.status(404).json({ error: 'Staff account not found' });
    
    await auditLog(
      req.user!.company_id,
      req.user!.id,
      'DELETE_STAFF',
      req.ip || '',
      { deletedStaffId: staffId }
    );

    await prisma.user.delete({ where: { id: staffId } });
    // refresh tokens are cascade deleted automatically via prisma schema
    res.json({ success: true, message: 'Staff account deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'),
  })
});

// ─── Change password ─────────────────────────────────────────────────────────
router.post('/change-password', authMiddleware, validateData(changePasswordSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = bcrypt.hashSync(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
    // Revoke all refresh tokens on password change
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    res.json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
