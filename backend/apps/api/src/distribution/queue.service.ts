import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const SETTLE_VIDEO_QUEUE = 'settle-video';
const LOCK_EXPIRY_QUEUE = 'lock-expiry';
const REVIEW_EXPIRY_QUEUE = 'review-expiry';

let connection: Redis | null = null;

function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

/**
 * QueueService — shared queue producer for delayed jobs.
 * Used by:
 *   - ClaimsService (lock-expiry, review-expiry)
 *   - DistributionService (settle-video, 24h)
 */
@Injectable()
export class QueueService implements OnModuleInit {
  private lockExpiryQueue: Queue;
  private reviewExpiryQueue: Queue;
  private settleVideoQueue: Queue;

  onModuleInit() {
    this.lockExpiryQueue = new Queue(LOCK_EXPIRY_QUEUE, { connection: getConnection() });
    this.reviewExpiryQueue = new Queue(REVIEW_EXPIRY_QUEUE, { connection: getConnection() });
    this.settleVideoQueue = new Queue(SETTLE_VIDEO_QUEUE, { connection: getConnection() });
  }

  async scheduleLockExpiry(claimId: string, deadline: Date) {
    const delay = Math.max(0, deadline.getTime() - Date.now());
    await this.lockExpiryQueue.add('lock-expiry', { claimId }, { delay, removeOnComplete: true, removeOnFail: 1000 });
  }

  async scheduleReviewExpiry(videoId: string, deadline: Date) {
    const delay = Math.max(0, deadline.getTime() - Date.now());
    await this.reviewExpiryQueue.add('review-expiry', { videoId }, { delay, removeOnComplete: true, removeOnFail: 1000 });
  }

  /**
   * §0 lock 5: Schedule the 24h settlement timer.
   * When this fires, the worker checks the latest ViewSnapshot and settles
   * the video if isAnomalous = false.
   */
  async scheduleSettlement(videoId: string, settleAt: Date) {
    const delay = Math.max(0, settleAt.getTime() - Date.now());
    await this.settleVideoQueue.add('settle-video', { videoId }, { delay, removeOnComplete: true, removeOnFail: 1000 });
    console.log(`[Queue] Scheduled settlement for video ${videoId} in ${Math.round(delay / 1000)}s`);
  }
}
