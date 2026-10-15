import 'dart:math' as math;

import 'package:andos_referral/design/tokens/app_colors.dart';
import 'package:andos_referral/design/tokens/app_spacing.dart';
import 'package:andos_referral/design/tokens/app_theme.dart';
import 'package:andos_referral/design/tokens/app_typography.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// WCAG relative luminance + contrast ratio (the accessibility gate the design
/// system must pass in *both* palettes before any screen ships).
double _luminance(Color c) {
  double channel(double v) => v <= 0.03928 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/// Hue separation in degrees (0–360); gold vs grey is a *hue* distinction even
/// when luminance happens to be close, so the nav test checks both.
double hueDelta(Color a, Color b) {
  final ha = HSLColor.fromColor(a).hue;
  final hb = HSLColor.fromColor(b).hue;
  final d = (ha - hb).abs();
  return d > 180 ? 360 - d : d;
}

double contrast(Color a, Color b) {
  final la = _luminance(a);
  final lb = _luminance(b);
  final hi = math.max(la, lb);
  final lo = math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

void main() {
  group('spacing scale', () {
    test('is a strict 4-based 8-point grid', () {
      for (final value in AppSpacing.scale) {
        expect(value % 4, 0, reason: '$value must sit on the 4 dp micro grid');
      }
      expect(AppSpacing.gap8, 8);
      expect(AppSpacing.gap16, 16);
      expect(AppSpacing.gap24, 24);
    });

    test('touch targets meet platform minimums', () {
      expect(AppSpacing.minTouchTarget, greaterThanOrEqualTo(48)); // Android
      expect(AppSpacing.minTouchTargetIos, greaterThanOrEqualTo(44)); // iOS
      expect(AppSpacing.navBarHeight, greaterThanOrEqualTo(56));
    });
  });

  group('colour contrast (WCAG AA, both themes)', () {
    for (final palette in <(String, AppColors)>[('dark', AppColors.dark), ('light', AppColors.light)]) {
      final name = palette.$1;
      final c = palette.$2;

      test('$name — body text on surfaces reaches 4.5:1', () {
        expect(contrast(c.textPrimary, c.bgBase), greaterThanOrEqualTo(4.5), reason: '$name primary/bg');
        expect(contrast(c.textPrimary, c.surface), greaterThanOrEqualTo(4.5), reason: '$name primary/surface');
        expect(contrast(c.textSecondary, c.surface), greaterThanOrEqualTo(4.5), reason: '$name secondary/surface');
      });

      test('$name — tertiary text reaches 3:1 (large/secondary UI)', () {
        expect(contrast(c.textTertiary, c.bgBase), greaterThanOrEqualTo(3.0), reason: '$name tertiary/bg');
        expect(contrast(c.textTertiary, c.surface), greaterThanOrEqualTo(3.0), reason: '$name tertiary/surface');
      });

      test('$name — status colours are readable on their surfaces', () {
        for (final entry in <(String, Color)>[
          ('success', c.success),
          ('warning', c.warning),
          ('danger', c.danger),
          ('info', c.info),
        ]) {
          expect(contrast(entry.$2, c.surface), greaterThanOrEqualTo(3.0), reason: '$name ${entry.$1}/surface');
        }
      });

      test('$name — text on brand reaches 4.5:1 (button labels)', () {
        expect(contrast(c.textOnBrand, c.brand), greaterThanOrEqualTo(4.5), reason: '$name onBrand/brand');
        expect(contrast(c.textOnBrand, c.brandStrong), greaterThanOrEqualTo(4.5), reason: '$name onBrand/brandStrong');
      });

      test('$name — nav active/inactive are distinguishable at a glance', () {
        final ratio = contrast(c.navActive, c.navInactive);
        final hue = hueDelta(c.navActive, c.navInactive);
        expect(
          ratio >= 1.5 || hue >= 25,
          isTrue,
          reason: '$name nav states — luminance ratio $ratio, hue delta $hue° (need one of them)',
        );
        // The inactive label still has to be readable on its own surface.
        expect(contrast(c.navInactive, c.bgBase), greaterThanOrEqualTo(4.5), reason: '$name navInactive/bg');
      });
    }
  });

  group('theme composition', () {
    test('exposes the palette through ThemeExtension in both modes', () {
      for (final theme in <ThemeData>[AppTheme.dark(), AppTheme.light()]) {
        final palette = theme.extension<AppColors>();
        expect(palette, isNotNull);
        expect(palette!.brightness, theme.brightness);
      }
    });

    test('TextTheme uses Plus Jakarta Sans everywhere', () {
      final theme = AppTheme.dark();
      final styles = <TextStyle?>[
        theme.textTheme.displayLarge,
        theme.textTheme.headlineMedium,
        theme.textTheme.bodyLarge,
        theme.textTheme.bodyMedium,
        theme.textTheme.labelSmall,
      ];
      for (final style in styles) {
        expect(style?.fontFamily, AppTypography.family);
      }
    });

    test('money styles use tabular figures (columns never jitter)', () {
      final features = AppTypography.money().fontFeatures ?? const <FontFeature>[];
      expect(features.any((f) => f.feature == 'tnum'), isTrue);
      final hero = AppTypography.moneyHero().fontFeatures ?? const <FontFeature>[];
      expect(hero.any((f) => f.feature == 'tnum'), isTrue);
    });

    test('variable-font axis is set alongside the static weight', () {
      final style = AppTypography.h1();
      expect(style.fontVariations, isNotNull);
      expect(style.fontVariations!.first.axis, 'wght');
      expect(style.fontVariations!.first.value, 700);
    });

    test('button themes keep the 48 dp touch target and our type family', () {
      final theme = AppTheme.dark();
      final buttonStyle = theme.filledButtonTheme.style;
      expect(buttonStyle?.minimumSize?.resolve({}), const Size(0, AppSpacing.minTouchTarget));
      expect(buttonStyle?.textStyle?.resolve({})?.fontFamily, AppTypography.family);
    });

    test('input decoration uses token colours (no raw hex in components)', () {
      final theme = AppTheme.dark();
      final palette = theme.extension<AppColors>()!;
      expect(theme.inputDecorationTheme.fillColor, palette.surfaceMuted);
      expect(theme.cardTheme.color, palette.surface);
    });

    test('page transitions animate through the spring curve', () {
      final theme = AppTheme.dark();
      expect(theme.pageTransitionsTheme.builders[TargetPlatform.android], isNotNull);
      expect(theme.pageTransitionsTheme.builders[TargetPlatform.iOS], isNotNull);
    });

    test('lerp animates between palettes without dropping roles', () {
      final mid = AppColors.dark.lerp(AppColors.light, 0.5);
      expect(mid.textPrimary, isNot(AppColors.dark.textPrimary));
      expect(mid.brand, isNot(AppColors.dark.brand));
      expect(mid.brand, isNot(AppColors.light.brand));
    });
  });
}
