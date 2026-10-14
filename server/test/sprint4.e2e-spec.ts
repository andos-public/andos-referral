import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';
import { mapDatabaseError } from '../src/common/prisma-exception.filter';

/**
 * Sprint 4 e2e — Phase-1 backend wrap-up.
 *  · replay defence: timestamp binding + tolerance window on signed webhooks
 *  · admin console slice: overview, holds queue, inspection, immutable audit trail, metrics
 *  · observability: request correlation id, DB readiness probe, operational counters
 */
const WEBHOOK_SECRET = 'e2e-webhook-secret';
const ADMIN_KEY = 'e2e-admin-key';
const TOLERANCE_SECONDS = 300;

interface Balances {
  pendingMinorUnits: string;
  availableMinorUnits: string;
  reservedMinorUnits: string;
  withdrawnMinorUnits: string;
}
interface OrderResult {
  recorded: boolean;
  deduplicated?: boolean;
  reason?: string;
  commissionMinorUnits?: string;
  holdReleaseEligibleAt?: string;
  ledgerPosted?: boolean;
}

const as = <T>(res: request.Response): T => res.body as T;

describe('Sprint 4 — hardening, admin console slice & readiness (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let owner: { id: string };
  let referred: { id: string };
  let code: { id: string; publicCode: string };
  const createdUserIds: string[] = [];
  const createdCodeIds: string[] = [];

  const http = () => request(app.getHttpServer());
  const adminGet = (path: string) => http().get(path).set('x-admin-key', ADMIN_KEY);
  const adminPost = (path: string) => http().post(path).set('x-admin-key', ADMIN_KEY);

  const signedBody = (body: string, timestamp?: string) => {
    const payload = timestamp ? Buffer.concat([Buffer.from(`${timestamp}.`), Buffer.from(body)]) : Buffer.from(body);
    return createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  };

  /** Posts a signed verified event; `signMode` selects body-only vs timestamp-bound signing. */
  const postSigned = (
    path: string,
    body: Record<string, unknown>,
    options: { timestamp?: string | null; signMode?: 'body' | 'bound'; overrideSignature?: string } = {},
  ) => {
    const raw = JSON.stringify(body);
    const timestamp = options.timestamp === undefined ? undefined : options.timestamp;
    const mode = options.signMode ?? (timestamp ? 'bound' : 'body');
    const signature =
      options.overrideSignature ??
      (mode === 'bound' && timestamp ? signedBody(raw, timestamp) : signedBody(raw));
    const req = http()
      .post(`/v1/${path}`)
      .set('Content-Type', 'application/json')
      .set('x-andos-signature', signature);
    if (timestamp !== null && timestamp !== undefined) {
      req.set('x-andos-timestamp', timestamp);
    }
    return req.send(raw);
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [await import('../src/app.module').then((m) => m.AppModule)] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    owner = await prisma.user.create({ data: { username: `s4_owner_${suffix}` }, select: { id: true } });
    referred = await prisma.user.create({ data: { username: `s4_ref_${suffix}` }, select: { id: true } });
    createdUserIds.push(owner.id, referred.id);

    code = as<{ id: string; publicCode: string }>(
      await http().post('/v1/referral-codes').set('x-user-id', owner.id).send({}).expect(201),
    );
    createdCodeIds.push(code.id);

    await postSigned('main-app-events/verified', {
      eventType: 'INSTALL_LOGIN',
      publicCode: code.publicCode,
      referredUserId: referred.id,
      sourceEventId: `s4-install-${randomUUID()}`,
    }).expect(200);
  });

  afterAll(async () => {
    const users = { in: createdUserIds };
    // Audit rows are append-only by design, so the harness lifts the trigger for its own
    // test-namespaced rows and puts it straight back — a real deployment keeps it on and
    // archives via a retention path instead (see PHASE_1_UAT_CHECKLIST.md).
    await prisma.$executeRawUnsafe('ALTER TABLE referral_app.admin_audit_logs DISABLE TRIGGER admin_audit_logs_append_only');
    await prisma.adminAuditLog.deleteMany({ where: { action: { startsWith: 'test.' } } });
    await prisma.$executeRawUnsafe('ALTER TABLE referral_app.admin_audit_logs ENABLE TRIGGER admin_audit_logs_append_only');
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

  // ─────────────────────────── replay defence ───────────────────────────

  describe('webhook replay defence (x-andos-timestamp + signature binding)', () => {
    const orderBody = () => ({
      eventType: 'ORDER_COMPLETED' as const,
      orderId: `s4-order-${randomUUID()}`,
      sourceEventId: `s4-evt-${randomUUID()}`,
      publicCode: code.publicCode,
      referredUserId: referred.id,
      netPaidAmountPaise: '10000',
    });

    it('accepts a timestamp-bound signature inside the window (and binds the timestamp)', async () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const res = await postSigned('order-events/verified', orderBody(), { timestamp }).expect(200);
      const body = as<OrderResult>(res);
      expect(body.recorded).toBe(true);
      expect(body.commissionMinorUnits).toBe('2500');
    });

    it('rejects a stale timestamp with 401 (replay defence)', async () => {
      const stale = String(Math.floor(Date.now() / 1000) - (TOLERANCE_SECONDS + 60));
      await postSigned('order-events/verified', orderBody(), { timestamp: stale }).expect(401);
    });

    it('rejects a fresh timestamp carrying a body-only signature', async () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      await postSigned('order-events/verified', orderBody(), {
        timestamp,
        overrideSignature: signedBody(JSON.stringify(orderBody())),
      }).expect(401);
    });

    it('rejects a timestamp-bound signature replayed under a different timestamp', async () => {
      const signedAt = String(Math.floor(Date.now() / 1000) - 30);
      const replayAt = String(Math.floor(Date.now() / 1000));
      const body = orderBody();
      await postSigned('order-events/verified', body, {
        timestamp: replayAt,
        overrideSignature: signedBody(JSON.stringify(body), signedAt),
      }).expect(401);
    });

    it('still accepts the legacy body-only signature while the header is optional', async () => {
      const res = await postSigned('order-events/verified', orderBody(), { timestamp: null }).expect(200);
      expect(as<OrderResult>(res).recorded).toBe(true);
    });
  });

  // ─────────────────────────── observability ───────────────────────────

  describe('observability & health readiness', () => {
    it('echoes a correlation id on every response', async () => {
      const res = await http().get('/v1/health').expect(200);
      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('preserves a client-supplied correlation id', async () => {
      const res = await http().get('/v1/health').set('x-request-id', 'uat-trace-1234').expect(200);
      expect(res.headers['x-request-id']).toBe('uat-trace-1234');
    });

    it('replaces an over-long correlation id with a generated one', async () => {
      const tooLong = 'a'.repeat(200);
      const res = await http().get('/v1/health').set('x-request-id', tooLong).expect(200);
      expect(res.headers['x-request-id']).not.toBe(tooLong);
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('serves a liveness probe without touching the database', async () => {
      const body = as<{ status: string; version: string }>(await http().get('/v1/health/live').expect(200));
      expect(body.status).toBe('ok');
      expect(typeof body.version).toBe('string');
    });

    it('serves a readiness probe that verifies the database and the Phase-1 schema', async () => {
      const body = as<{
        status: string;
        checks: { database: { status: string; latencyMs: number }; schema: { status: string; tables: number } };
      }>(await http().get('/v1/health/ready').expect(200));
      expect(body.status).toBe('ready');
      expect(body.checks.database.status).toBe('up');
      expect(body.checks.schema.status).toBe('up');
      expect(body.checks.schema.tables).toBe(9);
    });

    it('keeps the legacy /v1/health shape working', async () => {
      const body = as<{ status: string; db: boolean }>(await http().get('/v1/health').expect(200));
      expect(body.status).toBe('ok');
      expect(body.db).toBe(true);
    });

    it('exposes operational counters to admins only', async () => {
      await http().get('/v1/admin/metrics').expect(401);
      const snapshot = as<{ counters: Record<string, number>; uptimeSeconds: number }>(
        await adminGet('/v1/admin/metrics').expect(200),
      );
      expect(snapshot.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(snapshot.counters['http.requests.total']).toBeGreaterThan(0);
      expect(Object.keys(snapshot.counters).some((key) => key.startsWith('order.events{'))).toBe(true);
      expect(Object.keys(snapshot.counters).some((key) => key.startsWith('main_app.events{'))).toBe(true);
      expect(snapshot.counters['commission.locked.count']).toBeGreaterThan(0);
      expect(snapshot.counters['commission.locked.paise']).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────── admin console slice ───────────────────────────

  describe('admin console slice', () => {
    it('serves the overview dashboard with live counters', async () => {
      const body = as<{
        users: { total: number };
        referralCodes: { total: number; active: number };
        attributions: { total: number; installLoginVerified: number };
        orders: { completed: number; commissionableBasePaise: string };
        wallets: { accounts: number; pendingPaise: string };
        holds: { held: number; dueNow: number; nextEligibleAt: string | null };
        ledger: { transactions: number };
        audit: { entries: number };
      }>(await adminGet('/v1/admin/overview').expect(200));

      expect(body.users.total).toBeGreaterThanOrEqual(2);
      expect(body.referralCodes.total).toBeGreaterThanOrEqual(1);
      expect(body.attributions.installLoginVerified).toBeGreaterThanOrEqual(1);
      expect(body.orders.completed).toBeGreaterThanOrEqual(1);
      expect(Number(body.orders.commissionableBasePaise)).toBeGreaterThan(0);
      expect(body.wallets.accounts).toBeGreaterThanOrEqual(1);
      expect(body.holds.held).toBeGreaterThanOrEqual(1); // nothing released yet at 168 h
      expect(body.holds.dueNow).toBe(0);
      expect(body.holds.nextEligibleAt).not.toBeNull();
      expect(body.ledger.transactions).toBeGreaterThanOrEqual(1);
    });

    it('requires the admin key on every console route', async () => {
      for (const path of ['overview', 'holds', 'users', 'audit-logs', 'metrics']) {
        await http().get(`/v1/admin/${path}`).expect(401);
      }
    });

    it('lists the commission-hold queue with eligibility and status', async () => {
      const body = as<{
        data: {
          orderId: string;
          commissionPaise: string;
          rateBps: number;
          eligibleAt: string;
          status: string;
          dueInSeconds: number;
          referrerUserId: string;
        }[];
        total: number;
        asOf: string;
      }>(await adminGet('/v1/admin/holds').expect(200));

      expect(body.total).toBeGreaterThanOrEqual(1);
      const hold = body.data.find((row) => row.referrerUserId === owner.id);
      expect(hold).toBeDefined();
      expect(hold!.status).toBe('HELD');
      expect(hold!.rateBps).toBe(2500);
      expect(hold!.dueInSeconds).toBeGreaterThan(167 * 3600);
      expect(Date.parse(hold!.eligibleAt)).toBeGreaterThan(Date.now());

      const filtered = as<{ data: unknown[] }>(await adminGet('/v1/admin/holds?status=RELEASED').expect(200));
      expect(filtered.data.every((row) => (row as { status: string }).status === 'RELEASED')).toBe(true);
    });

    it('finds the referrer through user search and shows the wallet summary', async () => {
      const body = as<{ data: { id: string; wallet: { pendingPaise: string }; referralSummary: { referralCodes: number } }[] }>(
        await adminGet(`/v1/admin/users?query=${encodeURIComponent('s4_owner')}`).expect(200),
      );
      const found = body.data.find((row) => row.id === owner.id);
      expect(found).toBeDefined();
      expect(found!.referralSummary.referralCodes).toBeGreaterThanOrEqual(1);
      expect(Number(found!.wallet.pendingPaise)).toBeGreaterThan(0);
    });

    it('rejects an unknown user id with 404', async () => {
      await adminGet(`/v1/admin/users/${randomUUID()}`).expect(404);
      await adminGet(`/v1/admin/wallets/${randomUUID()}`).expect(404);
      await adminGet(`/v1/admin/referrals/${randomUUID()}`).expect(404);
    });

    it('serves the user bundle, wallet ledger page and referral detail', async () => {
      const bundle = as<{
        referralCodes: { publicCode: string }[];
        attributionsAsReferrer: { id: string; chatAccessState: string }[];
        wallet: { balances: Balances }[];
        payoutMethods: unknown[];
      }>(await adminGet(`/v1/admin/users/${owner.id}`).expect(200));
      expect(bundle.referralCodes.some((row) => row.publicCode === code.publicCode)).toBe(true);
      const attribution = bundle.attributionsAsReferrer.find((row) => row.id);
      expect(attribution).toBeDefined();
      expect(attribution!.chatAccessState).toBe('UNLOCKED');
      expect(BigInt(bundle.wallet[0]?.balances.pendingMinorUnits ?? '0')).toBeGreaterThan(0n);

      const wallet = as<{ balances: { pendingMinorUnits: string }[]; ledger: { total: number; data: unknown[] } }>(
        await adminGet(`/v1/admin/wallets/${owner.id}?limit=5`).expect(200),
      );
      expect(wallet.ledger.total).toBeGreaterThanOrEqual(1);
      expect(wallet.ledger.data.length).toBeLessThanOrEqual(5);

      const detail = as<{
        attribution: { referrer: { id: string }; referredUser: { id: string } };
        chatAccess: { state: string };
        orderEvents: { eventType: string; orderId: string }[];
        ledger: { transactionType: string }[];
      }>(await adminGet(`/v1/admin/referrals/${attribution!.id}`).expect(200));
      expect(detail.attribution.referrer.id).toBe(owner.id);
      expect(detail.attribution.referredUser.id).toBe(referred.id);
      expect(detail.chatAccess.state).toBe('UNLOCKED');
      expect(detail.orderEvents.some((row) => row.eventType === 'ORDER_COMPLETED')).toBe(true);
      expect(detail.ledger.some((row) => row.transactionType === 'COMMISSION_LOCKED')).toBe(true);
    });
  });

  // ─────────────────────────── immutable audit trail ───────────────────────────

  describe('immutable audit trail', () => {
    it('exposes a small metadata-capped writer and an admin listing surface', async () => {
      const writer = app.get<{ record: (input: unknown) => Promise<void> }>(
        (await import('../src/audit/audit-log.service')).AuditLogService,
      );
      await writer.record({
        actorType: 'SYSTEM',
        actorRef: 'e2e-suite',
        action: 'test.audit_write',
        targetType: 'test',
        metadata: { note: 'hello' },
      });

      const listed = as<{ data: { action: string; actorType: string; metadata: Record<string, unknown>; requestId: string | null }[]; total: number }>(
        await adminGet('/v1/admin/audit-logs?action=test.audit_write').expect(200),
      );
      expect(listed.total).toBeGreaterThanOrEqual(1);
      expect(listed.data[0].actorType).toBe('SYSTEM');
      expect(listed.data[0].metadata).toEqual({ note: 'hello' });
    });

    it('rejects UPDATE and DELETE at the database level (append-only trigger)', async () => {
      const created = await prisma.adminAuditLog.create({
        data: { actorType: 'SYSTEM', action: 'test.append_only', metadata: {} },
        select: { id: true },
      });

      await expect(
        prisma.$executeRawUnsafe(`UPDATE referral_app.admin_audit_logs SET action = 'tampered' WHERE id = '${created.id}'`),
      ).rejects.toThrow(/append-only/i);

      await expect(
        prisma.$executeRawUnsafe(`DELETE FROM referral_app.admin_audit_logs WHERE id = '${created.id}'`),
      ).rejects.toThrow(/append-only/i);

      const still = await prisma.adminAuditLog.findUnique({ where: { id: created.id }, select: { action: true } });
      expect(still?.action).toBe('test.append_only');
    });

    it('refuses audit metadata above the 8 KiB cap', async () => {
      const writer = app.get<{ record: (input: unknown) => Promise<void> }>(
        (await import('../src/audit/audit-log.service')).AuditLogService,
      );
      await expect(
        writer.record({
          actorType: 'SYSTEM',
          action: 'test.oversize',
          metadata: { blob: 'x'.repeat(9_000) },
        }),
      ).rejects.toThrow(/8 KiB/);
    });

    it('records audited admin actions with the acting key reference (never the raw key)', async () => {
      const sweep = await adminPost('/v1/admin/wallet/release-due').send({}).expect(200);
      expect(sweep.body).toHaveProperty('scanned');

      const rows = as<{ data: { action: string; actorRef: string | null; metadata: Record<string, unknown> }[] }>(
        await adminGet('/v1/admin/audit-logs?action=wallet.release_due').expect(200),
      );
      expect(rows.data.length).toBeGreaterThanOrEqual(1);
      const row = rows.data[0];
      expect(row.actorRef).toMatch(/^admin-key:[0-9a-f]{12}$/);
      expect(row.actorRef).not.toContain(ADMIN_KEY);
      expect(row.metadata).toHaveProperty('released');
    });
  });

  // ─────────────────────────── constraint → HTTP mapping ───────────────────────────

  describe('database constraint failures never leak as 500', () => {
    it('maps CHECK/FK/NOT NULL/UNIQUE violations to stable 409 codes', () => {
      expect(mapDatabaseError({ code: 'P2004' })?.code).toBe('CONSTRAINT_VIOLATION');
      expect(mapDatabaseError({ code: 'P2002' })?.code).toBe('DUPLICATE');
      expect(mapDatabaseError({ code: 'P2003' })?.code).toBe('FOREIGN_KEY_VIOLATION');
      expect(mapDatabaseError({ code: 'P2011' })?.code).toBe('NULL_NOT_ALLOWED');
      expect(mapDatabaseError(new Error('unrelated'))).toBeNull();
    });

    it('answers 409 (not 500) when a business guard maps to a conflict', async () => {
      const method = as<{ id: string }>(
        await http()
          .post('/v1/payout-methods')
          .set('x-user-id', owner.id)
          .send({ methodType: 'UPI', providerVaultRef: 'vault-s4', maskedLabel: 'UPI ••••1111' })
          .expect(201),
      );
      const res = await http()
        .post('/v1/payout-requests')
        .set('x-user-id', owner.id)
        .send({ payoutMethodId: method.id, amountMinorUnits: '999999999', idempotencyKey: `s4-over-${randomUUID()}` });
      expect(res.status).toBe(409);
      expect(res.body.statusCode).toBe(409);
      expect(typeof res.body.message).toBe('string');
    });
  });
});
