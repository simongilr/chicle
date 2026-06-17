import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicForm } from './dynamic-form.entity';
import { DynamicFormsController } from './dynamic-forms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DynamicForm])],
  controllers: [DynamicFormsController]
})
export class DynamicFormsModule {}
