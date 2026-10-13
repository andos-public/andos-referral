# Andos Referral

**Status:** 🚧 Phase 1 (Referral Foundation, Attribution & Ledger) — backend foundation in progress.

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

## Quick start (server)

See [server/README.md](server/README.md).

---
_Maintained by Andos._
