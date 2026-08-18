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
        gap: 12px;
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
        align-items: center;
        flex-wrap: wrap;
      }

      .inline-actions app-ui-kit-button {
        flex: 0 0 auto;
        margin: 0;
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
              <h3>Pendiente del renderer base</h3>
              <p>
                Solo deben aparecer aqui componentes registrados que todavia
                no tengan adapter real de preview.
              </p>
            </div>
          </header>
          <ul class="coverage-list pending">
            @for (key of pendingComponentKeys; track key) {
              <li>{{ key }}</li>
            } @empty {
              <li>Sin pendientes del renderer base</li>
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
            <span class="chip">Kit visual: {{ kitLabel }}</span>
            <span class="chip">Estado local de preview</span>
            <span class="chip">Permisos simulados</span>
          </div>
          <app-status-notice [kit]="selectedKit" tone="info">
            Este laboratorio no lee secrets ni confisys. Los valores editados
            viven solo en el contexto de preview y los eventos se muestran con
            redacción preventiva.
          </app-status-notice>
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
  previewName = "Chicle";
  previewEmail = "admin@empresa.com";
  previewStatus = "activo";
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
    "layout.row",
    "layout.column",
    "layout.split_pane",
    "layout.header",
    "layout.content",
    "layout.footer",
    "layout.region",
    "feedback.alert",
    "feedback.toast",
    "feedback.loading",
    "feedback.skeleton",
    "feedback.spinner",
    "feedback.progress",
    "ui.chip",
    "ui.text",
    "ui.title",
    "ui.note",
    "ui.avatar",
    "ui.icon",
    "ui.accordion",
    "ui.accordion_group",
    "ui.segment",
    "ui.metric_card",
    "nav.menu",
    "nav.tabs",
    "nav.toolbar",
    "nav.link",
    "data.table",
    "data.list",
    "data.list_header",
    "data.list_item",
    "data.list_divider",
    "data.detail",
    "data.metric_strip",
    "media.gallery",
    "media.image",
    "media.thumbnail",
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
    "nav.breadcrumbs",
    "chart.panel",
    "map.view",
    "map.gps_capture",
    "status.offline",
    "status.sync_queue",
    "form.mobile_shell",
    "service.result_actions",
    "flow.stepper",
    "record.editor",
    "overlay.action_sheet",
    "media.camera_capture",
    "ui.fab",
  ];

  readonly pendingComponentKeys: string[] = [];

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
        previewName: this.previewName,
        previewEmail: this.previewEmail,
        previewStatus: this.previewStatus,
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

  get kitLabel() {
    return (
      {
        primeng: "PrimeNG",
        ionic: "Ionic",
        material: "Material",
        bootstrap: "Bootstrap",
        native: "Base HTML",
        auto: "Automático",
        inherit: "Heredado",
      }[this.selectedKit] ?? this.selectedKit
    );
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
    this.previewName = "Chicle";
    this.previewEmail = "admin@empresa.com";
    this.previewStatus = "activo";
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
    if (event.eventName === "valueChange") {
      const stateKey = this.extractStateKey(event);
      if (stateKey === "previewName" && typeof event.value === "string") {
        this.previewName = event.value;
      }
      if (stateKey === "previewEmail" && typeof event.value === "string") {
        this.previewEmail = event.value;
      }
      if (stateKey === "previewStatus" && typeof event.value === "string") {
        this.previewStatus = event.value;
      }
    }
    this.lastActionEventJson = this.stringify({
      eventName: event.eventName,
      componentKey: event.source.componentKey,
      action: this.redactForPreview(event.action),
      value: this.safeEventValue(event.value, this.extractStateKey(event)),
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

  private extractStateKey(event: DeclarativeComponentActionEvent) {
    const key = event.action["key"];
    if (typeof key === "string") {
      return key;
    }
    const field = event.source.props?.["field"];
    if (field && typeof field === "object" && !Array.isArray(field)) {
      const fieldRecord = field as Record<string, unknown>;
      const name = fieldRecord["name"] ?? fieldRecord["key"];
      return typeof name === "string" ? name : "";
    }
    return "";
  }

  private safeEventValue(value: unknown, key = ""): unknown {
    if (key && this.looksSensitiveKey(key)) {
      return "[redacted]";
    }
    if (typeof value === "string") {
      return value.length > 80 ? `${value.slice(0, 80)}...` : value;
    }
    return this.redactForPreview(value);
  }

  private redactForPreview(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redactForPreview(item));
    }
    if (!value || typeof value !== "object") {
      return value;
    }
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (result, [key, entry]) => {
        result[key] = this.looksSensitiveKey(key) ? "[redacted]" : this.redactForPreview(entry);
        return result;
      },
      {},
    );
  }

  private looksSensitiveKey(key: string) {
    return /password|secret|token|authorization|api[-_]?key|credential|private/i.test(key);
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
            {
              componentKey: "nav.breadcrumbs",
              props: {
                activeKey: "forms",
                items: [
                  { key: "home", label: "Inicio", route: "/home" },
                  { key: "factory", label: "Fabrica", route: "/apps" },
                  { key: "forms", label: "Formulario activo", route: "/forms" },
                ],
              },
            },
            {
              componentKey: "layout.row",
              props: {
                gap: "10px",
              },
              children: [
                {
                  componentKey: "nav.link",
                  props: {
                    label: "Abrir ruta declarativa",
                  },
                  actions: {
                    onClick: {
                      type: "show_message",
                      tone: "info",
                      message: "Link declarativo ejecutado.",
                    },
                  },
                },
                {
                  componentKey: "ui.segment",
                  props: {
                    activeKey: "forms",
                    items: [
                      { key: "home", label: "Inicio" },
                      { key: "forms", label: "Formularios" },
                      { key: "services", label: "Servicios" },
                    ],
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
                  componentKey: "layout.row",
                  props: {
                    gap: "10px",
                    align: "center",
                  },
                  children: [
                    {
                      componentKey: "ui.avatar",
                      props: {
                        initials: "CE",
                        label: "Chicle Engine",
                        tone: "primary",
                      },
                    },
                    {
                      componentKey: "ui.title",
                      props: {
                        eyebrow: "Preview seguro",
                        title: "Estado local aislado",
                        subtitle: "Los bindings usan contexto de prueba, no datos sensibles.",
                      },
                    },
                  ],
                },
                {
                  componentKey: "layout.row",
                  props: {
                    gap: "8px",
                  },
                  children: [
                    {
                      componentKey: "ui.chip",
                      props: {
                        label: "multikit",
                        tone: "success",
                      },
                    },
                    {
                      componentKey: "ui.badge",
                      props: {
                        label: "seguro",
                        tone: "primary",
                      },
                    },
                    {
                      componentKey: "ui.icon",
                      props: {
                        icon: "pi pi-shield",
                        label: "Permisos",
                        tone: "info",
                      },
                    },
                  ],
                },
                {
                  componentKey: "ui.text",
                  props: {
                    text: "Edita el valor y observa cómo el binding actualiza el preview.",
                  },
                },
                {
                  componentKey: "form.field",
                  props: {
                    field: {
                      name: "previewName",
                      label: "Nombre",
                      type: "text",
                      placeholder: "Escribe un valor",
                    },
                    value: "",
                  },
                  bindings: {
                    "props.value": "{{state.previewName}}",
                  },
                  actions: {
                    valueChange: {
                      type: "set_state",
                      key: "previewName",
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
                          message: "Acción declarativa ejecutada para {{state.previewName}}.",
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
                            name: "{{state.previewName}}",
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
                    "props.message": "El renderer resolvió el valor actual como {{state.previewName}}.",
                  },
                },
                {
                  componentKey: "feedback.progress",
                  props: {
                    label: "Cobertura visible",
                    percent: 82,
                    tone: "success",
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
              componentKey: "data.list_header",
              props: {
                title: "Registros recientes",
                meta: "demo",
              },
            },
            {
              componentKey: "data.list_item",
              props: {
                title: "Cliente declarativo",
                subtitle: "Item individual reutilizable",
                status: "Activo",
              },
            },
            {
              componentKey: "data.list_divider",
              props: {
                label: "Datos enlazados",
              },
            },
            {
              componentKey: "layout.split_pane",
              props: {
                gap: "12px",
                left: "0.75fr",
                right: "1.25fr",
              },
              children: [
                {
                  componentKey: "layout.header",
                  children: [
                    {
                      componentKey: "ui.title",
                      props: {
                        title: "Shell",
                        subtitle: "Header declarativo",
                      },
                    },
                  ],
                },
                {
                  componentKey: "layout.column",
                  props: {
                    gap: "10px",
                  },
                  children: [
                    {
                      componentKey: "layout.content",
                      children: [
                        {
                          componentKey: "ui.text",
                          props: {
                            text: "Contenido renderizado por children.",
                          },
                        },
                      ],
                    },
                    {
                      componentKey: "layout.footer",
                      props: {
                        text: "Footer declarativo",
                      },
                      children: [
                        {
                          componentKey: "ui.chip",
                          props: {
                            label: "ready",
                            tone: "success",
                          },
                        },
                      ],
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
                        name: "previewName",
                        label: "Nombre",
                        type: "text",
                        placeholder: "Nombre visible",
                      },
                      {
                        name: "previewEmail",
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
                  componentKey: "service.result_actions",
                  props: {
                    title: "Resultado accionable",
                    subtitle: "La respuesta puede ofrecer el siguiente paso sin lógica de pantalla.",
                    message: "Servicio ejecutado correctamente.",
                    tone: "success",
                    actions: [
                      {
                        key: "open-detail",
                        label: "Abrir detalle",
                        tone: "primary",
                        variant: "outline",
                        action: {
                          type: "show_message",
                          tone: "info",
                          message: "Detalle abierto desde un resultado declarativo.",
                        },
                      },
                    ],
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
                {
                  componentKey: "flow.stepper",
                  props: {
                    steps: [
                      {
                        key: "input",
                        title: "Entrada validada",
                        description: "El contrato define datos mínimos antes de ejecutar.",
                        status: "Listo",
                        tone: "success",
                      },
                      {
                        key: "service",
                        title: "Servicio ejecutado",
                        description: "Puede consumir un Dynamic Service publicado.",
                        status: "Activo",
                        tone: "primary",
                      },
                      {
                        key: "response",
                        title: "Respuesta preparada",
                        description: "El front recibe una salida normalizada.",
                        status: "Pendiente",
                        tone: "warning",
                      },
                    ],
                  },
                },
                {
                  componentKey: "record.editor",
                  props: {
                    title: "Editor de registro",
                    subtitle: "Campos y acciones vienen del objeto declarativo.",
                    fields: [
                      {
                        name: "previewName",
                        label: "Nombre visible",
                        type: "text",
                      },
                      {
                        name: "status",
                        label: "Estado",
                        type: "select",
                        options: [
                          { label: "Activo", value: "activo" },
                          { label: "Draft", value: "draft" },
                        ],
                      },
                    ],
                    actions: [
                      {
                        key: "save",
                        label: "Guardar cambios",
                        tone: "success",
                        variant: "solid",
                        action: {
                          type: "show_message",
                          tone: "success",
                          message: "Registro guardado en preview declarativo.",
                        },
                      },
                    ],
                  },
                  bindings: {
                    "props.values": "{{state}}",
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
                  componentKey: "layout.column",
                  props: {
                    gap: "10px",
                  },
                  children: [
                    {
                      componentKey: "media.image",
                      props: {
                        caption: "Imagen declarativa",
                        placeholder: "16:9",
                        ratio: "16 / 9",
                      },
                    },
                    {
                      componentKey: "media.thumbnail",
                      props: {
                        title: "Miniatura",
                        placeholder: "IMG",
                      },
                    },
                  ],
                },
                {
                  componentKey: "form.mobile_shell",
                  props: {
                    title: "Captura móvil",
                    subtitle: "Flujo táctil para evidencias y ubicación.",
                    badge: "offline",
                    progress: "66%",
                    actions: [
                      {
                        key: "continue",
                        label: "Continuar",
                        tone: "primary",
                        variant: "solid",
                        action: {
                          type: "show_message",
                          tone: "info",
                          message: "Continuación solicitada desde shell móvil.",
                        },
                      },
                    ],
                  },
                  children: [
                    {
                      componentKey: "media.camera_capture",
                      props: {
                        title: "Foto obligatoria",
                        subtitle: "Usa adaptador de cámara según plataforma.",
                        captureLabel: "Capturar evidencia",
                        tone: "primary",
                        variant: "outline",
                      },
                      actions: {
                        onCapture: {
                          type: "show_message",
                          tone: "info",
                          message: "Cámara solicitada desde componente declarativo.",
                        },
                      },
                    },
                    {
                      componentKey: "map.gps_capture",
                      props: {
                        title: "Ubicación GPS",
                        subtitle: "Posición requerida para inspección.",
                        lat: "4.7110",
                        lng: "-74.0721",
                        status: "Ubicación de ejemplo lista",
                        tone: "primary",
                        variant: "outline",
                      },
                      actions: {
                        onCapture: {
                          type: "show_message",
                          tone: "info",
                          message: "GPS solicitado desde componente declarativo.",
                        },
                      },
                    },
                  ],
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
                    {
                      componentKey: "feedback.spinner",
                      props: {
                        message: "Sincronizando preview...",
                      },
                    },
                    {
                      componentKey: "ui.note",
                      props: {
                        title: "Nota declarativa",
                        message: "Mensaje compacto para guías, validaciones o ayuda contextual.",
                        tone: "info",
                      },
                    },
                    {
                      componentKey: "ui.accordion",
                      props: {
                        title: "Sección desplegable",
                        content: "Accordion individual para ayuda, filtros avanzados o detalles.",
                        open: true,
                      },
                    },
                    {
                      componentKey: "ui.accordion_group",
                      props: {
                        items: [
                          {
                            key: "one",
                            title: "Cómo se guarda",
                            content: "El objeto declarativo se versiona y el renderer lo interpreta.",
                            open: true,
                          },
                          {
                            key: "two",
                            title: "Cómo cambia de kit",
                            content: "El adapter visual cambia sin tocar el contrato del componente.",
                          },
                        ],
                      },
                    },
                  ],
                },
                {
                  componentKey: "overlay.action_sheet",
                  props: {
                    title: "Acciones rápidas",
                    message: "Opciones compactas para móvil o paneles laterales.",
                    actions: [
                      {
                        key: "share",
                        label: "Compartir",
                        tone: "primary",
                        variant: "outline",
                        action: {
                          type: "show_message",
                          tone: "info",
                          message: "Acción compartir ejecutada en preview.",
                        },
                      },
                      {
                        key: "review",
                        label: "Enviar a revisión",
                        tone: "success",
                        variant: "solid",
                        action: {
                          type: "show_message",
                          tone: "success",
                          message: "Elemento enviado a revisión.",
                        },
                      },
                    ],
                  },
                },
                {
                  componentKey: "ui.fab",
                  props: {
                    label: "Nuevo",
                    icon: "pi pi-plus",
                    tone: "primary",
                    variant: "solid",
                  },
                  actions: {
                    onClick: {
                      type: "show_message",
                      tone: "info",
                      message: "FAB declarativo ejecutado.",
                    },
                  },
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
