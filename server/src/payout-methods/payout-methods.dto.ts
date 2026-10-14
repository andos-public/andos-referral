import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutMethodType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';

/**
 * Payout details are never collected here. The app stores only an opaque vault reference and
 * a masked label (e.g. "UPI ••••4321"); raw bank/UPI identifiers stay in the payout vault and
 * are an open Phase-5 design item.
 */
export class CreatePayoutMethodDto {
  @ApiProperty({ enum: PayoutMethodType, example: 'UPI' })
  @IsEnum(PayoutMethodType)
  methodType!: PayoutMethodType;

  @ApiProperty({
    example: 'vault-ref-9f3k2…',
    description: 'Opaque reference issued by the payout vault/provider. Never raw account details.',
  })
  @IsString()
  @Length(4, 200)
  providerVaultRef!: string;

  @ApiProperty({ example: 'UPI ••••4321', description: 'Pre-masked label safe to show in any response.' })
  @IsString()
  @Length(2, 64)
  maskedLabel!: string;
}

export class UpdatePayoutMethodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'UPI ••••4321' })
  @IsOptional()
  @IsString()
  @Length(2, 64)
  maskedLabel?: string;
}

export class PayoutMethodResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: PayoutMethodType })
  methodType!: PayoutMethodType;

  @ApiProperty({ example: 'UPI ••••4321' })
  maskedLabel!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  updatedAt!: string;
}

export class PayoutMethodListDto {
  @ApiProperty({ type: [PayoutMethodResponseDto] })
  data!: PayoutMethodResponseDto[];
}
