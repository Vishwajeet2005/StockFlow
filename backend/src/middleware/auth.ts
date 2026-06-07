import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod';
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret-change-in-prod';

// Warn clearly in development if defaults are used
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set. Using insecure default — OK for dev only, NEVER in production.');
}
if (!process.env.REFRESH_SECRET) {
  console.warn('⚠️  REFRESH_SECRET not set. Using insecure default — OK for dev only, NEVER in production.');
}

export interface AuthRequest extends Request {
  user?: { id: number; username: string; company_id: number; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; company_id: number; role: string };
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
