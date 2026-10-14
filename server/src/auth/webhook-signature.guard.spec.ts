import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import {
  buildSignedPayload,
  parseTimestampHeader,
  TIMESTAMP_HEADER,
  WebhookSignatureGuard,
} from './webhook-signature.guard';

const SECRET = 'unit-test-secret';

function guardWith(config: Record<string, unknown>): WebhookSignatureGuard {
  const service = {
    get: (key: string) => ({ MAIN_APP_WEBHOOK_SECRET: SECRET, ...config })[key],
  } as unknown as ConfigService;
  return new WebhookSignatureGuard(service);
}

function contextFor(headers: Record<string, string | undefined>, rawBody: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, rawBody: Buffer.from(rawBody, 'utf8') }),
    }),
  } as never;
}

const signBody = (body: string) => createHmac('sha256', SECRET).update(Buffer.from(body)).digest('hex');
const signBound = (timestamp: string, body: string) =>
  createHmac('sha256', SECRET).update(buildSignedPayload(Buffer.from(body), timestamp)).digest('hex');

describe('WebhookSignatureGuard — timestamp binding & replay window', () => {
  const body = JSON.stringify({ eventType: 'ORDER_COMPLETED', orderId: 'o-1' });

  it('accepts a legacy body-only signature when no timestamp is required', () => {
    const guard = guardWith({});
    expect(guard.canActivate(contextFor({ 'x-andos-signature': signBody(body) }, body))).toBe(true);
  });

  it('accepts the sha256= prefix form', () => {
    const guard = guardWith({});
    expect(guard.canActivate(contextFor({ 'x-andos-signature': `sha256=${signBody(body)}` }, body))).toBe(true);
  });

  it('rejects a body-only signature when the timestamp is required (production)', () => {
    const guard = guardWith({ WEBHOOK_REQUIRE_TIMESTAMP: true });
    expect(() => guard.canActivate(contextFor({ 'x-andos-signature': signBody(body) }, body))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts a timestamp-bound signature inside the tolerance window', () => {
    const guard = guardWith({});
    const timestamp = String(Math.floor(Date.now() / 1000));
    const headers = { 'x-andos-signature': signBound(timestamp, body), [TIMESTAMP_HEADER]: timestamp };
    expect(guard.canActivate(contextFor(headers, body))).toBe(true);
  });

  it('accepts an ISO-8601 timestamp header', () => {
    const guard = guardWith({});
    const timestamp = new Date().toISOString();
    const headers = { 'x-andos-signature': signBound(timestamp, body), [TIMESTAMP_HEADER]: timestamp };
    expect(guard.canActivate(contextFor(headers, body))).toBe(true);
  });

  it('rejects a stale timestamp (replay)', () => {
    const guard = guardWith({ WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: 300 });
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    const headers = { 'x-andos-signature': signBound(old, body), [TIMESTAMP_HEADER]: old };
    expect(() => guard.canActivate(contextFor(headers, body))).toThrow(/Stale webhook timestamp/);
  });

  it('rejects a far-future timestamp', () => {
    const guard = guardWith({ WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: 300 });
    const future = String(Math.floor(Date.now() / 1000) + 3600);
    const headers = { 'x-andos-signature': signBound(future, body), [TIMESTAMP_HEADER]: future };
    expect(() => guard.canActivate(contextFor(headers, body))).toThrow(/too far in the future/);
  });

  it('rejects a fresh timestamp with a body-only signature (binding is mandatory)', () => {
    const guard = guardWith({});
    const timestamp = String(Math.floor(Date.now() / 1000));
    // Signed the body only, but the request carries a timestamp → must not verify.
    const headers = { 'x-andos-signature': signBody(body), [TIMESTAMP_HEADER]: timestamp };
    expect(() => guard.canActivate(contextFor(headers, body))).toThrow(/Invalid event signature/);
  });

  it('rejects a timestamp-bound signature replayed with a different timestamp', () => {
    const guard = guardWith({});
    const signedAt = String(Math.floor(Date.now() / 1000) - 120);
    const replayedWith = String(Math.floor(Date.now() / 1000));
    const headers = { 'x-andos-signature': signBound(signedAt, body), [TIMESTAMP_HEADER]: replayedWith };
    expect(() => guard.canActivate(contextFor(headers, body))).toThrow(/Invalid event signature/);
  });

  it('rejects a malformed timestamp header', () => {
    const guard = guardWith({});
    const headers = { 'x-andos-signature': signBody(body), [TIMESTAMP_HEADER]: 'not-a-time' };
    expect(() => guard.canActivate(contextFor(headers, body))).toThrow(/Malformed/);
  });

  it('rejects a tampered body even with a valid timestamp', () => {
    const guard = guardWith({});
    const timestamp = String(Math.floor(Date.now() / 1000));
    const headers = { 'x-andos-signature': signBound(timestamp, body), [TIMESTAMP_HEADER]: timestamp };
    const tampered = JSON.stringify({ eventType: 'ORDER_COMPLETED', orderId: 'o-EVIL' });
    expect(() => guard.canActivate(contextFor(headers, tampered))).toThrow(/Invalid event signature/);
  });
});

describe('parseTimestampHeader', () => {
  it('parses unix seconds, unix millis and ISO-8601', () => {
    expect(parseTimestampHeader('1700000000')).toBe(1_700_000_000_000);
    expect(parseTimestampHeader('1700000000000')).toBe(1_700_000_000_000);
    expect(parseTimestampHeader('2023-11-14T22:13:20.000Z')).toBe(1_700_000_000_000);
  });

  it('returns null for unusable values', () => {
    expect(parseTimestampHeader('')).toBeNull();
    expect(parseTimestampHeader('yesterday')).toBeNull();
  });
});
