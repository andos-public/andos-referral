import { z } from 'zod';

// Fails fast at boot if required configuration is missing or malformed.
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    MAIN_APP_WEBHOOK_SECRET: z.string().min(1).optional(),

    /**
     * TEMPORARY Phase-1 identity strategy: trust the `x-user-id` header. This is a local/dev
     * convenience only — production boot refuses to start with it enabled.
     */
    TRUSTED_USER_HEADER_AUTH: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),

    /** Admin API key for the authorized referral-code views (Phase-5 admin console placeholder). */
    ADMIN_API_KEY: z.string().min(8).optional(),

    /** Base URL of the public referral landing page; the share URL is `base + publicCode`. */
    REFERRAL_LINK_BASE_URL: z.string().url().default('https://andostpsite.vercel.app/#ref='),

    /** Global request throttle (public routes may override, e.g. the click endpoint). */
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(300),
    THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (env.TRUSTED_USER_HEADER_AUTH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['TRUSTED_USER_HEADER_AUTH'],
          message: 'the temporary trusted-header identity strategy must be disabled in production',
        });
      }
      if (!env.ADMIN_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ADMIN_API_KEY'],
          message: 'is required in production',
        });
      }
      if (!env.MAIN_APP_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['MAIN_APP_WEBHOOK_SECRET'],
          message: 'is required in production (verified event signature verification)',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration — ${issues}`);
  }
  return parsed.data;
}
