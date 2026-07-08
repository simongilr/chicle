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
  { key: 'database.design', category: 'database', description: 'Crear y modificar tablas custom con migraciones.' },
  { key: 'users.read', category: 'users', description: 'Ver usuarios.' },
  { key: 'users.create', category: 'users', description: 'Crear usuarios.' },
  { key: 'users.update', category: 'users', description: 'Actualizar usuarios.' },
  { key: 'users.disable', category: 'users', description: 'Desactivar usuarios.' },
  { key: 'roles.read', category: 'roles', description: 'Ver roles.' },
  { key: 'roles.manage', category: 'roles', description: 'Administrar roles y permisos.' },
  { key: 'permissions.read', category: 'roles', description: 'Ver permisos disponibles.' },
  { key: 'security.sync', category: 'security', description: 'Sincronizar permisos, roles y menús base del tenant.' },
  { key: 'menus.read', category: 'menus', description: 'Ver menús.' },
  { key: 'forms.read', category: 'forms', description: 'Ver formularios.' },
  { key: 'forms.manage', category: 'forms', description: 'Administrar formularios.' },
  { key: 'forms.publish', category: 'forms', description: 'Publicar versiones de formularios.' },
  { key: 'forms.submit', category: 'forms', description: 'Enviar formularios publicados.' },
  { key: 'services.read', category: 'services', description: 'Ver servicios dinámicos.' },
  { key: 'services.manage', category: 'services', description: 'Administrar servicios dinámicos.' },
  { key: 'services.execute', category: 'services', description: 'Probar y ejecutar servicios dinámicos.' },
  { key: 'flows.read', category: 'flows', description: 'Ver flujos configurables.' },
  { key: 'flows.create', category: 'flows', description: 'Crear flujos configurables.' },
  { key: 'flows.update', category: 'flows', description: 'Actualizar flujos configurables.' },
  { key: 'flows.publish', category: 'flows', description: 'Publicar versiones de flujos.' },
  { key: 'flows.execute', category: 'flows', description: 'Probar y ejecutar flujos publicados.' },
  { key: 'flows.manage', category: 'flows', description: 'Administrar catálogo, reglas y acciones de flujos.' },
  { key: 'flows.audit', category: 'flows', description: 'Ver trazabilidad técnica de flujos.' },
  { key: 'ai.assistant.use', category: 'ai', description: 'Usar el asistente IA para generar propuestas.' },
  { key: 'ai.assistant.manage', category: 'ai', description: 'Administrar configuración y conocimiento del asistente IA.' },
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
      'database.design',
      'users.read',
      'users.create',
      'users.update',
      'users.disable',
      'roles.read',
      'permissions.read',
      'security.sync',
      'menus.read',
      'forms.read',
      'forms.manage',
      'forms.publish',
      'forms.submit',
      'services.read',
      'services.manage',
      'services.execute',
      'flows.read',
      'flows.create',
      'flows.update',
      'flows.publish',
      'flows.execute',
      'flows.manage',
      'flows.audit',
      'ai.assistant.use',
      'ai.assistant.manage',
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
      'forms.submit',
      'services.read',
      'services.execute',
      'ai.assistant.use',
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
    permissions: ['menus.read', 'forms.read', 'ai.assistant.use', 'records.read', 'files.read']
  },
  {
    key: 'client',
    name: 'Cliente app',
    description: 'Cliente o usuario externo que usa la app del tenant con acceso limitado.',
    permissions: ['menus.read', 'forms.read', 'forms.submit', 'records.read', 'records.create', 'files.upload', 'files.read']
  }
];
