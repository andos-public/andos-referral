import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Sprint 2 e2e — signed main-app signup/install-login verification, referral list /
 * milestone projection and the referral-chat entitlement (LOCKED → UNLOCKED).
 * Runs against a real PostgreSQL with the controlled env from test/setup-env.ts.
 */
const ADMIN_KEY = 'e2e-admin-key';
const WEBHOOK_SECRET = 'e2e-webhook-secret';

interface Recorded {
  recorded: boolean;
  deduplicated: boolean;
  reason?: string;
}

interface MainAppEventResult extends Recorded {
  eventType?: string;
  attributionId?: string;
  eventId?: string;
  chatAccessState?: 'LOCKED' | 'UNLOCKED';
  installLoginVerifiedAt?: string | null;
}

interface ChatAccess {
  attributionId: string;
  state: 'LOCKED' | 'UNLOCKED';
  unlockedAt: string | null;
  unlockSourceEventId: string | null;
}

interface ReferralItem {
  id: string;
  codeId: string;
  publicCode: string;
  referrer: { id: string; username: string | null; displayName: string | null };
  referredUser: { id: string; username: string | null; displayName: string | null };
  attributionStatus: string;
  attributedAt: string;
  sourceEventId: string | null;
  mainAppInstallLoginAt: string | null;
  milestones: {
    signedUpAt: string | null;
    installLoginVerifiedAt: string | null;
    chatUnlockedAt: string | null;
    currentMilestone: string;
  };
  chatAccess: ChatAccess;
}

interface ReferralList {
  data: ReferralItem[];
  total: number;
  limit: number;
  offset: number;
}

interface ReferralDetail extends ReferralItem {
  viewerRole: 'REFERRER' | 'REFERRED';
  events: { id: string; eventType: string; sourceSystem: string; occurredAt: string; verifiedAt: string }[];
}

interface CodeResponse {
  id: string;
  publicCode: string;
}

interface UserRow {
  id: string;
}

const sign = (rawBody: string): string =>
  createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

const as = <T>(res: request.Response): T => res.body as T;

describe('Sprint 2 — main-app verification, referral list & chat entitlement (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let owner: UserRow;
  let other: UserRow;
  let referredA: UserRow;
  let referredB: UserRow;
  let referredC: UserRow;
  let referredD: UserRow;

  let codeMain: CodeResponse; // owner's evergreen link (referredA/D flow)
  let codeDeactivated: CodeResponse; // owner's link deactivated mid-lifecycle (referredB)
  let codeNeverActive: CodeResponse; // inserted directly with isActive=false (referredC)

  const createdCodeIds: string[] = [];
  const createdUserIds: string[] = [];

  const http = () => request(app.getHttpServer());

  const createUser = async (label: string): Promise<UserRow> => {
    const suffix = `${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6)}`;
    const user = await prisma.user.create({
      data: { username: `s2_${label}_${suffix}` },
      select: { id: true },
    });
    createdUserIds.push(user.id);
    return user;
  };

  const createCode = async (userId: string): Promise<CodeResponse> => {
    const res = await http()
      .post('/v1/referral-codes')
      .set('x-user-id', userId)
      .send({})
      .expect(201);
    const code = as<CodeResponse>(res);
    createdCodeIds.push(code.id);
    return code;
  };

  /** POSTs a signed main-app event exactly like the main app will (HMAC over the raw body). */
  const mainAppEvent = (body: Record<string, unknown>, signature?: string) => {
    const rawBody = JSON.stringify(body);
    return http()
      .post('/v1/main-app-events/verified')
      .set('Content-Type', 'application/json')
      .set('x-andos-signature', signature ?? sign(rawBody))
      .send(rawBody);
  };

  const signup = (publicCode: string, referredUserId: string) =>
    mainAppEvent({
      eventType: 'SIGNUP',
      publicCode,
      referredUserId,
      sourceEventId: `signup-${randomUUID()}`,
    });

  const installLogin = (publicCode: string, referredUserId: string, sourceEventId?: string) =>
    mainAppEvent({
      eventType: 'INSTALL_LOGIN',
      publicCode,
      referredUserId,
      sourceEventId: sourceEventId ?? `install-${randomUUID()}`,
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configureApp(app); // same bootstrap wiring as production (prefix, pipes, CORS, /docs)
    await app.init();
    prisma = app.get(PrismaService);

    owner = await createUser('owner');
    other = await createUser('other');
    referredA = await createUser('referred_a');
    referredB = await createUser('referred_b');
    referredC = await createUser('referred_c');
    referredD = await createUser('referred_d');

    codeMain = await createCode(owner.id);
    codeDeactivated = await createCode(owner.id);

    const neverActive = await prisma.referralCode.create({
      data: {
        ownerUserId: owner.id,
        publicCode: `NA${Date.now().toString(36).toUpperCase().slice(-6)}`,
        isActive: false,
      },
      select: { id: true, publicCode: true },
    });
    createdCodeIds.push(neverActive.id);
    codeNeverActive = neverActive;
  });

  afterAll(async () => {
    await prisma.referralChatAccess.deleteMany({
      where: {
        attribution: {
          OR: [{ referrerUserId: { in: createdUserIds } }, { referredUserId: { in: createdUserIds } }],
        },
      },
    });
    await prisma.referralEvent.deleteMany({
      where: {
        attribution: {
          OR: [{ referrerUserId: { in: createdUserIds } }, { referredUserId: { in: createdUserIds } }],
        },
      },
    });
    await prisma.referralLinkEvent.deleteMany({
      where: { referralCodeId: { in: createdCodeIds } },
    });
    await prisma.referralAttribution.deleteMany({
      where: {
        OR: [{ referrerUserId: { in: createdUserIds } }, { referredUserId: { in: createdUserIds } }],
      },
    });
    await prisma.referralLinkMetric.deleteMany({
      where: { referralCodeId: { in: createdCodeIds } },
    });
    await prisma.referralCode.deleteMany({ where: { ownerUserId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  describe('verified main-app events (HMAC)', () => {
    it('records SIGNUP as a milestone and keeps referral chat LOCKED', async () => {
      const res = await signup(codeMain.publicCode, referredA.id).expect(200);
      const body = as<MainAppEventResult>(res);
      expect(body.recorded).toBe(true);
      expect(body.deduplicated).toBe(false);
      expect(body.eventType).toBe('SIGNUP');
      expect(body.chatAccessState).toBe('LOCKED');
      expect(body.installLoginVerifiedAt).toBeNull();

      const access = await http()
        .get(`/v1/referrals/${body.attributionId}/chat-access`)
        .set('x-user-id', owner.id)
        .expect(200);
      expect(as<ChatAccess>(access).state).toBe('LOCKED');
    });

    it('INSTALL_LOGIN unlocks referral chat and stamps the verified install/login', async () => {
      const res = await installLogin(codeMain.publicCode, referredA.id).expect(200);
      const body = as<MainAppEventResult>(res);
      expect(body.recorded).toBe(true);
      expect(body.chatAccessState).toBe('UNLOCKED');
      expect(body.installLoginVerifiedAt).not.toBeNull();

      const row = await prisma.referralAttribution.findUnique({
        where: { referralCodeId_referredUserId: { referralCodeId: codeMain.id, referredUserId: referredA.id } },
        select: { mainAppInstallLoginAt: true, chatAccess: { select: { accessState: true, unlockedAt: true } } },
      });
      expect(row?.mainAppInstallLoginAt).not.toBeNull();
      expect(row?.chatAccess?.accessState).toBe('UNLOCKED');
      expect(row?.chatAccess?.unlockedAt).not.toBeNull();
    });

    it('is idempotent per sourceEventId and never moves the unlock timestamp on replay', async () => {
      const row = await prisma.referralAttribution.findUnique({
        where: { referralCodeId_referredUserId: { referralCodeId: codeMain.id, referredUserId: referredA.id } },
        select: { chatAccess: { select: { unlockedAt: true, unlockSourceEventId: true } } },
      });
      const firstUnlockedAt = row?.chatAccess?.unlockedAt?.toISOString();

      const sourceEventId = `install-replay-${randomUUID()}`;
      await installLogin(codeMain.publicCode, referredA.id, sourceEventId).expect(200);
      const replay = await installLogin(codeMain.publicCode, referredA.id, sourceEventId).expect(200);
      const replayed = as<MainAppEventResult>(replay);
      expect(replayed.recorded).toBe(false);
      expect(replayed.deduplicated).toBe(true);

      const after = await prisma.referralAttribution.findUnique({
        where: { referralCodeId_referredUserId: { referralCodeId: codeMain.id, referredUserId: referredA.id } },
        select: { chatAccess: { select: { unlockedAt: true, unlockSourceEventId: true } } },
      });
      expect(after?.chatAccess?.unlockedAt?.toISOString()).toBe(firstUnlockedAt);
    });

    it('keeps the FIRST unlocking event as the recorded source (later events do not overwrite)', async () => {
      const before = await prisma.referralAttribution.findUnique({
        where: { referralCodeId_referredUserId: { referralCodeId: codeMain.id, referredUserId: referredA.id } },
        select: { chatAccess: { select: { unlockedAt: true, unlockSourceEventId: true } } },
      });

      const res = await installLogin(codeMain.publicCode, referredA.id).expect(200);
      expect(as<MainAppEventResult>(res).recorded).toBe(true);

      const after = await prisma.referralAttribution.findUnique({
        where: { referralCodeId_referredUserId: { referralCodeId: codeMain.id, referredUserId: referredA.id } },
        select: { chatAccess: { select: { unlockedAt: true, unlockSourceEventId: true } } },
      });
      expect(after?.chatAccess?.unlockedAt?.toISOString()).toBe(
        before?.chatAccess?.unlockedAt?.toISOString(),
      );
      expect(after?.chatAccess?.unlockSourceEventId).toBe(before?.chatAccess?.unlockSourceEventId);
    });

    it('accepts a lifecycle event after the link was deactivated (existing referral)', async () => {
      await signup(codeDeactivated.publicCode, referredB.id).expect(200);
      await http()
        .post(`/v1/referral-codes/${codeDeactivated.id}/deactivate`)
        .set('x-user-id', owner.id)
        .expect(200);

      const res = await installLogin(codeDeactivated.publicCode, referredB.id).expect(200);
      const body = as<MainAppEventResult>(res);
      expect(body.recorded).toBe(true);
      expect(body.chatAccessState).toBe('UNLOCKED');
    });

    it('refuses new attributions through a code that is not ACTIVE', async () => {
      const res = await installLogin(codeNeverActive.publicCode, referredC.id).expect(200);
      const body = as<MainAppEventResult>(res);
      expect(body.recorded).toBe(false);
      expect(body.reason).toBe('CODE_INACTIVE');
    });

    it('rejects self-referrals without recording anything', async () => {
      const res = await installLogin(codeMain.publicCode, owner.id).expect(200);
      const body = as<MainAppEventResult>(res);
      expect(body.recorded).toBe(false);
      expect(body.reason).toBe('SELF_REFERRAL');
    });

    it('answers CODE_NOT_FOUND for an unknown public code (business response, HTTP 200)', async () => {
      const res = await installLogin('ZZZZ9999', referredD.id).expect(200);
      const body = as<MainAppEventResult>(res);
      expect(body.recorded).toBe(false);
      expect(body.reason).toBe('CODE_NOT_FOUND');
    });

    it('rejects an invalid or missing signature with 401', async () => {
      const body = {
        eventType: 'SIGNUP',
        publicCode: codeMain.publicCode,
        referredUserId: referredD.id,
        sourceEventId: `bad-sig-${randomUUID()}`,
      };
      await mainAppEvent(body, 'deadbeef').expect(401);
      const rawBody = JSON.stringify(body);
      await http()
        .post('/v1/main-app-events/verified')
        .set('Content-Type', 'application/json')
        .send(rawBody)
        .expect(401);
    });

    it('rejects unknown referred users with 422 and bad payloads with 400', async () => {
      await mainAppEvent({
        eventType: 'SIGNUP',
        publicCode: codeMain.publicCode,
        referredUserId: randomUUID(),
        sourceEventId: `unknown-${randomUUID()}`,
      }).expect(422);

      await mainAppEvent({
        eventType: 'NOT_A_TYPE',
        publicCode: codeMain.publicCode,
        referredUserId: referredD.id,
        sourceEventId: `bad-type-${randomUUID()}`,
      }).expect(400);

      // cheap guard against unbounded audit metadata
      await mainAppEvent({
        eventType: 'SIGNUP',
        publicCode: codeMain.publicCode,
        referredUserId: referredD.id,
        sourceEventId: `big-meta-${randomUUID()}`,
        safeMetadata: { blob: 'x'.repeat(4096) },
      }).expect(400);
    });
  });

  describe('referral list & milestone projection', () => {
    it('lists my referrals (as referrer) with milestones and chat state', async () => {
      const res = await http()
        .get('/v1/referrals?limit=100')
        .set('x-user-id', owner.id)
        .expect(200);
      const body = as<ReferralList>(res);
      expect(body.total).toBeGreaterThanOrEqual(2);

      const itemA = body.data.find((item) => item.referredUser.id === referredA.id);
      expect(itemA).toBeDefined();
      expect(itemA?.publicCode).toBe(codeMain.publicCode);
      expect(itemA?.referrer.id).toBe(owner.id);
      expect(itemA?.milestones.currentMilestone).toBe('CHAT_UNLOCKED');
      expect(itemA?.milestones.signedUpAt).not.toBeNull();
      expect(itemA?.milestones.installLoginVerifiedAt).not.toBeNull();
      expect(itemA?.chatAccess.state).toBe('UNLOCKED');

      const itemB = body.data.find((item) => item.referredUser.id === referredB.id);
      expect(itemB?.publicCode).toBe(codeDeactivated.publicCode);
    });

    it('scopes the list strictly to the authenticated referrer', async () => {
      const res = await http().get('/v1/referrals').set('x-user-id', other.id).expect(200);
      const body = as<ReferralList>(res);
      expect(body.total).toBe(0);
      expect(body.data).toEqual([]);
    });

    it('supports pagination and chatState filters', async () => {
      const first = as<ReferralList>(
        await http().get('/v1/referrals?limit=1&offset=0').set('x-user-id', owner.id).expect(200),
      );
      expect(first.data).toHaveLength(1);
      expect(first.limit).toBe(1);
      expect(first.offset).toBe(0);

      const second = as<ReferralList>(
        await http().get('/v1/referrals?limit=1&offset=1').set('x-user-id', owner.id).expect(200),
      );
      expect(second.data).toHaveLength(1);
      expect(second.data[0].id).not.toBe(first.data[0].id);

      const unlocked = as<ReferralList>(
        await http().get('/v1/referrals?chatState=UNLOCKED&limit=100').set('x-user-id', owner.id).expect(200),
      );
      expect(unlocked.data.length).toBeGreaterThanOrEqual(2);
      expect(unlocked.data.every((item) => item.chatAccess.state === 'UNLOCKED')).toBe(true);

      const locked = as<ReferralList>(
        await http().get('/v1/referrals?chatState=LOCKED&limit=100').set('x-user-id', owner.id).expect(200),
      );
      expect(locked.data.every((item) => item.chatAccess.state === 'LOCKED')).toBe(true);
    });
  });

  describe('referral detail & chat entitlement', () => {
    it('referrer reads the detail with the verified event timeline', async () => {
      const list = as<ReferralList>(
        await http().get('/v1/referrals?limit=100').set('x-user-id', owner.id).expect(200),
      );
      const item = list.data.find((row) => row.referredUser.id === referredA.id)!;

      const res = await http().get(`/v1/referrals/${item.id}`).set('x-user-id', owner.id).expect(200);
      const detail = as<ReferralDetail>(res);
      expect(detail.viewerRole).toBe('REFERRER');
      const types = detail.events.map((event) => event.eventType);
      expect(types).toContain('SIGNUP');
      expect(types).toContain('INSTALL_LOGIN');
      // oldest first
      const occurred = detail.events.map((event) => Date.parse(event.occurredAt));
      expect([...occurred].sort((a, b) => a - b)).toEqual(occurred);
    });

    it('the referred user can read their own referral and entitlement (viewerRole REFERRED)', async () => {
      const list = as<ReferralList>(
        await http().get('/v1/referrals?limit=100').set('x-user-id', owner.id).expect(200),
      );
      const item = list.data.find((row) => row.referredUser.id === referredA.id)!;

      const detail = as<ReferralDetail>(
        await http().get(`/v1/referrals/${item.id}`).set('x-user-id', referredA.id).expect(200),
      );
      expect(detail.viewerRole).toBe('REFERRED');

      const access = as<ChatAccess>(
        await http().get(`/v1/referrals/${item.id}/chat-access`).set('x-user-id', referredA.id).expect(200),
      );
      expect(access.state).toBe('UNLOCKED');
    });

    it('hides referrals from unrelated users (404, no existence leak)', async () => {
      const list = as<ReferralList>(
        await http().get('/v1/referrals?limit=100').set('x-user-id', owner.id).expect(200),
      );
      const item = list.data.find((row) => row.referredUser.id === referredA.id)!;

      await http().get(`/v1/referrals/${item.id}`).set('x-user-id', other.id).expect(404);
      await http().get(`/v1/referrals/${item.id}/chat-access`).set('x-user-id', other.id).expect(404);
    });

    it('a fresh referral starts LOCKED and flips to UNLOCKED on verified install/login', async () => {
      const signupRes = as<MainAppEventResult>(
        await signup(codeMain.publicCode, referredD.id).expect(200),
      );
      expect(signupRes.chatAccessState).toBe('LOCKED');

      const lockedAccess = as<ChatAccess>(
        await http()
          .get(`/v1/referrals/${signupRes.attributionId}/chat-access`)
          .set('x-user-id', owner.id)
          .expect(200),
      );
      expect(lockedAccess.state).toBe('LOCKED');

      await installLogin(codeMain.publicCode, referredD.id).expect(200);

      const unlockedAccess = as<ChatAccess>(
        await http()
          .get(`/v1/referrals/${signupRes.attributionId}/chat-access`)
          .set('x-user-id', owner.id)
          .expect(200),
      );
      expect(unlockedAccess.state).toBe('UNLOCKED');
      expect(unlockedAccess.unlockedAt).not.toBeNull();
      expect(unlockedAccess.unlockSourceEventId).not.toBeNull();
    });
  });

  describe('bootstrap hardening (CORS + docs gating)', () => {
    it('mirrors ONLY the configured origins on API responses', async () => {
      const allowed = await http()
        .get('/v1/health')
        .set('Origin', 'https://andostpsite.vercel.app')
        .expect(200);
      expect(allowed.headers['access-control-allow-origin']).toBe('https://andostpsite.vercel.app');

      const foreign = await http().get('/v1/health').set('Origin', 'https://evil.example').expect(200);
      expect(foreign.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('serves Swagger only when DOCS_ENABLED is on', async () => {
      await http().get('/docs').expect(200);
    });
  });

  describe('admin referral view', () => {
    it('requires the admin key', async () => {
      await http().get('/v1/admin/referrals').expect(401);
      await http().get('/v1/admin/referrals').set('x-admin-key', 'wrong-key').expect(401);
    });

    it('returns referrals across referrers with filters', async () => {
      const res = await http()
        .get(`/v1/admin/referrals?referrerUserId=${owner.id}&limit=100`)
        .set('x-admin-key', ADMIN_KEY)
        .expect(200);
      const body = as<ReferralList>(res);
      expect(body.total).toBeGreaterThanOrEqual(3);
      expect(body.data.every((item) => item.referrer.id === owner.id)).toBe(true);

      const unlocked = as<ReferralList>(
        await http()
          .get(`/v1/admin/referrals?referrerUserId=${owner.id}&chatState=UNLOCKED&limit=100`)
          .set('x-admin-key', ADMIN_KEY)
          .expect(200),
      );
      expect(unlocked.data.length).toBeGreaterThanOrEqual(2);
      expect(unlocked.data.every((item) => item.chatAccess.state === 'UNLOCKED')).toBe(true);
    });
  });
});
