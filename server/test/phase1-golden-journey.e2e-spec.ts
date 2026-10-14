import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * PHASE-1 GOLDEN JOURNEY (e2e) — the whole Phase-1 story in one run:
 *
 *   Sprint 1  create a referral link, record a public click, read per-link metrics
 *   Sprint 2  signed SIGNUP + INSTALL_LOGIN for a Firebase identity → milestones + chat gate
 *   Sprint 3  commission on ORDER_COMPLETED (25% / TEAM CHX 50%), 168 h hold, release,
 *             compensating refund, withdrawal → admin approve → complete with UTR
 *   Sprint 4  replay defence, admin console slice (overview / holds / inspection / audit),
 *             correlation ids, readiness probe and the append-only audit trail
 *
 * The hold window is configured to 0 hours here so the release → payout leg runs end-to-end;
 * the locked 168-hour default is asserted in `sprint3.e2e-spec.ts` and `sprint3-holds.e2e-spec.ts`.
 * This is the acceptance test a human reviewer can replay with `npm run test:e2e`.
 */
const WEBHOOK_SECRET = 'e2e-webhook-secret';
const ADMIN_KEY = 'e2e-admin-key';

interface Balances {
  pendingMinorUnits: string;
  availableMinorUnits: string;
  reservedMinorUnits: string;
  withdrawnMinorUnits: string;
}

const as = <T>(res: request.Response): T => res.body as T;

describe('Phase 1 — golden journey (Sprint 1 → Sprint 4, e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let owner: { id: string };
  let referred: { id: string };
  let stranger: { id: string };
  let code: { id: string; publicCode: string };
  const referredFirebaseUid = `firebase-golden-${randomUUID()}`;
  const createdUserIds: string[] = [];
  const createdCodeIds: string[] = [];
  const state = {
    payoutMethodId: '',
    payoutRequestId: '',
    orderA: '',
    orderB: '',
    attributionId: '',
  };

  const http = () => request(app.getHttpServer());
  const asUser = (userId: string) => ({ 'x-user-id': userId });
  const adminGet = (path: string) => http().get(path).set('x-admin-key', ADMIN_KEY);
  const adminPost = (path: string) => http().post(path).set('x-admin-key', ADMIN_KEY);

  const signed = (path: string, body: Record<string, unknown>) => {
    const raw = JSON.stringify(body);
    const signature = createHmac('sha256', WEBHOOK_SECRET).update(Buffer.from(raw)).digest('hex');
    return http().post(`/v1/${path}`).set('Content-Type', 'application/json').set('x-andos-signature', signature).send(raw);
  };

  const wallet = async (): Promise<Balances> =>
    as<{ balances: Balances }>(await http().get('/v1/wallet').set(asUser(owner.id)).expect(200)).balances;

  beforeAll(async () => {
    // 0-hour window: the golden journey must be able to pay money out end-to-end.
    process.env.COMMISSION_HOLD_HOURS = '0';
    // The acting admin for payout decisions must exist BEFORE the module compiles, because
    // @nestjs/config validates the environment when ConfigModule.forRoot() is evaluated.
    const bootstrapPrisma = new PrismaClient();
    const opsAdmin = await bootstrapPrisma.user.upsert({
      where: { externalSubject: 'e2e-ops-admin' },
      create: { externalSubject: 'e2e-ops-admin', username: 'e2e_ops_admin' },
      update: {},
      select: { id: true },
    });
    await bootstrapPrisma.$disconnect();
    process.env.ADMIN_ACTOR_USER_ID = opsAdmin.id;
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    owner = await prisma.user.create({ data: { username: `gj_owner_${suffix}` }, select: { id: true } });
    stranger = await prisma.user.create({ data: { username: `gj_other_${suffix}` }, select: { id: true } });
    createdUserIds.push(owner.id, stranger.id);
  });

  afterAll(async () => {
    const users = { in: createdUserIds };
    await prisma.$executeRawUnsafe('ALTER TABLE referral_app.admin_audit_logs DISABLE TRIGGER admin_audit_logs_append_only');
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
    await prisma.$executeRawUnsafe('ALTER TABLE referral_app.admin_audit_logs ENABLE TRIGGER admin_audit_logs_append_only');
    await app.close();
  });

  it('step 0 — the service reports itself ready (database + Phase-1 schema)', async () => {
    const body = as<{ status: string; checks: { schema: { tables: number } } }>(
      await http().get('/v1/health/ready').expect(200),
    );
    expect(body.status).toBe('ready');
    expect(body.checks.schema.tables).toBe(9);
  });

  it('step 1 — Sprint 1: the referrer creates a shareable link and a public click is counted', async () => {
    const created = as<{ id: string; publicCode: string; shareUrl: string }>(
      await http().post('/v1/referral-codes').set(asUser(owner.id)).send({}).expect(201),
    );
    code = created;
    createdCodeIds.push(created.id);
    expect(created.publicCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(created.shareUrl).toContain(created.publicCode);

    await http()
      .post('/v1/referral-link-events')
      .send({ publicCode: code.publicCode, visitorToken: `device-${randomUUID()}`, idempotent: true })
      .expect(200);

    const metrics = as<{ clickCount: number; uniqueClickCount: number }>(
      await http().get(`/v1/referral-codes/${code.id}/metrics`).set(asUser(owner.id)).expect(200),
    );
    expect(metrics.clickCount).toBeGreaterThanOrEqual(1);
    expect(metrics.uniqueClickCount).toBeGreaterThanOrEqual(1);
  });

  it('step 2 — Sprint 2: signed SIGNUP auto-provisions the Firebase user and records the milestone', async () => {
    const signup = as<{ recorded: boolean; referrerUserId: string }>(
      await signed('main-app-events/verified', {
        eventType: 'SIGNUP',
        publicCode: code.publicCode,
        externalUserId: referredFirebaseUid,
        sourceEventId: `gj-signup-${randomUUID()}`,
      }).expect(200),
    );
    expect(signup.recorded).toBe(true);
    expect(signup.referrerUserId).toBe(owner.id);

    const provisioned = await prisma.user.findUnique({
      where: { externalSubject: referredFirebaseUid },
      select: { id: true },
    });
    expect(provisioned).not.toBeNull();
    referred = provisioned!;
    createdUserIds.push(referred.id);
  });

  it('step 3 — Sprint 2: signed INSTALL_LOGIN unlocks referral chat for both participants', async () => {
    const result = as<{ chatAccessState: string; firstTouchPreserved: boolean }>(
      await signed('main-app-events/verified', {
        eventType: 'INSTALL_LOGIN',
        publicCode: code.publicCode,
        externalUserId: referredFirebaseUid,
        sourceEventId: `gj-install-${randomUUID()}`,
      }).expect(200),
    );
    expect(result.chatAccessState).toBe('UNLOCKED');
    expect(result.firstTouchPreserved).toBe(false);

    const list = as<{ data: { id: string; milestones: { currentMilestone: string }; chatAccess: { state: string } }[] }>(
      await http().get('/v1/referrals').set(asUser(owner.id)).expect(200),
    );
    const referral = list.data.find((row) => row.chatAccess.state === 'UNLOCKED');
    expect(referral).toBeDefined();
    expect(referral!.milestones.currentMilestone).toBe('CHAT_UNLOCKED');
    state.attributionId = referral!.id;

    // Participants may read the referral; anyone else gets a 404 (no existence leak).
    await http().get(`/v1/referrals/${referral!.id}`).set(asUser(referred.id)).expect(200);
    await http().get(`/v1/referrals/${referral!.id}`).set(asUser(stranger.id)).expect(404);
  });

  it('step 4 — Sprint 3: ₹200 order with promo "TEAM CHX" holds ₹100 at 50%', async () => {
    state.orderA = `gj-order-a-${randomUUID()}`;
    const result = as<{ commissionMinorUnits: string; rateBps: number; promoCodeNormalized: string; rewardEligibility: string }>(
      await signed('order-events/verified', {
        eventType: 'ORDER_COMPLETED',
        orderId: state.orderA,
        sourceEventId: `gj-evt-a-${randomUUID()}`,
        publicCode: code.publicCode,
        referredUserId: referred.id,
        netPaidAmountPaise: '20000',
        appliedPromoCode: ' Team  Chx ',
      }).expect(200),
    );
    expect(result.rateBps).toBe(5000);
    expect(result.promoCodeNormalized).toBe('TEAMCHX');
    expect(result.commissionMinorUnits).toBe('10000');
    expect(result.rewardEligibility).toBe('HOLD');

    const balances = await wallet();
    expect(balances.pendingMinorUnits).toBe('10000');
  });

  it('step 5 — Sprint 3 + 4: a replay is deduplicated and a stale signature is refused', async () => {
    const eventId = `gj-evt-b-${randomUUID()}`;
    state.orderB = `gj-order-b-${randomUUID()}`;
    const payload = {
      eventType: 'ORDER_COMPLETED',
      orderId: state.orderB,
      sourceEventId: eventId,
      publicCode: code.publicCode,
      referredUserId: referred.id,
      netPaidAmountPaise: '10000',
    };
    const first = as<{ commissionMinorUnits: string; ledgerPosted: boolean }>(await signed('order-events/verified', payload).expect(200));
    expect(first.commissionMinorUnits).toBe('2500'); // 25% default
    expect(first.ledgerPosted).toBe(true);

    const replay = as<{ deduplicated: boolean; ledgerPosted: boolean }>(await signed('order-events/verified', payload).expect(200));
    expect(replay.deduplicated).toBe(true);
    expect(replay.ledgerPosted).toBe(false);

    // Sprint-4 replay defence: a captured body re-signed with an old timestamp is rejected.
    const stale = String(Math.floor(Date.now() / 1000) - 3600);
    const raw = JSON.stringify({ ...payload, orderId: `gj-order-c-${randomUUID()}`, sourceEventId: `gj-evt-c-${randomUUID()}` });
    const boundSignature = createHmac('sha256', WEBHOOK_SECRET)
      .update(Buffer.concat([Buffer.from(`${stale}.`), Buffer.from(raw)]))
      .digest('hex');
    await http()
      .post('/v1/order-events/verified')
      .set('Content-Type', 'application/json')
      .set('x-andos-signature', boundSignature)
      .set('x-andos-timestamp', stale)
      .send(raw)
      .expect(401);
  });

  it('step 6 — Sprint 3: the hold releases into AVAILABLE (idempotently)', async () => {
    const before = await wallet();
    const sweep = as<{ released: number; failed: number }>(await adminPost('/v1/admin/wallet/release-due').send({}).expect(200));
    expect(sweep.failed).toBe(0);
    expect(sweep.released).toBeGreaterThanOrEqual(2);

    const after = await wallet();
    expect(after.pendingMinorUnits).toBe('0');
    expect(BigInt(after.availableMinorUnits)).toBe(BigInt(before.pendingMinorUnits));

    const second = as<{ released: number }>(await adminPost('/v1/admin/wallet/release-due').send({}).expect(200));
    expect(second.released).toBe(0);
  });

  it('step 7 — Sprint 3: refunding after release claws the commission back from AVAILABLE', async () => {
    const before = await wallet();
    const refund = as<{ reversed: boolean; reversalBucket: string }>(
      await signed('order-events/verified', {
        eventType: 'ORDER_REFUNDED',
        orderId: state.orderB,
        sourceEventId: `gj-refund-${randomUUID()}`,
        publicCode: code.publicCode,
        referredUserId: referred.id,
      }).expect(200),
    );
    expect(refund.reversed).toBe(true);
    expect(refund.reversalBucket).toBe('AVAILABLE');

    const after = await wallet();
    expect(BigInt(after.availableMinorUnits)).toBe(BigInt(before.availableMinorUnits) - 2500n);
  });

  it('step 8 — Sprint 3: withdrawal reserves funds, admin approves, UTR completes the payout', async () => {
    const method = as<{ id: string }>(
      await http()
        .post('/v1/payout-methods')
        .set(asUser(owner.id))
        .send({ methodType: 'UPI', providerVaultRef: `vault-${randomUUID()}`, maskedLabel: 'UPI ••••4321' })
        .expect(201),
    );
    state.payoutMethodId = method.id;

    const before = await wallet();
    expect(before.availableMinorUnits).toBe('10000');

    const created = as<{ id: string; status: string; ledgerPosted: boolean }>(
      await http()
        .post('/v1/payout-requests')
        .set(asUser(owner.id))
        .send({ payoutMethodId: method.id, amountMinorUnits: '10000', idempotencyKey: `gj-wd-${randomUUID()}` })
        .expect(201),
    );
    state.payoutRequestId = created.id;
    expect(created.status).toBe('PENDING_APPROVAL');
    expect(created.ledgerPosted).toBe(true);

    const reserved = await wallet();
    expect(reserved.availableMinorUnits).toBe('0');
    expect(reserved.reservedMinorUnits).toBe('10000');

    const approved = as<{ status: string; ledgerPosted: boolean }>(
      await adminPost(`/v1/admin/payout-requests/${created.id}/approve`).send({}).expect(200),
    );
    expect(approved.status).toBe('APPROVED');
    expect(approved.ledgerPosted).toBe(false); // approve never moves money
    expect(await wallet()).toEqual(reserved); // balances untouched

    const completed = as<{ status: string; paymentUtr: string }>(
      await adminPost(`/v1/admin/payout-requests/${created.id}/complete`)
        .send({ paymentUtr: 'UTR-GOLDEN-99887766' })
        .expect(200),
    );
    expect(completed.status).toBe('COMPLETED');
    expect(completed.paymentUtr).toBe('UTR-GOLDEN-99887766');

    const final = await wallet();
    expect(final.reservedMinorUnits).toBe('0');
    expect(final.pendingMinorUnits).toBe('0');
    expect(final.availableMinorUnits).toBe('0');
    expect(final.withdrawnMinorUnits).toBe('10000');
  });

  it('step 9 — Sprint 3/4: the ledger projection equals the recomputed bucket sums', async () => {
    const [walletRow, entries] = await Promise.all([
      prisma.walletAccount.findFirst({ where: { userId: owner.id } }),
      prisma.walletLedgerEntry.groupBy({ by: ['bucket'], _sum: { amountMinorUnits: true }, where: { transaction: { userId: owner.id } } }),
    ]);
    const sums = new Map(entries.map((row) => [row.bucket, row._sum.amountMinorUnits ?? 0n]));
    expect(walletRow?.pendingMinorUnits).toBe(sums.get('PENDING') ?? 0n);
    expect(walletRow?.availableMinorUnits).toBe(sums.get('AVAILABLE') ?? 0n);
    expect(walletRow?.reservedMinorUnits).toBe(sums.get('RESERVED') ?? 0n);
    expect(walletRow?.withdrawnMinorUnits).toBe(sums.get('WITHDRAWN') ?? 0n);
  });

  it('step 10 — Sprint 4: the admin console shows the journey and the audit trail is complete', async () => {
    const overview = as<{
      orders: { completed: number; refunded: number };
      payouts: { completed: number; completedPaise: string };
      wallets: { withdrawnPaise: string };
    }>(await adminGet('/v1/admin/overview').expect(200));
    expect(overview.orders.completed).toBeGreaterThanOrEqual(2);
    expect(overview.orders.refunded).toBeGreaterThanOrEqual(1);
    expect(overview.payouts.completed).toBeGreaterThanOrEqual(1);
    expect(Number(overview.wallets.withdrawnPaise)).toBeGreaterThanOrEqual(10000);

    // The holds queue knows every state this journey produced.
    for (const status of ['RELEASED', 'REVERSED']) {
      const page = as<{ data: { status: string; referrerUserId: string }[] }>(
        await adminGet(`/v1/admin/holds?status=${status}&limit=100`).expect(200),
      );
      expect(page.data.some((row) => row.referrerUserId === owner.id && row.status === status)).toBe(true);
    }

    // Audit rows exist for each privilege action, keyed by the acting key reference.
    for (const action of ['payout.approve', 'payout.complete', 'wallet.release_due']) {
      const rows = as<{ data: { action: string; actorRef: string; requestId: string | null; targetType: string | null }[]; total: number }>(
        await adminGet(`/v1/admin/audit-logs?action=${action}`).expect(200),
      );
      expect(rows.total).toBeGreaterThanOrEqual(1);
      expect(rows.data[0].actorRef).toMatch(/^admin-key:[0-9a-f]{12}$/);
      expect(rows.data[0].targetType).toBe(action === 'wallet.release_due' ? 'wallet_sweep' : 'payout_request');
    }

    // Reconstructing the money story from the ledger alone must match the wallet.
    const ledger = as<{ data: { transactionType: string; entries: { bucket: string; amountMinorUnits: string }[] }[] }>(
      await http().get('/v1/wallet/ledger?limit=50').set(asUser(owner.id)).expect(200),
    );
    const types = ledger.data.map((row) => row.transactionType);
    for (const expected of ['COMMISSION_LOCKED', 'COMMISSION_RELEASE', 'COMMISSION_REVERSAL', 'WITHDRAWAL_RESERVATION', 'WITHDRAWAL_COMPLETION']) {
      expect(types).toContain(expected);
    }

    // Correlation ids are attached to every response for support/debugging.
    const res = await http().get('/v1/health').expect(200);
    expect(res.headers['x-request-id']).toMatch(/[0-9a-z-]{8,}/);
  });
});
