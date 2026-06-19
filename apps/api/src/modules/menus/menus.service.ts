import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { MenuItem } from './menu-item.entity';
import { BASE_MENU_ITEMS } from './menus.seed';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menus: Repository<MenuItem>
  ) {}

  async ensureTenantDefaults(tenantId: string, manager?: EntityManager) {
    const repository = manager ? manager.getRepository(MenuItem) : this.menus;

    for (const item of BASE_MENU_ITEMS) {
      const exists = await repository.findOne({ where: { tenantId, key: item.key } });
      if (exists) {
        continue;
      }

      await repository.save(
        repository.create({
          tenantId,
          key: item.key,
          label: item.label,
          route: item.route,
          icon: item.icon,
          permissions: item.permissions ?? [],
          active: true,
          sortOrder: item.sortOrder
        })
      );
    }
  }

  async getCurrentMenu(auth: AuthContext) {
    const permissions = new Set(auth.permissions);
    const items = await this.menus.find({
      where: { tenantId: auth.tenant.id, active: true },
      order: { sortOrder: 'ASC', label: 'ASC' }
    });

    return items
      .filter((item) => (item.permissions ?? []).every((permission) => permissions.has(permission)))
      .map((item) => ({
        key: item.key,
        label: item.label,
        route: item.route,
        icon: item.icon,
        permissions: item.permissions ?? [],
        sortOrder: item.sortOrder
      }));
  }
}
