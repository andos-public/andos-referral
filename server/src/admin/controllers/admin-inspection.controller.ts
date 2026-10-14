import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import {
  AdminHoldListDto,
  AdminUserListDto,
  ListAdminUsersQueryDto,
  ListHoldsQueryDto,
} from '../admin.dto';
import { AdminInspectionService } from '../admin-inspection.service';

class LedgerPageQueryDto {
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

@ApiTags('admin')
@ApiHeader({ name: 'x-admin-key', required: true, description: 'Static admin API key (Phase-1 placeholder).' })
@UseGuards(AdminAuthGuard)
@Controller('admin')
export class AdminInspectionController {
  constructor(private readonly inspection: AdminInspectionService) {}

  @Get('users')
  @ApiOperation({ summary: 'Search users (username / display name / Firebase uid)' })
  @ApiOkResponse({ type: AdminUserListDto })
  listUsers(@Query() query: ListAdminUsersQueryDto): Promise<AdminUserListDto> {
    return this.inspection.listUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'User inspection bundle: codes, attributions, wallet, payout methods and requests' })
  userDetail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inspection.userDetail(id);
  }

  @Get('wallets/:userId')
  @ApiOperation({ summary: 'Wallet balances + ledger page for one user' })
  walletDetail(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query() query: LedgerPageQueryDto,
  ) {
    return this.inspection.walletDetail(userId, query.limit ?? 25, query.offset ?? 0);
  }

  @Get('referrals/:id')
  @ApiOperation({ summary: 'Referral/attribution inspection: milestones, chat gate, order events and ledger lines' })
  referralDetail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inspection.referralDetail(id);
  }

  @Get('holds')
  @ApiOperation({
    summary: 'Commission-hold queue with release status',
    description:
      'Every COMMISSION_LOCKED posting with its eligibility instant and state: DUE (window elapsed), HELD, RELEASED or REVERSED. Filter with `status`; page with limit/offset.',
  })
  @ApiOkResponse({ type: AdminHoldListDto })
  listHolds(@Query() query: ListHoldsQueryDto): Promise<AdminHoldListDto> {
    return this.inspection.listHolds(query);
  }
}
