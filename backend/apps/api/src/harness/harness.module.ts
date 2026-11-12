import { Module } from '@nestjs/common';
import { HarnessService } from './harness.service';
import { HarnessController } from './harness.controller';
import { LlmService } from './llm.service';
import { RagService } from './rag.service';

@Module({
  controllers: [HarnessController],
  providers: [HarnessService, LlmService, RagService],
  exports: [HarnessService, LlmService, RagService],
})
export class HarnessModule {}
