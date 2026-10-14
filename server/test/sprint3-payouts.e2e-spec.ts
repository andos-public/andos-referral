import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Sprint 3 e2e — withdrawals: atomic reservation, PENDING_APPROVAL lifecycle, admin
 * approve/reject/complete with a validated UTR, and compensating ledger entries on release.
 */
const ADMIN_KEY = 'e2e-admin-key';
const WEBHOOK_SECRET = 'e2e-webhook-secret';

interface Balances {
  pendingMinorUnits: string;
  availableMinorUnits: string;
  reservedMinorUnits: string;
  withdrawnMinorUnits: string;
}
interface PayoutRequest {
  id: string;
  status: string;
  amountMinorUnits: string;
  payoutMethod: { id: string; methodType: string; maskedLabel: string };
  idempotencyKey: string;
  reviewedAt: string | null;
  completedAt: string | null;
  rejectionReason: string | null;
  paymentUtr: string | null;
  ledgerPosted?: boolean;
}
interface LedgerList {
  data: { id: string; transactionType: string; entries: { bucket: string; amountMinorUnits: string }[] }[];
  total: number;
}

describe('Sprint 3 — withdrawals & payouts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let owner: { id: string };
  let referred: { id: string };
  let stranger: { id: string };
  let code: { id: string; publicCode: string };
  let payoutMethodId: string;

  const createdUserIds: string[] = [];
  const createdCodeIds: string[] = [];
  const as = <T>(res: request.Response): T => res.body as T;
  const http = () => request(app.getHttpServer());
  const sign = (rawBody: string) => createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

  const wallet = async (userId: string): Promise<Balances> =>
    as<{ balances: Balances }>(await http().get('/v1/wallet').set('x-user-id', userId).expect(200)).balances;

  const ledger = async (userId: string): Promise<LedgerList> =>
    as<LedgerList>(await http().get('/v1/wallet/ledger?limit=100').set('x-user-id', userId).expect(200));

  const sweep = () =>
    http().post('/v1/admin/wallet/release-due').set('x-admin-key', ADMIN_KEY).send({}).expect(200);

  /** Funds the owner with a backdated, already-released commission of `paise`. */
  const fundWallet = async (paise: string): Promise<void> => {
    const rawBody = JSON.stringify({
      eventType: 'ORDER_COMPLETED',
      orderId: `order-fund-${randomUUID()}`,
      sourceEventId: `evt-${randomUUID()}`,
      publicCode: code.publicCode,
      referredUserId: referred.id,
      netPaidAmountPaise: paise,
    });
    await http()
      .post('/v1/order-events/verified')
      .set('Content-Type', 'application/json')
      .set('x-andos-signature', sign(rawBody))
      .send(rawBody)
      .expect(200);
    await sweep();
  };

  beforeAll(async () => {
    const bootstrapPrisma = new PrismaClient();
    const admin = await bootstrapPrisma.user.upsert({
      where: { externalSubject: 'e2e-ops-admin' },
      create: { externalSubject: 'e2e-ops-admin', username: 'e2e_ops_admin' },
      update: {},
      select: { id: true },
    });
    await bootstrapPrisma.$disconnect();
    process.env.ADMIN_ACTOR_USER_ID = admin.id;
    // Set BEFORE importing AppModule (ConfigModule.forRoot validates at import time);
    // the funding helper releases commission immediately, so no 7-day wait here.
    process.env.COMMISSION_HOLD_HOURS = '0';
    createdUserIds.push(admin.id);

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    owner = await prisma.user.create({ data: { username: `s3p_owner_${suffix}` }, select: { id: true } });
    referred = await prisma.user.create({ data: { username: `s3p_ref_${suffix}` }, select: { id: true } });
    stranger = await prisma.user.create({ data: { username: `s3p_other_${suffix}` }, select: { id: true } });
    createdUserIds.push(owner.id, referred.id, stranger.id);

    const codeRes = as<{ id: string; publicCode: string }>(
      await http().post('/v1/referral-codes').set('x-user-id', owner.id).send({}).expect(201),
    );
    code = codeRes;
    createdCodeIds.push(code.id);

    await http()
      .post('/v1/main-app-events/verified')
      .set('Content-Type', 'application/json')
      .set(
        'x-andos-signature',
        sign(
          JSON.stringify({
            eventType: 'INSTALL_LOGIN',
            publicCode: code.publicCode,
            referredUserId: referred.id,
            sourceEventId: `install-${randomUUID()}`,
          }),
        ),
      )
      .send(
        JSON.stringify({
          eventType: 'INSTALL_LOGIN',
          publicCode: code.publicCode,
          referredUserId: referred.id,
          sourceEventId: `install-${randomUUID()}`,
        }),
      )
      .expect(401); // sanity: signature must match the exact body sent

    const installBody = JSON.stringify({
      eventType: 'INSTALL_LOGIN',
      publicCode: code.publicCode,
      referredUserId: referred.id,
      sourceEventId: `install-ok-${randomUUID()}`,
    });
    await http()
      .post('/v1/main-app-events/verified')
      .set('Content-Type', 'application/json')
      .set('x-andos-signature', sign(installBody))
      .send(installBody)
      .expect(200);

    const method = as<{ id: string }>(
      await http()
        .post('/v1/payout-methods')
        .set('x-user-id', owner.id)
        .send({ methodType: 'UPI', providerVaultRef: `vault-${randomUUID()}`, maskedLabel: 'UPI ••••4321' })
        .expect(201),
    );
    payoutMethodId = method.id;

    await fundWallet('400000'); // 25% of ₹4000 = ₹1000 = 100000 paise available
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

  it('never exposes the vault reference in payout-method responses', async () => {
    const list = as<{ data: Record<string, unknown>[] }>(
      await http().get('/v1/payout-methods').set('x-user-id', owner.id).expect(200),
    );
    expect(list.data).toHaveLength(1);
    expect(Object.keys(list.data[0])).not.toContain('providerVaultRef');
    expect(list.data[0].maskedLabel).toBe('UPI ••••4321');
  });

  describe('reservation rules', () => {
    it('rejects a request above the AVAILABLE balance with 409', async () => {
      const available = BigInt((await wallet(owner.id)).availableMinorUnits);
      await http()
        .post('/v1/payout-requests')
        .set('x-user-id', owner.id)
        .send({ payoutMethodId, amountMinorUnits: (available + 1n).toString(), idempotencyKey: `wd-${randomUUID()}` })
        .expect(409);
      expect((await wallet(owner.id)).availableMinorUnits).toBe(available.toString());
    });

    it('rejects zero / negative / non-numeric amounts with 400', async () => {
      for (const amount of ['0', '-5', 'abc', '1.5']) {
        await http()
          .post('/v1/payout-requests')
          .set('x-user-id', owner.id)
          .send({ payoutMethodId, amountMinorUnits: amount, idempotencyKey: `wd-${randomUUID()}` })
          .expect(400);
      }
    });

    it('rejects an inactive payout method', async () => {
      await http()
        .post(`/v1/payout-methods/${payoutMethodId}/deactivate`)
        .set('x-user-id', owner.id)
        .expect(200);
      await http()
        .post('/v1/payout-requests')
        .set('x-user-id', owner.id)
        .send({ payoutMethodId, amountMinorUnits: '100', idempotencyKey: `wd-${randomUUID()}` })
        .expect(409);
      await http()
        .post(`/v1/payout-methods/${payoutMethodId}`)
        .set('x-user-id', owner.id)
        .send({ isActive: true })
        .expect(200);
    });

    it('hides foreign payout requests (404) from read and cancel', async () => {
      const idem = `wd-${randomUUID()}`;
      const created = as<PayoutRequest>(
        await http()
          .post('/v1/payout-requests')
          .set('x-user-id', owner.id)
          .send({ payoutMethodId, amountMinorUnits: '500', idempotencyKey: idem })
          .expect(201),
      );
      await http().get(`/v1/payout-requests/${created.id}`).set('x-user-id', stranger.id).expect(404);
      await http().post(`/v1/payout-requests/${created.id}/cancel`).set('x-user-id', stranger.id).expect(404);
      // cleanup: cancel it back so later balances stay predictable
      await http().post(`/v1/payout-requests/${created.id}/cancel`).set('x-user-id', owner.id).expect(200);
    });
  });

  describe('happy path: request → approve → complete with UTR', () => {
    let requestId: string;
    let amount: string;

    it('reserves funds atomically and starts PENDING_APPROVAL', async () => {
      const before = await wallet(owner.id);
      amount = before.availableMinorUnits;
      const idem = `wd-${randomUUID()}`;

      const created = as<PayoutRequest>(
        await http()
          .post('/v1/payout-requests')
          .set('x-user-id', owner.id)
          .send({ payoutMethodId, amountMinorUnits: amount, idempotencyKey: idem })
          .expect(201),
      );
      requestId = created.id;
      expect(created.status).toBe('PENDING_APPROVAL');
      expect(created.amountMinorUnits).toBe(amount);
      expect(created.ledgerPosted).toBe(true);

      const after = await wallet(owner.id);
      expect(after.availableMinorUnits).toBe('0');
      expect(after.reservedMinorUnits).toBe(amount);
      expect(BigInt(after.pendingMinorUnits) + BigInt(after.availableMinorUnits) + BigInt(after.reservedMinorUnits) + BigInt(after.withdrawnMinorUnits)).toBe(
        BigInt(before.pendingMinorUnits) + BigInt(before.availableMinorUnits) + BigInt(before.reservedMinorUnits) + BigInt(before.withdrawnMinorUnits),
      );

      const list = await ledger(owner.id);
      const reservation = list.data.find((t) => t.transactionType === 'WITHDRAWAL_RESERVATION');
      expect(reservation?.entries).toEqual([
        { bucket: 'AVAILABLE', amountMinorUnits: `-${amount}` },
        { bucket: 'RESERVED', amountMinorUnits: amount },
      ]);
    });

    it('is idempotent on the same idempotency key', async () => {
      const first = as<PayoutRequest>(
        await http().get(`/v1/payout-requests/${requestId}`).set('x-user-id', owner.id).expect(200),
      );
      const idem = first.idempotencyKey;
      const retry = as<PayoutRequest>(
        await http()
          .post('/v1/payout-requests')
          .set('x-user-id', owner.id)
          .send({ payoutMethodId, amountMinorUnits: amount, idempotencyKey: idem })
          .expect(201),
      );
      expect(retry.id).toBe(requestId);
      expect(retry.status).toBe('PENDING_APPROVAL');
      expect((await wallet(owner.id)).reservedMinorUnits).toBe(amount);
    });

    it('lists the request for the owner and for admins (key required)', async () => {
      const own = as<{ data: PayoutRequest[]; total: number }>(
        await http().get('/v1/payout-requests').set('x-user-id', owner.id).expect(200),
      );
      expect(own.data.some((row) => row.id === requestId)).toBe(true);

      await http().get('/v1/admin/payout-requests').expect(401);
      const admin = as<{ data: PayoutRequest[]; total: number }>(
        await http().get('/v1/admin/payout-requests?status=PENDING_APPROVAL').set('x-admin-key', ADMIN_KEY).expect(200),
      );
      expect(admin.data.some((row) => row.id === requestId)).toBe(true);
    });

    it('admin approve moves to APPROVED without touching money', async () => {
      const before = await wallet(owner.id);
      const approved = as<PayoutRequest>(
        await http().post(`/v1/admin/payout-requests/${requestId}/approve`).set('x-admin-key', ADMIN_KEY).expect(200),
      );
      expect(approved.status).toBe('APPROVED');
      expect(approved.reviewedAt).not.toBeNull();
      expect(approved.ledgerPosted).toBe(false);
      expect(await wallet(owner.id)).toEqual(before);
    });

    it('refuses to complete without a valid UTR', async () => {
      await http()
        .post(`/v1/admin/payout-requests/${requestId}/complete`)
        .set('x-admin-key', ADMIN_KEY)
        .send({})
        .expect(400);
      await http()
        .post(`/v1/admin/payout-requests/${requestId}/complete`)
        .set('x-admin-key', ADMIN_KEY)
        .send({ paymentUtr: 'ab' })
        .expect(400);
      expect((await wallet(owner.id)).reservedMinorUnits).toBe(amount);
    });

    it('completes with a UTR: RESERVED → WITHDRAWN', async () => {
      const utr = `UTR-${Date.now()}`;
      const completed = as<PayoutRequest>(
        await http()
          .post(`/v1/admin/payout-requests/${requestId}/complete`)
          .set('x-admin-key', ADMIN_KEY)
          .send({ paymentUtr: utr })
          .expect(200),
      );
      expect(completed.status).toBe('COMPLETED');
      expect(completed.paymentUtr).toBe(utr);
      expect(completed.completedAt).not.toBeNull();

      const after = await wallet(owner.id);
      expect(after.reservedMinorUnits).toBe('0');
      expect(after.withdrawnMinorUnits).toBe(amount);
      expect(after.availableMinorUnits).toBe('0');

      const list = await ledger(owner.id);
      const completion = list.data.find((t) => t.transactionType === 'WITHDRAWAL_COMPLETION');
      expect(completion?.entries).toEqual([
        { bucket: 'RESERVED', amountMinorUnits: `-${amount}` },
        { bucket: 'WITHDRAWN', amountMinorUnits: amount },
      ]);
    });

    it('is idempotent when completing again with the same UTR', async () => {
      const row = as<PayoutRequest>(
        await http().get(`/v1/payout-requests/${requestId}`).set('x-user-id', owner.id).expect(200),
      );
      const again = as<PayoutRequest>(
        await http()
          .post(`/v1/admin/payout-requests/${requestId}/complete`)
          .set('x-admin-key', ADMIN_KEY)
          .send({ paymentUtr: row.paymentUtr! })
          .expect(200),
      );
      expect(again.status).toBe('COMPLETED');
      expect(again.ledgerPosted).toBe(false);
      expect((await wallet(owner.id)).withdrawnMinorUnits).toBe(amount);
    });
  });

  describe('rejection and cancellation release the reservation', () => {
    it('admin reject → REJECTED, funds back in AVAILABLE', async () => {
      await fundWallet('100000'); // +25000 paise
      const available = (await wallet(owner.id)).availableMinorUnits;

      const created = as<PayoutRequest>(
        await http()
          .post('/v1/payout-requests')
          .set('x-user-id', owner.id)
          .send({ payoutMethodId, amountMinorUnits: available, idempotencyKey: `wd-${randomUUID()}` })
          .expect(201),
      );
      expect((await wallet(owner.id)).reservedMinorUnits).toBe(available);

      const rejected = as<PayoutRequest>(
        await http()
          .post(`/v1/admin/payout-requests/${created.id}/reject`)
          .set('x-admin-key', ADMIN_KEY)
          .send({ reason: 'UTR could not be verified' })
          .expect(200),
      );
      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toBe('UTR could not be verified');

      const after = await wallet(owner.id);
      expect(after.reservedMinorUnits).toBe('0');
      expect(after.availableMinorUnits).toBe(available);

      const list = await ledger(owner.id);
      const release = list.data.find((t) => t.transactionType === 'WITHDRAWAL_RELEASE');
      expect(release?.entries).toEqual([
        { bucket: 'RESERVED', amountMinorUnits: `-${available}` },
        { bucket: 'AVAILABLE', amountMinorUnits: available },
      ]);

      // Replay is idempotent.
      const replay = as<PayoutRequest>(
        await http()
          .post(`/v1/admin/payout-requests/${created.id}/reject`)
          .set('x-admin-key', ADMIN_KEY)
          .send({ reason: 'UTR could not be verified' })
          .expect(200),
      );
      expect(replay.status).toBe('REJECTED');
      expect(replay.ledgerPosted).toBe(false);
      expect(await wallet(owner.id)).toEqual(after);
    });

    it('owner cancel → CANCELLED, funds back in AVAILABLE', async () => {
      const available = (await wallet(owner.id)).availableMinorUnits;
      const created = as<PayoutRequest>(
        await http()
          .post('/v1/payout-requests')
          .set('x-user-id', owner.id)
          .send({ payoutMethodId, amountMinorUnits: '1000', idempotencyKey: `wd-${randomUUID()}` })
          .expect(201),
      );
      expect((await wallet(owner.id)).reservedMinorUnits).toBe('1000');

      const cancelled = as<PayoutRequest>(
        await http().post(`/v1/payout-requests/${created.id}/cancel`).set('x-user-id', owner.id).expect(200),
      );
      expect(cancelled.status).toBe('CANCELLED');
      const after = await wallet(owner.id);
      expect(after.reservedMinorUnits).toBe('0');
      expect(after.availableMinorUnits).toBe(available);

      const again = as<PayoutRequest>(
        await http().post(`/v1/payout-requests/${created.id}/cancel`).set('x-user-id', owner.id).expect(200),
      );
      expect(again.status).toBe('CANCELLED');
      expect(again.ledgerPosted).toBe(false);
    });

    it('a completed request can no longer be cancelled', async () => {
      await fundWallet('20000'); // +5000 paise
      const created = as<PayoutRequest>(
        await http()
          .post('/v1/payout-requests')
          .set('x-user-id', owner.id)
          .send({ payoutMethodId, amountMinorUnits: '5000', idempotencyKey: `wd-${randomUUID()}` })
          .expect(201),
      );
      await http().post(`/v1/admin/payout-requests/${created.id}/approve`).set('x-admin-key', ADMIN_KEY).expect(200);
      await http()
        .post(`/v1/admin/payout-requests/${created.id}/complete`)
        .set('x-admin-key', ADMIN_KEY)
        .send({ paymentUtr: `UTR-${Date.now()}` })
        .expect(200);
      await http().post(`/v1/payout-requests/${created.id}/cancel`).set('x-user-id', owner.id).expect(409);
    });
  });
});
