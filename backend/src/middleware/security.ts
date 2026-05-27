import { Request, Response, NextFunction } from 'express';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 120;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export const securityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

const localOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.REACT_APP_USER_URL,
  process.env.REACT_APP_ADMIN_URL,
  ...localOrigins,
].filter(Boolean) as string[];

export const sameOriginWriteGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    next();
    return;
  }

  const source = req.get('origin') || req.get('referer');
  if (!source) {
    next();
    return;
  }

  try {
    const origin = new URL(source).origin;
    if (!allowedOrigins.includes(origin)) {
      res.status(403).json({ success: false, message: 'Invalid request origin' });
      return;
    }
  } catch (_error) {
    res.status(403).json({ success: false, message: 'Invalid request origin' });
    return;
  }

  next();
};

export const apiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (bucket.count >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
    return;
  }

  bucket.count += 1;
  next();
};
