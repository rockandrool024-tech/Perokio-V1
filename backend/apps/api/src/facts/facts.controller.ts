import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FactsService } from './facts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';

@Controller('facts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FactsController {
  constructor(private factsService: FactsService) {}

  @Post()
  @Roles(Role.brand_owner, Role.brand_member, Role.studio_editor, Role.super_admin)
  async create(@Body() body: any, @Req() req: any) {
    // Resolve brandId: brand_owner uses their own brand; others pass it explicitly
    const brandId = body.brandId || req.user.brandId;
    return this.factsService.create({
      brandId,
      tier: body.tier,
      language: body.language,
      topic: body.topic,
      cpmBudget: body.cpmBudget,
      baseFee: body.baseFee,
      maxClaims: body.maxClaims,
    });
  }

  @Get()
  @Roles(Role.brand_owner, Role.brand_member, Role.studio_editor, Role.qa_reviewer, Role.ops, Role.super_admin)
  async list(@Req() req: any) {
    return this.factsService.list({ brandId: req.query?.brandId as string });
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.factsService.findById(id);
  }
}
