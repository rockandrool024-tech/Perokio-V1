import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { startLockExpiryWorker } from './processors/lock-expiry.processor';
import { startReviewExpiryWorker } from './processors/review-expiry.processor';
import { startSettleVideoWorker } from './processors/settle-video.processor';
import Redis from 'ioredis';

@Module({})
export class WorkerModule implements OnModuleInit, OnModuleDestroy {
  private connection: Redis;
  private workers: any[] = [];

  async onModuleInit() {
    this.connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    this.workers.push(startLockExpiryWorker(this.connection));
    this.workers.push(startReviewExpiryWorker(this.connection));
    this.workers.push(startSettleVideoWorker(this.connection));

    console.log('🦜 Perokio Worker started — consuming lock-expiry, review-expiry, and settle-video queues');
  }

  async onModuleDestroy() {
    for (const w of this.workers) {
      await w.close();
    }
    await this.connection?.quit();
  }
}
