import {
  PUBLIC_CODE_PATTERN,
  buildShareUrl,
  computeCodeState,
  generatePublicCode,
  hashVisitorToken,
  normalizePublicCode,
} from './referral-code.util';

describe('referral-code.util', () => {
  describe('computeCodeState', () => {
    const now = new Date('2026-10-13T12:00:00.000Z');

    it('is ACTIVE for an evergreen link (expiresAt = null)', () => {
      expect(computeCodeState({ isActive: true, expiresAt: null }, now)).toBe('ACTIVE');
    });

    it('is ACTIVE before expiry', () => {
      expect(
        computeCodeState({ isActive: true, expiresAt: new Date(now.getTime() + 1000) }, now),
      ).toBe('ACTIVE');
    });

    it('is EXPIRED exactly at the expiry instant', () => {
      expect(computeCodeState({ isActive: true, expiresAt: now }, now)).toBe('EXPIRED');
      expect(
        computeCodeState({ isActive: true, expiresAt: new Date(now.getTime() - 1) }, now),
      ).toBe('EXPIRED');
    });

    it('is INACTIVE when deactivated, regardless of expiry', () => {
      expect(
        computeCodeState({ isActive: false, expiresAt: new Date(now.getTime() + 100000) }, now),
      ).toBe('INACTIVE');
      expect(computeCodeState({ isActive: false, expiresAt: null }, now)).toBe('INACTIVE');
    });
  });

  describe('generatePublicCode', () => {
    it('matches the unambiguous alphabet pattern', () => {
      for (let i = 0; i < 200; i += 1) {
        expect(generatePublicCode()).toMatch(PUBLIC_CODE_PATTERN);
      }
    });

    it('is not sequential', () => {
      const codes = new Set(Array.from({ length: 50 }, () => generatePublicCode()));
      expect(codes.size).toBe(50);
    });
  });

  describe('normalizePublicCode', () => {
    it('trims and upper-cases input', () => {
      expect(normalizePublicCode('  ab7kq29m ')).toBe('AB7KQ29M');
    });
  });

  describe('buildShareUrl', () => {
    it('appends the code to the configured base URL', () => {
      expect(buildShareUrl('https://andostpsite.vercel.app/#ref=', 'AB7KQ29M')).toBe(
        'https://andostpsite.vercel.app/#ref=AB7KQ29M',
      );
    });
  });

  describe('hashVisitorToken', () => {
    it('is deterministic, one-way-shaped, and not the raw token', () => {
      const hash = hashVisitorToken('device-token-12345678');
      expect(hash).toBe(hashVisitorToken('device-token-12345678'));
      expect(hash).toMatch(/^[0-9a-f]{32}$/);
      expect(hash).not.toContain('device-token');
    });

    it('differs for different tokens', () => {
      expect(hashVisitorToken('a-device-token-1')).not.toBe(hashVisitorToken('a-device-token-2'));
    });
  });
});
