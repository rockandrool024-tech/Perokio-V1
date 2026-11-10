import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { FactsModule } from './facts/facts.module';
import { ScriptsModule } from './scripts/scripts.module';
import { ClaimsModule } from './claims/claims.module';
import { ShortLinksModule } from './shortlinks/shortlinks.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FactsModule,
    ScriptsModule,
    ClaimsModule,
    ShortLinksModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
