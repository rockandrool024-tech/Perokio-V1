import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { prisma } from '@perokio/db';

// ============================================================================
// LedgerService — the core double-entry accounting engine
// ============================================================================
// §0 lock 4: Double-Entry Strictness.
//   - Every postEntry() creates paired LedgerEntry rows (debit + credit)
//   - Sum of debits === Sum of credits for every transaction
//   - Enforced inside a Prisma transaction
//   - idempotencyKey on LedgerEntry prevents duplicate entries
// ============================================================================

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  // ============================================================================
  // getOrCreateAccount — find or create a LedgerAccount
  // ============================================================================

  async getOrCreateAccount(ownerId: string, type: string, currency: string) {
    // Try to find first
    const existing = await prisma.ledgerAccount.findUnique({
      where: {
        ownerId_type_currency: { ownerId, type, currency },
      },
    });
    if (existing) return existing;

    // Determine brand/creator FK
    const brand = await prisma.brand.findUnique({ where: { id: ownerId } });
    const creator = await prisma.creator.findUnique({ where: { id: ownerId } });

    return prisma.ledgerAccount.create({
      data: {
        ownerId,
        type,
        currency,
        brandId: brand?.id || null,
        creatorId: creator?.id || null,
      },
    });
  }

  // ============================================================================
  // postEntry — the generic double-entry method
  // Creates paired debit + credit LedgerEntry rows inside a transaction
  // ============================================================================

  async postEntry(
    debitAccountId: string,
    creditAccountId: string,
    amountCents: number,
    refType: string,
    refId: string,
  ): Promise<{ debitEntryId: string; creditEntryId: string; amountCents: number }> {
    if (amountCents <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    if (debitAccountId === creditAccountId) {
      throw new BadRequestException('Debit and credit accounts must differ');
    }

    // §0 lock 4: idempotencyKey = refType:refId (unique per logical transaction)
    // If this ref has already been posted, the unique constraint will reject the duplicate
    const idempotencyKey = `${refType}:${refId}`;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create the debit entry (amount debited FROM this account)
        const debitEntry = await tx.ledgerEntry.create({
          data: {
            accountId: debitAccountId,
            debit: amountCents,
            credit: 0,
            refType,
            refId,
            idempotencyKey: `${idempotencyKey}:debit`,
          },
        });

        // Create the credit entry (amount credited TO this account)
        const creditEntry = await tx.ledgerEntry.create({
          data: {
            accountId: creditAccountId,
            debit: 0,
            credit: amountCents,
            refType,
            refId,
            idempotencyKey: `${idempotencyKey}:credit`,
          },
        });

        return { debitEntry, creditEntry };
      });

      this.logger.log(
        `✓ Posted entry: ${refType}:${refId} — debit ${amountCents}c from ${debitAccountId}, credit ${amountCents}c to ${creditAccountId}`,
      );

      return {
        debitEntryId: result.debitEntry.id,
        creditEntryId: result.creditEntry.id,
        amountCents,
      };
    } catch (e: any) {
      // Check if this was a unique constraint violation (duplicate idempotencyKey)
      if (e.code === 'P2002') {
        throw new BadRequestException({
          error: 'IDEMPOTENT_REJECT',
          message: `An entry with refType '${refType}' and refId '${refId}' already exists. Duplicate rejected.`,
          idempotencyKey,
        });
      }
      throw e;
    }
  }

  // ============================================================================
  // getBalance — sum debits - sum credits for an account
  // For asset accounts (escrow, pending): balance = debits - credits
  // ============================================================================

  async getBalance(accountId: string): Promise<number> {
    const entries = await prisma.ledgerEntry.aggregate({
      where: { accountId },
      _sum: { debit: true, credit: true },
    });
    return (entries._sum.debit || 0) - (entries._sum.credit || 0);
  }

  // ============================================================================
  // stripeTopUp — POST /webhooks/stripe handler
  // §0 lock 4: Top-up = Debit brand_escrow (asset increases), Credit stripe_pending (clearing account decreases)
  // For brand_escrow (asset, debit-normal): balance = debits - credits
  // ============================================================================

  async stripeTopUp(brandId: string, amountCents: number, stripeIntentId: string) {
    const brand = await prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);

    const stripeAccount = await this.getOrCreateAccount('platform', 'stripe_pending', 'USD');
    const escrowAccount = await this.getOrCreateAccount(brandId, 'brand_escrow', 'USD');

    // §0 lock 4: Top-up = Debit brand_escrow (asset up), Credit stripe_pending (clearing down)
    return this.postEntry(
      escrowAccount.id,   // debit → escrow goes UP
      stripeAccount.id,   // credit → stripe_pending goes DOWN
      amountCents,
      'stripe_topup',
      stripeIntentId,
    );
  }

  // ============================================================================
  // settleFunds — called by the settlement worker
  // Debit creator_pending (asset up — creator is owed more), Credit brand_escrow (asset down — brand paid out)
  // ============================================================================

  async settleFunds(videoId: string, amountCents: number) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        claim: { include: { fact: true, creator: true } },
      },
    });

    if (!video) throw new NotFoundException(`Video ${videoId} not found`);

    const brandId = video.claim.fact.brandId;
    const creatorId = video.claim.creatorId;

    const escrowAccount = await this.getOrCreateAccount(brandId, 'brand_escrow', 'USD');
    const pendingAccount = await this.getOrCreateAccount(creatorId, 'creator_pending', 'USD');

    // Debit creator_pending (creator is owed more), Credit brand_escrow (brand paid out)
    return this.postEntry(
      pendingAccount.id,  // debit → creator_pending goes UP
      escrowAccount.id,   // credit → brand_escrow goes DOWN
      amountCents,
      'video_settlement',
      videoId,
    );
  }

  // ============================================================================
  // approvePayout — finance admin approves a creator payout
  // Debit creator_withdrawable (asset up — money is now withdrawable), Credit creator_pending (asset down — moved out of pending)
  // ============================================================================

  async approvePayout(creatorId: string, amountCents: number, approvedBy: string) {
    // §D.5: Payout eligibility — must be ≥ $10.00 (1000 cents)
    if (amountCents < 1000) {
      throw new BadRequestException(
        `Payout amount ${amountCents}c is below the $10.00 minimum threshold`,
      );
    }

    const pendingAccount = await this.getOrCreateAccount(creatorId, 'creator_pending', 'USD');
    const withdrawableAccount = await this.getOrCreateAccount(creatorId, 'creator_withdrawable', 'USD');

    // Verify the creator has enough pending balance
    const pendingBalance = await this.getBalance(pendingAccount.id);
    if (pendingBalance < amountCents) {
      throw new BadRequestException({
        error: 'INSUFFICIENT_BALANCE',
        message: `Creator ${creatorId} has ${pendingBalance}c pending but requested ${amountCents}c`,
        pendingBalance,
        requested: amountCents,
      });
    }

    // Create the Payout record
    const payout = await prisma.payout.create({
      data: {
        creatorId,
        amountCents,
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        externalRef: `flouci_${Date.now()}`, // Mock Flouci reference
      },
    });

    // Post the ledger entry: Debit withdrawable (up), Credit pending (down)
    const entry = await this.postEntry(
      withdrawableAccount.id,  // debit → withdrawable goes UP
      pendingAccount.id,       // credit → pending goes DOWN
      amountCents,
      'manual_payout',
      payout.id,
    );

    // Update payout to 'paid'
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: 'paid' },
    });

    return {
      payoutId: payout.id,
      creatorId,
      amountCents,
      externalRef: payout.externalRef,
      ledgerEntry: entry,
      status: 'paid',
    };
  }

  // ============================================================================
  // listEligiblePayouts — GET /finance/payouts
  // ============================================================================

  async listEligiblePayouts() {
    // Find all creator_pending accounts with a balance ≥ 1000 cents ($10)
    const accounts = await prisma.ledgerAccount.findMany({
      where: { type: 'creator_pending' },
      include: {
        creator: { include: { user: { select: { email: true } } } },
      },
    });

    const eligible: any[] = [];
    for (const account of accounts) {
      const balance = await this.getBalance(account.id);
      if (balance >= 1000) {
        eligible.push({
          creatorId: account.creatorId,
          creatorEmail: account.creator?.user.email,
          accountId: account.id,
          pendingBalanceCents: balance,
          pendingBalanceUsd: (balance / 100).toFixed(2),
          eligibleAmountCents: balance,
        });
      }
    }

    return {
      eligiblePayouts: eligible,
      count: eligible.length,
    };
  }

  // ============================================================================
  // getAccountBalances — utility for the pipeline dashboard
  // ============================================================================

  async getAccountBalances(ownerId: string) {
    const accounts = await prisma.ledgerAccount.findMany({ where: { ownerId } });
    const balances: any = {};
    for (const acc of accounts) {
      balances[acc.type] = await this.getBalance(acc.id);
    }
    return balances;
  }
}
