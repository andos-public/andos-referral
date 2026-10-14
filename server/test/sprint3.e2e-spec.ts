import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Sprint 3 e2e — commission math, 7-day hold, append-only ledger, refunds and withdrawals.
 * Runs against real PostgreSQL. Locked rules under test:
 *   commission = floor(netPaid × rateBps / 10000) · 25% default · TEAMCHX 50% ·
 *   168 h hold from ORDER_COMPLETED · compensating reversals · PENDING_APPROVAL withdrawals.
 */
const ADMIN_KEY = 'e2e-admin-key';
const WEBHOOK_SECRET = 'e2e-webhook-secret';

interface CodeResponse {
  id: string;
  publicCode: string;
}
interface UserRow {
  id: string;
}
interface OrderResult {
  recorded: boolean;
  deduplicated: boolean;
  reason?: string;
  orderEventId?: string;
  attributionId?: string;
  referrerUserId?: string;
  commissionBaseMinorUnits?: string;
  rateBps?: number;
  rewardRuleKey?: string;
  promoCodeNormalized?: string | null;
  commissionMinorUnits?: string;
  rewardEligibility?: string;
  holdReleaseEligibleAt?: string | null;
  ledgerPosted?: boolean;
  reversed?: boolean;
  reversalBucket?: string;
}
interface WalletOverview {
  currency: string;
  balances: {
    pendingMinorUnits: string;
    availableMinorUnits: string;
    reservedMinorUnits: string;
    withdrawnMinorUnits: string;
  };
  updatedAt: string | null;
  ledgerTransactionCount: number;
}
interface LedgerList {
  data: {
    id: string;
    transactionType: string;
    referenceType: string;
    referenceId: string;
    commissionBaseMinorUnits: string | null;
    rateBps: number | null;
    commissionMinorUnits: string | null;
    promoCodeNormalized: string | null;
    entries: { bucket: string; amountMinorUnits: string }[];
  }[];
  total: number;
}
const as = <T>(res: request.Response): T => res.body as T;

describe('Sprint 3 — commission, ledger, hold & payouts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let owner: UserRow; // referrer A
  let rival: UserRow; // referrer B (first-touch conflict tests)
  let referred: UserRow; // referred user (credited flows)
  let referredB: UserRow; // backdated/release flows
  let referredExternal: string; // Firebase uid used for auto-provision test

  const createdUserIds: string[] = [];
  const createdCodeIds: string[] = [];
  let codeOwner: CodeResponse;
  let codeRival: CodeResponse;

  const http = () => request(app.getHttpServer());

  const sign = (rawBody: string) =>
    createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

  const postSigned = (path: string, body: Record<string, unknown>) => {
    const rawBody = JSON.stringify(body);
    return http()
      .post(`/v1/${path}`)
      .set('Content-Type', 'application/json')
      .set('x-andos-signature', sign(rawBody))
      .send(rawBody);
  };

  const createUser = async (label: string, externalSubject?: string): Promise<UserRow> => {
    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    const user = await prisma.user.create({
      data: { username: `s3_${label}_${suffix}`, ...(externalSubject ? { externalSubject } : {}) },
      select: { id: true },
    });
    createdUserIds.push(user.id);
    return user;
  };

  const createCode = async (userId: string): Promise<CodeResponse> => {
    const res = await http().post('/v1/referral-codes').set('x-user-id', userId).send({}).expect(201);
    const code = as<CodeResponse>(res);
    createdCodeIds.push(code.id);
    return code;
  };

  const wallet = async (userId: string): Promise<WalletOverview['balances']> =>
    as<WalletOverview>(await http().get('/v1/wallet').set('x-user-id', userId).expect(200)).balances;

  const ledger = async (userId: string, limit = 100): Promise<LedgerList> =>
    as<LedgerList>(await http().get(`/v1/wallet/ledger?limit=${limit}`).set('x-user-id', userId).expect(200));

  const sweep = async () =>
    as<{ scanned: number; released: number; skipped: number; failed: number }>(
      await http().post('/v1/admin/wallet/release-due').set('x-admin-key', ADMIN_KEY).send({}).expect(200),
    );

  const completedOrder = (publicCode: string, referredUserId: string, netPaise: string, extra: Record<string, unknown> = {}) =>
    postSigned('order-events/verified', {
      eventType: 'ORDER_COMPLETED',
      orderId: extra.orderId ?? `order-${randomUUID()}`,
      sourceEventId: extra.sourceEventId ?? `evt-${randomUUID()}`,
      publicCode,
      referredUserId,
      netPaidAmountPaise: netPaise,
      ...extra,
    });

  const refundOrder = (publicCode: string, referredUserId: string, orderId: string, eventType = 'ORDER_REFUNDED') =>
    postSigned('order-events/verified', {
      eventType,
      orderId,
      sourceEventId: `evt-${randomUUID()}`,
      publicCode,
      referredUserId,
    });

  beforeAll(async () => {
    // ADMIN_ACTOR_USER_ID must exist BEFORE the module compiles (env is validated at init).
    const bootstrapPrisma = new PrismaClient();
    const admin = await bootstrapPrisma.user.upsert({
      where: { externalSubject: 'e2e-ops-admin' },
      create: { externalSubject: 'e2e-ops-admin', username: 'e2e_ops_admin' },
      update: {},
      select: { id: true },
    });
    await bootstrapPrisma.$disconnect();
    process.env.ADMIN_ACTOR_USER_ID = admin.id;
    createdUserIds.push(admin.id);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    owner = await createUser('owner');
    rival = await createUser('rival');
    referred = await createUser('referred');
    referredB = await createUser('referred_b');
    referredExternal = `firebase-e2e-${randomUUID()}`;

    codeOwner = await createCode(owner.id);
    codeRival = await createCode(rival.id);

    // Attribute the two referred users through the owner's link (first touch).
    await postSigned('main-app-events/verified', {
      eventType: 'INSTALL_LOGIN',
      publicCode: codeOwner.publicCode,
      referredUserId: referred.id,
      sourceEventId: `install-${randomUUID()}`,
    }).expect(200);
    await postSigned('main-app-events/verified', {
      eventType: 'INSTALL_LOGIN',
      publicCode: codeOwner.publicCode,
      referredUserId: referredB.id,
      sourceEventId: `install-${randomUUID()}`,
    }).expect(200);
  });

  afterAll(async () => {
    const users = { in: createdUserIds };
    await prisma.walletLedgerEntry.deleteMany({ where: { transaction: { userId: users } } });
    await prisma.walletLedgerTransaction.deleteMany({ where: { userId: users } });
    await prisma.payoutRequestEvent.deleteMany({ where: { payoutRequest: { userId: users } } });
    await prisma.payoutRequest.deleteMany({ where: { userId: users } });
    await prisma.payoutMethod.deleteMany({ where: { userId: users } });
    await prisma.referralOrderEvent.deleteMany({ where: { attribution: { referredUserId: users } } });
    await prisma.referralLinkEvent.deleteMany({ where: { referralCodeId: { in: createdCodeIds } } });
    await prisma.referralEvent.deleteMany({ where: { attribution: { referredUserId: users } } });
    await prisma.referralChatAccess.deleteMany({ where: { attribution: { referredUserId: users } } });
    await prisma.referralAttribution.deleteMany({ where: { referredUserId: users } });
    await prisma.referralLinkMetric.deleteMany({ where: { referralCodeId: { in: createdCodeIds } } });
    await prisma.referralCode.deleteMany({ where: { ownerUserId: users } });
    await prisma.walletAccount.deleteMany({ where: { userId: users } });
    await prisma.user.deleteMany({ where: { id: users } });
    await app.close();
  });

  describe('commission math & rate selection (locked rules)', () => {
    it('credits ₹200 net at 25% → ₹50 held in PENDING with rule metadata', async () => {
      const res = await completedOrder(codeOwner.publicCode, referred.id, '20000').expect(200);
      const body = as<OrderResult>(res);
      expect(body.recorded).toBe(true);
      expect(body.commissionBaseMinorUnits).toBe('20000');
      expect(body.rateBps).toBe(2500);
      expect(body.rewardRuleKey).toBe('DEFAULT_REFERRAL');
      expect(body.commissionMinorUnits).toBe('5000');
      expect(body.rewardEligibility).toBe('HOLD');
      expect(body.ledgerPosted).toBe(true);
      const eligibleAt = Date.parse(body.holdReleaseEligibleAt!);
      expect(eligibleAt - Date.now()).toBeGreaterThan(167 * 60 * 60 * 1000);
      expect(eligibleAt - Date.now()).toBeLessThanOrEqual(168 * 60 * 60 * 1000 + 5000);

      const balances = await wallet(owner.id);
      expect(balances.pendingMinorUnits).toBe('5000');
      expect(balances.availableMinorUnits).toBe('0');
    });

    it('credits ₹200 net with promo "TEAM CHX" at 50% → ₹100 (canonical TEAMCHX)', async () => {
      const res = await completedOrder(codeOwner.publicCode, referred.id, '20000', {
        appliedPromoCode: ' Team  Chx ',
      }).expect(200);
      const body = as<OrderResult>(res);
      expect(body.rateBps).toBe(5000);
      expect(body.promoCodeNormalized).toBe('TEAMCHX');
      expect(body.rewardRuleKey).toBe('PROMO_TEAMCHX');
      expect(body.commissionMinorUnits).toBe('10000');

      const balances = await wallet(owner.id);
      expect(balances.pendingMinorUnits).toBe('15000');
    });

    it('floors odd amounts exactly: ₹0.99 net (99 paise) at 25% → 24 paise', async () => {
      const res = await completedOrder(codeOwner.publicCode, referred.id, '99').expect(200);
      expect(as<OrderResult>(res).commissionMinorUnits).toBe('24'); // floor(24.75)
    });

    it('is idempotent per sourceEventId and refuses a second credit for the same order', async () => {
      const orderId = `order-${randomUUID()}`;
      const sourceEventId = `evt-${randomUUID()}`;
      const first = as<OrderResult>(
        await completedOrder(codeOwner.publicCode, referred.id, '40000', { orderId, sourceEventId }).expect(200),
      );
      expect(first.ledgerPosted).toBe(true);
      const before = await wallet(owner.id);

      // Same event id again → the same order event, no second ledger posting.
      const replay = as<OrderResult>(
        await completedOrder(codeOwner.publicCode, referred.id, '40000', { orderId, sourceEventId }).expect(200),
      );
      expect(replay.deduplicated).toBe(true);
      expect(replay.ledgerPosted).toBe(false);
      expect(await wallet(owner.id)).toEqual(before);

      // A brand-new event id for the SAME order must not credit twice either.
      const secondAttempt = as<OrderResult>(
        await completedOrder(codeOwner.publicCode, referred.id, '40000', { orderId }).expect(200),
      );
      expect(secondAttempt.recorded).toBe(false);
      expect(secondAttempt.reason).toBe('ORDER_ALREADY_CREDITED');
      expect(await wallet(owner.id)).toEqual(before);
    });

    it('records the commission metadata on the append-only ledger transaction', async () => {
      const list = await ledger(owner.id);
      const lock = list.data.find((t) => t.commissionBaseMinorUnits === '20000' && t.rateBps === 2500);
      expect(lock).toBeDefined();
      expect(lock?.transactionType).toBe('COMMISSION_LOCKED');
      expect(lock?.entries).toEqual([{ bucket: 'PENDING', amountMinorUnits: '5000' }]);
      const promo = list.data.find((t) => t.promoCodeNormalized === 'TEAMCHX');
      expect(promo?.rateBps).toBe(5000);
      expect(promo?.commissionMinorUnits).toBe('10000');
    });

    it('honours the Firebase uid mapping (auto-provisions a new external user)', async () => {
      const signup = await postSigned('main-app-events/verified', {
        eventType: 'SIGNUP',
        publicCode: codeOwner.publicCode,
        externalUserId: referredExternal,
        sourceEventId: `signup-${randomUUID()}`,
      }).expect(200);
      const signupBody = as<{ recorded: boolean; attributionId?: string }>(signup);
      expect(signupBody.recorded).toBe(true);

      const provisioned = await prisma.user.findUnique({
        where: { externalSubject: referredExternal },
        select: { id: true },
      });
      expect(provisioned).not.toBeNull();
      createdUserIds.push(provisioned!.id);

      const order = await postSigned('order-events/verified', {
        eventType: 'ORDER_COMPLETED',
        orderId: `order-${randomUUID()}`,
        sourceEventId: `evt-${randomUUID()}`,
        publicCode: codeOwner.publicCode,
        externalUserId: referredExternal,
        netPaidAmountPaise: '10000',
      }).expect(200);
      expect(as<OrderResult>(order).commissionMinorUnits).toBe('2500'); // 25% of ₹100
    });
  });

  describe('first-touch single attribution & self-referral (locked policy)', () => {
    it('refuses a referral event through a different referrer\'s link', async () => {
      const res = await postSigned('referral-link-events/verified/referral', {
        publicCode: codeRival.publicCode,
        referredUserId: referred.id,
        sourceEventId: `ref-${randomUUID()}`,
      }).expect(200);
      const body = as<{ recorded: boolean; reason?: string }>(res);
      expect(body.recorded).toBe(false);
      expect(body.reason).toBe('ALREADY_ATTRIBUTED');

      // …and the first-touch attribution is unchanged.
      const attribution = await prisma.referralAttribution.findFirst({
        where: { referredUserId: referred.id },
        select: { referralCodeId: true, referrerUserId: true },
      });
      expect(attribution?.referralCodeId).toBe(codeOwner.id);
      expect(attribution?.referrerUserId).toBe(owner.id);
    });

    it('keeps first-touch for a main-app event that used a rival link (event still recorded)', async () => {
      const res = await postSigned('main-app-events/verified', {
        eventType: 'SIGNUP',
        publicCode: codeRival.publicCode,
        referredUserId: referred.id,
        sourceEventId: `signup-${randomUUID()}`,
      }).expect(200);
      const body = as<{ recorded: boolean; attributionId?: string; referrerUserId?: string; firstTouchPreserved?: boolean }>(res);
      expect(body.recorded).toBe(true);
      expect(body.firstTouchPreserved).toBe(true);
      expect(body.referrerUserId).toBe(owner.id);
    });

    it('blocks self-referral through the same Firebase identity', async () => {
      const twin = await createUser('twin_owner', `firebase-twin-${randomUUID()}`);
      const twinCode = await createCode(twin.id);
      const twinExternal = (await prisma.user.findUniqueOrThrow({ where: { id: twin.id }, select: { externalSubject: true } })).externalSubject!;

      const res = await postSigned('main-app-events/verified', {
        eventType: 'INSTALL_LOGIN',
        publicCode: twinCode.publicCode,
        externalUserId: twinExternal,
        sourceEventId: `install-${randomUUID()}`,
      }).expect(200);
      expect(as<{ reason?: string }>(res).reason).toBe('SELF_REFERRAL');

      const order = await postSigned('order-events/verified', {
        eventType: 'ORDER_COMPLETED',
        orderId: `order-${randomUUID()}`,
        sourceEventId: `evt-${randomUUID()}`,
        publicCode: twinCode.publicCode,
        externalUserId: twinExternal,
        netPaidAmountPaise: '50000',
      }).expect(200);
      expect(as<OrderResult>(order).reason).toBe('NO_ATTRIBUTION');
    });

    it('returns NO_ATTRIBUTION for an order from an unattributed user', async () => {
      const stranger = await createUser('stranger');
      const res = await completedOrder(codeOwner.publicCode, stranger.id, '10000').expect(200);
      expect(as<OrderResult>(res).reason).toBe('NO_ATTRIBUTION');
    });
  });

  describe('7-day (168 h) default hold & reversals', () => {
    it('does not release a fresh hold (locked 168 h window)', async () => {
      const before = await wallet(owner.id);
      const result = await sweep();
      expect(result.failed).toBe(0);
      const after = await wallet(owner.id);
      expect(after.pendingMinorUnits).toBe(before.pendingMinorUnits);
      expect(after.availableMinorUnits).toBe(before.availableMinorUnits);
    });

    it('refund BEFORE release reverses from PENDING and blocks the release', async () => {
      const orderId = `order-refund-${randomUUID()}`;
      const completed = as<OrderResult>(
        await completedOrder(codeOwner.publicCode, referred.id, '8000', { orderId }).expect(200),
      );
      expect(completed.commissionMinorUnits).toBe('2000'); // 25%
      const before = await wallet(owner.id);

      const refund = as<OrderResult>(await refundOrder(codeOwner.publicCode, referred.id, orderId).expect(200));
      expect(refund.recorded).toBe(true);
      expect(refund.reversed).toBe(true);
      expect(refund.reversalBucket).toBe('PENDING');

      const after = await wallet(owner.id);
      expect(BigInt(after.pendingMinorUnits)).toBe(BigInt(before.pendingMinorUnits) - 2000n);
      expect(after.availableMinorUnits).toBe(before.availableMinorUnits);

      // A second refund for the same order (fresh event id) records, but must not reverse twice:
      // the reversal ledger transaction is keyed on the completed order event, so it dedupes.
      const replay = as<OrderResult>(await refundOrder(codeOwner.publicCode, referred.id, orderId).expect(200));
      expect(replay.recorded).toBe(true);
      expect(replay.reversed).toBe(false);
      expect(await wallet(owner.id)).toEqual(after);

      // …and the same event id replayed verbatim is deduplicated outright.
      const sameEventId = `evt-${randomUUID()}`;
      await postSigned('order-events/verified', {
        eventType: 'ORDER_REFUNDED',
        orderId,
        sourceEventId: sameEventId,
        publicCode: codeOwner.publicCode,
        referredUserId: referred.id,
      }).expect(200);
      const verbatim = as<OrderResult>(
        await postSigned('order-events/verified', {
          eventType: 'ORDER_REFUNDED',
          orderId,
          sourceEventId: sameEventId,
          publicCode: codeOwner.publicCode,
          referredUserId: referred.id,
        }).expect(200),
      );
      expect(verbatim.deduplicated).toBe(true);
      expect(await wallet(owner.id)).toEqual(after);

      // The sweep must not resurrect a reversed commission, even after the window elapses.
      const swept = await sweep();
      expect(swept.failed).toBe(0);
      expect(await wallet(owner.id)).toEqual(after);
    });

    it('never reverses a credit that belongs to a different referred user', async () => {
      const orderId = `order-scoped-${randomUUID()}`;
      await completedOrder(codeOwner.publicCode, referredB.id, '20000', { orderId }).expect(200);
      const before = await wallet(owner.id);
      // referred has no credit for this order id → nothing to reverse for them.
      const res = as<OrderResult>(await refundOrder(codeOwner.publicCode, referred.id, orderId).expect(200));
      expect(res.reason).toBe('NO_PRIOR_CREDIT');
      expect(res.reversed).toBe(false);
      expect(await wallet(owner.id)).toEqual(before);
    });

    it('reports no prior credit when refunding an order that was never credited', async () => {
      const res = await refundOrder(codeOwner.publicCode, referred.id, `order-unknown-${randomUUID()}`).expect(200);
      const body = as<OrderResult>(res);
      expect(body.recorded).toBe(true);
      expect(body.reason).toBe('NO_PRIOR_CREDIT');
      expect(body.reversed).toBe(false);
    });
  });
});
