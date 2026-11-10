import {
  Controller, Post, Get, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { HarnessService } from './harness.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@perokio/db';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class HarnessController {
  constructor(private harnessService: HarnessService) {}

  // === POST /harness/configs — create a config (studio only) ===
  @Post('harness/configs')
  @Roles(Role.studio_editor, Role.super_admin)
  async createConfig(@Body() body: any) {
    return this.harnessService.createConfig({
      name: body.name,
      modelMap: body.modelMap,
      budgetCap: body.budgetCap,
    });
  }

  // === GET /harness/configs — list all configs ===
  @Get('harness/configs')
  @Roles(Role.studio_editor, Role.qa_reviewer, Role.ops, Role.super_admin)
  async listConfigs() {
    return this.harnessService.listConfigs();
  }

  // === POST /facts/:id/generate — generate a new ScriptVersion via LLM ===
  @Post('facts/:factId/generate')
  @Roles(Role.studio_editor, Role.super_admin)
  async generate(
    @Param('factId') factId: string,
    @Body() body: { configId: string },
    @Req() req: any,
  ) {
    return this.harnessService.generate(factId, body.configId, req.user.id);
  }

  // === POST /harness/:configId/eval — run the hallucination eval ===
  @Post('harness/:configId/eval')
  @Roles(Role.studio_editor, Role.qa_reviewer, Role.super_admin)
  async runEval(@Param('configId') configId: string) {
    return this.harnessService.runEval(configId);
  }

  // === POST /harness/:configId/activate — activate only if eval passed ===
  @Post('harness/:configId/activate')
  @Roles(Role.studio_editor, Role.super_admin)
  async activate(@Param('configId') configId: string) {
    return this.harnessService.activate(configId);
  }
}
