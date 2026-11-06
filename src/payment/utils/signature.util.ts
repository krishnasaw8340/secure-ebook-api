import { createHmac, timingSafeEqual } from 'crypto';

/** Constant-time string comparison; false on length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function hmacSha256(
  secret: string,
  payload: Buffer | string,
  encoding: 'hex' | 'base64' = 'hex',
): string {
  return createHmac('sha256', secret).update(payload).digest(encoding);
}

/**
 * Helper for adapters whose provider signs `HMAC-SHA256(secret, rawBody)`.
 * Tolerates an optional "sha256=" prefix on the received signature.
 */
export function verifyHmacSha256(
  secret: string,
  rawBody: Buffer,
  receivedSignature: string | undefined,
  encoding: 'hex' | 'base64' = 'hex',
): boolean {
  if (!secret || !receivedSignature) return false;
  const received = receivedSignature.replace(/^sha256=/i, '').trim();
  return safeEqual(hmacSha256(secret, rawBody, encoding), received);
}
