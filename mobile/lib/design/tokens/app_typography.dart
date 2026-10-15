import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Andos Referral — typography.
///
/// Family: **Plus Jakarta Sans** (owner-locked). The family ships as a single
/// variable font, so every style carries *both* a `fontWeight` (for engines that
/// map static weights) and a `fontVariations` entry (the real axis control).
///
/// Scale follows the ui-ux-pro-max typography rules: base body ≥ 16 sp,
/// line-height ≈ 1.5 for reading text, ≤ 3 weights per screen, and tabular
/// figures for anything that shows money so columns never jitter.
abstract final class AppTypography {
  /// Family name as declared in `pubspec.yaml`.
  static const String family = 'PlusJakartaSans';

  /// Axis value for a weight, used by `fontVariations`.
  static FontVariation _wght(double weight) => FontVariation('wght', weight);

  static TextStyle _style({
    required double size,
    required double height,
    required double weight,
    double letterSpacing = 0,
    bool tabular = false,
    Color? color,
    FontStyle style = FontStyle.normal,
  }) {
    return TextStyle(
      fontFamily: family,
      fontSize: size,
      height: height / size,
      fontWeight: FontWeight.values[(weight ~/ 100) - 1],
      letterSpacing: letterSpacing,
      fontStyle: style,
      color: color,
      fontVariations: [_wght(weight)],
      fontFeatures: tabular ? const [FontFeature.tabularFigures()] : null,
    );
  }

  // ── Display / hero numbers ────────────────────────────────────────────────
  static TextStyle display([double size = 34, Color? color]) =>
      _style(size: size, height: size * 1.16, weight: 800, letterSpacing: -0.6, color: color);

  /// Big money figure (wallet balance, commission totals) — tabular by default.
  static TextStyle moneyHero([double size = 32, Color? color]) =>
      _style(size: size, height: size * 1.18, weight: 700, letterSpacing: -0.5, tabular: true, color: color);

  static TextStyle money([double size = 17, Color? color]) =>
      _style(size: size, height: size * 1.35, weight: 600, letterSpacing: -0.1, tabular: true, color: color);

  // ── Headings ──────────────────────────────────────────────────────────────
  static TextStyle h1([double size = 26, Color? color]) =>
      _style(size: size, height: size * 1.22, weight: 700, letterSpacing: -0.4, color: color);

  static TextStyle h2([double size = 20, Color? color]) =>
      _style(size: size, height: size * 1.28, weight: 700, letterSpacing: -0.3, color: color);

  static TextStyle h3([double size = 17, Color? color]) =>
      _style(size: size, height: size * 1.32, weight: 600, letterSpacing: -0.2, color: color);

  // ── Body ──────────────────────────────────────────────────────────────────
  static TextStyle bodyLarge([double size = 16, Color? color]) =>
      _style(size: size, height: size * 1.5, weight: 500, letterSpacing: -0.1, color: color);

  static TextStyle body([double size = 14, Color? color]) =>
      _style(size: size, height: size * 1.5, weight: 500, color: color);

  static TextStyle bodyStrong([double size = 15, Color? color]) =>
      _style(size: size, height: size * 1.45, weight: 600, color: color);

  // ── Supporting ────────────────────────────────────────────────────────────
  static TextStyle label([double size = 13, Color? color]) =>
      _style(size: size, height: size * 1.35, weight: 600, letterSpacing: 0.1, color: color);

  static TextStyle caption([double size = 12, Color? color]) =>
      _style(size: size, height: size * 1.4, weight: 500, letterSpacing: 0.1, color: color);

  /// Numbers inside chips/badges — always tabular.
  static TextStyle numeric([double size = 13, Color? color]) =>
      _style(size: size, height: size * 1.35, weight: 700, tabular: true, color: color);

  /// Builds the Material `TextTheme` for a palette. Widgets should still read
  /// styles through `context.text.*` helpers rather than hardcoding sizes.
  static TextTheme textTheme(Color primary, Color secondary, Color tertiary) {
    return TextTheme(
      displayLarge: display(34, primary),
      displayMedium: display(28, primary),
      displaySmall: display(24, primary),
      headlineLarge: h1(26, primary),
      headlineMedium: h1(22, primary),
      headlineSmall: h2(20, primary),
      titleLarge: h2(20, primary),
      titleMedium: h3(17, primary),
      titleSmall: bodyStrong(15, primary),
      bodyLarge: bodyLarge(16, primary),
      bodyMedium: body(14, secondary),
      bodySmall: caption(12, tertiary),
      labelLarge: label(14, primary),
      labelMedium: label(13, secondary),
      labelSmall: caption(11, tertiary),
    );
  }
}

/// Ergonomic text access: `context.text.h2()`, `context.text.money()`.
extension AppTypographyContext on BuildContext {
  AppTypographyAccessor get text => const AppTypographyAccessor();
}

@immutable
class AppTypographyAccessor {
  const AppTypographyAccessor();

  TextStyle display(BuildContext context, [double size = 34]) => AppTypography.display(size, context.colors.textPrimary);
  TextStyle moneyHero(BuildContext context, [double size = 32]) =>
      AppTypography.moneyHero(size, context.colors.textPrimary);
  TextStyle money(BuildContext context, [double size = 17]) => AppTypography.money(size, context.colors.textPrimary);
  TextStyle h1(BuildContext context, [double size = 26]) => AppTypography.h1(size, context.colors.textPrimary);
  TextStyle h2(BuildContext context, [double size = 20]) => AppTypography.h2(size, context.colors.textPrimary);
  TextStyle h3(BuildContext context, [double size = 17]) => AppTypography.h3(size, context.colors.textPrimary);
  TextStyle bodyLarge(BuildContext context, [double size = 16]) => AppTypography.bodyLarge(size, context.colors.textPrimary);
  TextStyle body(BuildContext context, [double size = 14]) => AppTypography.body(size, context.colors.textSecondary);
  TextStyle bodyStrong(BuildContext context, [double size = 15]) =>
      AppTypography.bodyStrong(size, context.colors.textPrimary);
  TextStyle label(BuildContext context, [double size = 13]) => AppTypography.label(size, context.colors.textSecondary);
  TextStyle caption(BuildContext context, [double size = 12]) => AppTypography.caption(size, context.colors.textTertiary);
  TextStyle numeric(BuildContext context, [double size = 13]) => AppTypography.numeric(size, context.colors.textPrimary);
}
