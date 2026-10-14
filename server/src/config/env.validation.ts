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

    /**
     * Reward-hold window in hours (locked default 168 = 7 days from ORDER_COMPLETED).
     * Configurable only so staging/tests can exercise the release mechanics end-to-end.
     */
    COMMISSION_HOLD_HOURS: z.coerce.number().int().min(0).default(168),

    /**
     * Acting admin user for payout decisions (approve/reject/complete). The audit columns
     * reviewed_by_user_id / completed_by_user_id are NOT NULL for those statuses, so a real
     * user id must be configured; without it admin payout actions answer 503.
     */
    ADMIN_ACTOR_USER_ID: z.string().uuid().optional(),

    /** Swagger UI toggle — default OFF (production-safe: the docs map every admin route). */
    DOCS_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),

    /** Exact browser origins allowed to call the API (comma-separated). Empty = CORS disabled. */
    CORS_ALLOWED_ORIGINS: z.string().optional(),

    /**
     * Replay defence for signed webhooks: how old (or how far in the future) an
     * `x-andos-timestamp` may be. Default 300 s. Ignored when the header is absent and
     * WEBHOOK_REQUIRE_TIMESTAMP is false.
     */
    WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: z.coerce.number().int().min(1).max(3600).default(300),

    /**
     * When true, every verified webhook MUST carry `x-andos-timestamp` and the signature MUST
     * be computed over `${timestamp}.${rawBody}` (binding). Production refuses to boot with
     * this disabled — a body-only signature is replayable forever.
     */
    WEBHOOK_REQUIRE_TIMESTAMP: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),

    /**
     * Secret pepper for visitor-token hashing (click dedupe). When set, visitor tokens are
     * HMAC-SHA256(pepper, token) instead of a bare SHA-256, so a stolen database cannot be
     * brute-forced back to device tokens. Required in production (min 16 chars).
     */
    VISITOR_HASH_PEPPER: z.string().min(16).optional(),

    /**
     * Express `trust proxy` setting — how X-Forwarded-For is interpreted for client IPs and
     * rate limiting. `false` (default) = no proxy; a number = hops to trust; `true` = trust
     * the left-most header; or a comma-separated IP/CIDR list.
     */
    TRUST_PROXY: z.string().default('false'),

    /**
     * Emit one structured JSON log line per HTTP request (request id, route, status, duration).
     * Off in tests to keep the suite output readable.
     */
    REQUEST_LOG_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
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
      if (!env.WEBHOOK_REQUIRE_TIMESTAMP) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['WEBHOOK_REQUIRE_TIMESTAMP'],
          message:
            'must be true in production — without a bound timestamp a captured webhook body can be replayed',
        });
      }
      if (!env.VISITOR_HASH_PEPPER) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['VISITOR_HASH_PEPPER'],
          message: 'is required in production (unpeppered visitor hashes are guessable)',
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
