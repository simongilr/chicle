import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { AppMenuService } from '../../core/navigation/app-menu.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';

interface SecurityUser {
  id: string;
  email: string;
  name?: string | null;
  systemRole: string;
  active: boolean;
  roles: string[];
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

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [FormsModule, IonContent, MainNavComponent],
  styles: [
    `
      ion-content {
        --background: #f5f7fb;
      }

      .topbar,
      .panel,
      .row {
        border: 1px solid #d9e2ec;
        background: #ffffff;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 24px;
      }

      .brand {
        color: #12324f;
        font-weight: 850;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      a,
      button {
        min-height: 36px;
        border: 1px solid #c8d6e4;
        border-radius: 8px;
        background: #ffffff;
        color: #173b5f;
        padding: 8px 12px;
        text-decoration: none;
        font: inherit;
        font-weight: 800;
      }

      button.primary {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      button.danger {
        border-color: #b84234;
        color: #8b2f25;
      }

      button:disabled {
        opacity: 0.55;
      }

      .shell {
        display: grid;
        gap: 18px;
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px 0 54px;
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
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #f8fbfe;
        padding: 14px;
      }

      .stat-card strong {
        color: #102f4d;
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
        color: #102f4d;
        font-size: 1.8rem;
      }

      h2 {
        color: #173b5f;
        font-size: 1.1rem;
      }

      h3 {
        color: #173b5f;
        font-size: 0.95rem;
      }

      p,
      .meta {
        color: #526577;
        line-height: 1.5;
      }

      label {
        display: grid;
        align-content: start;
        gap: 7px;
        color: #173b5f;
        font-weight: 750;
      }

      input,
      select {
        box-sizing: border-box;
        width: 100%;
        min-height: 40px;
        height: 40px;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
        color: #102f4d;
        padding: 9px 11px;
        font: inherit;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        align-items: start;
        align-content: start;
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
        background: #edf4fb;
        padding: 6px 9px;
        color: #173b5f;
        font-size: 0.86rem;
      }

      .audit {
        display: grid;
        gap: 8px;
        max-height: 520px;
        overflow: auto;
        padding-right: 4px;
      }

      .message {
        border-radius: 8px;
        background: #eaf3fc;
        color: #254057;
        padding: 10px 12px;
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
    <ion-content class="ion-padding">
      <app-main-nav contextLabel="Seguridad" />

      <main class="shell">
        <section class="panel">
          <div class="header-row">
            <div>
              <h1>Seguridad y administración</h1>
              <p>Control operativo del tenant actual: organización, usuarios, roles, permisos y auditoría.</p>
            </div>
            <div class="actions">
              <button class="primary" type="button" (click)="syncSecurity()" [disabled]="!canManageRoles || syncing">
                {{ syncing ? 'Sincronizando...' : 'Sincronizar seguridad' }}
              </button>
            </div>
          </div>
          <div class="overview">
            <article class="stat-card">
              <span class="meta">Organización actual</span>
              <strong>{{ tenantName }}</strong>
              <span class="meta">{{ tenantSlug }}</span>
            </article>
            <article class="stat-card">
              <span class="meta">Usuarios</span>
              <strong>{{ activeUsers }} activos</strong>
              <span class="meta">{{ users.length }} registrados</span>
            </article>
            <article class="stat-card">
              <span class="meta">Roles</span>
              <strong>{{ roles.length }}</strong>
              <span class="meta">{{ permissions.length }} permisos disponibles</span>
            </article>
            <article class="stat-card">
              <span class="meta">Clientes y personas</span>
              <strong>Modelo del tenant</strong>
              <span class="meta">Se administrarán como entidades de negocio, no como usuarios de login.</span>
            </article>
          </div>
          @if (message) {
            <div class="message">{{ message }}</div>
          }
        </section>

        <section class="grid">
          <article class="panel">
            <div class="section-title">
              <h2>Crear usuario de acceso</h2>
              <p class="meta">Usuarios que pueden iniciar sesión en esta organización.</p>
            </div>
            <div class="form-grid">
              <label>Email <input type="email" [(ngModel)]="newUser.email" /></label>
              <label>Nombre <input type="text" [(ngModel)]="newUser.name" /></label>
              <label>Password <input type="password" [(ngModel)]="newUser.password" /></label>
              <label>Rol inicial
                <select [(ngModel)]="newUser.role">
                  @for (role of roles; track role.id) {
                    <option [value]="role.key">{{ role.name }}</option>
                  }
                </select>
              </label>
            </div>
            <button class="primary" type="button" (click)="createUser()" [disabled]="!canCreateUsers">
              Crear usuario
            </button>
          </article>

          <article class="panel">
            <div class="section-title">
              <h2>Auditoría reciente</h2>
              <p class="meta">Cambios sensibles de usuarios, roles y configuración.</p>
            </div>
            <div class="audit">
              @for (event of audit; track event.id) {
                <div class="row">
                  <strong>{{ event.action }}</strong>
                  <span class="meta">{{ event.resourceType }} · {{ event.createdAt }}</span>
                </div>
              }
            </div>
          </article>
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Usuarios del tenant</h2>
            <p class="meta">Administra estado de acceso y roles de cada usuario dentro de la organización actual.</p>
          </div>
          @for (user of users; track user.id) {
            <article class="row">
              <div class="row-header">
                <div>
                  <h3>{{ user.email }}</h3>
                  <p>{{ user.name || 'Sin nombre' }} · {{ user.active ? 'Activo' : 'Inactivo' }}</p>
                </div>
                <button
                  class="danger"
                  type="button"
                  (click)="toggleUser(user)"
                  [disabled]="!canUpdateUsers || user.id === auth.state.session()?.user?.id"
                >
                  {{ user.active ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
              <div class="checks">
                @for (role of roles; track role.id) {
                  <label class="check">
                    <input
                      type="checkbox"
                      [checked]="user.roles.includes(role.key)"
                      [disabled]="!canManageRoles"
                      (change)="toggleUserRole(user, role.key)"
                    />
                    {{ role.name }}
                  </label>
                }
              </div>
            </article>
          }
        </section>

        <section class="panel">
          <div class="section-title">
            <h2>Roles y permisos</h2>
            <p class="meta">Define qué puede hacer cada perfil. El rol owner conserva permisos del sistema.</p>
          </div>
          @for (role of roles; track role.id) {
            <article class="row">
              <div class="row-header">
                <div>
                  <h3>{{ role.name }}</h3>
                  <p>{{ role.description }}</p>
                </div>
                <button
                  class="primary"
                  type="button"
                  [disabled]="!canManageRoles || role.key === 'owner'"
                  (click)="saveRolePermissions(role)"
                >
                  Guardar permisos
                </button>
              </div>
              <div class="checks">
                @for (permission of permissions; track permission.id) {
                  <label class="check">
                    <input
                      type="checkbox"
                      [checked]="role.permissions.includes(permission.key)"
                      [disabled]="!canManageRoles || role.key === 'owner'"
                      (change)="toggleRolePermission(role, permission.key)"
                    />
                    {{ permission.key }}
                  </label>
                }
              </div>
            </article>
          }
        </section>
      </main>
    </ion-content>
  `
})
export class SecurityPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly menu = inject(AppMenuService);
  readonly auth = inject(AuthService);

  users: SecurityUser[] = [];
  roles: SecurityRole[] = [];
  permissions: SecurityPermission[] = [];
  audit: AuditEvent[] = [];
  message = '';
  syncing = false;
  newUser = {
    email: '',
    name: '',
    password: '',
    role: 'viewer'
  };

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

  ngOnInit() {
    this.load();
  }

  load() {
    this.message = 'Cargando seguridad...';
    this.api.get<SecurityRole[]>('roles').subscribe({
      next: (roles) => {
        this.roles = roles;
        this.newUser.role = roles.find((role) => role.key === 'viewer')?.key ?? roles[0]?.key ?? 'viewer';
      }
    });
    this.api.get<SecurityPermission[]>('permissions').subscribe({ next: (permissions) => (this.permissions = permissions) });
    this.api.get<SecurityUser[]>('users').subscribe({ next: (users) => (this.users = users) });
    this.api.get<AuditEvent[]>('audit').subscribe({
      next: (audit) => {
        this.audit = audit;
        this.message = '';
      },
      error: () => {
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
          this.users = [...this.users, user].sort((a, b) => a.email.localeCompare(b.email));
          this.newUser = { email: '', name: '', password: '', role: this.newUser.role };
          this.message = 'Usuario creado.';
          this.reloadAudit();
        },
        error: () => {
          this.message = 'No se pudo crear el usuario.';
        }
      });
  }

  toggleUser(user: SecurityUser) {
    this.api.patch<SecurityUser>(`users/${user.id}`, { active: !user.active }).subscribe({
      next: (updated) => {
        this.users = this.users.map((item) => (item.id === updated.id ? updated : item));
        this.reloadAudit();
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
