import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../design/icons/app_icons.dart';
import '../../../design/widgets/edge_to_edge_scaffold.dart';
import '../../../design/widgets/phase_notice.dart';

/// Referrals — the attributed-people list (Sprint 2 surface).
class ReferralsScreen extends ConsumerWidget {
  const ReferralsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const EdgeToEdgeScaffold(
      title: 'Referrals',
      subtitle: 'Everyone who joined through you',
      body: PhaseNotice(
        icon: AppIcons.users,
        title: 'Referral list lands next',
        body:
            'This tab shows every first-touch attribution with its milestone rail and chat gate — '
            'driven by GET /v1/referrals.',
        bullets: <String>[
          'Milestone rail: Attributed → Signed up → Install verified → Chat unlocked',
          'Chat gate state per person, with jump-to-chat when unlocked',
          'Search and filters by milestone, hold state and date',
          'Participant-only reads enforced server-side (404 for everyone else)',
        ],
        footnote: 'Backend contract is frozen and tested (Sprint 2 e2e 69/69, Sprint 4 golden journey).',
      ),
    );
  }
}
