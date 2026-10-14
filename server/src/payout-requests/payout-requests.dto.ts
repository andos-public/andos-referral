import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutMethodType, PayoutRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';

const PAISE = /^\d{1,15}$/;
export const PAYOUT_STATUSES = [
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
] as const;

export class CreatePayoutRequestDto {
  @ApiProperty({ format: 'uuid', description: 'One of my active payout methods.' })
  @IsUUID()
  payoutMethodId!: string;

  @ApiProperty({
    example: '3000',
    description:
      'Amount in paise as a decimal string. Must be positive and at most the AVAILABLE balance — there is no configured minimum or maximum.',
  })
  @Matches(PAISE, { message: 'amountMinorUnits must be digits only (minor units, e.g. "3000")' })
  amountMinorUnits!: string;

  @ApiProperty({
    example: 'wd-2026-10-14-0001',
    description: 'Client-generated idempotency key. Retrying with the same key returns the original request.',
  })
  @IsString()
  @Length(3, 128)
  idempotencyKey!: string;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}

export class RejectPayoutRequestDto {
  @ApiProperty({ example: 'UTR could not be verified', description: 'Reason shown to the owner (min 3 chars).' })
  @IsString()
  @Length(3, 500)
  reason!: string;
}

export class CompletePayoutRequestDto {
  @ApiProperty({
    example: 'UTR-20261014-99887766',
    description: 'Bank UTR / payment reference captured from the actual payout. Required to COMPLETE.',
  })
  @IsString()
  @Matches(/^[A-Za-z0-9][A-Za-z0-9-]{5,127}$/, {
    message: 'paymentUtr must be 6-128 chars of letters, digits or dashes',
  })
  paymentUtr!: string;
}

export class ListPayoutRequestsQueryDto {
  @ApiPropertyOptional({ enum: PAYOUT_STATUSES })
  @IsOptional()
  @IsIn(PAYOUT_STATUSES)
  status?: PayoutRequestStatus;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class AdminListPayoutRequestsQueryDto extends ListPayoutRequestsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Only requests from this user.' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class PayoutMethodSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: PayoutMethodType })
  methodType!: PayoutMethodType;

  @ApiProperty({ example: 'UPI ••••4321' })
  maskedLabel!: string;
}

export class PayoutRequestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: PAYOUT_STATUSES })
  status!: PayoutRequestStatus;

  @ApiProperty({ example: '3000', description: 'Paise, decimal string.' })
  amountMinorUnits!: string;

  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ type: PayoutMethodSummaryDto })
  payoutMethod!: PayoutMethodSummaryDto;

  @ApiProperty({ example: 'wd-2026-10-14-0001' })
  idempotencyKey!: string;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  requestedAt!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  reviewedAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  completedAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  rejectionReason!: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Payment reference captured at COMPLETED.',
  })
  paymentUtr!: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this action moved money in the ledger (false when the request was already in that state).',
  })
  ledgerPosted?: boolean;
}

export class PayoutRequestListDto {
  @ApiProperty({ type: [PayoutRequestResponseDto] })
  data!: PayoutRequestResponseDto[];

  @ApiProperty({ example: 2 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}

export class AdminPayoutRequestResponseDto extends PayoutRequestResponseDto {
  @ApiProperty({ example: { id: 'uuid', username: 'andos_user' } })
  user!: { id: string; username: string | null };

  @ApiPropertyOptional({ format: 'uuid', type: String, nullable: true })
  reviewedByUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', type: String, nullable: true })
  completedByUserId!: string | null;
}

export class AdminPayoutRequestListDto {
  @ApiProperty({ type: [AdminPayoutRequestResponseDto] })
  data!: AdminPayoutRequestResponseDto[];

  @ApiProperty({ example: 2 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}
