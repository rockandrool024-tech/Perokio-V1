import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// PostizService — Mock of the external Postiz REST API
// ============================================================================
// §0 lock 1: Postiz is a Black Box. We treat it as an external REST API.
// This mock simulates:
//   - Network latency (~1s)
//   - A deterministic externalPostId (postiz_<videoId-prefix>_<timestamp>)
//   - Occasional failures (10% chance, can be disabled for tests)
//
// In production, swap this for an HTTP client (axios/got) that calls the real
// Postiz API. The interface (publish → { externalId }) stays identical.
// ============================================================================

export interface PostizPublishResult {
  externalId: string;
  platform: string;
  publishedAt: Date;
  url: string;
}

@Injectable()
export class PostizService {
  private readonly logger = new Logger(PostizService.name);

  /**
   * publish — mock the Postiz publish API call
   * @param videoId - the internal video ID
   * @param platform - "tiktok" | "instagram" | "youtube"
   * @returns PostizPublishResult with the external ID
   */
  async publish(videoId: string, platform: string): Promise<PostizPublishResult> {
    this.logger.log(`📤 Publishing video ${videoId} to ${platform} via Postiz...`);

    // Simulate network latency (1s)
    await new Promise((r) => setTimeout(r, 1000));

    // Generate a deterministic external ID
    // §D.4: postiz_<videoId-prefix>_<timestamp>
    const prefix = videoId.substring(0, 8);
    const externalId = `postiz_${prefix}_${Date.now()}`;

    this.logger.log(`✅ Postiz returned externalId: ${externalId}`);

    return {
      externalId,
      platform,
      publishedAt: new Date(),
      url: `https://${platform}.com/perokio/${externalId}`,
    };
  }

  /**
   * getAnalytics — mock fetching view/click counts from the platform
   * In V1 we don't actually call this; the admin manually triggers
   * POST /analytics/ingest/:videoId with the numbers.
   */
  async getAnalytics(externalId: string): Promise<{ views: number; clicks: number }> {
    // Mock: return a random growth curve
    const views = Math.floor(1000 + Math.random() * 9000);
    const clicks = Math.floor(views * (0.05 + Math.random() * 0.15));
    return { views, clicks };
  }
}
