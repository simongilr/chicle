import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { AuthService } from '../auth/auth.service';
import { AppMenuItem } from './app-menu.types';

const PUBLIC_MENU: AppMenuItem[] = [
  { key: 'docs', label: 'Manual', route: '/docs', icon: 'pi pi-book', placement: 'primary', sortOrder: 10 },
  { key: 'setup', label: 'Setup', route: '/setup', icon: 'pi pi-wrench', placement: 'primary', sortOrder: 20 },
  { key: 'login', label: 'Ingresar', route: '/login', icon: 'pi pi-sign-in', placement: 'primary', sortOrder: 30 }
];

const FALLBACK_AUTH_MENU: AppMenuItem[] = [
  { key: 'home', label: 'Inicio', route: '/home', icon: 'pi pi-home', placement: 'primary', sortOrder: 10 },
  { key: 'docs', label: 'Manual', route: '/docs', icon: 'pi pi-book', placement: 'primary', sortOrder: 20 },
  {
    key: 'confisys',
    label: 'Configuración',
    route: '/confisys',
    icon: 'pi pi-sliders-h',
    permissions: ['confisys.read'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 30
  },
  {
    key: 'database',
    label: 'Base de datos',
    route: '/database',
    icon: 'pi pi-database',
    roles: ['owner', 'admin'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 35
  },
  {
    key: 'services',
    label: 'Servicios',
    route: '/services',
    icon: 'pi pi-bolt',
    permissions: ['services.read'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 38
  },
  {
    key: 'flows',
    label: 'Flows',
    route: '/flows',
    icon: 'pi pi-sitemap',
    permissions: ['flows.read'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 39
  },
  {
    key: 'security',
    label: 'Seguridad',
    route: '/security',
    icon: 'pi pi-shield',
    permissions: ['users.read', 'roles.read', 'permissions.read'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 40
  }
];

@Injectable({ providedIn: 'root' })
export class AppMenuService {
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);
  private readonly dynamicItems = signal<AppMenuItem[] | null>(null);
  readonly loading = signal(false);

  readonly items = computed(() => {
    if (!this.auth.state.isAuthenticated) {
      return PUBLIC_MENU;
    }

    const source = this.mergeWithFallback(this.dynamicItems() ?? FALLBACK_AUTH_MENU);
    return source
      .filter((item) => this.hasAccess(item))
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  });

  loadCurrent() {
    if (!this.auth.state.isAuthenticated || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.api.get<AppMenuItem[]>('menus/current').subscribe({
      next: (items) => {
        this.dynamicItems.set(items.length ? items : FALLBACK_AUTH_MENU);
        this.loading.set(false);
      },
      error: () => {
        this.dynamicItems.set(FALLBACK_AUTH_MENU);
        this.loading.set(false);
      }
    });
  }

  reset() {
    this.dynamicItems.set(null);
  }

  private hasAccess(item: AppMenuItem) {
    if (this.auth.state.isOwnerOrAdmin) {
      return true;
    }

    const hasPermissions = !item.permissions?.length || this.auth.state.hasAllPermissions(item.permissions);
    const hasRoles = !item.roles?.length || this.auth.state.hasAnyRole(item.roles);
    return hasPermissions && hasRoles;
  }

  private mergeWithFallback(items: AppMenuItem[]) {
    const byKey = new Map(items.map((item) => [item.key, item]));
    for (const fallback of FALLBACK_AUTH_MENU) {
      if (!byKey.has(fallback.key)) {
        byKey.set(fallback.key, fallback);
      }
    }

    return Array.from(byKey.values());
  }
}
