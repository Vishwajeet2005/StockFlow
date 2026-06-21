import 'dotenv/config';
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { initDB } from './db';
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import manufacturingRouter from './routes/manufacturing';
import miscRouter from './routes/misc';
import analyticsRouter from './routes/analytics';
import { errorHandler } from './middleware/errorHandler';

// Initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

const app = express();

const PORT = process.env.PORT || 3001;
// Render automatically provides RENDER_EXTERNAL_URL (e.g., https://stockflow-obza.onrender.com)
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
const isProd = process.env.NODE_ENV === 'production';

// ─── Guard: refuse to start with missing secrets in production ───────────────
if (isProd && (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET)) {
  console.error('❌ FATAL: JWT_SECRET and REFRESH_SECRET must be set in production. Exiting.');
  process.exit(1);
}

// ─── Security headers via Helmet ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", FRONTEND_URL],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Only trust proxy in production (behind load balancer / Render)
if (isProd) app.set('trust proxy', 1);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = isProd
  ? [FRONTEND_URL]  // strict in production
  : [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Electron, curl, mobile)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Reduced body limit to mitigate DoS
app.use(express.json({ limit: '1mb' }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // tightened from 50 to 10 attempts
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // don't count successful logins against the limit
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 200,
  message: { error: 'Too many requests. Please slow down.' },
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/verify-2fa', loginLimiter);
app.use('/api', apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/manufacturing', manufacturingRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api', miscRouter);

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Frontend Serving (Website) ────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler ────────────────────────────────────────────────────────────
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 StockFlow API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize DB:', err);
  process.exit(1);
});

export default app;
