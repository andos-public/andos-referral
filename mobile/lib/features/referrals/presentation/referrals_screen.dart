import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../design/icons/app_icon.dart';
import '../../../design/icons/app_icons.dart';
import '../../../design/tokens/app_colors.dart';
import '../../../design/tokens/app_spacing.dart';
import '../../../design/tokens/app_typography.dart';
import '../../../design/widgets/edge_to_edge_scaffold.dart';
import '../../../design/widgets/glass_surface.dart';
import '../../../design/widgets/press_scale.dart';
import '../../../app/shell/app_shell.dart';

/// Referrals — the all-in-one tab: create/share your invite link **and** watch
/// every friend's milestone progress in the same place.
///
/// Milestones mirror the Sprint-2 contract exactly:
/// Attributed → Signed Up → Install + Login verified → Chat unlocked.
class ReferralsScreen extends ConsumerWidget {
  const ReferralsScreen({super.key, this.initialCode});

  /// Present when the screen was opened through `/r/<code>`.
  final String? initialCode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return EdgeToEdgeScaffold(
      title: 'Referrals',
      subtitle: initialCode == null
          ? 'Your link, your network, their progress'
          : 'Invite code $initialCode',
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          const _InviteCard(),
          const SizedBox(height: AppSpacing.gap16),
          const _QuickActions(),
          const SizedBox(height: AppSpacing.gap20),
          _SectionLabel('Your network'),
          const _NetworkEmptyState(),
          const SizedBox(height: AppSpacing.gap20),
          _SectionLabel('How a referral completes'),
          const _MilestoneRail(),
          const SizedBox(height: AppSpacing.gap32),
          const ShellBottomPadding(),
        ],
      ),
    );
  }
}

class _InviteCard extends StatelessWidget {
  const _InviteCard();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('YOUR INVITE LINK', style: AppTypography.label(11, colors.textTertiary)),
            const SizedBox(height: AppSpacing.gap12),
            Row(
              children: [
                AppIcon(AppIcons.link, size: 18, color: colors.brand),
                const SizedBox(width: AppSpacing.gap8),
                Expanded(
                  child: Text(
                    'andos.app/r/YOURCODE — generating…',
                    style: AppTypography.money(13.5, colors.textSecondary),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.gap16),
            Row(
              children: [
                Expanded(
                  child: _PrimaryButton(
                    icon: AppIcons.share,
                    label: 'Share link',
                    onTap: () {},
                  ),
                ),
                const SizedBox(width: AppSpacing.gap8),
                _IconButton(icon: AppIcons.qrCode, label: 'Show QR code', onTap: () {}),
                const SizedBox(width: AppSpacing.gap8),
                _IconButton(icon: AppIcons.copy, label: 'Copy link', onTap: () {}),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    const stats = <(String, String, String)>[
      (AppIcons.cursorTap, '—', 'Clicks'),
      (AppIcons.userPlus, '—', 'Signups'),
      (AppIcons.chartBars, '—', 'Converted'),
      (AppIcons.trendingUp, '—', 'Earned'),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.gap16),
        child: Row(
          children: [
            for (var i = 0; i < stats.length; i++)
              Expanded(
                child: Column(
                  children: [
                    AppIcon(stats[i].$1, size: 17, color: colors.brand),
                    const SizedBox(height: AppSpacing.gap8),
                    Text(stats[i].$2, style: AppTypography.money(16, colors.textPrimary)),
                    const SizedBox(height: 2),
                    Text(stats[i].$3, style: AppTypography.caption(10, colors.textTertiary)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NetworkEmptyState extends StatelessWidget {
  const _NetworkEmptyState();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassCard(
        child: Column(
          children: [
            AppIcon(AppIcons.network, size: 40, color: colors.textTertiary),
            const SizedBox(height: AppSpacing.gap12),
            Text('No referrals yet', style: AppTypography.bodyStrong(15, colors.textPrimary)),
            const SizedBox(height: 4),
            Text(
              'Share your link — friends appear here the moment they register.',
              textAlign: TextAlign.center,
              style: AppTypography.caption(12, colors.textTertiary),
            ),
          ],
        ),
      ),
    );
  }
}

class _MilestoneRail extends StatelessWidget {
  const _MilestoneRail();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    const steps = <(String, String, String)>[
      (AppIcons.link, 'Link opened', 'Attributed to you'),
      (AppIcons.userPlus, 'Signed up', 'New account created'),
      (AppIcons.userCheck, 'Install + login', 'Verified from the main app'),
      (AppIcons.chatUnlocked, 'Chat unlocked', 'You can message each other'),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassCard(
        child: Column(
          children: [
            for (var i = 0; i < steps.length; i++) ...[
              if (i > 0) Divider(height: AppSpacing.gap24, color: colors.border),
              Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(color: colors.brandSoft, borderRadius: AppRadii.allMd),
                    child: Center(
                      child: AppIcon(steps[i].$1, size: 17, color: colors.brand),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.gap12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(steps[i].$2, style: AppTypography.bodyStrong(14, colors.textPrimary)),
                        const SizedBox(height: 2),
                        Text(steps[i].$3, style: AppTypography.caption(11.5, colors.textTertiary)),
                      ],
                    ),
                  ),
                  Text('${i + 1}', style: AppTypography.money(12, colors.textTertiary)),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.screenGutter, AppSpacing.gap8, AppSpacing.screenGutter, AppSpacing.gap12),
      child: Text(
        text.toUpperCase(),
        style: AppTypography.label(11.5, context.colors.textTertiary).copyWith(letterSpacing: 0.9),
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({required this.icon, required this.label, required this.onTap});

  final String icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return PressScale(
      onTap: onTap,
      semanticButton: true,
      semanticLabel: label,
      minimumSize: const Size(0, 48),
      child: Container(
        height: 48,
        decoration: BoxDecoration(color: colors.brand, borderRadius: AppRadii.allMd),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AppIcon(icon, size: 18, color: colors.textOnBrand),
            const SizedBox(width: AppSpacing.gap8),
            Text(label, style: AppTypography.label(14, colors.textOnBrand)),
          ],
        ),
      ),
    );
  }
}

class _IconButton extends StatelessWidget {
  const _IconButton({required this.icon, required this.label, required this.onTap});

  final String icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return PressScale(
      onTap: onTap,
      semanticButton: true,
      semanticLabel: label,
      minimumSize: const Size(48, 48),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: colors.surfaceMuted,
          borderRadius: AppRadii.allMd,
          border: Border.all(color: colors.border),
        ),
        child: Center(child: AppIcon(icon, size: 19, color: colors.brand)),
      ),
    );
  }
}
