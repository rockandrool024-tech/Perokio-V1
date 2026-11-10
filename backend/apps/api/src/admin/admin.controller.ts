import {
  Controller, Post, Get, Patch, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // === GET /admin/scripts — list ScriptVersions in QA ===
  @Get('scripts')
  @Roles(Role.studio_editor, Role.qa_reviewer, Role.ops, Role.super_admin)
  async listScriptsInQa() {
    return this.adminService.listScriptsInQa();
  }

  // === POST /admin/lines/:id/verify — human verifies a line ===
  @Post('lines/:lineId/verify')
  @Roles(Role.studio_editor, Role.qa_reviewer, Role.super_admin)
  async verifyLine(@Param('lineId') lineId: string, @Req() req: any, @Body() body?: { sourceId?: string }) {
    return this.adminService.verifyLine(lineId, req.user.id, body?.sourceId);
  }

  // === POST /admin/videos/:id/transcript — submit speech-to-text ===
  @Post('videos/:videoId/transcript')
  @Roles(Role.studio_editor, Role.qa_reviewer, Role.ops, Role.super_admin)
  async submitTranscript(@Param('videoId') videoId: string, @Body() body: { transcript: string }) {
    return this.adminService.submitTranscript(videoId, body.transcript);
  }

  // === POST /admin/videos/:id/override-deviation — override off-script ===
  @Post('videos/:videoId/override-deviation')
  @Roles(Role.qa_reviewer, Role.super_admin)
  async overrideDeviation(@Param('videoId') videoId: string, @Req() req: any, @Body() body?: { reason?: string }) {
    return this.adminService.overrideDeviation(videoId, req.user.id, body?.reason);
  }

  // === POST /admin/videos/:id/rate — pass/fail gates + weighted score ===
  @Post('videos/:videoId/rate')
  @Roles(Role.qa_reviewer, Role.super_admin)
  async rateVideo(
    @Param('videoId') videoId: string,
    @Req() req: any,
    @Body() body: { brandSafety: boolean; scriptMatch: boolean; craft: number; hook: number; notes?: string },
  ) {
    return this.adminService.rateVideo(videoId, req.user.id, body);
  }

  // === GET /admin/pipeline — dashboard counts ===
  @Get('pipeline')
  @Roles(Role.studio_editor, Role.qa_reviewer, Role.ops, Role.finance, Role.super_admin)
  async getPipeline() {
    return this.adminService.getPipeline();
  }
}
