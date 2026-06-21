import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';

type DynamicServiceStatus = 'draft' | 'published' | 'archived';

interface DynamicServiceDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retry?: {
    attempts?: number;
    backoffMs?: number;
  };
  responseMap?: Record<string, string>;
}

interface DynamicServiceVersion {
  id: string;
  serviceId: string;
  version: number;
  status: DynamicServiceStatus;
  definition: DynamicServiceDefinition;
  publishedAt?: string | null;
  createdAt: string;
}

interface DynamicServiceItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  active: boolean;
  type: 'http_request';
  latestVersion?: DynamicServiceVersion | null;
  publishedVersion?: DynamicServiceVersion | null;
}

interface DynamicServiceRun {
  id: string;
  status: string;
  triggerType: string;
  requestSnapshot?: Record<string, unknown> | null;
  responseSnapshot?: Record<string, unknown> | null;
  error?: string | null;
  durationMs: number;
  timeoutMs?: number | null;
  createdAt: string;
}

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [FormsModule, IonContent, JsonPipe, MainNavComponent],
  styles: [
    `
      ion-content {
        --background: #f5f7fb;
      }

      .shell {
        display: grid;
        gap: 18px;
        max-width: 1260px;
        margin: 0 auto;
        padding: 24px 0 54px;
      }

      .intro,
      .panel,
      .designer {
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 42px rgba(20, 50, 80, 0.06);
      }

      .intro,
      .panel {
        padding: 18px;
      }

      .intro {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        color: #12324f;
        font-size: 1.85rem;
      }

      h2 {
        color: #173b5f;
        font-size: 1.15rem;
      }

      h3 {
        color: #173b5f;
        font-size: 1rem;
      }

      .meta,
      .intro p {
        color: #52677a;
        line-height: 1.45;
      }

      .badge {
        border: 1px solid #c7d8e8;
        border-radius: 999px;
        background: #eef6ff;
        color: #173b5f;
        padding: 6px 10px;
        font-size: 0.82rem;
        font-weight: 850;
      }

      .designer {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr);
        min-height: 680px;
        overflow: hidden;
      }

      .services-list {
        display: grid;
        align-content: start;
        gap: 12px;
        overflow: auto;
        border-right: 1px solid #d9e2ec;
        background: #fbfcfe;
        padding: 14px;
      }

      .list-header,
      .section-head,
      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .service-button {
        display: grid;
        gap: 6px;
        width: 100%;
        min-height: 78px;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        color: #173b5f;
        padding: 12px;
        text-align: left;
        font: inherit;
        line-height: 1.3;
        cursor: pointer;
      }

      .service-button.active {
        border-color: #b7cce2;
        background: #eaf3fc;
      }

      .service-button strong,
      .service-button span {
        overflow-wrap: anywhere;
      }

      .workspace {
        display: grid;
        gap: 16px;
        align-content: start;
        min-width: 0;
        overflow: auto;
        padding: 16px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .field,
      .block,
      .result {
        display: grid;
        gap: 7px;
        min-width: 0;
      }

      label {
        color: #173b5f;
        font-weight: 850;
      }

      input,
      textarea,
      button {
        min-height: 38px;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
        color: #102f4d;
        padding: 8px 10px;
        font: inherit;
      }

      textarea {
        min-height: 150px;
        resize: vertical;
      }

      .code {
        min-height: 270px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
          "Courier New", monospace;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      button {
        color: #173b5f;
        font-weight: 850;
        cursor: pointer;
      }

      button.primary {
        border-color: #1554a2;
        background: #1554a2;
        color: #ffffff;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .notice {
        display: grid;
        gap: 8px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #f8fbfe;
        color: #254057;
        padding: 14px;
      }

      .notice.error {
        border-color: #f1b4b4;
        background: #fff6f6;
        color: #8b2323;
      }

      .notice.success {
        border-color: #a9ddb7;
        background: #f4fbf6;
        color: #17643a;
      }

      .run-list {
        display: grid;
        gap: 10px;
      }

      .run-item {
        display: grid;
        gap: 8px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        padding: 12px;
      }

      pre {
        max-height: 320px;
        overflow: auto;
        border-radius: 8px;
        background: #102033;
        color: #e9f1fb;
        padding: 12px;
        font-size: 0.84rem;
        line-height: 1.45;
        white-space: pre-wrap;
      }

      @media (max-width: 940px) {
        .designer,
        .grid {
          grid-template-columns: 1fr;
        }

        .designer {
          min-height: 0;
          overflow: visible;
        }

        .services-list {
          max-height: 340px;
          border-right: 0;
          border-bottom: 1px solid #d9e2ec;
        }
      }
    `
  ],
  template: `
    <ion-content class="ion-padding">
      <app-main-nav contextLabel="Servicios" />

      <main class="shell">
        <section class="intro">
          <div>
            <h1>Servicios dinámicos</h1>
            <p>
              Diseña servicios configurables por organización, publica versiones y prueba respuestas
              desde backend con límites de seguridad.
            </p>
          </div>
          <span class="badge">Tenant services</span>
        </section>

        @if (!canRead) {
          <section class="panel">
            <h2>Acceso restringido</h2>
            <p>Necesitas permiso services.read para ver este módulo.</p>
          </section>
        } @else {
          <section class="designer">
            <aside class="services-list">
              <div class="list-header">
                <h2>Servicios</h2>
                <button type="button" (click)="newService()" [disabled]="!canManage">Nuevo</button>
              </div>

              @if (loading) {
                <p class="meta">Cargando servicios...</p>
              } @else if (error) {
                <div class="notice error">
                  <strong>No se pudieron cargar</strong>
                  <span>{{ error }}</span>
                  <button type="button" (click)="load()">Reintentar</button>
                </div>
              } @else if (!services.length) {
                <div class="notice">
                  <strong>Sin servicios todavía</strong>
                  <span>Crea el primer servicio dinámico de esta organización.</span>
                </div>
              }

              @for (service of services; track service.id) {
                <button
                  class="service-button"
                  type="button"
                  [class.active]="selected?.id === service.id"
                  (click)="select(service)"
                >
                  <strong>{{ service.name }}</strong>
                  <span class="meta">{{ service.key }} · {{ service.active ? 'activo' : 'inactivo' }}</span>
                  <span class="meta">
                    publicada:
                    {{ service.publishedVersion ? 'v' + service.publishedVersion.version : 'sin publicar' }}
                  </span>
                </button>
              }
            </aside>

            <div class="workspace">
              <section class="panel">
                <div class="section-head">
                  <div>
                    <h2>{{ selected ? 'Editar servicio' : 'Crear servicio' }}</h2>
                    <p class="meta">El servicio es el objeto del tenant; la ejecución vive en versiones publicadas.</p>
                  </div>
                  <div class="actions">
                    <button type="button" (click)="load()">Refrescar</button>
                    <button class="primary" type="button" (click)="saveService()" [disabled]="!canManage || saving">
                      Guardar
                    </button>
                  </div>
                </div>

                <div class="grid">
                  <div class="field">
                    <label for="service-key">Key</label>
                    <input id="service-key" [(ngModel)]="draft.key" placeholder="validar_serial" />
                  </div>
                  <div class="field">
                    <label for="service-name">Nombre</label>
                    <input id="service-name" [(ngModel)]="draft.name" placeholder="Validar serial" />
                  </div>
                </div>
                <div class="field">
                  <label for="service-description">Descripción</label>
                  <input id="service-description" [(ngModel)]="draft.description" placeholder="Qué hace este servicio" />
                </div>
                <label class="meta">
                  <input type="checkbox" [(ngModel)]="draft.active" />
                  Servicio activo
                </label>
              </section>

              @if (selected) {
                <section class="panel">
                  <div class="section-head">
                    <div>
                      <h2>Definición HTTP</h2>
                      <p class="meta">Crea una versión draft y publícala para habilitar pruebas y ejecuciones.</p>
                    </div>
                    <div class="actions">
                      <button type="button" (click)="loadPublishedDefinition()">Usar publicada</button>
                      <button class="primary" type="button" (click)="createVersion()" [disabled]="!canManage || saving">
                        Crear versión
                      </button>
                      <button
                        type="button"
                        (click)="publishLatest()"
                        [disabled]="!canManage || !selected.latestVersion || selected.latestVersion.status === 'published' || saving"
                      >
                        Publicar última
                      </button>
                    </div>
                  </div>

                  <textarea class="code" [(ngModel)]="definitionText" spellcheck="false"></textarea>

                  @if (selected.latestVersion) {
                    <p class="meta">
                      Última versión: v{{ selected.latestVersion.version }} · {{ selected.latestVersion.status }}
                    </p>
                  }
                </section>

                <section class="panel">
                  <div class="section-head">
                    <div>
                      <h2>Prueba en vivo</h2>
                      <p class="meta">El navegador pide al backend ejecutar el servicio. Los secretos no vuelven expuestos.</p>
                    </div>
                    <button class="primary" type="button" (click)="testService()" [disabled]="!canExecute || testing">
                      Probar servicio
                    </button>
                  </div>

                  <div class="grid">
                    <div class="block">
                      <label for="test-context">Contexto de prueba</label>
                      <textarea id="test-context" class="code" [(ngModel)]="contextText" spellcheck="false"></textarea>
                    </div>
                    <div class="block">
                      <label>Última respuesta</label>
                      @if (lastRun) {
                        <pre>{{ lastRun | json }}</pre>
                      } @else {
                        <div class="notice">Ejecuta una prueba para ver request, response, duración y errores.</div>
                      }
                    </div>
                  </div>
                </section>

                <section class="panel">
                  <div class="section-head">
                    <div>
                      <h2>Historial</h2>
                      <p class="meta">Últimas ejecuciones registradas para este servicio.</p>
                    </div>
                    <button type="button" (click)="loadRuns()" [disabled]="runsLoading">Actualizar historial</button>
                  </div>

                  <div class="run-list">
                    @for (run of runs; track run.id) {
                      <article class="run-item">
                        <div class="section-head">
                          <strong>{{ run.status }}</strong>
                          <span class="meta">{{ run.durationMs }} ms · {{ run.createdAt }}</span>
                        </div>
                        @if (run.error) {
                          <div class="notice error">{{ run.error }}</div>
                        }
                        <pre>{{ run.responseSnapshot ?? run.requestSnapshot | json }}</pre>
                      </article>
                    } @empty {
                      <div class="notice">Sin ejecuciones todavía.</div>
                    }
                  </div>
                </section>
              }

              @if (message) {
                <div class="notice success">{{ message }}</div>
              }
              @if (formError) {
                <div class="notice error">{{ formError }}</div>
              }
            </div>
          </section>
        }
      </main>
    </ion-content>
  `
})
export class ServicesPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  services: DynamicServiceItem[] = [];
  selected?: DynamicServiceItem;
  runs: DynamicServiceRun[] = [];
  lastRun?: DynamicServiceRun;
  loading = false;
  saving = false;
  testing = false;
  runsLoading = false;
  error = '';
  formError = '';
  message = '';

  draft = {
    key: '',
    name: '',
    description: '',
    active: true
  };

  definitionText = JSON.stringify(
    {
      method: 'POST',
      url: 'https://api.example.com/validar',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer {{input.token}}'
      },
      body: {
        serial: '{{input.serial}}',
        tenant: '{{tenant.slug}}'
      },
      timeoutMs: 8000,
      retry: {
        attempts: 0,
        backoffMs: 0
      },
      responseMap: {}
    },
    null,
    2
  );

  contextText = JSON.stringify(
    {
      serial: 'ABC-123',
      token: 'solo-para-prueba'
    },
    null,
    2
  );

  get canManage() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasAllPermissions(['services.manage']);
  }

  get canExecute() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasAllPermissions(['services.execute']);
  }

  get canRead() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasAllPermissions(['services.read']);
  }

  ngOnInit() {
    if (this.canRead) {
      this.load();
    }
  }

  load() {
    this.loading = true;
    this.error = '';
    this.api.get<DynamicServiceItem[]>('dynamic-services').subscribe({
      next: (services) => {
        this.services = services;
        this.loading = false;
        if (this.selected) {
          const refreshed = services.find((service) => service.id === this.selected?.id);
          refreshed ? this.select(refreshed) : this.newService();
        } else if (services.length) {
          this.select(services[0]);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = this.errorMessage(error);
      }
    });
  }

  newService() {
    this.selected = undefined;
    this.runs = [];
    this.lastRun = undefined;
    this.draft = { key: '', name: '', description: '', active: true };
  }

  select(service: DynamicServiceItem) {
    this.selected = service;
    this.draft = {
      key: service.key,
      name: service.name,
      description: service.description ?? '',
      active: service.active
    };
    this.definitionText = JSON.stringify(
      service.latestVersion?.definition ?? service.publishedVersion?.definition ?? JSON.parse(this.definitionText),
      null,
      2
    );
    this.formError = '';
    this.message = '';
    this.loadRuns();
  }

  saveService() {
    this.saving = true;
    this.formError = '';
    this.message = '';
    const request = {
      key: this.draft.key,
      name: this.draft.name,
      description: this.draft.description,
      active: this.draft.active
    };
    const call = this.selected
      ? this.api.patch<DynamicServiceItem>(`dynamic-services/${this.selected.id}`, request)
      : this.api.post<DynamicServiceItem>('dynamic-services', request);

    call.subscribe({
      next: (service) => {
        this.saving = false;
        this.message = 'Servicio guardado.';
        this.selected = service;
        this.load();
      },
      error: (error) => {
        this.saving = false;
        this.formError = this.errorMessage(error);
      }
    });
  }

  createVersion() {
    if (!this.selected) {
      return;
    }
    const definition = this.parseJson<DynamicServiceDefinition>(this.definitionText);
    if (!definition) {
      return;
    }

    this.saving = true;
    this.formError = '';
    this.api
      .post<DynamicServiceVersion>(`dynamic-services/${this.selected.id}/versions`, { definition })
      .subscribe({
        next: () => {
          this.saving = false;
          this.message = 'Versión draft creada.';
          this.load();
        },
        error: (error) => {
          this.saving = false;
          this.formError = this.errorMessage(error);
        }
      });
  }

  publishLatest() {
    if (!this.selected?.latestVersion) {
      return;
    }
    this.saving = true;
    this.api
      .post<DynamicServiceVersion>(
        `dynamic-services/${this.selected.id}/versions/${this.selected.latestVersion.id}/publish`,
        {}
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.message = 'Versión publicada.';
          this.load();
        },
        error: (error) => {
          this.saving = false;
          this.formError = this.errorMessage(error);
        }
      });
  }

  loadPublishedDefinition() {
    if (this.selected?.publishedVersion) {
      this.definitionText = JSON.stringify(this.selected.publishedVersion.definition, null, 2);
    }
  }

  testService() {
    if (!this.selected) {
      return;
    }
    const context = this.parseJson<Record<string, unknown>>(this.contextText);
    if (!context) {
      return;
    }

    this.testing = true;
    this.formError = '';
    this.api.post<DynamicServiceRun>(`dynamic-services/${this.selected.id}/test`, { context }).subscribe({
      next: (run) => {
        this.testing = false;
        this.lastRun = run;
        this.message = 'Prueba ejecutada.';
        this.loadRuns();
      },
      error: (error) => {
        this.testing = false;
        this.formError = this.errorMessage(error);
      }
    });
  }

  loadRuns() {
    if (!this.selected) {
      return;
    }
    this.runsLoading = true;
    this.api.get<DynamicServiceRun[]>(`dynamic-services/${this.selected.id}/runs`).subscribe({
      next: (runs) => {
        this.runs = runs;
        this.runsLoading = false;
      },
      error: () => {
        this.runs = [];
        this.runsLoading = false;
      }
    });
  }

  private parseJson<T>(value: string): T | null {
    try {
      return JSON.parse(value) as T;
    } catch {
      this.formError = 'El JSON no es válido.';
      return null;
    }
  }

  private errorMessage(error: unknown) {
    const response = error as { error?: { message?: string | string[] }; message?: string };
    const message = response.error?.message ?? response.message;
    return Array.isArray(message) ? message.join(', ') : message || 'Error inesperado.';
  }
}
