/**
 * Signed post-payment delivery tokens.
 *
 * A download URL is a bearer credential, so it is HMAC-signed, time-bounded,
 * and bound to one grant. The token asserts nothing by itself: the edge still
 * loads the grant, checks expiry, and consumes a download slot, so a replayed
 * token cannot exceed the grant's limits.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export class InvalidDeliveryTokenError extends Error {
  constructor(message = 'Delivery token is invalid.') {
    super(message);
    this.name = 'InvalidDeliveryTokenError';
  }
}

export interface DeliveryTokenPayload {
  grantId: string;
  experimentId: string;
  assetId: string;
  expiresAt: string;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

export function mintDeliveryToken(payload: DeliveryTokenPayload, secret: string): string {
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret).update(body).digest('base64url');
  return `v1.${body}.${signature}`;
}

export function verifyDeliveryToken(
  token: string,
  secret: string,
  nowIso: string,
): DeliveryTokenPayload {
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') throw new InvalidDeliveryTokenError();
  const [, body, signature] = parts;
  const expected = createHmac('sha256', secret).update(body).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    throw new InvalidDeliveryTokenError();
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new InvalidDeliveryTokenError('Delivery token signature does not verify.');
  }
  let payload: DeliveryTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as DeliveryTokenPayload;
  } catch {
    throw new InvalidDeliveryTokenError('Delivery token payload is not readable.');
  }
  if (!payload.grantId || !payload.experimentId || !payload.assetId || !payload.expiresAt) {
    throw new InvalidDeliveryTokenError('Delivery token payload is incomplete.');
  }
  if (Date.parse(payload.expiresAt) <= Date.parse(nowIso)) {
    throw new InvalidDeliveryTokenError('Delivery token has expired.');
  }
  return payload;
}
