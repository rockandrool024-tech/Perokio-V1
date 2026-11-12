import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { FactsModule } from './facts/facts.module';
import { ScriptsModule } from './scripts/scripts.module';
import { ClaimsModule } from './claims/claims.module';
import { ShortLinksModule } from './shortlinks/shortlinks.module';
import { HarnessModule } from './harness/harness.module';
import { AdminModule } from './admin/admin.module';
import { DistributionModule } from './distribution/distribution.module';
import { LedgerModule } from './ledger/ledger.module';
import { ConversionModule } from './conversion/conversion.module';
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
    HarnessModule,
    AdminModule,
    DistributionModule,
    LedgerModule,
    ConversionModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
