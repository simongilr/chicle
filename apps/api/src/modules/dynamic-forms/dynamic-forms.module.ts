import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicServicesModule } from '../dynamic-services/dynamic-services.module';
import { FlowsModule } from '../flows/flows.module';
import { RecordsModule } from '../records/records.module';
import { DynamicFormBinding } from './dynamic-form-binding.entity';
import { DynamicFormRun } from './dynamic-form-run.entity';
import { DynamicFormVersion } from './dynamic-form-version.entity';
import { DynamicFormWritePolicy } from './dynamic-form-write-policy.entity';
import { DynamicForm } from './dynamic-form.entity';
import { DynamicFormsController } from './dynamic-forms.controller';
import { DynamicFormsService } from './dynamic-forms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DynamicForm,
      DynamicFormVersion,
      DynamicFormBinding,
      DynamicFormWritePolicy,
      DynamicFormRun
    ]),
    DynamicServicesModule,
    FlowsModule,
    RecordsModule
  ],
  controllers: [DynamicFormsController],
  providers: [DynamicFormsService],
  exports: [DynamicFormsService]
})
export class DynamicFormsModule {}
