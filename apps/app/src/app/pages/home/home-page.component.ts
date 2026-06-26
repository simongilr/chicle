import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';

interface HomeModule {
  title: string;
  description: string;
  route: string;
  permissions?: string[];
  roles?: string[];
  status: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, MainNavComponent],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #f5f7fb;
        color: #12365a;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid #d9e2ec;
        background: #ffffff;
        padding: 14px 24px;
      }

      .brand-block {
        display: grid;
        gap: 2px;
        min-width: 190px;
      }

      .brand {
        color: #12324f;
        font-size: 1rem;
        font-weight: 850;
      }

      .context-label {
        color: #64748b;
        font-size: 0.82rem;
        font-weight: 700;
      }

      .top-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .top-actions a,
      .top-actions button,
      .module-card,
      .panel,
      .status-item {
        border: 1px solid #d9e2ec;
        background: #ffffff;
      }

      .top-actions a,
      .top-actions button {
        min-height: 38px;
        border-radius: 8px;
        color: #173b5f;
        padding: 8px 12px;
        text-decoration: none;
        font: inherit;
        font-weight: 800;
      }

      .top-actions a[aria-current='page'] {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      .top-actions button {
        cursor: pointer;
      }

      .shell {
        display: grid;
        gap: 18px;
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 18px;
        align-items: stretch;
      }

      .welcome,
      .session-card {
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        padding: 18px;
      }

      .welcome {
        display: grid;
        gap: 10px;
      }

      .eyebrow {
        color: #147d64;
        font-size: 0.78rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        color: #12324f;
        font-size: 2.05rem;
        line-height: 1.15;
      }

      h2 {
        color: #173b5f;
        font-size: 1.12rem;
      }

      h3 {
        color: #173b5f;
        font-size: 1rem;
      }

      p,
      .muted,
      .meta {
        color: #4d5c6c;
        line-height: 1.5;
      }

      .session-card {
        display: grid;
        gap: 12px;
      }

      .session-row {
        display: grid;
        gap: 3px;
      }

      .label {
        color: #64748b;
        font-size: 0.76rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .value {
        color: #12324f;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 18px;
        align-items: start;
      }

      .panel {
        display: grid;
        gap: 14px;
        border-radius: 8px;
        padding: 18px;
      }

      .modules-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .module-card {
        display: grid;
        gap: 10px;
        min-height: 158px;
        border-radius: 8px;
        color: inherit;
        padding: 16px;
        text-decoration: none;
      }

      .module-card:hover,
      .module-card:focus-visible {
        outline: none;
        border-color: #1554a2;
        box-shadow: 0 0 0 3px rgba(21, 84, 162, 0.12);
      }

      .module-card strong {
        color: #173b5f;
        font-size: 1rem;
      }

      .status-pill {
        width: fit-content;
        border-radius: 999px;
        background: #e8f2ff;
        color: #1554a2;
        padding: 5px 8px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .status-list {
        display: grid;
        gap: 10px;
      }

      .status-item {
        display: grid;
        gap: 5px;
        border-radius: 8px;
        padding: 12px;
      }

      .status-item strong {
        color: #173b5f;
      }

      .empty-state {
        border: 1px dashed #b8c7d6;
        border-radius: 8px;
        color: #4d5c6c;
        padding: 16px;
      }

      .quick-panel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }

      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .quick-actions a {
        border: 1px solid #c8d6e4;
        border-radius: 8px;
        background: #ffffff;
        color: #173b5f;
        padding: 9px 12px;
        text-decoration: none;
        font-weight: 850;
      }

      .quick-actions a.primary {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      @media (max-width: 860px) {
        .topbar {
          align-items: flex-start;
          flex-direction: column;
          padding: 14px 16px;
        }

        .top-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
        }

        .top-actions a,
        .top-actions button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
          text-align: center;
        }

        .shell {
          padding: 18px 16px 36px;
        }

        .hero,
        .content-grid,
        .modules-grid {
          grid-template-columns: 1fr;
        }

        .quick-panel {
          align-items: stretch;
          flex-direction: column;
        }

        h1 {
          font-size: 1.6rem;
        }
      }
    `
  ],
  template: `
    <app-main-nav contextLabel="Panel principal" />

    <main class="shell">
      <section class="panel quick-panel">
        <div>
          <h1>Panel principal</h1>
          <p class="muted">Accesos rápidos del entorno administrativo.</p>
        </div>
        <div class="quick-actions">
          <a class="primary" routerLink="/flows">Abrir Flow Designer</a>
          <a routerLink="/services">Servicios</a>
          <a routerLink="/docs">Manual</a>
        </div>
      </section>

      @if (auth.state.session(); as session) {
        <section class="hero">
          <article class="welcome">
            <span class="eyebrow">Tenant activo</span>
            <h1>{{ session.tenant.name }}</h1>
            <p>
              Este es el punto de entrada para operar Chicle Engine. Desde aquí se accede al
              manual, configuración del sistema y administración de seguridad según permisos.
            </p>
          </article>

          <aside class="session-card" aria-label="Sesión actual">
            <div class="session-row">
              <span class="label">Usuario</span>
              <span class="value">{{ session.user.email }}</span>
            </div>
            <div class="session-row">
              <span class="label">Rol sistema</span>
              <span class="value">{{ session.user.systemRole }}</span>
            </div>
            <div class="session-row">
              <span class="label">Roles tenant</span>
              <span class="value">{{ roleList(session.roles) }}</span>
            </div>
          </aside>
        </section>

        <section class="content-grid">
          <article class="panel">
            <div>
              <h2>Accesos disponibles</h2>
              <p class="muted">Las opciones visibles dependen de tus permisos actuales.</p>
            </div>

            <div class="modules-grid">
              @for (module of visibleModules; track module.title) {
                <a class="module-card" [routerLink]="module.route">
                  <span class="status-pill">{{ module.status }}</span>
                  <strong>{{ module.title }}</strong>
                  <span class="meta">{{ module.description }}</span>
                </a>
              }
            </div>

            @if (!visibleModules.length) {
              <div class="empty-state">
                No hay módulos administrativos disponibles para esta sesión.
              </div>
            }
          </article>

          <aside class="panel">
            <div>
              <h2>Estado de seguridad</h2>
              <p class="muted">Resumen rápido de la sesión y permisos cargados.</p>
            </div>
            <div class="status-list">
              <div class="status-item">
                <strong>Sesión</strong>
                <span class="meta">Activa con access token y refresh cookie HttpOnly.</span>
              </div>
              <div class="status-item">
                <strong>Permisos efectivos</strong>
                <span class="meta">{{ session.permissions.length }} permisos disponibles.</span>
              </div>
              <div class="status-item">
                <strong>Documentación API</strong>
                <span class="meta">Swagger disponible en /api/docs para pruebas guiadas.</span>
              </div>
            </div>
          </aside>
        </section>
      } @else {
        <section class="panel">
          <h1>Preparando sesión</h1>
          <p class="muted">Si esta pantalla permanece así, vuelve a iniciar sesión para recargar el contexto del tenant.</p>
        </section>
      }
    </main>
  `
})
export class HomePageComponent {
  readonly modules: HomeModule[] = [
    {
      title: 'Manual operativo',
      description: 'Guías de arranque, setup, seguridad, reset local, Swagger y comandos frecuentes.',
      route: '/docs',
      status: 'Base'
    },
    {
      title: 'Configuración',
      description: 'Administración de confisys y parámetros que la API carga al iniciar.',
      route: '/confisys',
      permissions: ['confisys.read'],
      status: 'Admin'
    },
    {
      title: 'Base de datos',
      description: 'Visor web solo lectura para inspeccionar tablas del tenant y configuración global.',
      route: '/database',
      roles: ['owner', 'admin'],
      status: 'DB'
    },
    {
      title: 'Servicios dinámicos',
      description: 'Diseñador de servicios configurables, versiones, pruebas en vivo e historial de ejecuciones.',
      route: '/services',
      permissions: ['services.read'],
      status: 'Servicios'
    },
    {
      title: 'Flow Designer',
      description: 'Constructor inicial de flows, pasos, preview JSON, versiones y publicación.',
      route: '/flows',
      permissions: ['flows.read'],
      status: 'Flows'
    },
    {
      title: 'Seguridad',
      description: 'Usuarios, roles, permisos y auditoría del tenant actual.',
      route: '/security',
      permissions: ['users.read', 'roles.read', 'permissions.read'],
      status: 'RBAC'
    }
  ];

  constructor(readonly auth: AuthService) {}

  get visibleModules() {
    return this.modules.filter((module) => {
      if (this.auth.state.isOwnerOrAdmin) {
        return true;
      }

      const hasPermissions = !module.permissions || this.auth.state.hasAllPermissions(module.permissions);
      const hasRoles = !module.roles || this.auth.state.hasAnyRole(module.roles);
      return hasPermissions && hasRoles;
    });
  }

  roleList(roles: Array<{ key: string; name: string }>) {
    return roles.length ? roles.map((role) => role.name || role.key).join(', ') : 'Sin roles';
  }
}
