import {
  Controller, Get, Post, Param, Req, Res, Body, UseGuards, Query,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ShortLinksService } from './shortlinks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';
import { SetMetadata } from '@nestjs/common';
import { SKIP_AUDIT_KEY } from '../common/interceptors/audit.interceptor';

@Controller()
export class ShortLinksController {
  constructor(private shortLinksService: ShortLinksService) {}

  /**
   * GET /r/:code — public redirect. No auth required.
   * Records a ClickEvent and issues a 302 redirect.
   */
  @Get('r/:code')
  @SetMetadata(SKIP_AUDIT_KEY, true)
  async redirect(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '0.0.0.0';
    const userAgent = req.headers['user-agent'];

    const { targetUrl, isBot } = await this.shortLinksService.resolveAndTrack(
      code,
      ip,
      userAgent,
    );

    // 302 redirect (not 301 — shortlinks can change targets)
    return res.redirect(302, targetUrl);
  }

  /** POST /shortlinks — create a shortlink (authenticated) */
  @Post('shortlinks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.brand_owner, Role.brand_member, Role.ops, Role.super_admin)
  async create(@Body() body: { targetUrl: string; videoId?: string; brandId?: string }) {
    return this.shortLinksService.create(body);
  }
}
