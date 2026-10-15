import 'package:flutter/material.dart';

import '../icons/app_icon.dart';
import '../icons/app_icons.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';
import '../tokens/app_typography.dart';
import 'glass_surface.dart';

/// Honest, non-blank placeholder shown on shell screens whose feature work is
/// scheduled next. It states what the screen will contain and which backend
/// endpoints already exist for it — no fake data, no empty white page.
class PhaseNotice extends StatelessWidget {
  const PhaseNotice({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    this.bullets = const <String>[],
    this.footnote,
  });

  final String icon;
  final String title;
  final String body;
  final List<String> bullets;
  final String? footnote;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter, vertical: AppSpacing.gap24),
        child: GlassSurface(
          padding: const EdgeInsets.all(AppSpacing.gap24),
          tint: colors.surface.withValues(alpha: colors.isDark ? 0.74 : 0.96),
          borderColor: colors.border,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              AppIconBadge(icon, size: 22, containerSize: 48),
              const SizedBox(height: AppSpacing.gap16),
              Text(title, style: AppTypography.h2(20, colors.textPrimary)),
              const SizedBox(height: AppSpacing.gap8),
              Text(body, style: AppTypography.body(14, colors.textSecondary)),
              if (bullets.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.gap16),
                for (final bullet in bullets)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.gap8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(top: 3),
                          child: AppIcon(AppIcons.check, size: 15, color: colors.brand),
                        ),
                        const SizedBox(width: AppSpacing.gap8),
                        Expanded(child: Text(bullet, style: AppTypography.body(13.5, colors.textSecondary))),
                      ],
                    ),
                  ),
              ],
              if (footnote != null) ...[
                const SizedBox(height: AppSpacing.gap16),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.gap12),
                  decoration: BoxDecoration(color: colors.surfaceMuted, borderRadius: AppRadii.allSm),
                  child: Text(footnote!, style: AppTypography.caption(12, colors.textTertiary)),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
