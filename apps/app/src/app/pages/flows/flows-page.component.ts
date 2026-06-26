import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClientService } from '../../core/api/api-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { MainNavComponent } from '../../shared/main-nav/main-nav.component';

type FlowStepType = 'start' | 'dynamic_service' | 'formula' | 'validation' | 'decision' | 'action' | 'response' | 'end';

interface FlowStep {
  id: string;
  key: string;
  name: string;
  type: FlowStepType;
  position: number;
  config?: Record<string, unknown> | null;
  inputMap?: Record<string, unknown> | null;
  outputKey?: string | null;
  nextStepKey?: string | null;
  onTrueStepKey?: string | null;
  onFalseStepKey?: string | null;
  onErrorStepKey?: string | null;
}

interface FlowVersion {
  id: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  definition: Record<string, unknown>;
  publishedAt?: string | null;
  createdAt: string;
}

interface FlowItem {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  status: 'draft' | 'active' | 'paused' | 'trashed';
  steps: FlowStep[];
  latestVersion?: FlowVersion | null;
  publishedVersion?: FlowVersion | null;
  definitionPreview: Record<string, unknown>;
}

interface FlowDraft {
  key: string;
  name: string;
  description: string;
  category: string;
}

interface StepDraft {
  id: string;
  key: string;
  name: string;
  type: FlowStepType;
  position: number;
  outputKey: string;
  nextStepKey: string;
  onTrueStepKey: string;
  onFalseStepKey: string;
  onErrorStepKey: string;
  configText: string;
  inputMapText: string;
  serviceKey: string;
  timeoutMs: number;
  retryAttempts: number;
  retryBackoffMs: number;
  conditionExpression: string;
  formulaExpression: string;
  validationField: string;
  validationOperator: string;
  validationValue: string;
  actionName: string;
  responseStatus: string;
  responseBodyText: string;
  inputRows: StepInputRow[];
  advancedMode: boolean;
}

interface StepInputRow {
  key: string;
  value: string;
}

interface DynamicServiceItem {
  id: string;
  key: string;
  name: string;
  active: boolean;
  description?: string | null;
  latestVersion?: { version: number; status: string } | null;
  publishedVersion?: { version: number; status: string } | null;
}

@Component({
  selector: 'app-flows-page',
  standalone: true,
  imports: [FormsModule, JsonPipe, MainNavComponent],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: #12365a;
        background: #f4f8fc;
      }

      .page {
        max-width: 1220px;
        margin: 0 auto;
        padding: 24px 20px 48px;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
        margin-bottom: 18px;
      }

      .eyebrow,
      .meta {
        color: #526a82;
        font-size: 0.86rem;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(1.7rem, 4vw, 2.5rem);
        line-height: 1.05;
        margin: 6px 0 10px;
      }

      .layout {
        display: grid;
        grid-template-columns: 280px minmax(0, 1fr);
        gap: 16px;
        align-items: start;
      }

      .panel {
        background: #fff;
        border: 1px solid #cbdcee;
        border-radius: 8px;
        padding: 14px;
        box-shadow: 0 16px 36px rgba(30, 80, 130, 0.08);
      }

      .list {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }

      .item {
        border: 1px solid #c8d9eb;
        background: #fff;
        color: #12365a;
        text-align: left;
        border-radius: 8px;
        padding: 11px;
        cursor: pointer;
      }

      .item.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .toolbar,
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .toolbar {
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .builder {
        display: grid;
        grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
        gap: 14px;
        margin-top: 14px;
      }

      label {
        display: grid;
        gap: 5px;
        font-weight: 700;
        font-size: 0.9rem;
      }

      input,
      select,
      textarea {
        width: 100%;
        border: 1px solid #b9cfe6;
        border-radius: 7px;
        min-height: 38px;
        padding: 8px 10px;
        color: #12365a;
        background: #fff;
        font: inherit;
      }

      textarea {
        min-height: 132px;
        resize: vertical;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.86rem;
      }

      button {
        border: 1px solid #b9cfe6;
        background: #fff;
        color: #12365a;
        border-radius: 7px;
        min-height: 36px;
        padding: 8px 12px;
        font-weight: 800;
        cursor: pointer;
      }

      button.primary {
        background: #1f5ca8;
        border-color: #1f5ca8;
        color: #fff;
      }

      button.danger {
        color: #a51d24;
        border-color: #efb4b8;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .steps {
        display: grid;
        gap: 8px;
        margin-top: 10px;
      }

      .step-card {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px;
        border: 1px solid #c8d9eb;
        background: #f8fbff;
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
        text-align: left;
      }

      .step-card.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 42px;
        height: 28px;
        border-radius: 999px;
        background: #e9eef5;
        color: #12365a;
        font-size: 0.78rem;
        font-weight: 900;
      }

      .type-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin: 10px 0;
      }

      .type-button {
        justify-content: flex-start;
        min-height: 58px;
        text-align: left;
      }

      .type-button.active {
        border-color: #1f5ca8;
        background: #eaf3ff;
      }

      .guided-panel {
        display: grid;
        gap: 10px;
        border: 1px solid #d6e4f2;
        border-radius: 8px;
        background: #f8fbff;
        margin-top: 10px;
        padding: 12px;
      }

      .map-row {
        display: grid;
        grid-template-columns: minmax(120px, 0.7fr) minmax(160px, 1fr) auto;
        gap: 8px;
        align-items: end;
      }

      .hint {
        border: 1px solid #d7e5f2;
        border-radius: 8px;
        background: #ffffff;
        color: #526a82;
        padding: 9px 10px;
        line-height: 1.45;
      }

      .mini-title {
        color: #12365a;
        font-size: 0.9rem;
        font-weight: 900;
      }

      pre {
        max-height: 440px;
        overflow: auto;
        margin: 0;
        border-radius: 8px;
        background: #10233a;
        color: #d9ecff;
        padding: 12px;
        font-size: 0.82rem;
      }

      .message {
        margin: 10px 0;
        border: 1px solid #b9d5f0;
        background: #eef7ff;
        border-radius: 8px;
        padding: 10px 12px;
      }

      @media (max-width: 900px) {
        .layout,
        .builder,
        .grid,
        .type-grid,
        .map-row {
          grid-template-columns: 1fr;
        }

        .hero {
          display: grid;
        }
      }
    `
  ],
  template: `
    <app-main-nav contextLabel="Flow Designer"></app-main-nav>
    <main class="page">
        <section class="hero">
          <div>
            <span class="eyebrow">Chicle Flow Engine</span>
            <h1>Flow Designer</h1>
            <p class="meta">
              Construye lógica declarativa: pasos, servicios, decisiones y respuesta final. Esta V1 guarda y versiona la
              receta; el runner vendrá en el siguiente bloque.
            </p>
          </div>
          <button class="primary" type="button" (click)="startNewFlow()" [disabled]="!canCreate">
            Nuevo flow
          </button>
        </section>

        @if (message) {
          <div class="message">{{ message }}</div>
        }

        <section class="layout">
          <aside class="panel">
            <div class="toolbar">
              <h2>Flows</h2>
              <span class="meta">{{ flows.length }} activos</span>
            </div>
            <div class="list">
              @for (flow of flows; track flow.id) {
                <button class="item" type="button" [class.active]="flow.id === selectedFlowId" (click)="selectFlow(flow)">
                  <strong>{{ flow.name }}</strong>
                  <div class="meta">{{ flow.key }} · {{ flow.status }}</div>
                  <div class="meta">
                    {{ flow.steps.length }} pasos · publicada:
                    {{ flow.publishedVersion ? 'v' + flow.publishedVersion.version : 'sin publicar' }}
                  </div>
                </button>
              } @empty {
                <div class="message">Todavía no hay flows.</div>
              }
            </div>
          </aside>

          <section class="panel">
            <div class="toolbar">
              <h2>{{ selectedFlow ? 'Diseñando flow' : 'Crear flow' }}</h2>
              @if (selectedFlow) {
                <div class="row">
                  <button type="button" (click)="createVersion()" [disabled]="!canPublish || selectedFlow.steps.length === 0">
                    Crear versión
                  </button>
                  <button
                    class="primary"
                    type="button"
                    (click)="publishLatest()"
                    [disabled]="!canPublish || !selectedFlow.latestVersion"
                  >
                    Publicar última
                  </button>
                  <button class="danger" type="button" (click)="trashFlow()" [disabled]="!canUpdate">
                    Papelera
                  </button>
                </div>
              }
            </div>

            <div class="grid">
              <label>
                Key
                <input [(ngModel)]="flowDraft.key" placeholder="validar_usuario_reporte" [disabled]="!!selectedFlow" />
              </label>
              <label>
                Nombre
                <input [(ngModel)]="flowDraft.name" placeholder="Validar usuario y generar reporte" />
              </label>
              <label>
                Categoría
                <input [(ngModel)]="flowDraft.category" placeholder="operaciones" />
              </label>
              <label>
                Descripción
                <input [(ngModel)]="flowDraft.description" placeholder="Qué problema resuelve este flow" />
              </label>
            </div>

            <div class="row" style="margin-top: 10px;">
              @if (selectedFlow) {
                <button class="primary" type="button" (click)="saveFlow()" [disabled]="!canUpdate">Guardar flow</button>
              } @else {
                <button class="primary" type="button" (click)="createFlow()" [disabled]="!canCreate">Crear flow</button>
              }
            </div>

            @if (selectedFlow) {
              <div class="builder">
                <section>
                  <div class="toolbar">
                    <div>
                      <h3>Pasos</h3>
                      <p class="meta">Agrega bloques y revisa el JSON generado.</p>
                    </div>
                    <button type="button" (click)="startNewStep()">Nuevo paso</button>
                  </div>

                  <div class="steps">
                    @for (step of selectedFlow.steps; track step.id) {
                      <button
                        class="step-card"
                        type="button"
                        [class.active]="step.id === stepDraft.id"
                        (click)="selectStep(step)"
                      >
                        <span class="badge">{{ step.position }}</span>
                        <span>
                          <strong>{{ step.name }}</strong>
                          <span class="meta">{{ step.key }} · {{ step.type }}</span>
                        </span>
                      </button>
                    } @empty {
                      <div class="message">Agrega el primer paso para generar una definición útil.</div>
                    }
                  </div>

                  <div class="panel" style="margin-top: 12px;">
                    <div class="grid">
                      <label>
                        Key paso
                        <input [(ngModel)]="stepDraft.key" placeholder="consultar_usuario" />
                      </label>
                      <label>
                        Nombre
                        <input [(ngModel)]="stepDraft.name" placeholder="Consultar usuario" />
                      </label>
                      <label>
                        Tipo
                        <select [(ngModel)]="stepDraft.type" (ngModelChange)="onStepTypeChange()">
                          @for (type of stepTypes; track type) {
                            <option [value]="type">{{ stepTypeLabel(type) }}</option>
                          }
                        </select>
                      </label>
                      <label>
                        Posición
                        <input type="number" [(ngModel)]="stepDraft.position" />
                      </label>
                      <label>
                        Output key
                        <input [(ngModel)]="stepDraft.outputKey" placeholder="user" />
                      </label>
                      <label>
                        Siguiente
                        <input [(ngModel)]="stepDraft.nextStepKey" placeholder="validar_edad" />
                      </label>
                      <label>
                        Si verdadero
                        <input [(ngModel)]="stepDraft.onTrueStepKey" placeholder="respuesta_ok" />
                      </label>
                      <label>
                        Si falso
                        <input [(ngModel)]="stepDraft.onFalseStepKey" placeholder="respuesta_rechazo" />
                      </label>
                      <label>
                        Si error
                        <input [(ngModel)]="stepDraft.onErrorStepKey" placeholder="manejar_error" />
                      </label>
                    </div>

                    <div class="guided-panel">
                      <div>
                        <div class="mini-title">Tipo de paso</div>
                        <p class="meta">Elige qué hace este bloque. La configuración JSON se genera desde esta guía.</p>
                      </div>
                      <div class="type-grid">
                        @for (type of stepTypes; track type) {
                          <button
                            class="type-button"
                            type="button"
                            [class.active]="stepDraft.type === type"
                            (click)="setStepType(type)"
                          >
                            <span>
                              <strong>{{ stepTypeLabel(type) }}</strong>
                              <span class="meta">{{ stepTypeSummary(type) }}</span>
                            </span>
                          </button>
                        }
                      </div>
                    </div>

                    <div class="guided-panel">
                      @if (stepDraft.type === 'dynamic_service') {
                        <div class="grid">
                          <label>
                            Servicio publicado
                            <select [(ngModel)]="stepDraft.serviceKey" (ngModelChange)="syncGuidedStepJson()">
                              <option value="">Selecciona un servicio</option>
                              @for (service of publishedServices; track service.id) {
                                <option [value]="service.key">{{ service.name }} · {{ service.key }}</option>
                              }
                            </select>
                          </label>
                          <label>
                            Timeout ms
                            <input type="number" [(ngModel)]="stepDraft.timeoutMs" (ngModelChange)="syncGuidedStepJson()" />
                          </label>
                          <label>
                            Reintentos
                            <input type="number" [(ngModel)]="stepDraft.retryAttempts" (ngModelChange)="syncGuidedStepJson()" />
                          </label>
                          <label>
                            Backoff ms
                            <input type="number" [(ngModel)]="stepDraft.retryBackoffMs" (ngModelChange)="syncGuidedStepJson()" />
                          </label>
                        </div>
                        <div class="hint">
                          Este paso ejecuta un servicio dinámico publicado. Las entradas se toman del input del flow,
                          del tenant, del usuario o de salidas previas: <code>{{ '{{input.email}}' }}</code>,
                          <code>{{ '{{tenant.slug}}' }}</code>, <code>{{ '{{steps.buscar_usuario}}' }}</code>.
                        </div>
                      } @else if (stepDraft.type === 'decision') {
                        <label>
                          Condición
                          <input
                            [(ngModel)]="stepDraft.conditionExpression"
                            (ngModelChange)="syncGuidedStepJson()"
                            placeholder="{{ '{{steps.usuario.active}} === true' }}"
                          />
                        </label>
                        <div class="hint">Si la condición da verdadero usa “Si verdadero”; si no, usa “Si falso”.</div>
                      } @else if (stepDraft.type === 'formula') {
                        <label>
                          Fórmula
                          <input
                            [(ngModel)]="stepDraft.formulaExpression"
                            (ngModelChange)="syncGuidedStepJson()"
                            placeholder="round({{ '{{input.total}}' }} * 0.19, 2)"
                          />
                        </label>
                      } @else if (stepDraft.type === 'validation') {
                        <div class="grid">
                          <label>
                            Campo
                            <input [(ngModel)]="stepDraft.validationField" (ngModelChange)="syncGuidedStepJson()" placeholder="input.email" />
                          </label>
                          <label>
                            Operador
                            <select [(ngModel)]="stepDraft.validationOperator" (ngModelChange)="syncGuidedStepJson()">
                              <option value="required">Requerido</option>
                              <option value="equals">Igual a</option>
                              <option value="not_empty">No vacío</option>
                              <option value="min">Mínimo</option>
                              <option value="max">Máximo</option>
                              <option value="regex">Regex</option>
                            </select>
                          </label>
                          <label>
                            Valor esperado
                            <input [(ngModel)]="stepDraft.validationValue" (ngModelChange)="syncGuidedStepJson()" placeholder="opcional" />
                          </label>
                        </div>
                      } @else if (stepDraft.type === 'response') {
                        <div class="grid">
                          <label>
                            Estado
                            <select [(ngModel)]="stepDraft.responseStatus" (ngModelChange)="syncGuidedStepJson()">
                              <option value="success">success</option>
                              <option value="failed">failed</option>
                              <option value="partial">partial</option>
                            </select>
                          </label>
                          <label>
                            Cuerpo de respuesta JSON
                            <textarea [(ngModel)]="stepDraft.responseBodyText" (ngModelChange)="syncGuidedStepJson()"></textarea>
                          </label>
                        </div>
                      } @else if (stepDraft.type === 'action') {
                        <label>
                          Acción declarativa
                          <select [(ngModel)]="stepDraft.actionName" (ngModelChange)="syncGuidedStepJson()">
                            <option value="create_record">create_record</option>
                            <option value="show_modal">show_modal</option>
                            <option value="navigate">navigate</option>
                            <option value="queue_offline">queue_offline</option>
                            <option value="upload_files">upload_files</option>
                          </select>
                        </label>
                      } @else {
                        <div class="hint">{{ stepTypeSummary(stepDraft.type) }}</div>
                      }
                    </div>

                    <div class="guided-panel">
                      <div class="toolbar">
                        <div>
                          <div class="mini-title">Input map</div>
                          <p class="meta">Define qué datos recibe este paso sin escribir JSON completo.</p>
                        </div>
                        <button type="button" (click)="addInputRow()">Agregar entrada</button>
                      </div>
                      @for (row of stepDraft.inputRows; track $index) {
                        <div class="map-row">
                          <label>
                            Nombre
                            <input [(ngModel)]="row.key" (ngModelChange)="syncGuidedStepJson()" placeholder="email" />
                          </label>
                          <label>
                            Valor
                            <input [(ngModel)]="row.value" (ngModelChange)="syncGuidedStepJson()" placeholder="{{ '{{input.email}}' }}" />
                          </label>
                          <button type="button" (click)="removeInputRow($index)">Quitar</button>
                        </div>
                      } @empty {
                        <div class="hint">Sin entradas. Puedes agregarlas si este paso necesita datos.</div>
                      }
                    </div>

                    <div class="guided-panel">
                      <div class="toolbar">
                        <div>
                          <div class="mini-title">JSON avanzado</div>
                          <p class="meta">Se actualiza con la guía. Actívalo solo si necesitas ajustar algo libre.</p>
                        </div>
                        <label style="display: inline-flex; align-items: center; gap: 6px;">
                          <input type="checkbox" [(ngModel)]="stepDraft.advancedMode" />
                          Editar JSON
                        </label>
                      </div>
                      <div class="grid">
                        <label>
                          Config JSON
                          <textarea [(ngModel)]="stepDraft.configText" [disabled]="!stepDraft.advancedMode"></textarea>
                        </label>
                        <label>
                          Input map JSON
                          <textarea [(ngModel)]="stepDraft.inputMapText" [disabled]="!stepDraft.advancedMode"></textarea>
                        </label>
                      </div>
                    </div>

                    <div class="row" style="margin-top: 10px;">
                      <button class="primary" type="button" (click)="saveStep()" [disabled]="!canUpdate">
                        {{ stepDraft.id ? 'Guardar paso' : 'Agregar paso' }}
                      </button>
                      @if (stepDraft.id) {
                        <button class="danger" type="button" (click)="deleteStep()" [disabled]="!canUpdate">
                          Eliminar paso
                        </button>
                      }
                    </div>
                  </div>
                </section>

                <section>
                  <h3>Preview JSON</h3>
                  <p class="meta" style="margin-bottom: 8px;">Esta definición será el snapshot de la versión.</p>
                  <pre>{{ selectedFlow.definitionPreview | json }}</pre>

                  <div class="panel" style="margin-top: 12px;">
                    <h3>Versiones</h3>
                    <div class="steps">
                      @if (selectedFlow.latestVersion) {
                        <div class="item">
                          <strong>Última v{{ selectedFlow.latestVersion.version }}</strong>
                          <div class="meta">{{ selectedFlow.latestVersion.status }}</div>
                        </div>
                      }
                      @if (selectedFlow.publishedVersion) {
                        <div class="item">
                          <strong>Publicada v{{ selectedFlow.publishedVersion.version }}</strong>
                          <div class="meta">{{ selectedFlow.publishedVersion.publishedAt }}</div>
                        </div>
                      }
                      @if (!selectedFlow.latestVersion) {
                        <div class="message">Sin versiones todavía.</div>
                      }
                    </div>
                  </div>
                </section>
              </div>
            }
          </section>
        </section>
    </main>
  `
})
export class FlowsPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  readonly stepTypes: FlowStepType[] = ['dynamic_service', 'decision', 'formula', 'validation', 'response', 'action', 'start', 'end'];
  flows: FlowItem[] = [];
  services: DynamicServiceItem[] = [];
  selectedFlowId = '';
  message = '';
  loading = false;
  flowDraft: FlowDraft = this.emptyFlowDraft();
  stepDraft: StepDraft = this.emptyStepDraft();

  get selectedFlow() {
    return this.flows.find((flow) => flow.id === this.selectedFlowId);
  }

  get publishedServices() {
    return this.services.filter((service) => service.active && service.publishedVersion);
  }

  get canCreate() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasPermission('flows.create');
  }

  get canUpdate() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasPermission('flows.update');
  }

  get canPublish() {
    return this.auth.state.isOwnerOrAdmin || this.auth.state.hasPermission('flows.publish');
  }

  ngOnInit() {
    this.loadServices();
    this.load();
  }

  loadServices() {
    this.api.get<DynamicServiceItem[]>('dynamic-services').subscribe({
      next: (services) => {
        this.services = services;
      },
      error: () => {
        this.services = [];
      }
    });
  }

  load(selectId = this.selectedFlowId) {
    this.loading = true;
    this.message = 'Cargando Flow Designer...';
    this.api.get<FlowItem[]>('flows').subscribe({
      next: (flows) => {
        this.loading = false;
        this.flows = flows;
        if (this.auth.state.isOwnerOrAdmin && !this.auth.state.hasPermission('flows.read')) {
          this.message = 'Flow Designer listo. Ejecuta Seguridad -> Sincronizar seguridad para instalar permisos flows.* en este tenant.';
        } else {
          this.message = '';
        }
        const selected = flows.find((flow) => flow.id === selectId) ?? flows[0];
        if (selected) {
          this.selectFlow(selected);
        } else {
          this.startNewFlow();
        }
      },
      error: () => {
        this.loading = false;
        this.flows = [];
        this.startNewFlow();
        this.message = 'No se pudieron cargar los flows. Verifica que la API esté arriba, que la sesión siga activa y que Seguridad -> Sincronizar seguridad haya instalado flows.*.';
      }
    });
  }

  startNewFlow() {
    this.selectedFlowId = '';
    this.flowDraft = this.emptyFlowDraft();
    this.stepDraft = this.emptyStepDraft();
  }

  selectFlow(flow: FlowItem) {
    this.selectedFlowId = flow.id;
    this.flowDraft = {
      key: flow.key,
      name: flow.name,
      description: flow.description ?? '',
      category: flow.category ?? ''
    };
    this.stepDraft = this.emptyStepDraft(flow.steps.length ? Math.max(...flow.steps.map((step) => step.position)) + 10 : 10);
  }

  createFlow() {
    this.api.post<FlowItem>('flows', this.flowDraft).subscribe({
      next: (flow) => {
        this.message = 'Flow creado.';
        this.flows = [flow, ...this.flows];
        this.selectFlow(flow);
      },
      error: () => {
        this.message = 'No se pudo crear el flow. Revisa key y nombre.';
      }
    });
  }

  saveFlow() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api.patch<FlowItem>(`flows/${flow.id}`, this.flowDraft).subscribe({
      next: (updated) => {
        this.message = 'Flow actualizado.';
        this.replaceFlow(updated);
      },
      error: () => {
        this.message = 'No se pudo guardar el flow.';
      }
    });
  }

  trashFlow() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api.post<FlowItem>(`flows/${flow.id}/trash`, {}).subscribe({
      next: () => {
        this.message = 'Flow enviado a papelera.';
        this.load('');
      },
      error: () => {
        this.message = 'No se pudo enviar a papelera.';
      }
    });
  }

  startNewStep() {
    const flow = this.selectedFlow;
    this.stepDraft = this.emptyStepDraft(flow?.steps.length ? Math.max(...flow.steps.map((step) => step.position)) + 10 : 10);
  }

  selectStep(step: FlowStep) {
    this.stepDraft = {
      ...this.emptyStepDraft(step.position),
      id: step.id,
      key: step.key,
      name: step.name,
      type: step.type,
      position: step.position,
      outputKey: step.outputKey ?? '',
      nextStepKey: step.nextStepKey ?? '',
      onTrueStepKey: step.onTrueStepKey ?? '',
      onFalseStepKey: step.onFalseStepKey ?? '',
      onErrorStepKey: step.onErrorStepKey ?? '',
      configText: JSON.stringify(step.config ?? {}, null, 2),
      inputMapText: JSON.stringify(step.inputMap ?? {}, null, 2),
      ...this.guidedFieldsFromStep(step)
    };
  }

  setStepType(type: FlowStepType) {
    this.stepDraft.type = type;
    this.onStepTypeChange();
  }

  onStepTypeChange() {
    const labels: Record<FlowStepType, string> = {
      start: 'Inicio',
      dynamic_service: 'Ejecutar servicio',
      formula: 'Calcular valor',
      validation: 'Validar dato',
      decision: 'Tomar decisión',
      action: 'Ejecutar acción',
      response: 'Responder',
      end: 'Fin'
    };
    if (!this.stepDraft.name) {
      this.stepDraft.name = labels[this.stepDraft.type];
    }
    if (!this.stepDraft.key) {
      this.stepDraft.key = this.slugify(labels[this.stepDraft.type]);
    }
    this.syncGuidedStepJson();
  }

  addInputRow() {
    this.stepDraft.inputRows = [...this.stepDraft.inputRows, { key: '', value: '' }];
    this.syncGuidedStepJson();
  }

  removeInputRow(index: number) {
    this.stepDraft.inputRows = this.stepDraft.inputRows.filter((_, itemIndex) => itemIndex !== index);
    this.syncGuidedStepJson();
  }

  syncGuidedStepJson() {
    if (this.stepDraft.advancedMode) {
      return;
    }
    this.stepDraft.configText = JSON.stringify(this.guidedConfig(), null, 2);
    this.stepDraft.inputMapText = JSON.stringify(this.guidedInputMap(), null, 2);
  }

  stepTypeLabel(type: FlowStepType) {
    const labels: Record<FlowStepType, string> = {
      start: 'Inicio',
      dynamic_service: 'Servicio',
      formula: 'Fórmula',
      validation: 'Validación',
      decision: 'Decisión',
      action: 'Acción',
      response: 'Respuesta',
      end: 'Fin'
    };
    return labels[type];
  }

  stepTypeSummary(type: FlowStepType) {
    const summaries: Record<FlowStepType, string> = {
      start: 'Marca la entrada del proceso.',
      dynamic_service: 'Consume un servicio dinámico publicado.',
      formula: 'Calcula valores a partir del contexto.',
      validation: 'Verifica campos antes de avanzar.',
      decision: 'Divide el camino en verdadero o falso.',
      action: 'Ejecuta una acción declarativa.',
      response: 'Construye la salida final.',
      end: 'Cierra el proceso.'
    };
    return summaries[type];
  }

  saveStep() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.syncGuidedStepJson();
    let payload: Record<string, unknown>;
    try {
      payload = this.stepPayload();
    } catch {
      this.message = 'El JSON del paso no es válido.';
      return;
    }
    const request = this.stepDraft.id
      ? this.api.patch<FlowItem>(`flows/${flow.id}/steps/${this.stepDraft.id}`, payload)
      : this.api.post<FlowItem>(`flows/${flow.id}/steps`, payload);

    request.subscribe({
      next: (updated) => {
        this.message = this.stepDraft.id ? 'Paso actualizado.' : 'Paso agregado.';
        this.replaceFlow(updated);
        this.startNewStep();
      },
      error: () => {
        this.message = 'No se pudo guardar el paso. Revisa el JSON y los campos obligatorios.';
      }
    });
  }

  deleteStep() {
    const flow = this.selectedFlow;
    if (!flow || !this.stepDraft.id) {
      return;
    }
    this.api.delete<FlowItem>(`flows/${flow.id}/steps/${this.stepDraft.id}`).subscribe({
      next: (updated) => {
        this.message = 'Paso eliminado.';
        this.replaceFlow(updated);
        this.startNewStep();
      },
      error: () => {
        this.message = 'No se pudo eliminar el paso.';
      }
    });
  }

  createVersion() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
    this.api.post<FlowVersion>(`flows/${flow.id}/versions`, {}).subscribe({
      next: () => {
        this.message = 'Versión creada desde los pasos actuales.';
        this.load(flow.id);
      },
      error: () => {
        this.message = 'No se pudo crear la versión.';
      }
    });
  }

  publishLatest() {
    const flow = this.selectedFlow;
    if (!flow?.latestVersion) {
      return;
    }
    this.api.post<FlowVersion>(`flows/${flow.id}/versions/${flow.latestVersion.id}/publish`, {}).subscribe({
      next: () => {
        this.message = 'Versión publicada.';
        this.load(flow.id);
      },
      error: () => {
        this.message = 'No se pudo publicar la versión.';
      }
    });
  }

  private replaceFlow(flow: FlowItem) {
    this.flows = this.flows.map((item) => (item.id === flow.id ? flow : item));
    this.selectFlow(flow);
  }

  private guidedConfig() {
    const timeoutMs = Number(this.stepDraft.timeoutMs) || 0;
    const retryAttempts = Number(this.stepDraft.retryAttempts) || 0;
    const retryBackoffMs = Number(this.stepDraft.retryBackoffMs) || 0;
    switch (this.stepDraft.type) {
      case 'dynamic_service':
        return {
          serviceKey: this.stepDraft.serviceKey,
          timeoutMs,
          retry: {
            attempts: retryAttempts,
            backoffMs: retryBackoffMs
          }
        };
      case 'decision':
        return {
          expression: this.stepDraft.conditionExpression
        };
      case 'formula':
        return {
          expression: this.stepDraft.formulaExpression
        };
      case 'validation':
        return {
          field: this.stepDraft.validationField,
          operator: this.stepDraft.validationOperator,
          value: this.stepDraft.validationValue || null
        };
      case 'action':
        return {
          action: this.stepDraft.actionName
        };
      case 'response':
        return {
          status: this.stepDraft.responseStatus,
          body: this.parseJsonLenient(this.stepDraft.responseBodyText)
        };
      case 'start':
        return {
          mode: 'manual'
        };
      case 'end':
        return {
          status: 'completed'
        };
    }
  }

  private guidedInputMap() {
    return this.stepDraft.inputRows.reduce<Record<string, string>>((map, row) => {
      const key = row.key.trim();
      if (key) {
        map[key] = row.value;
      }
      return map;
    }, {});
  }

  private guidedFieldsFromStep(step: FlowStep): Partial<StepDraft> {
    const config = step.config ?? {};
    const inputMap = step.inputMap ?? {};
    const retry = this.asRecord(config['retry']);
    return {
      serviceKey: this.asString(config['serviceKey']),
      timeoutMs: this.asNumber(config['timeoutMs'], 8000),
      retryAttempts: this.asNumber(retry['attempts'], 0),
      retryBackoffMs: this.asNumber(retry['backoffMs'], 0),
      conditionExpression: this.asString(config['expression']),
      formulaExpression: this.asString(config['expression']),
      validationField: this.asString(config['field']),
      validationOperator: this.asString(config['operator']) || 'required',
      validationValue: config['value'] === null || config['value'] === undefined ? '' : String(config['value']),
      actionName: this.asString(config['action']) || 'create_record',
      responseStatus: this.asString(config['status']) || 'success',
      responseBodyText: JSON.stringify(config['body'] ?? { ok: true, data: '{{steps}}' }, null, 2),
      inputRows: Object.entries(inputMap).map(([key, value]) => ({ key, value: String(value) })),
      advancedMode: false
    };
  }

  private stepPayload() {
    return {
      key: this.stepDraft.key,
      name: this.stepDraft.name,
      type: this.stepDraft.type,
      position: Number(this.stepDraft.position),
      outputKey: this.stepDraft.outputKey || null,
      nextStepKey: this.stepDraft.nextStepKey || null,
      onTrueStepKey: this.stepDraft.onTrueStepKey || null,
      onFalseStepKey: this.stepDraft.onFalseStepKey || null,
      onErrorStepKey: this.stepDraft.onErrorStepKey || null,
      config: this.parseJson(this.stepDraft.configText),
      inputMap: this.parseJson(this.stepDraft.inputMapText)
    };
  }

  private parseJson(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return {};
    }
    return JSON.parse(trimmed) as Record<string, unknown>;
  }

  private parseJsonLenient(value: string) {
    try {
      return this.parseJson(value);
    } catch {
      return { raw: value };
    }
  }

  private emptyFlowDraft(): FlowDraft {
    return {
      key: '',
      name: '',
      description: '',
      category: ''
    };
  }

  private emptyStepDraft(position = 10): StepDraft {
    return {
      id: '',
      key: '',
      name: '',
      type: 'dynamic_service',
      position,
      outputKey: '',
      nextStepKey: '',
      onTrueStepKey: '',
      onFalseStepKey: '',
      onErrorStepKey: '',
      configText: '{\n  "serviceKey": ""\n}',
      inputMapText: '{\n  "value": "{{input.value}}"\n}',
      serviceKey: '',
      timeoutMs: 8000,
      retryAttempts: 0,
      retryBackoffMs: 0,
      conditionExpression: '{{steps.servicio.ok}} === true',
      formulaExpression: '{{input.value}}',
      validationField: 'input.value',
      validationOperator: 'required',
      validationValue: '',
      actionName: 'create_record',
      responseStatus: 'success',
      responseBodyText: '{\n  "ok": true,\n  "data": "{{steps}}"\n}',
      inputRows: [{ key: 'value', value: '{{input.value}}' }],
      advancedMode: false
    };
  }

  private asRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  private asString(value: unknown) {
    return typeof value === 'string' ? value : '';
  }

  private asNumber(value: unknown, fallback: number) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
