import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { prisma } from '@perokio/db';

const logger = new Logger('SettleVideoProcessor');

/**
 * SettleVideoProcessor — runs when a video's 24h settlement timer fires.
 *
 * §0 lock 5: The 24-hour view window must close before settlement.
 *
 * Logic:
 *   1. Find the video + its latest ViewSnapshot
 *   2. If no snapshot exists → no-op (golden rule: no views = no settle)
 *   3. If snapshot.isAnomalous = true → no-op (admin must intervene)
 *   4. If clean → calculate payout + call LedgerService.settleFunds()
 *
 * The actual settlement call is made via HTTP to the API's
 * POST /distribution/videos/:videoId/settle endpoint (which calls
 * DistributionService.settleVideo()). This keeps the worker thin
 * and the API the single source of truth for business logic.
 */
export function startSettleVideoWorker(connection: any) {
  const worker = new Worker(
    'settle-video',
    async (job: Job<{ videoId: string }>) => {
      const { videoId } = job.data;
      logger.log(`⏰ Settlement timer fired for video ${videoId}`);

      // Check the video exists + is still in 'published' stage
      const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: {
          viewSnapshots: { orderBy: { takenAt: 'desc' }, take: 1 },
        },
      });

      if (!video) {
        logger.warn(`Video ${videoId} not found — skipping settlement`);
        return { videoId, settled: false, reason: 'video_not_found' };
      }

      if (video.stage !== 'published') {
        logger.log(`Video ${videoId} already moved (stage: ${video.stage}). No-op.`);
        return { videoId, settled: false, reason: `already_${video.stage}` };
      }

      // §D.6: No ViewSnapshot = No Settle
      const latestSnapshot = video.viewSnapshots[0];
      if (!latestSnapshot) {
        logger.warn(`Video ${videoId} has NO ViewSnapshot — refusing to settle`);
        return { videoId, settled: false, reason: 'no_view_snapshot' };
      }

      // §0 lock 2: Anomaly hold
      if (latestSnapshot.isAnomalous) {
        logger.warn(
          `Video ${videoId} has anomalous snapshot (flags: ${latestSnapshot.anomalyFlags.join(', ')}) — settlement held. Admin must intervene.`,
        );
        return { videoId, settled: false, reason: 'anomaly_hold' };
      }

      // Call the API's settlement endpoint (which handles the ledger entry)
      // For the worker, we call the DistributionService directly via dynamic import
      const http = require('http');
      const result: any = await new Promise((resolve) => {
        const req = http.request(
          {
            hostname: '127.0.0.1',
            port: 4000,
            path: `/api/distribution/videos/${videoId}/settle`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          },
          (res: any) => {
            let body = '';
            res.on('data', (chunk: any) => (body += chunk));
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(body) });
              } catch {
                resolve({ status: res.statusCode, body });
              }
            });
          },
        );
        req.on('error', (e: Error) => resolve({ status: 0, error: e.message }));
        req.end();
      });

      if (result.status === 200 || result.status === 201) {
        logger.log(`✓ Video ${videoId} settled: ${JSON.stringify(result.body)}`);
        return result.body;
      } else {
        logger.error(`Settlement failed for video ${videoId}: ${JSON.stringify(result)}`);
        return { videoId, settled: false, reason: 'api_error', detail: result };
      }
    },
    { connection, concurrency: 5 },
  );

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}
