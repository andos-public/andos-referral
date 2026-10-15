import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/app_providers.dart';
import '../../../design/icons/app_icon.dart';
import '../../../design/icons/app_icons.dart';
import '../../../design/tokens/app_colors.dart';
import '../../../design/tokens/app_spacing.dart';
import '../../../design/tokens/app_typography.dart';
import '../../../design/widgets/edge_to_edge_scaffold.dart';
import '../../../design/widgets/glass_surface.dart';
import '../../../design/widgets/press_scale.dart';
import '../../../app/shell/app_shell.dart';

/// Settings — the first fully functional shell screen: appearance (theme mode),
/// haptics toggle and the app's design-system facts.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.colors;
    final themeMode = ref.watch(themeModeProvider);
    final hapticsEnabled = ref.watch(hapticsEnabledProvider);

    return EdgeToEdgeScaffold(
      title: 'Settings',
      subtitle: 'Appearance, feel and account',
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          _SectionLabel('Appearance'),
          GlassCard(
            child: Column(
              children: [
                _ThemeModeRow(
                  mode: themeMode,
                  onChanged: (mode) {
                    ref.read(themeModeProvider.notifier).set(mode);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.gap20),
          _SectionLabel('Feel'),
          GlassCard(
            child: _SwitchRow(
              icon: AppIcons.sparkles,
              title: 'Haptic feedback',
              subtitle: 'A light tap on every touch point',
              value: hapticsEnabled,
              onChanged: (v) => ref.read(hapticsEnabledProvider.notifier).set(v),
            ),
          ),
          const SizedBox(height: AppSpacing.gap20),
          _SectionLabel('Account'),
          GlassCard(
            child: Column(
              children: [
                _NavRow(icon: AppIcons.user, title: 'Profile', subtitle: 'Name, username, avatar'),
                Divider(height: AppSpacing.gap24, color: colors.border),
                _NavRow(icon: AppIcons.shieldCheck, title: 'Security', subtitle: 'Sessions and devices'),
                Divider(height: AppSpacing.gap24, color: colors.border),
                _NavRow(icon: AppIcons.fileText, title: 'Legal', subtitle: 'Terms and privacy'),
                Divider(height: AppSpacing.gap24, color: colors.border),
                _NavRow(icon: AppIcons.helpCircle, title: 'Help & support', subtitle: 'FAQ and contact'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.gap24),
          Center(
            child: Text('Andos Referral · Phase 1 shell', style: AppTypography.caption(12, colors.textTertiary)),
          ),
          const SizedBox(height: AppSpacing.gap32),
          const ShellBottomPadding(),
        ],
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
      padding: const EdgeInsets.fromLTRB(AppSpacing.screenGutter, AppSpacing.gap8, AppSpacing.screenGutter, AppSpacing.gap12),
      child: Text(
        text.toUpperCase(),
        style: AppTypography.label(11.5, context.colors.textTertiary).copyWith(letterSpacing: 0.9),
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
      (ThemeMode.system, 'System', AppIcons.globe),
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
                        color: mode == options[i].$1 ? colors.brand.withValues(alpha: 0.55) : colors.border,
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
  const _NavRow({required this.icon, required this.title, required this.subtitle});

  final String icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return PressScale(
      onTap: () {},
      semanticLabel: '$title — $subtitle',
      minimumSize: const Size(0, 56),
      child: Row(
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
          AppIcon(AppIcons.chevronRight, size: 18, color: colors.textTertiary),
        ],
      ),
    );
  }
}
