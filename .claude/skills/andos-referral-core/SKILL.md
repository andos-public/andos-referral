---
name: andos-referral-core
description: "Andos Referral project brain — read this before ANY work in the andos-referral repository: NestJS backend, Prisma schema/migrations, referral links, attribution, commissions, ledger, wallets, payouts, the Flutter mobile app, CI and code reviews. Trigger whenever a task mentions Andos referral, invite links, referral codes, attribution, commission, TEAMCHX, wallet, withdrawal, referral chat, or this repo's server/mobile code — even if the user does not name this skill. Also read before writing any database migration, money math, or auth-touching code."
---

# Andos Referral — Core Project Skill (v1.1)

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
- **Rounding (locked):** `commission = Math.floor((netPaidPaise × rateBps) / 10000)` — integer BigInt
  math, floor, no floating point anywhere. API carries minor units as decimal **strings** (`"5000"`).
- **Reward hold (locked):** **168 hours (7 days) anchored at the `ORDER_COMPLETED` timestamp**
  (`occurredAt`). When the window elapses and the order was neither cancelled nor refunded, the held
  commission is released **PENDING → AVAILABLE** by the idempotent sweep
  (`POST /v1/admin/wallet/release-due`, called by a cron/BullMQ worker). Partial-refund apportionment
  and tax treatment remain open.
- **Refunds/cancellations (locked):** `ORDER_REFUNDED` / `ORDER_CANCELLED` append a
  `COMMISSION_REVERSAL` entry — from **PENDING** while still held, from **AVAILABLE** after release.
  The full posted commission is reversed (partial-refund apportionment stays open).
- **Attribution cardinality (locked): first-touch single attribution.** A referrer may have unlimited
  referred users (1-to-many), but a referred user is attributed to exactly ONE referrer for life
  (DB unique on `referred_user_id`). A second referrer's link is refused with `ALREADY_ATTRIBUTED`;
  lifecycle events keep flowing to the first-touch attribution (`firstTouchPreserved: true`).
- **Self-referral (locked): strictly blocked** — internal user id AND Firebase identity
  (`users.external_subject`), plus the DB CHECK `referrer_user_id <> referred_user_id`.
- **Identity mapping (locked):** the main app identifies users by Firebase Auth uid, mapped 1:1 onto
  `users.external_subject` (unique). Webhooks accept **either** our UUID (`referredUserId`) **or** the
  Firebase uid (`externalUserId`); an unseen uid is auto-provisioned (caller is HMAC-verified).
- **Ledger is append-only.** Corrections/reversals are linked compensating entries with idempotency
  keys. Never UPDATE or DELETE posted ledger rows. `wallet_accounts` is a rebuildable projection,
  never the source of truth.
- **Withdrawals (locked):** no configured min/max. Request must be positive and ≤ currently available
  balance; funds are reserved **atomically** at request time (wallet row lock) and the status starts
  `PENDING_APPROVAL`. Admin approve → `APPROVED` (no money moves). Reject/cancel releases the
  reservation to AVAILABLE. `COMPLETED` needs an admin decision **plus a captured UTR** (DB CHECK
  enforces the audit columns reviewed_by/completed_by).
- **Referral ≠ friendship.** Referral-chat access is a separate entitlement (`LOCKED → UNLOCKED` only
  after a trusted main-app install **and** login verification). It never creates a connection/friend.
- **Privacy:** no raw device/payment/visitor identifiers in referral records. Click visitors are stored
  only as a truncated one-way hash. Payout details stay masked, encrypted, and out of ordinary responses.

## 2. Open decisions (never invent — ask the owner)

Partial-refund apportionment · tax treatment of the commission base · click-definition/retention
(blocks the visitor-hash pepper) · promo stacking/caps · production auth provider (main-app token
exchange) · E2EE/stories details · payout vault vendor ·
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
- Sprint-3 additions (2026-10-14): unique index `referral_attributions_referred_user_uq`
  (first-touch single attribution), CHECK `referral_attributions_no_self_referral_chk`, index
  `referral_order_events_event_type_occurred_at_idx` (hold sweep). Keep all three.
- Ledger conventions: one `wallet_ledger_transactions` row per money movement, entries carry signed
  minor units and are never zero. Posting patterns — lock `+PENDING`; release `-PENDING/+AVAILABLE`;
  reservation `-AVAILABLE/+RESERVED`; rejection/cancel `-RESERVED/+AVAILABLE`; completion
  `-RESERVED/+WITHDRAWN`; reversal `-PENDING` (held) or `-AVAILABLE` (released). Idempotency keys:
  `commission-lock|<orderEventId>`, `commission-release|<orderEventId>`,
  `commission-reversal|<orderEventId>`, `withdrawal-reservation|<requestId>`,
  `withdrawal-release|<requestEventId>`, `withdrawal-completion|<requestId>`.
- Admin payout decisions need `ADMIN_ACTOR_USER_ID` (a real user row): the audit columns
  `reviewed_by_user_id` / `completed_by_user_id` are NOT NULL for APPROVED/REJECTED/COMPLETED.

## 5. Testing gates (every PR)

- **Unit** (jest, no DB): expiry/state math, code normalization, hashing, env validation.
- **E2E vs real PostgreSQL only** (no SQLite) — `npm run test:e2e`; env is forced by
  `test/setup-env.ts` (jest `setupFiles`) and `ConfigModule` ignores `.env` when `NODE_ENV=test`.
  Tests must clean up their own rows (codes → events → attributions → metrics → users, in that order).
- CI: lint · build · unit + e2e job with `postgres:17` service + `prisma migrate deploy` on a fresh DB.
- Security gates (PR-B onward): `npm audit` + OSV-Scanner + Semgrep (changed files) + CodeQL + gitleaks.
  Triage: CRITICAL blocks the PR; HIGH fixed within the sprint; MEDIUM tracked.
- For money/ledger work also use: property-based tests (fast-check invariants) and, at sprint end,
  mutation-testing to prove the tests actually bite. `test/ledger-invariants.e2e-spec.ts` asserts
  projection == rebuilt ledger == pure model for random operation sequences;
  `src/commission/commission.util.spec.ts` property-tests the money math.

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
   integration & attribution ✅ · Sprint 3 commission + ledger + hold + payouts ✅ · Sprint 4
   hardening/UAT next.
2–5. Connections & notifications · E2EE communication · Stories/profile · Payout ops & admin.

## 9. Key file pointers

`server/prisma/schema.prisma` · `server/prisma/migrations/**` · `server/src/config/env.validation.ts` ·
`server/src/auth/*` · `server/src/referral-codes/*` · `server/src/link-events/*` ·
`server/src/identity/identity.service.ts` (Firebase uid mapping) · `server/src/commission/*` (money
math) · `server/src/order-events/*` · `server/src/wallet/*` (ledger, holds, wallet reads) ·
`server/src/payout-requests/*` · `server/test/sprint3*.e2e-spec.ts` ·
`server/test/ledger-invariants.e2e-spec.ts` · `.github/workflows/server-ci.yml` · `server/README.md`.
