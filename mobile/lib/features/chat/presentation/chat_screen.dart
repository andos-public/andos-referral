import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../design/icons/app_icons.dart';
import '../../../design/widgets/edge_to_edge_scaffold.dart';
import '../../../design/widgets/phase_notice.dart';

/// Chat — Phase-3 owns the real thread; Phase-2 ships the shell + the referral
/// chat entitlement gate (which the backend already enforces).
class ChatScreen extends ConsumerWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const EdgeToEdgeScaffold(
      title: 'Chat',
      subtitle: 'Unlocked by verified install + login',
      body: PhaseNotice(
        icon: AppIcons.chatLocked,
        title: 'Chat shell is ready',
        body:
            'Referral chat unlocks only after a trusted install + login is verified on the main app. '
            'Phase 3 brings the rich/E2EE message layer; this shell carries the entitlement gate.',
        bullets: <String>[
          'Locked → Unlocked gate rendered from GET /v1/referrals/:id/chat-access',
          'Thread list grouped by unlock recency, with unread pulse on the tab',
          'Composer with attach / camera / gallery / mic (SVG icon set)',
          'Spring-driven sheet for message actions, haptics on send',
        ],
        footnote: 'No fake threads are shown: an empty chat list means nobody is unlocked yet.',
      ),
    );
  }
}
