export interface BaseMenuSeed {
  key: string;
  label: string;
  route: string;
  icon: string;
  permissions?: string[];
  sortOrder: number;
}

export const BASE_MENU_ITEMS: BaseMenuSeed[] = [
  {
    key: 'home',
    label: 'Inicio',
    route: '/home',
    icon: 'pi pi-home',
    sortOrder: 10
  },
  {
    key: 'docs',
    label: 'Manual',
    route: '/docs',
    icon: 'pi pi-book',
    sortOrder: 20
  },
  {
    key: 'confisys',
    label: 'Configuración',
    route: '/confisys',
    icon: 'pi pi-sliders-h',
    permissions: ['confisys.read'],
    sortOrder: 30
  },
  {
    key: 'database',
    label: 'Base de datos',
    route: '/database',
    icon: 'pi pi-database',
    permissions: ['database.read'],
    sortOrder: 35
  },
  {
    key: 'security',
    label: 'Seguridad',
    route: '/security',
    icon: 'pi pi-shield',
    permissions: ['users.read', 'roles.read', 'permissions.read'],
    sortOrder: 40
  }
];
