# Andos Referral — Server (NestJS)

Phase 1 backend foundation for the referral service.

## Stack

NestJS 11 · TypeScript · Prisma · PostgreSQL · (Redis/BullMQ wired in a later sprint)

## Local setup

```bash
# 1. database + redis
docker compose up -d

# 2. environment
cp .env.example .env

# 3. install, migrate, run
npm install
npx prisma migrate dev
npm run start:dev
```

- API:     http://localhost:3000/v1
- Health:  http://localhost:3000/v1/health
- Swagger: http://localhost:3000/docs

## Layout

```
prisma/schema.prisma       Phase-1 data model (ported 1:1 from the approved draft DDL)
prisma/migrations/         SQL incl. CHECK constraints + functional/partial indexes + seeds
src/config/                environment validation (zod, fail-fast at boot)
src/prisma/                PrismaService (global module) + liveness probe
src/health/                /v1/health endpoint (reports DB connectivity)
src/auth/                  identity guard (temporary), admin guard, HMAC webhook guard
src/referral-codes/        Invite Hub: create/list/read/deactivate/metrics + admin views
src/link-events/           click tracking + HMAC-verified referral/conversion events
test/                      e2e suite against real PostgreSQL (jest-e2e.json)
```

## API (Sprint 1 — Invite Hub)

Base path `/v1`. Full interactive docs: `GET /docs` (Swagger).

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/referral-codes` | `x-user-id` | body `{ expiresAt?, campaignId? }`; `expiresAt` omitted/null = evergreen; past dates rejected |
| GET | `/referral-codes` | `x-user-id` | `?state=ALL\|ACTIVE\|EXPIRED\|INACTIVE&limit&offset`, newest first |
| GET | `/referral-codes/:id` | `x-user-id` | foreign/unknown id → 404 |
| POST | `/referral-codes/:id/deactivate` | `x-user-id` | idempotent |
| GET | `/referral-codes/:id/metrics` | `x-user-id` | `clickCount · uniqueClickCount · referralCount · conversionCount` |
| POST | `/referral-link-events` | public | click beacon; `visitorToken` optional → enables window dedupe; rate-limit 60/min |
| POST | `/referral-link-events/verified/referral` | HMAC | signed signup/attribution event; `referredUserId` required; replay-safe per `sourceEventId` |
| POST | `/referral-link-events/verified/conversion` | HMAC | signed conversion event; amounts/commission are Sprint 3 |
| GET | `/admin/referral-codes` | `x-admin-key` | cross-referrer list; `?ownerUserId&publicCode&state&limit&offset` |
| GET | `/admin/referral-codes/:id` | `x-admin-key` | single link with owner info |
| GET | `/admin/referral-codes/summary` | `x-admin-key` | link-state counts + metric totals |

## API (Sprint 2 — integration & attribution)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/main-app-events/verified` | HMAC | `{ eventType: SIGNUP \| INSTALL_LOGIN, publicCode, referredUserId, sourceEventId, occurredAt?, sourceSystem?, safeMetadata? }`; idempotent per `sourceEventId`; `INSTALL_LOGIN` stamps the verified install/login and unlocks referral chat; self-referral → `SELF_REFERRAL`; lifecycle events are honoured after the link is deactivated (only *new* attributions require an ACTIVE code); `safeMetadata` ≤ 2048 bytes |
| GET | `/referrals` | `x-user-id` | my referrals (as referrer), newest first; `?chatState=LOCKED\|UNLOCKED&status&limit&offset`; milestone projection per item |
| GET | `/referrals/:id` | `x-user-id` | participants only (referrer or referred user); foreign/unknown → 404; includes verified event timeline + `viewerRole` |
| GET | `/referrals/:id/chat-access` | `x-user-id` | entitlement `LOCKED → UNLOCKED`; a missing row means LOCKED |
| GET | `/admin/referrals` | `x-admin-key` | cross-referrer list; `?referrerUserId&chatState&status&limit&offset` |

**Milestones** are a read-only projection: `ATTRIBUTED` (link attribution exists) → `SIGNED_UP`
(first verified `SIGNUP`) → `INSTALL_LOGIN_VERIFIED` (first trusted `INSTALL_LOGIN`) →
`CHAT_UNLOCKED` (entitlement transition; first unlocking event is kept).

**Entitlement vs friendship:** referral-chat access is its own concept. It unlocks only from a
trusted main-app `INSTALL_LOGIN` event (install **and** login verified by the main app) and never
creates a connection/friend. Attribution cardinality, self-referral policy and milestone
definitions remain owner decisions; current behaviour is the documented safe default.

**Main-app integration note:** the main app signs events with the shared webhook secret and
sends them from its own backend. The stable identity mapping (Firebase `uid` ↔ `users.id`) is an
owner input; until it lands, `referredUserId` must reference a user provisioned in this service.

### Identity (temporary, Phase 1)

`x-user-id: <uuid>` is trusted by `UserAuthGuard` and the user must exist and be ACTIVE.
This is a dev/CI convenience only: `TRUSTED_USER_HEADER_AUTH=true` is required to enable it and
**production boot refuses to start while it is on** — the real main-app auth exchange is an open decision.

### Verified events (HMAC)

`x-andos-signature: <hex>` (optionally `sha256=`-prefixed) = HMAC-SHA256 of the **raw request body**
with `MAIN_APP_WEBHOOK_SECRET`. Events are idempotent per `sourceEventId`; referral/conversion counts
come only from these endpoints. The service get-or-creates the minimal `(code, referred user)`
attribution required by the link-event CHECK constraint — full install/login verification is Sprint 2.

### Placeholders to revisit (open decisions)

- Click dedupe window: repeats from one visitor within 5 minutes count once; tokenless clicks count per request.
- `uniqueClickCount` = distinct hashed visitor tokens seen — anti-abuse refinement pending.
- Throttle defaults: 300 req/min global; 60 req/min on the public click route.

## Testing

```bash
npm test          # unit tests (no database)
npm run test:e2e  # e2e against real PostgreSQL (DATABASE_URL from test/setup-env.ts)
```

The e2e suite forces its own environment via `test/setup-env.ts` (jest `setupFiles`), so a developer
`.env` never affects results; CI runs it against a `postgres:17` service container with migrations applied.

## Conventions

- Money is always integer minor units (INR paise) — never floats.
- No secrets in the repo: `.env` is gitignored; `.env.example` shows shapes only.
- The initial SQL migration carries CHECK constraints and functional/partial indexes that
  Prisma cannot express — review migration SQL carefully in PRs; keep those constraints.
  (Note: `public_code` uniqueness is a functional index on `lower(public_code)`, so lookups use `findFirst`.)
- Next planned work (Sprint 2): signed main-app signup/install-login integration, exact link-attribution
  beneficiary, referral list/milestone projection and referral-chat entitlement state.
