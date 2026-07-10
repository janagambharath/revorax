import * as crypto from 'crypto';

/**
 * AES-256-GCM encryption for sensitive credentials (WhatsApp tokens, PII).
 * Uses the ENCRYPTION_KEY env var (must be 32 bytes / 64 hex chars).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn('[Encryption] ENCRYPTION_KEY not set — using fallback. DO NOT use in production.');
    // Fallback for dev only — generates deterministic key from a seed
    return crypto.scryptSync('revorax-dev-key', 'revorax-salt', 32);
  }
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  // If key is a passphrase, derive a proper key
  return crypto.scryptSync(key, 'revorax-encryption', 32);
}

/**
 * Encrypt a plaintext string.
 * Returns: base64 string containing IV + ciphertext + auth tag.
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  // Format: iv:encrypted:tag (all hex)
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypt an encrypted string back to plaintext.
 * Expects the format: iv:encrypted:tag (all hex).
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

  const key = getKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }

  const [ivHex, encrypted, tagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a string looks like it's already encrypted (has the iv:data:tag format).
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}

/**
 * Encrypt a value only if it's not already encrypted.
 */
export function encryptIfNeeded(value: string): string {
  if (!value || isEncrypted(value)) return value;
  return encrypt(value);
}

/**
 * Decrypt a value only if it looks encrypted.
 */
export function decryptIfNeeded(value: string): string {
  if (!value || !isEncrypted(value)) return value;
  return decrypt(value);
}
