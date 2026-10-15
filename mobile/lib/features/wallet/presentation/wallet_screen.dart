import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../design/icons/app_icons.dart';
import '../../../design/widgets/edge_to_edge_scaffold.dart';
import '../../../design/widgets/phase_notice.dart';

/// Wallet — the money surface (Sprint 3 backend is live).
class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const EdgeToEdgeScaffold(
      title: 'Wallet',
      subtitle: 'Pending · Available · Withdrawn',
      body: PhaseNotice(
        icon: AppIcons.wallet,
        title: 'Wallet screen lands next',
        body:
            'The ledger, the four buckets and the withdrawal flow are already served by the backend. '
            'This screen renders them with money-safe typography (tabular figures, paise-accurate formatting).',
        bullets: <String>[
          'Four buckets: Pending (7-day hold), Available, Reserved, Withdrawn',
          'Append-only ledger with linked reversal rows (never edited)',
          'Withdraw: amount → UPI/bank method → PENDING_APPROVAL → UTR completion',
          'Payout-method vault entries shown masked only (raw details never stored)',
        ],
        footnote: 'Money is computed in integer paise on the server; the client only formats.',
      ),
    );
  }
}
