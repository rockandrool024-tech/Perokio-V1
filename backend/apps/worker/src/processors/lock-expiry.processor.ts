import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { prisma } from '@perokio/db';

const logger = new Logger('LockExpiryProcessor');

/**
 * LockExpiryProcessor — runs when a claim's 24h lock deadline passes.
 *
 * Race-condition-safe: uses conditional SQL UPDATE.
 * If the creator locked the video before the timer fired, status is no longer
 * 'claimed' — the UPDATE matches 0 rows and we do nothing.
 */
export function startLockExpiryWorker(connection: any) {
  const worker = new Worker(
    'lock-expiry',
    async (job: Job<{ claimId: string }>) => {
      const { claimId } = job.data;
      logger.log(`⏰ Lock expiry fired for claim ${claimId}`);

      // Conditional SQL: only expire if status is still 'claimed'
      const result: { id: string }[] = await prisma.$queryRaw`
        UPDATE "Claim"
        SET status = 'expired', "updatedAt" = NOW()
        WHERE id = ${claimId}
          AND status = 'claimed'
        RETURNING id
      `;

      if (result.length > 0) {
        logger.log(`✓ Claim ${claimId} expired (creator missed the 24h deadline)`);
        // Also mark the video as rejected
        await prisma.video.updateMany({
          where: { claimId, stage: 'editing' },
          data: { stage: 'publish_failed' },
        });
        return { claimId, expired: true };
      } else {
        logger.log(`✓ Claim ${claimId} already moved (creator locked in time). No-op.`);
        return { claimId, expired: false, reason: 'already_moved' };
      }
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
