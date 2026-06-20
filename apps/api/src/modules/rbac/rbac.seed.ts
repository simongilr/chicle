export interface BasePermissionSeed {
  key: string;
  category: string;
  description: string;
}

export interface BaseRoleSeed {
  key: string;
  name: string;
  description: string;
  permissions: string[] | 'all';
}

export const BASE_PERMISSIONS: BasePermissionSeed[] = [
  { key: 'settings.read', category: 'settings', description: 'Ver configuración general.' },
  { key: 'settings.update', category: 'settings', description: 'Actualizar configuración general.' },
  { key: 'confisys.read', category: 'confisys', description: 'Ver parámetros del sistema.' },
  { key: 'confisys.update', category: 'confisys', description: 'Actualizar parámetros del sistema.' },
  { key: 'database.read', category: 'database', description: 'Ver tablas de base de datos en modo solo lectura.' },
  { key: 'users.read', category: 'users', description: 'Ver usuarios.' },
  { key: 'users.create', category: 'users', description: 'Crear usuarios.' },
  { key: 'users.update', category: 'users', description: 'Actualizar usuarios.' },
  { key: 'users.disable', category: 'users', description: 'Desactivar usuarios.' },
  { key: 'roles.read', category: 'roles', description: 'Ver roles.' },
  { key: 'roles.manage', category: 'roles', description: 'Administrar roles y permisos.' },
  { key: 'permissions.read', category: 'roles', description: 'Ver permisos disponibles.' },
  { key: 'menus.read', category: 'menus', description: 'Ver menús.' },
  { key: 'forms.read', category: 'forms', description: 'Ver formularios.' },
  { key: 'forms.manage', category: 'forms', description: 'Administrar formularios.' },
  { key: 'records.read', category: 'records', description: 'Ver registros.' },
  { key: 'records.create', category: 'records', description: 'Crear registros.' },
  { key: 'records.update', category: 'records', description: 'Actualizar registros.' },
  { key: 'files.upload', category: 'files', description: 'Subir evidencias.' },
  { key: 'files.read', category: 'files', description: 'Ver evidencias.' },
  { key: 'audit.read', category: 'audit', description: 'Ver auditoría.' }
];

export const BASE_ROLES: BaseRoleSeed[] = [
  {
    key: 'owner',
    name: 'Owner',
    description: 'Control total del tenant.',
    permissions: 'all'
  },
  {
    key: 'admin',
    name: 'Admin',
    description: 'Administración operativa sin control total de ownership.',
    permissions: [
      'settings.read',
      'settings.update',
      'confisys.read',
      'database.read',
      'users.read',
      'users.create',
      'users.update',
      'users.disable',
      'roles.read',
      'permissions.read',
      'menus.read',
      'forms.read',
      'forms.manage',
      'records.read',
      'records.create',
      'records.update',
      'files.upload',
      'files.read',
      'audit.read'
    ]
  },
  {
    key: 'operator',
    name: 'Operator',
    description: 'Operación diaria con captura y consulta básica.',
    permissions: [
      'menus.read',
      'forms.read',
      'records.read',
      'records.create',
      'records.update',
      'files.upload',
      'files.read'
    ]
  },
  {
    key: 'viewer',
    name: 'Viewer',
    description: 'Consulta de información sin modificación.',
    permissions: ['menus.read', 'forms.read', 'records.read', 'files.read']
  }
];
