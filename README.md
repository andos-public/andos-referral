# Andos Referral

**Status:** 🚧 Phase 1 (Referral Foundation, Attribution & Ledger).
Sprint 1 — Invite Hub (referral links + click/verified events + per-link metrics + admin view) is implemented and tested.

Referral-management + social/chat companion app for the Andos ecosystem:
reusable invite links with metrics, referral attribution, commission ledger &
wallet — and, in later phases, connections and private chat.

## Stack

| Layer | Choice |
|---|---|
| Mobile | Flutter + Dart — edge-to-edge native UI |
| Client state | Riverpod 3 |
| Client storage | Drift + SQLite |
| Backend | NestJS + TypeScript (modular monolith) |
| Database | PostgreSQL + Prisma |
| Jobs | BullMQ + Redis |
| CI | GitHub Actions |

## Repository layout

```
server/   NestJS API — Phase 1 foundation (in progress)
mobile/   Flutter app — planned (starts after the Phase-1 backend foundation)
```

## Roadmap

1. **Referral Foundation, Attribution & Ledger** — links, attribution, commissions, wallet, withdrawal requests
2. Connections & notifications
3. Rich communication (E2EE)
4. Stories & profile
5. Payout operations & admin

## Implemented so far (Sprint 1 — Invite Hub)

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /v1/referral-codes` | user (`x-user-id`, temporary) | Create a reusable link; optional `expiresAt`, omitted/null = evergreen |
| `GET /v1/referral-codes` | user | List own links (`state`, `limit`, `offset` filters) |
| `GET /v1/referral-codes/:id` | user | Read one own link (others get 404) |
| `POST /v1/referral-codes/:id/deactivate` | user | Deactivate a link (idempotent) |
| `GET /v1/referral-codes/:id/metrics` | user | Clicks · unique clicks · referrals · conversions |
| `POST /v1/referral-link-events` | public | Privacy-minimized click tracking (deduplicated, rate-limited) |
| `POST /v1/referral-link-events/verified/referral` | HMAC (`x-andos-signature`) | Verified referral attribution event (idempotent per `sourceEventId`) |
| `POST /v1/referral-link-events/verified/conversion` | HMAC | Verified conversion event (counts only; money rules are Sprint 3) |
| `GET /v1/admin/referral-codes` (+ `/:id`, `/summary`) | admin (`x-admin-key`) | Authorized views across referrers |

Link states: **ACTIVE** (enabled, no expiry or expiry in the future) · **EXPIRED** (enabled, past expiry) · **INACTIVE** (explicitly deactivated). Click dedupe rules are documented placeholders until the exact click-definition decision lands.

## Quick start (server)

See [server/README.md](server/README.md).

---
_Maintained by Andos._
