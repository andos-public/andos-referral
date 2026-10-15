# ANDOS Referral — Mobile App (Phase 2)

Flutter client for the **Referral Chat App**: invite, referral tracking, chat and
wallet in one app, sitting on top of the Phase-1 NestJS backend in `../server`.

| | |
|---|---|
| Flutter / Dart | 3.47.7 (stable) / Dart 3.13.5 |
| State | Riverpod 3.x (`flutter_riverpod`) |
| Routing | GoRouter 18 (`StatefulShellRoute.indexedStack`) |
| Local cache | Drift 2.x (SQLite, `drift_flutter`) |
| App id | `com.andos.andos_referral` |
| Platforms | Android + iOS |

---

## 1. Phase-2 rules this codebase follows

1. **Zero generic icons.** No `Icons.*`, no Cupertino icons, no icon package
   (Lucide/Material/Heroicons/…). Every glyph is an owner-authored SVG that is
   compiled into Dart path data by `tool/generate_icons.py` and painted by
   `AppIcon`. A widget test asserts that **no** `Icon` widget is ever mounted.
2. **Owner-driven icon flow.** The app declares 79 icon ids up front
   (`lib/design/icons/app_icons.dart` → `AppIcons.required`, mirrored for the
   owner in `tool/icon_manifest.txt`). The owner returns raw SVG code, we drop the
   files in `assets/icons_src/` and run the generator.
3. **True edge-to-edge.** Content is drawn up to and behind the status bar; the
   bottom nav floats on frosted glass above the content.
4. **Haptics on every tap** (owner decision — overrides the usual
   "confirmations only" guidance) plus spring physics on every interactive surface.
5. **Plus Jakarta Sans** everywhere, tabular figures for money.

## 2. Layout

```
lib/
  app/          app.dart · router/ (routes + GoRouter) · shell/ (floating bottom nav)
  core/         cache/ (Drift DB) · haptics/ · providers/ (Riverpod)
  design/       tokens/ (colour, type, spacing, motion) · icons/ (icon engine) ·
                widgets/ (GlassSurface, PressScale, FloatingBottomNav, …)
  features/     invite · referrals · chat · wallet · settings  (presentation layer)
tool/
  icon_manifest.txt       the owner-facing icon list (79 ids + where each is used)
  generate_icons.py       assets/icons_src/*.svg  →  lib/design/icons/app_icons_registry.dart
test/
  app/app_shell_test.dart          shell navigation, theme switch, deep link, 360 dp layout
  design/tokens_test.dart          grid, WCAG AA contrast, typography, motion
  design/icons_pipeline_test.dart  manifest ↔ AppIcons ↔ registry contract, zero-generic-icon guard
  icons/svg_path_parser_test.dart  SVG path grammar edge cases
```

## 3. Commands

```bash
export PATH="/opt/flutter-sdk/flutter/bin:$PATH"   # sandbox toolchain
export PUB_CACHE=/opt/pub-cache

flutter pub get
dart analyze lib test          # must be 0 issues
flutter test                   # 52 tests, all green

# icons: drop the owner's SVGs into assets/icons_src/, then
python3 tool/generate_icons.py            # write lib/design/icons/app_icons_registry.dart
python3 tool/generate_icons.py --check    # CI-safe: fail if the registry is stale
```

`lib/design/icons/app_icons_registry.dart` is generated — **never** rename it to
`*.g.dart`, because `build_runner` deletes generated files it does not own.

## 4. Money & data rules (from Phase 1, non-negotiable)

* Amounts are **integer paise** (`…MinorUnits`) end to end — no doubles, no floats.
* Commission is credited only after `ORDER_COMPLETED` + the 168 h hold expires.
* Local Drift tables mirror the server: `wallet_accounts`, `ledger_entries`,
  `referral_codes`, `referral_items`, `payout_requests`, `app_preferences`.
  The cache is **write-through and rebuildable**; the server stays the source of truth.

## 5. Platform notes

* **Android** — `LaunchTheme`/`NormalTheme` are fully transparent (status +
  navigation bars, `shortEdges` cutout mode, API 29+ contrast scrim disabled) and
  `launch_background` paints the brand background so there is no white flash.
  `android:enableOnBackInvokedCallback="true"` for predictive back.
  The Android SDK is not installed in the dev sandbox, so the APK is built in CI.
* **iOS** — no extra plist keys required; Flutter owns the status-bar style and
  the app already extends under it.
