import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowActionCatalog } from './flow-action-catalog.entity';
import { FlowDecisionTable } from './flow-decision-table.entity';
import { FlowExpression } from './flow-expression.entity';
import { FlowRun } from './flow-run.entity';
import { FlowStepRun } from './flow-step-run.entity';
import { FlowStep } from './flow-step.entity';
import { FlowTestCase } from './flow-test-case.entity';
import { FlowTrigger } from './flow-trigger.entity';
import { FlowVersion } from './flow-version.entity';
import { Flow } from './flow.entity';

@Module({
  imports: [
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
  exports: [TypeOrmModule]
})
export class FlowsModule {}
