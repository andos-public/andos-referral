import { parseTrustProxy } from './trust-proxy.util';

describe('parseTrustProxy', () => {
  it('defaults to disabled', () => {
    expect(parseTrustProxy(undefined)).toBe(false);
    expect(parseTrustProxy('')).toBe(false);
    expect(parseTrustProxy('false')).toBe(false);
    expect(parseTrustProxy('FALSE')).toBe(false);
  });

  it('accepts a hop count', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('2')).toBe(2);
  });

  it('accepts true and IP/CIDR lists', () => {
    expect(parseTrustProxy('true')).toBe(true);
    expect(parseTrustProxy('loopback, 10.0.0.0/8')).toBe('loopback, 10.0.0.0/8');
  });
});
