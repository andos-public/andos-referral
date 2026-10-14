import { ChatAccessState } from '@prisma/client';
import { earliestEventAt, entitlementFrom, projectMilestones, toIso } from './referrals.util';

describe('referrals.util (milestone & entitlement projection)', () => {
  const at = (iso: string): Date => new Date(iso);

  describe('projectMilestones', () => {
    it('stays at ATTRIBUTED when nothing else is verified', () => {
      const result = projectMilestones({
        signedUpAt: null,
        installLoginVerifiedAt: null,
        chatUnlockedAt: null,
      });
      expect(result).toEqual({
        signedUpAt: null,
        installLoginVerifiedAt: null,
        chatUnlockedAt: null,
        currentMilestone: 'ATTRIBUTED',
      });
    });

    it('moves to SIGNED_UP on the first signup event only', () => {
      const result = projectMilestones({
        signedUpAt: at('2026-10-13T10:00:00.000Z'),
        installLoginVerifiedAt: null,
        chatUnlockedAt: null,
      });
      expect(result.currentMilestone).toBe('SIGNED_UP');
      expect(result.signedUpAt).toBe('2026-10-13T10:00:00.000Z');
      expect(result.installLoginVerifiedAt).toBeNull();
    });

    it('treats a verified install+login as passing SIGNED_UP (single trusted event)', () => {
      const result = projectMilestones({
        signedUpAt: null,
        installLoginVerifiedAt: at('2026-10-13T11:00:00.000Z'),
        chatUnlockedAt: null,
      });
      expect(result.currentMilestone).toBe('INSTALL_LOGIN_VERIFIED');
    });

    it('reports CHAT_UNLOCKED only when the entitlement timestamp is present', () => {
      const result = projectMilestones({
        signedUpAt: at('2026-10-13T10:00:00.000Z'),
        installLoginVerifiedAt: at('2026-10-13T11:00:00.000Z'),
        chatUnlockedAt: at('2026-10-13T11:00:00.000Z'),
      });
      expect(result.currentMilestone).toBe('CHAT_UNLOCKED');
      expect(result.chatUnlockedAt).toBe('2026-10-13T11:00:00.000Z');
    });
  });

  describe('entitlementFrom', () => {
    it('treats a missing row as LOCKED', () => {
      expect(entitlementFrom(null)).toBe('LOCKED');
      expect(entitlementFrom(undefined)).toBe('LOCKED');
    });

    it('reports the stored state', () => {
      expect(entitlementFrom({ accessState: ChatAccessState.LOCKED })).toBe('LOCKED');
      expect(entitlementFrom({ accessState: ChatAccessState.UNLOCKED })).toBe('UNLOCKED');
    });
  });

  describe('earliestEventAt', () => {
    it('returns null when the event type never happened', () => {
      expect(earliestEventAt([{ eventType: 'INSTALL_LOGIN', occurredAt: at('2026-10-13T11:00:00.000Z') }], 'SIGNUP')).toBeNull();
    });

    it('picks the earliest matching event regardless of array order', () => {
      const earliest = earliestEventAt(
        [
          { eventType: 'SIGNUP', occurredAt: at('2026-10-13T12:00:00.000Z') },
          { eventType: 'INSTALL_LOGIN', occurredAt: at('2026-10-13T11:30:00.000Z') },
          { eventType: 'SIGNUP', occurredAt: at('2026-10-13T11:00:00.000Z') },
        ],
        'SIGNUP',
      );
      expect(earliest?.toISOString()).toBe('2026-10-13T11:00:00.000Z');
    });
  });

  describe('toIso', () => {
    it('serializes dates and passes null through', () => {
      expect(toIso(at('2026-10-13T10:00:00.000Z'))).toBe('2026-10-13T10:00:00.000Z');
      expect(toIso(null)).toBeNull();
      expect(toIso(undefined)).toBeNull();
    });
  });
});
