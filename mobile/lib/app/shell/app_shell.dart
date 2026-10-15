import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../design/icons/app_icons.dart';
import '../../design/tokens/app_colors.dart';
import '../../design/tokens/app_spacing.dart';
import '../../design/widgets/floating_bottom_nav.dart';
import '../router/app_routes.dart';

/// The shell: a `StatefulShellRoute.indexedStack` body plus the floating,
/// frosted bottom navigation.
///
/// The router is the single source of truth for the active destination —
/// `navigationShell.currentIndex` feeds the nav indicator directly, so there is
/// no mirrored state that could drift.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  /// Provided by GoRouter; keeps every branch's state alive.
  final StatefulNavigationShell navigationShell;

  /// Four tabs, in branch order. Chat is home; settings live inside Profile.
  static const List<FloatingNavItem> items = <FloatingNavItem>[
    FloatingNavItem(icon: AppIcons.navChat, label: 'Chat'),
    FloatingNavItem(icon: AppIcons.navReferrals, label: 'Referrals'),
    FloatingNavItem(icon: AppIcons.navWallet, label: 'Wallet'),
    FloatingNavItem(icon: AppIcons.navProfile, label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.colors;
    // Single source of truth: the shell branch GoRouter currently shows.
    final index = navigationShell.currentIndex;

    return Scaffold(
      backgroundColor: colors.bgBase,
      extendBody: true,
      body: Container(
        decoration: BoxDecoration(color: colors.bgBase, gradient: colors.heroGradient),
        child: navigationShell,
      ),
      bottomNavigationBar: FloatingBottomNav(
        items: items,
        currentIndex: index,
        onSelect: (i) {
          if (i == index) {
            // Re-tap on the active destination: pop to that branch's root.
            navigationShell.goBranch(i, initialLocation: true);
            return;
          }
          navigationShell.goBranch(i);
        },
      ),
    );
  }

  /// Branch index → route name, used by callers that want to deep-link into the
  /// shell (e.g. a notification tap opening Wallet).
  static String routeForBranch(int index) => switch (index) {
        0 => AppRoutes.chatName,
        1 => AppRoutes.referralsName,
        2 => AppRoutes.walletName,
        _ => AppRoutes.profileName,
      };
}

/// Pads a scrollable so its last item clears the floating nav bar and the
/// gesture area. Every page inside the shell uses this instead of a magic number.
class ShellBottomPadding extends StatelessWidget {
  const ShellBottomPadding({super.key, this.extra = 0});

  final double extra;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;
    return SizedBox(height: AppSpacing.navClearance + bottomInset + extra);
  }
}
