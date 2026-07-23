import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AdminActionToolbarComponent } from '../../shared/admin-action-toolbar/admin-action-toolbar.component';
import { AdminMetricCardComponent } from '../../shared/admin-metric-card/admin-metric-card.component';
import { AdminPanelComponent } from '../../shared/admin-panel/admin-panel.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';

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
  imports: [AdminActionToolbarComponent, AdminMetricCardComponent, AdminPanelComponent, RouterLink, PageShellComponent],
  styles: [
    `
      .shell {
        display: grid;
        gap: 18px;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 18px;
        align-items: stretch;
      }

      .eyebrow {
        color: var(--ch-color-success);
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
        color: var(--ch-color-text);
        font-size: 2.05rem;
        line-height: 1.15;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.12rem;
      }

      h3 {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      p,
      .muted,
      .meta {
        color: var(--ch-color-muted);
        line-height: 1.5;
      }

      .session-row {
        display: grid;
        gap: 3px;
      }

      .label {
        color: var(--ch-color-muted);
        font-size: 0.76rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .value {
        color: var(--ch-color-text);
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 18px;
        align-items: start;
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
        border-color: var(--ch-color-primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ch-color-primary) 12%, transparent);
      }

      .module-card strong {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      .status-pill {
        width: fit-content;
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
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
        color: var(--ch-color-text);
      }

      .empty-state {
        border: 1px dashed var(--ch-color-border);
        border-radius: 8px;
        color: var(--ch-color-muted);
        padding: 16px;
      }

      @media (max-width: 860px) {
        .hero,
        .content-grid,
        .modules-grid {
          grid-template-columns: 1fr;
        }

        h1 {
          font-size: 1.6rem;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabel="Panel principal">
      <div class="shell">
        <app-admin-panel
          title="Panel principal"
          description="Accesos rápidos del entorno administrativo."
          titleSize="1.8rem"
        >
          <app-admin-action-toolbar panel-actions align="end">
            <a class="primary" routerLink="/flows">Abrir Flow Designer</a>
            <a routerLink="/services">Servicios</a>
            <a routerLink="/docs">Docs</a>
          </app-admin-action-toolbar>
        </app-admin-panel>

      @if (auth.state.session(); as session) {
        <section class="hero">
          <app-admin-panel
            eyebrow="Tenant activo"
            [title]="session.tenant.name"
            description="Este es el punto de entrada para operar Chicle Engine. Desde aquí se accede al docs, configuración del sistema y administración de seguridad según permisos."
            titleSize="2rem"
          ></app-admin-panel>

          <app-admin-panel title="Sesión actual" aria-label="Sesión actual">
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
          </app-admin-panel>
        </section>

        <section class="content-grid">
          <app-admin-panel
            title="Accesos disponibles"
            description="Las opciones visibles dependen de tus permisos actuales."
          >

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
          </app-admin-panel>

          <app-admin-panel
            title="Estado de seguridad"
            description="Resumen rápido de la sesión y permisos cargados."
          >
            <div class="status-list">
              <app-admin-metric-card
                label="Sesión"
                value="Activa"
                detail="Access token y refresh cookie HttpOnly."
                tone="success"
              ></app-admin-metric-card>
              <app-admin-metric-card
                label="Permisos efectivos"
                [value]="session.permissions.length + ' permisos'"
                detail="Disponibles para esta sesión."
                tone="primary"
              ></app-admin-metric-card>
              <app-admin-metric-card
                label="Documentación API"
                value="Swagger"
                detail="Disponible en /api/docs para pruebas guiadas."
              ></app-admin-metric-card>
            </div>
          </app-admin-panel>
        </section>
      } @else {
        <app-admin-panel
          title="Preparando sesión"
          description="Si esta pantalla permanece así, vuelve a iniciar sesión para recargar el contexto del tenant."
        ></app-admin-panel>
      }
      </div>
    </app-page-shell>
  `
})
export class HomePageComponent {
  readonly auth = inject(AuthService);

  readonly modules: HomeModule[] = [
    {
      title: 'Docs operativos',
      description: 'Guías de arranque, setup, seguridad, reset local, Swagger, comandos frecuentes y repositorio Markdown.',
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
