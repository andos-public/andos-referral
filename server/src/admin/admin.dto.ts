import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBooleanString, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export const HOLD_STATUSES = ['DUE', 'HELD', 'RELEASED', 'REVERSED'] as const;
export type HoldStatus = (typeof HOLD_STATUSES)[number];

export class AdminOverviewDto {
  @ApiProperty({ example: '2026-10-15T09:00:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: 3600 })
  uptimeSeconds!: number;

  @ApiProperty({ example: { total: 42, active: 42, withExternalSubject: 40 } })
  users!: { total: number; active: number; withExternalSubject: number };

  @ApiProperty({ example: { total: 12, active: 10, expired: 1, inactive: 1 } })
  referralCodes!: { total: number; active: number; expired: number; inactive: number };

  @ApiProperty({ example: { total: 30, signedUp: 22, installLoginVerified: 20, chatUnlocked: 20 } })
  attributions!: { total: number; signedUp: number; installLoginVerified: number; chatUnlocked: number };

  @ApiProperty({ example: { clicks: 500, referrals: 30, conversions: 12 } })
  linkEvents!: { clicks: number; referrals: number; conversions: number };

  @ApiProperty({
    example: { completed: 25, refunded: 2, cancelled: 1, commissionableBasePaise: '500000', commissionPaise: '125000' },
  })
  orders!: {
    completed: number;
    refunded: number;
    cancelled: number;
    commissionableBasePaise: string;
    commissionPaise: string;
  };

  @ApiProperty({
    example: { accounts: 8, pendingPaise: '5000', availablePaise: '12000', reservedPaise: '0', withdrawnPaise: '9000' },
  })
  wallets!: {
    accounts: number;
    pendingPaise: string;
    availablePaise: string;
    reservedPaise: string;
    withdrawnPaise: string;
  };

  @ApiProperty({ example: { held: 3, heldPaise: '15000', dueNow: 0, released: 20, reversed: 2, nextEligibleAt: null } })
  holds!: {
    held: number;
    heldPaise: string;
    dueNow: number;
    released: number;
    reversed: number;
    nextEligibleAt: string | null;
  };

  @ApiProperty({
    example: { pendingApproval: 2, approved: 1, completed: 9, rejected: 1, cancelled: 0, completedPaise: '9000' },
  })
  payouts!: {
    pendingApproval: number;
    approved: number;
    completed: number;
    rejected: number;
    cancelled: number;
    completedPaise: string;
  };

  @ApiProperty({ example: { transactions: 120, entries: 190 } })
  ledger!: { transactions: number; entries: number };

  @ApiProperty({ example: { entries: 15, lastEntryAt: '2026-10-15T08:59:00.000Z' } })
  audit!: { entries: number; lastEntryAt: string | null };
}

export class AdminHoldRowDto {
  @ApiProperty({ format: 'uuid', description: 'Ledger transaction id of the COMMISSION_LOCKED posting.' })
  ledgerTransactionId!: string;

  @ApiProperty({ format: 'uuid' })
  orderEventId!: string;

  @ApiProperty({ example: 'andos-order-88213' })
  orderId!: string;

  @ApiProperty({ format: 'uuid' })
  attributionId!: string;

  @ApiProperty({ format: 'uuid' })
  referrerUserId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  referredUserId!: string | null;

  @ApiProperty({ example: '20000' })
  commissionBasePaise!: string;

  @ApiProperty({ example: 2500 })
  rateBps!: number;

  @ApiProperty({ example: '5000' })
  commissionPaise!: string;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  occurredAt!: string;

  @ApiProperty({ example: '2026-10-21T12:00:00.000Z' })
  eligibleAt!: string;

  @ApiProperty({ example: 604800, description: 'Seconds until release; 0 when already due.' })
  dueInSeconds!: number;

  @ApiProperty({ enum: HOLD_STATUSES })
  status!: HoldStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  releasedAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  reversedAt!: string | null;
}

export class AdminHoldListDto {
  @ApiProperty({ type: [AdminHoldRowDto] })
  data!: AdminHoldRowDto[];

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 25 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;

  @ApiProperty({ example: '2026-10-15T09:00:00.000Z', description: 'Server time the page was computed at.' })
  asOf!: string;
}

export class ListHoldsQueryDto {
  @ApiPropertyOptional({ enum: HOLD_STATUSES })
  @IsOptional()
  @IsIn(HOLD_STATUSES)
  status?: HoldStatus;

  @ApiPropertyOptional({ format: 'uuid', description: 'Only holds held for this referrer.' })
  @IsOptional()
  @IsUUID()
  referrerUserId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class ListAdminUsersQueryDto {
  @ApiPropertyOptional({ description: 'Case-insensitive match on username, display name or Firebase uid.' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  query?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'DELETED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'DELETED'])
  accountStatus?: string;

  @ApiPropertyOptional({ description: 'Only users with at least one referral code.' })
  @IsOptional()
  @IsBooleanString()
  hasReferralCode?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class AdminUserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  username!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Firebase uid (external subject).' })
  externalSubject!: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  accountStatus!: string;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: { referralCodes: 1, referredUsers: 4, referredBy: null } })
  referralSummary!: { referralCodes: number; referredUsers: number; referredBy: string | null };

  @ApiProperty({
    example: { pendingPaise: '0', availablePaise: '5000', reservedPaise: '0', withdrawnPaise: '0' },
  })
  wallet!: { pendingPaise: string; availablePaise: string; reservedPaise: string; withdrawnPaise: string };
}

export class AdminUserListDto {
  @ApiProperty({ type: [AdminUserSummaryDto] })
  data!: AdminUserSummaryDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 25 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}
