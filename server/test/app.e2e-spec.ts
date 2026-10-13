import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Sprint 1 e2e — runs against a real PostgreSQL (local dev DB or CI service container).
 * The controlled environment is applied in test/setup-env.ts (jest `setupFiles`),
 * which runs before the app module is imported.
 */
const ADMIN_KEY = 'e2e-admin-key';
const WEBHOOK_SECRET = 'e2e-webhook-secret';
const BASE_URL = 'https://andostpsite.vercel.app/#ref=';

type CodeState = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

interface Metrics {
  clickCount: number;
  uniqueClickCount: number;
  referralCount: number;
  conversionCount: number;
  updatedAt: string | null;
}

interface CodeResponse {
  id: string;
  publicCode: string;
  shareUrl: string;
  state: CodeState;
  isActive: boolean;
  expiresAt: string | null;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
  metrics: Metrics;
}

interface CodeListResponse {
  data: CodeResponse[];
  total: number;
  limit: number;
  offset: number;
}

interface AdminCode extends CodeResponse {
  owner: { id: string; username: string | null };
}

interface AdminListResponse {
  data: AdminCode[];
  total: number;
  limit: number;
  offset: number;
}

interface Recorded {
  recorded: boolean;
  deduplicated: boolean;
  reason?: string;
}

interface UserRow {
  id: string;
  username: string | null;
}

function sign(rawBody: string): string {
  return createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
}

const as = <T>(res: request.Response): T => res.body as T;
const uuid = (): string => randomUUID();

describe('Sprint 1 — Invite Hub (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let owner: UserRow;
  let other: UserRow;
  let referredOne: UserRow;
  let referredTwo: UserRow;

  const createdCodeIds: string[] = [];
  let codeA: CodeResponse; // evergreen, used for click tests
  let codeB: CodeResponse; // future expiry, used for deactivation tests
  let codeExpired: { id: string; publicCode: string }; // inserted directly with a past expiry
  let codeVerified: CodeResponse; // used for HMAC-verified event tests

  const http = () => request(app.getHttpServer());

  const createCode = async (
    userId: string,
    body: Record<string, unknown> = {},
  ): Promise<CodeResponse> => {
    const res = await http()
      .post('/v1/referral-codes')
      .set('x-user-id', userId)
      .send(body)
      .expect(201);
    const created = as<CodeResponse>(res);
    createdCodeIds.push(created.id);
    return created;
  };

  const click = (body: Record<string, unknown>) =>
    http().post('/v1/referral-link-events').send(body);

  const verified = (path: string, rawBody: string, signature?: string) => {
    const req = http().post(`/v1/referral-link-events/verified/${path}`);
    return req
      .set('Content-Type', 'application/json')
      .set('x-andos-signature', signature ?? sign(rawBody))
      .send(rawBody);
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    const createUser = (label: string) =>
      prisma.user.create({
        data: { username: `e2e_${label}_${suffix}` },
        select: { id: true, username: true },
      });
    owner = await createUser('owner');
    other = await createUser('other');
    referredOne = await createUser('referred1');
    referredTwo = await createUser('referred2');
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.referralLinkEvent.deleteMany({
        where: { referralCodeId: { in: createdCodeIds } },
      });
      await prisma.referralAttribution.deleteMany({
        where: { referralCodeId: { in: createdCodeIds } },
      });
      await prisma.referralLinkMetric.deleteMany({
        where: { referralCodeId: { in: createdCodeIds } },
      });
      await prisma.referralCode.deleteMany({ where: { id: { in: createdCodeIds } } });
      const userIds = [owner?.id, other?.id, referredOne?.id, referredTwo?.id].filter(
        (id): id is string => Boolean(id),
      );
      if (userIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
    }
    await app?.close();
  });

  // ─────────────────────────────── identity guard ───────────────────────────────

  describe('identity guard', () => {
    it('rejects requests without the identity header', async () => {
      await http().get('/v1/referral-codes').expect(401);
    });

    it('rejects a malformed identity header', async () => {
      await http().get('/v1/referral-codes').set('x-user-id', 'not-a-uuid').expect(401);
    });

    it('rejects an unknown user id', async () => {
      await http().get('/v1/referral-codes').set('x-user-id', uuid()).expect(401);
    });

    it('serves the caller their own list', async () => {
      const res = await http()
        .get('/v1/referral-codes')
        .set('x-user-id', owner.id)
        .expect(200);
      const body = as<CodeListResponse>(res);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body).toMatchObject({ limit: 20, offset: 0 });
    });
  });

  // ──────────────────────────────── creating links ────────────────────────────────

  describe('POST /v1/referral-codes', () => {
    it('creates an evergreen link by default with zeroed metrics', async () => {
      codeA = await createCode(owner.id);
      expect(codeA.publicCode).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
      expect(codeA.state).toBe('ACTIVE');
      expect(codeA.isActive).toBe(true);
      expect(codeA.expiresAt).toBeNull();
      expect(codeA.shareUrl).toBe(`${BASE_URL}${codeA.publicCode}`);
      expect(codeA.metrics).toEqual({
        clickCount: 0,
        uniqueClickCount: 0,
        referralCount: 0,
        conversionCount: 0,
        updatedAt: null,
      });
    });

    it('creates a link with a future expiry', async () => {
      const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      codeB = await createCode(owner.id, { expiresAt: future });
      expect(codeB.state).toBe('ACTIVE');
      expect(codeB.expiresAt).toBe(future);
    });

    it('rejects a past expiry', async () => {
      await createCodeExpectStatus(400, {
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      });
    });

    it('rejects a malformed expiry', async () => {
      await createCodeExpectStatus(400, { expiresAt: 'tomorrow' });
    });

    it('rejects unknown fields (whitelist enforcement)', async () => {
      await createCodeExpectStatus(400, { rate: 5000 });
    });

    it('rejects an unknown campaign id', async () => {
      await createCodeExpectStatus(400, { campaignId: uuid() });
    });

    const createCodeExpectStatus = async (status: number, body: Record<string, unknown>) => {
      await http().post('/v1/referral-codes').set('x-user-id', owner.id).send(body).expect(status);
    };
  });

  // ──────────────────────────────── listing + states ────────────────────────────────

  describe('GET /v1/referral-codes (list + state filters)', () => {
    it('lists own links newest-first and paginates', async () => {
      const res = await http()
        .get('/v1/referral-codes?limit=1')
        .set('x-user-id', owner.id)
        .expect(200);
      const body = as<CodeListResponse>(res);
      expect(body.data).toHaveLength(1);
      expect(body.total).toBeGreaterThanOrEqual(2);
      expect(body.limit).toBe(1);
    });

    it('rejects invalid pagination values', async () => {
      await http().get('/v1/referral-codes?limit=0').set('x-user-id', owner.id).expect(400);
      await http().get('/v1/referral-codes?limit=101').set('x-user-id', owner.id).expect(400);
      await http().get('/v1/referral-codes?offset=-1').set('x-user-id', owner.id).expect(400);
      await http().get('/v1/referral-codes?state=BOGUS').set('x-user-id', owner.id).expect(400);
    });

    it('reports an enabled-but-past-expiry link as EXPIRED', async () => {
      // Created directly with a backdated createdAt so the row satisfies the
      // `expires_at > created_at` CHECK constraint while already being expired.
      const row = await prisma.referralCode.create({
        data: {
          ownerUserId: owner.id,
          publicCode: `E2EEXP${Math.floor(Math.random() * 90 + 10)}`,
          isActive: true,
          createdAt: new Date(Date.now() - 2 * 3600_000),
          expiresAt: new Date(Date.now() - 3600_000),
        },
        select: { id: true, publicCode: true },
      });
      createdCodeIds.push(row.id);
      codeExpired = row;

      const expiredRes = await http()
        .get('/v1/referral-codes?state=EXPIRED')
        .set('x-user-id', owner.id)
        .expect(200);
      const expiredBody = as<CodeListResponse>(expiredRes);
      const match = expiredBody.data.find((c) => c.id === row.id);
      expect(match).toBeDefined();
      expect(match?.state).toBe('EXPIRED');
      expect(match?.isActive).toBe(true);

      const activeRes = await http()
        .get('/v1/referral-codes?state=ACTIVE')
        .set('x-user-id', owner.id)
        .expect(200);
      expect(as<CodeListResponse>(activeRes).data.some((c) => c.id === row.id)).toBe(false);
    });
  });

  // ──────────────────────────────── read one + privacy ────────────────────────────────

  describe('GET /v1/referral-codes/:id (privacy)', () => {
    it('returns the owner their own code', async () => {
      const res = await http()
        .get(`/v1/referral-codes/${codeA.id}`)
        .set('x-user-id', owner.id)
        .expect(200);
      expect(as<CodeResponse>(res).id).toBe(codeA.id);
    });

    it("hides another user's code behind a 404", async () => {
      await http()
        .get(`/v1/referral-codes/${codeA.id}`)
        .set('x-user-id', other.id)
        .expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      await http()
        .get(`/v1/referral-codes/${uuid()}`)
        .set('x-user-id', owner.id)
        .expect(404);
    });
  });

  // ──────────────────────────────── deactivation ────────────────────────────────

  describe('POST /v1/referral-codes/:id/deactivate', () => {
    it('deactivates idempotently', async () => {
      const first = await http()
        .post(`/v1/referral-codes/${codeB.id}/deactivate`)
        .set('x-user-id', owner.id)
        .expect(200);
      const firstBody = as<CodeResponse>(first);
      expect(firstBody.state).toBe('INACTIVE');
      expect(firstBody.isActive).toBe(false);

      const second = await http()
        .post(`/v1/referral-codes/${codeB.id}/deactivate`)
        .set('x-user-id', owner.id)
        .expect(200);
      expect(as<CodeResponse>(second).state).toBe('INACTIVE');
    });

    it("refuses to deactivate another user's code", async () => {
      await http()
        .post(`/v1/referral-codes/${codeA.id}/deactivate`)
        .set('x-user-id', other.id)
        .expect(404);
    });
  });

  // ──────────────────────────────── click tracking ────────────────────────────────

  describe('POST /v1/referral-link-events (clicks)', () => {
    it('records a click with a visitor token', async () => {
      const res = await click({ publicCode: codeA.publicCode, visitorToken: 'visitor-one-token' }).expect(200);
      expect(as<Recorded>(res)).toMatchObject({ recorded: true, deduplicated: false });
    });

    it('deduplicates the same visitor inside the window', async () => {
      const res = await click({ publicCode: codeA.publicCode, visitorToken: 'visitor-one-token' }).expect(200);
      expect(as<Recorded>(res)).toMatchObject({ recorded: false, deduplicated: true });
    });

    it('records a second visitor and counts them as unique', async () => {
      const res = await click({ publicCode: codeA.publicCode, visitorToken: 'visitor-two-token' }).expect(200);
      expect(as<Recorded>(res).recorded).toBe(true);

      const dupe = await click({ publicCode: codeA.publicCode, visitorToken: 'visitor-two-token' }).expect(200);
      expect(as<Recorded>(dupe).deduplicated).toBe(true);
    });

    it('records the same visitor again once the dedupe window has moved on', async () => {
      const later = new Date(Date.now() + 6 * 60_000).toISOString();
      const res = await click({
        publicCode: codeA.publicCode,
        visitorToken: 'visitor-two-token',
        occurredAt: later,
      }).expect(200);
      expect(as<Recorded>(res).recorded).toBe(true);
    });

    it('counts clicks without a visitor token per request', async () => {
      const res = await click({ publicCode: codeA.publicCode }).expect(200);
      expect(as<Recorded>(res).recorded).toBe(true);
      const another = await click({ publicCode: codeA.publicCode }).expect(200);
      expect(as<Recorded>(another).recorded).toBe(true);
    });

    it('accepts the code case-insensitively', async () => {
      const res = await click({
        publicCode: codeA.publicCode.toLowerCase(),
        visitorToken: 'visitor-three-token',
      }).expect(200);
      expect(as<Recorded>(res).recorded).toBe(true);
    });

    it('reports the final click metrics for the link', async () => {
      // 4 recorded clicks (v1, v2, v2-later, v3) + 2 anonymous = 6; unique = v1, v2, v3 + 2 anonymous = 5.
      const res = await http()
        .get(`/v1/referral-codes/${codeA.id}/metrics`)
        .set('x-user-id', owner.id)
        .expect(200);
      const metrics = as<Metrics>(res);
      expect(metrics.clickCount).toBe(6);
      expect(metrics.uniqueClickCount).toBe(5);
      expect(metrics.referralCount).toBe(0);
      expect(metrics.conversionCount).toBe(0);
      expect(metrics.updatedAt).not.toBeNull();
    });

    it('answers CODE_NOT_FOUND for an unknown code', async () => {
      const res = await click({ publicCode: 'ZZZZ9999' }).expect(200);
      expect(as<Recorded>(res)).toMatchObject({ recorded: false, reason: 'CODE_NOT_FOUND' });
    });

    it('answers CODE_INACTIVE for a deactivated link', async () => {
      const res = await click({ publicCode: codeB.publicCode }).expect(200);
      expect(as<Recorded>(res)).toMatchObject({ recorded: false, reason: 'CODE_INACTIVE' });
    });

    it('answers CODE_EXPIRED for an expired link', async () => {
      const res = await click({ publicCode: codeExpired.publicCode }).expect(200);
      expect(as<Recorded>(res)).toMatchObject({ recorded: false, reason: 'CODE_EXPIRED' });
    });

    it('validates the payload', async () => {
      await click({}).expect(400);
      await click({ publicCode: 'x' }).expect(400);
      await click({ publicCode: codeA.publicCode, visitorToken: 'short' }).expect(400);
    });
  });

  // ──────────────────────────────── verified events ────────────────────────────────

  describe('POST /v1/referral-link-events/verified/* (HMAC required)', () => {
    it('rejects a missing signature', async () => {
      await http()
        .post('/v1/referral-link-events/verified/referral')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ publicCode: codeA.publicCode, sourceEventId: 'evt-1' }))
        .expect(401);
    });

    it('rejects a wrong signature', async () => {
      await verified(
        'referral',
        JSON.stringify({ publicCode: codeA.publicCode, sourceEventId: 'evt-1' }),
        'deadbeef',
      ).expect(401);
    });

    it('starts a verified-code fixture', async () => {
      codeVerified = await createCode(owner.id);
    });

    it('records a signed referral event, links the attribution and deduplicates replays', async () => {
      const payload = JSON.stringify({
        publicCode: codeVerified.publicCode,
        sourceEventId: 'signup-0001',
        sourceSystem: 'andos-main-app',
        referredUserId: referredOne.id,
      });

      const first = await verified('referral', payload).expect(200);
      expect(as<Recorded>(first)).toMatchObject({ recorded: true, deduplicated: false });

      const attribution = await prisma.referralAttribution.findUnique({
        where: {
          referralCodeId_referredUserId: {
            referralCodeId: codeVerified.id,
            referredUserId: referredOne.id,
          },
        },
        select: { referrerUserId: true, attributionStatus: true, sourceEventId: true },
      });
      expect(attribution).not.toBeNull();
      expect(attribution?.referrerUserId).toBe(owner.id);
      expect(attribution?.attributionStatus).toBe('ATTRIBUTED');
      expect(attribution?.sourceEventId).toBe('signup-0001');

      const replay = await verified('referral', payload).expect(200);
      expect(as<Recorded>(replay)).toMatchObject({ recorded: false, deduplicated: true });
    });

    it('records a signed conversion event, deduplicates replays and counts distinct events', async () => {
      const payload = JSON.stringify({
        publicCode: codeVerified.publicCode,
        sourceEventId: 'order-1001',
        conversionKind: 'ORDER_COMPLETED',
        referredUserId: referredOne.id,
      });
      const first = await verified('conversion', payload).expect(200);
      expect(as<Recorded>(first).recorded).toBe(true);
      const replay = await verified('conversion', payload).expect(200);
      expect(as<Recorded>(replay).deduplicated).toBe(true);

      // A conversion for a user with no prior attribution auto-creates the minimal attribution.
      const secondEvent = JSON.stringify({
        publicCode: codeVerified.publicCode,
        sourceEventId: 'order-1002',
        referredUserId: referredTwo.id,
      });
      const next = await verified('conversion', secondEvent).expect(200);
      expect(as<Recorded>(next).recorded).toBe(true);
    });

    it('accepts the sha256= signature prefix', async () => {
      const payload = JSON.stringify({
        publicCode: codeVerified.publicCode,
        sourceEventId: 'order-1003',
        referredUserId: referredTwo.id,
      });
      const res = await verified('conversion', payload, `sha256=${sign(payload)}`).expect(200);
      expect(as<Recorded>(res).recorded).toBe(true);
    });

    it('rejects signed events for a deactivated link with CODE_INACTIVE', async () => {
      const payload = JSON.stringify({
        publicCode: codeB.publicCode,
        sourceEventId: 'signup-9999',
        referredUserId: referredOne.id,
      });
      const res = await verified('referral', payload).expect(200);
      expect(as<Recorded>(res)).toMatchObject({ recorded: false, reason: 'CODE_INACTIVE' });
    });

    it('answers CODE_EXPIRED for an expired link', async () => {
      const payload = JSON.stringify({
        publicCode: codeExpired.publicCode,
        sourceEventId: 'signup-expired',
        referredUserId: referredOne.id,
      });
      const res = await verified('referral', payload).expect(200);
      expect(as<Recorded>(res)).toMatchObject({ recorded: false, reason: 'CODE_EXPIRED' });
    });

    it('validates the signed payload', async () => {
      await verified(
        'referral',
        JSON.stringify({ publicCode: codeVerified.publicCode }),
      ).expect(400);
      await verified(
        'referral',
        JSON.stringify({
          publicCode: codeVerified.publicCode,
          sourceEventId: 'signup-0002',
        }),
      ).expect(400);
    });

    it('answers 422 for an unknown referred user', async () => {
      const payload = JSON.stringify({
        publicCode: codeVerified.publicCode,
        sourceEventId: 'signup-ghost',
        referredUserId: uuid(),
      });
      await verified('referral', payload).expect(422);
    });

    it('reports final verified metrics for the link', async () => {
      const res = await http()
        .get(`/v1/referral-codes/${codeVerified.id}/metrics`)
        .set('x-user-id', owner.id)
        .expect(200);
      const metrics = as<Metrics>(res);
      expect(metrics.clickCount).toBe(0);
      expect(metrics.referralCount).toBe(1);
      expect(metrics.conversionCount).toBe(3);
    });

    it("hides another user's metrics behind a 404", async () => {
      await http()
        .get(`/v1/referral-codes/${codeA.id}/metrics`)
        .set('x-user-id', other.id)
        .expect(404);
    });
  });

  // ──────────────────────────────── admin views ────────────────────────────────

  describe('admin referral-code views (x-admin-key)', () => {
    it('rejects missing or wrong admin keys', async () => {
      await http().get('/v1/admin/referral-codes').expect(401);
      await http().get('/v1/admin/referral-codes').set('x-admin-key', 'nope').expect(401);
    });

    it('lists links across referrers with owner info', async () => {
      const res = await http()
        .get('/v1/admin/referral-codes?limit=100')
        .set('x-admin-key', ADMIN_KEY)
        .expect(200);
      const body = as<AdminListResponse>(res);
      const mine = body.data.filter((c) => c.owner.id === owner.id);
      expect(mine.length).toBeGreaterThanOrEqual(4);
      expect(mine.every((c) => c.owner.username === owner.username)).toBe(true);
    });

    it('filters by owner', async () => {
      const res = await http()
        .get(`/v1/admin/referral-codes?ownerUserId=${owner.id}&limit=100`)
        .set('x-admin-key', ADMIN_KEY)
        .expect(200);
      const body = as<AdminListResponse>(res);
      expect(body.data.length).toBeGreaterThanOrEqual(4);
      expect(body.data.every((c) => c.owner.id === owner.id)).toBe(true);
    });

    it('filters by exact public code, case-insensitively', async () => {
      const res = await http()
        .get(`/v1/admin/referral-codes?publicCode=${codeA.publicCode.toLowerCase()}`)
        .set('x-admin-key', ADMIN_KEY)
        .expect(200);
      const body = as<AdminListResponse>(res);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toBe(codeA.id);
    });

    it('returns a single link with owner info', async () => {
      const res = await http()
        .get(`/v1/admin/referral-codes/${codeA.id}`)
        .set('x-admin-key', ADMIN_KEY)
        .expect(200);
      const body = as<AdminCode>(res);
      expect(body.id).toBe(codeA.id);
      expect(body.owner.id).toBe(owner.id);
    });

    it('returns the authorized summary', async () => {
      const res = await http()
        .get('/v1/admin/referral-codes/summary')
        .set('x-admin-key', ADMIN_KEY)
        .expect(200);
      const body = as<{
        codes: { total: number; active: number; expired: number; inactive: number };
        totals: Omit<Metrics, 'updatedAt'>;
      }>(res);
      expect(body.codes.total).toBeGreaterThanOrEqual(4);
      expect(body.totals.clickCount).toBeGreaterThanOrEqual(6);
      expect(body.totals.referralCount).toBeGreaterThanOrEqual(1);
      expect(body.totals.conversionCount).toBeGreaterThanOrEqual(3);
    });
  });

  // ──────────────────────────────── health ────────────────────────────────

  describe('health', () => {
    it('reports ok with a reachable database', async () => {
      const res = await http().get('/v1/health').expect(200);
      const body = as<{ status: string; db: boolean }>(res);
      expect(body.status).toBe('ok');
      expect(body.db).toBe(true);
    });
  });
});
