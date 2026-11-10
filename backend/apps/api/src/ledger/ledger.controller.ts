import {
  Controller, Post, Get, Body, Param, UseGuards, Req, Headers, BadRequestException,
} from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';
import { SKIP_AUDIT_KEY } from '../common/interceptors/audit.interceptor';
import { SetMetadata } from '@nestjs/common';

@Controller()
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  // ============================================================================
  // POST /webhooks/stripe — idempotent Stripe webhook handler
  // §0 lock 3: Idempotency is King. Duplicate webhooks are ignored.
  // ============================================================================

  @Post('webhooks/stripe')
  @SetMetadata(SKIP_AUDIT_KEY, true)
  async stripeWebhook(
    @Body() body: any,
    @Headers('stripe-event-id') eventId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // The IdempotencyMiddleware (registered globally) handles replay protection.
    // But we also enforce at the ledger level via idempotencyKey on LedgerEntry.
    // The Stripe event ID is used as the refId for the ledger entry.

    if (!body || body.type !== 'payment_intent.succeeded') {
      return { received: true, ignored: true, reason: 'not_payment_intent_succeeded' };
    }

    const intent = body.data?.object;
    if (!intent?.id) {
      throw new BadRequestException('Missing payment_intent ID');
    }

    const brandId = intent.metadata?.brandId;
    if (!brandId) {
      throw new BadRequestException('Missing brandId in payment intent metadata');
    }

    // Use the Stripe event ID as the idempotency key (if provided)
    // Otherwise fall back to the intent ID
    const idemKey = eventId || idempotencyKey || `stripe_${intent.id}`;
    const amountCents = intent.amount_received || intent.amount || 0;

    if (amountCents <= 0) {
      throw new BadRequestException(`Invalid amount: ${amountCents}`);
    }

    try {
      const entry = await this.ledgerService.stripeTopUp(brandId, amountCents, intent.id);
      return {
        received: true,
        processed: true,
        stripeIntentId: intent.id,
        brandId,
        amountCents,
        ledgerEntry: entry,
        idempotencyKey: idemKey,
      };
    } catch (e: any) {
      // If it's an IDEMPOTENT_REJECT, return 200 (we already processed this)
      if (e.response?.error === 'IDEMPOTENT_REJECT' || e.message?.includes('IDEMPOTENT_REJECT')) {
        return {
          received: true,
          processed: false,
          reason: 'duplicate',
          stripeIntentId: intent.id,
        };
      }
      throw e;
    }
  }

  // ============================================================================
  // GET /finance/payouts — list eligible creator payouts
  // ============================================================================

  @Get('finance/payouts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.finance, Role.super_admin)
  async listPayouts() {
    return this.ledgerService.listEligiblePayouts();
  }

  // ============================================================================
  // POST /finance/payouts/:creatorId/approve — approve a creator payout
  // ============================================================================

  @Post('finance/payouts/:creatorId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.finance, Role.super_admin)
  async approvePayout(
    @Param('creatorId') creatorId: string,
    @Body() body: { amountCents?: number },
    @Req() req: any,
  ) {
    // If no amount specified, payout the full eligible balance
    let amountCents = body.amountCents;

    if (!amountCents) {
      // Look up the full pending balance
      const pendingAccount = await this.ledgerService.getOrCreateAccount(creatorId, 'creator_pending', 'USD');
      amountCents = await this.ledgerService.getBalance(pendingAccount.id);
    }

    return this.ledgerService.approvePayout(creatorId, amountCents, req.user.id);
  }
}
