import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/haptics/app_haptics.dart';
import '../../../design/icons/app_icon.dart';
import '../../../design/icons/app_icons.dart';
import '../../../design/tokens/app_colors.dart';
import '../../../design/tokens/app_shadows.dart';
import '../../../design/tokens/app_spacing.dart';
import '../../../design/tokens/app_typography.dart';
import '../../../design/widgets/edge_to_edge_scaffold.dart';
import '../../../design/widgets/glass_surface.dart';
import '../../../design/widgets/press_scale.dart';
import '../../../app/shell/app_shell.dart';

/// Invite Hub — the app's home tab (Sprint 1 surface).
///
/// This screen is the design-system proof: hero gradient behind the status bar,
/// glass cards, custom-SVG icons only, spring press feedback before the data
/// layer lands (the code list will bind to `/v1/referral-codes`).
class InviteHubScreen extends ConsumerStatefulWidget {
  const InviteHubScreen({super.key, this.linkId, this.initialCode});

  /// When opened from `/invite/:id`.
  final String? linkId;

  /// When opened through a deep link (`/r/<code>`).
  final String? initialCode;

  @override
  ConsumerState<InviteHubScreen> createState() => _InviteHubScreenState();
}

class _InviteHubScreenState extends ConsumerState<InviteHubScreen> {
  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return EdgeToEdgeScaffold(
      title: 'Invite Hub',
      subtitle: widget.initialCode == null ? 'Share your link, earn together' : 'Invite code ${widget.initialCode}',
      actions: [
        _HeaderIconButton(icon: AppIcons.qrCode, label: 'Show QR code', onTap: () {}),
        _HeaderIconButton(icon: AppIcons.bell, label: 'Notifications', onTap: () {}),
      ],
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          const _HeroCard(),
          const SizedBox(height: AppSpacing.gap16),

          // Quick actions
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
            child: Row(
              children: [
                Expanded(
                  child: _QuickAction(
                    icon: AppIcons.share,
                    label: 'Share link',
                    onTap: () => AppHaptics.tap(),
                  ),
                ),
                const SizedBox(width: AppSpacing.gap12),
                Expanded(
                  child: _QuickAction(
                    icon: AppIcons.copy,
                    label: 'Copy code',
                    onTap: () => AppHaptics.tap(),
                  ),
                ),
                const SizedBox(width: AppSpacing.gap12),
                Expanded(
                  child: _QuickAction(
                    icon: AppIcons.gift,
                    label: 'Rewards',
                    onTap: () => AppHaptics.tap(),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.gap20),

          // Stats strip
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
            child: _StatsRow(
              colors: colors,
              stats: const [
                (AppIcons.cursorTap, 'Clicks', '—'),
                (AppIcons.userCheck, 'Signups', '—'),
                (AppIcons.rupee, 'Earned', '—'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.gap20),

          // Section: links
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
            child: Row(
              children: [
                Text('Your links', style: AppTypography.h3(17, colors.textPrimary)),
                const Spacer(),
                Text('All', style: AppTypography.label(13, colors.brand)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.gap12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
            child: GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      AppIconBadge(AppIcons.link, size: 18, containerSize: 40),
                      const SizedBox(width: AppSpacing.gap12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('No links yet', style: AppTypography.bodyStrong(15, colors.textPrimary)),
                            const SizedBox(height: 2),
                            Text(
                              'Create your first invite link — it stays active until you turn it off.',
                              style: AppTypography.caption(12, colors.textTertiary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.gap16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => AppHaptics.confirm(),
                      icon: AppIcon(AppIcons.add, size: 18, color: colors.textOnBrand),
                      label: const Text('Create invite link'),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: AppSpacing.gap32),
          const ShellBottomPadding(),
        ],
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassSurface(
        borderRadius: AppRadii.allXl,
        padding: const EdgeInsets.all(AppSpacing.gap20),
        tint: colors.surface.withValues(alpha: colors.isDark ? 0.70 : 0.96),
        borderColor: colors.border,
        shadows: AppShadows.card(colors),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('This month', style: AppTypography.caption(12, colors.textTertiary)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: colors.brandSoft, borderRadius: AppRadii.allPill),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AppIcon(AppIcons.trendingUp, size: 13, color: colors.brand),
                      const SizedBox(width: 4),
                      Text('Live', style: AppTypography.label(11.5, colors.brand)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.gap12),
            // Balance placeholder — the real figure binds to /v1/wallet.
            ShaderMask(
              shaderCallback: (rect) => colors.brandGradient.createShader(rect),
              child: Text('₹ —', style: AppTypography.moneyHero(34, Colors.white)),
            ),
            const SizedBox(height: AppSpacing.gap8),
            Text(
              'Commission lands here 7 days after an order completes, then moves to Available.',
              style: AppTypography.caption(12.5, colors.textTertiary),
            ),
            const SizedBox(height: AppSpacing.gap16),
            // Wrap, not Row: on a 360 dp phone the three buckets flow onto a
            // second line instead of overflowing (caught by the shell test).
            Wrap(
              spacing: AppSpacing.gap8,
              runSpacing: AppSpacing.gap8,
              children: [
                _BucketChip(label: 'Pending', color: colors.moneyHold),
                _BucketChip(label: 'Available', color: colors.moneyPositive),
                _BucketChip(label: 'Withdrawn', color: colors.info),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BucketChip extends StatelessWidget {
  const _BucketChip({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: AppRadii.allPill,
        border: Border.all(color: color.withValues(alpha: 0.32)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(label, style: AppTypography.caption(11.5, context.colors.textSecondary)),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  final String icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return PressScale(
      onTap: onTap,
      semanticLabel: label,
      child: GlassSurface(
        borderRadius: AppRadii.allLg,
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.gap16),
        tint: colors.surface.withValues(alpha: colors.isDark ? 0.62 : 0.94),
        borderColor: colors.border,
        child: Column(
          children: [
            AppIcon(icon, size: 20, color: colors.brand),
            const SizedBox(height: AppSpacing.gap8),
            Text(label, style: AppTypography.label(12, colors.textSecondary)),
          ],
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.colors, required this.stats});

  final AppColors colors;
  final List<(String, String, String)> stats;

  @override
  Widget build(BuildContext context) {
    return GlassSurface(
      borderRadius: AppRadii.allLg,
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.gap16, horizontal: AppSpacing.gap8),
      tint: colors.surface.withValues(alpha: colors.isDark ? 0.62 : 0.94),
      borderColor: colors.border,
      child: Row(
        children: [
          for (var i = 0; i < stats.length; i++) ...[
            if (i > 0) Container(width: 1, height: 32, color: colors.border),
            Expanded(
              child: Column(
                children: [
                  AppIcon(stats[i].$1, size: 18, color: colors.textTertiary),
                  const SizedBox(height: AppSpacing.gap8),
                  Text(stats[i].$3, style: AppTypography.numeric(16, colors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(stats[i].$2, style: AppTypography.caption(11.5, colors.textTertiary)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({required this.icon, required this.label, required this.onTap});

  final String icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return PressScale(
      onTap: onTap,
      semanticLabel: label,
      minimumSize: const Size(44, 44),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: colors.surface.withValues(alpha: 0.6),
          shape: BoxShape.circle,
          border: Border.all(color: colors.border),
        ),
        alignment: Alignment.center,
        child: AppIcon(icon, size: 19, color: colors.textPrimary),
      ),
    );
  }
}
