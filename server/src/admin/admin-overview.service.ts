import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { formatMinorUnits } from '../common/money.util';
import { DEFAULT_COMMISSION_HOLD_HOURS } from '../order-events/order-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminOverviewDto } from './admin.dto';

/**
 * Read-only operational dashboard (Phase-1 admin console slice). Every number is derived
 * live from the source tables — there is no cached/denormalized copy to drift.
 */
@Injectable()
export class AdminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<AdminOverviewDto> {
    const now = new Date();
    const [
      usersTotal,
      usersActive,
      usersWithExternal,
      codesTotal,
      codesActive,
      codesExpired,
      codesInactive,
      attributionsTotal,
      signedUp,
      installLoginVerified,
      chatUnlocked,
      clicks,
      referrals,
      conversions,
      ordersCompleted,
      ordersRefunded,
      ordersCancelled,
      orderAgg,
      walletCount,
      walletAgg,
      ledgerTransactions,
      entries,
      auditCount,
      auditLast,
      payoutsPending,
      payoutsApproved,
      payoutsCompleted,
      payoutsRejected,
      payoutsCancelled,
      payoutPaise,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
      this.prisma.user.count({ where: { externalSubject: { not: null } } }),
      this.prisma.referralCode.count(),
      this.prisma.referralCode.count({ where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
      this.prisma.referralCode.count({ where: { expiresAt: { not: null, lte: now } } }),
      this.prisma.referralCode.count({ where: { isActive: false, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] } }),
      this.prisma.referralAttribution.count(),
      this.prisma.referralAttribution.count({ where: { referralEvents: { some: { eventType: 'SIGNUP' } } } }),
      this.prisma.referralAttribution.count({ where: { mainAppInstallLoginAt: { not: null } } }),
      this.prisma.referralChatAccess.count({ where: { accessState: 'UNLOCKED' } }),
      this.prisma.referralLinkEvent.count({ where: { eventType: 'CLICK' } }),
      this.prisma.referralLinkEvent.count({ where: { eventType: 'REFERRAL_ATTRIBUTED' } }),
      this.prisma.referralLinkEvent.count({ where: { eventType: 'CONVERSION' } }),
      this.prisma.referralOrderEvent.count({ where: { eventType: 'ORDER_COMPLETED' } }),
      this.prisma.referralOrderEvent.count({ where: { eventType: 'ORDER_REFUNDED' } }),
      this.prisma.referralOrderEvent.count({ where: { eventType: 'ORDER_CANCELLED' } }),
      this.prisma.referralOrderEvent.aggregate({
        where: { eventType: 'ORDER_COMPLETED' },
        _sum: { commissionableNetAmountMinorUnits: true },
      }),
      this.prisma.walletAccount.count(),
      this.prisma.walletAccount.aggregate({
        _sum: {
          pendingMinorUnits: true,
          availableMinorUnits: true,
          reservedMinorUnits: true,
          withdrawnMinorUnits: true,
        },
      }),
      this.prisma.walletLedgerTransaction.count(),
      this.prisma.walletLedgerEntry.count(),
      this.prisma.adminAuditLog.count(),
      this.prisma.adminAuditLog.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      this.prisma.payoutRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      this.prisma.payoutRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.payoutRequest.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payoutRequest.count({ where: { status: 'REJECTED' } }),
      this.prisma.payoutRequest.count({ where: { status: 'CANCELLED' } }),
      this.prisma.payoutRequest.aggregate({ where: { status: 'COMPLETED' }, _sum: { amountMinorUnits: true } }),
    ]);
    const holds = await this.holdAggregates(now);

    const commissionPaise = await this.commissionPaiseTotal();

    return {
      generatedAt: now.toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      users: { total: usersTotal, active: usersActive, withExternalSubject: usersWithExternal },
      referralCodes: {
        total: codesTotal,
        active: codesActive,
        expired: codesExpired,
        inactive: codesInactive,
      },
      attributions: {
        total: attributionsTotal,
        signedUp,
        installLoginVerified,
        chatUnlocked,
      },
      linkEvents: { clicks, referrals, conversions },
      orders: {
        completed: ordersCompleted,
        refunded: ordersRefunded,
        cancelled: ordersCancelled,
        commissionableBasePaise: formatMinorUnits(orderAgg._sum.commissionableNetAmountMinorUnits ?? 0n),
        commissionPaise: formatMinorUnits(commissionPaise),
      },
      wallets: {
        accounts: walletCount,
        pendingPaise: formatMinorUnits(walletAgg._sum.pendingMinorUnits ?? 0n),
        availablePaise: formatMinorUnits(walletAgg._sum.availableMinorUnits ?? 0n),
        reservedPaise: formatMinorUnits(walletAgg._sum.reservedMinorUnits ?? 0n),
        withdrawnPaise: formatMinorUnits(walletAgg._sum.withdrawnMinorUnits ?? 0n),
      },
      holds,
      payouts: {
        pendingApproval: payoutsPending,
        approved: payoutsApproved,
        completed: payoutsCompleted,
        rejected: payoutsRejected,
        cancelled: payoutsCancelled,
        completedPaise: formatMinorUnits(payoutPaise._sum.amountMinorUnits ?? 0n),
      },
      ledger: { transactions: ledgerTransactions, entries },
      audit: { entries: auditCount, lastEntryAt: auditLast?.createdAt.toISOString() ?? null },
    };
  }

  /** Net commission currently held / already released / reversed (from the ledger itself). */
  private async commissionPaiseTotal(): Promise<bigint> {
    const rows = await this.prisma.walletLedgerTransaction.groupBy({
      by: ['transactionType'],
      _sum: { commissionMinorUnits: true },
    });
    let locked = 0n;
    for (const row of rows) {
      if (row.transactionType === 'COMMISSION_LOCKED') {
        locked += row._sum.commissionMinorUnits ?? 0n;
      }
    }
    return locked;
  }

  private async holdAggregates(now: Date): Promise<AdminOverviewDto['holds']> {
    const holdHours = this.holdHours();
    const cutoff = new Date(now.getTime() - holdHours * 3_600_000);

    const [held, heldPaiseRow, released, reversed, dueAndNext] = await this.prisma.$transaction([
      this.prisma.walletLedgerTransaction.count({ where: { transactionType: 'COMMISSION_LOCKED' } }),
      this.prisma.walletLedgerTransaction.aggregate({
        where: { transactionType: 'COMMISSION_LOCKED' },
        _sum: { commissionMinorUnits: true },
      }),
      this.prisma.walletLedgerTransaction.count({ where: { transactionType: 'COMMISSION_RELEASE' } }),
      this.prisma.walletLedgerTransaction.count({ where: { transactionType: 'COMMISSION_REVERSAL' } }),
      this.prisma.$queryRaw<{ due: bigint; next_eligible_at: Date | null }[]>(Prisma.sql`
        WITH locks AS (
          SELECT t.reference_id AS order_event_id, oe.occurred_at
          FROM referral_app.wallet_ledger_transactions t
          JOIN referral_app.referral_order_events oe ON oe.id = t.reference_id
          WHERE t.transaction_type = 'COMMISSION_LOCKED'
        ),
        settled AS (
          SELECT DISTINCT reference_id FROM referral_app.wallet_ledger_transactions
          WHERE transaction_type IN ('COMMISSION_RELEASE', 'COMMISSION_REVERSAL')
        ),
        open_holds AS (
          SELECT locks.* FROM locks
          LEFT JOIN settled ON settled.reference_id = locks.order_event_id
          WHERE settled.reference_id IS NULL
        )
        SELECT
          count(*) FILTER (WHERE occurred_at <= ${cutoff})::bigint AS due,
          min(occurred_at) FILTER (WHERE occurred_at > ${cutoff}) AS next_eligible_at
        FROM open_holds
      `),
    ]);

    const openHolds = held - released - reversed;
    const due = dueAndNext[0]?.due ?? 0n;
    const nextEligibleAt = dueAndNext[0]?.next_eligible_at ?? null;

    return {
      held: Math.max(0, openHolds),
      heldPaise: formatMinorUnits(heldPaiseRow._sum.commissionMinorUnits ?? 0n),
      dueNow: Number(due),
      released,
      reversed,
      nextEligibleAt: nextEligibleAt ? new Date(nextEligibleAt.getTime() + holdHours * 3_600_000).toISOString() : null,
    };
  }

  /** Configured hold window — the overview stays correct when staging runs a shorter window. */
  private holdHours(): number {
    return DEFAULT_COMMISSION_HOLD_HOURS;
  }
}
