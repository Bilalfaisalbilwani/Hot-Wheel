import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const store = new Map<string, RateLimitRecord>();
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  // Periodic cleanup every 5 minutes to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
               req.socket.remoteAddress || 
               'unknown_ip';
    const key = options.keyGenerator ? options.keyGenerator(req) : ip;
    const now = Date.now();

    const record = store.get(key);

    if (!record || now > record.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: retryAfterSec
      });
    }

    record.count += 1;
    return next();
  };
}

// 1. Admin login limiter: 5 attempts per 15 minutes
export const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many admin login attempts from this IP. Please wait 15 minutes before trying again.'
});

// 2. Visa application initiation limiter: 20 per 10 minutes
export const visaSubmissionLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many visa submissions from this IP. Please try again in 10 minutes.'
});

// 3. Document upload limiter: 50 per 10 minutes (allows multi-doc upload)
export const documentUploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: 'Document upload rate limit exceeded. Please wait a few minutes before uploading further documents.'
});

// 4. Public enquiry limiter: 20 per 10 minutes
export const enquiryLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Enquiry rate limit exceeded. Please try again shortly.'
});
