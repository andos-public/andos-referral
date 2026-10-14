---
name: andos-referral-core
description: "Andos Referral project brain — read this before ANY work in the andos-referral repository: NestJS backend, Prisma schema/migrations, referral links, attribution, commissions, ledger, wallets, payouts, the Flutter mobile app, CI and code reviews. Trigger whenever a task mentions Andos referral, invite links, referral codes, attribution, commission, TEAMCHX, wallet, withdrawal, referral chat, or this repo's server/mobile code — even if the user does not name this skill. Also read before writing any database migration, money math, or auth-touching code."
---

# Andos Referral — Core Project Skill (v1)

Referral-management + social/chat companion for the Andos main app (ANDOS TP site).
**Authority order:** the owner's live instruction → this skill → repo READMEs. If code contradicts this
skill, stop and flag the conflict instead of guessing.

## 1. Business rules (locked — do not invent alternatives)

- **Commission rates:** default **25%** (`DEFAULT_REFERRAL` = 2500 bps); eligible attributed orders that
  used promo **TEAMCHX** get **50%** (`PROMO_TEAMCHX` = 5000 bps). Canonical promo code = `TEAMCHX`
  (accept `TEAM CHX` etc. by trimming + case-insensitive compare). The promo selects the **rate only** —
  the beneficiary always comes from the referral-link attribution. Rates are data (`reward_rules` seeds),
  never hardcoded in business logic.
- **Money:** integer **paise only**, never floats, never strings-with-decimals. Applies to DB, API
  payloads, ledger entries and tests.
- **Commission base:** the main-app-supplied **net paid** amount on a verified order event.
- **Reward hold:** **7 days, anchored at `ORDER_COMPLETED`** (owner-decided 13 Oct 2026). Hold
  exceptions, release-processing mechanics, rounding mode and tax treatment are still open — do not
  build those parts until the owner specifies.
- **Ledger is append-only.** Corrections/reversals are linked compensating entries with idempotency
  keys. Never UPDATE or DELETE posted ledger rows. `wallet_accounts` is a rebuildable projection,
  never the source of truth.
- **Withdrawals:** no configured min/max. Request must be positive and ≤ currently available balance;
  funds are reserved atomically; initial status `PENDING_APPROVAL`; `COMPLETED` requires an admin
  decision plus a captured payment reference/UTR.
- **Referral ≠ friendship.** Referral-chat access is a separate entitlement (`LOCKED → UNLOCKED` only
  after a trusted main-app install **and** login verification). It never creates a connection/friend.
- **Privacy:** no raw device/payment/visitor identifiers in referral records. Click visitors are stored
  only as a truncated one-way hash. Payout details stay masked, encrypted, and out of ordinary responses.

## 2. Open decisions (never invent — ask the owner)

Attribution cardinality & self-referral policy · hold exceptions/release processing · rounding mode &
tax treatment · milestone definitions · promo stacking/caps · withdrawal rejection/cancellation fund
release · production auth provider (main-app token/session exchange) · E2EE protocol/stories details ·
deployment timing. If a task needs one of these, implement the smallest reversible slice and flag it.

## 3. Backend conventions (NestJS 11 + Prisma 6 + PostgreSQL 17)

- Layout: `server/src/<feature>/` with `controllers/`, `dto/`, `*.service.ts`, `*.module.ts`.
  Global prefix `/v1`; Swagger at `/docs`; DTOs validated (whitelist + forbidNonWhitelisted).
- Env: zod-validated, fail-fast at boot (`src/config/env.validation.ts`). Production boot **refuses**
  unsafe configs (trusted-header auth on, missing admin key/webhook secret). Keep that property forever.
- Identity today is a **temporary** trusted header (`x-user-id`, guard checks user exists + ACTIVE).
  Never build features that depend on it surviving to production.
- Verified events: **HMAC-SHA256 over the raw request body** (`x-andos-signature`, optional `sha256=`
  prefix), idempotent per `sourceEventId`. Verified endpoints are the only source of referral/conversion
  counts. `main.ts` keeps `rawBody: true` — do not remove it.
- Privacy-by-default in reads: owner-scoped queries filter by authenticated user and answer **404** for
  foreign ids (no existence leaks). Admin views use the separate `x-admin-key` guard.
- Error codes: 400 validation · 401 auth · 404 foreign/unknown · 422 unknown referenced user.
- Throttling: global default via env; the public click endpoint keeps its stricter per-route limit.

## 4. Data-layer rules (read before touching `prisma/`)

- Schema lives in Postgres schema `referral_app`; 16 tables + 13 enums. The initial migration contains
  **hand-written CHECK constraints, functional/partial indexes and seed rules** that Prisma cannot
  express. **Never relax a constraint to make code pass — fix the code instead.** (Precedent: the
  link-event attribution CHECK → the service get-or-creates the minimal attribution.)
- `referral_codes.public_code` uniqueness = functional index on `lower(public_code)` (SQL only) →
  Prisma must use `findFirst`, never `findUnique({ publicCode })`.
- BigInt counter columns (metrics) convert at the API edge (`toNumber`); never leak BigInt into JSON.
- The link-event CHECK requires `attribution_id` on REFERRAL_ATTRIBUTED/CONVERSION and NULL on CLICK.
- Migrations: review generated SQL by hand; migration PRs must state which constraints/indexes they
  add or keep. Tables can carry backdating requirements in tests (`expires_at > created_at`).

## 5. Testing gates (every PR)

- **Unit** (jest, no DB): expiry/state math, code normalization, hashing, env validation.
- **E2E vs real PostgreSQL only** (no SQLite) — `npm run test:e2e`; env is forced by
  `test/setup-env.ts` (jest `setupFiles`) and `ConfigModule` ignores `.env` when `NODE_ENV=test`.
  Tests must clean up their own rows (codes → events → attributions → metrics → users, in that order).
- CI: lint · build · unit + e2e job with `postgres:17` service + `prisma migrate deploy` on a fresh DB.
- Security gates (PR-B onward): `npm audit` + OSV-Scanner + Semgrep (changed files) + CodeQL + gitleaks.
  Triage: CRITICAL blocks the PR; HIGH fixed within the sprint; MEDIUM tracked.
- For money/ledger work also use: property-based tests (fast-check invariants) and, at sprint end,
  mutation-testing to prove the tests actually bite.

## 6. Flutter standards (mobile — later phases; keep locked now)

Riverpod 3 · Drift/SQLite · edge-to-edge with transparent bars · **no Material `Icons.*`** (single
Lucide/Phosphor SVG family, consistent stroke) · 8-pt grid (8/16/24) · Plus Jakarta Sans (or Inter) ·
colors/spacing via `ThemeExtension` tokens only · haptics on user-initiated actions · spring-driven
sheets · frosted floating bottom nav with low-cost fallback · 60 FPS budget-phone budget ·
reduced-motion alternatives. Design decisions come from UI/UX Pro Max; code-level work follows the
official Flutter/Dart tooling (MCP + official skills).

## 7. Workflow & repo etiquette

- Work loop: recon → architect → build → test → diff (the staged replica workflow).
- Small, single-purpose commits; push to `main` via the token header; **never** commit secrets/tokens
  (repo is public — `.env` stays gitignored, `.env.example` shapes only).
- Planning docs live in Drive only, never in the repo. Dev tooling (this skill, `AGENTS.md`, CI configs)
  is allowed in the repo.
- Never delete repos/files/branches without explicit owner permission.
- Report to the owner in **Hinglish**, short, with verification evidence (test counts, live smoke,
  commit hash). The owner approves before anything merges or deploys.
- Money/auth-touching PRs get a Trail-of-Bits `differential-review` pass on top of CodeRabbit.

## 8. Phase map

1. **Referral Foundation, Attribution & Ledger** (current) — Sprint 1 Invite Hub ✅ · Sprint 2
   integration & attribution · Sprint 3 commission + wallet · Sprint 4 hardening/UAT.
2–5. Connections & notifications · E2EE communication · Stories/profile · Payout ops & admin.

## 9. Key file pointers

`server/prisma/schema.prisma` · `server/prisma/migrations/**` · `server/src/config/env.validation.ts` ·
`server/src/auth/*` · `server/src/referral-codes/*` · `server/src/link-events/*` ·
`server/test/app.e2e-spec.ts` · `.github/workflows/server-ci.yml` · `server/README.md` (endpoint tables).
