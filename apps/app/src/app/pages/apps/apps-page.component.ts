import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../core/api/api-client.service';
import { AdminCardGridComponent } from '../../shared/admin-card-grid/admin-card-grid.component';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { AdminFormGridComponent } from '../../shared/admin-form-grid/admin-form-grid.component';
import { AdminMetricCardComponent } from '../../shared/admin-metric-card/admin-metric-card.component';
import { AdminPanelComponent } from '../../shared/admin-panel/admin-panel.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { DesignerCatalogPanelComponent } from '../../shared/designer-catalog-panel/designer-catalog-panel.component';
import { DesignerWorkspaceComponent } from '../../shared/designer-workspace/designer-workspace.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { JsonAuthoringPanelComponent } from '../../shared/json-authoring-panel/json-authoring-panel.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PageShellComponent } from '../../shared/page-shell/page-shell.component';
import { PreviewViewportComponent, PreviewViewportMode } from '../../shared/preview-viewport/preview-viewport.component';
import { ProcessStepItem, ProcessStepsComponent } from '../../shared/process-steps/process-steps.component';
import { SegmentedControlComponent, SegmentedControlItem } from '../../shared/segmented-control/segmented-control.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { WorkflowGuideComponent } from '../../shared/workflow-guide/workflow-guide.component';
import {
  AiAssistantService,
  ApplyDynamicAppJsonAction,
  ApplyDynamicScreenJsonAction
} from '../../shared/ai-assistant-launcher/ai-assistant.service';

type AppDesignerPhase = 'app' | 'screen' | 'components' | 'preview' | 'json';
type AppWorkspaceTab = 'summary' | 'screens' | 'navigation' | 'security' | 'preview' | 'publish' | 'trash';
type AppTargetsMode = 'web_mobile' | 'web_mobile_desktop' | 'admin' | 'all';
type ScreenTarget = 'admin' | 'web' | 'mobile' | 'desktop' | 'multi';
type JsonTarget = 'app' | 'screen' | 'package';
type ScreenComponentBindingType = 'none' | 'form' | 'service' | 'flow' | 'table' | 'source';
type ScreenComponentWidth = 'full' | 'two_thirds' | 'half' | 'third' | 'quarter' | 'auto';
type ScreenComponentAlign = 'stretch' | 'start' | 'center' | 'end';
type ScreenComponentChrome = 'plain' | 'card' | 'modal' | 'drawer' | 'toolbar';
type ScreenComponentPreset = 'menu' | 'login' | 'form' | 'table' | 'service';
type ScreenComponentActionType =
  | 'none'
  | 'navigate'
  | 'execute_service'
  | 'execute_flow'
  | 'open_modal'
  | 'submit_form'
  | 'emit_event';
type ScreenNavigationVisibility = 'visible' | 'hidden';

interface DynamicAppRecord {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  category?: string | null;
  targets: string[];
  manifest: Record<string, unknown>;
  version: number;
  published: boolean;
  status: 'draft' | 'published' | 'archived' | 'trashed';
  metadata?: Record<string, unknown> | null;
  trashedAt?: string | null;
}

interface DynamicAppVersionRecord {
  id: string;
  appId: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  manifest: Record<string, unknown>;
}

interface DynamicAppAuthoringResponse {
  artifactType: 'dynamic_app';
  id: string;
  key: string;
  app: DynamicAppRecord;
  version?: DynamicAppVersionRecord | null;
  published: boolean;
}

interface DynamicScreenRecord {
  id: string;
  appId: string;
  key: string;
  title: string;
  description?: string | null;
  route?: string | null;
  target: ScreenTarget;
  category?: string | null;
  sortOrder: number;
  definition: Record<string, unknown>;
  version: number;
  published: boolean;
  status: 'draft' | 'published' | 'archived' | 'trashed';
  metadata?: Record<string, unknown> | null;
  trashedAt?: string | null;
}

interface DynamicScreenVersionRecord {
  id: string;
  screenId: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  definition: Record<string, unknown>;
}

interface DynamicScreenAuthoringResponse {
  artifactType: 'dynamic_screen';
  id: string;
  key: string;
  appKey: string;
  screen: DynamicScreenRecord;
  version?: DynamicScreenVersionRecord | null;
  published: boolean;
}

interface DynamicAppPackage {
  schemaVersion: number;
  kind: 'chicle_app_package';
  packageKey: string;
  name: string;
  description: string;
  exportedAt: string;
  app: {
    key: string;
    version: number;
    status: string;
    published: boolean;
    manifest: Record<string, unknown>;
  };
  screens: Array<{
    key: string;
    version: number;
    status: string;
    published: boolean;
    definition: Record<string, unknown>;
  }>;
  dependencies: {
    componentKeys: string[];
    formKeys: string[];
    serviceKeys: string[];
    flowKeys: string[];
    textNamespaces: string[];
    customTables: string[];
  };
  install: {
    mode: 'upsert';
    conflictStrategy: 'active_keys_block';
    publishOnInstall: boolean;
  };
}

interface DynamicAppPackageInstallResponse {
  artifactType: 'chicle_app_package';
  key: string;
  app: DynamicAppRecord;
  screens: DynamicScreenAuthoringResponse[];
  published: boolean;
}

interface ScreenComponentCatalogItem {
  key: string;
  name: string;
  category: string;
  targets: string[];
  kits: string[];
}

interface AppDraft {
  key: string;
  name: string;
  category: string;
  description: string;
  targetsMode: AppTargetsMode;
  defaultLocale: string;
  theme: string;
  kit: string;
}

interface ScreenComponentDraft {
  id: string;
  componentKey: string;
  title: string;
  region: string;
  bindingType: ScreenComponentBindingType;
  bindingKey: string;
  width: ScreenComponentWidth;
  align: ScreenComponentAlign;
  chrome: ScreenComponentChrome;
  actionType: ScreenComponentActionType;
  actionTarget: string;
}

interface ScreenDraft {
  key: string;
  title: string;
  description: string;
  route: string;
  target: ScreenTarget;
  category: string;
  layoutMode: 'dashboard' | 'form_page' | 'detail_page' | 'list_page';
  navigationLabel: string;
  navigationGroup: string;
  navigationIcon: string;
  navigationVisibility: ScreenNavigationVisibility;
  navigationPermission: string;
  componentKey: string;
  componentTitle: string;
  componentRegion: string;
  componentBindingType: ScreenComponentBindingType;
  componentBindingKey: string;
  componentWidth: ScreenComponentWidth;
  componentAlign: ScreenComponentAlign;
  componentChrome: ScreenComponentChrome;
  componentActionType: ScreenComponentActionType;
  componentActionTarget: string;
  components: ScreenComponentDraft[];
}

@Component({
  selector: 'app-apps-page',
  standalone: true,
  imports: [
    AdminCardGridComponent,
    AdminFormGridComponent,
    AdminMetricCardComponent,
    AdminPanelComponent,
    CatalogItemComponent,
    DesignerCatalogPanelComponent,
    DesignerWorkspaceComponent,
    DynamicFieldControlComponent,
    JsonAuthoringPanelComponent,
    LoadingSkeletonComponent,
    ModuleHeaderComponent,
    PageShellComponent,
    PreviewViewportComponent,
    ProcessStepsComponent,
    SegmentedControlComponent,
    StatusNoticeComponent,
    UiKitButtonComponent,
    WorkflowGuideComponent
  ],
  styles: [
    `
      .shell {
        display: grid;
        gap: 18px;
      }

      .catalog-actions,
      .inline-actions,
      .package-actions,
      .json-switcher {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .inline-actions {
        justify-content: flex-end;
      }

      .workspace-grid {
        display: grid;
        gap: 16px;
        min-width: 0;
      }

      .workspace-tabs {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        min-width: 0;
      }

      .portfolio-summary {
        display: grid;
        gap: 12px;
      }

      .nested-grid {
        display: grid;
        gap: 12px;
      }

      .restore-grid,
      .navigation-preview,
      .security-grid {
        display: grid;
        gap: 10px;
      }

      .restore-row,
      .navigation-row,
      .security-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .restore-row strong,
      .restore-row span,
      .navigation-row strong,
      .navigation-row span,
      .security-row strong,
      .security-row span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .restore-row span,
      .navigation-row span,
      .security-row span {
        color: var(--ch-color-muted);
        font-size: 0.84rem;
        line-height: 1.38;
      }

      .component-list {
        display: grid;
        gap: 8px;
      }

      .section-divider {
        display: grid;
        gap: 5px;
        border-top: 1px solid var(--ch-color-border);
        padding-top: 14px;
      }

      .section-divider strong,
      .section-divider span {
        display: block;
      }

      .section-divider strong {
        color: var(--ch-color-text);
      }

      .section-divider span {
        color: var(--ch-color-muted);
        font-size: 0.86rem;
        line-height: 1.42;
      }

      .component-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) repeat(3, auto);
        gap: 10px;
        align-items: center;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 11px;
      }

      .component-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 7px;
      }

      .component-row strong,
      .component-row span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .component-row span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
      }

      .preview-screen {
        display: grid;
        gap: 18px;
        min-height: 100%;
        padding: clamp(18px, 3vw, 28px);
      }

      .preview-screen.mobile {
        gap: 14px;
        padding: 18px;
      }

      .preview-runtime-note {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        font-weight: 750;
      }

      .preview-app-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 10px 12px;
      }

      .preview-app-brand {
        display: grid;
        gap: 2px;
        min-width: 150px;
      }

      .preview-app-brand strong,
      .preview-app-brand span {
        display: block;
        overflow-wrap: anywhere;
      }

      .preview-app-brand strong {
        color: var(--ch-color-text);
        font-size: 0.92rem;
      }

      .preview-app-brand span {
        color: var(--ch-color-muted);
        font-size: 0.74rem;
        font-weight: 700;
      }

      .preview-app-menu {
        display: flex;
        flex: 1 1 auto;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        justify-content: flex-end;
        min-width: 0;
      }

      .preview-nav-item {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 30px;
        border: 1px solid transparent;
        border-radius: var(--ch-radius-sm);
        color: var(--ch-color-muted);
        padding: 5px 10px;
        font-size: 0.8rem;
        font-weight: 850;
      }

      .preview-nav-item.active {
        border-color: var(--ch-color-primary-border);
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-primary);
      }

      .preview-header {
        display: grid;
        gap: 7px;
        border-bottom: 1px solid var(--ch-color-border);
        padding-bottom: 14px;
      }

      .preview-header h2,
      .preview-header p {
        margin: 0;
      }

      .preview-header h2 {
        color: var(--ch-color-text);
        font-size: clamp(1.15rem, 2vw, 1.45rem);
        line-height: 1.18;
      }

      .preview-header p {
        max-width: 700px;
        color: var(--ch-color-muted);
        line-height: 1.45;
      }

      .preview-route {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        font-weight: 750;
      }

      .preview-hint-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        font-weight: 750;
      }

      .preview-hint-list span + span::before {
        content: "/";
        margin-right: 6px;
        color: var(--ch-color-border-strong);
      }

      .chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 24px;
        border: 1px solid var(--ch-color-primary-border);
        border-radius: 999px;
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 3px 9px;
        font-size: 0.75rem;
        font-weight: 850;
      }

      .preview-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: 12px;
      }

      .preview-grid.mobile,
      .preview-grid.tablet {
        grid-template-columns: 1fr;
      }

      .preview-grid.mobile .preview-card,
      .preview-grid.tablet .preview-card {
        grid-column: 1 / -1 !important;
      }

      .preview-regions {
        display: grid;
        gap: 14px;
      }

      .preview-region {
        display: grid;
        gap: 10px;
        min-width: 0;
      }

      .preview-region-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--ch-color-muted);
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.02em;
        text-transform: uppercase;
      }

      .preview-region-title::after {
        content: '';
        flex: 1 1 auto;
        height: 1px;
        background: var(--ch-color-border);
      }

      .preview-card {
        display: grid;
        gap: 10px;
        min-height: 110px;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 14px;
      }

      .preview-card.plain {
        background: transparent;
        border-style: dashed;
      }

      .preview-card.modal,
      .preview-card.drawer {
        border-style: dashed;
        box-shadow: var(--ch-shadow);
      }

      .preview-card.toolbar {
        min-height: 68px;
        align-content: center;
      }

      .preview-card.hero {
        grid-column: 1 / -1;
        min-height: 90px;
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--ch-color-primary) 10%, var(--ch-color-surface)),
          var(--ch-color-surface)
        );
      }

      .preview-card strong,
      .preview-card span {
        display: block;
        overflow-wrap: anywhere;
      }

      .preview-card strong {
        color: var(--ch-color-text);
        font-size: 0.96rem;
      }

      .preview-card span {
        color: var(--ch-color-muted);
        font-size: 0.82rem;
        line-height: 1.4;
      }

      .empty-preview {
        grid-column: 1 / -1;
      }

      .hint-line {
        color: var(--ch-color-muted);
        font-size: 0.84rem;
        line-height: 1.42;
      }

      .component-preset-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .package-hint {
        display: grid;
        gap: 8px;
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      @media (max-width: 760px) {
        .inline-actions {
          justify-content: stretch;
        }

        .inline-actions app-ui-kit-button,
        .catalog-actions app-ui-kit-button,
        .package-actions app-ui-kit-button,
        .component-preset-actions app-ui-kit-button {
          flex: 1 1 auto;
        }

        .preview-app-bar {
          align-items: stretch;
        }

        .preview-app-menu {
          justify-content: flex-start;
        }

        .restore-row,
        .navigation-row,
        .security-row {
          grid-template-columns: 1fr;
          justify-content: stretch;
        }

        .workspace-tabs {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `
  ],
  template: `
    <app-page-shell contextLabelKey="nav.context.apps">
      <div class="shell">
        <app-module-header
          title="Diseñador de pantallas y apps"
          description="Crea apps instalables y pantallas dinámicas con componentes, datos, acciones, versionado y JSON portable."
          eyebrow="App Factory"
          badge="Screen Designer"
          titleKey="apps.title"
          descriptionKey="apps.description"
          eyebrowKey="apps.eyebrow"
          badgeKey="apps.badge"
        ></app-module-header>

        <app-process-steps
          [items]="processSteps()"
          [activeKey]="phase()"
          (selected)="setPhase($event)"
        ></app-process-steps>

        <app-workflow-guide
          [stepLabel]="guide().stepLabel"
          [title]="guide().title"
          [description]="guide().description"
          [tone]="guide().tone"
        >
          <app-ui-kit-button
            [label]="guide().actionLabel"
            icon="pi pi-arrow-right"
            tone="secondary"
            variant="outline"
            (pressed)="advancePhase()"
          ></app-ui-kit-button>
        </app-workflow-guide>

        @if (message()) {
          <app-status-notice tone="success" title="Listo">
            <span>{{ message() }}</span>
          </app-status-notice>
        }

        @if (error()) {
          <app-status-notice tone="error" title="Revisión necesaria">
            <span>{{ error() }}</span>
          </app-status-notice>
        }

        <app-designer-workspace>
          <app-designer-catalog-panel
            designer-navigation
            title="Apps"
            [summary]="apps().length + ' apps'"
            [loading]="loading()"
            loadingLabel="Cargando apps"
            [empty]="!loading() && apps().length === 0"
            emptyTitle="Sin apps todavía"
            emptyMessage="Crea la primera app para agrupar pantallas, formularios, servicios y flows."
            (retry)="load()"
          >
            <div catalog-actions class="catalog-actions">
              <app-ui-kit-button
                label="Nueva app"
                icon="pi pi-plus"
                size="small"
                (pressed)="newApp()"
              ></app-ui-kit-button>
            </div>

            @for (app of apps(); track app.id) {
              <app-catalog-item
                [title]="app.name"
                [meta]="app.key + ' · ' + artifactStatusLabel(app)"
                [detail]="app.targets.join(', ') + ' · v' + app.version"
                [active]="app.id === selectedAppId()"
                (selected)="selectApp(app)"
              ></app-catalog-item>
            }
          </app-designer-catalog-panel>

          <div designer-workspace class="workspace-grid">
            @if (loading()) {
              <app-loading-skeleton variant="form" label="Preparando diseñador" [rows]="5"></app-loading-skeleton>
            } @else {
              <div class="workspace-tabs">
                <app-segmented-control
                  [items]="workspaceTabs()"
                  [value]="workspaceTab()"
                  ariaLabel="Secciones de App Studio"
                  (valueChange)="setWorkspaceTab($event)"
                ></app-segmented-control>
              </div>

              <app-admin-card-grid minColumnWidth="180px" gap="10px" [compact]="true" ariaLabel="Resumen de App Studio">
                @for (metric of appMetrics(); track metric.label) {
                  <app-admin-metric-card
                    [label]="metric.label"
                    [value]="metric.value"
                    [detail]="metric.detail"
                    [tone]="metric.tone"
                  ></app-admin-metric-card>
                }
              </app-admin-card-grid>

              @if (workspaceTab() === 'summary') {
              <app-admin-panel
                title="1. App"
                description="Define el contenedor instalable. La app agrupa rutas, pantallas, textos, targets y permisos."
                eyebrow="Contrato principal"
              >
                <div panel-actions class="inline-actions">
                  <app-ui-kit-button
                    label="Guardar app"
                    icon="pi pi-save"
                    tone="secondary"
                    variant="outline"
                    [disabled]="saving() || !appDraftReady()"
                    (pressed)="saveApp(false)"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Publicar app"
                    icon="pi pi-upload"
                    [disabled]="saving() || !appDraftReady()"
                    (pressed)="saveApp(true)"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Exportar paquete"
                    icon="pi pi-download"
                    tone="secondary"
                    variant="outline"
                    [disabled]="saving() || !selectedApp()"
                    (pressed)="exportPackage()"
                  ></app-ui-kit-button>
                  @if (selectedApp()) {
                    <app-ui-kit-button
                      label="Enviar a papelera"
                      icon="pi pi-trash"
                      tone="danger"
                      variant="outline"
                      [disabled]="saving()"
                      (pressed)="trashApp()"
                    ></app-ui-kit-button>
                  }
                </div>

                <app-admin-form-grid minColumnWidth="220px">
                  @for (field of appFields; track field.name) {
                    <app-dynamic-field-control
                      [field]="field"
                      [value]="appFieldValue(field.name)"
                      (valueChange)="setAppField(field.name, $event)"
                    ></app-dynamic-field-control>
                  }
                </app-admin-form-grid>
              </app-admin-panel>
              }

              @if (workspaceTab() === 'screens' || workspaceTab() === 'navigation') {
              <app-admin-panel
                title="2. Pantalla"
                description="Cada pantalla compone regiones, componentes, datos y acciones. Puede apuntar a web, móvil, desktop o admin."
                eyebrow="Screen contract"
              >
                <div panel-actions class="inline-actions">
                  <app-ui-kit-button
                    label="Nueva pantalla"
                    icon="pi pi-plus"
                    tone="secondary"
                    variant="outline"
                    [disabled]="saving() || !selectedApp()"
                    (pressed)="newScreen()"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Guardar pantalla"
                    icon="pi pi-save"
                    tone="secondary"
                    variant="outline"
                    [disabled]="saving() || !screenDraftReady()"
                    (pressed)="saveScreen(false)"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Publicar pantalla"
                    icon="pi pi-upload"
                    [disabled]="saving() || !screenDraftReady()"
                    (pressed)="saveScreen(true)"
                  ></app-ui-kit-button>
                  @if (selectedScreen()) {
                    <app-ui-kit-button
                      label="Enviar a papelera"
                      icon="pi pi-trash"
                      tone="danger"
                      variant="outline"
                      [disabled]="saving()"
                      (pressed)="trashScreen()"
                    ></app-ui-kit-button>
                  }
                </div>

                @if (!selectedApp()) {
                  <app-status-notice tone="warning" title="Primero guarda una app">
                    <span>La pantalla necesita una app real para quedar versionada y publicable.</span>
                  </app-status-notice>
                }

                <div class="nested-grid">
                  <app-admin-form-grid minColumnWidth="220px">
                    @for (field of screenFields; track field.name) {
                      <app-dynamic-field-control
                        [field]="field"
                        [value]="screenFieldValue(field.name)"
                        (valueChange)="setScreenField(field.name, $event)"
                      ></app-dynamic-field-control>
                    }
                  </app-admin-form-grid>

                  <div class="section-divider">
                    <strong>Navegación</strong>
                    <span>
                      Define si esta pantalla aparece en el menú de la app, bajo qué grupo y qué permiso la protege.
                      La ruta sigue siendo el identificador técnico que consumen web, móvil o desktop.
                    </span>
                  </div>

                  <app-admin-form-grid minColumnWidth="210px">
                    @for (field of navigationFields; track field.name) {
                      <app-dynamic-field-control
                        [field]="field"
                        [value]="screenFieldValue(field.name)"
                        (valueChange)="setScreenField(field.name, $event)"
                      ></app-dynamic-field-control>
                    }
                  </app-admin-form-grid>

                  <app-designer-catalog-panel
                    title="Pantallas"
                    [summary]="screens().length + ' pantallas'"
                    [empty]="screens().length === 0"
                    emptyTitle="Sin pantallas"
                    emptyMessage="Crea una pantalla inicial para esta app."
                    [showRetry]="false"
                  >
                    @for (screen of screens(); track screen.id) {
                      <app-catalog-item
                        [title]="screen.title"
                        [meta]="screen.key + ' · ' + artifactStatusLabel(screen)"
                        [detail]="screen.route || '/'"
                        [active]="screen.id === selectedScreenId()"
                        (selected)="selectScreen(screen)"
                      ></app-catalog-item>
                    }
                  </app-designer-catalog-panel>
                </div>
              </app-admin-panel>
              }

              @if (workspaceTab() === 'screens') {
              <app-admin-panel
                title="3. Componentes"
                description="Agrega piezas reutilizables y define dónde viven, cuánto ocupan, qué datos consumen y qué acción disparan."
                eyebrow="Composición"
              >
                <div panel-actions class="inline-actions">
                  <app-ui-kit-button
                    label="Agregar componente"
                    icon="pi pi-plus"
                    [disabled]="saving()"
                    (pressed)="addComponent()"
                  ></app-ui-kit-button>
                </div>

                <app-status-notice tone="info" title="Cómo se compone una pantalla">
                  <span>
                    Una pantalla se arma con piezas: menú, login, formularios, tablas, cards, botones de servicio o flows.
                    Elige ubicación, ancho, binding de datos y acción. Tablet y móvil se reorganizan automáticamente.
                  </span>
                </app-status-notice>

                <div class="component-preset-actions">
                  <app-ui-kit-button
                    label="Menú"
                    icon="pi pi-bars"
                    tone="secondary"
                    variant="outline"
                    size="small"
                    [disabled]="saving()"
                    (pressed)="addPresetComponent('menu')"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Login estándar"
                    icon="pi pi-shield"
                    tone="secondary"
                    variant="outline"
                    size="small"
                    [disabled]="saving()"
                    (pressed)="addPresetComponent('login')"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Formulario"
                    icon="pi pi-pencil"
                    tone="secondary"
                    variant="outline"
                    size="small"
                    [disabled]="saving()"
                    (pressed)="addPresetComponent('form')"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Tabla"
                    icon="pi pi-table"
                    tone="secondary"
                    variant="outline"
                    size="small"
                    [disabled]="saving()"
                    (pressed)="addPresetComponent('table')"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Acción"
                    icon="pi pi-bolt"
                    tone="secondary"
                    variant="outline"
                    size="small"
                    [disabled]="saving()"
                    (pressed)="addPresetComponent('service')"
                  ></app-ui-kit-button>
                </div>

                <app-admin-form-grid minColumnWidth="210px">
                  @for (field of componentFields(); track field.name) {
                    <app-dynamic-field-control
                      [field]="field"
                      [value]="componentFieldValue(field.name)"
                      (valueChange)="setComponentField(field.name, $event)"
                    ></app-dynamic-field-control>
                  }
                </app-admin-form-grid>

                <div class="component-list">
                  @if (screenDraft().components.length === 0) {
                    <app-status-notice tone="info" title="Pantalla lista para componer">
                      <span>Agrega un header, una tabla, un formulario, un botón de servicio o un botón de flow.</span>
                    </app-status-notice>
                  }

                  @for (component of screenDraft().components; track component.id) {
                    <div class="component-row">
                      <div>
                        <strong>{{ component.title }}</strong>
                        <span>{{ component.componentKey }} · {{ component.region }} · {{ component.bindingKey || 'sin binding' }}</span>
                        <div class="component-meta">
                          <span class="chip">{{ widthLabel(component.width) }}</span>
                          <span class="chip">{{ chromeLabel(component.chrome) }}</span>
                          <span class="chip">{{ bindingLabel(component.bindingType) }}</span>
                          <span class="chip">{{ actionLabel(component.actionType) }}</span>
                        </div>
                      </div>
                      <app-ui-kit-button
                        label="Subir"
                        icon="pi pi-arrow-up"
                        tone="secondary"
                        variant="ghost"
                        size="small"
                        (pressed)="moveComponent(component.id, -1)"
                      ></app-ui-kit-button>
                      <app-ui-kit-button
                        label="Bajar"
                        icon="pi pi-arrow-down"
                        tone="secondary"
                        variant="ghost"
                        size="small"
                        (pressed)="moveComponent(component.id, 1)"
                      ></app-ui-kit-button>
                      <app-ui-kit-button
                        label="Quitar"
                        icon="pi pi-times"
                        tone="danger"
                        variant="ghost"
                        size="small"
                        (pressed)="removeComponent(component.id)"
                      ></app-ui-kit-button>
                    </div>
                  }
                </div>
              </app-admin-panel>
              }

              @if (workspaceTab() === 'preview') {
              <app-admin-panel
                title="4. Preview"
                description="Valida la estructura en escritorio, tablet y móvil antes de publicar."
                eyebrow="Runtime visual"
              >
                <app-preview-viewport [mode]="viewport()" (modeChange)="viewport.set($event)">
                  <section class="preview-screen" [class.mobile]="viewport() === 'mobile'">
                    <div class="preview-runtime-note">
                      <span>{{ previewRuntimeSummary() }}</span>
                    </div>

                    <nav class="preview-app-bar" aria-label="Preview app navigation">
                      <div class="preview-app-brand">
                        <strong>{{ appDraft().name || 'Mi app' }}</strong>
                        <span>{{ appDraft().targetsMode }} · {{ appDraft().defaultLocale }}</span>
                      </div>
                      <div class="preview-app-menu">
                        @for (item of previewNavigationItems(); track item.route) {
                          <span class="preview-nav-item" [class.active]="item.active">{{ item.label }}</span>
                        }
                        @if (!previewNavigationItems().length) {
                          <span class="preview-nav-item active">Sin menú visible</span>
                        }
                      </div>
                    </nav>

                    <header class="preview-header">
                      <h2>{{ screenDraft().title || 'Pantalla sin título' }}</h2>
                      <p>{{ screenDraft().description || 'Describe qué resuelve esta pantalla para el usuario.' }}</p>
                      <div class="preview-route">
                        <span>Ruta {{ screenDraft().route || '/sin-ruta' }}</span>
                        <span>{{ screenDraft().navigationVisibility === 'visible' ? 'Visible en menú' : 'Ruta interna' }}</span>
                        <span>Grupo {{ screenDraft().navigationGroup || 'principal' }}</span>
                      </div>
                    </header>

                    <div class="preview-regions">
                      @for (region of previewRegions(); track region.key) {
                        @if (componentsForRegion(region.key).length) {
                          <section class="preview-region">
                            <div class="preview-region-title">{{ region.label }}</div>
                            <div
                              class="preview-grid"
                              [class.tablet]="viewport() === 'tablet'"
                              [class.mobile]="viewport() === 'mobile'"
                            >
                              @for (component of componentsForRegion(region.key); track component.id) {
                                <article
                                  class="preview-card"
                                  [class.hero]="component.componentKey === 'hero_header'"
                                  [class.plain]="component.chrome === 'plain'"
                                  [class.modal]="component.chrome === 'modal'"
                                  [class.drawer]="component.chrome === 'drawer'"
                                  [class.toolbar]="component.chrome === 'toolbar'"
                                  [style.grid-column]="componentGridColumn(component)"
                                  [style.justify-self]="component.align === 'stretch' ? 'stretch' : component.align"
                                >
                                  <strong>{{ component.title }}</strong>
                                  <span>{{ componentSummary(component) }}</span>
                                  <div class="preview-hint-list">
                                    <span>{{ widthLabel(component.width) }}</span>
                                    <span>{{ bindingLabel(component.bindingType) }}: {{ component.bindingKey || 'sin key' }}</span>
                                    <span>{{ actionLabel(component.actionType) }}{{ component.actionTarget ? ': ' + component.actionTarget : '' }}</span>
                                  </div>
                                </article>
                              }
                            </div>
                          </section>
                        }
                      }

                      @if (screenDraft().components.length === 0) {
                        <app-status-notice class="empty-preview" tone="info" title="Sin componentes">
                          <span>Agrega componentes para ver cómo se organiza la pantalla.</span>
                        </app-status-notice>
                      }
                    </div>
                  </section>
                </app-preview-viewport>
              </app-admin-panel>
              }

              @if (workspaceTab() === 'publish') {
              <app-json-authoring-panel
                artifactLabel="App / Screen"
                [title]="jsonPanelTitle()"
                [description]="jsonPanelDescription()"
                [endpoint]="jsonPanelEndpoint()"
                [value]="currentJsonText()"
                [ready]="jsonError().length === 0"
                [error]="jsonError()"
                [isBusy]="saving()"
                (valueChange)="setJsonText($event)"
                (applyJson)="applyJsonToGuide()"
                (resetJson)="resetJsonFromGuide()"
                (saveDraft)="saveJson(false)"
                (saveAndPublish)="saveJson(true)"
              >
                <div class="json-switcher">
                  <app-ui-kit-button
                    label="JSON app"
                    [tone]="jsonTarget() === 'app' ? 'primary' : 'secondary'"
                    [variant]="jsonTarget() === 'app' ? 'solid' : 'outline'"
                    size="small"
                    (pressed)="setJsonTarget('app')"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="JSON pantalla"
                    [tone]="jsonTarget() === 'screen' ? 'primary' : 'secondary'"
                    [variant]="jsonTarget() === 'screen' ? 'solid' : 'outline'"
                    size="small"
                    (pressed)="setJsonTarget('screen')"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="JSON paquete"
                    [tone]="jsonTarget() === 'package' ? 'primary' : 'secondary'"
                    [variant]="jsonTarget() === 'package' ? 'solid' : 'outline'"
                    size="small"
                    (pressed)="setJsonTarget('package')"
                  ></app-ui-kit-button>
                </div>
                <div class="package-hint">
                  <p class="hint-line">
                    La app define el contenedor. La pantalla define componentes, bindings, dataSources y acciones.
                    El paquete agrupa todo para compartir, instalar o mover una app entre ambientes.
                  </p>
                  @if (jsonTarget() === 'package') {
                    <div class="package-actions">
                      <app-ui-kit-button
                        label="Generar desde diseñador"
                        icon="pi pi-refresh"
                        tone="secondary"
                        variant="outline"
                        size="small"
                        (pressed)="syncPackageJson()"
                      ></app-ui-kit-button>
                      <app-ui-kit-button
                        label="Instalar paquete"
                        icon="pi pi-box"
                        size="small"
                        [disabled]="saving() || jsonError().length > 0"
                        (pressed)="installPackage(false)"
                      ></app-ui-kit-button>
                    </div>
                  }
                </div>
              </app-json-authoring-panel>
              }

              @if (workspaceTab() === 'security') {
                <app-admin-panel
                  title="Seguridad de la app"
                  description="Controla el acceso declarativo de la app y sus pantallas. Los permisos reales siguen pasando por Auth/RBAC del tenant."
                  eyebrow="Tenant scope"
                >
                  <div class="security-grid">
                    <div class="security-row">
                      <div>
                        <strong>Scope del tenant</strong>
                        <span>La app se publica dentro del tenant actual. Runtime y servicios no deben cruzar datos entre organizaciones.</span>
                      </div>
                      <span class="chip">tenant</span>
                    </div>
                    <div class="security-row">
                      <div>
                        <strong>Permiso de pantalla</strong>
                        <span>
                          Usa el campo “Permiso requerido” en Navegación para proteger la ruta.
                          Ejemplo: apps.read, clientes.read, inspecciones.create.
                        </span>
                      </div>
                      <span class="chip">{{ screenDraft().navigationPermission || 'sin permiso extra' }}</span>
                    </div>
                    <div class="security-row">
                      <div>
                        <strong>Publicación explícita</strong>
                        <span>Guardar crea draft. Publicar congela una versión estable para runtime web, móvil o desktop.</span>
                      </div>
                      <span class="chip">{{ selectedApp()?.published ? 'publicada' : 'draft' }}</span>
                    </div>
                  </div>
                </app-admin-panel>
              }

              @if (workspaceTab() === 'trash') {
                <app-admin-panel
                  title="Papelera"
                  description="Restaura apps o pantallas sin bloquear keys activas. Si existe conflicto, el backend pedirá confirmación de overwrite."
                  eyebrow="Ciclo de vida"
                >
                  <div class="restore-grid">
                    @if (!trashedApps().length && !trashedScreens().length) {
                      <app-status-notice tone="info" title="Papelera vacía">
                        <span>No hay apps ni pantallas eliminadas para restaurar.</span>
                      </app-status-notice>
                    }

                    @for (app of trashedApps(); track app.id) {
                      <div class="restore-row">
                        <div>
                          <strong>{{ app.name }}</strong>
                          <span>App · {{ originalArtifactKey(app) }} · {{ artifactStatusLabel(app) }}</span>
                        </div>
                        <app-ui-kit-button
                          label="Restaurar app"
                          icon="pi pi-undo"
                          tone="secondary"
                          variant="outline"
                          [disabled]="saving()"
                          (pressed)="restoreApp(app)"
                        ></app-ui-kit-button>
                      </div>
                    }

                    @for (screen of trashedScreens(); track screen.id) {
                      <div class="restore-row">
                        <div>
                          <strong>{{ screen.title }}</strong>
                          <span>Pantalla · {{ originalArtifactKey(screen) }} · {{ screen.route || '/' }}</span>
                        </div>
                        <app-ui-kit-button
                          label="Restaurar pantalla"
                          icon="pi pi-undo"
                          tone="secondary"
                          variant="outline"
                          [disabled]="saving() || !selectedApp()"
                          (pressed)="restoreScreen(screen)"
                        ></app-ui-kit-button>
                      </div>
                    }
                  </div>
                </app-admin-panel>
              }
            }
          </div>
        </app-designer-workspace>
      </div>
    </app-page-shell>
  `
})
export class AppsPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiClientService);
  private readonly assistant = inject(AiAssistantService);
  private appliedAssistantProposalId = 0;
  private readonly unregisterAssistantState = this.assistant.registerScreenStateProvider('apps', () =>
    this.assistantScreenState()
  );
  private readonly assistantProposalEffect = effect(() => {
    const proposal = this.assistant.proposal();
    if (!proposal || proposal.id === this.appliedAssistantProposalId || proposal.scope !== 'apps') {
      return;
    }

    const appAction = proposal.actions.find(
      (item): item is ApplyDynamicAppJsonAction => item.type === 'apply_dynamic_app_json'
    );
    const screenAction = proposal.actions.find(
      (item): item is ApplyDynamicScreenJsonAction => item.type === 'apply_dynamic_screen_json'
    );

    if (!appAction && !screenAction) {
      return;
    }

    this.appliedAssistantProposalId = proposal.id;
    if (appAction) {
      this.applyAssistantAppProposal(appAction);
    }
    if (screenAction) {
      this.applyAssistantScreenProposal(screenAction);
    }
  });

  readonly apps = signal<DynamicAppRecord[]>([]);
  readonly trashedApps = signal<DynamicAppRecord[]>([]);
  readonly screens = signal<DynamicScreenRecord[]>([]);
  readonly trashedScreens = signal<DynamicScreenRecord[]>([]);
  readonly catalog = signal<ScreenComponentCatalogItem[]>([]);
  readonly selectedAppId = signal<string | null>(null);
  readonly selectedScreenId = signal<string | null>(null);
  readonly phase = signal<AppDesignerPhase>('app');
  readonly workspaceTab = signal<AppWorkspaceTab>('summary');
  readonly viewport = signal<PreviewViewportMode>('desktop');
  readonly jsonTarget = signal<JsonTarget>('app');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  readonly appDraft = signal<AppDraft>(this.defaultAppDraft());
  readonly screenDraft = signal<ScreenDraft>(this.defaultScreenDraft());
  readonly appJsonText = signal('');
  readonly screenJsonText = signal('');
  readonly packageJsonText = signal('');

  readonly selectedApp = computed(() => this.apps().find((item) => item.id === this.selectedAppId()) ?? null);
  readonly selectedScreen = computed(() => this.screens().find((item) => item.id === this.selectedScreenId()) ?? null);
  readonly trashCount = computed(() => this.trashedApps().length + this.trashedScreens().length);

  readonly workspaceTabs = computed<SegmentedControlItem[]>(() => [
    { key: 'summary', label: 'Resumen', icon: 'pi pi-th-large' },
    { key: 'screens', label: 'Páginas', icon: 'pi pi-window-maximize', disabled: !this.selectedApp() },
    { key: 'navigation', label: 'Navegación', icon: 'pi pi-compass', disabled: !this.selectedApp() },
    { key: 'security', label: 'Seguridad', icon: 'pi pi-shield', disabled: !this.selectedApp() },
    { key: 'preview', label: 'Preview', icon: 'pi pi-eye', disabled: !this.selectedApp() },
    { key: 'publish', label: 'Publicar', icon: 'pi pi-upload', disabled: !this.selectedApp() },
    {
      key: 'trash',
      label: `Papelera${this.trashCount() ? ` (${this.trashCount()})` : ''}`,
      icon: 'pi pi-trash'
    }
  ]);

  readonly appMetrics = computed(() => [
    {
      label: 'Apps activas',
      value: String(this.apps().length),
      detail: 'Portafolio del tenant',
      tone: 'primary' as const
    },
    {
      label: 'Pantallas de la app',
      value: String(this.screens().length),
      detail: this.selectedApp()?.key ?? 'Selecciona una app',
      tone: 'neutral' as const
    },
    {
      label: 'Publicación',
      value: this.selectedApp()?.published ? `v${this.selectedApp()?.version}` : 'Draft',
      detail: this.selectedApp()?.published ? 'Runtime disponible' : 'Pendiente de publicar',
      tone: this.selectedApp()?.published ? ('success' as const) : ('warning' as const)
    }
  ]);

  readonly processSteps = computed<ProcessStepItem[]>(() => [
    {
      key: 'app',
      label: 'App',
      summary: this.selectedApp() ? `${this.selectedApp()?.key} · v${this.selectedApp()?.version}` : 'Contenedor',
      state: this.phase() === 'app' ? 'active' : this.selectedApp() ? 'complete' : 'pending'
    },
    {
      key: 'screen',
      label: 'Pantalla',
      summary: this.selectedScreen() ? `${this.selectedScreen()?.route || '/'} · v${this.selectedScreen()?.version}` : 'Ruta y target',
      state: this.phase() === 'screen' ? 'active' : this.selectedScreen() ? 'complete' : 'pending'
    },
    {
      key: 'components',
      label: 'Componentes',
      summary: `${this.screenDraft().components.length} piezas`,
      state: this.phase() === 'components' ? 'active' : this.screenDraft().components.length ? 'complete' : 'pending'
    },
    {
      key: 'preview',
      label: 'Preview',
      summary: 'Web, tablet y móvil',
      state: this.phase() === 'preview' ? 'active' : this.screenDraft().components.length ? 'complete' : 'pending'
    },
    {
      key: 'json',
      label: 'JSON',
      summary: 'Guardar y publicar',
      state: this.phase() === 'json' ? 'active' : this.jsonError() ? 'warning' : 'pending'
    }
  ]);

  readonly guide = computed(() => {
    const appReady = this.appDraftReady();
    const screenReady = this.screenDraftReady();
    const componentsReady = this.screenDraft().components.length > 0;

    if (this.phase() === 'app') {
      return {
        stepLabel: 'PASO 1 DE 5',
        title: appReady ? 'La app ya tiene identidad' : 'Define qué app quieres crear',
        description:
          'La app es el paquete instalable: nombre, targets, tema base, textos, rutas y pantallas que luego se podrán exportar como plantilla.',
        tone: appReady ? 'success' : 'info',
        actionLabel: 'Continuar a pantalla'
      } as const;
    }

    if (this.phase() === 'screen') {
      return {
        stepLabel: 'PASO 2 DE 5',
        title: screenReady ? 'La pantalla ya tiene ruta' : 'Define la primera pantalla',
        description:
          'Una pantalla describe dónde aparece, para qué target funciona y cómo se compone. No contiene lógica quemada: todo queda en JSON.',
        tone: screenReady ? 'success' : 'info',
        actionLabel: 'Agregar componentes'
      } as const;
    }

    if (this.phase() === 'components') {
      return {
        stepLabel: 'PASO 3 DE 5',
        title: componentsReady ? 'La composición ya tiene piezas' : 'Agrega componentes reutilizables',
        description:
          'Usa bloques como formularios, tablas, métricas, acciones de servicio y acciones de flow. Los bindings conectan cada pieza con datos reales.',
        tone: componentsReady ? 'success' : 'warning',
        actionLabel: 'Ver preview'
      } as const;
    }

    if (this.phase() === 'preview') {
      return {
        stepLabel: 'PASO 4 DE 5',
        title: 'Revisa la experiencia antes de publicar',
        description:
          'El preview valida estructura, cortes responsive y lectura general. La ejecución real de cada componente vendrá desde el runtime publicado.',
        tone: 'info',
        actionLabel: 'Editar JSON'
      } as const;
    }

    return {
      stepLabel: 'PASO 5 DE 5',
      title: 'JSON como fuente portable',
      description:
        'Guardar draft preserva el contrato. Guardar y publicar congela una versión estable para runtime, exportación e instalación.',
      tone: this.jsonError() ? 'warning' : 'success',
      actionLabel: 'Volver a app'
    } as const;
  });

  readonly currentJsonText = computed(() => {
    if (this.jsonTarget() === 'app') {
      return this.appJsonText();
    }
    if (this.jsonTarget() === 'screen') {
      return this.screenJsonText();
    }
    return this.packageJsonText();
  });
  readonly jsonError = computed(() => this.parseJsonError(this.currentJsonText()));

  readonly appFields: RuntimeField[] = [
    { name: 'key', label: 'Key', type: 'text', required: true, placeholder: 'mi_app' },
    { name: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Mi app' },
    { name: 'category', label: 'Categoría', type: 'text', placeholder: 'operaciones' },
    {
      name: 'targetsMode',
      label: 'Targets',
      type: 'select',
      required: true,
      options: [
        { label: 'Web + móvil', value: 'web_mobile' },
        { label: 'Web + móvil + desktop', value: 'web_mobile_desktop' },
        { label: 'Solo admin', value: 'admin' },
        { label: 'Todos', value: 'all' }
      ]
    },
    {
      name: 'kit',
      label: 'Kit base',
      type: 'select',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'PrimeNG', value: 'primeng' },
        { label: 'Ionic', value: 'ionic' },
        { label: 'Material', value: 'material' },
        { label: 'Bootstrap', value: 'bootstrap' }
      ]
    },
    {
      name: 'theme',
      label: 'Tema base',
      type: 'select',
      options: [
        { label: 'Azul Chicle', value: 'chicle' },
        { label: 'Verde Operativo', value: 'operational_green' },
        { label: 'Claro Neutral', value: 'neutral_light' }
      ]
    },
    {
      name: 'defaultLocale',
      label: 'Idioma default',
      type: 'select',
      options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' }
      ]
    },
    { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Qué resuelve esta app' }
  ];

  readonly screenFields: RuntimeField[] = [
    { name: 'key', label: 'Key', type: 'text', required: true, placeholder: 'dashboard' },
    { name: 'title', label: 'Título', type: 'text', required: true, placeholder: 'Dashboard' },
    { name: 'route', label: 'Ruta', type: 'text', required: true, placeholder: '/dashboard' },
    {
      name: 'target',
      label: 'Target',
      type: 'select',
      required: true,
      options: [
        { label: 'Multi', value: 'multi' },
        { label: 'Web', value: 'web' },
        { label: 'Móvil', value: 'mobile' },
        { label: 'Desktop', value: 'desktop' },
        { label: 'Admin', value: 'admin' }
      ]
    },
    {
      name: 'layoutMode',
      label: 'Tipo de pantalla',
      type: 'select',
      options: [
        { label: 'Dashboard', value: 'dashboard' },
        { label: 'Formulario', value: 'form_page' },
        { label: 'Detalle', value: 'detail_page' },
        { label: 'Listado', value: 'list_page' }
      ]
    },
    { name: 'category', label: 'Categoría', type: 'text', placeholder: 'clientes' },
    { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Qué verá el usuario en esta pantalla' }
  ];

  readonly navigationFields: RuntimeField[] = [
    {
      name: 'navigationVisibility',
      label: 'Mostrar en menú',
      type: 'select',
      options: [
        { label: 'Sí, visible', value: 'visible' },
        { label: 'No, ruta interna', value: 'hidden' }
      ]
    },
    { name: 'navigationLabel', label: 'Texto del menú', type: 'text', placeholder: 'Inicio' },
    { name: 'navigationGroup', label: 'Grupo', type: 'text', placeholder: 'principal, ventas, admin' },
    {
      name: 'navigationIcon',
      label: 'Icono',
      type: 'select',
      options: [
        { label: 'Inicio', value: 'home' },
        { label: 'Listado', value: 'list' },
        { label: 'Formulario', value: 'edit' },
        { label: 'Dashboard', value: 'chart' },
        { label: 'Usuarios', value: 'users' },
        { label: 'Configuración', value: 'settings' }
      ]
    },
    { name: 'navigationPermission', label: 'Permiso requerido', type: 'text', placeholder: 'apps.read, sales.read' }
  ];

  ngOnInit() {
    void this.load();
    this.syncAppJson();
    this.syncScreenJson();
    this.syncPackageJson();
  }

  ngOnDestroy() {
    this.unregisterAssistantState();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [apps, trashedApps, catalog] = await Promise.all([
        firstValueFrom(this.api.get<DynamicAppRecord[]>('apps')),
        firstValueFrom(this.api.get<DynamicAppRecord[]>('apps/trash')),
        firstValueFrom(this.api.get<ScreenComponentCatalogItem[]>('apps/components/catalog'))
      ]);
      this.apps.set(apps);
      this.trashedApps.set(trashedApps);
      this.catalog.set(catalog);
      const selected = apps.find((item) => item.id === this.selectedAppId()) ?? apps[0] ?? null;
      if (selected) {
        await this.selectApp(selected);
      } else {
        this.newApp();
      }
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo cargar el diseñador de apps.'));
    } finally {
      this.loading.set(false);
    }
  }

  async selectApp(app: DynamicAppRecord) {
    this.selectedAppId.set(app.id);
    this.appDraft.set(this.appDraftFromRecord(app));
    this.syncAppJson();
    this.syncPackageJson();
    try {
      const [screens, trashedScreens] = await Promise.all([
        firstValueFrom(this.api.get<DynamicScreenRecord[]>(`apps/${app.id}/screens`)),
        firstValueFrom(this.api.get<DynamicScreenRecord[]>(`apps/${app.id}/screens/trash`))
      ]);
      this.screens.set(screens);
      this.trashedScreens.set(trashedScreens);
      const selectedScreen = screens.find((item) => item.id === this.selectedScreenId()) ?? screens[0] ?? null;
      if (selectedScreen) {
        this.selectScreen(selectedScreen);
      } else {
        this.newScreen(false);
      }
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudieron cargar las pantallas de la app.'));
    }
  }

  selectScreen(screen: DynamicScreenRecord) {
    this.selectedScreenId.set(screen.id);
    this.screenDraft.set(this.screenDraftFromRecord(screen));
    this.syncScreenJson();
    this.syncPackageJson();
  }

  newApp() {
    this.selectedAppId.set(null);
    this.selectedScreenId.set(null);
    this.screens.set([]);
    this.trashedScreens.set([]);
    this.appDraft.set(this.defaultAppDraft());
    this.screenDraft.set(this.defaultScreenDraft());
    this.jsonTarget.set('app');
    this.syncAppJson();
    this.syncScreenJson();
    this.syncPackageJson();
    this.phase.set('app');
    this.workspaceTab.set('summary');
  }

  newScreen(clearSelection = true) {
    if (clearSelection) {
      this.selectedScreenId.set(null);
    }
    const appKey = this.appDraft().key || 'mi_app';
    this.screenDraft.set(this.defaultScreenDraft(appKey));
    this.syncScreenJson();
    this.syncPackageJson();
    this.phase.set('screen');
  }

  setPhase(phase: string) {
    if (phase === 'app' || phase === 'screen' || phase === 'components' || phase === 'preview' || phase === 'json') {
      this.phase.set(phase);
      if (phase === 'json' && this.jsonTarget() !== 'package') {
        this.jsonTarget.set(this.selectedScreen() || this.screenDraftReady() ? 'screen' : 'app');
      }
      this.workspaceTab.set(this.workspaceTabFromPhase(phase));
    }
  }

  setWorkspaceTab(tab: string) {
    if (
      tab === 'summary' ||
      tab === 'screens' ||
      tab === 'navigation' ||
      tab === 'security' ||
      tab === 'preview' ||
      tab === 'publish' ||
      tab === 'trash'
    ) {
      if (tab !== 'summary' && tab !== 'trash' && !this.selectedApp()) {
        return;
      }
      this.workspaceTab.set(tab);
      this.phase.set(this.phaseFromWorkspaceTab(tab));
      if (tab === 'publish' && this.jsonTarget() !== 'package') {
        this.jsonTarget.set(this.selectedScreen() || this.screenDraftReady() ? 'screen' : 'app');
      }
    }
  }

  advancePhase() {
    const order: AppDesignerPhase[] = ['app', 'screen', 'components', 'preview', 'json'];
    const next = order[(order.indexOf(this.phase()) + 1) % order.length];
    this.setPhase(next);
  }

  appFieldValue(name: string) {
    return this.appDraft()[name as keyof AppDraft] ?? '';
  }

  setAppField(name: string, value: unknown) {
    const text = this.stringValue(value);
    this.appDraft.update((draft) => {
      const next = { ...draft, [name]: text };
      if (name === 'name' && !draft.key) {
        next.key = this.normalizeKey(text);
      }
      return next;
    });
    this.syncAppJson();
    this.syncPackageJson();
  }

  screenFieldValue(name: string) {
    return this.screenDraft()[name as keyof ScreenDraft] ?? '';
  }

  setScreenField(name: string, value: unknown) {
    const text = this.stringValue(value);
    this.screenDraft.update((draft) => {
      const next = { ...draft, [name]: text };
      if (name === 'title' && !draft.key) {
        next.key = this.normalizeKey(text);
      }
      if (name === 'key' && (!draft.route || draft.route === `/${draft.key.replace(/_/g, '-')}`)) {
        next.route = `/${this.normalizeKey(text).replace(/_/g, '-')}`;
      }
      return next;
    });
    this.syncScreenJson();
    this.syncPackageJson();
  }

  componentFields() {
    return [
      {
        name: 'componentKey',
        label: 'Componente',
        type: 'select',
        required: true,
        options: this.catalogOptions()
      },
      { name: 'componentTitle', label: 'Título visible', type: 'text', placeholder: 'Resumen' },
      {
        name: 'componentRegion',
        label: 'Ubicación en pantalla',
        type: 'select',
        options: [
          { label: 'Header: parte superior', value: 'header' },
          { label: 'Content: cuerpo principal', value: 'content' },
          { label: 'Actions: barra de acciones', value: 'actions' },
          { label: 'Aside: panel lateral', value: 'aside' }
        ]
      },
      {
        name: 'componentChrome',
        label: 'Cómo se ve',
        type: 'select',
        options: [
          { label: 'Card', value: 'card' },
          { label: 'Plano', value: 'plain' },
          { label: 'Modal reusable', value: 'modal' },
          { label: 'Drawer lateral', value: 'drawer' },
          { label: 'Toolbar', value: 'toolbar' }
        ]
      },
      {
        name: 'componentWidth',
        label: 'Ancho escritorio',
        type: 'select',
        options: [
          { label: 'Automático', value: 'auto' },
          { label: 'Completo 100%', value: 'full' },
          { label: 'Dos tercios', value: 'two_thirds' },
          { label: 'Mitad', value: 'half' },
          { label: 'Un tercio', value: 'third' },
          { label: 'Un cuarto', value: 'quarter' }
        ]
      },
      {
        name: 'componentAlign',
        label: 'Alineación',
        type: 'select',
        options: [
          { label: 'Estirar al ancho', value: 'stretch' },
          { label: 'Izquierda', value: 'start' },
          { label: 'Centro', value: 'center' },
          { label: 'Derecha', value: 'end' }
        ]
      },
      {
        name: 'componentBindingType',
        label: 'Qué datos usa',
        type: 'select',
        options: [
          { label: 'Sin datos', value: 'none' },
          { label: 'Formulario dinámico', value: 'form' },
          { label: 'Servicio dinámico', value: 'service' },
          { label: 'Flow publicado', value: 'flow' },
          { label: 'Tabla', value: 'table' },
          { label: 'Fuente libre', value: 'source' }
        ]
      },
      {
        name: 'componentBindingKey',
        label: 'Key del recurso',
        type: 'text',
        placeholder: this.componentBindingPlaceholder()
      },
      {
        name: 'componentActionType',
        label: 'Qué ocurre al usarlo',
        type: 'select',
        options: [
          { label: 'Nada automático', value: 'none' },
          { label: 'Navegar a ruta', value: 'navigate' },
          { label: 'Ejecutar servicio', value: 'execute_service' },
          { label: 'Ejecutar flow', value: 'execute_flow' },
          { label: 'Abrir modal', value: 'open_modal' },
          { label: 'Enviar formulario', value: 'submit_form' },
          { label: 'Emitir evento', value: 'emit_event' }
        ]
      },
      {
        name: 'componentActionTarget',
        label: 'Destino de la acción',
        type: 'text',
        placeholder: '/clientes, crear_cliente, aprobar_solicitud, modal_detalle'
      }
    ] satisfies RuntimeField[];
  }

  componentFieldValue(name: string) {
    return this.screenDraft()[name as keyof ScreenDraft] ?? '';
  }

  setComponentField(name: string, value: unknown) {
    const text = this.stringValue(value);
    this.screenDraft.update((draft) => {
      const next = { ...draft, [name]: text };
      if (name === 'componentKey' && !draft.componentTitle) {
        next.componentTitle = this.componentLabel(text);
      }
      if (name === 'componentKey') {
        const defaults = this.componentDefaults(text);
        next.componentBindingType = defaults.bindingType;
        next.componentActionType = defaults.actionType;
        next.componentChrome = defaults.chrome;
        next.componentWidth = defaults.width;
        next.componentRegion = defaults.region;
      }
      return next;
    });
    this.syncScreenJson();
    this.syncPackageJson();
  }

  addComponent() {
    const draft = this.screenDraft();
    const componentKey = draft.componentKey || this.catalog()[0]?.key || 'entity_card';
    const component: ScreenComponentDraft = {
      id: `${componentKey}_${Date.now().toString(36)}`,
      componentKey,
      title: draft.componentTitle || this.componentLabel(componentKey),
      region: draft.componentRegion || 'content',
      bindingType: this.componentBindingTypeValue(draft.componentBindingType),
      bindingKey: draft.componentBindingKey.trim(),
      width: this.componentWidthValue(draft.componentWidth),
      align: this.componentAlignValue(draft.componentAlign),
      chrome: this.componentChromeValue(draft.componentChrome),
      actionType: this.componentActionTypeValue(draft.componentActionType),
      actionTarget: draft.componentActionTarget.trim()
    };
    this.screenDraft.update((current) => ({
      ...current,
      componentTitle: '',
      componentBindingKey: '',
      componentActionTarget: '',
      components: [...current.components, component]
    }));
    this.syncScreenJson();
    this.syncPackageJson();
    this.message.set('Componente agregado al contrato de pantalla.');
  }

  addPresetComponent(preset: ScreenComponentPreset) {
    const presets: Record<ScreenComponentPreset, Partial<ScreenComponentDraft>> = {
      menu: {
        componentKey: 'nav_menu',
        title: 'Menú principal',
        region: 'header',
        bindingType: 'source',
        bindingKey: this.appDraft().key || 'mi_app',
        width: 'full',
        align: 'stretch',
        chrome: 'toolbar',
        actionType: 'navigate',
        actionTarget: this.screenDraft().route || '/inicio'
      },
      login: {
        componentKey: 'auth_login',
        title: 'Iniciar sesión',
        region: 'content',
        bindingType: 'service',
        bindingKey: 'auth.login',
        width: 'half',
        align: 'center',
        chrome: 'card',
        actionType: 'execute_service',
        actionTarget: 'auth.login'
      },
      form: {
        componentKey: 'form_runtime',
        title: 'Formulario',
        region: 'content',
        bindingType: 'form',
        bindingKey: 'form_key',
        width: 'half',
        align: 'stretch',
        chrome: 'card',
        actionType: 'submit_form',
        actionTarget: 'form_key'
      },
      table: {
        componentKey: 'data_table',
        title: 'Listado',
        region: 'content',
        bindingType: 'service',
        bindingKey: 'listar_recurso',
        width: 'full',
        align: 'stretch',
        chrome: 'card',
        actionType: 'none',
        actionTarget: ''
      },
      service: {
        componentKey: 'service_button',
        title: 'Ejecutar acción',
        region: 'actions',
        bindingType: 'service',
        bindingKey: 'servicio_publicado',
        width: 'quarter',
        align: 'start',
        chrome: 'plain',
        actionType: 'execute_service',
        actionTarget: 'servicio_publicado'
      }
    };
    const config = presets[preset];
    const componentKey = config.componentKey ?? 'entity_card';
    const component: ScreenComponentDraft = {
      id: `${componentKey}_${Date.now().toString(36)}`,
      componentKey,
      title: config.title ?? this.componentLabel(componentKey),
      region: config.region ?? 'content',
      bindingType: config.bindingType ?? 'none',
      bindingKey: config.bindingKey ?? '',
      width: config.width ?? 'auto',
      align: config.align ?? 'stretch',
      chrome: config.chrome ?? 'card',
      actionType: config.actionType ?? 'none',
      actionTarget: config.actionTarget ?? ''
    };

    this.screenDraft.update((current) => ({
      ...current,
      componentKey: component.componentKey,
      componentTitle: '',
      componentRegion: component.region,
      componentBindingType: component.bindingType,
      componentBindingKey: '',
      componentWidth: component.width,
      componentAlign: component.align,
      componentChrome: component.chrome,
      componentActionType: component.actionType,
      componentActionTarget: '',
      components: [...current.components, component]
    }));
    this.syncScreenJson();
    this.syncPackageJson();
    this.message.set(`${component.title} agregado al preview de la pantalla.`);
  }

  removeComponent(id: string) {
    this.screenDraft.update((draft) => ({
      ...draft,
      components: draft.components.filter((component) => component.id !== id)
    }));
    this.syncScreenJson();
    this.syncPackageJson();
  }

  moveComponent(id: string, direction: -1 | 1) {
    this.screenDraft.update((draft) => {
      const index = draft.components.findIndex((component) => component.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= draft.components.length) {
        return draft;
      }
      const components = [...draft.components];
      const [component] = components.splice(index, 1);
      components.splice(target, 0, component);
      return { ...draft, components };
    });
    this.syncScreenJson();
    this.syncPackageJson();
  }

  async saveApp(publish: boolean) {
    await this.saveAppDocument(publish, this.appManifestFromDraft());
  }

  async saveScreen(publish: boolean) {
    await this.saveScreenDocument(publish, this.screenDefinitionFromDraft());
  }

  async saveJson(publish: boolean) {
    if (this.jsonTarget() === 'app') {
      const manifest = this.parseJson<DynamicAppRecord['manifest']>(this.appJsonText());
      if (!manifest) return;
      await this.saveAppDocument(publish, manifest);
      return;
    }

    if (this.jsonTarget() === 'package') {
      await this.installPackage(publish);
      return;
    }

    const definition = this.parseJson<Record<string, unknown>>(this.screenJsonText());
    if (!definition) return;
    await this.saveScreenDocument(publish, definition);
  }

  applyJsonToGuide() {
    if (this.jsonTarget() === 'app') {
      const manifest = this.parseJson<Record<string, unknown>>(this.appJsonText());
      if (!manifest) return;
      this.appDraft.set(this.appDraftFromManifest(manifest));
      this.syncAppJson();
      this.message.set('JSON de app aplicado a la guía visual.');
      return;
    }

    if (this.jsonTarget() === 'package') {
      const appPackage = this.parseJson<DynamicAppPackage>(this.packageJsonText());
      if (!appPackage) return;
      this.applyPackageToGuide(appPackage);
      this.message.set('JSON de paquete aplicado a la guía visual. Aún no se instaló ni publicó.');
      return;
    }

    const definition = this.parseJson<Record<string, unknown>>(this.screenJsonText());
    if (!definition) return;
    this.screenDraft.set(this.screenDraftFromDefinition(definition));
    this.syncScreenJson();
    this.message.set('JSON de pantalla aplicado a la guía visual.');
  }

  resetJsonFromGuide() {
    if (this.jsonTarget() === 'app') {
      this.syncAppJson();
    } else if (this.jsonTarget() === 'screen') {
      this.syncScreenJson();
    } else {
      this.syncPackageJson();
    }
  }

  private applyAssistantAppProposal(action: ApplyDynamicAppJsonAction) {
    this.appDraft.set(this.appDraftFromManifest(action.document));
    this.syncAppJson();
    this.syncPackageJson();
    this.jsonTarget.set('app');
    this.phase.set('screen');
    this.message.set(
      'Chicle AI aplicó una app como draft visual. Revisa app, pantalla y JSON; luego guarda o publica desde el diseñador.'
    );
  }

  private applyAssistantScreenProposal(action: ApplyDynamicScreenJsonAction) {
    this.screenDraft.set(this.screenDraftFromDefinition(action.document));
    this.syncScreenJson();
    this.syncPackageJson();
    this.jsonTarget.set('screen');
    this.phase.set('preview');
    this.message.set(
      'Chicle AI aplicó una pantalla como draft visual. Revisa navegación, componentes y preview antes de guardar.'
    );
  }

  setJsonTarget(target: JsonTarget) {
    this.jsonTarget.set(target);
  }

  setJsonText(value: string) {
    if (this.jsonTarget() === 'app') {
      this.appJsonText.set(value);
    } else if (this.jsonTarget() === 'screen') {
      this.screenJsonText.set(value);
    } else {
      this.packageJsonText.set(value);
    }
  }

  async exportPackage() {
    const app = this.selectedApp();
    if (!app) {
      this.syncPackageJson();
      this.jsonTarget.set('package');
      this.phase.set('json');
      this.message.set('Generé un paquete local desde el diseñador. Guarda la app para exportarlo desde backend.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    try {
      const appPackage = await firstValueFrom(this.api.get<DynamicAppPackage>(`apps/${app.id}/package`));
      this.packageJsonText.set(JSON.stringify(appPackage, null, 2));
      this.jsonTarget.set('package');
      this.phase.set('json');
      this.message.set(`Paquete ${appPackage.packageKey} exportado al editor JSON.`);
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo exportar el paquete.'));
    } finally {
      this.saving.set(false);
    }
  }

  async installPackage(publish: boolean) {
    const appPackage = this.parseJson<DynamicAppPackage>(this.packageJsonText());
    if (!appPackage) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const response = await firstValueFrom(
        this.api.post<DynamicAppPackageInstallResponse>('apps/packages/install', {
          document: appPackage,
          publish
        })
      );
      this.message.set(
        publish
          ? `Paquete ${response.key} instalado y publicado con ${response.screens.length} pantallas.`
          : `Paquete ${response.key} instalado como draft con ${response.screens.length} pantallas.`
      );
      await this.load();
      const saved = this.apps().find((item) => item.id === response.app.id || item.key === response.key);
      if (saved) {
        await this.selectApp(saved);
      }
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo instalar el paquete.'));
    } finally {
      this.saving.set(false);
    }
  }

  async trashApp() {
    const app = this.selectedApp();
    if (!app) return;
    this.saving.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.post(`apps/${app.id}/trash`, {}));
      this.message.set('App enviada a papelera. Su key queda disponible para otra app.');
      await this.load();
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo enviar la app a papelera.'));
    } finally {
      this.saving.set(false);
    }
  }

  async trashScreen() {
    const app = this.selectedApp();
    const screen = this.selectedScreen();
    if (!app || !screen) return;
    this.saving.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.post(`apps/${app.id}/screens/${screen.id}/trash`, {}));
      this.message.set('Pantalla enviada a papelera. Su key queda disponible.');
      await this.selectApp(app);
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo enviar la pantalla a papelera.'));
    } finally {
      this.saving.set(false);
    }
  }

  async restoreApp(app: DynamicAppRecord, overwrite = false) {
    this.saving.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.post(`apps/${app.id}/restore`, { overwrite }));
      this.message.set(`App ${this.originalArtifactKey(app)} restaurada.`);
      await this.load();
      const restored = this.apps().find((item) => item.key === this.originalArtifactKey(app));
      if (restored) {
        await this.selectApp(restored);
        this.workspaceTab.set('summary');
      }
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo restaurar la app.'));
    } finally {
      this.saving.set(false);
    }
  }

  async restoreScreen(screen: DynamicScreenRecord, overwrite = false) {
    const app = this.selectedApp();
    if (!app) return;
    this.saving.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.post(`apps/${app.id}/screens/${screen.id}/restore`, { overwrite }));
      this.message.set(`Pantalla ${this.originalArtifactKey(screen)} restaurada.`);
      await this.selectApp(app);
      this.workspaceTab.set('screens');
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo restaurar la pantalla.'));
    } finally {
      this.saving.set(false);
    }
  }

  componentSummary(component: ScreenComponentDraft) {
    const summaries: Record<string, string> = {
      hero_header: 'Encabezado o bloque principal de una pantalla.',
      nav_menu: 'Menú de navegación declarativo para rutas de la app.',
      side_nav: 'Menú lateral para apps web o desktop con varias secciones.',
      bottom_nav: 'Navegación inferior para experiencia móvil.',
      tabs: 'Agrupa vistas o secciones relacionadas.',
      metric_strip: 'Indicadores y conteos de una fuente de datos.',
      chart_panel: 'Visualiza métricas desde una fuente agregada.',
      data_table: 'Listado tabular conectado a un servicio dinámico.',
      search_panel: 'Filtros y criterios conectados a un servicio o tabla.',
      form_runtime: 'Renderiza un formulario dinámico publicado.',
      auth_login: 'Formulario estándar de login conectado al servicio auth.login.',
      service_button: 'Ejecuta un Dynamic Service y muestra o propaga su respuesta.',
      flow_button: 'Dispara un flow publicado y espera la salida configurada.',
      modal_shell: 'Contenedor modal reutilizable para formularios, detalles o confirmaciones.',
      entity_card: 'Muestra una entidad o resumen de negocio.',
      detail_panel: 'Presenta información detallada de un registro.',
      timeline: 'Muestra eventos o historial en orden temporal.',
      media_gallery: 'Muestra fotos, archivos o evidencias asociadas.',
      map_view: 'Renderiza ubicación, GPS o puntos de operación.'
    };
    return summaries[component.componentKey] ?? 'Componente reutilizable del runtime visual.';
  }

  previewRegions() {
    return [
      { key: 'header', label: 'Header' },
      { key: 'content', label: 'Contenido' },
      { key: 'actions', label: 'Acciones' },
      { key: 'aside', label: 'Lateral' }
    ];
  }

  componentsForRegion(region: string) {
    return this.screenDraft().components.filter((component) => component.region === region);
  }

  previewNavigationItems() {
    const current = this.screenDraft();
    const items = this.screens()
      .map((screen) => {
        const navigation = this.objectValue(screen.definition?.['navigation']);
        if (navigation?.['showInMenu'] === false) {
          return null;
        }
        return {
          label: this.stringValue(navigation?.['label']) || screen.title,
          route: screen.route || `/${screen.key}`,
          active: screen.id === this.selectedScreenId() || screen.key === current.key
        };
      })
      .filter((item): item is { label: string; route: string; active: boolean } => Boolean(item));

    const draftRoute = current.route || '/inicio';
    const alreadyHasDraft = items.some((item) => item.route === draftRoute);
    if (current.navigationVisibility === 'visible' && !alreadyHasDraft) {
      items.push({
        label: current.navigationLabel || current.title || 'Inicio',
        route: draftRoute,
        active: true
      });
    }

    return items;
  }

  previewRuntimeSummary() {
    const target = {
      admin: 'Admin',
      web: 'Web',
      mobile: 'Móvil',
      desktop: 'Desktop',
      multi: 'Web + móvil + desktop'
    }[this.screenDraft().target];
    const kit = this.appDraft().kit === 'auto' ? 'kit automático' : `kit ${this.appDraft().kit}`;
    const theme = this.appDraft().theme === 'chicle' ? 'tema Chicle' : `tema ${this.appDraft().theme}`;
    return `Preview ${target} · ${kit} · ${theme}`;
  }

  componentGridColumn(component: ScreenComponentDraft) {
    if (this.viewport() !== 'desktop') {
      return '1 / -1';
    }
    const spans: Record<ScreenComponentWidth, string> = {
      full: 'span 12',
      two_thirds: 'span 8',
      half: 'span 6',
      third: 'span 4',
      quarter: 'span 3',
      auto: component.region === 'header' ? 'span 12' : 'span 6'
    };
    return spans[component.width] ?? 'span 6';
  }

  widthLabel(value: ScreenComponentWidth) {
    return {
      full: '100%',
      two_thirds: '2/3',
      half: '1/2',
      third: '1/3',
      quarter: '1/4',
      auto: 'auto'
    }[value];
  }

  chromeLabel(value: ScreenComponentChrome) {
    return {
      card: 'card',
      plain: 'plano',
      modal: 'modal',
      drawer: 'drawer',
      toolbar: 'toolbar'
    }[value];
  }

  bindingLabel(value: ScreenComponentBindingType) {
    return {
      none: 'sin datos',
      form: 'form',
      service: 'servicio',
      flow: 'flow',
      table: 'tabla',
      source: 'fuente'
    }[value];
  }

  actionLabel(value: ScreenComponentActionType) {
    return {
      none: 'sin acción',
      navigate: 'navega',
      execute_service: 'ejecuta servicio',
      execute_flow: 'ejecuta flow',
      open_modal: 'abre modal',
      submit_form: 'envía form',
      emit_event: 'emite evento'
    }[value];
  }

  originalArtifactKey(item: { key: string; metadata?: Record<string, unknown> | null }) {
    const trash = this.objectValue(item.metadata?.['trash']);
    return this.stringValue(trash?.['originalKey']) || item.key.replace(/__trashed_[a-z0-9]{8}$/i, '');
  }

  artifactStatusLabel(item: { status: string; published: boolean; version: number; trashedAt?: string | null }) {
    if (item.trashedAt || item.status === 'trashed') {
      return 'papelera';
    }
    if (item.published) {
      return `publicada: v${item.version}`;
    }
    return item.status === 'draft' ? 'draft' : item.status;
  }

  jsonPanelTitle() {
    if (this.jsonTarget() === 'package') {
      return 'JSON del paquete instalable';
    }
    return this.jsonTarget() === 'app' ? 'JSON de la app' : 'JSON de la pantalla';
  }

  jsonPanelDescription() {
    if (this.jsonTarget() === 'package') {
      return 'Este JSON agrupa app, pantallas y dependencias detectadas. Puede instalarse en otro ambiente o compartirse como plantilla.';
    }
    return 'Puedes crear o modificar directamente desde JSON. La guía visual y el JSON son dos entradas al mismo contrato.';
  }

  jsonPanelEndpoint() {
    if (this.jsonTarget() === 'package') {
      return '/api/apps/packages/install';
    }
    return this.jsonTarget() === 'app' ? '/api/apps/authoring/json' : '/api/apps/screens/authoring/json';
  }

  private async saveAppDocument(publish: boolean, document: Record<string, unknown>) {
    this.saving.set(true);
    this.error.set('');
    try {
      const response = await firstValueFrom(
        this.api.post<DynamicAppAuthoringResponse>('apps/authoring/json', { document, publish })
      );
      this.message.set(publish ? `App ${response.key} guardada y publicada.` : `App ${response.key} guardada como draft.`);
      const apps = await firstValueFrom(this.api.get<DynamicAppRecord[]>('apps'));
      this.apps.set(apps);
      const saved = apps.find((item) => item.id === response.app.id || item.key === response.key);
      if (saved) {
        await this.selectApp(saved);
      }
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo guardar la app.'));
    } finally {
      this.saving.set(false);
    }
  }

  private async saveScreenDocument(publish: boolean, document: Record<string, unknown>) {
    let app = this.selectedApp();
    if (!app) {
      await this.saveApp(false);
      app = this.selectedApp();
    }

    if (!app) {
      this.error.set('Primero crea o guarda una app.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    try {
      const response = await firstValueFrom(
        this.api.post<DynamicScreenAuthoringResponse>('apps/screens/authoring/json', {
          appId: app.id,
          document,
          publish
        })
      );
      this.message.set(
        publish ? `Pantalla ${response.key} guardada y publicada.` : `Pantalla ${response.key} guardada como draft.`
      );
      const screens = await firstValueFrom(this.api.get<DynamicScreenRecord[]>(`apps/${app.id}/screens`));
      this.screens.set(screens);
      const saved = screens.find((item) => item.id === response.screen.id || item.key === response.key);
      if (saved) {
        this.selectScreen(saved);
      }
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo guardar la pantalla.'));
    } finally {
      this.saving.set(false);
    }
  }

  private defaultAppDraft(): AppDraft {
    return {
      key: 'mi_app',
      name: 'Mi app',
      category: 'negocio',
      description: 'App dinámica generada desde Chicle.',
      targetsMode: 'web_mobile',
      defaultLocale: 'es',
      theme: 'chicle',
      kit: 'auto'
    };
  }

  private defaultScreenDraft(appKey = 'mi_app'): ScreenDraft {
    return {
      key: 'inicio',
      title: 'Inicio',
      description: 'Pantalla inicial de la app.',
      route: '/inicio',
      target: 'multi',
      category: 'principal',
      layoutMode: 'dashboard',
      navigationLabel: 'Inicio',
      navigationGroup: 'principal',
      navigationIcon: 'home',
      navigationVisibility: 'visible',
      navigationPermission: '',
      componentKey: 'hero_header',
      componentTitle: 'Bienvenida',
      componentRegion: 'header',
      componentBindingType: 'source',
      componentBindingKey: '',
      componentWidth: 'full',
      componentAlign: 'stretch',
      componentChrome: 'card',
      componentActionType: 'none',
      componentActionTarget: '',
      components: [
        {
          id: 'hero_header_1',
          componentKey: 'hero_header',
          title: 'Bienvenida',
          region: 'header',
          bindingType: 'source',
          bindingKey: appKey,
          width: 'full',
          align: 'stretch',
          chrome: 'card',
          actionType: 'none',
          actionTarget: ''
        }
      ]
    };
  }

  private appDraftFromRecord(app: DynamicAppRecord): AppDraft {
    return this.appDraftFromManifest({
      ...app.manifest,
      key: app.key,
      name: app.name,
      category: app.category,
      description: app.description,
      targets: app.targets
    });
  }

  private appDraftFromManifest(manifest: Record<string, unknown>): AppDraft {
    const targets = Array.isArray(manifest['targets']) ? (manifest['targets'] as string[]) : ['web', 'mobile'];
    const presentation = this.objectValue(manifest['presentation']);
    const text = this.objectValue(manifest['text']);
    return {
      key: this.stringValue(manifest['key']) || 'mi_app',
      name: this.stringValue(manifest['name']) || 'Mi app',
      category: this.stringValue(manifest['category']) || 'negocio',
      description: this.stringValue(manifest['description']) || '',
      targetsMode: this.targetsModeFromTargets(targets),
      defaultLocale: this.stringValue(text?.['defaultLocale']) || 'es',
      theme: this.stringValue(presentation?.['theme']) || 'chicle',
      kit: this.stringValue(presentation?.['kit']) || 'auto'
    };
  }

  private screenDraftFromRecord(screen: DynamicScreenRecord): ScreenDraft {
    return this.screenDraftFromDefinition({
      ...screen.definition,
      key: screen.key,
      title: screen.title,
      route: screen.route,
      target: screen.target,
      category: screen.category,
      description: screen.description
    });
  }

  private screenDraftFromDefinition(definition: Record<string, unknown>): ScreenDraft {
    const components = Array.isArray(definition['components'])
      ? (definition['components'] as Array<Record<string, unknown>>).map((component, index) => {
          const inputs = this.objectValue(component['inputs']);
          const bindings = this.objectValue(component['bindings']);
          const layout = this.objectValue(component['layout']);
          const actions = Array.isArray(component['actions']) ? (component['actions'] as Array<Record<string, unknown>>) : [];
          const firstAction = actions[0] ?? {};
          const inferredBindingType = this.componentBindingTypeValue(
            bindings?.['type'] ||
              (inputs?.['formKey'] ? 'form' : inputs?.['serviceKey'] ? 'service' : inputs?.['flowKey'] ? 'flow' : inputs?.['table'] ? 'table' : inputs?.['sourceKey'] ? 'source' : 'none')
          );
          const inferredActionType = this.componentActionTypeValue(firstAction['type']);
          return {
            id: this.stringValue(component['id']) || `component_${index + 1}`,
            componentKey: this.stringValue(component['componentKey']) || 'entity_card',
            title: this.stringValue(component['title']) || this.componentLabel(this.stringValue(component['componentKey'])),
            region: this.stringValue(component['region']) || 'content',
            bindingType: inferredBindingType,
            bindingKey:
              this.stringValue(inputs?.['formKey']) ||
              this.stringValue(inputs?.['serviceKey']) ||
              this.stringValue(inputs?.['flowKey']) ||
              this.stringValue(inputs?.['table']) ||
              this.stringValue(inputs?.['sourceKey']),
            width: this.componentWidthValue(layout?.['desktop']),
            align: this.componentAlignValue(layout?.['align']),
            chrome: this.componentChromeValue(layout?.['chrome']),
            actionType: inferredActionType,
            actionTarget:
              this.stringValue(firstAction['route']) ||
              this.stringValue(firstAction['serviceKey']) ||
              this.stringValue(firstAction['flowKey']) ||
              this.stringValue(firstAction['modalKey']) ||
              this.stringValue(firstAction['event']) ||
              this.stringValue(firstAction['target'])
          };
        })
      : [];
    const layout = this.objectValue(definition['layout']);
    const navigation = this.objectValue(definition['navigation']);
    const navigationPermissions = Array.isArray(navigation?.['permissions']) ? (navigation?.['permissions'] as unknown[]) : [];
    return {
      key: this.stringValue(definition['key']) || 'inicio',
      title: this.stringValue(definition['title']) || 'Inicio',
      description: this.stringValue(definition['description']) || '',
      route: this.stringValue(definition['route']) || '/inicio',
      target: this.screenTargetValue(definition['target']),
      category: this.stringValue(definition['category']) || 'principal',
      layoutMode: this.layoutModeValue(layout?.['mode']),
      navigationLabel: this.stringValue(navigation?.['label']) || this.stringValue(definition['title']) || 'Inicio',
      navigationGroup: this.stringValue(navigation?.['group']) || 'principal',
      navigationIcon: this.stringValue(navigation?.['icon']) || 'home',
      navigationVisibility: navigation?.['showInMenu'] === false ? 'hidden' : 'visible',
      navigationPermission: this.stringValue(navigationPermissions[0] ?? navigation?.['permission']),
      componentKey: 'hero_header',
      componentTitle: '',
      componentRegion: 'content',
      componentBindingType: 'none',
      componentBindingKey: '',
      componentWidth: 'auto',
      componentAlign: 'stretch',
      componentChrome: 'card',
      componentActionType: 'none',
      componentActionTarget: '',
      components
    };
  }

  private appManifestFromDraft(): Record<string, unknown> {
    const draft = this.appDraft();
    return {
      schemaVersion: 1,
      kind: 'dynamic_app',
      key: this.normalizeKey(draft.key),
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category.trim(),
      targets: this.targetsFromMode(draft.targetsMode),
      presentation: {
        kit: draft.kit,
        theme: draft.theme,
        themeMode: 'system',
        density: 'comfortable'
      },
      text: {
        namespace: `app.${this.normalizeKey(draft.key)}`,
        defaultLocale: draft.defaultLocale,
        bundledLocales: [draft.defaultLocale]
      },
      navigation: {
        mode: 'screen_routes',
        startRoute: this.screenDraft().route || '/inicio'
      },
      permissions: [],
      screens: this.screens().map((screen) => ({
        key: screen.key,
        route: screen.route,
        target: screen.target,
        version: screen.version,
        published: screen.published
      })),
      settings: {},
      metadata: {
        designer: 'screen_app_designer_v1'
      }
    };
  }

  private screenDefinitionFromDraft(): Record<string, unknown> {
    const draft = this.screenDraft();
    const app = this.selectedApp();
    return {
      schemaVersion: 1,
      kind: 'dynamic_screen',
      appKey: app?.key ?? this.normalizeKey(this.appDraft().key),
      key: this.normalizeKey(draft.key),
      title: draft.title.trim(),
      description: draft.description.trim(),
      route: draft.route.startsWith('/') ? draft.route.trim() : `/${draft.route.trim()}`,
      target: draft.target,
      category: draft.category.trim(),
      textNamespace: `screen.${this.normalizeKey(draft.key)}`,
      navigation: {
        showInMenu: draft.navigationVisibility === 'visible',
        label: draft.navigationLabel.trim() || draft.title.trim(),
        group: draft.navigationGroup.trim() || 'principal',
        icon: draft.navigationIcon || 'home',
        permissions: draft.navigationPermission.trim() ? [draft.navigationPermission.trim()] : []
      },
      layout: {
        strategy: 'responsive_regions',
        mode: draft.layoutMode,
        regions: ['header', 'content', 'actions', 'aside'],
        desktop: { columns: draft.layoutMode === 'dashboard' ? 2 : 1 },
        tablet: { columns: 1 },
        mobile: { columns: 1, navigation: 'bottom_actions' }
      },
      regions: [
        { key: 'header', label: 'Header' },
        { key: 'content', label: 'Content' },
        { key: 'actions', label: 'Actions' },
        { key: 'aside', label: 'Aside' }
      ],
      components: draft.components.map((component, index) => ({
        id: component.id,
        componentKey: component.componentKey,
        title: component.title,
        region: component.region,
        order: index + 1,
        inputs: this.componentInputs(component),
        bindings: this.componentBindings(component),
        actions: this.componentActions(component),
        visibility: {},
        layout: {
          desktop: component.region === 'header' ? 'full' : component.width,
          tablet: 'full',
          mobile: 'full',
          align: component.align,
          chrome: component.chrome
        }
      })),
      dataSources: [],
      actions: [],
      permissions: [],
      presentation: {
        kit: this.appDraft().kit,
        theme: this.appDraft().theme,
        themeMode: 'system'
      },
      tests: [
        {
          name: 'Preview basico',
          viewport: 'desktop',
          input: {}
        }
      ],
      metadata: {
        designer: 'screen_app_designer_v1'
      }
    };
  }

  private componentInputs(component: ScreenComponentDraft) {
    const binding = component.bindingKey.trim();
    if (!binding) {
      return {};
    }
    if (component.bindingType === 'form') {
      return { formKey: binding };
    }
    if (component.bindingType === 'service') {
      return { serviceKey: binding };
    }
    if (component.bindingType === 'flow') {
      return { flowKey: binding };
    }
    if (component.bindingType === 'table') {
      return { table: binding };
    }
    if (component.bindingType === 'none') {
      return {};
    }
    return { sourceKey: binding };
  }

  private componentBindings(component: ScreenComponentDraft) {
    if (component.bindingType === 'none' || !component.bindingKey.trim()) {
      return {};
    }
    return {
      mode: 'contract_input',
      type: component.bindingType,
      key: component.bindingKey.trim()
    };
  }

  private componentActions(component: ScreenComponentDraft) {
    if (component.actionType === 'none') {
      return [];
    }
    const target = component.actionTarget.trim();
    const action: Record<string, unknown> = {
      event: 'primary',
      type: component.actionType
    };
    if (component.actionType === 'navigate') {
      action['route'] = target || component.bindingKey.trim();
    } else if (component.actionType === 'execute_service') {
      action['serviceKey'] = target || component.bindingKey.trim();
    } else if (component.actionType === 'execute_flow') {
      action['flowKey'] = target || component.bindingKey.trim();
    } else if (component.actionType === 'open_modal') {
      action['modalKey'] = target || component.bindingKey.trim();
    } else if (component.actionType === 'submit_form') {
      action['formKey'] = target || component.bindingKey.trim();
    } else if (component.actionType === 'emit_event') {
      action['eventName'] = target || `${component.componentKey}.selected`;
    }
    return [action];
  }

  private syncAppJson() {
    this.appJsonText.set(JSON.stringify(this.appManifestFromDraft(), null, 2));
  }

  private syncScreenJson() {
    this.screenJsonText.set(JSON.stringify(this.screenDefinitionFromDraft(), null, 2));
  }

  syncPackageJson() {
    this.packageJsonText.set(JSON.stringify(this.packageFromDraft(), null, 2));
  }

  private packageFromDraft(): DynamicAppPackage {
    const manifest = this.appManifestFromDraft();
    const selectedScreenDefinition = this.screenDefinitionFromDraft();
    const screens = this.screens().map((screen) => {
      const isSelected = screen.id === this.selectedScreenId();
      const definition = isSelected ? selectedScreenDefinition : screen.definition;
      return {
        key: screen.key,
        version: screen.version,
        status: screen.status,
        published: screen.published,
        definition
      };
    });

    if (!screens.length || !screens.some((screen) => screen.key === selectedScreenDefinition['key'])) {
      screens.push({
        key: this.stringValue(selectedScreenDefinition['key']),
        version: 1,
        status: 'draft',
        published: false,
        definition: selectedScreenDefinition
      });
    }

    return {
      schemaVersion: 1,
      kind: 'chicle_app_package',
      packageKey: this.stringValue(manifest['key']),
      name: this.stringValue(manifest['name']),
      description: this.stringValue(manifest['description']),
      exportedAt: new Date().toISOString(),
      app: {
        key: this.stringValue(manifest['key']),
        version: this.selectedApp()?.version ?? 1,
        status: this.selectedApp()?.status ?? 'draft',
        published: this.selectedApp()?.published ?? false,
        manifest
      },
      screens,
      dependencies: this.packageDependencies(manifest, screens.map((screen) => screen.definition)),
      install: {
        mode: 'upsert',
        conflictStrategy: 'active_keys_block',
        publishOnInstall: false
      }
    };
  }

  private applyPackageToGuide(appPackage: DynamicAppPackage) {
    const manifest = appPackage.app?.manifest ?? {};
    this.appDraft.set(this.appDraftFromManifest(manifest));
    const firstScreen = appPackage.screens?.[0]?.definition;
    if (firstScreen) {
      this.screenDraft.set(this.screenDraftFromDefinition(firstScreen));
    }
    this.syncAppJson();
    this.syncScreenJson();
  }

  private packageDependencies(manifest: Record<string, unknown>, screens: Record<string, unknown>[]) {
    const componentKeys = new Set<string>();
    const formKeys = new Set<string>();
    const serviceKeys = new Set<string>();
    const flowKeys = new Set<string>();
    const textNamespaces = new Set<string>();
    const customTables = new Set<string>();

    const appText = this.objectValue(manifest['text']);
    const appNamespace = this.stringValue(appText?.['namespace']);
    if (appNamespace) {
      textNamespaces.add(appNamespace);
    }

    for (const screen of screens) {
      const textNamespace = this.stringValue(screen['textNamespace']);
      if (textNamespace) {
        textNamespaces.add(textNamespace);
      }
      const components = Array.isArray(screen['components']) ? (screen['components'] as Record<string, unknown>[]) : [];
      for (const component of components) {
        this.addDependency(componentKeys, component['componentKey']);
        const inputs = this.objectValue(component['inputs']) ?? {};
        this.addDependency(formKeys, inputs['formKey']);
        this.addDependency(serviceKeys, inputs['serviceKey']);
        this.addDependency(flowKeys, inputs['flowKey']);
        this.addDependency(customTables, inputs['table']);
        this.addDependency(customTables, inputs['tableName']);
      }
      const dataSources = Array.isArray(screen['dataSources']) ? (screen['dataSources'] as Record<string, unknown>[]) : [];
      for (const dataSource of dataSources) {
        this.addDependency(formKeys, dataSource['formKey']);
        this.addDependency(serviceKeys, dataSource['serviceKey']);
        this.addDependency(flowKeys, dataSource['flowKey']);
        this.addDependency(customTables, dataSource['table']);
      }
    }

    return {
      componentKeys: Array.from(componentKeys).sort(),
      formKeys: Array.from(formKeys).sort(),
      serviceKeys: Array.from(serviceKeys).sort(),
      flowKeys: Array.from(flowKeys).sort(),
      textNamespaces: Array.from(textNamespaces).sort(),
      customTables: Array.from(customTables).sort()
    };
  }

  private addDependency(target: Set<string>, value: unknown) {
    const item = this.stringValue(value).trim();
    if (item) {
      target.add(item);
    }
  }

  private catalogOptions() {
    const items = this.catalog();
    const source = items.length
      ? items
      : [
          { key: 'hero_header', name: 'Header' },
          { key: 'nav_menu', name: 'Menú de navegación' },
          { key: 'auth_login', name: 'Login estándar' },
          { key: 'data_table', name: 'Data table' },
          { key: 'form_runtime', name: 'Dynamic form' },
          { key: 'service_button', name: 'Service button' },
          { key: 'flow_button', name: 'Flow button' },
          { key: 'entity_card', name: 'Entity card' }
        ];
    return source.map((item) => ({ label: item.name, value: item.key }));
  }

  appDraftReady() {
    const draft = this.appDraft();
    return Boolean(this.normalizeKey(draft.key) && draft.name.trim());
  }

  screenDraftReady() {
    const draft = this.screenDraft();
    return Boolean(this.normalizeKey(draft.key) && draft.title.trim() && draft.route.trim());
  }

  private parseJson<T>(text: string): T | null {
    const error = this.parseJsonError(text);
    if (error) {
      this.error.set(error);
      return null;
    }
    return JSON.parse(text) as T;
  }

  private parseJsonError(text: string) {
    try {
      JSON.parse(text);
      return '';
    } catch (error) {
      return error instanceof Error ? error.message : 'JSON inválido';
    }
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
  }

  private objectValue(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }

  private normalizeKey(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120);
  }

  private targetsFromMode(mode: AppTargetsMode) {
    return {
      web_mobile: ['web', 'mobile'],
      web_mobile_desktop: ['web', 'mobile', 'desktop'],
      admin: ['admin'],
      all: ['admin', 'web', 'mobile', 'desktop']
    }[mode];
  }

  private targetsModeFromTargets(targets: string[]): AppTargetsMode {
    const unique = new Set(targets);
    if (unique.has('admin') && unique.size === 1) return 'admin';
    if (unique.has('admin') && unique.has('web') && unique.has('mobile') && unique.has('desktop')) return 'all';
    if (unique.has('desktop')) return 'web_mobile_desktop';
    return 'web_mobile';
  }

  private screenTargetValue(value: unknown): ScreenTarget {
    return value === 'admin' || value === 'web' || value === 'mobile' || value === 'desktop' || value === 'multi'
      ? value
      : 'multi';
  }

  private layoutModeValue(value: unknown): ScreenDraft['layoutMode'] {
    return value === 'dashboard' || value === 'form_page' || value === 'detail_page' || value === 'list_page'
      ? value
      : 'dashboard';
  }

  private componentBindingPlaceholder() {
    const type = this.screenDraft().componentBindingType;
    return {
      none: 'Sin key requerida',
      form: 'form_users, form_inspeccion',
      service: 'listar_clientes, crear_ticket',
      flow: 'aprobar_solicitud, validar_pago',
      table: 'custom_clientes',
      source: 'mi_app, usuario_actual'
    }[type] ?? 'form_users, listar_clientes, flow_aprobar';
  }

  private componentDefaults(componentKey: string): {
    bindingType: ScreenComponentBindingType;
    actionType: ScreenComponentActionType;
    chrome: ScreenComponentChrome;
    width: ScreenComponentWidth;
    region: string;
  } {
    const defaults: Record<string, {
      bindingType: ScreenComponentBindingType;
      actionType: ScreenComponentActionType;
      chrome: ScreenComponentChrome;
      width: ScreenComponentWidth;
      region: string;
    }> = {
      hero_header: { bindingType: 'source', actionType: 'none', chrome: 'card', width: 'full', region: 'header' },
      nav_menu: { bindingType: 'source', actionType: 'navigate', chrome: 'toolbar', width: 'full', region: 'header' },
      side_nav: { bindingType: 'source', actionType: 'navigate', chrome: 'drawer', width: 'third', region: 'aside' },
      bottom_nav: { bindingType: 'source', actionType: 'navigate', chrome: 'toolbar', width: 'full', region: 'actions' },
      tabs: { bindingType: 'source', actionType: 'navigate', chrome: 'toolbar', width: 'full', region: 'header' },
      metric_strip: { bindingType: 'service', actionType: 'none', chrome: 'card', width: 'full', region: 'content' },
      chart_panel: { bindingType: 'service', actionType: 'none', chrome: 'card', width: 'half', region: 'content' },
      data_table: { bindingType: 'service', actionType: 'none', chrome: 'card', width: 'full', region: 'content' },
      search_panel: { bindingType: 'service', actionType: 'none', chrome: 'card', width: 'full', region: 'content' },
      form_runtime: { bindingType: 'form', actionType: 'submit_form', chrome: 'card', width: 'half', region: 'content' },
      auth_login: { bindingType: 'service', actionType: 'execute_service', chrome: 'card', width: 'half', region: 'content' },
      service_button: { bindingType: 'service', actionType: 'execute_service', chrome: 'plain', width: 'quarter', region: 'actions' },
      flow_button: { bindingType: 'flow', actionType: 'execute_flow', chrome: 'plain', width: 'quarter', region: 'actions' },
      modal_shell: { bindingType: 'source', actionType: 'open_modal', chrome: 'modal', width: 'half', region: 'content' },
      entity_card: { bindingType: 'source', actionType: 'none', chrome: 'card', width: 'half', region: 'content' },
      detail_panel: { bindingType: 'service', actionType: 'none', chrome: 'card', width: 'half', region: 'content' },
      timeline: { bindingType: 'service', actionType: 'none', chrome: 'card', width: 'half', region: 'content' },
      media_gallery: { bindingType: 'service', actionType: 'none', chrome: 'card', width: 'half', region: 'content' },
      map_view: { bindingType: 'source', actionType: 'none', chrome: 'card', width: 'half', region: 'content' }
    };
    return defaults[componentKey] ?? { bindingType: 'source', actionType: 'none', chrome: 'card', width: 'half', region: 'content' };
  }

  private componentBindingTypeValue(value: unknown): ScreenComponentBindingType {
    return value === 'form' || value === 'service' || value === 'flow' || value === 'table' || value === 'source' || value === 'none'
      ? value
      : 'none';
  }

  private componentWidthValue(value: unknown): ScreenComponentWidth {
    return value === 'full' || value === 'two_thirds' || value === 'half' || value === 'third' || value === 'quarter' || value === 'auto'
      ? value
      : 'auto';
  }

  private componentAlignValue(value: unknown): ScreenComponentAlign {
    return value === 'stretch' || value === 'start' || value === 'center' || value === 'end' ? value : 'stretch';
  }

  private componentChromeValue(value: unknown): ScreenComponentChrome {
    return value === 'plain' || value === 'card' || value === 'modal' || value === 'drawer' || value === 'toolbar'
      ? value
      : 'card';
  }

  private componentActionTypeValue(value: unknown): ScreenComponentActionType {
    return value === 'navigate' ||
      value === 'execute_service' ||
      value === 'execute_flow' ||
      value === 'open_modal' ||
      value === 'submit_form' ||
      value === 'emit_event' ||
      value === 'none'
      ? value
      : 'none';
  }

  private assistantScreenState() {
    return {
      mode: this.selectedApp() ? (this.selectedScreen() ? 'editing_screen' : 'editing_app') : 'new_app',
      app: {
        selectedKey: this.selectedApp()?.key ?? null,
        draft: this.appManifestFromDraft()
      },
      screen: {
        selectedKey: this.selectedScreen()?.key ?? null,
        draft: this.screenDefinitionFromDraft()
      },
      availableScreens: this.screens().map((screen) => ({
        key: screen.key,
        title: screen.title,
        route: screen.route,
        target: screen.target,
        published: screen.published
      })),
      componentCatalog: this.catalog().map((component) => ({
        key: component.key,
        name: component.name,
        category: component.category,
        targets: component.targets
      })),
      quickPresets: ['menu', 'login', 'form', 'table', 'service']
    };
  }

  private componentLabel(key: string) {
    return this.catalog().find((item) => item.key === key)?.name ?? key.replace(/_/g, ' ');
  }

  private workspaceTabFromPhase(phase: AppDesignerPhase): AppWorkspaceTab {
    const tabByPhase: Record<AppDesignerPhase, AppWorkspaceTab> = {
      app: 'summary',
      screen: 'screens',
      components: 'screens',
      preview: 'preview',
      json: 'publish'
    };
    return tabByPhase[phase];
  }

  private phaseFromWorkspaceTab(tab: AppWorkspaceTab): AppDesignerPhase {
    const phaseByTab: Record<AppWorkspaceTab, AppDesignerPhase> = {
      summary: 'app',
      screens: 'components',
      navigation: 'screen',
      security: 'screen',
      preview: 'preview',
      publish: 'json',
      trash: 'app'
    };
    return phaseByTab[tab];
  }

  private errorMessage(error: unknown, fallback: string) {
    if (error && typeof error === 'object' && 'error' in error) {
      const response = (error as { error?: { message?: unknown } }).error;
      if (typeof response?.message === 'string') {
        return response.message;
      }
      if (Array.isArray(response?.message)) {
        return response.message.join(', ');
      }
    }
    return error instanceof Error ? error.message : fallback;
  }
}
