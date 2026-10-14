import { buildRequestLogPayload, sanitizeRequestId } from './request-logging.middleware';

describe('sanitizeRequestId', () => {
  it('keeps a client-supplied id when it is safe and bounded', () => {
    expect(sanitizeRequestId('trace-123_abc.4')).toBe('trace-123_abc.4');
  });

  it('rejects empty, over-long or unsafe values', () => {
    expect(sanitizeRequestId(undefined)).toBeNull();
    expect(sanitizeRequestId('')).toBeNull();
    expect(sanitizeRequestId('a'.repeat(129))).toBeNull();
    expect(sanitizeRequestId('bad\nvalue')).toBeNull();
  });

  it('accepts the first value when the header is repeated', () => {
    expect(sanitizeRequestId(['first', 'second'])).toBe('first');
  });
});

describe('buildRequestLogPayload', () => {
  it('marks 5xx as errors and rounds the duration', () => {
    const payload = buildRequestLogPayload({
      requestId: 'r-1',
      method: 'POST',
      route: '/v1/order-events/verified',
      status: 500,
      durationMs: 12.3456,
    });
    expect(payload.level).toBe('error');
    expect(payload.durationMs).toBe(12.35);
    expect(payload.msg).toBe('http_request');
  });

  it('stays info for 4xx and includes the user when known', () => {
    const payload = buildRequestLogPayload({
      requestId: 'r-2',
      method: 'GET',
      route: '/v1/wallet',
      status: 404,
      durationMs: 1,
      userId: 'user-1',
    });
    expect(payload.level).toBe('info');
    expect(payload.userId).toBe('user-1');
  });
});
