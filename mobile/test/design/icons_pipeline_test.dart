import 'dart:io';

import 'package:andos_referral/app/app.dart';
import 'package:andos_referral/core/cache/app_database.dart';
import 'package:andos_referral/core/haptics/app_haptics.dart';
import 'package:andos_referral/core/providers/app_providers.dart';
import 'package:andos_referral/design/icons/app_icon.dart';
import 'package:andos_referral/design/widgets/floating_bottom_nav.dart';
import 'package:andos_referral/design/icons/app_icons.dart';
import 'package:andos_referral/design/icons/app_icons_registry.dart';
import 'package:andos_referral/design/icons/svg_path_parser.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// The icon pipeline is owner-driven: 79 ids are handed over, the owner returns
/// raw SVG code, `tool/generate_icons.py` compiles it into the registry. These
/// tests guard the contract between those three files.
void main() {
  group('icon manifest ↔ AppIcons contract', () {
    final manifestFile = File('tool/icon_manifest.txt');
    final lines = manifestFile
        .readAsLinesSync()
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty && !l.startsWith('#'))
        .toList();

    final manifestIds = <String>[
      for (final line in lines) line.split('|').first.trim(),
    ];

    test('manifest is present and non-trivial', () {
      expect(manifestIds.length, greaterThanOrEqualTo(AppIcons.required.length));
    });

    test('every required id appears exactly once in the manifest', () {
      final duplicates = <String>[];
      final seen = <String>{};
      for (final id in manifestIds) {
        if (!seen.add(id)) duplicates.add(id);
      }
      expect(duplicates, isEmpty, reason: 'duplicate manifest ids');

      final missing = AppIcons.required.where((id) => !seen.contains(id)).toList();
      expect(missing, isEmpty, reason: 'ids the owner would never be asked for: $missing');
    });

    test('the manifest introduces no id the app cannot render', () {
      final unknown = manifestIds.where((id) => !AppIcons.required.contains(id)).toList();
      expect(unknown, isEmpty, reason: 'manifest asks for ids that AppIcons does not declare: $unknown');
    });

    test('every manifest row carries a usage note so the owner knows where it lands', () {
      final undocumented = <String>[
        for (final line in lines)
          if (line.split('|').length < 2 || line.split('|')[1].trim().isEmpty) line,
      ];
      expect(undocumented, isEmpty, reason: 'rows without a used_in column: $undocumented');
    });
  });

  group('compiled registry', () {
    test('registry contains no id outside the declared set', () {
      final strays = kGeneratedIcons.keys.where((id) => !AppIcons.required.contains(id)).toList();
      expect(strays, isEmpty, reason: 'generator output drifted from AppIcons');
    });

    test('every compiled icon parses cleanly through the parser', () {
      for (final entry in kGeneratedIcons.entries) {
        for (final spec in entry.value.paths) {
          expect(
            () => parseSvgPathData(spec.d),
            returnsNormally,
            reason: '${entry.key} failed to parse',
          );
        }
      }
    });

    test('missingFromBundle lists exactly the ids still awaiting owner SVG', () {
      final expected = AppIcons.required.where((id) => !kGeneratedIcons.containsKey(id)).toList();
      expect(AppIcons.missingFromBundle, unorderedEquals(expected));
      expect(AppIcons.available.length + AppIcons.missingFromBundle.length, AppIcons.required.length);
      expect(AppIcons.available, unorderedEquals(kGeneratedIcons.keys));
    });

    test('there is no leftover probe asset from the generator self-test', () {
      final probe = File('assets/icons_src/pipeline_probe.svg');
      expect(probe.existsSync(), isFalse, reason: 'delete the probe before handing the manifest over');
    });
  });

  group('runtime behaviour with an empty bundle', () {
    test('lookup helpers mirror the compiled map exactly (no guessing, no throwing)', () {
      for (final id in AppIcons.required) {
        expect(AppIcons.has(id), kGeneratedIcons.containsKey(id), reason: id);
        expect(identical(AppIcons.dataFor(id), kGeneratedIcons[id]), isTrue, reason: id);
      }
      expect(AppIcons.dataFor('not_an_app_icon'), isNull);
    });

    testWidgets('AppIcon paints the dashed placeholder when the bundle lacks an id', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Center(child: AppIcon(AppIcons.navWallet, size: 32)),
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(AppIcon), findsOneWidget);
      expect(find.byType(CustomPaint), findsWidgets);
    });
  });

  group('zero generic icons', () {
    testWidgets('no Material/Cupertino Icon widget is ever mounted by the app', (tester) async {
      AppHaptics.setEnabled(false);
      final container = ProviderContainer(overrides: [
        appDatabaseProvider.overrideWithValue(AppDatabase.forTesting(NativeDatabase.memory())),
      ]);
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(container: container, child: const AndosReferralApp()),
      );
      await tester.pumpAndSettle();
      expect(find.byType(Icon), findsNothing, reason: 'a generic icon leaked into the Invite Hub');

      for (final tab in ['Referrals', 'Wallet', 'Profile']) {
        await tester.tap(find.descendant(
          of: find.byType(FloatingBottomNav),
          matching: find.text(tab),
        ));
        await tester.pumpAndSettle();
        expect(find.byType(Icon), findsNothing, reason: 'a generic icon leaked into the $tab tab');
      }
    });

    testWidgets('destinations are labelled for screen readers without icon fonts', (tester) async {
      AppHaptics.setEnabled(false);
      final container = ProviderContainer(overrides: [
        appDatabaseProvider.overrideWithValue(AppDatabase.forTesting(NativeDatabase.memory())),
      ]);
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(container: container, child: const AndosReferralApp()),
      );
      await tester.pumpAndSettle();

      for (final label in ['Chat', 'Referrals', 'Wallet', 'Profile']) {
        expect(
          find.bySemanticsLabel(RegExp(label, caseSensitive: false)),
          findsWidgets,
          reason: '$label destination is not announced',
        );
      }
    });
  });
}
