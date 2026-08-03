import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../../core/api/api-client.service';
import { AdminCardGridComponent } from '../../shared/admin-card-grid/admin-card-grid.component';
import { RuntimeField } from '../../engine/forms/form-runtime.service';
import { AdminFormGridComponent } from '../../shared/admin-form-grid/admin-form-grid.component';
import { AdminMetricCardComponent } from '../../shared/admin-metric-card/admin-metric-card.component';
import { AdminPanelComponent } from '../../shared/admin-panel/admin-panel.component';
import { AppStructurePanelComponent } from '../../shared/app-structure-panel/app-structure-panel.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { ComponentPaletteComponent, ComponentPaletteItem } from '../../shared/component-palette/component-palette.component';
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
import { ScreenComponentInspectorComponent } from '../../shared/screen-component-inspector/screen-component-inspector.component';
import { ScreenVisualCanvasComponent } from '../../shared/screen-visual-canvas/screen-visual-canvas.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { VisualWorkbenchPanelComponent } from '../../shared/visual-workbench-panel/visual-workbench-panel.component';
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
type ScreenComponentPreset =
  | 'menu'
  | 'login'
  | 'form'
  | 'table'
  | 'service'
  | 'flow'
  | 'dashboard'
  | 'crud'
  | 'gallery'
  | 'modal'
  | 'profile'
  | 'map'
  | 'timeline'
  | 'side_menu'
  | 'bottom_menu'
  | 'tabs_nav';
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

interface DynamicAppPackageDryRunResponse {
  kind: 'chicle_app_package_dry_run';
  app: Record<string, unknown>;
  screens: Array<Record<string, unknown>>;
  dependencies: Record<string, unknown>;
  installPlan: Record<string, unknown>;
}

interface DynamicAppRuntimeRouteResponse {
  schemaVersion: number;
  kind: 'dynamic_app_runtime_route';
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  app: {
    key: string;
    name: string;
    version: number;
    manifest: Record<string, unknown>;
  };
  target: ScreenTarget;
  route: string;
  requestedRoute: string;
  navigation: Array<{
    key: string;
    label: string;
    route: string;
    target: ScreenTarget;
    group: string;
    icon: string;
    permissions: string[];
    active: boolean;
  }>;
  screen: {
    key: string;
    title: string;
    route: string;
    target: ScreenTarget;
    version: number;
    definition: Record<string, unknown>;
    permissions: string[];
  };
  screens: Array<{
    key: string;
    title: string;
    route: string;
    target: ScreenTarget;
    version: number;
  }>;
  cache: {
    key: string;
    appVersion: number;
    screenVersion: number;
    generatedAt: string;
  };
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
  permission: string;
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
  componentPermission: string;
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
    AppStructurePanelComponent,
    CatalogItemComponent,
    ComponentPaletteComponent,
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
    ScreenComponentInspectorComponent,
    ScreenVisualCanvasComponent,
    StatusNoticeComponent,
    UiKitButtonComponent,
    VisualWorkbenchPanelComponent,
    WorkflowGuideComponent
  ],
  styles: [
    `
      .shell {
        display: grid;
        gap: 14px;
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
        gap: 12px;
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

      app-designer-workspace.app-studio-workspace {
        grid-template-columns: minmax(210px, 250px) minmax(0, 1fr);
      }

      .workbench-launch {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 14px;
      }

      .workbench-launch-copy {
        display: grid;
        gap: 5px;
        min-width: 0;
      }

      .workbench-launch-copy strong,
      .workbench-launch-copy span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .workbench-launch-copy strong {
        color: var(--ch-color-text);
        font-size: 1rem;
      }

      .workbench-launch-copy span {
        color: var(--ch-color-muted);
        font-size: 0.86rem;
        line-height: 1.42;
      }

      .workbench-launch-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }

      .workbench-launch-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .workbench-designer-body {
        display: grid;
        gap: 12px;
        min-width: 0;
      }

      .studio-help-strip {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        border: 1px solid var(--ch-color-border);
        border-left: 3px solid var(--ch-color-primary);
        border-radius: var(--ch-radius);
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        padding: 10px 12px;
      }

      .studio-help-step {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 28px;
        border: 1px solid color-mix(in srgb, var(--ch-color-primary-border) 70%, transparent);
        border-radius: 999px;
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
        padding: 4px 10px;
        font-size: 0.78rem;
        font-weight: 800;
      }

      .studio-help-step b {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 19px;
        height: 19px;
        border-radius: 999px;
        background: var(--ch-color-primary);
        color: var(--ch-color-on-primary);
        font-size: 0.68rem;
      }

      .screen-builder {
        display: grid;
        grid-template-columns: minmax(250px, 310px) minmax(520px, 1fr) minmax(280px, 360px);
        gap: 14px;
        align-items: start;
        min-width: 0;
      }

      .builder-left,
      .builder-center,
      .builder-right {
        display: grid;
        gap: 10px;
        min-width: 0;
      }

      .builder-left,
      .builder-right {
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 10px;
      }

      .builder-left {
        grid-template-columns: minmax(0, 1fr);
        align-items: start;
        max-height: calc(100dvh - 182px);
        overflow: auto;
      }

      .builder-center {
        align-content: start;
      }

      .builder-right {
        grid-template-columns: minmax(0, 1fr);
        align-items: start;
        max-height: calc(100dvh - 182px);
        overflow: auto;
      }

      .canvas-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        min-width: 0;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface);
        padding: 10px 12px;
      }

      .canvas-toolbar-copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .canvas-toolbar-copy strong,
      .canvas-toolbar-copy span {
        display: block;
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .canvas-toolbar-copy strong {
        color: var(--ch-color-text);
        font-size: 0.94rem;
      }

      .canvas-toolbar-copy span {
        color: var(--ch-color-muted);
        font-size: 0.78rem;
        line-height: 1.35;
      }

      .inspector-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .package-hint {
        display: grid;
        gap: 8px;
        border: 1px dashed var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .runtime-json {
        max-height: 360px;
        overflow: auto;
        border: 1px solid var(--ch-color-border);
        border-radius: var(--ch-radius);
        background: var(--ch-color-code-bg, #102033);
        color: var(--ch-color-code-text, #e8f2ff);
        padding: 14px;
        font-size: 0.78rem;
        line-height: 1.45;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .package-dry-run {
        display: grid;
        gap: 8px;
      }

      @media (max-width: 760px) {
        app-designer-workspace.app-studio-workspace {
          grid-template-columns: 1fr;
        }

        .inline-actions {
          justify-content: stretch;
        }

        .inline-actions app-ui-kit-button,
        .catalog-actions app-ui-kit-button,
        .package-actions app-ui-kit-button {
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

        .builder-left,
        .builder-right,
        .screen-builder,
        .workbench-launch {
          grid-template-columns: 1fr;
        }

        .builder-left,
        .builder-right {
          max-height: none;
        }

        .canvas-toolbar {
          align-items: stretch;
          flex-direction: column;
        }
      }

      @media (min-width: 761px) and (max-width: 1180px) {
        app-designer-workspace.app-studio-workspace {
          grid-template-columns: minmax(180px, 220px) minmax(0, 1fr);
        }

        .builder-left,
        .builder-right,
        .screen-builder {
          grid-template-columns: 1fr;
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

        <app-designer-workspace class="app-studio-workspace">
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
                description="Diseña la pantalla con una paleta de bloques, preview editable y propiedades del componente seleccionado."
                eyebrow="Canvas visual"
              >
                <div panel-actions class="inline-actions">
                  <app-ui-kit-button
                    [label]="selectedApp() ? 'Abrir canvas' : 'Abrir borrador visual'"
                    icon="pi pi-window-maximize"
                    (pressed)="visualWorkbenchOpen.set(true)"
                  ></app-ui-kit-button>
                </div>

                <div class="workbench-launch">
                  <div class="workbench-launch-copy">
                    <strong>Canvas visual administrable</strong>
                    <span>
                      Abre una mesa de trabajo superpuesta para organizar regiones, bloques, bindings,
                      acciones, permisos y preview sin romper la navegación estándar del Admin.
                    </span>
                    <div class="workbench-launch-meta">
                      <span class="chip">{{ screenDraft().components.length }} bloques</span>
                      <span class="chip">{{ viewport() }}</span>
                      <span class="chip">{{ screenDraft().route || '/inicio' }}</span>
                      @if (!selectedApp()) {
                        <span class="chip">borrador local</span>
                      }
                    </div>
                  </div>
                  <div class="workbench-launch-actions">
                    <app-ui-kit-button
                      [label]="selectedApp() ? 'Abrir mesa de trabajo' : 'Abrir borrador visual'"
                      icon="pi pi-window-maximize"
                      (pressed)="visualWorkbenchOpen.set(true)"
                    ></app-ui-kit-button>
                  </div>
                </div>

                <app-visual-workbench-panel
                  [open]="visualWorkbenchOpen()"
                  eyebrow="App Studio"
                  title="Canvas visual de pantalla"
                  [description]="(screenDraft().title || 'Pantalla sin título') + ' · ' + (screenDraft().route || '/inicio')"
                  (closed)="visualWorkbenchOpen.set(false)"
                >
                  <div workbench-actions class="inline-actions">
                    <app-ui-kit-button
                      label="Guardar pantalla"
                      icon="pi pi-save"
                      tone="secondary"
                      variant="outline"
                      size="small"
                      [disabled]="saving() || !selectedApp() || !screenDraftReady()"
                      (pressed)="saveScreen(false)"
                    ></app-ui-kit-button>
                    <app-ui-kit-button
                      label="Publicar pantalla"
                      icon="pi pi-upload"
                      size="small"
                      [disabled]="saving() || !selectedApp()"
                      (pressed)="saveScreen(true)"
                    ></app-ui-kit-button>
                  </div>

                  <div class="workbench-designer-body">
                    @if (!selectedApp()) {
                      <app-status-notice tone="warning" title="Borrador visual local">
                        <span>
                          Puedes abrir el canvas y diseñar la pantalla. Para guardar o publicar,
                          primero guarda la app en el paso App.
                        </span>
                      </app-status-notice>
                    }

                    <div class="studio-help-strip" aria-label="Flujo recomendado del diseñador">
                      <span class="studio-help-step"><b>1</b>Elige página</span>
                      <span class="studio-help-step"><b>2</b>Arrastra bloque</span>
                      <span class="studio-help-step"><b>3</b>Configura datos y acción</span>
                      <span class="studio-help-step"><b>4</b>Prueba y publica</span>
                    </div>

                    <div class="screen-builder">
                      <aside class="builder-left" aria-label="Estructura y bloques">
                        <app-app-structure-panel
                          [appName]="appDraft().name"
                          [summary]="screens().length + ' páginas · ' + appDraft().targetsMode"
                          [screens]="screens()"
                          [selectedScreenId]="selectedScreenId()"
                          (screenSelected)="selectScreenById($event)"
                          (newScreen)="newScreen()"
                        ></app-app-structure-panel>

                        <app-component-palette
                          title="Bloques disponibles"
                          description="Agrega navegación, login, formularios, tablas, acciones y vistas de negocio."
                          [items]="componentPaletteItems"
                          (selected)="addPresetFromPalette($event)"
                        ></app-component-palette>
                      </aside>

                      <main class="builder-center" aria-label="Preview editable">
                        <div class="canvas-toolbar">
                          <div class="canvas-toolbar-copy">
                            <strong>Preview editable</strong>
                            <span>Arrastra bloques, selecciona uno y ajusta su comportamiento en el inspector.</span>
                          </div>
                          <app-segmented-control
                            [items]="previewModeItems"
                            [value]="viewport()"
                            ariaLabel="Modo de preview"
                            (valueChange)="setViewport($event)"
                          ></app-segmented-control>
                        </div>

                        <app-screen-visual-canvas
                          [appName]="appDraft().name"
                          [targetLabel]="previewRuntimeSummary()"
                          [route]="screenDraft().route"
                          [screenTitle]="screenDraft().title"
                          [screenDescription]="screenDraft().description"
                          [viewport]="viewport()"
                          [components]="screenDraft().components"
                          [selectedId]="selectedComponentId()"
                          [navigationItems]="previewNavigationItems()"
                          (selected)="selectComponentForEdit($event)"
                          (moved)="moveComponent($event.id, $event.direction)"
                          (regionDropped)="addPresetToRegion($event.key, $event.region)"
                        ></app-screen-visual-canvas>
                      </main>

                      <aside class="builder-right" aria-label="Propiedades del componente">
                        <app-screen-component-inspector
                          [component]="selectedComponent()"
                          [summary]="selectedComponentSummary()"
                        ></app-screen-component-inspector>

                        <div class="inspector-actions">
                          <app-ui-kit-button
                            [label]="selectedComponent() ? 'Duplicar' : 'Agregar configurado'"
                            icon="pi pi-copy"
                            tone="secondary"
                            variant="outline"
                            size="small"
                            [disabled]="saving()"
                            (pressed)="selectedComponent() ? duplicateSelectedComponent() : addComponent()"
                          ></app-ui-kit-button>
                          @if (selectedComponent()) {
                            <app-ui-kit-button
                              label="Quitar"
                              icon="pi pi-times"
                              tone="danger"
                              variant="outline"
                              size="small"
                              [disabled]="saving()"
                              (pressed)="removeSelectedComponent()"
                            ></app-ui-kit-button>
                            <app-ui-kit-button
                              label="Cerrar"
                              icon="pi pi-check"
                              tone="secondary"
                              variant="ghost"
                              size="small"
                              [disabled]="saving()"
                              (pressed)="clearComponentSelection()"
                            ></app-ui-kit-button>
                          }
                        </div>

                        <app-admin-form-grid minColumnWidth="180px">
                          @for (field of componentFields(); track field.name) {
                            <app-dynamic-field-control
                              [field]="field"
                              [value]="componentFieldValue(field.name)"
                              (valueChange)="setComponentField(field.name, $event)"
                            ></app-dynamic-field-control>
                          }
                        </app-admin-form-grid>
                      </aside>
                    </div>
                  </div>
                </app-visual-workbench-panel>
              </app-admin-panel>
              }

              @if (workspaceTab() === 'preview') {
              <app-admin-panel
                title="4. Preview"
                description="Valida la estructura en escritorio, tablet y móvil antes de publicar."
                eyebrow="Runtime visual"
              >
                <div panel-actions class="inline-actions">
                  <app-ui-kit-button
                    label="Probar runtime publicado"
                    icon="pi pi-play"
                    tone="secondary"
                    variant="outline"
                    [disabled]="runtimeTesting() || !selectedApp()?.published"
                    (pressed)="testRuntimeRoute()"
                  ></app-ui-kit-button>
                  <app-ui-kit-button
                    label="Abrir runtime"
                    icon="pi pi-external-link"
                    tone="secondary"
                    variant="outline"
                    [disabled]="!selectedApp()?.published"
                    (pressed)="openPublishedRuntime()"
                  ></app-ui-kit-button>
                </div>

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
                                    @if (component.permission) {
                                      <span>permiso: {{ component.permission }}</span>
                                    }
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

                @if (runtimeRouteJson()) {
                  <app-status-notice tone="success" title="Runtime publicado disponible">
                    <span>Este es el contrato que consumiría una app generada para la ruta y target actuales.</span>
                  </app-status-notice>
                  <pre class="runtime-json">{{ runtimeRouteJson() }}</pre>
                }
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
                        label="Previsualizar instalación"
                        icon="pi pi-search"
                        tone="secondary"
                        variant="outline"
                        size="small"
                        [disabled]="saving() || jsonError().length > 0"
                        (pressed)="dryRunInstallPackage()"
                      ></app-ui-kit-button>
                      <app-ui-kit-button
                        label="Instalar paquete"
                        icon="pi pi-box"
                        size="small"
                        [disabled]="saving() || jsonError().length > 0"
                        (pressed)="installPackage(false)"
                      ></app-ui-kit-button>
                    </div>
                    @if (packageDryRunJson()) {
                      <div class="package-dry-run">
                        <strong>Plan de instalación</strong>
                        <pre class="runtime-json">{{ packageDryRunJson() }}</pre>
                      </div>
                    }
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
  private readonly router = inject(Router);
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
  readonly runtimeTesting = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly visualWorkbenchOpen = signal(false);

  readonly appDraft = signal<AppDraft>(this.defaultAppDraft());
  readonly screenDraft = signal<ScreenDraft>(this.defaultScreenDraft());
  readonly selectedComponentId = signal<string | null>(null);
  readonly appJsonText = signal('');
  readonly screenJsonText = signal('');
  readonly packageJsonText = signal('');
  readonly packageDryRunJson = signal('');
  readonly runtimeRouteJson = signal('');

  readonly selectedApp = computed(() => this.apps().find((item) => item.id === this.selectedAppId()) ?? null);
  readonly selectedScreen = computed(() => this.screens().find((item) => item.id === this.selectedScreenId()) ?? null);
  readonly selectedComponent = computed(
    () => this.screenDraft().components.find((component) => component.id === this.selectedComponentId()) ?? null
  );
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

  private readonly screenComponentPresetKeys: readonly ScreenComponentPreset[] = [
    'menu',
    'side_menu',
    'bottom_menu',
    'tabs_nav',
    'login',
    'form',
    'table',
    'service',
    'flow',
    'dashboard',
    'crud',
    'gallery',
    'modal',
    'profile',
    'map',
    'timeline'
  ];

  readonly previewModeItems: SegmentedControlItem[] = [
    { key: 'desktop', label: 'Escritorio', icon: 'pi pi-desktop' },
    { key: 'tablet', label: 'Tablet', icon: 'pi pi-tablet' },
    { key: 'mobile', label: 'Móvil', icon: 'pi pi-mobile' }
  ];

  readonly componentPaletteItems: ComponentPaletteItem[] = [
    {
      key: 'menu',
      label: 'Menú principal',
      description: 'Navegación superior conectada a las rutas visibles de la app.',
      icon: 'pi pi-bars',
      group: 'Navegación'
    },
    {
      key: 'side_menu',
      label: 'Menú lateral',
      description: 'Panel lateral para apps web o desktop con muchas secciones.',
      icon: 'pi pi-list',
      group: 'Navegación'
    },
    {
      key: 'bottom_menu',
      label: 'Menú móvil',
      description: 'Navegación inferior pensada para experiencia Ionic móvil.',
      icon: 'pi pi-mobile',
      group: 'Navegación'
    },
    {
      key: 'tabs_nav',
      label: 'Tabs',
      description: 'Agrupa vistas relacionadas dentro de una misma pantalla.',
      icon: 'pi pi-clone',
      group: 'Navegación'
    },
    {
      key: 'login',
      label: 'Login estándar',
      description: 'Formulario de ingreso conectado a Auth y preparado para permisos.',
      icon: 'pi pi-lock',
      group: 'Seguridad'
    },
    {
      key: 'form',
      label: 'Formulario dinámico',
      description: 'Renderiza un Dynamic Form publicado y permite enviar datos.',
      icon: 'pi pi-file-edit',
      group: 'Datos'
    },
    {
      key: 'table',
      label: 'Tabla/listado',
      description: 'Lista registros desde un servicio dinámico o tabla controlada.',
      icon: 'pi pi-table',
      group: 'Datos'
    },
    {
      key: 'crud',
      label: 'CRUD',
      description: 'Listado principal con acción de detalle o edición.',
      icon: 'pi pi-pencil',
      group: 'Datos'
    },
    {
      key: 'service',
      label: 'Botón servicio',
      description: 'Dispara un Dynamic Service publicado desde la pantalla.',
      icon: 'pi pi-bolt',
      group: 'Acción'
    },
    {
      key: 'flow',
      label: 'Botón flow',
      description: 'Ejecuta un proceso declarativo y espera su respuesta.',
      icon: 'pi pi-sitemap',
      group: 'Acción'
    },
    {
      key: 'dashboard',
      label: 'Resumen',
      description: 'Métricas o indicadores conectados a una fuente de datos.',
      icon: 'pi pi-chart-bar',
      group: 'Visual'
    },
    {
      key: 'gallery',
      label: 'Galería',
      description: 'Imágenes, evidencias o archivos asociados a registros.',
      icon: 'pi pi-images',
      group: 'Visual'
    },
    {
      key: 'map',
      label: 'Mapa',
      description: 'Ubicación, GPS o puntos de operación.',
      icon: 'pi pi-map-marker',
      group: 'Visual'
    },
    {
      key: 'timeline',
      label: 'Timeline',
      description: 'Historial de eventos, auditoría o actividad.',
      icon: 'pi pi-clock',
      group: 'Visual'
    },
    {
      key: 'modal',
      label: 'Modal',
      description: 'Contenedor reutilizable para detalle, formulario o confirmación.',
      icon: 'pi pi-window-maximize',
      group: 'Composición'
    },
    {
      key: 'profile',
      label: 'Perfil/card',
      description: 'Card de entidad, usuario, cliente o registro principal.',
      icon: 'pi pi-id-card',
      group: 'Composición'
    }
  ];

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
    this.runtimeRouteJson.set('');
    this.selectedComponentId.set(null);
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
    this.runtimeRouteJson.set('');
    this.selectedComponentId.set(null);
    this.selectedScreenId.set(screen.id);
    this.screenDraft.set(this.screenDraftFromRecord(screen));
    this.syncScreenJson();
    this.syncPackageJson();
  }

  selectScreenById(id: string) {
    const screen = this.screens().find((item) => item.id === id);
    if (screen) {
      this.selectScreen(screen);
    }
  }

  newApp() {
    this.runtimeRouteJson.set('');
    this.selectedComponentId.set(null);
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
    this.runtimeRouteJson.set('');
    this.selectedComponentId.set(null);
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

  setViewport(value: string) {
    if (value === 'desktop' || value === 'tablet' || value === 'mobile') {
      this.viewport.set(value);
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
      },
      {
        name: 'componentPermission',
        label: 'Permiso requerido',
        type: 'text',
        placeholder: 'clientes.read, tickets.manage'
      }
    ] satisfies RuntimeField[];
  }

  componentFieldValue(name: string) {
    const selected = this.selectedComponent();
    const selectedKey = this.componentDraftKeyFromField(name);
    if (selected && selectedKey) {
      return selected[selectedKey] ?? '';
    }
    return this.screenDraft()[name as keyof ScreenDraft] ?? '';
  }

  setComponentField(name: string, value: unknown) {
    const text = this.stringValue(value);
    const selected = this.selectedComponent();
    const selectedKey = this.componentDraftKeyFromField(name);
    if (selected && selectedKey) {
      this.screenDraft.update((draft) => ({
        ...draft,
        components: draft.components.map((component) =>
          component.id === selected.id ? this.updateComponentField(component, selectedKey, text) : component
        )
      }));
      this.syncScreenJson();
      this.syncPackageJson();
      return;
    }

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

  selectComponentForEdit(id: string) {
    this.selectedComponentId.set(id);
  }

  selectedComponentSummary() {
    const selected = this.selectedComponent();
    return selected ? this.componentSummary(selected) : '';
  }

  clearComponentSelection() {
    this.selectedComponentId.set(null);
    const defaults = this.componentDefaults(this.screenDraft().componentKey || 'entity_card');
    this.screenDraft.update((draft) => ({
      ...draft,
      componentTitle: '',
      componentBindingKey: '',
      componentActionTarget: '',
      componentPermission: '',
      componentRegion: defaults.region,
      componentBindingType: defaults.bindingType,
      componentActionType: defaults.actionType,
      componentChrome: defaults.chrome,
      componentWidth: defaults.width,
      componentAlign: 'stretch'
    }));
  }

  duplicateSelectedComponent() {
    const selected = this.selectedComponent();
    if (!selected) return;
    const copy: ScreenComponentDraft = {
      ...selected,
      id: `${selected.componentKey}_${Date.now().toString(36)}`,
      title: `${selected.title} copia`
    };
    this.screenDraft.update((draft) => ({
      ...draft,
      components: [...draft.components, copy]
    }));
    this.selectedComponentId.set(copy.id);
    this.syncScreenJson();
    this.syncPackageJson();
    this.message.set('Componente duplicado. Ajusta región, ancho, binding o acción si aplica.');
  }

  removeSelectedComponent() {
    const selected = this.selectedComponent();
    if (selected) {
      this.removeComponent(selected.id);
    }
  }

  private componentDraftKeyFromField(name: string): keyof ScreenComponentDraft | null {
    const map: Record<string, keyof ScreenComponentDraft> = {
      componentKey: 'componentKey',
      componentTitle: 'title',
      componentRegion: 'region',
      componentBindingType: 'bindingType',
      componentBindingKey: 'bindingKey',
      componentWidth: 'width',
      componentAlign: 'align',
      componentChrome: 'chrome',
      componentActionType: 'actionType',
      componentActionTarget: 'actionTarget',
      componentPermission: 'permission'
    };
    return map[name] ?? null;
  }

  private updateComponentField(component: ScreenComponentDraft, key: keyof ScreenComponentDraft, value: string): ScreenComponentDraft {
    if (key === 'componentKey') {
      const defaults = this.componentDefaults(value);
      const previousLabel = this.componentLabel(component.componentKey);
      return {
        ...component,
        componentKey: value,
        title: component.title && component.title !== previousLabel ? component.title : this.componentLabel(value),
        region: defaults.region,
        bindingType: defaults.bindingType,
        width: defaults.width,
        chrome: defaults.chrome,
        actionType: defaults.actionType
      };
    }

    if (key === 'bindingType') {
      return { ...component, bindingType: this.componentBindingTypeValue(value) };
    }
    if (key === 'width') {
      return { ...component, width: this.componentWidthValue(value) };
    }
    if (key === 'align') {
      return { ...component, align: this.componentAlignValue(value) };
    }
    if (key === 'chrome') {
      return { ...component, chrome: this.componentChromeValue(value) };
    }
    if (key === 'actionType') {
      return { ...component, actionType: this.componentActionTypeValue(value) };
    }
    if (key === 'title' || key === 'region' || key === 'bindingKey' || key === 'actionTarget' || key === 'permission') {
      return { ...component, [key]: value };
    }
    return component;
  }

  addComponent() {
    const selected = this.selectedComponent();
    if (selected) {
      this.duplicateSelectedComponent();
      return;
    }

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
      actionTarget: draft.componentActionTarget.trim(),
      permission: draft.componentPermission.trim()
    };
    this.screenDraft.update((current) => ({
      ...current,
      componentTitle: '',
      componentBindingKey: '',
      componentActionTarget: '',
      components: [...current.components, component]
    }));
    this.selectedComponentId.set(component.id);
    this.syncScreenJson();
    this.syncPackageJson();
    this.message.set('Componente agregado al contrato de pantalla.');
  }

  addPresetFromPalette(preset: string) {
    if (!this.isScreenComponentPreset(preset)) {
      this.error.set(`El bloque ${preset} no está registrado como preset de pantalla.`);
      return;
    }
    this.addPresetComponent(preset);
  }

  addPresetToRegion(preset: string, region: string) {
    if (!this.isScreenComponentPreset(preset)) {
      this.error.set(`El bloque ${preset} no está registrado como preset de pantalla.`);
      return;
    }
    this.addPresetComponent(preset, region);
  }

  private isScreenComponentPreset(preset: string): preset is ScreenComponentPreset {
    return this.screenComponentPresetKeys.includes(preset as ScreenComponentPreset);
  }

  addPresetComponent(preset: ScreenComponentPreset, regionOverride?: string) {
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
      side_menu: {
        componentKey: 'side_nav',
        title: 'Menú lateral',
        region: 'aside',
        bindingType: 'source',
        bindingKey: this.appDraft().key || 'mi_app',
        width: 'third',
        align: 'stretch',
        chrome: 'drawer',
        actionType: 'navigate',
        actionTarget: this.screenDraft().route || '/inicio'
      },
      bottom_menu: {
        componentKey: 'bottom_nav',
        title: 'Menú móvil',
        region: 'actions',
        bindingType: 'source',
        bindingKey: this.appDraft().key || 'mi_app',
        width: 'full',
        align: 'stretch',
        chrome: 'toolbar',
        actionType: 'navigate',
        actionTarget: this.screenDraft().route || '/inicio'
      },
      tabs_nav: {
        componentKey: 'tabs',
        title: 'Tabs de navegación',
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
      },
      flow: {
        componentKey: 'flow_button',
        title: 'Ejecutar flow',
        region: 'actions',
        bindingType: 'flow',
        bindingKey: 'flow_publicado',
        width: 'quarter',
        align: 'start',
        chrome: 'plain',
        actionType: 'execute_flow',
        actionTarget: 'flow_publicado'
      },
      dashboard: {
        componentKey: 'metric_strip',
        title: 'Resumen ejecutivo',
        region: 'content',
        bindingType: 'service',
        bindingKey: 'metricas_app',
        width: 'full',
        align: 'stretch',
        chrome: 'card',
        actionType: 'none',
        actionTarget: ''
      },
      crud: {
        componentKey: 'data_table',
        title: 'CRUD principal',
        region: 'content',
        bindingType: 'service',
        bindingKey: 'listar_recurso',
        width: 'full',
        align: 'stretch',
        chrome: 'card',
        actionType: 'navigate',
        actionTarget: '/detalle'
      },
      gallery: {
        componentKey: 'media_gallery',
        title: 'Galería',
        region: 'content',
        bindingType: 'service',
        bindingKey: 'listar_imagenes',
        width: 'full',
        align: 'stretch',
        chrome: 'card',
        actionType: 'none',
        actionTarget: ''
      },
      modal: {
        componentKey: 'modal_shell',
        title: 'Modal de detalle',
        region: 'content',
        bindingType: 'source',
        bindingKey: 'modal_detalle',
        width: 'half',
        align: 'center',
        chrome: 'modal',
        actionType: 'open_modal',
        actionTarget: 'modal_detalle'
      },
      profile: {
        componentKey: 'entity_card',
        title: 'Perfil',
        region: 'content',
        bindingType: 'service',
        bindingKey: 'obtener_perfil',
        width: 'half',
        align: 'stretch',
        chrome: 'card',
        actionType: 'none',
        actionTarget: ''
      },
      map: {
        componentKey: 'map_view',
        title: 'Mapa',
        region: 'content',
        bindingType: 'source',
        bindingKey: 'ubicaciones',
        width: 'half',
        align: 'stretch',
        chrome: 'card',
        actionType: 'none',
        actionTarget: ''
      },
      timeline: {
        componentKey: 'timeline',
        title: 'Historial',
        region: 'content',
        bindingType: 'service',
        bindingKey: 'listar_eventos',
        width: 'half',
        align: 'stretch',
        chrome: 'card',
        actionType: 'none',
        actionTarget: ''
      }
    };
    const config = presets[preset];
    const componentKey = config.componentKey ?? 'entity_card';
    const region = this.canvasRegionValue(regionOverride ?? config.region ?? 'content');
    const component: ScreenComponentDraft = {
      id: `${componentKey}_${Date.now().toString(36)}`,
      componentKey,
      title: config.title ?? this.componentLabel(componentKey),
      region,
      bindingType: config.bindingType ?? 'none',
      bindingKey: config.bindingKey ?? '',
      width: config.width ?? 'auto',
      align: config.align ?? 'stretch',
      chrome: config.chrome ?? 'card',
      actionType: config.actionType ?? 'none',
      actionTarget: config.actionTarget ?? '',
      permission: config.permission ?? ''
    };

    this.screenDraft.update((current) => ({
      ...current,
      componentKey: component.componentKey,
      componentTitle: '',
      componentRegion: region,
      componentBindingType: component.bindingType,
      componentBindingKey: '',
      componentWidth: component.width,
      componentAlign: component.align,
      componentChrome: component.chrome,
      componentActionType: component.actionType,
      componentActionTarget: '',
      componentPermission: '',
      components: [...current.components, component]
    }));
    this.selectedComponentId.set(component.id);
    this.syncScreenJson();
    this.syncPackageJson();
    this.message.set(`${component.title} agregado al preview de la pantalla.`);
  }

  private canvasRegionValue(region: string) {
    if (['header', 'content', 'actions', 'aside'].includes(region)) {
      return region;
    }
    return 'content';
  }

  removeComponent(id: string) {
    this.screenDraft.update((draft) => ({
      ...draft,
      components: draft.components.filter((component) => component.id !== id)
    }));
    if (this.selectedComponentId() === id) {
      this.selectedComponentId.set(null);
    }
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
    this.selectedComponentId.set(null);
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
    this.selectedComponentId.set(null);
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
    if (target !== 'package') {
      this.packageDryRunJson.set('');
    }
  }

  setJsonText(value: string) {
    if (this.jsonTarget() === 'app') {
      this.appJsonText.set(value);
    } else if (this.jsonTarget() === 'screen') {
      this.screenJsonText.set(value);
    } else {
      this.packageJsonText.set(value);
      this.packageDryRunJson.set('');
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
      this.packageDryRunJson.set('');
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

  async dryRunInstallPackage() {
    const appPackage = this.parseJson<DynamicAppPackage>(this.packageJsonText());
    if (!appPackage) return;
    this.saving.set(true);
    this.error.set('');
    this.packageDryRunJson.set('');
    try {
      const response = await firstValueFrom(
        this.api.post<DynamicAppPackageDryRunResponse>('apps/packages/dry-run', {
          package: appPackage
        })
      );
      this.packageDryRunJson.set(JSON.stringify(response, null, 2));
      const safeToInstall = response.installPlan?.['safeToInstall'] === true;
      this.message.set(safeToInstall ? 'El paquete puede instalarse según el dry-run.' : 'El dry-run encontró conflictos o dependencias por revisar.');
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo previsualizar la instalación del paquete.'));
    } finally {
      this.saving.set(false);
    }
  }

  async testRuntimeRoute() {
    const app = this.selectedApp();
    if (!app) {
      this.error.set('Primero selecciona una app.');
      return;
    }
    if (!app.published) {
      this.error.set('Publica una versión de la app antes de probar el runtime.');
      return;
    }

    const route = this.screenDraft().route || '/';
    const target = this.runtimeTargetFromViewport();
    this.runtimeTesting.set(true);
    this.error.set('');
    this.runtimeRouteJson.set('');

    try {
      const response = await firstValueFrom(
        this.api.get<DynamicAppRuntimeRouteResponse>(
          `apps/by-key/${encodeURIComponent(app.key)}/runtime-route?route=${encodeURIComponent(route)}&target=${encodeURIComponent(target)}`
        )
      );
      this.runtimeRouteJson.set(JSON.stringify(response, null, 2));
      this.message.set(`Runtime resolvió ${response.screen.title} en ${response.target} para ${response.route}.`);
    } catch (error) {
      this.error.set(this.errorMessage(error, 'No se pudo resolver el runtime publicado.'));
    } finally {
      this.runtimeTesting.set(false);
    }
  }

  openPublishedRuntime() {
    const app = this.selectedApp();
    if (!app) {
      this.error.set('Primero selecciona una app.');
      return;
    }
    if (!app.published) {
      this.error.set('Publica una versión de la app antes de abrir el runtime.');
      return;
    }
    void this.router.navigate(['/apps/run', app.key], {
      queryParams: {
        route: this.screenDraft().route || '/',
        target: this.runtimeTargetFromViewport()
      }
    });
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
      { key: 'header', label: 'Header', empty: 'Menú, hero, tabs o barra superior.' },
      { key: 'content', label: 'Contenido', empty: 'Formularios, tablas, cards, detalle o galería.' },
      { key: 'aside', label: 'Lateral', empty: 'Filtros, navegación secundaria o contexto.' },
      { key: 'actions', label: 'Acciones', empty: 'Botones de servicio, flow o acciones finales.' }
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
      componentPermission: '',
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
          actionTarget: '',
          permission: ''
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
          const visibility = this.objectValue(component['visibility']);
          const actions = Array.isArray(component['actions']) ? (component['actions'] as Array<Record<string, unknown>>) : [];
          const firstAction = actions[0] ?? {};
          const componentPermissions = Array.isArray(component['permissions'])
            ? (component['permissions'] as unknown[])
            : Array.isArray(visibility?.['permissions'])
              ? (visibility?.['permissions'] as unknown[])
              : [];
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
              this.stringValue(firstAction['target']),
            permission: this.stringValue(componentPermissions[0])
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
      componentPermission: '',
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
        designer: 'app_studio_tanda_9_14'
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
        permissions: component.permission.trim() ? [component.permission.trim()] : [],
        visibility: {
          permissions: component.permission.trim() ? [component.permission.trim()] : []
        },
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
        designer: 'app_studio_tanda_9_14'
      }
    };
  }

  private componentInputs(component: ScreenComponentDraft) {
    const binding = component.bindingKey.trim();
    const defaults = this.componentSpecificInputs(component);
    if (!binding) {
      return defaults;
    }
    if (component.bindingType === 'form') {
      return { ...defaults, formKey: binding };
    }
    if (component.bindingType === 'service') {
      return { ...defaults, serviceKey: binding };
    }
    if (component.bindingType === 'flow') {
      return { ...defaults, flowKey: binding };
    }
    if (component.bindingType === 'table') {
      return { ...defaults, table: binding };
    }
    if (component.bindingType === 'none') {
      return defaults;
    }
    return { ...defaults, sourceKey: binding };
  }

  private componentSpecificInputs(component: ScreenComponentDraft): Record<string, unknown> {
    const label = component.title || this.componentLabel(component.componentKey);
    const examples: Record<string, Record<string, unknown>> = {
      hero_header: {
        subtitle: this.screenDraft().description || 'Pantalla generada desde App Studio.'
      },
      nav_menu: {
        placement: 'top',
        source: 'app_navigation'
      },
      side_nav: {
        placement: 'side',
        source: 'app_navigation'
      },
      bottom_nav: {
        placement: 'bottom',
        source: 'app_navigation'
      },
      tabs: {
        source: 'app_navigation'
      },
      metric_strip: {
        metrics: [
          { label: 'Activos', value: '24' },
          { label: 'Pendientes', value: '7' },
          { label: 'Errores', value: '0' }
        ]
      },
      chart_panel: {
        bars: [
          { label: 'Lun', value: 35 },
          { label: 'Mar', value: 54 },
          { label: 'Mie', value: 42 }
        ]
      },
      data_table: {
        columns: ['id', 'name', 'status', 'createdAt']
      },
      search_panel: {
        inputKey: 'query',
        placeholder: 'Buscar por nombre, estado o referencia'
      },
      auth_login: {
        usernameLabel: 'Usuario o email',
        passwordLabel: 'Contraseña',
        buttonLabel: 'Iniciar sesión'
      },
      service_button: {
        buttonLabel: label,
        defaultInput: {}
      },
      flow_button: {
        buttonLabel: label,
        defaultInput: {}
      },
      modal_shell: {
        buttonLabel: 'Abrir modal',
        modalTitle: label,
        modalBody: 'Contenido reusable definido por JSON.'
      },
      entity_card: {
        fields: [
          { label: 'Nombre', value: '{{record.name}}' },
          { label: 'Estado', value: '{{record.status}}' }
        ]
      },
      detail_panel: {
        fields: [
          { label: 'ID', value: '{{record.id}}' },
          { label: 'Fecha', value: '{{record.createdAt}}' }
        ]
      },
      timeline: {
        events: [
          { title: 'Creado', description: 'Registro inicial', time: 'Ahora' },
          { title: 'Actualizado', description: 'Cambio reciente', time: 'Pendiente' }
        ]
      },
      media_gallery: {
        items: [
          {
            title: 'Imagen de ejemplo',
            url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'
          }
        ]
      },
      map_view: {
        center: { lat: 4.711, lng: -74.0721 },
        markers: [{ label: 'Ubicación principal', lat: 4.711, lng: -74.0721 }]
      }
    };
    return examples[component.componentKey] ?? {};
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
    this.packageDryRunJson.set('');
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
      this.selectedComponentId.set(null);
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
        const actions = Array.isArray(component['actions']) ? (component['actions'] as Record<string, unknown>[]) : [];
        for (const action of actions) {
          this.addActionDependencies(action, formKeys, serviceKeys, flowKeys, customTables);
        }
      }
      const dataSources = Array.isArray(screen['dataSources']) ? (screen['dataSources'] as Record<string, unknown>[]) : [];
      for (const dataSource of dataSources) {
        this.addDependency(formKeys, dataSource['formKey']);
        this.addDependency(serviceKeys, dataSource['serviceKey']);
        this.addDependency(flowKeys, dataSource['flowKey']);
        this.addDependency(customTables, dataSource['table']);
      }
      const actions = Array.isArray(screen['actions']) ? (screen['actions'] as Record<string, unknown>[]) : [];
      for (const action of actions) {
        this.addActionDependencies(action, formKeys, serviceKeys, flowKeys, customTables);
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

  private addActionDependencies(
    action: Record<string, unknown>,
    formKeys: Set<string>,
    serviceKeys: Set<string>,
    flowKeys: Set<string>,
    customTables: Set<string>
  ) {
    this.addDependency(formKeys, action['formKey']);
    this.addDependency(serviceKeys, action['serviceKey']);
    this.addDependency(flowKeys, action['flowKey']);
    this.addDependency(customTables, action['table']);
    this.addDependency(customTables, action['tableName']);
  }

  private catalogOptions() {
    const items = this.catalog();
    const source = items.length
      ? items
      : [
          { key: 'hero_header', name: 'Header' },
          { key: 'nav_menu', name: 'Menú de navegación' },
          { key: 'side_nav', name: 'Menú lateral' },
          { key: 'bottom_nav', name: 'Menú inferior' },
          { key: 'tabs', name: 'Tabs' },
          { key: 'auth_login', name: 'Login estándar' },
          { key: 'data_table', name: 'Data table' },
          { key: 'search_panel', name: 'Panel de búsqueda' },
          { key: 'form_runtime', name: 'Dynamic form' },
          { key: 'service_button', name: 'Service button' },
          { key: 'flow_button', name: 'Flow button' },
          { key: 'metric_strip', name: 'Metric strip' },
          { key: 'chart_panel', name: 'Chart panel' },
          { key: 'entity_card', name: 'Entity card' },
          { key: 'detail_panel', name: 'Detail panel' },
          { key: 'timeline', name: 'Timeline' },
          { key: 'media_gallery', name: 'Media gallery' },
          { key: 'map_view', name: 'Map view' },
          { key: 'modal_shell', name: 'Modal shell' }
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

  private runtimeTargetFromViewport(): ScreenTarget {
    return this.viewport() === 'mobile' ? 'mobile' : 'web';
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
      quickPresets: [
        'menu',
        'side_menu',
        'bottom_menu',
        'tabs_nav',
        'login',
        'form',
        'table',
        'service',
        'flow',
        'dashboard',
        'crud',
        'gallery',
        'modal',
        'profile',
        'map',
        'timeline'
      ],
      appStudioCapabilities: {
        hierarchy: 'tenant -> app -> version -> screen -> component -> binding/action',
        canCreateApps: true,
        canCreateScreens: true,
        canComposeComponents: true,
        canPublishRuntime: true,
        canExportPackages: true,
        runtimeUrlPattern: '/apps/run/:appKey?route=/home&target=web',
        supportedTargets: ['admin', 'web', 'mobile', 'desktop', 'multi'],
        supportedBindings: ['form', 'service', 'flow', 'table', 'source', 'none'],
        supportedActions: ['navigate', 'execute_service', 'execute_flow', 'open_modal', 'submit_form', 'emit_event']
      },
      componentAuthoringRules: [
        'No inventar recursos publicados: si un formulario, servicio o flow no existe, proponer crearlo como dependencia.',
        'Cada pantalla visible debe tener route, navigation label y group.',
        'Login usa auth_login con auth.login como servicio por defecto.',
        'CRUD empieza con data_table + servicio listar y puede agregar form_runtime para crear/editar.',
        'Apps moviles deben incluir bottom_nav o rutas simples con target mobile/multi.',
        'Toda pieza restringida debe llevar permissions y visibility.permissions.'
      ],
      definitionOfDone: [
        'App tiene manifest valido y al menos una screen.',
        'Screen tiene componentes con region, width, binding y action claros.',
        'Preview desktop/tablet/mobile se puede revisar.',
        'Publicacion produce contrato runtime consumible.',
        'Paquete exportable incluye dependencias y dry-run instalable.'
      ]
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
