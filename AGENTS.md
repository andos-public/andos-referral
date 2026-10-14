# AGENTS.md — Andos Referral (draft for repo root)

> Draft for PR-A. Any AI coding agent (Claude Code, Cursor, Codex, …) should read this first,
> then follow `.claude/skills/andos-referral-core/SKILL.md`.

## Read order
1. `.claude/skills/andos-referral-core/SKILL.md` — the project brain (business rules, conventions, gates).
2. `server/README.md` — endpoint tables, testing, conventions.
3. Task-specific code under `server/src/`.

## Non-negotiables (short version)
- Money = integer paise. Never floats.
- Ledger is append-only; corrections are compensating entries. Never edit/delete posted rows.
- Never relax the migration CHECK constraints — fix the code.
- `public_code` lookups use `findFirst` (case-insensitive functional index, not a Prisma unique).
- Verified main-app events are HMAC-signed over the raw body, idempotent per `sourceEventId`.
- Owner-scoped reads return 404 for foreign ids. Admin routes need `x-admin-key`.
- No secrets in the repo (public). No deletions without the owner's explicit permission.
- Planning docs live in Drive, not in this repo.

## Commands
```bash
cd server
npm run build && npm run lint && npm test          # fast gates
npm run test:e2e                                   # needs local PostgreSQL 17 (see test/setup-env.ts)
npx prisma migrate dev                             # schema work (review generated SQL!)
npm run start:dev                                  # API :3000/v1 · Swagger /docs
```

## Money-touching PRs
Run the Trail-of-Bits `differential-review` checklist in addition to CodeRabbit; state blast radius
and test coverage in the PR description.

## Current sprint pointer
Sprint 2 — signed main-app signup/install-login refinement, `GET /v1/referrals`, referral-chat
entitlement state. See Drive `PHASE_1_EXECUTION_PLAN.md` / `GOLDEN_STACK.md`.
