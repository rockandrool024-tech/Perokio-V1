import {
  Controller, Post, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DistributionController {
  constructor(private distributionService: DistributionService) {}

  // === POST /distribution/publish/:videoId ===
  @Post('distribution/publish/:videoId')
  @Roles(Role.brand_owner, Role.brand_member, Role.ops, Role.super_admin)
  async publish(@Param('videoId') videoId: string) {
    return this.distributionService.publishVideo(videoId);
  }

  // === POST /analytics/ingest/:videoId ===
  @Post('analytics/ingest/:videoId')
  @Roles(Role.ops, Role.super_admin, Role.qa_reviewer)
  async ingest(
    @Param('videoId') videoId: string,
    @Body() body: { views: number; clicks: number; source?: string },
  ) {
    return this.distributionService.ingestAnalytics(
      videoId,
      body.views,
      body.clicks,
      body.source || 'tiktok_api',
    );
  }

  // === POST /admin/videos/:id/dismiss-anomaly ===
  @Post('admin/videos/:videoId/dismiss-anomaly')
  @Roles(Role.qa_reviewer, Role.finance, Role.super_admin)
  async dismissAnomaly(@Param('videoId') videoId: string, @Req() req: any) {
    return this.distributionService.dismissAnomaly(videoId, req.user.id);
  }

  // === POST /distribution/videos/:videoId/settle — manual settlement trigger (for testing) ===
  @Post('distribution/videos/:videoId/settle')
  @Roles(Role.ops, Role.finance, Role.super_admin)
  async settle(@Param('videoId') videoId: string) {
    return this.distributionService.settleVideo(videoId);
  }
}
