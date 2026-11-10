import { Module } from '@nestjs/common';
import { DistributionService } from './distribution.service';
import { DistributionController } from './distribution.controller';
import { PostizService } from './postiz.service';
import { QueueService } from './queue.service';

@Module({
  controllers: [DistributionController],
  providers: [DistributionService, PostizService, QueueService],
  exports: [DistributionService, PostizService],
})
export class DistributionModule {}
