import {
  Injectable, BadRequestException, NotFoundException, ConflictException,
} from '@nestjs/common';
import { prisma } from '@perokio/db';
import { QueueService } from './queue.service';

@Injectable()
export class ClaimsService {
  constructor(private queue: QueueService) {}

  // ============================================================================
  // POST /facts/:id/claim
  // ============================================================================

  async claimFact(factId: string, creatorId: string) {
    // 1. Check maxClaims (transaction lock to prevent over-claiming)
    const fact = await prisma.fact.findUnique({ where: { id: factId } });
    if (!fact) throw new NotFoundException(`Fact ${factId} not found`);

    if (fact.status !== 'live' && fact.status !== 'funded') {
      throw new BadRequestException(
        `Fact is in status '${fact.status}' — only 'live' or 'funded' facts can be claimed`,
      );
    }

    // Count existing active claims (not expired/rejected)
    const activeClaims = await prisma.claim.count({
      where: {
        factId,
        status: { in: ['claimed', 'in_edit', 'locked', 'approved', 'changes_requested'] },
      },
    });

    if (activeClaims >= fact.maxClaims) {
      throw new ConflictException(
        `Fact is fully claimed (${activeClaims}/${fact.maxClaims})`,
      );
    }

    // Check if this creator already claimed
    const existing = await prisma.claim.findFirst({
      where: { factId, creatorId },
    });
    if (existing) {
      throw new ConflictException('Creator already claimed this fact');
    }

    // 2. Create the claim
    const lockDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h
    const claim = await prisma.claim.create({
      data: {
        factId,
        creatorId,
        status: 'claimed',
        lockDeadline,
      },
    });

    // 3. Create a Video record (stage: editing)
    const video = await prisma.video.create({
      data: {
        claimId: claim.id,
        stage: 'editing',
      },
    });

    // 4. Push BullMQ delayed job for lock_deadline (auto-expire after 24h)
    await this.queue.scheduleLockExpiry(claim.id, lockDeadline);

    return { claim, video, lockDeadline };
  }

  // ============================================================================
  // POST /videos/:id/lock
  // ============================================================================

  async lockVideo(videoId: string, creatorId: string, r2Key: string, transcript?: string) {
    // 1. Find the video + its claim
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { claim: true },
    });

    if (!video) throw new NotFoundException(`Video ${videoId} not found`);

    // Verify ownership
    const claim = video.claim;
    if (claim.creatorId !== creatorId) {
      throw new BadRequestException('You do not own this video');
    }

    if (claim.status !== 'claimed' && claim.status !== 'in_edit') {
      throw new BadRequestException(
        `Claim is in status '${claim.status}' — can only lock from 'claimed' or 'in_edit'`,
      );
    }

    if (!r2Key) {
      throw new BadRequestException('Video MP4 must be uploaded (r2Key required)');
    }

    // 2. RACE CONDITION FIX: conditional SQL update
    //    UPDATE "Claim" SET status='locked' WHERE id=? AND status IN ('claimed','in_edit')
    //    If rowCount = 0, the timer (or another request) already moved it.
    const result: { id: string }[] = await prisma.$queryRaw`
      UPDATE "Claim"
      SET status = 'locked', "lockedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = ${claim.id}
        AND status IN ('claimed', 'in_edit')
      RETURNING id
    `;

    if (result.length === 0) {
      // The claim was already expired/locked by the timer or another request
      const current = await prisma.claim.findUnique({ where: { id: claim.id } });
      throw new ConflictException({
        error: 'CLAIM_ALREADY_MOVED',
        message: `Claim is now in status '${current?.status}'. Lock rejected.`,
        currentStatus: current?.status,
      });
    }

    // 3. Update the video: set r2Key, transcript, stage=locked_pending, reviewDeadline=+12h
    const reviewDeadline = new Date(Date.now() + 12 * 60 * 60 * 1000); // +12h
    await prisma.video.update({
      where: { id: videoId },
      data: {
        r2Key,
        transcript: transcript || null,
        stage: 'locked_pending',
        lockedAt: new Date(),
        reviewDeadline,
      },
    });

    // 4. Push BullMQ delayed job for review_deadline (auto-approve/hold after 12h)
    await this.queue.scheduleReviewExpiry(videoId, reviewDeadline);

    // 5. Run PolicyCheck: script_match (compare transcript to verified claim)
    //    For V1 we simulate this: if transcript contains "OFFSCRIPT" it fails
    if (transcript && transcript.toUpperCase().includes('OFFSCRIPT')) {
      await prisma.policyCheck.create({
        data: {
          videoId,
          checkType: 'script_match',
          result: 'fail',
          details: 'Transcript deviates from verified claim',
        },
      });
      await prisma.video.update({
        where: { id: videoId },
        data: { stage: 'held_factual_deviation' },
      });
      return {
        locked: false,
        videoId,
        stage: 'held_factual_deviation',
        reason: 'PolicyCheck failed: transcript deviates from verified claim',
      };
    }

    // PolicyCheck passed
    await prisma.policyCheck.create({
      data: {
        videoId,
        checkType: 'script_match',
        result: 'pass',
        details: 'Transcript matches verified claim',
      },
    });

    return {
      locked: true,
      videoId,
      claimId: claim.id,
      reviewDeadline,
    };
  }

  // ============================================================================
  // Auto-expire (called by BullMQ worker)
  // ============================================================================

  async expireClaim(claimId: string): Promise<boolean> {
    // Conditional SQL: only expire if still 'claimed'
    const result: { id: string }[] = await prisma.$queryRaw`
      UPDATE "Claim"
      SET status = 'expired', "updatedAt" = NOW()
      WHERE id = ${claimId}
        AND status = 'claimed'
      RETURNING id
    `;
    return result.length > 0;
  }

  async autoApproveReview(videoId: string): Promise<boolean> {
    // Conditional SQL: only auto-approve if still 'locked_pending'
    const result: { id: string }[] = await prisma.$queryRaw`
      UPDATE "Video"
      SET stage = 'approved_queued', "updatedAt" = NOW()
      WHERE id = ${videoId}
        AND stage = 'locked_pending'
      RETURNING id
    `;
    return result.length > 0;
  }
}
