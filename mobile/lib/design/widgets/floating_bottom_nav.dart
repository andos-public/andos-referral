import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

import '../../core/haptics/app_haptics.dart';
import '../icons/app_icon.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_motion.dart';
import '../tokens/app_shadows.dart';
import '../tokens/app_spacing.dart';
import '../tokens/app_typography.dart';
import 'glass_surface.dart';

/// One destination of the floating nav.
@immutable
class FloatingNavItem {
  const FloatingNavItem({
    required this.icon,
    required this.label,
    this.selectedIcon,
    this.badgeCount,
  });

  /// Icon id (custom SVG — see `AppIcons`).
  final String icon;

  /// Optional distinct icon for the selected state (e.g. filled vs outline).
  final String? selectedIcon;

  final String label;

  /// Unread/pending count rendered as a small badge (0 = hidden).
  final int? badgeCount;
}

/// The 2026 flagship bottom navigation:
///
///  * floats above the content with a real frosted-glass panel,
///  * a spring-driven pill indicator slides between destinations,
///  * icon + label animate their weight/opacity, selection vibrates once,
///  * 48 dp minimum touch targets with ≥ 8 dp separation,
///  * degrades to the lite glass treatment on low-cost devices and to a plain
///    fade under reduced-motion.
class FloatingBottomNav extends StatefulWidget {
  const FloatingBottomNav({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onSelect,
    this.showLabels = true,
    this.semanticLabelPrefix = 'Tab',
  });

  final List<FloatingNavItem> items;
  final int currentIndex;

  /// Called with the tapped index; the shell owns routing.
  final ValueChanged<int> onSelect;

  final bool showLabels;
  final String semanticLabelPrefix;

  @override
  State<FloatingBottomNav> createState() => _FloatingBottomNavState();
}

class _FloatingBottomNavState extends State<FloatingBottomNav> with SingleTickerProviderStateMixin {
  late final AnimationController _indicator = AnimationController.unbounded(vsync: this, value: widget.currentIndex.toDouble());

  /// Last laid-out width of the bar's inner track, used by the painter.
  double _trackWidth = 0;

  @override
  void didUpdateWidget(covariant FloatingBottomNav old) {
    super.didUpdateWidget(old);
    if (old.currentIndex != widget.currentIndex) {
      _animateIndicatorTo(widget.currentIndex.toDouble());
    }
  }

  void _animateIndicatorTo(double target) {
    if (AppMotion.reduceMotion(context)) {
      _indicator.value = target;
      return;
    }
    _indicator.animateWith(
      SpringSimulation(AppMotion.snappy, _indicator.value, target, 0),
    );
  }

  @override
  void dispose() {
    _indicator.dispose();
    super.dispose();
  }

  void _handleTap(int index) {
    if (index == widget.currentIndex) {
      // Re-tapping the active tab still acknowledges the touch (and lets the
      // shell scroll-to-top later) but does not move the indicator.
      AppHaptics.selection();
      widget.onSelect(index);
      return;
    }
    AppHaptics.selection();
    widget.onSelect(index);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final items = widget.items;
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(AppSpacing.screenGutter, 0, AppSpacing.screenGutter, AppSpacing.navFloatGap + bottomInset * 0.35),
      child: GlassSurface(
        borderRadius: AppRadii.allPill,
        blurSigma: 22,
        tint: colors.isDark ? colors.glassTint.withValues(alpha: 0.10) : colors.glassTint.withValues(alpha: 0.86),
        shadows: [AppShadows.floating(colors).first, AppShadows.floating(colors).last],
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.gap8, vertical: AppSpacing.gap8),
        child: SizedBox(
          height: AppSpacing.navBarHeight - AppSpacing.gap16,
          child: LayoutBuilder(
            builder: (context, constraints) {
              _trackWidth = constraints.maxWidth / items.length;
              return Stack(
                children: [
                  Positioned.fill(
                    child: AnimatedBuilder(
                      animation: _indicator,
                      builder: (context, _) => CustomPaint(
                        painter: _NavIndicatorPainter(
                          position: _indicator.value,
                          itemWidth: _trackWidth,
                          color: colors.navIndicator,
                          glow: colors.isDark ? AppShadows.brandGlow(colors, strength: 0.6) : const [],
                        ),
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      for (var i = 0; i < items.length; i++)
                        Expanded(
                          child: _NavItemButton(
                            item: items[i],
                            selected: i == widget.currentIndex,
                            showLabel: widget.showLabels,
                            semanticLabel: '${widget.semanticLabelPrefix} ${i + 1} of ${items.length}: ${items[i].label}',
                            onTap: () => _handleTap(i),
                          ),
                        ),
                    ],
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _NavItemButton extends StatelessWidget {
  const _NavItemButton({
    required this.item,
    required this.selected,
    required this.showLabel,
    required this.semanticLabel,
    required this.onTap,
  });

  final FloatingNavItem item;
  final bool selected;
  final bool showLabel;
  final String semanticLabel;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final tint = selected ? colors.navActive : colors.navInactive;
    final iconName = selected ? (item.selectedIcon ?? item.icon) : item.icon;

    return Semantics(
      label: semanticLabel,
      selected: selected,
      button: true,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: SizedBox(
          height: AppSpacing.minTouchTarget,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _BadgedIcon(name: iconName, selected: selected, tint: tint, badgeCount: item.badgeCount ?? 0),
              if (showLabel) ...[
                const SizedBox(height: AppSpacing.xs),
                AnimatedDefaultTextStyle(
                  duration: AppMotion.durationFor(context, AppMotion.fast),
                  style: (selected ? AppTypographyFor.navLabelSelected(context) : AppTypographyFor.navLabel(context))
                      .copyWith(color: tint),
                  child: Text(item.label, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _BadgedIcon extends StatelessWidget {
  const _BadgedIcon({required this.name, required this.selected, required this.tint, required this.badgeCount});

  final String name;
  final bool selected;
  final Color tint;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final icon = AnimatedScale(
      scale: selected ? 1.06 : 1,
      duration: AppMotion.durationFor(context, AppMotion.fast),
      curve: AppMotion.emphasized,
      child: AppIcon(
        name,
        size: 22,
        color: tint,
        strokeWidth: selected ? 1.85 : 1.6,
      ),
    );

    if (badgeCount <= 0) return icon;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        icon,
        Positioned(
          right: -7,
          top: -5,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
            decoration: BoxDecoration(
              gradient: colors.brandGradient,
              borderRadius: AppRadii.allPill,
              border: Border.all(color: colors.bgBase, width: 1.5),
            ),
            alignment: Alignment.center,
            child: Text(
              badgeCount > 99 ? '99+' : '$badgeCount',
              style: AppTypographyFor.badge(context),
            ),
          ),
        ),
      ],
    );
  }
}

/// Painter for the sliding pill behind the active destination.
class _NavIndicatorPainter extends CustomPainter {
  _NavIndicatorPainter({required this.position, required this.itemWidth, required this.color, required this.glow});

  final double position;
  final double itemWidth;
  final Color color;
  final List<BoxShadow> glow;

  @override
  void paint(Canvas canvas, Size size) {
    if (itemWidth <= 0) return;
    final pillWidth = itemWidth.clamp(0.0, size.width);
    final left = (position * itemWidth + (itemWidth - pillWidth) / 2).clamp(0.0, size.width - pillWidth);
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(left, 0, pillWidth, size.height),
      Radius.circular(size.height / 2),
    );

    // Soft brand glow: draw the pill a few times with big blur before the fill.
    for (final shadow in glow) {
      final glowPaint = Paint()
        ..color = shadow.color
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, shadow.blurRadius / 2);
      canvas.drawRRect(rect, glowPaint);
    }

    canvas.drawRRect(rect, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_NavIndicatorPainter old) =>
      old.position != position || old.itemWidth != itemWidth || old.color != color;
}

/// Text styles the nav needs, expressed once (kept local so the nav does not
/// depend on the larger typography accessor surface).
abstract final class AppTypographyFor {
  static TextStyle navLabel(BuildContext context) =>
      AppTypography.label(10.5, context.colors.navInactive).copyWith(letterSpacing: 0.1);

  static TextStyle navLabelSelected(BuildContext context) =>
      AppTypography.label(10.5, context.colors.navActive).copyWith(letterSpacing: 0.1, fontWeight: FontWeight.w700);

  static TextStyle badge(BuildContext context) =>
      AppTypography.numeric(10, context.colors.textOnBrand).copyWith(height: 1.2);
}
