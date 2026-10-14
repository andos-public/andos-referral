import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const base = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=referral_app',
  };

  it('applies defaults for optional values', () => {
    const env = validateEnv({ ...base });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.TRUSTED_USER_HEADER_AUTH).toBe(false);
    expect(env.REFERRAL_LINK_BASE_URL).toBe('https://andostpsite.vercel.app/#ref=');
  });

  it('coerces PORT from a string', () => {
    expect(validateEnv({ ...base, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrowError(/DATABASE_URL/);
  });

  it('rejects a non-positive PORT', () => {
    expect(() => validateEnv({ ...base, PORT: '-1' })).toThrowError(/PORT/);
  });

  it('parses TRUSTED_USER_HEADER_AUTH as a real boolean', () => {
    expect(validateEnv({ ...base, TRUSTED_USER_HEADER_AUTH: 'true' }).TRUSTED_USER_HEADER_AUTH).toBe(
      true,
    );
    expect(
      validateEnv({ ...base, TRUSTED_USER_HEADER_AUTH: 'false' }).TRUSTED_USER_HEADER_AUTH,
    ).toBe(false);
  });

  it('refuses trusted-header auth in production', () => {
    expect(() =>
      validateEnv({ ...base, NODE_ENV: 'production', TRUSTED_USER_HEADER_AUTH: 'true' }),
    ).toThrowError(/TRUSTED_USER_HEADER_AUTH/);
  });

  it('requires ADMIN_API_KEY and webhook secret in production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production' })).toThrowError(/ADMIN_API_KEY/);
    expect(() =>
      validateEnv({ ...base, NODE_ENV: 'production', ADMIN_API_KEY: 'super-secret-key' }),
    ).toThrowError(/MAIN_APP_WEBHOOK_SECRET/);
  });

  // ── Sprint 4 hardening rules ──────────────────────────────────────────────
  const prodBase = {
    ...base,
    NODE_ENV: 'production',
    ADMIN_API_KEY: 'super-secret-key',
    MAIN_APP_WEBHOOK_SECRET: 'super-secret-webhook',
  };

  it('defaults the replay-defence knobs', () => {
    const env = validateEnv({ ...base });
    expect(env.WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS).toBe(300);
    expect(env.WEBHOOK_REQUIRE_TIMESTAMP).toBe(false);
    expect(env.TRUST_PROXY).toBe('false');
    expect(env.REQUEST_LOG_ENABLED).toBe(true);
  });

  it('coerces the timestamp tolerance and rejects nonsense values', () => {
    expect(validateEnv({ ...base, WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: '60' }).WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS).toBe(60);
    expect(() => validateEnv({ ...base, WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: '0' })).toThrowError(
      /WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS/,
    );
  });

  it('refuses a missing pepper or body-only signatures in production', () => {
    expect(() => validateEnv({ ...prodBase, WEBHOOK_REQUIRE_TIMESTAMP: 'true' })).toThrowError(/VISITOR_HASH_PEPPER/);
    expect(() => validateEnv({ ...prodBase, VISITOR_HASH_PEPPER: 'sixteen-chars-min' })).toThrowError(
      /WEBHOOK_REQUIRE_TIMESTAMP/,
    );
  });

  it('accepts a fully hardened production environment', () => {
    const env = validateEnv({
      ...prodBase,
      WEBHOOK_REQUIRE_TIMESTAMP: 'true',
      VISITOR_HASH_PEPPER: 'sixteen-chars-min',
    });
    expect(env.WEBHOOK_REQUIRE_TIMESTAMP).toBe(true);
    expect(env.VISITOR_HASH_PEPPER).toBe('sixteen-chars-min');
  });

  it('rejects a pepper shorter than 16 characters', () => {
    expect(() => validateEnv({ ...base, VISITOR_HASH_PEPPER: 'short' })).toThrowError(/VISITOR_HASH_PEPPER/);
  });
});
