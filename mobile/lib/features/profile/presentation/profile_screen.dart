import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/router/app_routes.dart';
import '../../../app/shell/app_shell.dart';
import '../../../core/providers/app_providers.dart';
import '../../../design/icons/app_icon.dart';
import '../../../design/icons/app_icons.dart';
import '../../../design/tokens/app_colors.dart';
import '../../../design/tokens/app_spacing.dart';
import '../../../design/tokens/app_typography.dart';
import '../../../design/widgets/edge_to_edge_scaffold.dart';
import '../../../design/widgets/glass_surface.dart';
import '../../../design/widgets/press_scale.dart';

/// Profile — the fourth tab: who you are, what your referrals have earned, and
/// **every setting inside this screen** (theme, haptics, payout methods,
/// security, legal, help, sign out).
///
/// Settings are deliberately not a fifth tab: this is the only place they live.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.colors;
    final themeMode = ref.watch(themeModeProvider);
    final haptics = ref.watch(hapticsEnabledProvider);

    return EdgeToEdgeScaffold(
      title: 'Profile',
      subtitle: 'You, your stats and your settings',
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          const _IdentityCard(),
          const SizedBox(height: AppSpacing.gap16),
          const _StatsRow(),
          const SizedBox(height: AppSpacing.gap20),

          _SectionLabel('Appearance'),
          GlassCard(
            child: _ThemeModeRow(
              mode: themeMode,
              onChanged: (mode) => ref.read(themeModeProvider.notifier).set(mode),
            ),
          ),
          const SizedBox(height: AppSpacing.gap20),

          _SectionLabel('Feel'),
          GlassCard(
            child: _SwitchRow(
              icon: AppIcons.mic,
              title: 'Haptic feedback',
              subtitle: 'A light tap on every touch point',
              value: haptics,
              onChanged: (v) => ref.read(hapticsEnabledProvider.notifier).set(v),
            ),
          ),
          const SizedBox(height: AppSpacing.gap20),

          _SectionLabel('Money'),
          GlassCard(
            child: Column(
              children: [
                _NavRow(
                  icon: AppIcons.bank,
                  title: 'Payout methods',
                  subtitle: 'Bank / UPI, stored masked',
                  onTap: () => context.goNamed(AppRoutes.payoutMethodsName),
                ),
                Divider(height: AppSpacing.gap24, color: colors.border),
                _NavRow(
                  icon: AppIcons.receipt,
                  title: 'Withdrawal history',
                  subtitle: 'Past payout requests and UTRs',
                  onTap: () => context.goNamed(AppRoutes.withdrawalHistoryName),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.gap20),

          _SectionLabel('Account'),
          GlassCard(
            child: Column(
              children: [
                _NavRow(
                  icon: AppIcons.fingerprint,
                  title: 'Security',
                  subtitle: 'Biometric lock and sessions',
                  onTap: () => context.goNamed(AppRoutes.securityName),
                ),
                Divider(height: AppSpacing.gap24, color: colors.border),
                _NavRow(
                  icon: AppIcons.bell,
                  title: 'Notifications',
                  subtitle: 'Referral, payout and chat alerts',
                  onTap: () {},
                ),
                Divider(height: AppSpacing.gap24, color: colors.border),
                _NavRow(
                  icon: AppIcons.fileText,
                  title: 'Legal',
                  subtitle: 'Terms and privacy',
                  onTap: () {},
                ),
                Divider(height: AppSpacing.gap24, color: colors.border),
                _NavRow(
                  icon: AppIcons.helpCircle,
                  title: 'Help & support',
                  subtitle: 'FAQ and contact',
                  onTap: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.gap20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
            child: _DangerButton(
              icon: AppIcons.logOut,
              label: 'Sign out',
              onTap: () {},
            ),
          ),
          const SizedBox(height: AppSpacing.gap32),
          const ShellBottomPadding(),
        ],
      ),
    );
  }
}

class _IdentityCard extends StatelessWidget {
  const _IdentityCard();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassCard(
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: colors.brandSoft, borderRadius: AppRadii.allLg),
              child: Center(child: AppIcon(AppIcons.navProfile, size: 26, color: colors.brand)),
            ),
            const SizedBox(width: AppSpacing.gap16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Your profile', style: AppTypography.bodyStrong(16, colors.textPrimary)),
                  const SizedBox(height: 2),
                  Text('Signs in with the main app account',
                      style: AppTypography.caption(12, colors.textTertiary)),
                ],
              ),
            ),
            AppIcon(AppIcons.chevronRight, size: 18, color: colors.textTertiary),
          ],
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    const stats = <(String, String, String)>[
      (AppIcons.navReferrals, '—', 'Referrals'),
      (AppIcons.rupee, '—', 'Earned'),
      (AppIcons.lock, '—', 'On hold'),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.gap16),
        child: Row(
          children: [
            for (var i = 0; i < stats.length; i++) ...[
              if (i > 0) Container(width: 1, height: 34, color: colors.border),
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
          ],
        ),
      ),
    );
  }
}

class _ThemeModeRow extends StatelessWidget {
  const _ThemeModeRow({required this.mode, required this.onChanged});

  final ThemeMode mode;
  final ValueChanged<ThemeMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    const options = <(ThemeMode, String, String)>[
      (ThemeMode.light, 'Light', AppIcons.sun),
      (ThemeMode.dark, 'Dark', AppIcons.moon),
      (ThemeMode.system, 'System', AppIcons.themeAuto),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Theme', style: AppTypography.bodyStrong(15, colors.textPrimary)),
        const SizedBox(height: AppSpacing.gap12),
        Row(
          children: [
            for (var i = 0; i < options.length; i++) ...[
              if (i > 0) const SizedBox(width: AppSpacing.gap8),
              Expanded(
                child: PressScale(
                  onTap: () => onChanged(options[i].$1),
                  semanticLabel: '${options[i].$2} theme',
                  semanticButton: false,
                  minimumSize: const Size(0, 44),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.gap12),
                    decoration: BoxDecoration(
                      color: mode == options[i].$1 ? colors.brandSoft : colors.surfaceMuted,
                      borderRadius: AppRadii.allMd,
                      border: Border.all(
                        color: mode == options[i].$1
                            ? colors.brand.withValues(alpha: 0.55)
                            : colors.border,
                      ),
                    ),
                    child: Column(
                      children: [
                        AppIcon(
                          options[i].$3,
                          size: 18,
                          color: mode == options[i].$1 ? colors.brand : colors.textSecondary,
                        ),
                        const SizedBox(height: AppSpacing.gap8),
                        Text(
                          options[i].$2,
                          style: AppTypography.label(
                            12.5,
                            mode == options[i].$1 ? colors.textPrimary : colors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _SwitchRow extends StatelessWidget {
  const _SwitchRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  final String icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Row(
      children: [
        AppIcon(icon, size: 20, color: colors.textSecondary),
        const SizedBox(width: AppSpacing.gap12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTypography.bodyStrong(15, colors.textPrimary)),
              const SizedBox(height: 2),
              Text(subtitle, style: AppTypography.caption(12, colors.textTertiary)),
            ],
          ),
        ),
        Switch(value: value, onChanged: onChanged),
      ],
    );
  }
}

class _NavRow extends StatelessWidget {
  const _NavRow({required this.icon, required this.title, required this.subtitle, required this.onTap});

  final String icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return PressScale(
      onTap: onTap,
      semanticLabel: title,
      semanticButton: true,
      minimumSize: const Size(0, 48),
      child: Row(
        children: [
          AppIcon(icon, size: 20, color: colors.textSecondary),
          const SizedBox(width: AppSpacing.gap12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.bodyStrong(14.5, colors.textPrimary)),
                const SizedBox(height: 2),
                Text(subtitle, style: AppTypography.caption(11.5, colors.textTertiary)),
              ],
            ),
          ),
          AppIcon(AppIcons.chevronRight, size: 17, color: colors.textTertiary),
        ],
      ),
    );
  }
}

class _DangerButton extends StatelessWidget {
  const _DangerButton({required this.icon, required this.label, required this.onTap});

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
      minimumSize: const Size(0, 50),
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: colors.surfaceMuted,
          borderRadius: AppRadii.allMd,
          border: Border.all(color: colors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AppIcon(icon, size: 18, color: colors.danger),
            const SizedBox(width: AppSpacing.gap8),
            Text(label, style: AppTypography.label(14, colors.danger)),
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
