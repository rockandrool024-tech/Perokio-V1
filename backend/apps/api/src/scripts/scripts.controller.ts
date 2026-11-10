import {
  Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';

@Controller('scripts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScriptsController {
  constructor(private scriptsService: ScriptsService) {}

  // === ScriptLine CRUD ===

  @Post(':scriptVersionId/lines')
  @Roles(Role.brand_owner, Role.brand_member, Role.studio_editor, Role.super_admin)
  async addLine(@Param('scriptVersionId') svId: string, @Body() body: any) {
    return this.scriptsService.addLine(svId, {
      text: body.text,
      position: body.position,
      isHook: body.isHook,
      durationSec: body.durationSec,
    });
  }

  @Patch('lines/:lineId')
  @Roles(Role.brand_owner, Role.brand_member, Role.studio_editor, Role.super_admin)
  async updateLine(@Param('lineId') lineId: string, @Body() body: any) {
    return this.scriptsService.updateLine(lineId, {
      text: body.text,
      durationSec: body.durationSec,
    });
  }

  @Post('lines/:lineId/sources/:sourceId')
  @Roles(Role.brand_owner, Role.brand_member, Role.studio_editor, Role.qa_reviewer, Role.super_admin)
  async linkSource(@Param('lineId') lineId: string, @Param('sourceId') sourceId: string) {
    return this.scriptsService.linkSource(lineId, sourceId);
  }

  @Delete('lines/:lineId/sources/:sourceId')
  @Roles(Role.brand_owner, Role.brand_member, Role.studio_editor, Role.qa_reviewer, Role.super_admin)
  async unlinkSource(@Param('lineId') lineId: string, @Param('sourceId') sourceId: string) {
    await this.scriptsService.unlinkSource(lineId, sourceId);
    return { unlinked: true };
  }

  // === Source library ===

  @Post('sources')
  @Roles(Role.brand_owner, Role.brand_member, Role.studio_editor, Role.qa_reviewer, Role.super_admin)
  async createSource(@Body() body: any, @Req() req: any) {
    return this.scriptsService.createSource({
      label: body.label,
      url: body.url,
      type: body.type,
      verifiedBy: req.user.id,
    });
  }

  @Get('sources')
  async listSources() {
    return this.scriptsService.listSources();
  }

  // === THE B11 GATE ===

  @Post(':scriptVersionId/approve')
  @Roles(Role.brand_owner, Role.qa_reviewer, Role.super_admin)
  async approve(@Param('scriptVersionId') svId: string, @Req() req: any) {
    return this.scriptsService.approve(svId, req.user.id);
  }

  // === Off-script override ===

  @Post('videos/:videoId/override-offscript')
  @Roles(Role.brand_owner, Role.super_admin)
  async overrideOffScript(@Param('videoId') videoId: string, @Req() req: any) {
    return this.scriptsService.overrideOffScript(videoId, req.user.id);
  }
}

