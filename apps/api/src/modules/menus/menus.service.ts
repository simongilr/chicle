import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuthContext } from '../auth/auth.types';
import { MenuItem } from './menu-item.entity';
import { BASE_MENU_ITEMS } from './menus.seed';

export interface MenuSyncResult {
  menusCreated: number;
  menusUpdated: number;
}

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

  async syncTenantDefaults(tenantId: string, manager?: EntityManager): Promise<MenuSyncResult> {
    const repository = manager ? manager.getRepository(MenuItem) : this.menus;
    const result: MenuSyncResult = {
      menusCreated: 0,
      menusUpdated: 0
    };

    for (const item of BASE_MENU_ITEMS) {
      const existing = await repository.findOne({ where: { tenantId, key: item.key } });
      if (!existing) {
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
        result.menusCreated += 1;
        continue;
      }

      const updates: Partial<MenuItem> = {};
      if (existing.route !== item.route) {
        updates.route = item.route;
      }
      if (existing.icon !== item.icon) {
        updates.icon = item.icon;
      }
      if (JSON.stringify(existing.permissions ?? []) !== JSON.stringify(item.permissions ?? [])) {
        updates.permissions = item.permissions ?? [];
      }
      if (existing.sortOrder !== item.sortOrder) {
        updates.sortOrder = item.sortOrder;
      }

      if (Object.keys(updates).length > 0) {
        await repository.update({ id: existing.id }, updates);
        result.menusUpdated += 1;
      }
    }

    return result;
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
