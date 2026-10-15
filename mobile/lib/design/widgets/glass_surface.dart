import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';
import '../tokens/app_shadows.dart';
import '../tokens/app_spacing.dart';

/// Frosted-glass panel — the signature surface of the 2026 shell.
///
/// Two realisations:
///  * `GlassSurface`      — full blur (nav bar, headers, floating cards).
///  * `GlassSurface.lite` — tint + hairline only, for low-cost-mode devices
///    (bounded blur budget; see [GlassSurface.lowCostMode]).
///
/// The blur is intentionally *bounded* (`blurSigma` default 18) so a budget
/// phone can hold 60 FPS; `GlassSurface.lowCostMode` can be switched on from a
/// device-performance probe without touching any screen.
class GlassSurface extends StatelessWidget {
  const GlassSurface({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.blurSigma = 18,
    this.tint,
    this.borderColor,
    this.shadows,
    this.useBlur = true,
  });

  /// Cheap variant: no blur, just a translucent tint + hairline border.
  const GlassSurface.lite({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.tint,
    this.borderColor,
    this.shadows,
  })  : blurSigma = 0,
        useBlur = false;

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final double blurSigma;
  final Color? tint;
  final Color? borderColor;
  final List<BoxShadow>? shadows;
  final bool useBlur;

  /// Global switch — set false on low-end devices (e.g. from a FPS probe) and
  /// every glass surface degrades to the lite treatment at once.
  static bool lowCostMode = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final radius = borderRadius ?? AppRadii.allXl;
    final shouldBlur = useBlur && !lowCostMode && blurSigma > 0;

    Widget panel = DecoratedBox(
      decoration: BoxDecoration(
        color: tint ?? colors.glassTint,
        borderRadius: radius,
        border: Border.all(color: borderColor ?? colors.glassBorder, width: 1),
        boxShadow: shadows ?? AppShadows.floating(colors),
      ),
      child: Padding(
        padding: padding ?? EdgeInsets.zero,
        child: child,
      ),
    );

    if (shouldBlur) {
      panel = ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma, tileMode: TileMode.clamp),
          child: panel,
        ),
      );
    } else {
      panel = ClipRRect(borderRadius: radius, child: panel);
    }

    if (margin != null) {
      panel = Padding(padding: margin!, child: panel);
    }
    return panel;
  }
}

/// A glass card used inside scroll views (list items, stat tiles).
/// Slightly stronger surface colour than the nav bar so text stays AA-readable.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.gap16),
    this.onTap,
    this.accent,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  /// Optional leading accent — a 3 dp brand rail on the card's left edge.
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final content = GlassSurface(
      padding: padding,
      tint: colors.surface.withValues(alpha: colors.isDark ? 0.72 : 0.94),
      borderColor: colors.border,
      borderRadius: AppRadii.allLg,
      shadows: AppShadows.card(colors),
      child: accent == null
          ? child
          : Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 3,
                  height: 34,
                  margin: const EdgeInsets.only(right: AppSpacing.gap12),
                  decoration: BoxDecoration(color: accent, borderRadius: AppRadii.allPill),
                ),
                Expanded(child: child),
              ],
            ),
    );

    if (onTap == null) return content;
    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadii.allLg,
        splashFactory: NoSplash.splashFactory,
        highlightColor: colors.brandSoft,
        child: content,
      ),
    );
  }
}
