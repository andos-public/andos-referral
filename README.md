# Andos Referral

**Status:** ✅ **Phase 1 — Referral Foundation, Attribution & Ledger** delivered and locked.
🚧 **Phase 2 — Flutter Mobile App Shell & 2026 flagship UI** in progress (feature branch, PR opens after the icon set is settled).

Referral-management + social/chat companion for the Andos ecosystem: reusable invite links
with metrics, referral attribution, a commission ledger & wallet — and, in phase 3+,
connections and private chat.

## Stack

| Layer | Choice |
|---|---|
| Mobile | Flutter + Dart — edge-to-edge native UI |
| Client state | Riverpod 3 |
| Client routing | GoRouter |
| Client storage | Drift + SQLite |
| Backend | NestJS + TypeScript (modular monolith) |
| Database | PostgreSQL + Prisma |
| Jobs | BullMQ + Redis |
| CI | GitHub Actions |

## Repository layout

```
server/   NestJS API — Phase 1 complete (links, attribution, ledger, wallet, withdrawals, admin)
mobile/   Flutter app — Phase 2 (shell + flagship UI) in progress
```

## Mobile navigation (four tabs)

| Tab | Route | What lives there |
|---|---|---|
| **Chat** (home) | `/chat` | Referral conversations; a thread stays locked until the friend's install + login is verified |
| **Referrals** | `/referrals` | Invite link (share / QR / copy), click → signup → install → chat-unlocked progress, network list |
| **Wallet** | `/wallet` | Available balance, 7-day hold, commission ledger, withdrawal requests |
| **Profile** | `/profile` | User details, referral stats, and **all settings** (theme, haptics, payout methods, withdrawal history, security, help) |

Settings are deliberately *inside* Profile — there is no fifth tab. Deep links
`andos.app/r/<code>` open the Referrals tab with the code pre-filled.

### Icons

Zero third-party icon packages — no Lucide, no Material, no Cupertino, no icon font.
Every glyph is an own-authored SVG in `mobile/assets/icons_src/`, compiled to Dart path
data by `mobile/tool/generate_icons.py`. 61 icons cover the whole four-tab flow; the
review sheet is `mobile/tool/icon_sheet.html` (and `icon_sheet_v1.png`), the screens are
`mobile/tool/style_demos/app_four_tabs_dark.png` / `..._light.png`.

## Implemented so far

### Phase 1 (locked) — server

Invite links (create / list / read / deactivate / metrics), privacy-minimised click
tracking, HMAC-verified attribution and conversion events, first-touch attribution with
self-referral blocking, an append-only commission ledger with 168-hour hold, wallet
balances, withdrawal requests with UTR verification, and authorised admin views.

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /v1/referral-codes` | user (`x-user-id`, temporary) | Create a reusable link; optional `expiresAt`, omitted/null = evergreen |
| `GET /v1/referral-codes` | user | List own links (`state`, `limit`, `offset` filters) |
| `GET /v1/referral-codes/:id` | user | Read one own link (others get 404) |
| `POST /v1/referral-codes/:id/deactivate` | user | Deactivate a link (idempotent) |
| `GET /v1/referral-codes/:id/metrics` | user | Clicks · unique clicks · referrals · conversions |
| `POST /v1/referral-link-events` | public | Privacy-minimized click tracking (deduplicated, rate-limited) |
| `POST /v1/referral-link-events/verified/referral` | HMAC (`x-andos-signature`) | Verified referral attribution event (idempotent per `sourceEventId`) |
| `POST /v1/referral-link-events/verified/conversion` | HMAC | Verified conversion event |
| `GET /v1/wallet` (+ `/ledger`, `/withdrawals`) | user | Balance, append-only ledger, withdrawal requests |
| `POST /v1/withdrawals` | user | Request a payout (≤ AVAILABLE, > 0) |
| `GET /v1/admin/...` | admin (`x-admin-key`) | Authorised views across referrers, payout approvals |

Link states: **ACTIVE** (enabled, no expiry or expiry in the future) · **EXPIRED** (enabled, past expiry) · **INACTIVE** (explicitly deactivated).

Money rules: integer paise, `floor(netPaid × rateBps / 10000)`, 2500 bps default /
TEAMCHX 5000 bps, 168-hour hold from a signed `ORDER_COMPLETED`, append-only ledger with
linked compensating reversals.

### Phase 2 (in progress) — mobile shell

Four-tab shell with a frosted floating bottom nav, true edge-to-edge layout, Plus Jakarta
Sans, dark/light theming driven by a Riverpod theme controller, haptic feedback on taps,
spring-physics transitions, phase notices where a later phase owns the data, and a 61-icon
custom icon pipeline.

## Quick start (server)

See [server/README.md](server/README.md).
The mobile app: `cd mobile && flutter pub get && flutter run`.

---
_Maintained by Andos._
