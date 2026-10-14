/**
 * Runs BEFORE any test file import (jest `setupFiles`), so the app module sees a
 * fully controlled environment and the developer .env can never leak into e2e runs.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??=
  'postgresql://referral:referral@127.0.0.1:5432/referral?schema=referral_app';
process.env.TRUSTED_USER_HEADER_AUTH = 'true';
process.env.ADMIN_API_KEY = 'e2e-admin-key';
process.env.MAIN_APP_WEBHOOK_SECRET = 'e2e-webhook-secret';
process.env.REFERRAL_LINK_BASE_URL = 'https://andostpsite.vercel.app/#ref=';
process.env.THROTTLE_LIMIT = '100000';
process.env.DOCS_ENABLED = 'true'; // exercise the real bootstrap wiring (CORS + /docs) in e2e
process.env.COMMISSION_HOLD_HOURS = '168'; // locked default; the holds spec overrides it locally
process.env.CORS_ALLOWED_ORIGINS = 'https://andostpsite.vercel.app';
