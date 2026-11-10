import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { QueueService } from './queue.service';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, QueueService],
  exports: [ClaimsService],
})
export class ClaimsModule {}
