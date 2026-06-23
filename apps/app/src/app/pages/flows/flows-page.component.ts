import { JsonPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
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
}

@Component({
  selector: 'app-flows-page',
  standalone: true,
  imports: [FormsModule, IonContent, JsonPipe, MainNavComponent],
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
        .grid {
          grid-template-columns: 1fr;
        }

        .hero {
          display: grid;
        }
      }
    `
  ],
  template: `
    <app-main-nav subtitle="Flow Designer"></app-main-nav>
    <ion-content>
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
                        <select [(ngModel)]="stepDraft.type">
                          @for (type of stepTypes; track type) {
                            <option [value]="type">{{ type }}</option>
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
                    </div>
                    <label style="margin-top: 10px;">
                      Config JSON
                      <textarea [(ngModel)]="stepDraft.configText"></textarea>
                    </label>
                    <label style="margin-top: 10px;">
                      Input map JSON
                      <textarea [(ngModel)]="stepDraft.inputMapText"></textarea>
                    </label>
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
    </ion-content>
  `
})
export class FlowsPageComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  readonly auth = inject(AuthService);

  readonly stepTypes: FlowStepType[] = ['dynamic_service', 'decision', 'formula', 'validation', 'response', 'action', 'start', 'end'];
  flows: FlowItem[] = [];
  selectedFlowId = '';
  message = '';
  flowDraft: FlowDraft = this.emptyFlowDraft();
  stepDraft: StepDraft = this.emptyStepDraft();

  get selectedFlow() {
    return this.flows.find((flow) => flow.id === this.selectedFlowId);
  }

  get canCreate() {
    return this.auth.state.hasPermission('flows.create');
  }

  get canUpdate() {
    return this.auth.state.hasPermission('flows.update');
  }

  get canPublish() {
    return this.auth.state.hasPermission('flows.publish');
  }

  ngOnInit() {
    this.load();
  }

  load(selectId = this.selectedFlowId) {
    this.api.get<FlowItem[]>('flows').subscribe({
      next: (flows) => {
        this.flows = flows;
        const selected = flows.find((flow) => flow.id === selectId) ?? flows[0];
        if (selected) {
          this.selectFlow(selected);
        } else {
          this.startNewFlow();
        }
      },
      error: () => {
        this.message = 'No se pudieron cargar los flows.';
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
      inputMapText: JSON.stringify(step.inputMap ?? {}, null, 2)
    };
  }

  saveStep() {
    const flow = this.selectedFlow;
    if (!flow) {
      return;
    }
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
      inputMapText: '{\n  "value": "{{input.value}}"\n}'
    };
  }
}
