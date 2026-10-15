import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../design/icons/app_icon.dart';
import '../../../design/icons/app_icons.dart';
import '../../../design/tokens/app_colors.dart';
import '../../../design/tokens/app_spacing.dart';
import '../../../design/tokens/app_typography.dart';
import '../../../design/widgets/edge_to_edge_scaffold.dart';
import '../../../design/widgets/glass_surface.dart';
import '../../../design/widgets/phase_notice.dart';
import '../../../design/widgets/press_scale.dart';
import '../../../app/shell/app_shell.dart';

/// Chat — the default home tab: every referral conversation in one list.
///
/// A conversation only appears here once the friend's install + login is
/// verified in the main app (Sprint-2 rule: chat stays LOCKED before that).
class ChatScreen extends ConsumerWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return EdgeToEdgeScaffold(
      title: 'Chats',
      subtitle: 'Your referral conversations',
      actions: [
        _HeaderIcon(AppIcons.search, 'Search chats', () {}),
      ],
      body: ListView(
        padding: EdgeInsets.zero,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
            child: PhaseNotice(
              icon: AppIcons.attach,
              title: 'Coming in the next step',
              body: 'Chat opens the moment the messaging API lands — the list, '
                  'search and threads are already routed.',
            ),
          ),
          const SizedBox(height: AppSpacing.gap16),
          _SectionLabel('Locked until verified'),
          const _LockedExample(),
          const SizedBox(height: AppSpacing.gap20),
          _SectionLabel('Conversations'),
          const _EmptyChats(),
          const SizedBox(height: AppSpacing.gap32),
          const ShellBottomPadding(),
        ],
      ),
    );
  }
}

class _LockedExample extends StatelessWidget {
  const _LockedExample();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassCard(
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: colors.surfaceMuted, borderRadius: AppRadii.allMd),
              child: Center(child: AppIcon(AppIcons.chatLocked, size: 20, color: colors.textTertiary)),
            ),
            const SizedBox(width: AppSpacing.gap12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Chat locked', style: AppTypography.bodyStrong(14.5, colors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(
                    'A thread unlocks after the friend installs the app and logs in.',
                    style: AppTypography.caption(12, colors.textTertiary),
                  ),
                ],
              ),
            ),
            AppIcon(AppIcons.info, size: 16, color: colors.textTertiary),
          ],
        ),
      ),
    );
  }
}

class _EmptyChats extends StatelessWidget {
  const _EmptyChats();

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenGutter),
      child: GlassCard(
        child: Column(
          children: [
            AppIcon(AppIcons.navChat, size: 40, color: colors.textTertiary),
            const SizedBox(height: AppSpacing.gap12),
            Text('No conversations yet', style: AppTypography.bodyStrong(15, colors.textPrimary)),
            const SizedBox(height: 4),
            Text(
              'Invite a friend from the Referrals tab — the chat appears here once they join.',
              textAlign: TextAlign.center,
              style: AppTypography.caption(12, colors.textTertiary),
            ),
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

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon(this.icon, this.label, this.onTap);

  final String icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return PressScale(
      onTap: onTap,
      semanticLabel: label,
      semanticButton: true,
      minimumSize: const Size(44, 44),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: colors.surfaceMuted,
          borderRadius: AppRadii.allSm,
          border: Border.all(color: colors.border),
        ),
        child: Center(child: AppIcon(icon, size: 18, color: colors.textSecondary)),
      ),
    );
  }
}
