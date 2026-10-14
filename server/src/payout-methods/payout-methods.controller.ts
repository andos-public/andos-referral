import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserAuthGuard } from '../auth/user-auth.guard';
import {
  CreatePayoutMethodDto,
  PayoutMethodListDto,
  PayoutMethodResponseDto,
  UpdatePayoutMethodDto,
} from './payout-methods.dto';
import { PayoutMethodsService } from './payout-methods.service';

@ApiTags('payout-methods')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  description: 'Phase-1 trusted identity header (temporary; replaced by main-app auth exchange).',
})
@UseGuards(UserAuthGuard)
@Controller('payout-methods')
export class PayoutMethodsController {
  constructor(private readonly payoutMethods: PayoutMethodsService) {}

  @Post()
  @ApiOperation({
    summary: 'Register a payout method (vault reference + masked label only)',
    description: 'Raw bank/UPI details are never stored here — only an opaque vault reference and a pre-masked label.',
  })
  @ApiCreatedResponse({ type: PayoutMethodResponseDto })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePayoutMethodDto,
  ): Promise<PayoutMethodResponseDto> {
    return this.payoutMethods.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'My active payout methods' })
  @ApiOkResponse({ type: PayoutMethodListDto })
  list(@CurrentUser() user: { id: string }): Promise<PayoutMethodListDto> {
    return this.payoutMethods.listOwn(user.id);
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a payout method (masked label / active flag)' })
  @ApiOkResponse({ type: PayoutMethodResponseDto })
  update(
    @CurrentUser() user: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePayoutMethodDto,
  ): Promise<PayoutMethodResponseDto> {
    return this.payoutMethods.update(user.id, id, dto);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a payout method (idempotent)' })
  @ApiOkResponse({ type: PayoutMethodResponseDto })
  deactivate(
    @CurrentUser() user: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PayoutMethodResponseDto> {
    return this.payoutMethods.deactivate(user.id, id);
  }
}
