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
        padding: 16px;
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
    "form.field",
    "ui.card",
    "layout.stack",
    "layout.grid",
    "feedback.alert",
    "feedback.toast",
    "feedback.loading",
    "feedback.skeleton",
    "nav.menu",
    "nav.tabs",
    "nav.toolbar",
    "data.table",
    "data.list",
  ];

  readonly pendingComponentKeys = [
    "overlay.modal",
    "media.gallery",
    "auth.login",
    "app.shell",
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
          { key: "home", label: "Inicio", route: "/home", badge: "base" },
          { key: "forms", label: "Formularios", route: "/forms", badge: "app" },
          { key: "services", label: "Servicios", route: "/services", badge: "api" },
        ],
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
      componentKey: "layout.grid",
      props: {
        gap: "14px",
        minColumnWidth: "300px",
      },
      children: [
        {
          componentKey: "nav.toolbar",
          props: {
            title: "Panel declarativo",
            subtitle: "Navegación, datos y acciones desde JSON.",
            actions: [
              {
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
        {
          componentKey: "ui.card",
          props: {
            title: "Tarjeta creada desde JSON",
            subtitle:
              "El campo guarda estado y los botones disparan acciones declarativas.",
            variant: "subtle",
            padding: "14px",
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
              componentKey: "layout.stack",
              props: {
                direction: "horizontal",
                gap: "14px",
                align: "start",
              },
              children: [
                {
                  componentKey: "ui.button",
                  props: {
                    label: "Mostrar mensaje",
                    tone: "primary",
                    variant: "solid",
                  },
                  actions: {
                    onClick: {
                      type: "show_message",
                      tone: "success",
                      message:
                        "Acción declarativa ejecutada para {{state.sampleName}}.",
                      permissions: ["components.read"],
                    },
                  },
                },
                {
                  componentKey: "ui.button",
                  props: {
                    label: "Guardar offline",
                    tone: "secondary",
                    variant: "outline",
                  },
                  actions: {
                    onClick: {
                      type: "queue_offline",
                      queueKey: "component_lab",
                      payloadMap: {
                        name: "{{state.sampleName}}",
                        source: "declarative_runtime_lab",
                      },
                      permissions: ["components.manage"],
                    },
                  },
                },
              ],
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
              componentKey: "data.list",
              props: {
                titleKey: "label",
                subtitleKey: "route",
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
              componentKey: "feedback.skeleton",
              props: {
                rows: 4,
                surface: true,
              },
            },
          ],
        },
        {
          componentKey: "feedback.alert",
          props: {
            title: "Salida resuelta",
            tone: "info",
            message: "",
          },
          bindings: {
            "props.message":
              "El renderer resolvió el nombre actual como {{state.sampleName}}.",
          },
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
