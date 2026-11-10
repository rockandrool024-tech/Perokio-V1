import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  console.log('🦜 Perokio Worker running — processing BullMQ jobs');
  // Workers run in the background via @Processor() decorators
  // The app stays alive until killed
}
bootstrap();
