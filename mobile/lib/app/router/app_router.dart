import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/chat/presentation/chat_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/referrals/presentation/referrals_screen.dart';
import '../../features/wallet/presentation/wallet_screen.dart';
import '../shell/app_shell.dart';
import 'app_routes.dart';

/// Router — one `StatefulShellRoute` with a branch per bottom-nav destination.
///
/// Four tabs, in nav order:
///   `/chat` (home) · `/referrals` (network + invite hub) · `/wallet` · `/profile`
///
/// * Each branch keeps its own Navigator, so opening a chat thread and coming
///   back to it after switching tabs preserves the thread.
/// * Settings are **not** a tab — they live inside `/profile`.
/// * `/r/<code>` (the main app's share link) lands on the Referrals tab with the
///   code prefilled.
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.chatPath,
    debugLogDiagnostics: false,
    routes: <RouteBase>[
      // ── Public deep link: /r/<code> ────────────────────────────────────────
      GoRoute(
        path: AppRoutes.deepLinkPath,
        name: AppRoutes.deepLinkName,
        redirect: (context, state) {
          final code = state.pathParameters['code'] ?? '';
          return '${AppRoutes.referralsPath}?code=$code';
        },
      ),

      // ── The app shell ─────────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppShell(navigationShell: navigationShell),
        branches: <StatefulShellBranch>[
          // 0 · Chat — the home tab.
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.chatPath,
                name: AppRoutes.chatName,
                builder: (context, state) => const ChatScreen(),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: AppRoutes.chatThreadName,
                    builder: (context, state) => ChatThreadPlaceholder(id: state.pathParameters['id']!),
                  ),
                ],
              ),
            ],
          ),
          // 1 · Referrals — invite hub + network progress in one place.
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.referralsPath,
                name: AppRoutes.referralsName,
                builder: (context, state) =>
                    ReferralsScreen(initialCode: state.uri.queryParameters['code']),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: AppRoutes.referralDetailName,
                    builder: (context, state) => ReferralDetailPlaceholder(id: state.pathParameters['id']!),
                  ),
                ],
              ),
            ],
          ),
          // 2 · Wallet — earnings & payouts.
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.walletPath,
                name: AppRoutes.walletName,
                builder: (context, state) => const WalletScreen(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'withdraw',
                    name: AppRoutes.withdrawName,
                    builder: (context, state) => const WithdrawPlaceholder(),
                  ),
                  GoRoute(
                    path: 'ledger',
                    name: AppRoutes.ledgerName,
                    builder: (context, state) => const LedgerPlaceholder(),
                  ),
                  GoRoute(
                    path: 'methods',
                    name: AppRoutes.payoutMethodsName,
                    builder: (context, state) => const PayoutMethodsPlaceholder(),
                  ),
                ],
              ),
            ],
          ),
          // 3 · Profile — profile, stats and settings.
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.profilePath,
                name: AppRoutes.profileName,
                builder: (context, state) => const ProfileScreen(),
                routes: <RouteBase>[
                  GoRoute(
                    path: 'security',
                    name: AppRoutes.securityName,
                    builder: (context, state) =>
                        const _PlaceholderPage(title: 'Security', subtitle: 'Biometric lock & sessions'),
                  ),
                  GoRoute(
                    path: 'withdrawals',
                    name: AppRoutes.withdrawalHistoryName,
                    builder: (context, state) =>
                        const _PlaceholderPage(title: 'Withdrawals', subtitle: 'Past payout requests'),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => _RouteErrorScreen(
      location: state.uri.toString(),
      onHome: () => context.goNamed(AppRoutes.chatName),
    ),
  );
});

// ── Phase-2 placeholders ────────────────────────────────────────────────────
// Small, honest stubs: they exist so every route in the shell resolves and the
// navigation skeleton can be walked end-to-end before the feature screens land.

class ReferralDetailPlaceholder extends StatelessWidget {
  const ReferralDetailPlaceholder({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) => _PlaceholderPage(title: 'Referral detail', subtitle: 'id: $id');
}

class ChatThreadPlaceholder extends StatelessWidget {
  const ChatThreadPlaceholder({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context) => _PlaceholderPage(title: 'Chat thread', subtitle: 'id: $id');
}

class WithdrawPlaceholder extends StatelessWidget {
  const WithdrawPlaceholder({super.key});

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderPage(title: 'Withdraw', subtitle: 'Payout request flow');
}

class LedgerPlaceholder extends StatelessWidget {
  const LedgerPlaceholder({super.key});

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderPage(title: 'Ledger', subtitle: 'Append-only history');
}

class PayoutMethodsPlaceholder extends StatelessWidget {
  const PayoutMethodsPlaceholder({super.key});

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderPage(title: 'Payout methods', subtitle: 'Vault reference + masked label');
}

class _PlaceholderPage extends StatelessWidget {
  const _PlaceholderPage({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: Text(title)),
      body: Center(child: Text(subtitle)),
    );
  }
}

class _RouteErrorScreen extends StatelessWidget {
  const _RouteErrorScreen({required this.location, required this.onHome});

  final String location;
  final VoidCallback onHome;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Route not found: $location'),
            const SizedBox(height: 12),
            FilledButton(onPressed: onHome, child: const Text('Back to Chat')),
          ],
        ),
      ),
    );
  }
}
