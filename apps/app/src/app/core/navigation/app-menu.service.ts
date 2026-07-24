import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';
import { AuthService } from '../auth/auth.service';
import { AppMenuItem } from './app-menu.types';

const PUBLIC_MENU: AppMenuItem[] = [
  {
    key: 'docs',
    label: 'Manual',
    i18nKey: 'nav.docs',
    route: '/docs',
    icon: 'pi pi-book',
    placement: 'manual',
    sortOrder: 10
  },
  {
    key: 'docs-library',
    label: 'Archivos MD',
    i18nKey: 'nav.docsLibrary',
    route: '/docs/source',
    icon: 'pi pi-file',
    placement: 'manual',
    sortOrder: 12
  },
  {
    key: 'components',
    label: 'Componentes',
    i18nKey: 'nav.components',
    route: '/components',
    icon: 'pi pi-th-large',
    placement: 'primary',
    sortOrder: 20
  },
  {
    key: 'architecture',
    label: 'Arquitectura',
    i18nKey: 'nav.architecture',
    route: '/architecture',
    icon: 'pi pi-sitemap',
    placement: 'manual',
    sortOrder: 15
  },
  {
    key: 'setup',
    label: 'Setup',
    i18nKey: 'nav.setup',
    route: '/setup',
    icon: 'pi pi-wrench',
    placement: 'primary',
    sortOrder: 30
  },
  {
    key: 'login',
    label: 'Ingresar',
    i18nKey: 'nav.login',
    route: '/login',
    icon: 'pi pi-sign-in',
    placement: 'primary',
    sortOrder: 40
  }
];

const FALLBACK_AUTH_MENU: AppMenuItem[] = [
  {
    key: 'home',
    label: 'Inicio',
    i18nKey: 'nav.home',
    route: '/home',
    icon: 'pi pi-home',
    placement: 'primary',
    sortOrder: 10
  },
  {
    key: 'docs',
    label: 'Manual',
    i18nKey: 'nav.docs',
    route: '/docs',
    icon: 'pi pi-book',
    placement: 'manual',
    sortOrder: 20
  },
  {
    key: 'docs-library',
    label: 'Archivos MD',
    i18nKey: 'nav.docsLibrary',
    route: '/docs/source',
    icon: 'pi pi-file',
    placement: 'manual',
    sortOrder: 21
  },
  {
    key: 'components',
    label: 'Componentes',
    i18nKey: 'nav.components',
    route: '/components',
    icon: 'pi pi-th-large',
    placement: 'primary',
    sortOrder: 25
  },
  {
    key: 'architecture',
    label: 'Arquitectura',
    i18nKey: 'nav.architecture',
    route: '/architecture',
    icon: 'pi pi-sitemap',
    placement: 'manual',
    sortOrder: 22
  },
  {
    key: 'confisys',
    label: 'Configuración',
    i18nKey: 'nav.confisys',
    route: '/confisys',
    icon: 'pi pi-sliders-h',
    permissions: ['confisys.read'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 30
  },
  {
    key: 'preferences',
    label: 'Preferencias',
    i18nKey: 'nav.preferences',
    route: '/preferences',
    icon: 'pi pi-palette',
    roles: ['owner', 'admin'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 32
  },
  {
    key: 'database',
    label: 'Base de datos',
    i18nKey: 'nav.database',
    route: '/database',
    icon: 'pi pi-database',
    roles: ['owner', 'admin'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 35
  },
  {
    key: 'environments',
    label: 'Ambientes',
    i18nKey: 'nav.environments',
    route: '/environments',
    icon: 'pi pi-cloud',
    permissions: ['env.read'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 36
  },
  {
    key: 'services',
    label: 'Servicios',
    i18nKey: 'nav.services',
    route: '/services',
    icon: 'pi pi-bolt',
    permissions: ['services.read'],
    group: 'Construcción',
    placement: 'build',
    sortOrder: 38
  },
  {
    key: 'flows',
    label: 'Flows',
    i18nKey: 'nav.flows',
    route: '/flows',
    icon: 'pi pi-sitemap',
    permissions: ['flows.read'],
    group: 'Construcción',
    placement: 'build',
    sortOrder: 39
  },
  {
    key: 'forms',
    label: 'Formularios',
    i18nKey: 'nav.forms',
    route: '/forms',
    icon: 'pi pi-file-edit',
    permissions: ['forms.read'],
    group: 'Construcción',
    placement: 'build',
    sortOrder: 40
  },
  {
    key: 'security',
    label: 'Seguridad',
    i18nKey: 'nav.security',
    route: '/security',
    icon: 'pi pi-shield',
    permissions: ['users.read', 'roles.read', 'permissions.read'],
    group: 'Administración',
    placement: 'admin',
    sortOrder: 45
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
      const current = byKey.get(fallback.key);
      if (!current) {
        byKey.set(fallback.key, fallback);
        continue;
      }

      byKey.set(fallback.key, {
        ...fallback,
        ...current,
        i18nKey: current.i18nKey ?? fallback.i18nKey,
        group: current.group ?? fallback.group,
        placement: current.placement ?? fallback.placement,
        roles: current.roles ?? fallback.roles,
        permissions: current.permissions ?? fallback.permissions,
        priority: current.priority ?? fallback.priority
      });
    }

    return Array.from(byKey.values());
  }
}
