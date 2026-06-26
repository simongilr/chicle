import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ConfisysModule } from '../confisys/confisys.module';
import { DynamicServicesModule } from '../dynamic-services/dynamic-services.module';
import { FlowActionCatalog } from './flow-action-catalog.entity';
import { FlowDecisionTable } from './flow-decision-table.entity';
import { FlowExpression } from './flow-expression.entity';
import { FlowExpressionEngine } from './flow-expression-engine.service';
import { FlowRun } from './flow-run.entity';
import { FlowStepRun } from './flow-step-run.entity';
import { FlowStep } from './flow-step.entity';
import { FlowTestCase } from './flow-test-case.entity';
import { FlowTrigger } from './flow-trigger.entity';
import { FlowVersion } from './flow-version.entity';
import { Flow } from './flow.entity';
import { FlowsController } from './flows.controller';
import { FlowsService } from './flows.service';

@Module({
  imports: [
    AuditModule,
    ConfisysModule,
    DynamicServicesModule,
    TypeOrmModule.forFeature([
      Flow,
      FlowVersion,
      FlowStep,
      FlowExpression,
      FlowDecisionTable,
      FlowRun,
      FlowStepRun,
      FlowTrigger,
      FlowActionCatalog,
      FlowTestCase
    ])
  ],
  controllers: [FlowsController],
  providers: [FlowsService, FlowExpressionEngine],
  exports: [TypeOrmModule, FlowsService, FlowExpressionEngine]
})
export class FlowsModule {}
