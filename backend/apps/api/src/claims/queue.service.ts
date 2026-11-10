import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const LOCK_EXPIRY_QUEUE = 'lock-expiry';
const REVIEW_EXPIRY_QUEUE = 'review-expiry';

let connection: Redis | null = null;

function getConnection(): Redis {
  if (!connection) {
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null, // BullMQ requires this
    });
  }
  return connection;
}

/**
 * QueueService — shared between apps/api (producer) and apps/worker (consumer).
 * Uses BullMQ delayed jobs for timer-based state transitions.
 */
@Injectable()
export class QueueService implements OnModuleInit {
  private lockExpiryQueue: Queue;
  private reviewExpiryQueue: Queue;

  onModuleInit() {
    this.lockExpiryQueue = new Queue(LOCK_EXPIRY_QUEUE, { connection: getConnection() });
    this.reviewExpiryQueue = new Queue(REVIEW_EXPIRY_QUEUE, { connection: getConnection() });
  }

  /** Schedule the 24h lock deadline — auto-expires the claim if creator doesn't lock in time */
  async scheduleLockExpiry(claimId: string, deadline: Date) {
    const delay = Math.max(0, deadline.getTime() - Date.now());
    await this.lockExpiryQueue.add(
      'lock-expiry',
      { claimId },
      { delay, removeOnComplete: true, removeOnFail: 1000 },
    );
    console.log(`[Queue] Scheduled lock expiry for claim ${claimId} in ${Math.round(delay / 1000)}s`);
  }

  /** Schedule the 12h review deadline — auto-approves or holds the video */
  async scheduleReviewExpiry(videoId: string, deadline: Date) {
    const delay = Math.max(0, deadline.getTime() - Date.now());
    await this.reviewExpiryQueue.add(
      'review-expiry',
      { videoId },
      { delay, removeOnComplete: true, removeOnFail: 1000 },
    );
    console.log(`[Queue] Scheduled review expiry for video ${videoId} in ${Math.round(delay / 1000)}s`);
  }
}
