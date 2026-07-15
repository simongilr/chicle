import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { FieldShellComponent } from '../../shared/field-shell/field-shell.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { PublicPageShellComponent } from '../../shared/public-page-shell/public-page-shell.component';
import { StatusNoticeComponent, StatusNoticeTone } from '../../shared/status-notice/status-notice.component';

type SecurityChannel = 'web' | 'mobile' | 'device';
type AuthMethodType = 'password' | 'oauth2' | 'oidc' | 'saml' | 'magic_link' | 'device_code' | 'passkey';
type SecurityLevel = 'basic' | 'standard' | 'high';

interface AuthMethodConfig {
  type: AuthMethodType;
  enabled: boolean;
  label: string;
  channels: SecurityChannel[];
  providerKey?: string;
  primary?: boolean;
}

interface PublicAuthConfig {
  tenantSlug?: string;
  setupRequired: boolean;
  security: {
    level: SecurityLevel;
    requireMfa: boolean;
    password: {
      enabled: boolean;
      minLength: number;
      hash: 'argon2id' | 'bcrypt';
    };
    session: {
      webMode: 'refresh_cookie' | 'cookie_session' | 'bearer';
      accessTokenTtlMinutes: number;
      refreshTokenTtlDays: number;
    };
    methods: AuthMethodConfig[];
  };
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    FieldShellComponent,
    FormsModule,
    LoadingSkeletonComponent,
    PublicPageShellComponent,
    RouterLink,
    StatusNoticeComponent
  ],
  styles: [
    `
      .link {
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        color: var(--ch-color-text);
        background: var(--ch-color-surface);
        padding: 8px 12px;
        text-decoration: none;
        font-weight: 700;
      }

      .login-shell {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
        gap: 28px;
      }

      .intro,
      .login-panel {
        display: grid;
        align-content: start;
        gap: 16px;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        color: var(--ch-color-text);
        font-size: 2.2rem;
        line-height: 1.08;
      }

      h2 {
        color: var(--ch-color-text);
        font-size: 1.25rem;
      }

      h3 {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      p,
      .meta {
        color: var(--ch-color-muted);
        line-height: 1.55;
      }

      .badge {
        width: fit-content;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
        padding: 6px 10px;
        font-size: 0.8rem;
        font-weight: 800;
      }

      .policy-card,
      .login-panel,
      .method-card {
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        box-shadow: 0 18px 50px color-mix(in srgb, var(--ch-color-text) 8%, transparent);
      }

      .policy-card,
      .login-panel {
        padding: 18px;
      }

      .policy-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .policy-item {
        border-radius: 8px;
        background: var(--ch-color-background);
        padding: 10px;
      }

      .form {
        display: grid;
        gap: 14px;
      }

      input {
        min-height: 44px;
        width: 100%;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 10px 12px;
        font: inherit;
      }

      input:focus {
        outline: 3px solid color-mix(in srgb, var(--ch-color-primary) 18%, transparent);
        border-color: var(--ch-color-primary);
      }

      .primary-button,
      .method-button {
        min-height: 42px;
        border-radius: 8px;
        padding: 0 16px;
        font: inherit;
        font-weight: 800;
      }

      .primary-button {
        border: 1px solid var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      .primary-button:disabled {
        border-color: var(--ch-color-border);
        background: #d7e1eb;
        color: var(--ch-color-muted);
      }

      .method-button {
        width: 100%;
        border: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
      }

      .methods {
        display: grid;
        gap: 10px;
      }

      .method-card {
        display: grid;
        gap: 8px;
        padding: 14px;
      }

      .channel-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .channel-tabs button {
        min-height: 34px;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 0 12px;
        font: inherit;
        font-weight: 700;
      }

      .channel-tabs button.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-surface);
      }

      @media (max-width: 820px) {
        .login-shell {
          grid-template-columns: 1fr;
        }

        h1 {
          font-size: 1.72rem;
        }
      }
    `
  ],
  template: `
    <app-public-page-shell contextLabel="Ingreso">
      <a public-actions class="link" routerLink="/docs">Manual</a>
      <div class="login-shell">
        <section class="intro">
          <span class="badge">Seguridad modular</span>
          <h1>Ingreso adaptable por organización</h1>
          <p>
            Esta pantalla lee la política de seguridad activa y muestra los métodos permitidos
            para web, móvil o dispositivo. OAuth2, OIDC, passkeys y device code pueden activarse
            por tenant sin rediseñar la experiencia.
          </p>

          <article class="policy-card">
            <h2>Política activa</h2>
            <div class="policy-grid">
              <div class="policy-item">
                <strong>Nivel</strong>
                <div class="meta">{{ config?.security?.level ?? 'cargando' }}</div>
              </div>
              <div class="policy-item">
                <strong>MFA</strong>
                <div class="meta">{{ config?.security?.requireMfa ? 'Requerido' : 'Opcional' }}</div>
              </div>
              <div class="policy-item">
                <strong>Sesión web</strong>
                <div class="meta">{{ config?.security?.session?.webMode ?? 'cargando' }}</div>
              </div>
              <div class="policy-item">
                <strong>Tenant</strong>
                <div class="meta">{{ config?.tenantSlug ?? 'pendiente' }}</div>
              </div>
            </div>
          </article>
        </section>

        <section class="login-panel">
          <h2>Iniciar sesión</h2>

          @if (loading) {
            <app-loading-skeleton
              variant="form"
              label="Cargando política de seguridad"
              [rows]="2"
            ></app-loading-skeleton>
          } @else if (message) {
            <app-status-notice [tone]="messageTone">{{ message }}</app-status-notice>
          }

          @if (!loading && config?.setupRequired) {
            <a class="link" routerLink="/setup">Crear sistema primero</a>
          } @else if (!loading) {
            <div class="channel-tabs" aria-label="Canal de seguridad">
              <button type="button" [class.active]="channel === 'web'" (click)="channel = 'web'">Web</button>
              <button type="button" [class.active]="channel === 'mobile'" (click)="channel = 'mobile'">Móvil</button>
              <button type="button" [class.active]="channel === 'device'" (click)="channel = 'device'">Dispositivo</button>
            </div>

            @if (passwordEnabledForChannel) {
              <form class="form" (ngSubmit)="login()">
                <app-field-shell label="Email" forId="login-email" [required]="true">
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    [(ngModel)]="email"
                  />
                </app-field-shell>
                <app-field-shell label="Password" forId="login-password" [required]="true">
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autocomplete="current-password"
                    [(ngModel)]="password"
                  />
                </app-field-shell>
                <button class="primary-button" type="submit" [disabled]="submitting">
                  {{ submitting ? 'Entrando...' : 'Entrar con password' }}
                </button>
              </form>
            }

            <div class="methods">
              @for (method of enabledMethodsForChannel; track method.type + method.label) {
                @if (method.type !== 'password') {
                  <article class="method-card">
                    <h3>{{ method.label }}</h3>
                    <p>{{ methodDescription(method) }}</p>
                    <button class="method-button" type="button">{{ methodButtonLabel(method) }}</button>
                  </article>
                }
              }
            </div>
          }
        </section>
      </div>
    </app-public-page-shell>
  `
})
export class LoginPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  config?: PublicAuthConfig;
  channel: SecurityChannel = 'web';
  email = '';
  password = '';
  submitting = false;
  loading = true;
  message = 'Cargando política de seguridad...';
  messageTone: StatusNoticeTone = 'info';

  ngOnInit() {
    this.loadConfig();
  }

  get enabledMethodsForChannel() {
    return (
      this.config?.security.methods.filter(
        (method) => method.enabled && method.channels.includes(this.channel)
      ) ?? []
    );
  }

  get passwordEnabledForChannel() {
    return this.enabledMethodsForChannel.some((method) => method.type === 'password');
  }

  loadConfig() {
    this.api.get<PublicAuthConfig>('auth/config').subscribe({
      next: (config) => {
        this.config = config;
        this.loading = false;
        this.messageTone = 'info';
        this.message = config.setupRequired
          ? 'El sistema todavía no fue creado. Ejecuta el setup inicial.'
          : 'Métodos disponibles según la política de seguridad activa.';
      },
      error: () => {
        this.loading = false;
        this.messageTone = 'error';
        this.message = 'No se pudo cargar la política de seguridad. Revisa API_PORT y Docker.';
      }
    });
  }

  login() {
    if (!this.email.trim() || !this.password) {
      this.messageTone = 'warning';
      this.message = 'Ingresa email y password.';
      return;
    }

    this.submitting = true;
    this.messageTone = 'info';
    this.message = 'Validando credenciales...';
    this.auth
      .login({
        email: this.email,
        password: this.password,
        tenantSlug: this.config?.tenantSlug
      })
      .subscribe({
        next: (response) => {
          this.auth.completeLogin(response);
          this.submitting = false;
          void this.router.navigateByUrl(this.returnUrl);
        },
        error: () => {
          this.submitting = false;
          this.messageTone = 'error';
          this.message = 'No se pudo iniciar sesión. Revisa tus credenciales.';
        }
      });
  }

  private get returnUrl() {
    const value = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';
    return value.startsWith('/') && !value.startsWith('//') ? value : '/home';
  }

  methodDescription(method: AuthMethodConfig) {
    const descriptions: Record<AuthMethodType, string> = {
      password: 'Ingreso local con credenciales del tenant.',
      oauth2: 'Redirección a un proveedor OAuth2 configurado.',
      oidc: 'Redirección a un proveedor OpenID Connect configurado.',
      saml: 'Redirección a un proveedor SAML empresarial.',
      magic_link: 'Envío de enlace temporal al correo del usuario.',
      device_code: 'Código para vincular dispositivos de campo.',
      passkey: 'Autenticación con llave/passkey compatible.'
    };

    return descriptions[method.type];
  }

  methodButtonLabel(method: AuthMethodConfig) {
    return method.providerKey ? `Continuar con ${method.label}` : `Configurar ${method.label}`;
  }
}
