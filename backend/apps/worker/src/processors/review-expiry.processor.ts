import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { prisma } from '@perokio/db';

const logger = new Logger('ReviewExpiryProcessor');

/**
 * ReviewExpiryProcessor — runs when a video's 12h review deadline passes.
 *
 * If the brand hasn't reviewed by the deadline:
 *   - If brand.autoApproveOnReviewExpiry = true → auto-approve
 *   - Otherwise → hold (video stays in locked_pending, flagged for manual review)
 *
 * Race-condition-safe: conditional SQL UPDATE WHERE stage='locked_pending'.
 */
export function startReviewExpiryWorker(connection: any) {
  const worker = new Worker(
    'review-expiry',
    async (job: Job<{ videoId: string }>) => {
      const { videoId } = job.data;
      logger.log(`⏰ Review expiry fired for video ${videoId}`);

      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          claim: { include: { fact: { include: { brand: true } } } },
        },
      });

      if (!video) {
        logger.warn(`Video ${videoId} not found — skipping`);
        return { videoId, skipped: true };
      }

      if (video.stage !== 'locked_pending') {
        logger.log(`✓ Video ${videoId} already reviewed (stage=${video.stage}). No-op.`);
        return { videoId, autoApproved: false, reason: 'already_reviewed' };
      }

      const autoApprove = video.claim.fact.brand.autoApproveOnReviewExpiry;

      if (autoApprove) {
        const result: { id: string }[] = await prisma.$queryRaw`
          UPDATE "Video"
          SET stage = 'approved_queued', "updatedAt" = NOW()
          WHERE id = ${videoId}
            AND stage = 'locked_pending'
          RETURNING id
        `;

        if (result.length > 0) {
          logger.log(`✓ Video ${videoId} auto-approved (brand setting)`);
          return { videoId, autoApproved: true };
        } else {
          logger.log(`✓ Video ${videoId} already moved before auto-approve. No-op.`);
          return { videoId, autoApproved: false, reason: 'race_lost' };
        }
      } else {
        logger.log(`⏸ Video ${videoId} held for manual review`);
        return { videoId, autoApproved: false, reason: 'held_for_review' };
      }
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
