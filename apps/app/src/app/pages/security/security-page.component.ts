import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { AppMenuService } from '../../core/navigation/app-menu.service';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { AdminActionToolbarComponent } from '../../shared/admin-action-toolbar/admin-action-toolbar.component';
import { AdminFilterBarComponent } from '../../shared/admin-filter-bar/admin-filter-bar.component';
import { AdminMetricCardComponent } from '../../shared/admin-metric-card/admin-metric-card.component';
import { AdminPanelComponent } from '../../shared/admin-panel/admin-panel.component';
import {
  AssignmentChecklistComponent,
  AssignmentChecklistOption
} from '../../shared/assignment-checklist/assignment-checklist.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import {
  SegmentedControlComponent,
  SegmentedControlItem
} from '../../shared/segmented-control/segmented-control.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';

interface SecurityUser {
  id: string;
  email: string;
  name?: string | null;
  systemRole: string;
  active: boolean;
  roles: string[];
}

interface SecurityUsersResponse {
  items: SecurityUser[];
  total: number;
  page: number;
  pageSize: number;
}

interface SecurityRole {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  builtIn: boolean;
  permissions: string[];
}

interface SecurityPermission {
  id: string;
  key: string;
  category: string;
  description?: string | null;
}

type RoleResourceMode = 'all' | 'selected' | 'none';
type RoleResourceType = 'dynamic_service' | 'flow';

interface RoleResourceItem {
  id: string;
  key: string;
  name: string;
  active: boolean;
  published: boolean;
}

interface RoleResourceAccessResponse {
  role: { id: string; key: string; name: string };
  policies: Record<RoleResourceType, { mode: RoleResourceMode; resourceIds: string[] }>;
  resources: Record<RoleResourceType, RoleResourceItem[]>;
}

interface AuditEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface SecuritySyncResponse {
  ok: true;
  memberships: {
    membershipsCreated: number;
  };
  rbac: {
    permissionsCreated: number;
    permissionsUpdated: number;
    rolesCreated: number;
    rolesUpdated: number;
    rolePermissionsAdded: number;
  };
  menus: {
    menusCreated: number;
    menusUpdated: number;
  };
}

type SecurityTab = 'users' | 'roles' | 'audit';
type UserStatusFilter = 'all' | 'active' | 'inactive';
type UserPanelMode = 'create' | 'edit';
type RolePanelMode = 'create' | 'edit';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [
    AdminActionToolbarComponent,
    AdminFilterBarComponent,
    AdminMetricCardComponent,
    AdminPanelComponent,
    AssignmentChecklistComponent,
    CatalogItemComponent,
    DynamicFieldControlComponent,
    FormsModule,
    LoadingSkeletonComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    SegmentedControlComponent,
    StatusNoticeComponent,
    UiKitButtonComponent
  ],
  styles: [
    `
      .panel,
      .row {
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      a,
      button {
        min-height: 36px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 8px 12px;
        text-decoration: none;
        font: inherit;
        font-weight: 800;
      }

      button.primary {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      button.danger {
        border-color: var(--ch-color-danger);
        color: var(--ch-color-danger);
      }

      button:disabled {
        opacity: 0.55;
      }

      .shell {
        display: grid;
        gap: 18px;
      }

      .panel {
        display: grid;
        align-content: start;
        gap: 14px;
        border-radius: 8px;
        padding: 18px;
      }

      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 18px;
        align-items: start;
      }

      .overview {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .stat-card {
        display: grid;
        gap: 6px;
        min-height: 94px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 14px;
      }

      .stat-card strong {
        color: var(--ch-color-text);
        font-size: 1.1rem;
        overflow-wrap: anywhere;
      }

      .section-title {
        display: grid;
        gap: 4px;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        color: var(--ch-color-text);
        font-size: 1.8rem;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.1rem;
      }

      h3 {
        color: var(--ch-color-text);
        font-size: 0.95rem;
      }

      p,
      .meta {
        color: var(--ch-color-muted);
        line-height: 1.5;
      }

      label {
        display: grid;
        align-content: start;
        gap: 7px;
        color: var(--ch-color-text);
        font-weight: 750;
      }

      input,
      select {
        box-sizing: border-box;
        width: 100%;
        min-height: 40px;
        height: 40px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 9px 11px;
        font: inherit;
      }

      input[type='checkbox'] {
        width: auto;
        min-height: auto;
        height: auto;
        padding: 0;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        align-items: start;
        align-content: start;
      }

      .tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tab {
        width: auto;
        min-width: 132px;
      }

      .tab.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      .security-layout {
        display: grid;
        grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.4fr);
        gap: 18px;
        align-items: start;
      }

      .toolbar {
        display: grid;
        gap: 10px;
      }

      .filter-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .user-list {
        display: grid;
        gap: 8px;
        max-height: 620px;
        overflow: auto;
        padding-right: 4px;
      }

      .user-card {
        display: grid;
        gap: 6px;
        width: 100%;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 12px;
        color: var(--ch-color-text);
        text-align: left;
      }

      .user-card.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary-soft);
      }

      .user-card strong,
      .user-card span {
        overflow-wrap: anywhere;
      }

      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .pill {
        border-radius: 999px;
        background: var(--ch-color-surface-muted);
        color: var(--ch-color-text);
        padding: 4px 8px;
        font-size: 0.8rem;
        font-weight: 800;
      }

      .pill.warn {
        background: var(--ch-color-surface)2e5;
        color: var(--ch-color-warning);
      }

      .pill.ok {
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
      }

      .detail-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }

      .detail-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .row {
        display: grid;
        gap: 10px;
        border-radius: 8px;
        padding: 14px;
      }

      .row-header {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .checks {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .check {
        display: flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        background: var(--ch-color-surface-muted);
        padding: 6px 9px;
        color: var(--ch-color-text);
        font-size: 0.86rem;
      }

      .resource-access-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .resource-access {
        display: grid;
        align-content: start;
        gap: 10px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .resource-list {
        display: grid;
        gap: 7px;
        max-height: 280px;
        overflow: auto;
      }

      .resource-option {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        border: 1px solid var(--ch-color-border);
        border-radius: 7px;
        background: var(--ch-color-surface);
        padding: 9px;
      }

      .resource-option span {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .resource-option small {
        color: var(--ch-color-muted);
        overflow-wrap: anywhere;
      }

      .resource-state {
        color: var(--ch-color-success);
        font-size: 0.74rem;
        font-weight: 850;
      }

      .resource-state.inactive {
        color: var(--ch-color-warning);
      }

      .audit {
        display: grid;
        gap: 8px;
        max-height: 520px;
        overflow: auto;
        padding-right: 4px;
      }

      .header-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .header-row .actions {
        justify-content: flex-end;
      }

      @media (max-width: 860px) {
        .grid,
        .form-grid,
        .filter-grid,
        .security-layout,
        .resource-access-grid,
        .overview {
          grid-template-columns: 1fr;
        }

        .header-row {
          display: grid;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Seguridad">
      <div class="shell">
        <app-module-header
          eyebrow="Administración del tenant"
          title="Seguridad y acceso"
          description="Controla organización, usuarios, roles, permisos y auditoría desde un mismo módulo."
          badge="RBAC"
        ></app-module-header>

        <app-admin-panel
          title="Resumen operativo"
          description="Estado actual de identidad y autorización de la organización."
        >
          <app-admin-action-toolbar panel-actions>
            <app-ui-kit-button
              [label]="syncing ? 'Sincronizando...' : 'Sincronizar seguridad'"
              tone="primary"
              [disabled]="!canManageRoles || syncing"
              (pressed)="syncSecurity()"
            ></app-ui-kit-button>
          </app-admin-action-toolbar>
          <div class="overview">
            <app-admin-metric-card
              label="Organización actual"
              [value]="tenantName"
              [detail]="tenantSlug"
              tone="primary"
            ></app-admin-metric-card>
            <app-admin-metric-card
              label="Usuarios"
              [value]="usersTotal + ''"
              detail="Registrados según filtros actuales"
            ></app-admin-metric-card>
            <app-admin-metric-card
              label="Roles"
              [value]="roles.length + ''"
              [detail]="permissions.length + ' permisos disponibles'"
            ></app-admin-metric-card>
            <app-admin-metric-card
              label="Clientes y personas"
              value="Modelo del tenant"
              detail="Se administrarán como entidades de negocio, no como usuarios de login."
            ></app-admin-metric-card>
          </div>
          @if (loading) {
            <app-loading-skeleton
              variant="list"
              label="Cargando seguridad"
              [rows]="3"
            ></app-loading-skeleton>
          } @else if (message) {
            <app-status-notice tone="info">{{ message }}</app-status-notice>
          }
        </app-admin-panel>

        <app-segmented-control
          [items]="securityTabOptions"
          [value]="securityTab"
          ariaLabel="Secciones de seguridad"
          (valueChange)="setSecurityTab($event)"
        ></app-segmented-control>

        @if (securityTab === 'users') {
          <section class="security-layout">
            <aside class="panel">
              <div class="header-row">
                <div class="section-title">
                  <h2>Usuarios del tenant</h2>
                  <p class="meta">Página {{ userPage }} · {{ users.length }} de {{ usersTotal }} usuarios encontrados.</p>
                </div>
                <app-ui-kit-button
                  label="Nuevo"
                  tone="primary"
                  [disabled]="!canCreateUsers"
                  (pressed)="startCreateUser()"
                ></app-ui-kit-button>
              </div>

              <app-admin-filter-bar ariaLabel="User filters" minColumnWidth="160px">
                <app-dynamic-field-control
                  [field]="userSearchField"
                  [value]="userSearch"
                  (valueChange)="setUserSearch($event)"
                ></app-dynamic-field-control>
                <app-dynamic-field-control
                  [field]="userStatusField"
                  [value]="userStatusFilter"
                  (valueChange)="setUserStatus($event)"
                ></app-dynamic-field-control>
                <app-dynamic-field-control
                  [field]="userRoleFilterField"
                  [value]="userRoleFilter"
                  (valueChange)="setUserRoleFilter($event)"
                ></app-dynamic-field-control>
              </app-admin-filter-bar>

              <div class="user-list">
                @for (user of users; track user.id) {
                  <app-catalog-item
                    [title]="user.name || 'Sin nombre'"
                    [meta]="user.email + ' · ' + (user.active ? 'Activo' : 'Inactivo')"
                    [detail]="user.roles.join(', ') || 'Sin roles asignados'"
                    [active]="selectedUser?.id === user.id && userPanelMode === 'edit'"
                    (selected)="selectUser(user)"
                  ></app-catalog-item>
                } @empty {
                  <app-status-notice tone="info">No hay usuarios con esos filtros.</app-status-notice>
                }
              </div>
              <div class="actions">
                <app-ui-kit-button
                  label="Anterior"
                  tone="secondary"
                  variant="outline"
                  [disabled]="userPage <= 1"
                  (pressed)="loadUsers(userPage - 1)"
                ></app-ui-kit-button>
                <app-ui-kit-button
                  label="Siguiente"
                  tone="primary"
                  [disabled]="userPage >= userTotalPages"
                  (pressed)="loadUsers(userPage + 1)"
                ></app-ui-kit-button>
              </div>
            </aside>

            <section class="panel">
              @if (userPanelMode === 'create') {
                <div class="section-title">
                  <h2>Crear usuario de acceso</h2>
                  <p class="meta">Crea una cuenta para alguien que inicia sesión en esta organización.</p>
                </div>
                <div class="form-grid">
                  <app-dynamic-field-control
                    [field]="newUserEmailField"
                    [value]="newUser.email"
                    (valueChange)="newUser.email = asString($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="newUserNameField"
                    [value]="newUser.name"
                    (valueChange)="newUser.name = asString($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="newUserPasswordField"
                    [value]="newUser.password"
                    (valueChange)="newUser.password = asString($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="newUserRoleField"
                    [value]="newUser.role"
                    (valueChange)="newUser.role = asString($event)"
                  ></app-dynamic-field-control>
                </div>
                <app-ui-kit-button
                  label="Crear usuario"
                  tone="primary"
                  [disabled]="!canCreateUsers"
                  (pressed)="createUser()"
                ></app-ui-kit-button>
              } @else if (selectedUser) {
                <div class="detail-head">
                  <div class="section-title">
                    <h2>{{ selectedUser.name || 'Usuario sin nombre' }}</h2>
                    <p class="meta">{{ selectedUser.email }} · {{ selectedUser.active ? 'Activo' : 'Inactivo' }}</p>
                  </div>
                  <div class="detail-actions">
                    <app-ui-kit-button
                      [label]="selectedUser.active ? 'Desactivar acceso' : 'Activar acceso'"
                      tone="danger"
                      variant="outline"
                      [disabled]="!canUpdateUsers || selectedUser.id === auth.state.session()?.user?.id"
                      (pressed)="toggleUser(selectedUser)"
                    ></app-ui-kit-button>
                  </div>
                </div>

                <div class="form-grid">
                  <app-dynamic-field-control
                    [field]="userEditorNameField"
                    [value]="userEditor.name"
                    (valueChange)="userEditor.name = asString($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="userEditorPasswordField"
                    [value]="userEditor.password"
                    (valueChange)="userEditor.password = asString($event)"
                  ></app-dynamic-field-control>
                </div>

                <div class="section-title">
                  <h3>Roles asignados</h3>
                  <p class="meta">Estos roles definen el acceso efectivo dentro del tenant.</p>
                </div>
                <app-assignment-checklist
                  variant="pills"
                  [options]="userRoleOptions(selectedUser)"
                  [disabled]="!canManageRoles"
                  emptyText="Todavía no hay roles disponibles."
                  (optionToggle)="toggleUserRole(selectedUser, $event)"
                ></app-assignment-checklist>

                <app-ui-kit-button
                  label="Guardar cambios"
                  tone="primary"
                  [disabled]="!canUpdateUsers"
                  (pressed)="saveSelectedUser()"
                ></app-ui-kit-button>
              } @else {
                <app-status-notice tone="info">Selecciona un usuario o crea uno nuevo.</app-status-notice>
              }
            </section>
          </section>
        }

        @if (securityTab === 'roles') {
          <section class="security-layout">
            <aside class="panel">
              <div class="header-row">
                <div class="section-title">
                  <h2>Roles</h2>
                  <p class="meta">{{ roles.length }} perfiles disponibles.</p>
                </div>
                <app-ui-kit-button
                  label="Nuevo"
                  tone="primary"
                  [disabled]="!canManageRoles"
                  (pressed)="startCreateRole()"
                ></app-ui-kit-button>
              </div>

              <div class="user-list">
                @for (role of roles; track role.id) {
                  <app-catalog-item
                    [title]="role.name"
                    [meta]="role.key + ' · ' + (role.builtIn ? 'base del sistema' : 'custom')"
                    [detail]="role.permissions.length + ' permisos'"
                    [active]="selectedRole?.id === role.id && rolePanelMode === 'edit'"
                    (selected)="selectRole(role)"
                  ></app-catalog-item>
                }
              </div>
            </aside>

            <section class="panel">
              @if (rolePanelMode === 'create') {
                <div class="section-title">
                  <h2>Crear rol</h2>
                  <p class="meta">Crea un perfil custom para este tenant.</p>
                </div>
                <div class="form-grid">
                  <app-dynamic-field-control
                    [field]="roleKeyField"
                    [value]="roleDraft.key"
                    (valueChange)="roleDraft.key = asString($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="roleNameField"
                    [value]="roleDraft.name"
                    (valueChange)="roleDraft.name = asString($event)"
                  ></app-dynamic-field-control>
                </div>
                <app-dynamic-field-control
                  [field]="roleDescriptionField"
                  [value]="roleDraft.description"
                  (valueChange)="roleDraft.description = asString($event)"
                ></app-dynamic-field-control>
                <app-ui-kit-button
                  label="Crear rol"
                  tone="primary"
                  [disabled]="!canManageRoles"
                  (pressed)="createRole()"
                ></app-ui-kit-button>
              } @else if (selectedRole) {
                <div class="detail-head">
                  <div class="section-title">
                    <h2>{{ selectedRole.name }}</h2>
                    <p class="meta">{{ selectedRole.key }} · {{ selectedRole.builtIn ? 'rol base' : 'rol custom' }}</p>
                  </div>
                  @if (!selectedRole.builtIn) {
                    <app-ui-kit-button
                      label="Eliminar rol"
                      tone="danger"
                      variant="outline"
                      [disabled]="!canManageRoles"
                      (pressed)="deleteSelectedRole()"
                    ></app-ui-kit-button>
                  }
                </div>
                <div class="form-grid">
                  <app-dynamic-field-control
                    [field]="roleNameField"
                    [value]="roleDraft.name"
                    [disabled]="selectedRole.key === 'owner'"
                    (valueChange)="roleDraft.name = asString($event)"
                  ></app-dynamic-field-control>
                  <app-dynamic-field-control
                    [field]="roleDescriptionField"
                    [value]="roleDraft.description"
                    [disabled]="selectedRole.key === 'owner'"
                    (valueChange)="roleDraft.description = asString($event)"
                  ></app-dynamic-field-control>
                </div>
                <div class="section-title">
                  <h3>Permisos</h3>
                  <p class="meta">Marca las capacidades que tendrá este rol.</p>
                </div>
                <app-assignment-checklist
                  variant="pills"
                  [options]="rolePermissionOptions(selectedRole)"
                  [disabled]="!canManageRoles || selectedRole.key === 'owner'"
                  emptyText="Todavía no hay permisos disponibles."
                  (optionToggle)="toggleRolePermission(selectedRole, $event)"
                ></app-assignment-checklist>
                <div class="section-title">
                  <h3>Servicios y flows disponibles</h3>
                  <p class="meta">
                    El permiso general permite ejecutar; esta selección limita cuáles recursos concretos puede usar el
                    rol.
                  </p>
                </div>
                @if (roleResourceAccess) {
                  <div class="resource-access-grid">
                    @for (resourceType of resourceTypes; track resourceType.key) {
                      <section class="resource-access">
                        <div class="section-title">
                          <h3>{{ resourceType.label }}</h3>
                          <p class="meta">{{ resourceType.description }}</p>
                        </div>
                        @if (!selectedRole.permissions.includes(resourcePermission(resourceType.key))) {
                          <app-status-notice tone="warning">
                            Activa primero el permiso <strong>{{ resourcePermission(resourceType.key) }}</strong
                            >. La selección por sí sola no concede ejecución.
                          </app-status-notice>
                        }
                        <app-dynamic-field-control
                          [field]="resourceModeField(resourceType.label)"
                          [value]="roleResourceAccess.policies[resourceType.key].mode"
                          [disabled]="!canManageRoles || selectedRole.key === 'owner'"
                          (valueChange)="setResourceMode(resourceType.key, $event)"
                        ></app-dynamic-field-control>
                        @if (roleResourceAccess.policies[resourceType.key].mode === 'selected') {
                          <app-assignment-checklist
                            [options]="roleResourceOptions(resourceType.key)"
                            [disabled]="!canManageRoles || selectedRole.key === 'owner'"
                            emptyText="Todavía no hay recursos de este tipo."
                            (optionToggle)="toggleRoleResource(resourceType.key, $event)"
                          ></app-assignment-checklist>
                        } @else {
                          <app-status-notice tone="info">
                            {{
                              roleResourceAccess.policies[resourceType.key].mode === 'all'
                                ? 'El rol podrá usar recursos actuales y los que se publiquen después.'
                                : 'El rol no podrá ejecutar ningún recurso de este tipo.'
                            }}
                          </app-status-notice>
                        }
                      </section>
                    }
                  </div>
                  <app-ui-kit-button
                    [label]="savingRoleResources ? 'Guardando acceso...' : 'Guardar acceso a servicios y flows'"
                    tone="primary"
                    [disabled]="!canManageRoles || selectedRole.key === 'owner' || savingRoleResources"
                    (pressed)="saveRoleResources()"
                  ></app-ui-kit-button>
                } @else {
                  <app-status-notice tone="info">Cargando recursos asignados al rol...</app-status-notice>
                }
                <app-ui-kit-button
                  label="Guardar rol"
                  tone="primary"
                  [disabled]="!canManageRoles || selectedRole.key === 'owner'"
                  (pressed)="saveSelectedRole()"
                ></app-ui-kit-button>
              }
            </section>
          </section>
        }

        @if (securityTab === 'audit') {
          <section class="panel">
            <div class="section-title">
              <h2>Auditoría reciente</h2>
              <p class="meta">Cambios sensibles de usuarios, roles, servicios y configuración.</p>
            </div>
            <div class="audit">
              @for (event of audit; track event.id) {
                <div class="row">
                  <strong>{{ event.action }}</strong>
                  <span class="meta">{{ event.resourceType }} · {{ event.createdAt }}</span>
                </div>
              } @empty {
                <app-status-notice tone="info">Todavía no hay eventos de auditoría.</app-status-notice>
              }
            </div>
          </section>
        }
      </div>
    </app-page-shell>
  `
})
export class SecurityPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly menu = inject(AppMenuService);
  private usersReloadTimer?: ReturnType<typeof setTimeout>;
  readonly auth = inject(AuthService);

  users: SecurityUser[] = [];
  usersTotal = 0;
  userPage = 1;
  userPageSize = 25;
  roles: SecurityRole[] = [];
  permissions: SecurityPermission[] = [];
  audit: AuditEvent[] = [];
  roleResourceAccess?: RoleResourceAccessResponse;
  savingRoleResources = false;
  readonly resourceTypes: Array<{
    key: RoleResourceType;
    label: string;
    description: string;
  }> = [
    {
      key: 'dynamic_service',
      label: 'Servicios dinámicos',
      description: 'Llamadas directas disponibles para pantallas y componentes.'
    },
    {
      key: 'flow',
      label: 'Flows publicados',
      description: 'Procesos completos que este rol puede iniciar.'
    }
  ];
  securityTab: SecurityTab = 'users';
  userStatusFilter: UserStatusFilter = 'all';
  userPanelMode: UserPanelMode = 'create';
  rolePanelMode: RolePanelMode = 'create';
  userSearch = '';
  userRoleFilter = '';
  selectedUserId = '';
  selectedRoleId = '';
  userEditor = {
    name: '',
    password: ''
  };
  roleDraft = {
    key: '',
    name: '',
    description: ''
  };
  message = '';
  loading = true;
  syncing = false;
  newUser = {
    email: '',
    name: '',
    password: '',
    role: 'viewer'
  };

  readonly userSearchField: RuntimeField = {
    name: 'userSearch',
    type: 'text',
    label: 'Buscar',
    placeholder: 'Email, nombre o rol'
  };
  readonly userStatusField: RuntimeField = {
    name: 'userStatus',
    type: 'select',
    label: 'Estado',
    options: [
      { label: 'Todos', value: 'all' },
      { label: 'Activos', value: 'active' },
      { label: 'Inactivos', value: 'inactive' }
    ]
  };
  readonly newUserEmailField: RuntimeField = {
    name: 'newUserEmail',
    type: 'email',
    label: 'Email',
    placeholder: 'cliente@example.com',
    required: true
  };
  readonly newUserNameField: RuntimeField = {
    name: 'newUserName',
    type: 'text',
    label: 'Nombre',
    placeholder: 'Nombre visible'
  };
  readonly newUserPasswordField: RuntimeField = {
    name: 'newUserPassword',
    type: 'password',
    label: 'Password temporal',
    placeholder: 'Clave temporal',
    required: true
  };
  readonly userEditorNameField: RuntimeField = {
    name: 'userEditorName',
    type: 'text',
    label: 'Nombre visible',
    placeholder: 'Nombre del usuario'
  };
  readonly userEditorPasswordField: RuntimeField = {
    name: 'userEditorPassword',
    type: 'password',
    label: 'Resetear contraseña',
    placeholder: 'Deja vacío para no cambiarla'
  };
  readonly roleKeyField: RuntimeField = {
    name: 'roleKey',
    type: 'text',
    label: 'Key',
    placeholder: 'supervisor',
    required: true
  };
  readonly roleNameField: RuntimeField = {
    name: 'roleName',
    type: 'text',
    label: 'Nombre',
    placeholder: 'Supervisor',
    required: true
  };
  readonly roleDescriptionField: RuntimeField = {
    name: 'roleDescription',
    type: 'text',
    label: 'Descripción',
    placeholder: 'Qué puede hacer este perfil'
  };
  private readonly resourceModeOptions = [
    { label: 'Todos los actuales y futuros', value: 'all' },
    { label: 'Solo seleccionados', value: 'selected' },
    { label: 'Ninguno', value: 'none' }
  ];
  readonly securityTabOptions: SegmentedControlItem[] = [
    { key: 'users', label: 'Usuarios' },
    { key: 'roles', label: 'Roles y permisos' },
    { key: 'audit', label: 'Auditoría' }
  ];

  get userRoleFilterField(): RuntimeField {
    return {
      name: 'userRoleFilter',
      type: 'select',
      label: 'Rol',
      options: [
        { label: 'Todos', value: '' },
        ...this.roles.map((role) => ({ label: role.name, value: role.key }))
      ]
    };
  }

  get newUserRoleField(): RuntimeField {
    return {
      name: 'newUserRole',
      type: 'select',
      label: 'Rol inicial',
      options: this.roles.map((role) => ({ label: role.name, value: role.key }))
    };
  }

  get canCreateUsers() {
    return this.auth.state.hasPermission('users.create');
  }

  get canUpdateUsers() {
    return this.auth.state.hasPermission('users.update') || this.auth.state.hasPermission('users.disable');
  }

  get canManageRoles() {
    return this.auth.state.hasPermission('roles.manage');
  }

  get tenantName() {
    return this.auth.state.session()?.tenant.name ?? 'Tenant actual';
  }

  get tenantSlug() {
    return this.auth.state.session()?.tenant.slug ?? 'sin-slug';
  }

  get activeUsers() {
    return this.users.filter((user) => user.active).length;
  }

  get userTotalPages() {
    return Math.max(1, Math.ceil(this.usersTotal / this.userPageSize));
  }

  get selectedUser() {
    return this.users.find((user) => user.id === this.selectedUserId);
  }

  get selectedRole() {
    return this.roles.find((role) => role.id === this.selectedRoleId);
  }

  ngOnInit() {
    this.load();
  }

  asString(value: unknown) {
    return value == null ? '' : String(value);
  }

  setUserSearch(value: unknown) {
    this.userSearch = this.asString(value);
    this.scheduleUsersReload();
  }

  setUserStatus(value: unknown) {
    const next = this.asString(value);
    this.userStatusFilter = next === 'active' || next === 'inactive' ? next : 'all';
    this.loadUsers(1);
  }

  setUserRoleFilter(value: unknown) {
    this.userRoleFilter = this.asString(value);
    this.loadUsers(1);
  }

  setSecurityTab(value: string) {
    if (value === 'users' || value === 'roles' || value === 'audit') {
      this.securityTab = value;
    }
  }

  resourceModeField(label: string): RuntimeField {
    return {
      name: `resourceMode${label.replace(/\W+/g, '')}`,
      type: 'select',
      label: 'Alcance',
      options: this.resourceModeOptions
    };
  }

  setResourceMode(resourceType: RoleResourceType, value: unknown) {
    const mode = this.asString(value);
    const policy = this.roleResourceAccess?.policies[resourceType];
    if (!policy) {
      return;
    }
    policy.mode = mode === 'selected' || mode === 'none' ? mode : 'all';
  }

  userRoleOptions(user: SecurityUser): AssignmentChecklistOption[] {
    return this.roles.map((role) => ({
      key: role.key,
      label: role.name,
      checked: user.roles.includes(role.key)
    }));
  }

  rolePermissionOptions(role: SecurityRole): AssignmentChecklistOption[] {
    return this.permissions.map((permission) => ({
      key: permission.key,
      label: permission.key,
      description: permission.description || permission.category,
      checked: role.permissions.includes(permission.key)
    }));
  }

  roleResourceOptions(resourceType: RoleResourceType): AssignmentChecklistOption[] {
    if (!this.roleResourceAccess) {
      return [];
    }
    const selectedResourceIds = this.roleResourceAccess.policies[resourceType].resourceIds;
    return this.roleResourceAccess.resources[resourceType].map((resource) => ({
      key: resource.id,
      label: resource.name,
      description: resource.key,
      statusLabel: resource.active && resource.published ? 'Disponible' : 'No publicado',
      statusTone: resource.active && resource.published ? 'success' : 'warning',
      checked: selectedResourceIds.includes(resource.id)
    }));
  }

  load() {
    this.loading = true;
    this.message = 'Cargando seguridad...';
    this.api.get<SecurityRole[]>('roles').subscribe({
      next: (roles) => {
        this.roles = roles;
        this.newUser.role = roles.find((role) => role.key === 'viewer')?.key ?? roles[0]?.key ?? 'viewer';
        if (!this.selectedRoleId && roles.length) {
          this.selectRole(roles[0]);
        }
      }
    });
    this.api.get<SecurityPermission[]>('permissions').subscribe({ next: (permissions) => (this.permissions = permissions) });
    this.loadUsers(1);
    this.api.get<AuditEvent[]>('audit').subscribe({
      next: (audit) => {
        this.audit = audit;
        this.loading = false;
        this.message = '';
      },
      error: () => {
        this.loading = false;
        this.message = 'No se pudo cargar toda la información de seguridad.';
      }
    });
  }

  createUser() {
    this.api
      .post<SecurityUser>('users', {
        email: this.newUser.email,
        name: this.newUser.name,
        password: this.newUser.password,
        roles: [this.newUser.role]
      })
      .subscribe({
        next: (user) => {
          this.newUser = { email: '', name: '', password: '', role: this.newUser.role };
          this.selectUser(user);
          this.message = 'Usuario creado.';
          this.loadUsers(1);
          this.reloadAudit();
        },
        error: () => {
          this.message = 'No se pudo crear el usuario.';
        }
      });
  }

  loadUsers(page = this.userPage) {
    if (this.usersReloadTimer) {
      clearTimeout(this.usersReloadTimer);
      this.usersReloadTimer = undefined;
    }
    const nextPage = Math.max(1, page);
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(this.userPageSize),
      status: this.userStatusFilter
    });
    if (this.userSearch.trim()) {
      params.set('search', this.userSearch.trim());
    }
    if (this.userRoleFilter) {
      params.set('role', this.userRoleFilter);
    }

    this.api.get<SecurityUsersResponse>(`users?${params.toString()}`).subscribe({
      next: (response) => {
        this.users = response.items;
        this.usersTotal = response.total;
        this.userPage = response.page;
        this.userPageSize = response.pageSize;
        if (this.selectedUserId && !this.users.some((user) => user.id === this.selectedUserId)) {
          this.startCreateUser();
        } else if (!this.selectedUserId && this.users.length) {
          this.selectUser(this.users[0]);
        }
      },
      error: () => {
        this.message = 'No se pudieron cargar los usuarios.';
      }
    });
  }

  scheduleUsersReload() {
    if (this.usersReloadTimer) {
      clearTimeout(this.usersReloadTimer);
    }
    this.usersReloadTimer = setTimeout(() => this.loadUsers(1), 250);
  }

  toggleUser(user: SecurityUser) {
    this.api.patch<SecurityUser>(`users/${user.id}`, { active: !user.active }).subscribe({
      next: (updated) => {
        this.users = this.users.map((item) => (item.id === updated.id ? updated : item));
        this.reloadAudit();
      }
    });
  }

  startCreateUser() {
    this.userPanelMode = 'create';
    this.selectedUserId = '';
    this.userEditor = { name: '', password: '' };
    this.newUser = { email: '', name: '', password: '', role: this.newUser.role };
  }

  selectUser(user: SecurityUser) {
    this.userPanelMode = 'edit';
    this.selectedUserId = user.id;
    this.userEditor = {
      name: user.name ?? '',
      password: ''
    };
  }

  saveSelectedUser() {
    const user = this.selectedUser;
    if (!user) {
      return;
    }
    const password = this.userEditor.password.trim();
    this.api
      .patch<SecurityUser>(`users/${user.id}`, {
        name: this.userEditor.name,
        ...(password ? { password } : {})
      })
      .subscribe({
        next: (updated) => {
          this.users = this.users.map((item) => (item.id === updated.id ? updated : item));
          this.selectUser(updated);
          this.message = password ? 'Usuario actualizado y contraseña reiniciada.' : 'Usuario actualizado.';
          this.reloadAudit();
        },
        error: () => {
          this.message = 'No se pudo actualizar el usuario.';
        }
      });
  }

  toggleUserRole(user: SecurityUser, roleKey: string) {
    const roles = user.roles.includes(roleKey)
      ? user.roles.filter((item) => item !== roleKey)
      : [...user.roles, roleKey];
    this.api.put<SecurityUser>(`users/${user.id}/roles`, { roles }).subscribe({
      next: (updated) => {
        this.users = this.users.map((item) => (item.id === updated.id ? updated : item));
        this.reloadAudit();
      },
      error: () => {
        this.message = 'No se pudieron actualizar roles del usuario.';
      }
    });
  }

  toggleRolePermission(role: SecurityRole, permissionKey: string) {
    role.permissions = role.permissions.includes(permissionKey)
      ? role.permissions.filter((item) => item !== permissionKey)
      : [...role.permissions, permissionKey].sort();
  }

  startCreateRole() {
    this.rolePanelMode = 'create';
    this.selectedRoleId = '';
    this.roleResourceAccess = undefined;
    this.roleDraft = { key: '', name: '', description: '' };
  }

  selectRole(role: SecurityRole) {
    this.rolePanelMode = 'edit';
    this.selectedRoleId = role.id;
    this.roleResourceAccess = undefined;
    this.roleDraft = {
      key: role.key,
      name: role.name,
      description: role.description ?? ''
    };
    this.loadRoleResources(role.id);
  }

  loadRoleResources(roleId: string) {
    this.api.get<RoleResourceAccessResponse>(`roles/${roleId}/resources`).subscribe({
      next: (access) => {
        if (this.selectedRoleId === roleId) {
          this.roleResourceAccess = access;
        }
      },
      error: () => {
        if (this.selectedRoleId === roleId) {
          this.message = 'No se pudieron cargar los servicios y flows asignados al rol.';
        }
      }
    });
  }

  toggleRoleResource(resourceType: RoleResourceType, resourceId: string) {
    const policy = this.roleResourceAccess?.policies[resourceType];
    if (!policy) {
      return;
    }
    policy.resourceIds = policy.resourceIds.includes(resourceId)
      ? policy.resourceIds.filter((id) => id !== resourceId)
      : [...policy.resourceIds, resourceId];
  }

  resourcePermission(resourceType: RoleResourceType) {
    return resourceType === 'dynamic_service' ? 'services.execute' : 'flows.execute';
  }

  saveRoleResources() {
    const role = this.selectedRole;
    const access = this.roleResourceAccess;
    if (!role || !access || role.key === 'owner') {
      return;
    }
    this.savingRoleResources = true;
    forkJoin({
      services: this.api.put<RoleResourceAccessResponse>(`roles/${role.id}/resources/dynamic_service`, {
        ...access.policies.dynamic_service
      }),
      flows: this.api.put<RoleResourceAccessResponse>(`roles/${role.id}/resources/flow`, {
        ...access.policies.flow
      })
    }).subscribe({
      next: () => {
        this.savingRoleResources = false;
        this.message = 'Acceso a servicios y flows actualizado.';
        this.loadRoleResources(role.id);
        this.reloadAudit();
      },
      error: () => {
        this.savingRoleResources = false;
        this.message = 'No se pudo guardar el acceso a servicios y flows.';
      }
    });
  }

  createRole() {
    this.api
      .post<SecurityRole>('roles', {
        key: this.roleDraft.key,
        name: this.roleDraft.name,
        description: this.roleDraft.description,
        permissions: []
      })
      .subscribe({
        next: (role) => {
          this.roles = [...this.roles, role].sort((a, b) => a.key.localeCompare(b.key));
          this.selectRole(role);
          this.message = 'Rol creado.';
          this.reloadAudit();
        },
        error: () => {
          this.message = 'No se pudo crear el rol.';
        }
      });
  }

  saveSelectedRole() {
    const role = this.selectedRole;
    if (!role) {
      return;
    }
    this.api
      .patch<SecurityRole>(`roles/${role.id}`, {
        name: this.roleDraft.name,
        description: this.roleDraft.description,
        permissions: role.permissions
      })
      .subscribe({
        next: (updated) => {
          this.roles = this.roles.map((item) => (item.id === updated.id ? updated : item));
          this.selectRole(updated);
          this.message = 'Rol actualizado.';
          this.reloadAudit();
        },
        error: () => {
          this.message = 'No se pudo guardar el rol.';
        }
      });
  }

  deleteSelectedRole() {
    const role = this.selectedRole;
    if (!role) {
      return;
    }
    this.api.delete<{ ok: true }>(`roles/${role.id}`).subscribe({
      next: () => {
        this.roles = this.roles.filter((item) => item.id !== role.id);
        this.startCreateRole();
        this.message = 'Rol eliminado.';
        this.reloadAudit();
      },
      error: () => {
        this.message = 'No se pudo eliminar el rol. Verifica que no esté asignado a usuarios.';
      }
    });
  }

  saveRolePermissions(role: SecurityRole) {
    this.api.put<SecurityRole>(`roles/${role.id}/permissions`, { permissions: role.permissions }).subscribe({
      next: (updated) => {
        this.roles = this.roles.map((item) => (item.id === updated.id ? updated : item));
        this.message = 'Permisos actualizados.';
        this.reloadAudit();
      },
      error: () => {
        this.message = 'No se pudieron guardar los permisos.';
      }
    });
  }

  reloadAudit() {
    this.api.get<AuditEvent[]>('audit').subscribe({ next: (audit) => (this.audit = audit) });
  }

  syncSecurity() {
    this.syncing = true;
    this.message = 'Sincronizando permisos, roles y menús base...';
    this.api.post<SecuritySyncResponse>('security/sync', {}).subscribe({
      next: (response) => {
        this.message = [
          'Seguridad sincronizada.',
          `Memberships: +${response.memberships.membershipsCreated}.`,
          `Permisos: +${response.rbac.permissionsCreated}, actualizados ${response.rbac.permissionsUpdated}.`,
          `Roles: +${response.rbac.rolesCreated}, actualizados ${response.rbac.rolesUpdated}.`,
          `Asignaciones: +${response.rbac.rolePermissionsAdded}.`,
          `Menús: +${response.menus.menusCreated}, actualizados ${response.menus.menusUpdated}.`
        ].join(' ');
        this.syncing = false;
        this.auth.hydrate().then(() => {
          this.menu.reset();
          this.menu.loadCurrent();
          this.load();
        });
      },
      error: () => {
        this.message = 'No se pudo sincronizar seguridad.';
        this.syncing = false;
      }
    });
  }
}
