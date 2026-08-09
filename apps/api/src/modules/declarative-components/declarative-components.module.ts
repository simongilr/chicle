import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComponentAdapter } from './component-adapter.entity';
import { ComponentDefinition } from './component-definition.entity';
import { DeclarativeComponentsController } from './declarative-components.controller';
import { DeclarativeComponentsService } from './declarative-components.service';
import { DynamicComponentTemplateVersion } from './dynamic-component-template-version.entity';
import { DynamicComponentTemplate } from './dynamic-component-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ComponentDefinition,
      ComponentAdapter,
      DynamicComponentTemplate,
      DynamicComponentTemplateVersion
    ])
  ],
  controllers: [DeclarativeComponentsController],
  providers: [DeclarativeComponentsService],
  exports: [DeclarativeComponentsService]
})
export class DeclarativeComponentsModule {}
