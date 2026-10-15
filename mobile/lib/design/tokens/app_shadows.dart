import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Andos Referral — elevation & glow.
///
/// 2026 flagship rule: shadows stay *soft and wide* (never a hard 2 dp drop),
/// and brand elements may carry a controlled glow instead of a shadow.
abstract final class AppShadows {
  /// Cards resting on the page background.
  static List<BoxShadow> card(AppColors colors) => colors.isDark
      ? const [
          BoxShadow(color: Color(0x66000000), blurRadius: 24, offset: Offset(0, 10), spreadRadius: -8),
        ]
      : const [
          BoxShadow(color: Color(0x140F172A), blurRadius: 18, offset: Offset(0, 6), spreadRadius: -6),
        ];

  /// Floating surfaces (nav bar, FAB, sheets).
  static List<BoxShadow> floating(AppColors colors) => colors.isDark
      ? const [
          BoxShadow(color: Color(0x8A000000), blurRadius: 32, offset: Offset(0, 14), spreadRadius: -10),
          BoxShadow(color: Color(0x1A000000), blurRadius: 8, offset: Offset(0, 2)),
        ]
      : const [
          BoxShadow(color: Color(0x1F0F172A), blurRadius: 28, offset: Offset(0, 12), spreadRadius: -10),
          BoxShadow(color: Color(0x0F0F172A), blurRadius: 6, offset: Offset(0, 2)),
        ];

  /// Brand glow for primary CTAs and the active nav indicator.
  static List<BoxShadow> brandGlow(AppColors colors, {double strength = 1}) => [
        BoxShadow(
          color: colors.brand.withValues(alpha: (colors.isDark ? 0.34 : 0.22) * strength),
          blurRadius: 28,
          offset: const Offset(0, 10),
          spreadRadius: -8,
        ),
      ];

  /// Positive-money glow (released commission, completed payout).
  static List<BoxShadow> moneyGlow(AppColors colors, {double strength = 1}) => [
        BoxShadow(
          color: colors.moneyPositive.withValues(alpha: (colors.isDark ? 0.30 : 0.18) * strength),
          blurRadius: 26,
          offset: const Offset(0, 10),
          spreadRadius: -8,
        ),
      ];
}
