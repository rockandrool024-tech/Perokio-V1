import {
  Controller, Post, Get, Body, Param, Headers, UseGuards, Req, SetMetadata,
} from '@nestjs/common';
import { ConversionService } from './conversion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';
import { SKIP_AUDIT_KEY } from '../common/interceptors/audit.interceptor';

// ============================================================================
// ConversionController — TastyIgniter webhooks + conversion stats
// ============================================================================

@Controller()
export class ConversionController {
  constructor(private conversionService: ConversionService) {}

  // === POST /webhooks/tastyigniter/cta — record a CTA click ===
  @Post('webhooks/tastyigniter/cta')
  @SetMetadata(SKIP_AUDIT_KEY, true)
  async recordCtaClick(
    @Body() body: any,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const ip = forwardedFor?.split(',')[0] || '0.0.0.0';
    return this.conversionService.recordCtaClick({
      videoId: body.videoId,
      shortLinkId: body.shortLinkId,
      brandId: body.brandId,
      creatorId: body.creatorId,
      ip,
      userAgent,
      ctaType: body.ctaType || 'order_now',
    });
  }

  // === POST /webhooks/tastyigniter/order — record an order ===
  @Post('webhooks/tastyigniter/order')
  @SetMetadata(SKIP_AUDIT_KEY, true)
  async recordOrder(
    @Body() body: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.conversionService.recordOrder({
      orderId: body.orderId,
      videoId: body.videoId,
      brandId: body.brandId,
      shortLinkId: body.shortLinkId,
      amountCents: body.amountCents,
      currency: body.currency,
      status: body.status,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      items: body.items,
    });
  }

  // === GET /conversion/stats/:brandId — stats for one brand ===
  @Get('conversion/stats/:brandId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.brand_owner, Role.brand_member, Role.ops, Role.finance, Role.super_admin)
  async getStats(@Param('brandId') brandId: string) {
    return this.conversionService.getStats(brandId);
  }

  // === GET /conversion/stats — stats for all brands (admin) ===
  @Get('conversion/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ops, Role.finance, Role.super_admin)
  async getAllStats() {
    return this.conversionService.getAllStats();
  }
}
