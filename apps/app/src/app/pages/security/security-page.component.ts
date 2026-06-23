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
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
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
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
        color: #173b5f;
        text-align: left;
      }

      .user-card.active {
        border-color: #1554a2;
        background: #eef5ff;
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
        background: #edf4fb;
        color: #173b5f;
        padding: 4px 8px;
        font-size: 0.8rem;
        font-weight: 800;
      }

      .pill.warn {
        background: #fff2e5;
        color: #84531b;
      }

      .pill.ok {
        background: #e9f8ef;
        color: #17643a;
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
        .filter-grid,
        .security-layout,
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
              <strong>{{ usersTotal }}</strong>
              <span class="meta">registrados según filtros actuales</span>
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

        <nav class="tabs" aria-label="Secciones de seguridad">
          <button class="tab" type="button" [class.active]="securityTab === 'users'" (click)="securityTab = 'users'">
            Usuarios
          </button>
          <button class="tab" type="button" [class.active]="securityTab === 'roles'" (click)="securityTab = 'roles'">
            Roles y permisos
          </button>
          <button class="tab" type="button" [class.active]="securityTab === 'audit'" (click)="securityTab = 'audit'">
            Auditoría
          </button>
        </nav>

        @if (securityTab === 'users') {
          <section class="security-layout">
            <aside class="panel">
              <div class="header-row">
                <div class="section-title">
                  <h2>Usuarios del tenant</h2>
                  <p class="meta">Página {{ userPage }} · {{ users.length }} de {{ usersTotal }} usuarios encontrados.</p>
                </div>
                <button class="primary" type="button" (click)="startCreateUser()" [disabled]="!canCreateUsers">
                  Nuevo
                </button>
              </div>

              <div class="toolbar">
                <label>
                  Buscar
                  <input
                    type="search"
                    [(ngModel)]="userSearch"
                    (ngModelChange)="scheduleUsersReload()"
                    autocomplete="off"
                    placeholder="Email, nombre o rol"
                  />
                </label>
                <div class="filter-grid">
                  <label>
                    Estado
                    <select [(ngModel)]="userStatusFilter" (ngModelChange)="loadUsers(1)">
                      <option value="all">Todos</option>
                      <option value="active">Activos</option>
                      <option value="inactive">Inactivos</option>
                    </select>
                  </label>
                  <label>
                    Rol
                    <select [(ngModel)]="userRoleFilter" (ngModelChange)="loadUsers(1)">
                      <option value="">Todos</option>
                      @for (role of roles; track role.id) {
                        <option [value]="role.key">{{ role.name }}</option>
                      }
                    </select>
                  </label>
                </div>
              </div>

              <div class="user-list">
                @for (user of users; track user.id) {
                  <button
                    class="user-card"
                    type="button"
                    [class.active]="selectedUser?.id === user.id && userPanelMode === 'edit'"
                    (click)="selectUser(user)"
                  >
                    <strong>{{ user.name || 'Sin nombre' }}</strong>
                    <span class="meta">{{ user.email }}</span>
                    <div class="pill-row">
                      <span class="pill" [class.ok]="user.active" [class.warn]="!user.active">
                        {{ user.active ? 'Activo' : 'Inactivo' }}
                      </span>
                      @for (role of user.roles; track role) {
                        <span class="pill">{{ role }}</span>
                      }
                    </div>
                  </button>
                } @empty {
                  <div class="message">No hay usuarios con esos filtros.</div>
                }
              </div>
              <div class="actions">
                <button type="button" (click)="loadUsers(userPage - 1)" [disabled]="userPage <= 1">
                  Anterior
                </button>
                <button type="button" (click)="loadUsers(userPage + 1)" [disabled]="userPage >= userTotalPages">
                  Siguiente
                </button>
              </div>
            </aside>

            <section class="panel">
              @if (userPanelMode === 'create') {
                <div class="section-title">
                  <h2>Crear usuario de acceso</h2>
                  <p class="meta">Crea una cuenta para alguien que inicia sesión en esta organización.</p>
                </div>
                <div class="form-grid">
                  <label>
                    Email
                    <input type="email" [(ngModel)]="newUser.email" autocomplete="off" placeholder="cliente@example.com" />
                  </label>
                  <label>
                    Nombre
                    <input type="text" [(ngModel)]="newUser.name" autocomplete="off" placeholder="Nombre visible" />
                  </label>
                  <label>
                    Password temporal
                    <input
                      type="password"
                      [(ngModel)]="newUser.password"
                      autocomplete="new-password"
                      placeholder="Clave temporal"
                    />
                  </label>
                  <label>
                    Rol inicial
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
              } @else if (selectedUser) {
                <div class="detail-head">
                  <div class="section-title">
                    <h2>{{ selectedUser.name || 'Usuario sin nombre' }}</h2>
                    <p class="meta">{{ selectedUser.email }} · {{ selectedUser.active ? 'Activo' : 'Inactivo' }}</p>
                  </div>
                  <div class="detail-actions">
                    <button
                      class="danger"
                      type="button"
                      (click)="toggleUser(selectedUser)"
                      [disabled]="!canUpdateUsers || selectedUser.id === auth.state.session()?.user?.id"
                    >
                      {{ selectedUser.active ? 'Desactivar acceso' : 'Activar acceso' }}
                    </button>
                  </div>
                </div>

                <div class="form-grid">
                  <label>
                    Nombre visible
                    <input type="text" [(ngModel)]="userEditor.name" autocomplete="off" placeholder="Nombre del usuario" />
                  </label>
                  <label>
                    Resetear contraseña
                    <input
                      type="password"
                      [(ngModel)]="userEditor.password"
                      autocomplete="new-password"
                      placeholder="Deja vacío para no cambiarla"
                    />
                  </label>
                </div>

                <div class="section-title">
                  <h3>Roles asignados</h3>
                  <p class="meta">Estos roles definen el acceso efectivo dentro del tenant.</p>
                </div>
                <div class="checks">
                  @for (role of roles; track role.id) {
                    <label class="check">
                      <input
                        type="checkbox"
                        [checked]="selectedUser.roles.includes(role.key)"
                        [disabled]="!canManageRoles"
                        (change)="toggleUserRole(selectedUser, role.key)"
                      />
                      {{ role.name }}
                    </label>
                  }
                </div>

                <button type="button" (click)="saveSelectedUser()" [disabled]="!canUpdateUsers">
                  Guardar cambios
                </button>
              } @else {
                <div class="message">Selecciona un usuario o crea uno nuevo.</div>
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
                <button class="primary" type="button" (click)="startCreateRole()" [disabled]="!canManageRoles">
                  Nuevo
                </button>
              </div>

              <div class="user-list">
                @for (role of roles; track role.id) {
                  <button
                    class="user-card"
                    type="button"
                    [class.active]="selectedRole?.id === role.id && rolePanelMode === 'edit'"
                    (click)="selectRole(role)"
                  >
                    <strong>{{ role.name }}</strong>
                    <span class="meta">{{ role.key }} · {{ role.builtIn ? 'base del sistema' : 'custom' }}</span>
                    <span class="meta">{{ role.permissions.length }} permisos</span>
                  </button>
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
                  <label>
                    Key
                    <input [(ngModel)]="roleDraft.key" placeholder="supervisor" />
                  </label>
                  <label>
                    Nombre
                    <input [(ngModel)]="roleDraft.name" placeholder="Supervisor" />
                  </label>
                </div>
                <label>
                  Descripción
                  <input [(ngModel)]="roleDraft.description" placeholder="Qué puede hacer este perfil" />
                </label>
                <button class="primary" type="button" (click)="createRole()" [disabled]="!canManageRoles">
                  Crear rol
                </button>
              } @else if (selectedRole) {
                <div class="detail-head">
                  <div class="section-title">
                    <h2>{{ selectedRole.name }}</h2>
                    <p class="meta">{{ selectedRole.key }} · {{ selectedRole.builtIn ? 'rol base' : 'rol custom' }}</p>
                  </div>
                  @if (!selectedRole.builtIn) {
                    <button class="danger" type="button" (click)="deleteSelectedRole()" [disabled]="!canManageRoles">
                      Eliminar rol
                    </button>
                  }
                </div>
                <div class="form-grid">
                  <label>
                    Nombre
                    <input [(ngModel)]="roleDraft.name" [disabled]="selectedRole.key === 'owner'" />
                  </label>
                  <label>
                    Descripción
                    <input [(ngModel)]="roleDraft.description" [disabled]="selectedRole.key === 'owner'" />
                  </label>
                </div>
                <div class="section-title">
                  <h3>Permisos</h3>
                  <p class="meta">Marca las capacidades que tendrá este rol.</p>
                </div>
                <div class="checks">
                  @for (permission of permissions; track permission.id) {
                    <label class="check">
                      <input
                        type="checkbox"
                        [checked]="selectedRole.permissions.includes(permission.key)"
                        [disabled]="!canManageRoles || selectedRole.key === 'owner'"
                        (change)="toggleRolePermission(selectedRole, permission.key)"
                      />
                      {{ permission.key }}
                    </label>
                  }
                </div>
                <button
                  class="primary"
                  type="button"
                  [disabled]="!canManageRoles || selectedRole.key === 'owner'"
                  (click)="saveSelectedRole()"
                >
                  Guardar rol
                </button>
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
                <div class="message">Todavía no hay eventos de auditoría.</div>
              }
            </div>
          </section>
        }
      </main>
    </ion-content>
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

  load() {
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
    this.roleDraft = { key: '', name: '', description: '' };
  }

  selectRole(role: SecurityRole) {
    this.rolePanelMode = 'edit';
    this.selectedRoleId = role.id;
    this.roleDraft = {
      key: role.key,
      name: role.name,
      description: role.description ?? ''
    };
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
