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
});
