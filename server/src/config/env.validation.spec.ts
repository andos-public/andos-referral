import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const base = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db?schema=referral_app',
  };

  it('applies defaults for optional values', () => {
    const env = validateEnv({ ...base });
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
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
});
