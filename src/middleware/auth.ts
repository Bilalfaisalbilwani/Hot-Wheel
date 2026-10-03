import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { getUserByUid } from '../db/users.ts';

export interface AuthUser {
  uid: string;
  email?: string;
  role: string;
  authProvider?: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken | AuthUser;
}

export interface AdminTokenPayload {
  uid: string;
  email?: string;
  role: string;
  type: 'admin_session';
  iat: number;
  exp: number;
  jti: string;
}

export interface ApplicantTokenPayload {
  refId: string;
  type: 'applicant_doc_access' | 'upload_session';
  iat: number;
  exp: number;
}

// Token Validity: 24 hours for admin sessions
const ADMIN_TOKEN_TTL_SECONDS = 24 * 60 * 60;

// Ephemeral fallback key generated at runtime in memory - never committed or static!
const EPHEMERAL_RUNTIME_KEY = crypto.randomBytes(32).toString('hex');

// Revoked token store (for explicit logouts)
const revokedTokenIds = new Set<string>();
let globalRevokedBeforeTimestamp = 0;
const MAX_REVOKED_TOKENS = 10000;

function cleanRevocationStore() {
  if (revokedTokenIds.size > MAX_REVOKED_TOKENS) {
    revokedTokenIds.clear();
  }
}

/**
 * Derives a cryptographically strong 256-bit secret key for HMAC token signing.
 * Prefers explicit JWT_SECRET, ADMIN_KEY, ADMIN_PASSWORD from environment variables,
 * or an unguessable ephemeral key generated in memory per server lifecycle.
 */
function getSigningKey(): Buffer {
  const secret = process.env.JWT_SECRET || 
                 process.env.ADMIN_KEY || 
                 process.env.ADMIN_PASSWORD || 
                 process.env.ADMIN_SECRET || 
                 process.env.SESSION_SECRET || 
                 EPHEMERAL_RUNTIME_KEY;

  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Creates a cryptographically signed, stateless JWT admin session token.
 */
export function createAdminSession(user?: { uid?: string; email?: string }): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const jti = crypto.randomBytes(16).toString('hex');

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload: AdminTokenPayload = {
    uid: user?.uid || 'admin-root',
    email: user?.email || (process.env.ADMIN_EMAIL || 'admin@zonetourism.ae'),
    role: 'admin',
    type: 'admin_session',
    iat: nowSeconds,
    exp: nowSeconds + ADMIN_TOKEN_TTL_SECONDS,
    jti
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const dataToSign = `${headerB64}.${payloadB64}`;

  const key = getSigningKey();
  const signatureB64 = crypto.createHmac('sha256', key).update(dataToSign).digest('base64url');

  return `${dataToSign}.${signatureB64}`;
}

/**
 * Verifies a signed JWT admin session token.
 */
export function verifyAdminSessionToken(token: string): AuthUser | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const key = getSigningKey();
    const dataToSign = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto.createHmac('sha256', key).update(dataToSign).digest('base64url');

    const sigBuf = Buffer.from(signatureB64);
    const expectedSigBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedSigBuf.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuf, expectedSigBuf)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: AdminTokenPayload = JSON.parse(payloadJson);

    if (payload.type !== 'admin_session' || payload.role !== 'admin') {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    if (nowSeconds > payload.exp) {
      return null;
    }
    if (payload.iat > nowSeconds + 60) {
      return null;
    }

    if (payload.jti && revokedTokenIds.has(payload.jti)) {
      return null;
    }
    if (payload.iat < globalRevokedBeforeTimestamp) {
      return null;
    }

    return {
      uid: payload.uid,
      email: payload.email,
      role: payload.role,
      authProvider: 'admin_signed_session'
    };
  } catch {
    return null;
  }
}

/**
 * Invalidates an admin session token on logout.
 */
export function invalidateAdminSession(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload: AdminTokenPayload = JSON.parse(payloadJson);
      if (payload.jti) {
        cleanRevocationStore();
        revokedTokenIds.add(payload.jti);
        return true;
      }
    } catch {
      // Ignore
    }
  }

  cleanRevocationStore();
  revokedTokenIds.add(crypto.createHash('sha256').update(token).digest('hex'));
  return true;
}

/**
 * Generates a signed, temporary token for an applicant to access their own application documents.
 * Token expires in expirySeconds (default 7 days).
 */
export function createApplicantDocumentToken(referenceId: string, expirySeconds: number = 7 * 24 * 60 * 60): string {
  const cleanRef = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const now = Math.floor(Date.now() / 1000);
  const payload: ApplicantTokenPayload = {
    refId: cleanRef,
    type: 'applicant_doc_access',
    iat: now,
    exp: now + expirySeconds
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const key = getSigningKey();
  const sig = crypto.createHmac('sha256', key).update(`applicant.${payloadB64}`).digest('base64url');
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies that a document access token is genuine, unexpired, and matches the requested reference ID.
 */
export function verifyApplicantDocumentToken(token: string, referenceId: string): boolean {
  if (!token || typeof token !== 'string' || !referenceId) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;
  try {
    const key = getSigningKey();
    const expectedSig = crypto.createHmac('sha256', key).update(`applicant.${payloadB64}`).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const payload: ApplicantTokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (now > payload.exp) return false;
    if (payload.type !== 'applicant_doc_access') return false;

    const cleanRef = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
    return payload.refId.toLowerCase() === cleanRef.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Generates a signed upload session token for an application submission.
 * Token is bound to referenceId and expires in 2 hours (7200 seconds).
 */
export function createUploadSessionToken(referenceId: string, expirySeconds: number = 7200): string {
  const cleanRef = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const now = Math.floor(Date.now() / 1000);
  const payload: ApplicantTokenPayload = {
    refId: cleanRef,
    type: 'upload_session',
    iat: now,
    exp: now + expirySeconds
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const key = getSigningKey();
  const sig = crypto.createHmac('sha256', key).update(`upload.${payloadB64}`).digest('base64url');
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies that an upload token is genuine, unexpired, and matches the application reference ID.
 */
export function verifyUploadSessionToken(token: string, referenceId: string): boolean {
  if (!token || typeof token !== 'string' || !referenceId) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;
  try {
    const key = getSigningKey();
    const expectedSig = crypto.createHmac('sha256', key).update(`upload.${payloadB64}`).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }

    const payload: ApplicantTokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (now > payload.exp) return false;
    if (payload.type !== 'upload_session') return false;

    const cleanRef = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
    return payload.refId.toLowerCase() === cleanRef.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Timing-safe password/secret comparison to prevent side-channel timing attacks.
 * Fails closed if no secret is configured in environment variables.
 * NO development shortcuts (admin123 removed).
 */
export function verifyAdminSecret(candidatePassword: string): boolean {
  const configuredSecret = process.env.ADMIN_KEY || 
                           process.env.ADMIN_PASSWORD || 
                           process.env.ADMIN_SECRET;
  
  if (!configuredSecret || typeof configuredSecret !== 'string' || configuredSecret.trim().length === 0) {
    console.error('[AUTH ERROR] No ADMIN_KEY configured in server environment. Admin authentication rejected.');
    return false;
  }

  const trimmedCandidate = candidatePassword.trim();
  const trimmedSecret = configuredSecret.trim();

  const candidateBuf = Buffer.from(trimmedCandidate);
  const secretBuf = Buffer.from(trimmedSecret);

  if (candidateBuf.length !== secretBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuf, secretBuf);
}

/**
 * Middleware to enforce admin authentication & authorization on all admin CRUD routes.
 */
export const requireAdminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing authentication token." });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized: Empty authentication token." });
  }

  // 1. Check if token is a cryptographically signed admin session token
  const sessionUser = verifyAdminSessionToken(token);
  if (sessionUser) {
    req.user = sessionUser;
    return next();
  }

  // 2. Otherwise verify as Firebase ID Token
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.admin === true || decodedToken.role === 'admin') {
      req.user = decodedToken;
      return next();
    }

    if (decodedToken.email) {
      const allowedEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);
      if (allowedEmails.includes(decodedToken.email.toLowerCase())) {
        req.user = decodedToken;
        return next();
      }
    }

    return res.status(403).json({ 
      success: false, 
      error: "Forbidden: You do not have administrator permissions." 
    });
  } catch {
    return res.status(401).json({ 
      success: false, 
      error: "Unauthorized: Invalid or expired admin authentication token." 
    });
  }
};

/**
 * Middleware protecting sensitive visa application PDFs & customer documents.
 * Allows access ONLY IF:
 * 1. An authenticated admin is making the request, OR
 * 2. An applicant presents a valid, unexpired document access token issued for that application.
 */
export const requireDocumentAccessAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const refId = req.params.refId || (req.query.refId as string);
  if (!refId) {
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(400).json({ success: false, error: "Missing application reference ID." });
  }

  // 1. Check Bearer token in header (Admin or Token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (verifyAdminSessionToken(token)) {
      return next();
    }
    if (verifyApplicantDocumentToken(token, refId)) {
      return next();
    }
  }

  // 2. Check query parameter ?token=... (for secure browser PDF views / direct links)
  const queryToken = (req.query.token as string) || (req.query.auth as string);
  if (queryToken) {
    if (verifyAdminSessionToken(queryToken)) {
      return next();
    }
    if (verifyApplicantDocumentToken(queryToken, refId)) {
      return next();
    }
  }

  // Unauthorized access
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(403).json({ 
    success: false, 
    error: "Forbidden: Unauthorized access to sensitive visa application documents. Valid authorization token required." 
  });
};

/**
 * Middleware ensuring file uploads (documents, PDFs) are authorized with a valid session token.
 */
export const requireUploadSessionAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const refId = req.body?.referenceId || (req.query.refId as string) || (req.params.refId as string);
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split('Bearer ')[1].trim()
    : ((req.body?.uploadToken || req.body?.token || req.query.token) as string);

  if (!refId) {
    return res.status(400).json({ success: false, error: "Missing application reference ID." });
  }

  // 1. Allow authenticated admin
  if (token && verifyAdminSessionToken(token)) {
    return next();
  }

  // 2. Allow active upload session token
  if (token && verifyUploadSessionToken(token, refId)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: "Forbidden: Upload session is invalid, expired, or not authorized for this reference ID."
  });
};

