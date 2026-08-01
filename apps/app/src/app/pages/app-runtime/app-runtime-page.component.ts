import { JsonPipe } from '@angular/common';
import { DestroyRef, Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../core/api/api-client.service';
import { DynamicFlowClientService } from '../../core/services/dynamic-flow-client.service';
import { DynamicServiceClientService } from '../../core/services/dynamic-service-client.service';
import { PublicPageShellComponent } from '../../shared/public-page-shell/public-page-shell.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { UiKitCardComponent } from '../../shared/ui-kit-card/ui-kit-card.component';

type RuntimeTarget = 'admin' | 'web' | 'mobile' | 'desktop' | 'multi';

interface RuntimeNavigationItem {
  key: string;
  label: string;
  route: string;
  target: RuntimeTarget;
  group: string;
  icon: string;
  permissions: string[];
  active: boolean;
}

interface RuntimeScreenComponent {
  id?: string;
  componentKey?: string;
  title?: string;
  region?: string;
  width?: string;
  chrome?: string;
  bindingKey?: string;
  binding?: Record<string, unknown>;
  bindings?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  actions?: Array<Record<string, unknown>>;
}

interface RuntimeComponentState {
  loading?: boolean;
  error?: string;
  message?: string;
  result?: unknown;
  rows?: Array<Record<string, unknown>>;
}

interface RuntimeScreen {
  key: string;
  title: string;
  route: string;
  target: RuntimeTarget;
  version: number;
  permissions: string[];
  definition: {
    title?: string;
    description?: string;
    layout?: Record<string, unknown>;
    components?: RuntimeScreenComponent[];
  };
}

interface RuntimeRouteResponse {
  kind: 'dynamic_app_runtime_route';
  tenant: {
    slug: string;
    name: string;
  };
  app: {
    key: string;
    name: string;
    description?: string | null;
    version: number;
  };
  target: RuntimeTarget;
  route: string;
  requestedRoute: string;
  navigation: RuntimeNavigationItem[];
  screen: RuntimeScreen;
  cache: {
    key: string;
    appVersion: number;
    screenVersion: number;
    generatedAt: string;
  };
}

@Component({
  selector: 'app-app-runtime-page',
  standalone: true,
  imports: [FormsModule, JsonPipe, PublicPageShellComponent, StatusNoticeComponent, UiKitButtonComponent, UiKitCardComponent],
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: var(--ch-color-background);
        color: var(--ch-color-text);
      }

      .runtime-actions,
      .runtime-nav,
      .card-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }

      .runtime-shell {
        display: grid;
        gap: 18px;
      }

      .runtime-header {
        display: grid;
        gap: 8px;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 18px;
      }

      .runtime-kicker {
        color: var(--ch-color-muted);
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
        font-size: clamp(1.9rem, 4vw, 2.8rem);
        line-height: 1.05;
      }

      .runtime-description {
        max-width: 760px;
        color: var(--ch-color-muted);
        line-height: 1.55;
      }

      .runtime-nav {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .nav-item {
        min-height: 36px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-text);
        padding: 8px 12px;
        font: inherit;
        font-weight: 800;
      }

      .nav-item.active {
        border-color: var(--ch-color-primary);
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
      }

      .runtime-route-list,
      .runtime-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .runtime-route-list {
        flex-direction: column;
      }

      .runtime-tabs .nav-item {
        border-radius: 999px;
      }

      .component-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 14px;
      }

      .runtime-card {
        display: grid;
        gap: 12px;
        min-width: 0;
      }

      .runtime-card-header {
        display: grid;
        gap: 4px;
      }

      .runtime-card-header span,
      .runtime-meta,
      .runtime-endpoint {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.45;
      }

      .runtime-endpoint {
        overflow-wrap: anywhere;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 10px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }

      .runtime-input,
      .runtime-textarea {
        width: 100%;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        font: inherit;
        line-height: 1.35;
        padding: 10px 12px;
      }

      .runtime-textarea {
        min-height: 96px;
        resize: vertical;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.86rem;
      }

      .runtime-output {
        overflow: auto;
        max-height: 240px;
        border-radius: var(--ch-radius);
        background: #10263e;
        color: #e9f3ff;
        padding: 12px;
        font-size: 0.8rem;
      }

      .runtime-table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        font-size: 0.86rem;
      }

      .runtime-table th,
      .runtime-table td {
        border-bottom: 1px solid var(--ch-color-border);
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
      }

      .runtime-table th {
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        font-weight: 850;
      }

      .metric-grid,
      .gallery-grid,
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
      }

      .metric-item,
      .gallery-item,
      .modal-preview,
      .detail-item,
      .timeline-item,
      .map-marker {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .metric-item strong {
        display: block;
        font-size: 1.45rem;
        line-height: 1.1;
      }

      .gallery-item img {
        display: block;
        width: 100%;
        aspect-ratio: 4 / 3;
        border-radius: calc(var(--ch-radius) - 2px);
        object-fit: cover;
        background: var(--ch-color-border);
      }

      .modal-preview {
        display: grid;
        gap: 8px;
      }

      .chart-bars {
        display: grid;
        gap: 10px;
      }

      .chart-row {
        display: grid;
        grid-template-columns: minmax(70px, auto) 1fr minmax(44px, auto);
        align-items: center;
        gap: 10px;
        font-size: 0.84rem;
      }

      .chart-track {
        overflow: hidden;
        height: 10px;
        border-radius: 999px;
        background: var(--ch-color-surface-alt);
      }

      .chart-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--ch-color-primary);
      }

      .detail-item span,
      .timeline-item span,
      .map-marker span {
        display: block;
      }

      .detail-item span:first-child,
      .timeline-item span:first-child,
      .map-marker span:first-child {
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .timeline-list {
        display: grid;
        gap: 8px;
      }

      .timeline-item {
        border-left: 3px solid var(--ch-color-primary);
      }

      .map-preview {
        position: relative;
        overflow: hidden;
        min-height: 220px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background:
          linear-gradient(var(--ch-color-border) 1px, transparent 1px),
          linear-gradient(90deg, var(--ch-color-border) 1px, transparent 1px),
          color-mix(in srgb, var(--ch-color-primary) 7%, var(--ch-color-surface-alt));
        background-size: 28px 28px;
        padding: 14px;
      }

      .map-marker-list {
        position: absolute;
        inset: auto 14px 14px 14px;
        display: grid;
        gap: 8px;
      }

      .runtime-login-preview,
      .runtime-form-preview {
        display: grid;
        gap: 10px;
      }

      .runtime-field-preview {
        min-height: 42px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        color: var(--ch-color-muted);
        padding: 11px 12px;
      }

      @media (max-width: 760px) {
        .component-grid {
          grid-template-columns: 1fr;
        }

        .component-grid > * {
          grid-column: 1 / -1 !important;
        }
      }
    `
  ],
  template: `
    <app-public-page-shell [brand]="runtime()?.app?.name || 'Chicle App'" [contextLabel]="contextLabel()" [maxWidth]="1160">
      <div public-actions class="runtime-actions">
        <app-ui-kit-button
          label="Admin"
          icon="pi pi-cog"
          tone="secondary"
          variant="outline"
          size="small"
          (pressed)="goAdmin()"
        ></app-ui-kit-button>
        <app-ui-kit-button
          label="Refrescar"
          icon="pi pi-refresh"
          tone="secondary"
          variant="outline"
          size="small"
          [disabled]="loading()"
          (pressed)="reload()"
        ></app-ui-kit-button>
      </div>

      <section class="runtime-shell">
        @if (loading()) {
          <app-status-notice tone="info" title="Cargando app">
            <span>Resolviendo el contrato publicado para esta ruta.</span>
          </app-status-notice>
        }

        @if (error()) {
          <app-status-notice tone="error" title="No se pudo cargar la app">
            <span>{{ error() }}</span>
          </app-status-notice>
        }

        @if (runtime(); as data) {
          <header class="runtime-header">
            <span class="runtime-kicker">{{ data.target }} · v{{ data.app.version }} · {{ data.screen.route }}</span>
            <h1>{{ data.screen.title }}</h1>
            @if (screenDescription()) {
              <p class="runtime-description">{{ screenDescription() }}</p>
            }
          </header>

          @if (data.navigation.length > 0) {
            <nav class="runtime-nav" aria-label="Navegación de la app">
              @for (item of data.navigation; track item.key) {
                <button class="nav-item" type="button" [class.active]="item.active" (click)="openRoute(item)">
                  {{ item.label }}
                </button>
              }
            </nav>
          }

          <section class="component-grid" aria-label="Componentes de pantalla">
            @for (component of components(); track componentId(component, $index)) {
              <app-ui-kit-card
                [variant]="component.chrome === 'plain' ? 'outline' : 'surface'"
                [style.grid-column]="componentGridColumn(component)"
              >
                <article class="runtime-card">
                  <header class="runtime-card-header">
                    <h2>{{ componentTitle(component) }}</h2>
                    <span>{{ componentSubtitle(component) }}</span>
                  </header>

                  @switch (component.componentKey) {
                    @case ('hero_header') {
                      <p class="runtime-description">{{ componentText(component, 'subtitle') || data.app.description }}</p>
                    }
                    @case ('nav_menu') {
                      <div class="runtime-nav">
                        @for (item of data.navigation; track item.key) {
                          <button class="nav-item" type="button" [class.active]="item.active" (click)="openRoute(item)">
                            {{ item.label }}
                          </button>
                        }
                      </div>
                    }
                    @case ('side_nav') {
                      <div class="runtime-route-list">
                        @for (item of data.navigation; track item.key) {
                          <button class="nav-item" type="button" [class.active]="item.active" (click)="openRoute(item)">
                            {{ item.label }}
                          </button>
                        }
                      </div>
                    }
                    @case ('bottom_nav') {
                      <div class="runtime-nav">
                        @for (item of data.navigation; track item.key) {
                          <button class="nav-item" type="button" [class.active]="item.active" (click)="openRoute(item)">
                            {{ item.label }}
                          </button>
                        }
                      </div>
                    }
                    @case ('tabs') {
                      <div class="runtime-tabs">
                        @for (item of data.navigation; track item.key) {
                          <button class="nav-item" type="button" [class.active]="item.active" (click)="openRoute(item)">
                            {{ item.label }}
                          </button>
                        }
                      </div>
                    }
                    @case ('auth_login') {
                      <div class="runtime-login-preview">
                        <div class="runtime-field-preview">Usuario o email</div>
                        <div class="runtime-field-preview">Contraseña</div>
                        <app-ui-kit-button
                          label="Iniciar sesión"
                          [full]="true"
                          (pressed)="goLogin()"
                        ></app-ui-kit-button>
                      </div>
                    }
                    @case ('form_runtime') {
                      <div class="runtime-form-preview">
                        <p class="runtime-meta">Formulario: {{ formKey(component) || 'sin binding' }}</p>
                        <app-ui-kit-button
                          label="Abrir formulario"
                          icon="pi pi-file-edit"
                          [disabled]="!formKey(component)"
                          (pressed)="openForm(component)"
                        ></app-ui-kit-button>
                      </div>
                    }
                    @case ('data_table') {
                      <p class="runtime-endpoint">
                        {{ serviceKey(component) ? 'Servicio de datos: ' + serviceKey(component) : 'Tabla: ' + (tableName(component) || 'sin tabla configurada') }}
                      </p>
                      <app-ui-kit-button
                        label="Cargar datos"
                        icon="pi pi-table"
                        [disabled]="!serviceKey(component) || componentState(component, $index).loading === true"
                        (pressed)="loadDataTable(component, $index)"
                      ></app-ui-kit-button>
                      @if (rowsFor(component, $index).length > 0) {
                        <table class="runtime-table">
                          <thead>
                            <tr>
                              @for (column of columnsFor(component, $index); track column) {
                                <th>{{ column }}</th>
                              }
                            </tr>
                          </thead>
                          <tbody>
                            @for (row of rowsFor(component, $index); track row) {
                              <tr>
                                @for (column of columnsFor(component, $index); track column) {
                                  <td>{{ cellValue(row[column]) }}</td>
                                }
                              </tr>
                            }
                          </tbody>
                        </table>
                      }
                    }
                    @case ('search_panel') {
                      <input
                        class="runtime-input"
                        type="search"
                        [placeholder]="componentText(component, 'placeholder') || 'Buscar'"
                        [ngModel]="searchQuery(component, $index)"
                        (ngModelChange)="setSearchQuery(component, $index, $event)"
                      />
                      <app-ui-kit-button
                        label="Buscar"
                        icon="pi pi-search"
                        [disabled]="!serviceKey(component) || componentState(component, $index).loading === true"
                        (pressed)="runSearch(component, $index)"
                      ></app-ui-kit-button>
                    }
                    @case ('service_button') {
                      <p class="runtime-endpoint">POST /api/dynamic-services/by-key/{{ serviceKey(component) || 'service_key' }}/execute</p>
                      <textarea
                        class="runtime-textarea"
                        [ngModel]="actionInput(component, $index)"
                        (ngModelChange)="setActionInput(component, $index, $event)"
                        spellcheck="false"
                      ></textarea>
                      <app-ui-kit-button
                        [label]="componentText(component, 'buttonLabel') || 'Ejecutar servicio'"
                        icon="pi pi-bolt"
                        [disabled]="!serviceKey(component) || componentState(component, $index).loading === true"
                        (pressed)="executeService(component, $index)"
                      ></app-ui-kit-button>
                    }
                    @case ('flow_button') {
                      <p class="runtime-endpoint">POST /api/flows/by-key/{{ flowKey(component) || 'flow_key' }}/execute</p>
                      <textarea
                        class="runtime-textarea"
                        [ngModel]="actionInput(component, $index)"
                        (ngModelChange)="setActionInput(component, $index, $event)"
                        spellcheck="false"
                      ></textarea>
                      <app-ui-kit-button
                        [label]="componentText(component, 'buttonLabel') || 'Ejecutar flow'"
                        icon="pi pi-play"
                        [disabled]="!flowKey(component) || componentState(component, $index).loading === true"
                        (pressed)="executeFlow(component, $index)"
                      ></app-ui-kit-button>
                    }
                    @case ('metric_strip') {
                      <div class="metric-grid">
                        @for (metric of metrics(component); track metric.label) {
                          <div class="metric-item">
                            <strong>{{ metric.value }}</strong>
                            <span class="runtime-meta">{{ metric.label }}</span>
                          </div>
                        }
                      </div>
                    }
                    @case ('chart_panel') {
                      <div class="chart-bars">
                        @for (bar of chartBars(component); track bar.label) {
                          <div class="chart-row">
                            <span>{{ bar.label }}</span>
                            <span class="chart-track">
                              <span class="chart-fill" [style.width.%]="bar.percent"></span>
                            </span>
                            <strong>{{ bar.value }}</strong>
                          </div>
                        }
                      </div>
                    }
                    @case ('entity_card') {
                      <div class="detail-grid">
                        @for (item of detailItems(component, $index); track item.label) {
                          <div class="detail-item">
                            <span>{{ item.label }}</span>
                            <b>{{ item.value }}</b>
                          </div>
                        }
                      </div>
                    }
                    @case ('detail_panel') {
                      <div class="detail-grid">
                        @for (item of detailItems(component, $index); track item.label) {
                          <div class="detail-item">
                            <span>{{ item.label }}</span>
                            <b>{{ item.value }}</b>
                          </div>
                        }
                      </div>
                    }
                    @case ('timeline') {
                      <div class="timeline-list">
                        @for (item of timelineItems(component, $index); track item.title) {
                          <div class="timeline-item">
                            <span>{{ item.time }}</span>
                            <b>{{ item.title }}</b>
                            <p class="runtime-meta">{{ item.description }}</p>
                          </div>
                        }
                      </div>
                    }
                    @case ('media_gallery') {
                      <div class="gallery-grid">
                        @for (item of galleryItems(component); track item.url) {
                          <figure class="gallery-item">
                            <img [src]="item.url" [alt]="item.title || 'Imagen'" />
                            @if (item.title) {
                              <figcaption class="runtime-meta">{{ item.title }}</figcaption>
                            }
                          </figure>
                        }
                      </div>
                    }
                    @case ('map_view') {
                      <div class="map-preview">
                        <p class="runtime-meta">Vista de ubicación configurada desde JSON.</p>
                        <div class="map-marker-list">
                          @for (marker of mapMarkers(component); track marker.label) {
                            <div class="map-marker">
                              <span>{{ marker.label }}</span>
                              <b>{{ marker.lat }}, {{ marker.lng }}</b>
                            </div>
                          }
                        </div>
                      </div>
                    }
                    @case ('modal_shell') {
                      <app-ui-kit-button
                        [label]="componentText(component, 'buttonLabel') || 'Abrir modal'"
                        icon="pi pi-window-maximize"
                        (pressed)="toggleModal(component, $index)"
                      ></app-ui-kit-button>
                      @if (isModalOpen(component, $index)) {
                        <div class="modal-preview">
                          <strong>{{ componentText(component, 'modalTitle') || componentTitle(component) }}</strong>
                          <p class="runtime-meta">{{ componentText(component, 'modalBody') || 'Contenido del modal dinámico.' }}</p>
                        </div>
                      }
                    }
                    @default {
                      <p class="runtime-meta">
                        Binding: {{ component.bindingKey || 'sin binding' }} · Acción:
                        {{ actionSummary(component) }}
                      </p>
                    }
                  }

                  @if (componentState(component, $index).loading) {
                    <app-status-notice tone="info">Ejecutando componente...</app-status-notice>
                  }
                  @if (componentState(component, $index).message) {
                    <app-status-notice tone="success">{{ componentState(component, $index).message }}</app-status-notice>
                  }
                  @if (componentState(component, $index).error) {
                    <app-status-notice tone="error">{{ componentState(component, $index).error }}</app-status-notice>
                  }
                  @if (componentState(component, $index).result !== undefined) {
                    <pre class="runtime-output">{{ componentState(component, $index).result | json }}</pre>
                  }
                </article>
              </app-ui-kit-card>
            }
          </section>
        }
      </section>
    </app-public-page-shell>
  `
})
export class AppRuntimePageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly dynamicServices = inject(DynamicServiceClientService);
  private readonly dynamicFlows = inject(DynamicFlowClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private loadToken = 0;
  private lastRequest: { appKey: string; route: string; target: RuntimeTarget } | null = null;

  readonly runtime = signal<RuntimeRouteResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly componentStates = signal<Record<string, RuntimeComponentState>>({});
  readonly actionInputs = signal<Record<string, string>>({});
  readonly searchQueries = signal<Record<string, string>>({});
  readonly openModals = signal<Record<string, boolean>>({});

  readonly components = computed(() => this.runtime()?.screen.definition.components ?? []);

  ngOnInit() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, query]) => {
        const appKey = params.get('appKey') || '';
        const route = query.get('route') || '/';
        const target = this.normalizeTarget(query.get('target'));
        if (appKey) {
          void this.loadRuntime(appKey, route, target);
        }
      });
  }

  contextLabel() {
    const runtime = this.runtime();
    return runtime ? `${runtime.tenant.name} · ${runtime.target}` : 'Runtime';
  }

  screenDescription() {
    return this.runtime()?.screen.definition.description || this.runtime()?.app.description || '';
  }

  reload() {
    if (this.lastRequest) {
      void this.loadRuntime(this.lastRequest.appKey, this.lastRequest.route, this.lastRequest.target);
    }
  }

  openRoute(item: RuntimeNavigationItem) {
    const runtime = this.runtime();
    if (!runtime) return;
    const target = item.target === 'multi' ? runtime.target : item.target;
    void this.router.navigate(['/apps/run', runtime.app.key], {
      queryParams: { route: item.route, target }
    });
  }

  goAdmin() {
    void this.router.navigate(['/apps']);
  }

  goLogin() {
    void this.router.navigate(['/login']);
  }

  openForm(component: RuntimeScreenComponent) {
    const key = this.formKey(component);
    if (key) {
      void this.router.navigate(['/forms', key]);
    }
  }

  executeService(component: RuntimeScreenComponent, index: number) {
    const serviceKey = this.serviceKey(component);
    if (!serviceKey) {
      this.setComponentState(component, index, { error: 'Este componente no tiene serviceKey configurado.' });
      return;
    }
    const input = this.inputFromEditor(component, index);
    if (!input) {
      return;
    }
    this.setComponentState(component, index, { loading: true });
    this.dynamicServices
      .execute(serviceKey, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (execution) => {
          this.setComponentState(component, index, {
            message: execution.ok ? 'Servicio ejecutado correctamente.' : undefined,
            error: execution.ok ? undefined : execution.error || 'El servicio terminó con error.',
            result: execution,
            rows: this.extractRows(execution.result ?? execution.response)
          });
        },
        error: (error) => {
          this.setComponentState(component, index, { error: this.errorMessage(error) });
        }
      });
  }

  executeFlow(component: RuntimeScreenComponent, index: number) {
    const flowKey = this.flowKey(component);
    if (!flowKey) {
      this.setComponentState(component, index, { error: 'Este componente no tiene flowKey configurado.' });
      return;
    }
    const input = this.inputFromEditor(component, index);
    if (!input) {
      return;
    }
    this.setComponentState(component, index, { loading: true });
    this.dynamicFlows
      .execute(flowKey, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (execution) => {
          this.setComponentState(component, index, {
            message: execution.ok ? 'Flow ejecutado correctamente.' : undefined,
            error: execution.ok ? undefined : 'El flow terminó con error.',
            result: execution
          });
        },
        error: (error) => {
          this.setComponentState(component, index, { error: this.errorMessage(error) });
        }
      });
  }

  loadDataTable(component: RuntimeScreenComponent, index: number) {
    const serviceKey = this.serviceKey(component);
    if (!serviceKey) {
      this.setComponentState(component, index, { error: 'Configura un serviceKey para cargar datos.' });
      return;
    }
    this.setComponentState(component, index, { loading: true });
    this.dynamicServices
      .execute(serviceKey, this.defaultInput(component))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (execution) => {
          this.setComponentState(component, index, {
            message: execution.ok ? 'Datos cargados.' : undefined,
            error: execution.ok ? undefined : execution.error || 'No se pudieron cargar datos.',
            result: execution.response ?? execution.result,
            rows: this.extractRows(execution.result ?? execution.response)
          });
        },
        error: (error) => {
          this.setComponentState(component, index, { error: this.errorMessage(error) });
        }
      });
  }

  runSearch(component: RuntimeScreenComponent, index: number) {
    const serviceKey = this.serviceKey(component);
    const query = this.searchQuery(component, index);
    if (!serviceKey) {
      this.setComponentState(component, index, { error: 'Configura un serviceKey para buscar.' });
      return;
    }
    const inputKey = this.componentText(component, 'inputKey') || 'query';
    const input = {
      ...this.defaultInput(component),
      [inputKey]: query,
      input: {
        ...this.asRecord(this.defaultInput(component)['input']),
        [inputKey]: query
      }
    };
    this.setComponentState(component, index, { loading: true });
    this.dynamicServices
      .execute(serviceKey, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (execution) => {
          this.setComponentState(component, index, {
            message: execution.ok ? 'Búsqueda ejecutada.' : undefined,
            error: execution.ok ? undefined : execution.error || 'No se pudo ejecutar la búsqueda.',
            result: execution.response ?? execution.result,
            rows: this.extractRows(execution.result ?? execution.response)
          });
        },
        error: (error) => {
          this.setComponentState(component, index, { error: this.errorMessage(error) });
        }
      });
  }

  componentState(component: RuntimeScreenComponent, index: number) {
    return this.componentStates()[this.componentId(component, index)] ?? {};
  }

  actionInput(component: RuntimeScreenComponent, index: number) {
    const id = this.componentId(component, index);
    return this.actionInputs()[id] ?? JSON.stringify(this.defaultInput(component), null, 2);
  }

  setActionInput(component: RuntimeScreenComponent, index: number, value: string) {
    const id = this.componentId(component, index);
    this.actionInputs.update((state) => ({ ...state, [id]: value }));
  }

  searchQuery(component: RuntimeScreenComponent, index: number) {
    return this.searchQueries()[this.componentId(component, index)] ?? '';
  }

  setSearchQuery(component: RuntimeScreenComponent, index: number, value: string) {
    const id = this.componentId(component, index);
    this.searchQueries.update((state) => ({ ...state, [id]: value }));
  }

  rowsFor(component: RuntimeScreenComponent, index: number) {
    return this.componentState(component, index).rows ?? [];
  }

  columnsFor(component: RuntimeScreenComponent, index: number) {
    const configured = this.asArray(component.inputs?.['columns'])
      .map((item) => (typeof item === 'string' ? item : this.stringValue(this.asRecord(item)['key'])))
      .filter(Boolean);
    if (configured.length) {
      return configured;
    }
    const first = this.rowsFor(component, index)[0];
    return first ? Object.keys(first).slice(0, 8) : [];
  }

  metrics(component: RuntimeScreenComponent) {
    const items = this.asArray(component.inputs?.['metrics']);
    return items
      .map((item) => {
        const object = this.asRecord(item);
        return {
          label: this.stringValue(object['label']) || 'Métrica',
          value: this.stringValue(object['value']) || '0'
        };
      })
      .filter((item) => item.label);
  }

  chartBars(component: RuntimeScreenComponent) {
    const bars = this.asArray(component.inputs?.['bars'])
      .map((item) => {
        const object = this.asRecord(item);
        const value = Number(object['value'] ?? 0);
        return {
          label: this.stringValue(object['label']) || 'Dato',
          value: Number.isFinite(value) ? value : 0
        };
      })
      .filter((item) => item.label);
    const max = Math.max(1, ...bars.map((item) => item.value));
    return bars.map((item) => ({
      ...item,
      percent: Math.max(4, Math.min(100, Math.round((item.value / max) * 100)))
    }));
  }

  detailItems(component: RuntimeScreenComponent, index: number) {
    const row = this.rowsFor(component, index)[0] ?? {};
    const configured = this.asArray(component.inputs?.['fields'])
      .map((item) => {
        const object = this.asRecord(item);
        const label = this.stringValue(object['label']) || this.stringValue(object['key']) || 'Campo';
        const rawValue = object['value'] ?? row[this.stringValue(object['key'])];
        return {
          label,
          value: this.resolveTemplate(rawValue, row)
        };
      })
      .filter((item) => item.label);
    if (configured.length) {
      return configured;
    }
    return Object.entries(row)
      .slice(0, 6)
      .map(([label, value]) => ({
        label,
        value: this.cellValue(value)
      }));
  }

  timelineItems(component: RuntimeScreenComponent, index: number) {
    const configured = this.asArray(component.inputs?.['events'])
      .map((item) => {
        const object = this.asRecord(item);
        return {
          title: this.stringValue(object['title']) || 'Evento',
          description: this.stringValue(object['description']) || '',
          time: this.stringValue(object['time']) || ''
        };
      })
      .filter((item) => item.title);
    if (configured.length) {
      return configured;
    }
    return this.rowsFor(component, index).slice(0, 6).map((row) => ({
      title: this.stringValue(row['title']) || this.stringValue(row['event']) || this.stringValue(row['key']) || 'Evento',
      description: this.stringValue(row['description']) || this.stringValue(row['message']) || '',
      time: this.stringValue(row['createdAt']) || this.stringValue(row['time']) || ''
    }));
  }

  galleryItems(component: RuntimeScreenComponent) {
    return this.asArray(component.inputs?.['items'])
      .map((item) => {
        if (typeof item === 'string') {
          return { url: item, title: '' };
        }
        const object = this.asRecord(item);
        return {
          url: this.stringValue(object['url']),
          title: this.stringValue(object['title'])
        };
      })
      .filter((item) => item.url);
  }

  mapMarkers(component: RuntimeScreenComponent) {
    const markers = this.asArray(component.inputs?.['markers'])
      .map((item) => {
        const object = this.asRecord(item);
        return {
          label: this.stringValue(object['label']) || 'Punto',
          lat: this.stringValue(object['lat']) || '0',
          lng: this.stringValue(object['lng']) || '0'
        };
      })
      .filter((item) => item.label);
    if (markers.length) {
      return markers;
    }
    const center = this.asRecord(component.inputs?.['center']);
    return [
      {
        label: 'Centro',
        lat: this.stringValue(center['lat']) || '0',
        lng: this.stringValue(center['lng']) || '0'
      }
    ];
  }

  toggleModal(component: RuntimeScreenComponent, index: number) {
    const id = this.componentId(component, index);
    this.openModals.update((state) => ({ ...state, [id]: !state[id] }));
  }

  isModalOpen(component: RuntimeScreenComponent, index: number) {
    return Boolean(this.openModals()[this.componentId(component, index)]);
  }

  cellValue(value: unknown) {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  componentId(component: RuntimeScreenComponent, index: number) {
    return component.id || `${component.componentKey || 'component'}_${index}`;
  }

  componentTitle(component: RuntimeScreenComponent) {
    return component.title || this.componentLabel(component.componentKey || 'entity_card');
  }

  componentSubtitle(component: RuntimeScreenComponent) {
    return `${component.componentKey || 'component'} · ${component.region || 'content'}`;
  }

  componentText(component: RuntimeScreenComponent, key: string) {
    const inputs = component.inputs ?? {};
    const value = inputs[key];
    return typeof value === 'string' ? value : '';
  }

  formKey(component: RuntimeScreenComponent) {
    return this.stringValue(component.inputs?.['formKey']) || this.bindingKeyForType(component, 'form') || this.actionTarget(component, 'formKey');
  }

  serviceKey(component: RuntimeScreenComponent) {
    return (
      this.stringValue(component.inputs?.['serviceKey']) ||
      this.actionTarget(component, 'serviceKey') ||
      this.bindingKeyForType(component, 'service')
    );
  }

  flowKey(component: RuntimeScreenComponent) {
    return this.stringValue(component.inputs?.['flowKey']) || this.actionTarget(component, 'flowKey') || this.bindingKeyForType(component, 'flow');
  }

  tableName(component: RuntimeScreenComponent) {
    return (
      this.stringValue(component.inputs?.['table']) ||
      this.stringValue(component.inputs?.['tableName']) ||
      this.bindingKeyForType(component, 'table')
    );
  }

  actionSummary(component: RuntimeScreenComponent) {
    const action = component.actions?.[0];
    return this.stringValue(action?.['type']) || 'sin acción';
  }

  componentGridColumn(component: RuntimeScreenComponent) {
    const width = component.width || 'half';
    const spans: Record<string, string> = {
      full: 'span 12',
      two_thirds: 'span 8',
      half: 'span 6',
      third: 'span 4',
      quarter: 'span 3',
      auto: component.region === 'header' ? 'span 12' : 'span 6'
    };
    return spans[width] ?? 'span 6';
  }

  private async loadRuntime(appKey: string, route: string, target: RuntimeTarget) {
    const token = ++this.loadToken;
    this.lastRequest = { appKey, route, target };
    this.loading.set(true);
    this.error.set('');

    try {
      const response = await firstValueFrom(
        this.api.get<RuntimeRouteResponse>(
          `apps/by-key/${encodeURIComponent(appKey)}/runtime-route?route=${encodeURIComponent(route)}&target=${encodeURIComponent(target)}`
        )
      );
      if (token === this.loadToken) {
        this.runtime.set(response);
        this.componentStates.set({});
        this.actionInputs.set({});
        this.searchQueries.set({});
        this.openModals.set({});
      }
    } catch (error) {
      if (token === this.loadToken) {
        this.runtime.set(null);
        this.error.set(this.errorMessage(error));
      }
    } finally {
      if (token === this.loadToken) {
        this.loading.set(false);
      }
    }
  }

  private normalizeTarget(value: string | null): RuntimeTarget {
    return value === 'admin' || value === 'web' || value === 'mobile' || value === 'desktop' || value === 'multi'
      ? value
      : 'web';
  }

  private componentLabel(key: string) {
    return (
      {
        hero_header: 'Encabezado',
        nav_menu: 'Menú',
        side_nav: 'Menú lateral',
        bottom_nav: 'Menú inferior',
        tabs: 'Pestañas',
        auth_login: 'Login',
        form_runtime: 'Formulario',
        data_table: 'Tabla',
        service_button: 'Servicio',
        flow_button: 'Flow',
        search_panel: 'Búsqueda',
        metric_strip: 'Métricas',
        chart_panel: 'Gráfico',
        detail_panel: 'Detalle',
        timeline: 'Timeline',
        entity_card: 'Card',
        media_gallery: 'Galería',
        map_view: 'Mapa',
        modal_shell: 'Modal'
      }[key] ?? key
    );
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private bindingKeyForType(component: RuntimeScreenComponent, type: string) {
    const bindings = this.asRecord(component.bindings);
    return this.stringValue(bindings['type']) === type ? this.stringValue(bindings['key']) : '';
  }

  private actionTarget(component: RuntimeScreenComponent, key: string) {
    for (const action of component.actions ?? []) {
      const value = this.stringValue(action[key]);
      if (value) {
        return value;
      }
    }
    return '';
  }

  private setComponentState(component: RuntimeScreenComponent, index: number, state: RuntimeComponentState) {
    const id = this.componentId(component, index);
    this.componentStates.update((current) => ({
      ...current,
      [id]: {
        ...state,
        loading: Boolean(state.loading)
      }
    }));
  }

  private inputFromEditor(component: RuntimeScreenComponent, index: number): Record<string, unknown> | null {
    const raw = this.actionInput(component, index).trim();
    if (!raw) {
      return this.defaultInput(component);
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('El JSON debe ser un objeto.');
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSON inválido.';
      this.setComponentState(component, index, { error: message });
      return null;
    }
  }

  private defaultInput(component: RuntimeScreenComponent): Record<string, unknown> {
    const inputs = component.inputs ?? {};
    const candidates = ['defaultInput', 'testInput', 'exampleInput', 'payload', 'context'];
    for (const key of candidates) {
      const value = this.asRecord(inputs[key]);
      if (Object.keys(value).length) {
        return value;
      }
    }
    return {};
  }

  private extractRows(value: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
    }
    const object = this.asRecord(value);
    for (const key of ['rows', 'result', 'items', 'data']) {
      const rows = object[key];
      if (Array.isArray(rows)) {
        return rows.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
      }
    }
    return [];
  }

  private resolveTemplate(value: unknown, row: Record<string, unknown>) {
    if (typeof value !== 'string') {
      return this.cellValue(value);
    }
    const match = value.match(/^\{\{record\.([a-zA-Z0-9_]+)\}\}$/);
    if (match) {
      return this.cellValue(row[match[1]]);
    }
    return value;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private errorMessage(error: unknown) {
    if (typeof error === 'object' && error && 'error' in error) {
      const payload = (error as { error?: { message?: string } }).error;
      if (payload?.message) return payload.message;
    }
    return 'Revisa que la app y la pantalla estén publicadas y que tengas sesión activa.';
  }
}
