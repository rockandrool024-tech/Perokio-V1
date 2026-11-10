import { Module } from '@nestjs/common';
import { HarnessService } from './harness.service';
import { HarnessController } from './harness.controller';
import { LlmService } from './llm.service';

@Module({
  controllers: [HarnessController],
  providers: [HarnessService, LlmService],
  exports: [HarnessService, LlmService],
})
export class HarnessModule {}
