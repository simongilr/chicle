import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItem } from './menu-item.entity';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem])],
  controllers: [MenusController],
  providers: [MenusService],
  exports: [MenusService]
})
export class MenusModule {}
