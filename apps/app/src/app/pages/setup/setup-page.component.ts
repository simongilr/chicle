import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiClientService } from '../../core/api/api-client.service';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { PublicPageShellComponent } from '../../shared/public-page-shell/public-page-shell.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';

type SetupState = 'loading' | 'not_created' | 'ready' | 'unavailable' | 'created';

interface SetupStatus {
  state: 'not_created' | 'ready';
  initialized: boolean;
  canRunSetup: boolean;
  tenantCount: number;
  requiredAction: 'run_setup' | 'login';
  seedProfile: 'blank';
}

interface SetupResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  admin: {
    email: string;
  };
  next: string;
}

@Component({
  selector: 'app-setup-page',
  standalone: true,
  imports: [
    DynamicFieldControlComponent,
    LoadingSkeletonComponent,
    PublicPageShellComponent,
    RouterLink,
    StatusNoticeComponent,
    UiKitButtonComponent
  ],
  styles: [
    `
      .doc-link {
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        color: var(--ch-color-text);
        background: var(--ch-color-surface);
        padding: 8px 12px;
        text-decoration: none;
        font-weight: 700;
      }

      .setup-shell {
        display: grid;
        grid-template-columns: minmax(0, 0.88fr) minmax(360px, 1.12fr);
        gap: 28px;
      }

      .intro {
        display: grid;
        align-content: start;
        gap: 16px;
        padding-top: 12px;
      }

      .eyebrow {
        width: fit-content;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
        padding: 6px 10px;
        font-size: 0.8rem;
        font-weight: 700;
      }

      h1 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 2.25rem;
        line-height: 1.08;
      }

      p {
        margin: 0;
        color: var(--ch-color-muted);
        line-height: 1.55;
      }

      .state-panel,
      .setup-form {
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        box-shadow: 0 18px 50px color-mix(in srgb, var(--ch-color-text) 8%, transparent);
      }

      .state-panel {
        display: grid;
        gap: 10px;
        padding: 16px;
      }

      .status {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--ch-color-text);
        font-weight: 700;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--ch-color-warning);
      }

      .dot.ready {
        background: var(--ch-color-success);
      }

      .dot.error {
        background: var(--ch-color-danger);
      }

      .setup-form {
        display: grid;
        gap: 16px;
        padding: 20px;
      }

      .form-header {
        display: grid;
        gap: 6px;
      }

      .form-header h2 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1.25rem;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }

      .link-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        border-radius: 8px;
        padding: 0 16px;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        text-decoration: none;
      }

      .link-button {
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
      }

      .primary-link {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
      }

      .ready-panel {
        display: grid;
        gap: 14px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        box-shadow: 0 18px 50px color-mix(in srgb, var(--ch-color-text) 8%, transparent);
        padding: 20px;
      }

      .ready-panel h2 {
        margin: 0;
        color: var(--ch-color-text);
        font-size: 1.3rem;
      }

      .ready-panel.error {
        border-color: var(--ch-color-danger-border);
      }

      .ready-list {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .ready-list li {
        border-radius: 8px;
        background: var(--ch-color-background);
        color: var(--ch-color-text);
        padding: 10px 12px;
      }

      @media (max-width: 820px) {
        .setup-shell {
          grid-template-columns: 1fr;
        }

        h1 {
          font-size: 1.72rem;
        }
      }
    `
  ],
  template: `
    <app-public-page-shell contextLabel="Setup inicial">
      <div public-actions class="actions">
        <a class="doc-link" routerLink="/docs">Docs</a>
        @if (state === 'ready' || state === 'created') {
          <a class="doc-link" routerLink="/login">Ingresar</a>
        }
      </div>
      <div class="setup-shell">
        <section class="intro">
          <span class="eyebrow">{{ heroEyebrow }}</span>
          <h1>{{ heroTitle }}</h1>
          <p>{{ heroDescription }}</p>

          <div class="state-panel">
            <div class="status">
              <span class="dot" [class.ready]="state === 'ready' || state === 'created'" [class.error]="state === 'unavailable'"></span>
              <span>{{ stateLabel }}</span>
            </div>
            <p>{{ stateDescription }}</p>
          </div>
        </section>

        @if (state === 'loading') {
          <app-loading-skeleton
            variant="form"
            label="Revisando estado del sistema"
            [rows]="4"
          ></app-loading-skeleton>
        } @else if (state === 'unavailable') {
          <section class="ready-panel error">
            <h2>API no disponible</h2>

            @if (message) {
              <app-status-notice tone="error">{{ message }}</app-status-notice>
            }

            <ul class="ready-list">
              <li>Esto no significa que falte crear el sistema.</li>
              <li>Primero revisa que la API, Docker y la base de datos estén arriba.</li>
              <li>Si cambiaste puertos, confirma el API_PORT usado por el frontend.</li>
            </ul>

            <div class="actions">
              <app-ui-kit-button
                label="Reintentar"
                tone="primary"
                (pressed)="loadStatus()"
              ></app-ui-kit-button>
              <a class="link-button" routerLink="/docs">Ver guía</a>
            </div>
          </section>
        } @else if (state === 'ready' || state === 'created') {
          <section class="ready-panel">
            <h2>Continuar con autenticación</h2>

            @if (message) {
              <app-status-notice [tone]="messageType">{{ message }}</app-status-notice>
            }

            <ul class="ready-list">
              <li>El setup inicial ya no se puede ejecutar desde esta pantalla.</li>
              <li>Usa el email y password del admin creado en el primer setup.</li>
              <li>Luego podrás administrar usuarios, roles, permisos y confisys desde el sistema.</li>
            </ul>

            <div class="actions">
              <a class="link-button primary-link" routerLink="/login">Ir a iniciar sesión</a>
              <app-ui-kit-button
                label="Revisar estado"
                tone="secondary"
                variant="outline"
                (pressed)="loadStatus()"
              ></app-ui-kit-button>
              <a class="link-button" routerLink="/docs">Ver guía</a>
            </div>
          </section>
        } @else {
          <form class="setup-form" (submit)="submitSetup($event)">
            <div class="form-header">
              <h2>Datos iniciales</h2>
              <p>Usaremos estos datos para crear el tenant base y preparar las semillas iniciales.</p>
            </div>

            @if (message) {
              <app-status-notice [tone]="messageType">{{ message }}</app-status-notice>
            }

            <app-dynamic-field-control
              [field]="organizationField"
              [value]="organization"
              [disabled]="!canEdit"
              (valueChange)="organization = stringValue($event)"
            ></app-dynamic-field-control>

            <app-dynamic-field-control
              [field]="emailField"
              [value]="email"
              [disabled]="!canEdit"
              (valueChange)="email = stringValue($event)"
            ></app-dynamic-field-control>

            <app-dynamic-field-control
              [field]="passwordField"
              [value]="password"
              help="Mínimo 8 caracteres para el setup inicial."
              [disabled]="!canEdit"
              (valueChange)="password = stringValue($event)"
            ></app-dynamic-field-control>

            <app-dynamic-field-control
              [field]="templateField"
              [value]="template"
              [disabled]="!canEdit"
              (valueChange)="template = stringValue($event)"
            ></app-dynamic-field-control>

            <div class="actions">
              <app-ui-kit-button
                [label]="saving ? 'Creando...' : 'Crear sistema'"
                type="submit"
                tone="primary"
                [disabled]="!canSubmit"
              ></app-ui-kit-button>
              <app-ui-kit-button
                label="Revisar estado"
                tone="secondary"
                variant="outline"
                (pressed)="loadStatus()"
              ></app-ui-kit-button>
            </div>
          </form>
        }
      </div>
    </app-public-page-shell>
  `
})
export class SetupPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);

  organization = '';
  email = '';
  password = '';
  template = 'blank';
  state: SetupState = 'loading';
  saving = false;
  message = '';
  messageType: 'info' | 'success' | 'error' = 'info';
  readonly organizationField: RuntimeField = {
    name: 'setup-organization',
    label: 'Organización',
    type: 'text',
    required: true,
    placeholder: 'Nombre de la organización'
  };
  readonly emailField: RuntimeField = {
    name: 'setup-email',
    label: 'Email admin',
    type: 'email',
    required: true,
    placeholder: 'admin@empresa.com'
  };
  readonly passwordField: RuntimeField = {
    name: 'setup-password',
    label: 'Password admin',
    type: 'password',
    required: true,
    placeholder: 'Mínimo 8 caracteres'
  };
  readonly templateField: RuntimeField = {
    name: 'setup-template',
    label: 'Semilla inicial',
    type: 'select',
    placeholder: 'Selecciona una semilla',
    options: [{ label: 'Blank', value: 'blank' }]
  };

  ngOnInit() {
    this.loadStatus();
  }

  get canEdit() {
    return this.state === 'not_created' && !this.saving;
  }

  get canSubmit() {
    return (
      this.canEdit &&
      this.organization.trim().length > 1 &&
      this.email.trim().length > 3 &&
      this.password.length >= 8
    );
  }

  get heroEyebrow() {
    const labels: Record<SetupState, string> = {
      loading: 'Revisión inicial',
      not_created: 'Setup web',
      ready: 'Sistema listo',
      unavailable: 'Conexión',
      created: 'Sistema listo'
    };

    return labels[this.state];
  }

  get heroTitle() {
    const titles: Record<SetupState, string> = {
      loading: 'Revisando estado del sistema',
      not_created: 'Crear el primer espacio de trabajo',
      ready: 'El sistema ya está creado',
      unavailable: 'No se pudo consultar el sistema',
      created: 'El sistema ya está creado'
    };

    return titles[this.state];
  }

  get heroDescription() {
    const descriptions: Record<SetupState, string> = {
      loading: 'La app está consultando la API para decidir si debe mostrar setup o login.',
      not_created:
        'Este flujo solo aparece cuando la API responde que el sistema está vivo pero todavía no fue creado. El primer admin nace aquí, no desde una contraseña default.',
      ready:
        'Ya existe un tenant inicial. El siguiente paso es entrar con el admin que se creó durante el setup y continuar desde el home.',
      unavailable:
        'La app no pudo confirmar si el sistema existe. Esto es distinto a setup pendiente: primero hay que recuperar la conexión con la API.',
      created: 'El tenant inicial quedó listo. Ahora corresponde iniciar sesión con el admin creado.'
    };

    return descriptions[this.state];
  }

  get stateLabel() {
    const labels: Record<SetupState, string> = {
      loading: 'Revisando sistema',
      not_created: 'Sistema listo para setup',
      ready: 'Sistema ya creado',
      unavailable: 'Sistema no disponible',
      created: 'Sistema creado'
    };

    return labels[this.state];
  }

  get stateDescription() {
    const descriptions: Record<SetupState, string> = {
      loading: 'Consultando /api/setup/status.',
      not_created: 'API y base de datos responden. Puedes crear el primer tenant.',
      ready: 'Ya existe al menos un tenant. El siguiente paso es iniciar sesión.',
      unavailable: 'No se pudo consultar la API. Revisa Docker, puerto de API o base de datos.',
      created: 'El tenant inicial fue creado. El siguiente paso es iniciar sesión.'
    };

    return descriptions[this.state];
  }

  loadStatus() {
    this.message = '';
    this.state = 'loading';
    this.api.get<SetupStatus>('setup/status').subscribe({
      next: (status) => {
        this.state = status.state;
        this.message =
          status.state === 'not_created'
            ? 'El backend está vivo y espera el setup inicial.'
            : 'El sistema ya fue creado. Inicia sesión con el admin inicial.';
        this.messageType = 'info';
      },
      error: () => {
        this.state = 'unavailable';
        this.message = 'No se pudo conectar con la API. Revisa Docker y API_PORT.';
        this.messageType = 'error';
      }
    });
  }

  createPlatform() {
    if (!this.canSubmit) {
      return;
    }

    this.saving = true;
    this.message = '';
    this.api
      .post<SetupResponse>('setup', {
        organization: this.organization.trim(),
        email: this.email.trim(),
        password: this.password,
        template: this.template
      })
      .subscribe({
        next: (response) => {
          this.saving = false;
          this.state = 'created';
          this.message = `Sistema creado para ${response.tenant.name}. Admin inicial: ${response.admin.email}.`;
          this.messageType = 'success';
          void this.router.navigateByUrl('/login');
        },
        error: (error) => {
          this.saving = false;
          this.message = error?.error?.message ?? 'No se pudo crear el sistema.';
          this.messageType = 'error';
          if (error?.status === 0) {
            this.state = 'unavailable';
          }
        }
      });
  }

  submitSetup(event: Event) {
    event.preventDefault();
    this.createPlatform();
  }

  stringValue(value: unknown) {
    return value === null || value === undefined ? '' : String(value);
  }
}
