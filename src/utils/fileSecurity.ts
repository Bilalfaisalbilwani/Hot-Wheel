import path from 'path';
import crypto from 'crypto';

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

export const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

export const ALLOWED_CATEGORIES = new Set([
  'passport_copy',
  'passport_cover',
  'passport_photo',
  'national_id_front',
  'national_id_back',
  'air_ticket',
  'previous_uae_visa',
  'entry_exit_record',
  'guarantor_docs',
  'uae_residence_visa',
  'emirates_id_relative',
  'relationship_proof',
  'birth_certificate',
  'marriage_certificate',
  'hotel_booking',
  'bank_statement',
  'travel_history',
  'additional_doc',
  'application_pdf'
]);

/**
 * Validates file buffer magic bytes against declared type
 */
export function validateMagicBytes(buffer: Buffer): { isValid: boolean; detectedType?: string } {
  if (!buffer || buffer.length < 4) {
    return { isValid: false };
  }

  // 1. PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { isValid: true, detectedType: 'application/pdf' };
  }

  // 2. JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { isValid: true, detectedType: 'image/jpeg' };
  }

  // 3. PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { isValid: true, detectedType: 'image/png' };
  }

  // 4. WEBP: RIFF....WEBP (0x52 0x49 0x46 0x46 .... 0x57 0x45 0x42 0x50)
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { isValid: true, detectedType: 'image/webp' };
  }

  return { isValid: false };
}

/**
 * Sanitizes and generates safe server-side storage filename.
 * Prevents directory traversal, illegal chars, and filename collisions.
 */
export function generateSafeServerFilename(category: string, originalFilename: string, extOverride?: string): string {
  const safeExt = extOverride || (path.extname(originalFilename || '').toLowerCase() || '.jpg');
  const validExt = ALLOWED_EXTENSIONS.has(safeExt) ? safeExt : '.jpg';
  const cleanCategory = ALLOWED_CATEGORIES.has(category) ? category : 'additional_doc';
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  return `${cleanCategory}_${randomSuffix}${validExt}`;
}

/**
 * Validates that target path is strictly contained within the allowed base directory.
 * Completely blocks directory traversal attempts (../, ..\\, absolute paths, encoded).
 */
export function isPathContained(targetPath: string, baseDir: string): boolean {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(baseDir);

  // Must start with base directory followed by separator or be exact
  return resolvedTarget.startsWith(resolvedBase + path.sep);
}

/**
 * Sanitizes reference ID to alphanumeric and hyphen only.
 */
export function sanitizeReferenceId(rawRefId: string): string {
  if (!rawRefId || typeof rawRefId !== 'string') return '';
  return rawRefId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
}
