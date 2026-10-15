import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/chat/presentation/chat_screen.dart';
import '../../features/invite/presentation/invite_hub_screen.dart';
import '../../features/referrals/presentation/referrals_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/wallet/presentation/wallet_screen.dart';
import '../shell/app_shell.dart';
import 'app_routes.dart';

/// Router — one `StatefulShellRoute` with a branch per bottom-nav destination.
///
/// * Each branch keeps its own Navigator, so pushing Chat → thread and then
///   switching tabs preserves the thread when you come back.
/// * The shell (glass nav bar + page transitions) lives in [AppShell].
/// * Detail routes are already declared so deep links resolve as screens land.
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.invitePath,
    debugLogDiagnostics: false,
    routes: <RouteBase>[
      // ── Public deep link: /r/<code> ────────────────────────────────────────
      GoRoute(
        path: AppRoutes.deepLinkPath,
        name: AppRoutes.deepLinkName,
        redirect: (context, state) {
          final code = state.pathParameters['code'] ?? '';
          // Phase-2: hand the code to the invite hub (prefill + preview).
          return '${AppRoutes.invitePath}?code=$code';
        },
      ),

      // ── The app shell ─────────────────────────────────────────────────────
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppShell(navigationShell: navigationShell),
        branches: <StatefulShellBranch>[
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.invitePath,
                name: AppRoutes.inviteName,
                builder: (context, state) => InviteHubScreen(initialCode: state.uri.queryParameters['code']),
                routes: <RouteBase>[
                  GoRoute(
                    path: ':id',
                    name: AppRoutes.linkDetailName,
                    builder: (context, state) => InviteHubScreen(linkId: state.pathParameters['id']),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.referralsPath,
                name: AppRoutes.referralsName,
                builder: (context, state) => const ReferralsScreen(),
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
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: AppRoutes.settingsPath,
                name: AppRoutes.settingsName,
                builder: (context, state) => const SettingsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => _RouteErrorScreen(
      location: state.uri.toString(),
      onHome: () => context.goNamed(AppRoutes.inviteName),
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
  Widget build(BuildContext context) => const _PlaceholderPage(title: 'Withdraw', subtitle: 'Payout request flow');
}

class LedgerPlaceholder extends StatelessWidget {
  const LedgerPlaceholder({super.key});

  @override
  Widget build(BuildContext context) => const _PlaceholderPage(title: 'Ledger', subtitle: 'Append-only history');
}

class PayoutMethodsPlaceholder extends StatelessWidget {
  const PayoutMethodsPlaceholder({super.key});

  @override
  Widget build(BuildContext context) => const _PlaceholderPage(title: 'Payout methods', subtitle: 'Vault reference + masked label');
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
            FilledButton(onPressed: onHome, child: const Text('Back to Invite Hub')),
          ],
        ),
      ),
    );
  }
}
