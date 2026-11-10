import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { prisma } from '@perokio/db';
import { PostizService } from './postiz.service';
import { QueueService } from './queue.service';

const SETTLEMENT_WINDOW_HOURS = 24;

@Injectable()
export class DistributionService {
  private readonly logger = new Logger(DistributionService.name);

  constructor(
    private postiz: PostizService,
    private queue: QueueService,
  ) {}

  // ============================================================================
  // POST /distribution/publish/:videoId
  // ============================================================================

  async publishVideo(videoId: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { claim: { include: { fact: true } } },
    });

    if (!video) throw new NotFoundException(`Video ${videoId} not found`);

    // §0 lock: Video must be in 'approved_queued' stage
    if (video.stage !== 'approved_queued') {
      throw new BadRequestException(
        `Video is in stage '${video.stage}' — can only publish from 'approved_queued'`,
      );
    }

    // 1. Create a PublishJob
    const publishJob = await prisma.publishJob.create({
      data: {
        videoId,
        platform: video.platform,
        status: 'scheduled',
        scheduledAt: new Date(),
      },
    });

    // 2. Call Postiz (mock — waits 1s, returns externalId)
    const result = await this.postiz.publish(videoId, video.platform);

    // 3. Update the PublishJob with the external ID
    await prisma.publishJob.update({
      where: { id: publishJob.id },
      data: {
        status: 'published',
        externalId: result.externalId,
        publishedAt: result.publishedAt,
      },
    });

    // 4. Update Video stage to 'published'
    await prisma.video.update({
      where: { id: videoId },
      data: {
        stage: 'published',
        publishedAt: result.publishedAt,
      },
    });

    // 5. Schedule the 24h settlement timer
    const settleAt = new Date(Date.now() + SETTLEMENT_WINDOW_HOURS * 60 * 60 * 1000);
    await this.queue.scheduleSettlement(videoId, settleAt);

    this.logger.log(`✓ Video ${videoId} published (externalId: ${result.externalId}), settlement scheduled for ${settleAt.toISOString()}`);

    return {
      published: true,
      videoId,
      externalId: result.externalId,
      platform: result.platform,
      url: result.url,
      publishedAt: result.publishedAt,
      settlementScheduledAt: settleAt,
      publishJobId: publishJob.id,
    };
  }

  // ============================================================================
  // POST /analytics/ingest/:videoId — mock platform analytics ingestion
  // ============================================================================

  async ingestAnalytics(videoId: string, views: number, clicks: number, source: string = 'tiktok_api') {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { claim: { include: { fact: true } } },
    });

    if (!video) throw new NotFoundException(`Video ${videoId} not found`);

    // Find the previous snapshot for anomaly detection
    const previousSnapshot = await prisma.viewSnapshot.findFirst({
      where: { videoId },
      orderBy: { takenAt: 'desc' },
    });

    // §0 lock 2: Anomaly detection — >200% view growth vs. previous snapshot
    let isAnomalous = false;
    const anomalyFlags: string[] = [];

    if (previousSnapshot && previousSnapshot.views > 0) {
      const growthRate = (views - previousSnapshot.views) / previousSnapshot.views;
      // >200% growth = anomaly
      if (growthRate > 2.0) {
        isAnomalous = true;
        anomalyFlags.push('velocity_spike');
      }
    }

    // Create the ViewSnapshot
    const snapshot = await prisma.viewSnapshot.create({
      data: {
        videoId,
        views,
        clicks,
        source,
        isAnomalous,
        anomalyFlags,
      },
    });

    this.logger.log(
      `📊 Ingested analytics for video ${videoId}: ${views} views, ${clicks} clicks${isAnomalous ? ' [ANOMALOUS: ' + anomalyFlags.join(', ') + ']' : ''}`,
    );

    return {
      snapshotId: snapshot.id,
      videoId,
      views,
      clicks,
      isAnomalous,
      anomalyFlags,
      previousViews: previousSnapshot?.views || 0,
      growthRate: previousSnapshot && previousSnapshot.views > 0
        ? ((views - previousSnapshot.views) / previousSnapshot.views * 100).toFixed(1) + '%'
        : 'N/A (first snapshot)',
    };
  }

  // ============================================================================
  // settleVideo — called by the BullMQ worker when the 24h timer fires
  // This is the settlement logic that moves money from brand_escrow → creator_pending
  // ============================================================================

  async settleVideo(videoId: string): Promise<{ settled: boolean; reason?: string; amountCents?: number }> {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        claim: { include: { fact: true, creator: true } },
        viewSnapshots: { orderBy: { takenAt: 'desc' }, take: 1 },
      },
    });

    if (!video) {
      this.logger.warn(`Settlement: Video ${videoId} not found`);
      return { settled: false, reason: 'video_not_found' };
    }

    // §0 lock 5: Video must still be in 'published' stage (not already settled)
    if (video.stage !== 'published') {
      this.logger.log(`Settlement: Video ${videoId} already moved (stage: ${video.stage}). No-op.`);
      return { settled: false, reason: `already_${video.stage}` };
    }

    // §D.6: No ViewSnapshot at 24h = No Settle (golden rule)
    const latestSnapshot = video.viewSnapshots[0];
    if (!latestSnapshot) {
      this.logger.warn(`Settlement: Video ${videoId} has NO ViewSnapshot — refusing to settle`);
      return { settled: false, reason: 'no_view_snapshot' };
    }

    // §0 lock 2: Anomaly hold — refuse to settle if isAnomalous = true
    if (latestSnapshot.isAnomalous) {
      this.logger.warn(
        `Settlement: Video ${videoId} has anomalous snapshot (flags: ${latestSnapshot.anomalyFlags.join(', ')}) — refusing to settle. Admin must intervene.`,
      );
      return {
        settled: false,
        reason: 'anomaly_hold',
        amountCents: 0,
      };
    }

    // Calculate the payout
    // §D.2: CPM capped at MAX_CPM_PAYOUT = $30.00 (3000 cents)
    const CPM_RATE = 300; // $3.00 per 1000 views (in cents)
    const MAX_CPM_PAYOUT = 3000; // $30.00 (in cents)
    const VIEW_CAP = 10000;

    const effectiveViews = Math.min(latestSnapshot.views, VIEW_CAP);
    const cpmEarned = Math.min((effectiveViews / 1000) * CPM_RATE, MAX_CPM_PAYOUT);
    const baseFee = video.claim.fact.baseFee;
    const totalPayout = Math.round(baseFee + cpmEarned);

    this.logger.log(
      `Settlement: Video ${videoId} — baseFee=${baseFee}c + cpm=${cpmEarned}c (${effectiveViews} views × ${CPM_RATE}c/1k, capped at ${MAX_CPM_PAYOUT}c) = ${totalPayout}c`,
    );

    // §3: Call LedgerService.settleFunds(videoId, amount)
    // We import it dynamically to avoid circular dependencies
    const { LedgerService } = await import('../ledger/ledger.service');
    const ledger = new LedgerService();
    await ledger.settleFunds(videoId, totalPayout);

    // Update Video stage to 'settled'
    await prisma.video.update({
      where: { id: videoId },
      data: { stage: 'settled', settledAt: new Date() },
    });

    this.logger.log(`✓ Video ${videoId} settled for ${totalPayout} cents`);

    return {
      settled: true,
      amountCents: totalPayout,
    };
  }

  // ============================================================================
  // POST /admin/videos/:id/dismiss-anomaly — admin clears an anomaly flag
  // ============================================================================

  async dismissAnomaly(videoId: string, adminId: string) {
    const snapshot = await prisma.viewSnapshot.findFirst({
      where: { videoId, isAnomalous: true },
      orderBy: { takenAt: 'desc' },
    });

    if (!snapshot) {
      throw new NotFoundException(`No anomalous snapshot found for video ${videoId}`);
    }

    const updated = await prisma.viewSnapshot.update({
      where: { id: snapshot.id },
      data: {
        isAnomalous: false,
        anomalyFlags: [],
      },
    });

    return {
      dismissed: true,
      snapshotId: updated.id,
      videoId,
      dismissedBy: adminId,
    };
  }
}
