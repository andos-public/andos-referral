import 'package:flutter/gestures.dart' show PointerDeviceKind;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/providers/app_providers.dart';
import '../design/tokens/app_theme.dart';
import 'router/app_router.dart';

/// Root widget: theme (light/dark from tokens) + router + a global
/// `MediaQuery` guarantee that text scaling can never break a money layout.
class AndosReferralApp extends ConsumerWidget {
  const AndosReferralApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'Andos Referral',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: themeMode,
      routerConfig: router,
      scrollBehavior: const _AppScrollBehavior(),
      builder: (context, child) {
        // Clamp accessibility text scaling so the wallet/hero layouts stay intact
        // (ui-ux-pro-max: guard against layout breakage at extreme scale).
        final media = MediaQuery.of(context);
        final clamped = media.copyWith(
          textScaler: media.textScaler.clamp(minScaleFactor: 0.9, maxScaleFactor: 1.3),
        );
        return MediaQuery(data: clamped, child: child ?? const SizedBox.shrink());
      },
    );
  }
}

/// Desktop/web niceties kept harmless on mobile: mouse drag for scrollables.
class _AppScrollBehavior extends MaterialScrollBehavior {
  const _AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => const {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.trackpad,
        PointerDeviceKind.stylus,
      };
}

/// Exposed for tests that need the router without a widget tree.
GoRouter routerFor(WidgetRef ref) => ref.read(appRouterProvider);
