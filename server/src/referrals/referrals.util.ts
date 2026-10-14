import { ChatAccessState } from '@prisma/client';

/**
 * Referral milestone progression — a read-only projection derived from stored rows
 * (attribution → referral events → chat entitlement). Nothing here is trusted from clients.
 */
export const REFERRAL_MILESTONES = [
  'ATTRIBUTED',
  'SIGNED_UP',
  'INSTALL_LOGIN_VERIFIED',
  'CHAT_UNLOCKED',
] as const;

export type ReferralMilestone = (typeof REFERRAL_MILESTONES)[number];
export type ChatEntitlementState = 'LOCKED' | 'UNLOCKED';
export type ReferralViewerRole = 'REFERRER' | 'REFERRED';

export interface MilestoneTimestamps {
  signedUpAt: Date | null;
  installLoginVerifiedAt: Date | null;
  chatUnlockedAt: Date | null;
}

export interface MilestoneProjection {
  signedUpAt: string | null;
  installLoginVerifiedAt: string | null;
  chatUnlockedAt: string | null;
  currentMilestone: ReferralMilestone;
}

export function projectMilestones(input: MilestoneTimestamps): MilestoneProjection {
  let currentMilestone: ReferralMilestone = 'ATTRIBUTED';
  if (input.signedUpAt) {
    currentMilestone = 'SIGNED_UP';
  }
  if (input.installLoginVerifiedAt) {
    currentMilestone = 'INSTALL_LOGIN_VERIFIED';
  }
  if (input.chatUnlockedAt) {
    currentMilestone = 'CHAT_UNLOCKED';
  }
  return {
    signedUpAt: toIso(input.signedUpAt),
    installLoginVerifiedAt: toIso(input.installLoginVerifiedAt),
    chatUnlockedAt: toIso(input.chatUnlockedAt),
    currentMilestone,
  };
}

/** Missing row = LOCKED: the entitlement only ever unlocks through a verified INSTALL_LOGIN. */
export function entitlementFrom(
  access: { accessState: ChatAccessState } | null | undefined,
): ChatEntitlementState {
  return access?.accessState === ChatAccessState.UNLOCKED ? 'UNLOCKED' : 'LOCKED';
}

/** Earliest occurrence of a given event type (used for the SIGNUP milestone). */
export function earliestEventAt(
  events: readonly { eventType: string; occurredAt: Date }[],
  eventType: string,
): Date | null {
  let earliest: Date | null = null;
  for (const event of events) {
    if (event.eventType === eventType && (earliest === null || event.occurredAt < earliest)) {
      earliest = event.occurredAt;
    }
  }
  return earliest;
}

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}
