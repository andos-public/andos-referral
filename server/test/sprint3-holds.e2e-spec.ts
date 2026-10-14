import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Sprint 3 e2e — the 168-hour hold RELEASE MECHANICS.
 *
 * The locked default window is 168 h (asserted in `sprint3.e2e-spec.ts`: a fresh order is not
 * released). Here the window is configured to 0 hours so every completed order is immediately
 * eligible — that lets the sweep itself be tested end-to-end: PENDING → AVAILABLE postings,
 * idempotency, skipped/reversed orders and refund-after-release clawbacks.
 */
const WEBHOOK_SECRET = 'e2e-webhook-secret';
const ADMIN_KEY = 'e2e-admin-key';

interface Balances {
  pendingMinorUnits: string;
  availableMinorUnits: string;
  reservedMinorUnits: string;
  withdrawnMinorUnits: string;
}
interface OrderResult {
  recorded: boolean;
  orderEventId?: string;
  commissionMinorUnits?: string;
  reversalBucket?: string;
  reversed?: boolean;
  reason?: string;
}

describe('Sprint 3 — hold release mechanics (0-hour test window, e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let owner: { id: string };
  let referred: { id: string };
  let code: { id: string; publicCode: string };
  const createdUserIds: string[] = [];
  const createdCodeIds: string[] = [];

  const as = <T>(res: request.Response): T => res.body as T;
  const http = () => request(app.getHttpServer());
  const sign = (rawBody: string) => createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

  const wallet = async (): Promise<Balances> =>
    as<{ balances: Balances }>(await http().get('/v1/wallet').set('x-user-id', owner.id).expect(200)).balances;

  const ledger = async () =>
    as<{ data: { transactionType: string; referenceId: string; entries: { bucket: string; amountMinorUnits: string }[] }[] }>(
      await http().get('/v1/wallet/ledger?limit=100').set('x-user-id', owner.id).expect(200),
    );

  const sweep = async () =>
    as<{ scanned: number; released: number; skipped: number; failed: number }>(
      await http().post('/v1/admin/wallet/release-due').set('x-admin-key', ADMIN_KEY).send({}).expect(200),
    );

  const post = (path: string, body: Record<string, unknown>) => {
    const rawBody = JSON.stringify(body);
    return http()
      .post(`/v1/${path}`)
      .set('Content-Type', 'application/json')
      .set('x-andos-signature', sign(rawBody))
      .send(rawBody);
  };

  const completedOrder = (netPaise: string, orderId = `order-${randomUUID()}`) =>
    post('order-events/verified', {
      eventType: 'ORDER_COMPLETED',
      orderId,
      sourceEventId: `evt-${randomUUID()}`,
      publicCode: code.publicCode,
      referredUserId: referred.id,
      netPaidAmountPaise: netPaise,
    });

  const refundOrder = (orderId: string, eventType = 'ORDER_REFUNDED') =>
    post('order-events/verified', {
      eventType,
      orderId,
      sourceEventId: `evt-${randomUUID()}`,
      publicCode: code.publicCode,
      referredUserId: referred.id,
    });

  beforeAll(async () => {
    // The window must be set BEFORE AppModule is imported: @nestjs/config validates the env
    // when `ConfigModule.forRoot()` is evaluated, so a value set after import is ignored.
    process.env.COMMISSION_HOLD_HOURS = '0'; // test window: everything is immediately eligible
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    owner = await prisma.user.create({ data: { username: `s3h_owner_${suffix}` }, select: { id: true } });
    referred = await prisma.user.create({ data: { username: `s3h_ref_${suffix}` }, select: { id: true } });
    createdUserIds.push(owner.id, referred.id);

    const created = as<{ id: string; publicCode: string }>(
      await http().post('/v1/referral-codes').set('x-user-id', owner.id).send({}).expect(201),
    );
    code = created;
    createdCodeIds.push(code.id);

    await post('main-app-events/verified', {
      eventType: 'INSTALL_LOGIN',
      publicCode: code.publicCode,
      referredUserId: referred.id,
      sourceEventId: `install-${randomUUID()}`,
    }).expect(200);
  });

  afterAll(async () => {
    const users = { in: createdUserIds };
    await prisma.walletLedgerEntry.deleteMany({ where: { transaction: { userId: users } } });
    await prisma.walletLedgerTransaction.deleteMany({ where: { userId: users } });
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

  it('releases an eligible order: PENDING → AVAILABLE with a COMMISSION_RELEASE transaction', async () => {
    const order = as<OrderResult>(await completedOrder('20000').expect(200));
    expect(order.commissionMinorUnits).toBe('5000');

    const before = await wallet();
    expect(before.pendingMinorUnits).toBe('5000');

    const result = await sweep();
    expect(result.failed).toBe(0);
    expect(result.released).toBeGreaterThanOrEqual(1);

    const after = await wallet();
    expect(after.pendingMinorUnits).toBe('0');
    expect(after.availableMinorUnits).toBe('5000');

    const release = (await ledger()).data.find(
      (txn) => txn.transactionType === 'COMMISSION_RELEASE' && txn.referenceId === order.orderEventId,
    );
    expect(release?.entries).toEqual([
      { bucket: 'PENDING', amountMinorUnits: '-5000' },
      { bucket: 'AVAILABLE', amountMinorUnits: '5000' },
    ]);
  });

  it('is idempotent — a second sweep releases nothing', async () => {
    const before = await wallet();
    const result = await sweep();
    expect(result.failed).toBe(0);
    expect(result.released).toBe(0);
    expect(await wallet()).toEqual(before);
  });

  it('never releases a reversed (refunded) order', async () => {
    const orderId = `order-rev-${randomUUID()}`;
    const order = as<OrderResult>(await completedOrder('8000', orderId).expect(200));
    expect(order.commissionMinorUnits).toBe('2000');

    // Refund BEFORE the sweep: the commission is still held, so the reversal comes from PENDING.
    const refund = as<OrderResult>(await refundOrder(orderId).expect(200));
    expect(refund.reversed).toBe(true);
    expect(refund.reversalBucket).toBe('PENDING');

    const before = await wallet();
    const result = await sweep();
    expect(result.failed).toBe(0);
    expect(await wallet()).toEqual(before); // nothing resurrected
    expect(before.availableMinorUnits).toBe('5000'); // unchanged by this test
  });

  it('refund AFTER release claws back from AVAILABLE', async () => {
    const orderId = `order-late-${randomUUID()}`;
    await completedOrder('4000', orderId).expect(200); // 25% → 1000
    await sweep();

    const before = await wallet();
    const refund = as<OrderResult>(await refundOrder(orderId, 'ORDER_CANCELLED').expect(200));
    expect(refund.reversed).toBe(true);
    expect(refund.reversalBucket).toBe('AVAILABLE');

    const after = await wallet();
    expect(BigInt(after.availableMinorUnits)).toBe(BigInt(before.availableMinorUnits) - 1000n);
    expect(after.pendingMinorUnits).toBe(before.pendingMinorUnits);

    // A further sweep must not release anything for this order again.
    await sweep();
    expect(await wallet()).toEqual(after);
  });

  it('with multiple eligible orders, releases exactly the non-reversed ones', async () => {
    const kept = `order-keep-${randomUUID()}`;
    const clawed = `order-claw-${randomUUID()}`;
    await completedOrder('10000', kept).expect(200); // 2500
    await completedOrder('10000', clawed).expect(200); // 2500
    await refundOrder(clawed).expect(200); // reversed from PENDING before the sweep

    const before = await wallet();
    await sweep();
    const after = await wallet();
    expect(BigInt(after.availableMinorUnits)).toBe(BigInt(before.availableMinorUnits) + 2500n);
    expect(after.pendingMinorUnits).toBe('0');
  });
});
