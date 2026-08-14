import { Component, inject } from "@angular/core";
import { ApiClientService } from "../../core/api/api-client.service";
import { UiKitPreference } from "../../core/ui/ui-presentation.types";
import { DeclarativeActionRuntimeService } from "../../engine/components/declarative-action-runtime.service";
import { DeclarativeBindingResolverService } from "../../engine/components/declarative-binding-resolver.service";
import { DeclarativeComponentRendererComponent } from "../../engine/components/declarative-component-renderer.component";
import {
  DeclarativeComponentActionEvent,
  DeclarativeComponentContext,
  DeclarativeComponentContract,
} from "../../engine/components/declarative-component.types";
import { RuntimeField } from "../../engine/forms/form-runtime.service";
import { AdminPanelComponent } from "../admin-panel/admin-panel.component";
import { CodeTextareaComponent } from "../code-textarea/code-textarea.component";
import { DynamicFieldControlComponent } from "../dynamic-field-control/dynamic-field-control.component";
import { StatusNoticeComponent } from "../status-notice/status-notice.component";
import { UiKitButtonComponent } from "../ui-kit-button/ui-kit-button.component";

interface ComponentValidationResponse {
  ok: boolean;
  contract: DeclarativeComponentContract;
  checks: Array<{ key: string; ok: boolean; message: string }>;
}

@Component({
  selector: "app-declarative-runtime-lab",
  standalone: true,
  imports: [
    AdminPanelComponent,
    CodeTextareaComponent,
    DeclarativeComponentRendererComponent,
    DynamicFieldControlComponent,
    StatusNoticeComponent,
    UiKitButtonComponent,
  ],
  host: {
    "[attr.data-ui-kit]": "selectedKit",
  },
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .lab {
        display: grid;
        gap: 16px;
        min-width: 0;
      }

      .flow {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .flow-card,
      .surface,
      .event-card {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
      }

      .flow-card {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 12px;
        padding: 14px;
      }

      .number {
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: var(--ch-color-primary);
        color: var(--ch-color-primary-contrast);
        font-weight: 900;
      }

      .flow-card strong,
      .surface h3,
      .event-card strong {
        color: var(--ch-color-text);
      }

      .flow-card p,
      .surface p,
      .event-card span {
        color: var(--ch-color-muted);
      }

      .flow-card strong,
      .event-card strong {
        display: block;
        margin-bottom: 4px;
      }

      .workspace {
        display: grid;
        grid-template-columns: minmax(330px, 0.95fr) minmax(420px, 1.05fr);
        gap: 14px;
        align-items: start;
      }

      .surface {
        display: grid;
        gap: 14px;
        min-width: 0;
        padding: 16px;
      }

      .surface-header,
      .inline-actions,
      .state-row,
      .check-row {
        display: flex;
        gap: 10px;
      }

      .surface-header {
        align-items: flex-start;
        justify-content: space-between;
      }

      .surface h3,
      .surface p {
        margin: 0;
      }

      .inline-actions {
        flex-wrap: wrap;
      }

      .state-row {
        flex-wrap: wrap;
        align-items: center;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 4px 9px;
        font-size: 0.78rem;
        font-weight: 850;
        white-space: nowrap;
      }

      .preview-frame {
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        min-height: 460px;
        overflow: auto;
        padding: 20px;
      }

      .inspection-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .event-list {
        display: grid;
        gap: 8px;
        max-height: 340px;
        overflow: auto;
        padding-right: 2px;
      }

      .coverage-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .coverage-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .coverage-list li {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border: 1px solid var(--ch-color-border);
        border-radius: 999px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        padding: 4px 9px;
        font-size: 0.78rem;
        font-weight: 850;
      }

      .coverage-list.rendered li {
        border-color: var(--ch-color-success-border);
        background: var(--ch-color-success-soft);
      }

      .coverage-list.pending li {
        border-color: var(--ch-color-warning-border);
        background: var(--ch-color-warning-soft);
      }

      .event-card {
        display: grid;
        gap: 4px;
        min-width: 0;
        padding: 10px;
      }

      .event-card code {
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        overflow-wrap: anywhere;
      }

      .check-row {
        align-items: flex-start;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px;
      }

      .check-dot {
        display: inline-grid;
        place-items: center;
        flex: 0 0 auto;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: var(--ch-color-success-soft);
        color: var(--ch-color-success);
        font-weight: 900;
      }

      .check-row.failed .check-dot {
        background: var(--ch-color-danger-soft);
        color: var(--ch-color-danger);
      }

      .check-row p {
        margin: 0;
      }

      @media (max-width: 980px) {
        .flow,
        .workspace,
        .inspection-grid,
        .coverage-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `
    <section class="lab" aria-label="C-Declarativos">
      <app-admin-panel
        eyebrow="Mapa rápido"
        title="Del objeto declarativo a la pantalla"
        description="Esta página muestra el camino completo: un JSON describe el componente, el intérprete visual lo pinta y los eventos ejecutan acciones seguras."
      >
        <div class="flow" aria-label="Flujo declarativo">
          <article class="flow-card">
            <span class="number">1</span>
            <div>
              <strong>Objeto JSON</strong>
              <p>
                Define componentKey, props, bindings, permisos, acciones y
                children. No es HTML ni código por pantalla.
              </p>
            </div>
          </article>
          <article class="flow-card">
            <span class="number">2</span>
            <div>
              <strong>Renderer central</strong>
              <p>
                Resuelve estado, datos, kit visual y permisos antes de pintar
                componentes registrados.
              </p>
            </div>
          </article>
          <article class="flow-card">
            <span class="number">3</span>
            <div>
              <strong>Acciones seguras</strong>
              <p>
                Los eventos llaman navegación, servicios, flows, estado,
                mensajes o cola offline desde un único runner.
              </p>
            </div>
          </article>
        </div>
      </app-admin-panel>

      <div class="coverage-grid" aria-label="Cobertura declarativa actual">
        <section class="surface">
          <header class="surface-header">
            <div>
              <h3>Renderiza hoy</h3>
              <p>
                Estos componentKey ya tienen adapter real en el renderer central
                y responden al kit visual activo.
              </p>
            </div>
          </header>
          <ul class="coverage-list rendered">
            @for (key of renderedComponentKeys; track key) {
              <li>{{ key }}</li>
            }
          </ul>
        </section>

        <section class="surface">
          <header class="surface-header">
            <div>
              <h3>Registrado para próximas tandas</h3>
              <p>
                Estos adapters pertenecen a las siguientes tandas de apps:
                necesitan permisos, datos o shell de pantalla antes de quedar
                como bloques finales del diseñador.
              </p>
            </div>
          </header>
          <ul class="coverage-list pending">
            @for (key of pendingComponentKeys; track key) {
              <li>{{ key }}</li>
            }
          </ul>
        </section>
      </div>

      <div class="workspace">
        <section class="surface">
          <header class="surface-header">
            <div>
              <h3>Entrada del contrato</h3>
              <p>Modifica el contrato, aplícalo al preview y valida contra el backend.</p>
            </div>
          </header>
          <app-dynamic-field-control
            [field]="kitField"
            [value]="selectedKit"
            [presentation]="{ kit: selectedKit }"
            (valueChange)="setSelectedKit($event)"
          ></app-dynamic-field-control>
          <app-code-textarea
            controlId="declarative-lab-json"
            label="JSON declarativo"
            [value]="contractDraft"
            minHeight="360px"
            maxHeight="68vh"
            (valueChange)="contractDraft = $event"
          ></app-code-textarea>
          <div class="inline-actions">
            <app-ui-kit-button
              label="Aplicar JSON"
              icon="pi pi-play"
              [kit]="selectedKit"
              (pressed)="applyJson()"
            ></app-ui-kit-button>
            <app-ui-kit-button
              label="Validar backend"
              icon="pi pi-check-circle"
              tone="secondary"
              variant="outline"
              [kit]="selectedKit"
              (pressed)="validateContract()"
            ></app-ui-kit-button>
            <app-ui-kit-button
              label="Restaurar ejemplo"
              icon="pi pi-refresh"
              tone="secondary"
              variant="outline"
              [kit]="selectedKit"
              (pressed)="restoreExample()"
            ></app-ui-kit-button>
          </div>
          @if (jsonMessage) {
            <app-status-notice [kit]="selectedKit" [tone]="jsonMessage.tone">
              {{ jsonMessage.text }}
            </app-status-notice>
          }
        </section>

        <section class="surface">
          <header class="surface-header">
            <div>
              <h3>Preview funcional</h3>
              <p>
                Edita el campo y prueba los botones. Esto dispara acciones
                reales del C-Declarativos.
              </p>
            </div>
          </header>
          <div class="state-row" aria-label="Estado actual">
            <span class="chip">kit: {{ selectedKit }}</span>
            <span class="chip">state.sampleName: {{ sampleName }}</span>
            <span class="chip">permisos: components.read/manage</span>
          </div>
          <div class="preview-frame">
            <app-declarative-component-renderer
              [contract]="activeContract"
              [context]="declarativeContext"
              [kit]="selectedKit"
              (action)="captureDeclarativeAction($event)"
            ></app-declarative-component-renderer>
          </div>
          <app-status-notice [kit]="selectedKit" tone="info">
            El shell de esta página sigue siendo Admin. El cambio de kit aplica
            al objeto renderizado dentro del preview y a sus adapters reales.
          </app-status-notice>
        </section>
      </div>

      <div class="inspection-grid">
        <section class="surface">
          <header class="surface-header">
            <div>
              <h3>Validación y salida resuelta</h3>
              <p>Confirma que el backend acepta el contrato y mira las props resueltas.</p>
            </div>
          </header>
          @for (check of validationChecks; track check.key) {
            <div class="check-row" [class.failed]="!check.ok">
              <span class="check-dot">{{ check.ok ? "✓" : "!" }}</span>
              <p>{{ check.message }}</p>
            </div>
          } @empty {
            <app-status-notice [kit]="selectedKit" tone="info">
              Pulsa “Validar backend” para revisar componentKey, children,
              bindings y acciones.
            </app-status-notice>
          }
          <app-code-textarea
            controlId="declarative-lab-resolved"
            label="Props resueltas del nodo raíz"
            [value]="resolvedPropsJson"
            minHeight="180px"
            maxHeight="320px"
            [disabled]="true"
          ></app-code-textarea>
        </section>

        <section class="surface">
          <header class="surface-header">
            <div>
              <h3>Eventos, historial y offline</h3>
              <p>Observa qué acción salió, cuánto tardó y qué quedó en cola.</p>
            </div>
            <div class="inline-actions">
              <app-ui-kit-button
                label="Limpiar"
                icon="pi pi-trash"
                size="small"
                tone="secondary"
                variant="outline"
                [kit]="selectedKit"
                (pressed)="clearRuntime()"
              ></app-ui-kit-button>
            </div>
          </header>
          <div class="event-list">
            @if (lastActionEventJson) {
              <article class="event-card">
                <strong>Último evento del renderer</strong>
                <code>{{ lastActionEventJson }}</code>
              </article>
            }
            @for (item of declarativeHistory; track item.id) {
              <article class="event-card">
                <strong>{{ item.type }} · {{ item.status }}</strong>
                <span>
                  {{ item.componentKey || "sin componentKey" }} ·
                  {{ item.durationMs ?? 0 }} ms
                </span>
              </article>
            } @empty {
              <app-status-notice [kit]="selectedKit" tone="info">
                Ejecuta una acción desde el preview para llenar el historial.
              </app-status-notice>
            }
            @for (item of declarativeOfflineQueue; track item.id) {
              <article class="event-card">
                <strong>Offline: {{ item.queueKey }} · {{ item.status }}</strong>
                <code>{{ stringifyShort(item.payload) }}</code>
              </article>
            }
          </div>
        </section>
      </div>
    </section>
  `,
})
export class DeclarativeRuntimeLabComponent {
  private readonly api = inject(ApiClientService);
  private readonly actionRuntime = inject(DeclarativeActionRuntimeService);
  private readonly bindingResolver = inject(DeclarativeBindingResolverService);

  selectedKit: UiKitPreference = "primeng";
  sampleName = "Chicle";
  jsonMessage: { tone: "success" | "warning" | "error" | "info"; text: string } | null =
    null;
  validationChecks: ComponentValidationResponse["checks"] = [];
  lastActionEventJson = "";

  readonly renderedComponentKeys = [
    "ui.button",
    "ui.action_group",
    "ui.badge",
    "form.field",
    "ui.card",
    "layout.stack",
    "layout.grid",
    "layout.region",
    "feedback.alert",
    "feedback.toast",
    "feedback.loading",
    "feedback.skeleton",
    "nav.menu",
    "nav.tabs",
    "nav.toolbar",
    "data.table",
    "data.list",
    "data.detail",
    "data.metric_strip",
    "media.gallery",
    "overlay.modal",
    "auth.login",
    "app.shell",
    "app.home_menu",
    "form.runtime",
    "service.result",
    "flow.trigger_button",
    "record.list",
    "record.detail",
    "nav.side_menu",
    "nav.bottom_tabs",
    "chart.panel",
    "map.view",
    "status.offline",
    "status.sync_queue",
  ];

  readonly pendingComponentKeys = [
    "form.mobile_shell",
    "service.result_actions",
    "flow.stepper",
    "record.editor",
    "nav.breadcrumbs",
    "overlay.action_sheet",
    "media.camera_capture",
    "map.gps_capture",
  ];

  readonly exampleContract = this.createExampleContract();
  activeContract: DeclarativeComponentContract = this.exampleContract;
  contractDraft = this.stringify(this.exampleContract);

  readonly kitField: RuntimeField = {
    name: "declarative-kit",
    type: "select",
    label: "Kit visual de prueba",
    options: [
      { label: "PrimeNG", value: "primeng" },
      { label: "Ionic", value: "ionic" },
      { label: "Material", value: "material" },
      { label: "Bootstrap", value: "bootstrap" },
      { label: "Base HTML", value: "native" },
    ],
  };

  get declarativeContext(): DeclarativeComponentContext {
    return {
      kit: this.selectedKit,
      state: {
        sampleName: this.sampleName,
      },
      permissions: ["components.read", "components.manage"],
      data: {
        source: "declarative_runtime_lab",
        menuItems: [
          { key: "home", label: "Inicio", description: "Panel principal", route: "/home", badge: "base" },
          { key: "forms", label: "Formularios", description: "Captura dinámica", route: "/forms", badge: "app" },
          { key: "services", label: "Servicios", description: "Consultas y acciones", route: "/services", badge: "api" },
        ],
        metrics: [
          { key: "components", label: "Componentes", value: "24", help: "Renderizables hoy", tone: "success" },
          { key: "queued", label: "Offline", value: "1", help: "Acción en cola", tone: "warning" },
          { key: "apps", label: "Apps", value: "3", help: "Drafts de ejemplo", tone: "primary" },
        ],
        record: {
          app: "Mi app",
          route: "/inicio",
          target: "web/mobile",
          kit: this.selectedKit,
        },
        serviceResult: {
          ok: true,
          source: "dynamic_service",
          rows: 2,
          durationMs: 42,
        },
        rows: [
          { name: "Cliente", status: "Activo", owner: "Admin" },
          { name: "Inspección", status: "Draft", owner: "Operador" },
        ],
      },
    };
  }

  get resolvedPropsJson() {
    return this.stringify(
      this.bindingResolver.resolveProps(
        this.activeContract,
        this.declarativeContext,
      ),
    );
  }

  get declarativeHistory() {
    return this.actionRuntime.history().slice(0, 6);
  }

  get declarativeOfflineQueue() {
    return this.actionRuntime.offlineQueue().slice(-4).reverse();
  }

  setSelectedKit(value: unknown) {
    if (
      value === "primeng" ||
      value === "ionic" ||
      value === "material" ||
      value === "bootstrap" ||
      value === "native"
    ) {
      this.selectedKit = value;
    }
  }

  applyJson() {
    try {
      const parsed = JSON.parse(this.contractDraft) as DeclarativeComponentContract;
      this.activeContract = parsed;
      this.contractDraft = this.stringify(parsed);
      this.validationChecks = [];
      this.jsonMessage = {
        tone: "success",
        text: "JSON aplicado al preview. Valídalo contra backend antes de publicarlo.",
      };
    } catch (error) {
      this.jsonMessage = {
        tone: "error",
        text: this.errorText(error, "El JSON no es válido."),
      };
    }
  }

  validateContract() {
    this.applyJson();
    if (this.jsonMessage?.tone === "error") {
      return;
    }
    this.api
      .post<ComponentValidationResponse>("components/validate", this.activeContract)
      .subscribe({
        next: (response) => {
          this.activeContract = response.contract;
          this.contractDraft = this.stringify(response.contract);
          this.validationChecks = response.checks;
          this.jsonMessage = {
            tone: "success",
            text: "Contrato validado y normalizado por backend.",
          };
        },
        error: (error) => {
          this.validationChecks = [];
          this.jsonMessage = {
            tone: "error",
            text: this.errorText(error, "No se pudo validar el contrato."),
          };
        },
      });
  }

  restoreExample() {
    this.sampleName = "Chicle";
    this.activeContract = this.createExampleContract();
    this.contractDraft = this.stringify(this.activeContract);
    this.validationChecks = [];
    this.lastActionEventJson = "";
    this.jsonMessage = {
      tone: "info",
      text: "Ejemplo restaurado. Puedes editar el JSON o probar el preview.",
    };
  }

  captureDeclarativeAction(event: DeclarativeComponentActionEvent) {
    if (event.eventName === "valueChange" && typeof event.value === "string") {
      this.sampleName = event.value;
    }
    this.lastActionEventJson = this.stringify({
      eventName: event.eventName,
      componentKey: event.source.componentKey,
      action: event.action,
      value: event.value,
    });
  }

  clearRuntime() {
    this.actionRuntime.clearHistory();
    this.actionRuntime.clearOfflineQueue();
    this.lastActionEventJson = "";
  }

  stringifyShort(value: unknown) {
    const json = JSON.stringify(value);
    return json.length > 180 ? `${json.slice(0, 180)}...` : json;
  }

  private createExampleContract(): DeclarativeComponentContract {
    return {
      schemaVersion: 1,
      kind: "dynamic_component",
      componentKey: "app.shell",
      props: {
        title: "Panel declarativo",
        subtitle: "Navegación, datos y acciones desde JSON.",
        menuItems: [],
      },
      bindings: {
        "props.menuItems": "{{data.menuItems}}",
      },
      children: [
        {
          componentKey: "layout.region",
          props: {
            gap: "12px",
            title: "1. Navegación y comandos",
            subtitle: "El shell puede pintar menús, tabs y acciones sin código de pantalla.",
          },
          children: [
            {
              componentKey: "nav.toolbar",
              props: {
                title: "Toolbar declarativo",
                subtitle: "Acciones seguras y auditables.",
                actions: [
                  {
                    key: "validate",
                    label: "Validar",
                    icon: "pi pi-check",
                    tone: "secondary",
                    action: {
                      type: "show_message",
                      tone: "info",
                      message: "Toolbar declarativo activo.",
                    },
                  },
                  {
                    key: "publish",
                    label: "Publicar",
                    icon: "pi pi-send",
                    tone: "success",
                    variant: "solid",
                    action: {
                      type: "show_message",
                      tone: "success",
                      message: "Acción de publicación simulada.",
                    },
                  },
                ],
              },
            },
            {
              componentKey: "nav.tabs",
              props: {
                activeKey: "home",
                items: [],
              },
              bindings: {
                "props.items": "{{data.menuItems}}",
              },
            },
          ],
        },
        {
          componentKey: "layout.region",
          props: {
            gap: "12px",
            title: "2. Entrada y acción",
            subtitle: "El campo actualiza estado y los botones consumen el action runner.",
          },
          children: [
            {
              componentKey: "ui.card",
              props: {
                title: "Tarjeta creada desde JSON",
                subtitle: "El campo guarda estado y los botones disparan acciones declarativas.",
                variant: "subtle",
                padding: "16px",
              },
              children: [
                {
                  componentKey: "form.field",
                  props: {
                    field: {
                      name: "sampleName",
                      label: "Nombre",
                      type: "text",
                      placeholder: "Escribe un valor",
                    },
                    value: "",
                  },
                  bindings: {
                    "props.value": "{{state.sampleName}}",
                  },
                  actions: {
                    valueChange: {
                      type: "set_state",
                      key: "sampleName",
                      value: "{{value}}",
                    },
                  },
                },
                {
                  componentKey: "ui.action_group",
                  props: {
                    actions: [
                      {
                        key: "message",
                        label: "Mostrar mensaje",
                        tone: "primary",
                        variant: "solid",
                        action: {
                          type: "show_message",
                          tone: "success",
                          message: "Acción declarativa ejecutada para {{state.sampleName}}.",
                          permissions: ["components.read"],
                        },
                      },
                      {
                        key: "offline",
                        label: "Guardar offline",
                        tone: "secondary",
                        variant: "outline",
                        action: {
                          type: "queue_offline",
                          queueKey: "component_lab",
                          payloadMap: {
                            name: "{{state.sampleName}}",
                            source: "declarative_runtime_lab",
                          },
                          permissions: ["components.manage"],
                        },
                      },
                    ],
                  },
                },
                {
                  componentKey: "feedback.alert",
                  props: {
                    title: "Salida resuelta",
                    tone: "info",
                    message: "",
                  },
                  bindings: {
                    "props.message": "El renderer resolvió el nombre actual como {{state.sampleName}}.",
                  },
                },
              ],
            },
          ],
        },
        {
          componentKey: "layout.region",
          props: {
            gap: "12px",
            title: "3. Datos y navegación de app",
            subtitle: "Listas, tablas, detalle, métricas y menú de home comparten el mismo contrato.",
          },
          children: [
            {
              componentKey: "data.metric_strip",
              props: {
                items: [],
              },
              bindings: {
                "props.items": "{{data.metrics}}",
              },
            },
            {
              componentKey: "layout.grid",
              props: {
                gap: "12px",
                minColumnWidth: "260px",
              },
              children: [
                {
                  componentKey: "app.home_menu",
                  props: {
                    items: [],
                  },
                  bindings: {
                    "props.items": "{{data.menuItems}}",
                  },
                },
                {
                  componentKey: "data.table",
                  props: {
                    columns: [
                      { key: "name", label: "Objeto" },
                      { key: "status", label: "Estado" },
                      { key: "owner", label: "Responsable" },
                    ],
                    rows: [],
                  },
                  bindings: {
                    "props.rows": "{{data.rows}}",
                  },
                },
                {
                  componentKey: "data.detail",
                  props: {
                    record: {},
                  },
                  bindings: {
                    "props.record": "{{data.record}}",
                  },
                },
                {
                  componentKey: "record.list",
                  props: {
                    items: [
                      {
                        key: "cliente",
                        title: "Cliente activo",
                        subtitle: "Registro de negocio",
                        status: "Activo",
                      },
                      {
                        key: "inspeccion",
                        title: "Inspección móvil",
                        subtitle: "Pendiente de evidencias",
                        status: "Draft",
                      },
                    ],
                    emptyText: "Sin registros.",
                  },
                },
                {
                  componentKey: "record.detail",
                  props: {
                    title: "Detalle",
                  },
                  bindings: {
                    "props.record": "{{data.record}}",
                  },
                },
                {
                  componentKey: "chart.panel",
                  props: {
                    title: "Avance visual",
                    subtitle: "Gráfico simple para dashboards de app.",
                    items: [
                      { key: "forms", label: "Forms", value: 72 },
                      { key: "services", label: "Services", value: 58 },
                      { key: "offline", label: "Offline", value: 36 },
                    ],
                  },
                },
                {
                  componentKey: "map.view",
                  props: {
                    title: "Ubicación",
                    subtitle: "Pins declarativos para GPS e inspecciones.",
                    pins: [
                      { key: "a", label: "A", x: "38%", y: "52%" },
                      { key: "b", label: "B", x: "68%", y: "34%" },
                    ],
                  },
                },
              ],
            },
            {
              componentKey: "layout.grid",
              props: {
                gap: "12px",
                minColumnWidth: "260px",
              },
              children: [
                {
                  componentKey: "nav.side_menu",
                  props: {
                    activeKey: "home",
                    items: [],
                  },
                  bindings: {
                    "props.items": "{{data.menuItems}}",
                  },
                },
                {
                  componentKey: "nav.bottom_tabs",
                  props: {
                    activeKey: "forms",
                    items: [],
                  },
                  bindings: {
                    "props.items": "{{data.menuItems}}",
                  },
                },
              ],
            },
          ],
        },
        {
          componentKey: "layout.region",
          props: {
            gap: "12px",
            title: "4. Formularios, servicios y flows",
            subtitle: "Bloques de app conectables a formularios dinámicos, servicios y procesos.",
          },
          children: [
            {
              componentKey: "layout.grid",
              props: {
                gap: "12px",
                minColumnWidth: "260px",
              },
              children: [
                {
                  componentKey: "form.runtime",
                  props: {
                    title: "Formulario embebido",
                    subtitle: "Campos declarativos y submit normalizado.",
                    submitLabel: "Guardar ejemplo",
                    fields: [
                      {
                        name: "sampleName",
                        label: "Nombre",
                        type: "text",
                        placeholder: "Nombre visible",
                      },
                      {
                        name: "sampleEmail",
                        label: "Correo",
                        type: "email",
                        placeholder: "correo@empresa.com",
                      },
                    ],
                  },
                  actions: {
                    onSubmit: {
                      type: "show_message",
                      tone: "success",
                      message: "Formulario declarativo enviado.",
                    },
                  },
                },
                {
                  componentKey: "service.result",
                  props: {
                    title: "Resultado de servicio",
                    subtitle: "Respuesta resuelta desde data.serviceResult.",
                    message: "Servicio simulado disponible.",
                    tone: "success",
                  },
                  bindings: {
                    "props.result": "{{data.serviceResult}}",
                  },
                },
                {
                  componentKey: "flow.trigger_button",
                  props: {
                    label: "Ejecutar flow",
                    tone: "primary",
                    variant: "solid",
                    full: true,
                  },
                  actions: {
                    onClick: {
                      type: "show_message",
                      tone: "info",
                      message: "Flow listo para enlazarse a un proceso publicado.",
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          componentKey: "layout.region",
          props: {
            gap: "12px",
            title: "5. Estados, media y overlays",
            subtitle: "Estos bloques preparan App Studio para offline, galerías y modales.",
          },
          children: [
            {
              componentKey: "layout.grid",
              props: {
                gap: "12px",
                minColumnWidth: "240px",
              },
              children: [
                {
                  componentKey: "media.gallery",
                  props: {
                    items: [
                      { key: "one", title: "Evidencia", subtitle: "Foto local", placeholder: "IMG" },
                      { key: "two", title: "Plano", subtitle: "Archivo asociado", placeholder: "DOC" },
                    ],
                  },
                },
                {
                  componentKey: "layout.stack",
                  props: {
                    gap: "10px",
                  },
                  children: [
                    {
                      componentKey: "status.offline",
                      props: {
                        title: "Offline listo",
                        message: "La pantalla puede arrancar desde manifiesto cacheado.",
                        tone: "success",
                      },
                    },
                    {
                      componentKey: "status.sync_queue",
                      props: {
                        title: "Cola de sincronización",
                        message: "Las acciones offline quedan en cola declarativa.",
                        tone: "warning",
                      },
                    },
                    {
                      componentKey: "feedback.skeleton",
                      props: {
                        rows: 3,
                        surface: true,
                      },
                    },
                  ],
                },
                {
                  componentKey: "overlay.modal",
                  props: {
                    title: "Modal declarativo",
                    message: "Preview controlado. El shell real abrirá overlays nativos por kit.",
                    actions: [
                      {
                        key: "accept",
                        label: "Aceptar",
                        tone: "primary",
                        variant: "solid",
                        action: {
                          type: "show_message",
                          message: "Modal confirmado.",
                        },
                      },
                    ],
                  },
                },
              ],
            },
            {
              componentKey: "auth.login",
              props: {
                title: "Login declarativo",
                subtitle: "Ejemplo de bloque autenticable para apps generadas.",
                identityName: "email",
                identityLabel: "Email",
                identityType: "email",
                submitLabel: "Ingresar",
              },
              actions: {
                onSubmit: {
                  type: "show_message",
                  tone: "info",
                  message: "Login declarativo listo para enlazarse con Auth.",
                },
              },
            },
          ],
        },
      ],
    };
  }

  private stringify(value: unknown) {
    return JSON.stringify(value, null, 2);
  }

  private errorText(error: unknown, fallback: string) {
    if (error && typeof error === "object") {
      const candidate = error as {
        error?: { message?: string };
        message?: string;
      };
      return candidate.error?.message ?? candidate.message ?? fallback;
    }
    return fallback;
  }
}
