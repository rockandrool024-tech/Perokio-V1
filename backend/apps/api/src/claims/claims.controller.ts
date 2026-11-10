import {
  Controller, Post, Get, Param, UseGuards, Req, Body, ConflictException,
} from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClaimsController {
  constructor(private claimsService: ClaimsService) {}

  @Post('facts/:factId/claim')
  @Roles(Role.creator, Role.super_admin)
  async claimFact(@Param('factId') factId: string, @Req() req: any) {
    // For V1, resolve creatorId from user — in production this would be a join
    const creator = await req.user?.creatorId;
    // If user is a creator, look up their Creator record
    const { prisma } = require('@perokio/db');
    const creatorRecord = await prisma.creator.findUnique({
      where: { userId: req.user.id },
    });
    if (!creatorRecord) {
      throw new ConflictException('User is not a creator');
    }
    return this.claimsService.claimFact(factId, creatorRecord.id);
  }

  @Post('videos/:videoId/lock')
  @Roles(Role.creator, Role.super_admin)
  async lockVideo(
    @Param('videoId') videoId: string,
    @Req() req: any,
    @Body() body: { r2Key: string; transcript?: string },
  ) {
    const { prisma } = require('@perokio/db');
    const creatorRecord = await prisma.creator.findUnique({
      where: { userId: req.user.id },
    });
    if (!creatorRecord) {
      throw new ConflictException('User is not a creator');
    }
    return this.claimsService.lockVideo(videoId, creatorRecord.id, body.r2Key, body.transcript);
  }

  // Manual endpoints for testing the expiry logic (worker normally calls these)
  @Post('claims/:claimId/expire')
  @Roles(Role.ops, Role.super_admin)
  async expireClaim(@Param('claimId') claimId: string) {
    const expired = await this.claimsService.expireClaim(claimId);
    return { claimId, expired };
  }

  @Post('videos/:videoId/auto-approve')
  @Roles(Role.ops, Role.super_admin)
  async autoApprove(@Param('videoId') videoId: string) {
    const approved = await this.claimsService.autoApproveReview(videoId);
    return { videoId, autoApproved: approved };
  }
}
