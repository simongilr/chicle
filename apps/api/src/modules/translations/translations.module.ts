import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ConfisysModule } from '../confisys/confisys.module';
import { TranslationBundleVersion } from './translation-bundle-version.entity';
import { TranslationEntry } from './translation-entry.entity';
import { TranslationMissingKey } from './translation-missing-key.entity';
import { TranslationNamespace } from './translation-namespace.entity';
import { TranslationsController } from './translations.controller';
import { TranslationsService } from './translations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TranslationNamespace, TranslationEntry, TranslationBundleVersion, TranslationMissingKey]),
    ConfisysModule,
    AuditModule
  ],
  controllers: [TranslationsController],
  providers: [TranslationsService],
  exports: [TranslationsService]
})
export class TranslationsModule {}
