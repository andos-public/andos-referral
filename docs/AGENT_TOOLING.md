# Agent tooling & security gates — Golden Stack v1

This repository is developed with an AI coding-agent workflow. This document records the
tooling layers, the enforced security gates and the review process so any agent (or human)
can reproduce them. Planning documents stay in Google Drive — this file is developer tooling.

## Layers

| Layer | What | Where |
|---|---|---|
| **L0 — project brain** | Business rules, data-layer rules, testing gates, conventions (read first) | `.claude/skills/andos-referral-core/SKILL.md`, `AGENTS.md` |
| **L1 — work loop** | recon → architect → build → test → diff (small single-purpose commits) | this repo's history |
| **L2 — security skills** | Trail-of-Bits methodology subset: `differential-review`, `insecure-defaults`, `property-based-testing`, `supply-chain-risk-auditor`, `static-analysis` (CodeQL/Semgrep/SARIF), `mutation-testing`, `semgrep-rule-creator` + `fp-check` on demand, `audit-context-building`, `firebase-apk-scanner` (mobile phase) | followed as instructions during a task; **MCP servers/plugins mount only in a developer's local agent client** — CI does not depend on them |
| **L3 — CI gates (enforced)** | see `.github/workflows/security.yml` | gitleaks (full git history) · OSV-Scanner (SARIF, **CRITICAL blocks**) · Semgrep OSS (SARIF, **ERROR blocks**) · CodeQL `javascript-typescript` (`security-extended`) · Dependabot (weekly, grouped) · GitHub secret-scanning push protection |
| **L4 — PR review (advisory)** | CodeRabbit, configured by `.coderabbit.yaml` (free with full features for public repos) | path-scoped instructions for prisma/auth/link-events/main-app-events/referrals/CI; **advisory only** — CI + human review remain the required checks |
| **L5 — on demand** | Prisma MCP · Dart/Flutter MCP + official Flutter skills · Developer Knowledge MCP · UI/UX Pro Max (Flutter UI phase) · Figma MCP · Sentry · oasdiff · Playwright MCP | later phases |

## Triage policy

- **CRITICAL** → blocks the PR until fixed.
- **HIGH** → fixed within the same sprint.
- **MEDIUM** → tracked in the review log below; scheduled with the owning feature.
- **LOW / INFO** → best effort.

## Local verification (works without CI)

```bash
# inside server/
npm ci && npx prisma generate
npm run build && npm run lint && npm test     # fast gates (no DB)
npm run test:e2e                              # needs PostgreSQL 17 + migrated DB (see test/setup-env.ts)

# security CLIs (pinned versions — bump in a dedicated PR)
# gitleaks 8.30.1   : https://github.com/gitleaks/gitleaks/releases
# osv-scanner 2.7.0 : https://github.com/google/osv-scanner/releases
gitleaks detect --source . --redact
osv-scanner scan source -r .
npm audit --omit=dev
```

Every e2e run must use a real PostgreSQL (never SQLite) — partial/functional indexes and
CHECK constraints are part of the contract.

## Money / auth PR checklist (Trail-of-Bits `differential-review`)

For any change touching payments, ledger, wallets, auth, signed events or migrations, state
in the PR description: (1) blast radius, (2) invariants preserved (idempotency keys, append-only
ledger, CHECK constraints, ownership 404s), (3) new tests + how they'd fail, (4) anything
deferred and its tracking item.

## Review log — baseline (2026-10-14)

Method: `differential-review` + `insecure-defaults` pass over the Sprint-1 feature diff
(`fcf3032`) and the Sprint-2 additions. Full report (with evidence) is kept in the owner's
workspace/Drive; this log is the repo-visible summary.

| # | Sev | Area | Finding | Status |
|---|---|---|---|---|
| F-01 | MEDIUM | crypto | `hashVisitorToken()` = unsalted, truncated SHA-256 of a client token — low-entropy tokens could be brute-forced/correlated. | **TRACKED** — add `VISITOR_HASH_PEPPER` (HMAC-SHA256) when the click-definition/retention decision lands; it changes stored hashes, so it ships with that decision. |
| F-02 | MEDIUM | replay | Signed events have no timestamp/freshness window; a captured body can be replayed. Impact bounded: idempotency per `(sourceSystem, sourceEventId)` prevents duplicate effects. | **TRACKED** — add `x-andos-timestamp` + tolerance to the main-app contract (Sprint 3). |
| F-03 | MEDIUM | deployment | No CORS configuration: browser calls from the landing page would fail. | **FIXED** — `CORS_ALLOWED_ORIGINS` (exact origins, default deny, no wildcard) wired in `src/bootstrap.ts` + e2e assertions. |
| F-04 | LOW | info-disclosure | Swagger `/docs` was served unconditionally, mapping admin routes. | **FIXED** — opt-in `DOCS_ENABLED`, default OFF. |
| F-05 | LOW | infra | No `trust proxy`: behind a reverse proxy every request shares one throttle bucket. | **TRACKED** — set explicitly with the chosen hosting (Vercel) before public deploy. |
| F-06 | LOW | privacy | Retention/rotation of hashed visitor tokens is undefined. | **TRACKED** — part of the click-dedupe/retention open decision (F-01 ships with it). |
| F-07 | LOW | input bounds | `safeMetadata` on verified events was unbounded JSON. | **FIXED** — capped at 2048 bytes (`MAX_SAFE_METADATA_BYTES`) with e2e coverage. |
| F-08 | INFO | errors | A DB CHECK violation (23514) surfaces as Prisma `UnknownRequestError` → 500. | TRACKED — acceptable as a server-bug guard; map to a stable error code in Phase 4 hardening. |
| F-09 | INFO | identity | `x-user-id` trusted-header auth is temporary; production boot refuses it. | By design (documented); replaced when the auth-provider decision lands. |
| F-10 | INFO | secrets | No secrets in repo or history (gitleaks clean); `.env` gitignored; guards fail closed when unset. | OK — keep it that way: never commit a fallback secret. |

Positive controls verified during the review: HMAC-SHA256 over the raw body with timing-safe
comparison; admin key compared after SHA-256 hashing (length-safe); zod env validation failing
fast with production refusals (trusted-header auth, missing admin key/webhook secret); idempotency
enforced by unique constraints and answered as `{recorded,deduplicated,reason}`; race-safe
attribution get-or-create; hand-written CHECK constraints preserved; ownership-scoped reads with
404 for foreign ids; DTO whitelist + `forbidNonWhitelisted`; BigInt converted only at the API edge;
no raw device/payment/contact identifiers stored; e2e runs against real PostgreSQL.
