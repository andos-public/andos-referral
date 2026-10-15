import 'package:andos_referral/app/app.dart';
import 'package:andos_referral/app/router/app_router.dart';
import 'package:andos_referral/app/router/app_routes.dart';
import 'package:andos_referral/core/haptics/app_haptics.dart';
import 'package:andos_referral/core/cache/app_database.dart';
import 'package:andos_referral/core/providers/app_providers.dart';
import 'package:andos_referral/design/widgets/floating_bottom_nav.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Boots the real app (theme + router + shell) against an in-memory database.
Future<ProviderContainer> pumpApp(WidgetTester tester, {Size? surface}) async {
  if (surface != null) {
    await tester.binding.setSurfaceSize(surface);
    addTearDown(() => tester.binding.setSurfaceSize(null));
  }
  AppHaptics.setEnabled(false); // no platform channel in tests
  final container = ProviderContainer(
    overrides: [appDatabaseProvider.overrideWithValue(AppDatabase.forTesting(NativeDatabase.memory()))],
  );
  addTearDown(container.dispose);
  await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const AndosReferralApp()));
  await tester.pumpAndSettle();
  return container;
}

void main() {
  testWidgets('boots into the Invite Hub tab inside the shell', (tester) async {
    await pumpApp(tester);
    expect(find.text('Invite Hub'), findsOneWidget);
    expect(find.byType(FloatingBottomNav), findsOneWidget);
  });

  testWidgets('nav bar exposes all five destinations with labels', (tester) async {
    await pumpApp(tester);
    for (final label in ['Invite', 'Referrals', 'Chat', 'Wallet', 'Settings']) {
      expect(find.text(label), findsWidgets, reason: 'missing nav label $label');
    }
  });

  testWidgets('tapping a destination routes there and moves the nav indicator', (tester) async {
    await pumpApp(tester);

    int navIndex() => tester.widget<FloatingBottomNav>(find.byType(FloatingBottomNav)).currentIndex;

    await tester.tap(find.text('Wallet'));
    await tester.pumpAndSettle();
    expect(find.text('Withdraw'), findsNothing); // wallet tab content, not a detail route
    expect(navIndex(), 3);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    expect(find.text('APPEARANCE'), findsOneWidget);
    expect(navIndex(), 4);

    await tester.tap(find.text('Referrals'));
    await tester.pumpAndSettle();
    expect(navIndex(), 1);
  });

  testWidgets('branch state is preserved when switching tabs (IndexedStack)', (tester) async {
    await pumpApp(tester);

    // Go to Wallet, then away, then back — the branch must not be rebuilt from
    // scratch (its widget stays alive in the shell's indexed stack).
    await tester.tap(find.text('Wallet'));
    await tester.pumpAndSettle();
    final walletElement = tester.element(find.text('Wallet').last);

    await tester.tap(find.text('Chat'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Wallet'));
    await tester.pumpAndSettle();

    expect(tester.element(find.text('Wallet').last), same(walletElement));
  });

  testWidgets('every shell screen renders real content, never a blank page', (tester) async {
    await pumpApp(tester);
    for (final tab in ['Referrals', 'Chat', 'Wallet']) {
      await tester.tap(find.text(tab));
      await tester.pumpAndSettle();
      expect(find.byType(CustomPaint), findsWidgets, reason: '$tab must paint custom SVG icons');
    }
  });

  testWidgets('settings can switch the theme mode and the palette follows', (tester) async {
    final container = await pumpApp(tester);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Light'));
    await tester.pumpAndSettle();
    expect(container.read(themeModeProvider), ThemeMode.light);

    final theme = Theme.of(tester.element(find.byType(FloatingBottomNav)));
    expect(theme.brightness, Brightness.light);

    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();
    expect(container.read(themeModeProvider), ThemeMode.dark);
    expect(Theme.of(tester.element(find.byType(FloatingBottomNav))).brightness, Brightness.dark);
  });

  testWidgets('haptics toggle flips the global switch', (tester) async {
    final container = await pumpApp(tester);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    expect(AppHaptics.enabled, isTrue);

    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect(AppHaptics.enabled, isFalse);
    expect(container.read(hapticsEnabledProvider), isFalse);
  });

  testWidgets('deep link /r/<code> lands on the Invite Hub with the code prefilled', (tester) async {
    final container = await pumpApp(tester);
    final router = container.read(appRouterProvider);
    router.go(AppRoutes.deepLink('ABC12345'));
    await tester.pumpAndSettle();
    expect(find.textContaining('ABC12345'), findsWidgets);
  });

  testWidgets('unknown routes show a recovery screen instead of crashing', (tester) async {
    final container = await pumpApp(tester);
    final router = container.read(appRouterProvider);
    router.go('/does-not-exist');
    await tester.pumpAndSettle();
    expect(find.textContaining('Route not found'), findsOneWidget);
    expect(find.text('Back to Invite Hub'), findsOneWidget);
  });

  testWidgets('shell renders on a small phone without overflowing', (tester) async {
    await pumpApp(tester, surface: const Size(360, 640));
    expect(tester.takeException(), isNull);
    for (final tab in ['Referrals', 'Chat', 'Wallet', 'Settings', 'Invite']) {
      await tester.tap(find.text(tab));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: '$tab overflowed on 360x640');
    }
  });
}
