import 'package:flutter/material.dart';

/// Andos Referral — colour system.
///
/// Direction (from `ui-ux-pro-max` design-system run, 15 Oct 2026):
/// **"Gold trust + purple tech"** on an obsidian navy base — premium fintech,
/// not playful, no AI-purple/pink gradients (explicitly listed as an anti-pattern).
///
/// Rules that hold for every colour below:
///  * Text pairs must clear WCAG AA (4.5:1) — enforced by `test/design/tokens_test.dart`.
///  * Components never use raw hex; they resolve a *semantic role* through
///    `Theme.of(context).extension<AppColors>()!` (see `context.colors`).
///  * Gold is the money/CTA signal, violet is the "tech/accent" signal used sparingly;
///    neither ever carries meaning alone (icon + label always travel together).
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.brightness,
    required this.bgBase,
    required this.bgGradientTop,
    required this.bgGradientBottom,
    required this.surface,
    required this.surfaceElevated,
    required this.surfaceMuted,
    required this.border,
    required this.borderStrong,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.textOnBrand,
    required this.brand,
    required this.brandStrong,
    required this.brandSoft,
    required this.accent,
    required this.accentSoft,
    required this.success,
    required this.warning,
    required this.danger,
    required this.info,
    required this.moneyPositive,
    required this.moneyNegative,
    required this.moneyHold,
    required this.glassTint,
    required this.glassBorder,
    required this.navActive,
    required this.navInactive,
    required this.navIndicator,
    required this.scrim,
    required this.skeleton,
    required this.focusRing,
    required this.heroGradient,
    required this.brandGradient,
    required this.moneyGradient,
  });

  /// Which brightness this palette was built for.
  final Brightness brightness;

  // ── Surfaces ──────────────────────────────────────────────────────────────
  final Color bgBase;
  final Color bgGradientTop;
  final Color bgGradientBottom;
  final Color surface;
  final Color surfaceElevated;
  final Color surfaceMuted;
  final Color border;
  final Color borderStrong;

  // ── Text ──────────────────────────────────────────────────────────────────
  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color textOnBrand;

  // ── Brand & accent ────────────────────────────────────────────────────────
  final Color brand;
  final Color brandStrong;
  final Color brandSoft;
  final Color accent;
  final Color accentSoft;

  // ── Status ────────────────────────────────────────────────────────────────
  final Color success;
  final Color warning;
  final Color danger;
  final Color info;

  // ── Money semantics (Sprint-3 domain: pending / available / reserved / withdrawn)
  final Color moneyPositive;
  final Color moneyNegative;
  final Color moneyHold;

  // ── Glass & navigation ────────────────────────────────────────────────────
  final Color glassTint;
  final Color glassBorder;
  final Color navActive;
  final Color navInactive;
  final Color navIndicator;

  // ── Overlays ──────────────────────────────────────────────────────────────
  final Color scrim;
  final Color skeleton;
  final Color focusRing;

  // ── Gradients ─────────────────────────────────────────────────────────────
  final LinearGradient heroGradient;
  final LinearGradient brandGradient;
  final LinearGradient moneyGradient;

  /// True when this palette is the dark one (handy in widgets that must pick,
  /// e.g., a blurred overlay strength or a status-bar icon brightness).
  bool get isDark => brightness == Brightness.dark;

  /// The dark, "flagship at night" palette — the primary experience of the app.
  static const AppColors dark = AppColors(
    brightness: Brightness.dark,
    bgBase: Color(0xFF0B1020),
    bgGradientTop: Color(0xFF0F172A),
    bgGradientBottom: Color(0xFF080B12),
    surface: Color(0xFF141C30),
    surfaceElevated: Color(0xFF1B2540),
    surfaceMuted: Color(0xFF202B47),
    border: Color(0xFF2A3654),
    borderStrong: Color(0xFF3B4A6E),
    textPrimary: Color(0xFFF8FAFC),
    textSecondary: Color(0xFFA9B6CE),
    textTertiary: Color(0xFF7C8AA6),
    textOnBrand: Color(0xFF1A1206),
    brand: Color(0xFFF59E0B),
    brandStrong: Color(0xFFFBBF24),
    brandSoft: Color(0x33F59E0B),
    accent: Color(0xFF8B5CF6),
    accentSoft: Color(0x2E8B5CF6),
    success: Color(0xFF34D399),
    warning: Color(0xFFFBBF24),
    danger: Color(0xFFF87171),
    info: Color(0xFF38BDF8),
    moneyPositive: Color(0xFF34D399),
    moneyNegative: Color(0xFFF87171),
    moneyHold: Color(0xFFFBBF24),
    glassTint: Color(0x14FFFFFF),
    glassBorder: Color(0x24FFFFFF),
    navActive: Color(0xFFFBBF24),
    navInactive: Color(0xFF8B98B3),
    navIndicator: Color(0x26F59E0B),
    scrim: Color(0xB3000000),
    skeleton: Color(0xFF1E2946),
    focusRing: Color(0xFFFBBF24),
    heroGradient: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Color(0xFF16203A), Color(0xFF0B1020), Color(0xFF080B12)],
      stops: [0.0, 0.45, 1.0],
    ),
    brandGradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFFBBF24), Color(0xFFF59E0B), Color(0xFFD97706)],
    ),
    moneyGradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF34D399), Color(0xFF10B981)],
    ),
  );

  /// Day palette — same semantics, gold darkened to stay AA-legible on white.
  static const AppColors light = AppColors(
    brightness: Brightness.light,
    bgBase: Color(0xFFF7F8FC),
    bgGradientTop: Color(0xFFFFFFFF),
    bgGradientBottom: Color(0xFFF1F3F9),
    surface: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFFFFFFF),
    surfaceMuted: Color(0xFFF1F3F9),
    border: Color(0xFFE2E6EF),
    borderStrong: Color(0xFFCBD2E1),
    textPrimary: Color(0xFF0F172A),
    textSecondary: Color(0xFF4A5568),
    textTertiary: Color(0xFF6B7280),
    textOnBrand: Color(0xFFFFFBEB),
    brand: Color(0xFF92400E),
    brandStrong: Color(0xFFB45309),
    brandSoft: Color(0x1FB45309),
    accent: Color(0xFF6D28D9),
    accentSoft: Color(0x1F6D28D9),
    success: Color(0xFF15803D),
    warning: Color(0xFFB45309),
    danger: Color(0xFFB91C1C),
    info: Color(0xFF0369A1),
    moneyPositive: Color(0xFF15803D),
    moneyNegative: Color(0xFFB91C1C),
    moneyHold: Color(0xFF92400E),
    glassTint: Color(0xCCFFFFFF),
    glassBorder: Color(0x33FFFFFF),
    navActive: Color(0xFF92400E),
    navInactive: Color(0xFF5B6472),
    navIndicator: Color(0x24B45309),
    scrim: Color(0x99000000),
    skeleton: Color(0xFFE7EAF2),
    focusRing: Color(0xFF6D28D9),
    heroGradient: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [Color(0xFFFFFFFF), Color(0xFFF7F8FC), Color(0xFFF1F3F9)],
      stops: [0.0, 0.5, 1.0],
    ),
    brandGradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
    ),
    moneyGradient: LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFF16A34A), Color(0xFF15803D)],
    ),
  );

  @override
  AppColors copyWith({
    Brightness? brightness,
    Color? bgBase,
    Color? bgGradientTop,
    Color? bgGradientBottom,
    Color? surface,
    Color? surfaceElevated,
    Color? surfaceMuted,
    Color? border,
    Color? borderStrong,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? textOnBrand,
    Color? brand,
    Color? brandStrong,
    Color? brandSoft,
    Color? accent,
    Color? accentSoft,
    Color? success,
    Color? warning,
    Color? danger,
    Color? info,
    Color? moneyPositive,
    Color? moneyNegative,
    Color? moneyHold,
    Color? glassTint,
    Color? glassBorder,
    Color? navActive,
    Color? navInactive,
    Color? navIndicator,
    Color? scrim,
    Color? skeleton,
    Color? focusRing,
    LinearGradient? heroGradient,
    LinearGradient? brandGradient,
    LinearGradient? moneyGradient,
  }) {
    return AppColors(
      brightness: brightness ?? this.brightness,
      bgBase: bgBase ?? this.bgBase,
      bgGradientTop: bgGradientTop ?? this.bgGradientTop,
      bgGradientBottom: bgGradientBottom ?? this.bgGradientBottom,
      surface: surface ?? this.surface,
      surfaceElevated: surfaceElevated ?? this.surfaceElevated,
      surfaceMuted: surfaceMuted ?? this.surfaceMuted,
      border: border ?? this.border,
      borderStrong: borderStrong ?? this.borderStrong,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      textOnBrand: textOnBrand ?? this.textOnBrand,
      brand: brand ?? this.brand,
      brandStrong: brandStrong ?? this.brandStrong,
      brandSoft: brandSoft ?? this.brandSoft,
      accent: accent ?? this.accent,
      accentSoft: accentSoft ?? this.accentSoft,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      danger: danger ?? this.danger,
      info: info ?? this.info,
      moneyPositive: moneyPositive ?? this.moneyPositive,
      moneyNegative: moneyNegative ?? this.moneyNegative,
      moneyHold: moneyHold ?? this.moneyHold,
      glassTint: glassTint ?? this.glassTint,
      glassBorder: glassBorder ?? this.glassBorder,
      navActive: navActive ?? this.navActive,
      navInactive: navInactive ?? this.navInactive,
      navIndicator: navIndicator ?? this.navIndicator,
      scrim: scrim ?? this.scrim,
      skeleton: skeleton ?? this.skeleton,
      focusRing: focusRing ?? this.focusRing,
      heroGradient: heroGradient ?? this.heroGradient,
      brandGradient: brandGradient ?? this.brandGradient,
      moneyGradient: moneyGradient ?? this.moneyGradient,
    );
  }

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    // Theme transitions animate every role so switching light/dark never "pops".
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    return AppColors(
      brightness: t < 0.5 ? brightness : other.brightness,
      bgBase: c(bgBase, other.bgBase),
      bgGradientTop: c(bgGradientTop, other.bgGradientTop),
      bgGradientBottom: c(bgGradientBottom, other.bgGradientBottom),
      surface: c(surface, other.surface),
      surfaceElevated: c(surfaceElevated, other.surfaceElevated),
      surfaceMuted: c(surfaceMuted, other.surfaceMuted),
      border: c(border, other.border),
      borderStrong: c(borderStrong, other.borderStrong),
      textPrimary: c(textPrimary, other.textPrimary),
      textSecondary: c(textSecondary, other.textSecondary),
      textTertiary: c(textTertiary, other.textTertiary),
      textOnBrand: c(textOnBrand, other.textOnBrand),
      brand: c(brand, other.brand),
      brandStrong: c(brandStrong, other.brandStrong),
      brandSoft: c(brandSoft, other.brandSoft),
      accent: c(accent, other.accent),
      accentSoft: c(accentSoft, other.accentSoft),
      success: c(success, other.success),
      warning: c(warning, other.warning),
      danger: c(danger, other.danger),
      info: c(info, other.info),
      moneyPositive: c(moneyPositive, other.moneyPositive),
      moneyNegative: c(moneyNegative, other.moneyNegative),
      moneyHold: c(moneyHold, other.moneyHold),
      glassTint: c(glassTint, other.glassTint),
      glassBorder: c(glassBorder, other.glassBorder),
      navActive: c(navActive, other.navActive),
      navInactive: c(navInactive, other.navInactive),
      navIndicator: c(navIndicator, other.navIndicator),
      scrim: c(scrim, other.scrim),
      skeleton: c(skeleton, other.skeleton),
      focusRing: c(focusRing, other.focusRing),
      heroGradient: LinearGradient.lerp(heroGradient, other.heroGradient, t)!,
      brandGradient: LinearGradient.lerp(brandGradient, other.brandGradient, t)!,
      moneyGradient: LinearGradient.lerp(moneyGradient, other.moneyGradient, t)!,
    );
  }
}

/// Ergonomic access: `context.colors.brand`.
extension AppColorsContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}
