import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ApiClientService } from '../../core/api/api-client.service';

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
  imports: [FormsModule, RouterLink, IonContent],
  styles: [
    `
      ion-content {
        --background: #f4f7fb;
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

      .brand {
        color: #12324f;
        font-weight: 800;
      }

      .doc-link {
        border: 1px solid #c8d6e4;
        border-radius: 8px;
        color: #173b5f;
        background: #ffffff;
        padding: 8px 12px;
        text-decoration: none;
        font-weight: 700;
      }

      .setup-shell {
        display: grid;
        grid-template-columns: minmax(0, 0.88fr) minmax(360px, 1.12fr);
        gap: 28px;
        max-width: 1080px;
        margin: 0 auto;
        padding: 28px 0 48px;
      }

      .intro {
        display: grid;
        align-content: start;
        gap: 16px;
        padding-top: 12px;
      }

      .eyebrow {
        width: fit-content;
        border: 1px solid #bed4ea;
        border-radius: 999px;
        background: #eaf3fc;
        color: #16496f;
        padding: 6px 10px;
        font-size: 0.8rem;
        font-weight: 700;
      }

      h1 {
        margin: 0;
        color: #102f4d;
        font-size: 2.25rem;
        line-height: 1.08;
      }

      p {
        margin: 0;
        color: #526577;
        line-height: 1.55;
      }

      .state-panel,
      .setup-form {
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 50px rgba(20, 50, 80, 0.08);
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
        color: #173b5f;
        font-weight: 700;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #f0a202;
      }

      .dot.ready {
        background: #14945d;
      }

      .dot.error {
        background: #c83232;
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
        color: #173b5f;
        font-size: 1.25rem;
      }

      label {
        display: grid;
        gap: 7px;
        color: #173b5f;
        font-weight: 700;
      }

      input,
      select {
        min-height: 44px;
        width: 100%;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
        color: #102f4d;
        padding: 10px 12px;
        font: inherit;
      }

      input:focus,
      select:focus {
        outline: 3px solid rgba(21, 84, 162, 0.18);
        border-color: #1554a2;
      }

      input:disabled,
      select:disabled {
        background: #edf2f7;
        color: #6c7a87;
      }

      .message {
        border-radius: 8px;
        padding: 12px;
        color: #254057;
        background: #eaf3fc;
        line-height: 1.45;
      }

      .message.error {
        background: #feecec;
        color: #8b2323;
      }

      .message.success {
        background: #e9f8ef;
        color: #17613d;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
      }

      .primary-button,
      .secondary-button,
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

      .primary-button {
        border: 1px solid #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      .secondary-button,
      .link-button {
        border: 1px solid #c8d6e4;
        background: #ffffff;
        color: #173b5f;
      }

      .ready-panel {
        display: grid;
        gap: 14px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 50px rgba(20, 50, 80, 0.08);
        padding: 20px;
      }

      .ready-panel h2 {
        margin: 0;
        color: #173b5f;
        font-size: 1.3rem;
      }

      .ready-panel.error {
        border-color: #f1b4b4;
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
        background: #f4f7fb;
        color: #254057;
        padding: 10px 12px;
      }

      .primary-button:disabled {
        border-color: #c8d6e4;
        background: #d7e1eb;
        color: #758596;
        cursor: not-allowed;
      }

      @media (max-width: 820px) {
        .topbar {
          padding: 12px 16px;
        }

        .setup-shell {
          grid-template-columns: 1fr;
          padding-top: 12px;
        }

        h1 {
          font-size: 1.72rem;
        }
      }
    `
  ],
  template: `
    <header class="topbar">
      <div class="brand">Chicle Engine Setup</div>
      <div class="actions">
        <a class="doc-link" routerLink="/docs">Docs</a>
        @if (state === 'ready' || state === 'created') {
          <a class="doc-link" routerLink="/login">Login</a>
        }
      </div>
    </header>
    <ion-content class="ion-padding">
      <main class="setup-shell">
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
          <section class="ready-panel">
            <h2>Revisando estado</h2>
            <div class="message">Consultando si el sistema necesita setup o login.</div>
          </section>
        } @else if (state === 'unavailable') {
          <section class="ready-panel error">
            <h2>API no disponible</h2>

            @if (message) {
              <div class="message error">
                {{ message }}
              </div>
            }

            <ul class="ready-list">
              <li>Esto no significa que falte crear el sistema.</li>
              <li>Primero revisa que la API, Docker y la base de datos estén arriba.</li>
              <li>Si cambiaste puertos, confirma el API_PORT usado por el frontend.</li>
            </ul>

            <div class="actions">
              <button class="primary-button" type="button" (click)="loadStatus()">Reintentar</button>
              <a class="link-button" routerLink="/docs">Ver guía</a>
            </div>
          </section>
        } @else if (state === 'ready' || state === 'created') {
          <section class="ready-panel">
            <h2>Continuar con autenticación</h2>

            @if (message) {
              <div class="message" [class.success]="messageType === 'success'">
                {{ message }}
              </div>
            }

            <ul class="ready-list">
              <li>El setup inicial ya no se puede ejecutar desde esta pantalla.</li>
              <li>Usa el email y password del admin creado en el primer setup.</li>
              <li>Luego podrás administrar usuarios, roles, permisos y confisys desde el sistema.</li>
            </ul>

            <div class="actions">
              <a class="primary-button" routerLink="/login">Ir a iniciar sesión</a>
              <button class="secondary-button" type="button" (click)="loadStatus()">Revisar estado</button>
              <a class="link-button" routerLink="/docs">Ver guía</a>
            </div>
          </section>
        } @else {
          <form class="setup-form" (ngSubmit)="createPlatform()">
            <div class="form-header">
              <h2>Datos iniciales</h2>
              <p>Usaremos estos datos para crear el tenant base y preparar las semillas iniciales.</p>
            </div>

            @if (message) {
              <div class="message" [class.error]="messageType === 'error'" [class.success]="messageType === 'success'">
                {{ message }}
              </div>
            }

            <label>
              Organización
              <input
                name="organization"
                autocomplete="organization"
                [(ngModel)]="organization"
                [disabled]="!canEdit"
                required
              />
            </label>

            <label>
              Email admin
              <input
                name="email"
                type="email"
                autocomplete="email"
                [(ngModel)]="email"
                [disabled]="!canEdit"
                required
              />
            </label>

            <label>
              Password admin
              <input
                name="password"
                type="password"
                autocomplete="new-password"
                [(ngModel)]="password"
                [disabled]="!canEdit"
                required
              />
            </label>

            <label>
              Semilla inicial
              <select
                name="template"
                [(ngModel)]="template"
                [disabled]="!canEdit"
              >
                <option value="blank">Blank</option>
              </select>
            </label>

            <div class="actions">
              <button class="primary-button" type="submit" [disabled]="!canSubmit">
                {{ saving ? 'Creando...' : 'Crear sistema' }}
              </button>
              <button class="secondary-button" type="button" (click)="loadStatus()">Revisar estado</button>
            </div>
          </form>
        }
      </main>
    </ion-content>
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
}
