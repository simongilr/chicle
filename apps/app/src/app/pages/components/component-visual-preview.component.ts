import { NgTemplateOutlet } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  UiKitId,
  UiKitPreference,
  UiPresentationConfig
} from '../../core/ui/ui-presentation.types';
import { AdminActionToolbarComponent } from '../../shared/admin-action-toolbar/admin-action-toolbar.component';
import { AdminDataTableComponent } from '../../shared/admin-data-table/admin-data-table.component';
import { AdminFilterBarComponent } from '../../shared/admin-filter-bar/admin-filter-bar.component';
import { AdminMetricCardComponent } from '../../shared/admin-metric-card/admin-metric-card.component';
import { AdminPanelComponent } from '../../shared/admin-panel/admin-panel.component';
import { AppEntityCardComponent } from '../../shared/app-visuals/app-entity-card.component';
import { AppMetricStripComponent } from '../../shared/app-visuals/app-metric-strip.component';
import { AppTimelineComponent } from '../../shared/app-visuals/app-timeline.component';
import {
  AppEntityCard,
  AppMetricItem,
  AppTimelineItem,
  AppVertical
} from '../../shared/app-visuals/app-visuals.types';
import {
  ArchitectureBlueprintComponent,
  ArchitectureBlueprintLink,
  ArchitectureBlueprintNode
} from '../../shared/architecture-blueprint/architecture-blueprint.component';
import {
  ArchitectureDiagramComponent,
  ArchitectureDiagramLink,
  ArchitectureDiagramNode
} from '../../shared/architecture-diagram/architecture-diagram.component';
import {
  ArchitectureTopologyDiagramComponent,
  ArchitectureTopologyLink,
  ArchitectureTopologyNode,
  ArchitectureTopologyZone
} from '../../shared/architecture-topology-diagram/architecture-topology-diagram.component';
import { VerticalAppShowcaseComponent } from '../../shared/app-visuals/vertical-app-showcase.component';
import { CatalogHeaderComponent } from '../../shared/catalog-header/catalog-header.component';
import { CatalogItemComponent } from '../../shared/catalog-item/catalog-item.component';
import { ContextAssistantComponent } from '../../shared/context-assistant/context-assistant.component';
import { DesignerCatalogPanelComponent } from '../../shared/designer-catalog-panel/designer-catalog-panel.component';
import { DesignerWorkspaceComponent } from '../../shared/designer-workspace/designer-workspace.component';
import { DynamicFieldControlComponent } from '../../shared/dynamic-field-control/dynamic-field-control.component';
import { DynamicFieldLibraryComponent } from '../../shared/dynamic-field-library/dynamic-field-library.component';
import { FormlyRuntimeComponent } from '../../shared/formly-runtime/formly-runtime.component';
import { FieldShellComponent } from '../../shared/field-shell/field-shell.component';
import { LoadingSkeletonComponent } from '../../shared/loading-skeleton/loading-skeleton.component';
import { MobileActionBarComponent } from '../../shared/mobile-form/mobile-action-bar.component';
import { MobileEvidenceControlComponent } from '../../shared/mobile-form/mobile-evidence-control.component';
import { MobileFormShellComponent } from '../../shared/mobile-form/mobile-form-shell.component';
import { MobileStepProgressComponent } from '../../shared/mobile-form/mobile-step-progress.component';
import { ModuleHeaderComponent } from '../../shared/module-header/module-header.component';
import { PreviewViewportComponent } from '../../shared/preview-viewport/preview-viewport.component';
import { ProcessStepItem, ProcessStepsComponent } from '../../shared/process-steps/process-steps.component';
import { SectionHeaderComponent } from '../../shared/section-header/section-header.component';
import {
  SegmentedControlComponent,
  SegmentedControlItem
} from '../../shared/segmented-control/segmented-control.component';
import { StatusNoticeComponent } from '../../shared/status-notice/status-notice.component';
import { WorkflowGuideComponent } from '../../shared/workflow-guide/workflow-guide.component';
import { UiPresentationSwitcherComponent } from '../../shared/ui-presentation-switcher/ui-presentation-switcher.component';
import { UiThemeSelectorComponent } from '../../shared/ui-theme-selector/ui-theme-selector.component';
import { UiKitButtonComponent } from '../../shared/ui-kit-button/ui-kit-button.component';
import { UiKitCardComponent } from '../../shared/ui-kit-card/ui-kit-card.component';
import {
  FlowDataMapperComponent,
  FlowDataOption,
  FlowMapRow
} from '../flows/flow-data-mapper.component';
import {
  FlowGraphComponent,
  FlowGraphStatus,
  FlowGraphStep
} from '../flows/flow-graph.component';
import {
  FlowTimelineComponent,
  FlowTimelineStatus,
  FlowTimelineStep
} from '../flows/flow-timeline.component';
import { FORMLY_RUNTIME_EXAMPLE } from '../../engine/forms/formly/formly-runtime.examples';
import { RuntimeForm } from '../../engine/forms/form-runtime.service';

@Component({
  selector: 'app-component-visual-preview',
  standalone: true,
  imports: [
    AdminActionToolbarComponent,
    AdminDataTableComponent,
    AdminFilterBarComponent,
    AdminMetricCardComponent,
    AdminPanelComponent,
    AppEntityCardComponent,
    ArchitectureBlueprintComponent,
    ArchitectureDiagramComponent,
    ArchitectureTopologyDiagramComponent,
    AppMetricStripComponent,
    AppTimelineComponent,
    CatalogHeaderComponent,
    CatalogItemComponent,
    ContextAssistantComponent,
    DesignerCatalogPanelComponent,
    DesignerWorkspaceComponent,
    DynamicFieldControlComponent,
    DynamicFieldLibraryComponent,
    FieldShellComponent,
    FormlyRuntimeComponent,
    FlowDataMapperComponent,
    FlowGraphComponent,
    FlowTimelineComponent,
    LoadingSkeletonComponent,
    MobileActionBarComponent,
    MobileEvidenceControlComponent,
    MobileFormShellComponent,
    MobileStepProgressComponent,
    ModuleHeaderComponent,
    NgTemplateOutlet,
    PreviewViewportComponent,
    ProcessStepsComponent,
    SectionHeaderComponent,
    SegmentedControlComponent,
    StatusNoticeComponent,
    UiPresentationSwitcherComponent,
    UiThemeSelectorComponent,
    UiKitButtonComponent,
    UiKitCardComponent,
    VerticalAppShowcaseComponent,
    WorkflowGuideComponent
  ],
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }

      .preview {
        display: grid;
        gap: 10px;
        min-height: 120px;
        max-height: 390px;
        overflow: auto;
        border: 1px dashed var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface-alt);
        padding: 12px;
      }

      .preview-label {
        color: var(--ch-color-muted);
        font-size: 0.72rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .shell-preview {
        overflow: hidden;
        border: 1px solid var(--ch-color-border);
        border-radius: 7px;
        background: var(--ch-color-surface-muted);
      }

      .shell-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 42px;
        border-bottom: 1px solid var(--ch-color-border);
        background: var(--ch-color-surface);
        padding: 8px 10px;
      }

      .shell-brand {
        display: grid;
        gap: 2px;
        color: var(--ch-color-text);
        font-size: 0.72rem;
        font-weight: 850;
      }

      .shell-brand small {
        color: var(--ch-color-muted);
      }

      .shell-actions {
        display: flex;
        gap: 5px;
      }

      .preview-button {
        border: 1px solid var(--ch-color-border);
        border-radius: 6px;
        background: var(--ch-color-surface);
        color: var(--ch-color-text);
        font: inherit;
        font-weight: 800;
      }

      .shell-action {
        width: 28px;
      }

      .shell-content {
        display: grid;
        gap: 8px;
        padding: 12px;
      }

      .shell-line,
      .shell-panel {
        border-radius: 5px;
        background: var(--ch-color-border);
      }

      .shell-line {
        width: 54%;
        height: 10px;
      }

      .shell-panel {
        height: 54px;
        border: 1px solid #d0dce7;
        background: var(--ch-color-surface);
      }

      .preview-button {
        min-height: 34px;
        padding: 6px 10px;
      }

      .preview-input {
        width: 100%;
        min-height: 40px;
        border: 1px solid var(--ch-color-border);
        border-radius: 8px;
        background: var(--ch-color-surface);
        padding: 8px 10px;
        font: inherit;
      }

      .workspace-list,
      .workspace-surface {
        border-radius: 6px;
        padding: 10px;
      }

      .renderer-comparison {
        display: grid;
        gap: 14px;
      }

      .renderer-example {
        display: grid;
        gap: 6px;
        min-width: 0;
      }

      .renderer-example > strong {
        color: var(--ch-color-muted);
        font-size: 0.74rem;
        text-transform: uppercase;
      }

      .entity-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 10px;
      }

      .showcase-stack {
        display: grid;
        gap: 18px;
      }

      .workspace-list {
        background: var(--ch-color-primary-soft);
        color: var(--ch-color-text);
        font-weight: 800;
      }

      .workspace-surface {
        min-height: 120px;
        border: 1px dashed var(--ch-color-border);
        background: var(--ch-color-surface);
        color: var(--ch-color-muted);
      }

      app-designer-workspace {
        min-height: 220px !important;
      }

      app-preview-viewport {
        min-width: 520px;
      }

      @media (max-width: 620px) {
        app-preview-viewport {
          min-width: 0;
        }
      }
    `
  ],
  template: `
    <div class="preview">
      <span class="preview-label">{{ structuralPreview ? 'Miniatura estructural' : 'Componente real' }}</span>

      @switch (componentName) {
        @case ('MainNavComponent') {
          <ng-container [ngTemplateOutlet]="shellPreview"></ng-container>
        }
        @case ('PageShellComponent') {
          <ng-container [ngTemplateOutlet]="shellPreview"></ng-container>
        }
        @case ('PublicPageShellComponent') {
          <ng-container [ngTemplateOutlet]="shellPreview"></ng-container>
        }
        @case ('ModuleHeaderComponent') {
          <app-module-header
            eyebrow="Construcción"
            title="Formularios dinámicos"
            description="Diseña campos, validaciones y acciones."
            badge="V1"
            [kit]="previewKit"
          ></app-module-header>
        }
        @case ('AdminPanelComponent') {
          <app-admin-panel
            title="Resumen operativo"
            description="Panel reusable con acciones y contenido proyectado."
            [kit]="previewKit"
          >
            <app-admin-action-toolbar panel-actions [kit]="previewKit">
              <app-ui-kit-button label="Actualizar" [kit]="previewKit"></app-ui-kit-button>
            </app-admin-action-toolbar>
            <app-admin-metric-card
              label="Usuarios"
              value="24"
              detail="Activos en el tenant"
              tone="primary"
              [kit]="previewKit"
            ></app-admin-metric-card>
          </app-admin-panel>
        }
        @case ('AdminActionToolbarComponent') {
          <app-admin-action-toolbar [kit]="previewKit">
            <app-ui-kit-button label="Guardar" [kit]="previewKit"></app-ui-kit-button>
            <app-ui-kit-button label="Cancelar" [kit]="previewKit" tone="neutral" variant="outline"></app-ui-kit-button>
            <app-ui-kit-button label="Eliminar" [kit]="previewKit" tone="danger" variant="outline"></app-ui-kit-button>
          </app-admin-action-toolbar>
        }
        @case ('AdminMetricCardComponent') {
          <app-admin-metric-card
            label="Servicios"
            value="12"
            detail="Publicados y disponibles"
            tone="success"
            [kit]="previewKit"
          ></app-admin-metric-card>
        }
        @case ('AdminFilterBarComponent') {
          <app-admin-filter-bar ariaLabel="Preview filters" [kit]="previewKit">
            <app-dynamic-field-control
              [field]="filterSearchField"
              [presentation]="previewPresentation"
              value=""
            ></app-dynamic-field-control>
            <app-dynamic-field-control
              [field]="filterStatusField"
              [presentation]="previewPresentation"
              value="all"
            ></app-dynamic-field-control>
          </app-admin-filter-bar>
        }
        @case ('AdminDataTableComponent') {
          <app-admin-data-table
            [columns]="dataTablePreviewColumns"
            [rows]="dataTablePreviewRows"
            detailLabel="Detalle"
            detailActionLabel="Ver"
            [kit]="previewKit"
          ></app-admin-data-table>
        }
        @case ('ArchitectureDiagramComponent') {
          <app-architecture-diagram
            title="Mapa del módulo"
            description="Muestra partes, ubicación y relaciones sin dibujar cada diagrama a mano."
            badge="Reusable"
            [nodes]="architecturePreviewNodes"
            [links]="architecturePreviewLinks"
          ></app-architecture-diagram>
        }
        @case ('ArchitectureBlueprintComponent') {
          <app-architecture-blueprint
            title="Dibujo de Chicle"
            description="Plano visual con front, API, runtime y DB conectados."
            badge="Blueprint"
            [nodes]="blueprintPreviewNodes"
            [links]="blueprintPreviewLinks"
          ></app-architecture-blueprint>
        }
        @case ('ArchitectureTopologyDiagramComponent') {
          <app-architecture-topology-diagram
            title="Topología"
            description="Vista tipo draw.io con piezas y comunicación."
            badge="Comunicación"
            [zones]="topologyPreviewZones"
            [nodes]="topologyPreviewNodes"
            [links]="topologyPreviewLinks"
          ></app-architecture-topology-diagram>
        }
        @case ('DesignerWorkspaceComponent') {
          <app-designer-workspace>
            <div designer-navigation class="workspace-list">Formulario seleccionado</div>
            <div designer-workspace class="workspace-surface">Área de edición</div>
          </app-designer-workspace>
        }
        @case ('CatalogHeaderComponent') {
          <app-catalog-header title="Formularios" summary="3 formularios" [kit]="previewKit">
            <app-ui-kit-button label="Nuevo" [kit]="previewKit"></app-ui-kit-button>
          </app-catalog-header>
        }
        @case ('DesignerCatalogPanelComponent') {
          <app-designer-catalog-panel title="Servicios" summary="2 servicios" [kit]="previewKit">
            <app-ui-kit-button catalog-actions label="Papelera" [kit]="previewKit" variant="outline"></app-ui-kit-button>
            <app-ui-kit-button catalog-actions label="Nuevo" [kit]="previewKit"></app-ui-kit-button>
            <app-catalog-item
              title="Buscar usuario"
              meta="buscar_usuario · activo"
              detail="publicada: v4"
              [active]="true"
              [kit]="previewKit"
            ></app-catalog-item>
            <app-catalog-item title="Buscar roles" meta="roles · activo" detail="publicada: v1" [kit]="previewKit"></app-catalog-item>
          </app-designer-catalog-panel>
        }
        @case ('CatalogItemComponent') {
          <app-catalog-item
            title="Registro de cliente"
            meta="draft · v2"
            detail="Actualizado recientemente"
            [active]="true"
            [kit]="previewKit"
          ></app-catalog-item>
        }
        @case ('SectionHeaderComponent') {
          <app-section-header
            stepLabel="Paso 2"
            title="Configura los campos"
            description="Define tipos, etiquetas y validaciones."
            [kit]="previewKit"
          >
            <app-ui-kit-button label="Agregar" [kit]="previewKit"></app-ui-kit-button>
          </app-section-header>
        }
        @case ('ProcessStepsComponent') {
          <app-process-steps
            [items]="processSteps"
            activeKey="design"
            [interactive]="false"
            [kit]="previewKit"
          ></app-process-steps>
        }
        @case ('WorkflowGuideComponent') {
          <app-workflow-guide
            stepLabel="Paso 2 de 4"
            title="Diseña el formulario"
            description="Agrega campos y revisa la vista previa."
            [kit]="previewKit"
          ></app-workflow-guide>
        }
        @case ('ContextAssistantComponent') {
          <app-context-assistant
            title="Asistente"
            description="Selecciona un campo para configurar sus propiedades."
            example="Correo, fecha o selector"
            nextAction="Agrega el primer campo"
            [kit]="previewKit"
          ></app-context-assistant>
        }
        @case ('StatusNoticeComponent') {
          <app-status-notice tone="success" title="Definición válida" [kit]="previewKit">
            El componente está listo para continuar.
          </app-status-notice>
        }
        @case ('LoadingSkeletonComponent') {
          <app-loading-skeleton
            variant="list"
            label="Cargando catálogo"
            [rows]="2"
            [kit]="previewKit"
          ></app-loading-skeleton>
        }
        @case ('SegmentedControlComponent') {
          <app-segmented-control
            [items]="viewModes"
            value="visual"
            ariaLabel="Vista del diseñador"
            [kit]="previewKit"
          ></app-segmented-control>
        }
        @case ('FieldShellComponent') {
          <app-field-shell
            label="Correo"
            forId="preview-email"
            help="Usaremos este correo para notificaciones."
            [required]="true"
            [kit]="previewKit"
          >
            <app-dynamic-field-control
              [field]="emailPreviewField"
              [presentation]="previewPresentation"
              value="persona@example.com"
            ></app-dynamic-field-control>
          </app-field-shell>
        }
        @case ('DynamicFieldControlComponent') {
          <div class="renderer-comparison">
            <div class="renderer-example">
              <strong>PrimeNG</strong>
              <app-dynamic-field-control
                [field]="primeDynamicField"
                [presentation]="{ kit: 'primeng' }"
                value="client"
              ></app-dynamic-field-control>
            </div>
            <div class="renderer-example">
              <strong>Ionic</strong>
              <app-dynamic-field-control
                [field]="ionicDynamicField"
                [presentation]="{ kit: 'ionic' }"
                value="client"
              ></app-dynamic-field-control>
            </div>
            <div class="renderer-example">
              <strong>Material</strong>
              <app-dynamic-field-control
                [field]="materialDynamicField"
                [presentation]="{ kit: 'material' }"
                value="client"
              ></app-dynamic-field-control>
            </div>
            <div class="renderer-example">
              <strong>Bootstrap</strong>
              <app-dynamic-field-control
                [field]="bootstrapDynamicField"
                [presentation]="{ kit: 'bootstrap' }"
                value="client"
              ></app-dynamic-field-control>
            </div>
            <div class="renderer-example">
              <strong>Base</strong>
              <app-dynamic-field-control
                [field]="nativeDynamicField"
                [presentation]="{ kit: 'native' }"
                value="client"
              ></app-dynamic-field-control>
            </div>
          </div>
        }
        @case ('DynamicFieldLibraryComponent') {
          <app-dynamic-field-library [kit]="previewKit" [viewportWidth]="390"></app-dynamic-field-library>
        }
        @case ('FormlyRuntimeComponent') {
          <app-ui-presentation-switcher
            [value]="previewKit"
            [resolvedKit]="resolvedPreviewKit"
            (valueChange)="selectPreviewKit($event)"
          ></app-ui-presentation-switcher>
          <app-formly-runtime
            [definition]="formlyExample"
            [model]="formlyModel"
            [presentation]="previewPresentation"
            [viewportWidth]="390"
            (modelChange)="formlyModel = $event"
          ></app-formly-runtime>
        }
        @case ('MobileFormShellComponent') {
          <app-mobile-form-shell
            eyebrow="Móvil"
            title="Inspección operativa"
            description="Captura evidencias y ubicación en campo."
            [metadata]="['ionic', 'offline']"
            [kit]="previewKit"
          >
            <div class="workspace-surface">Contenido del formulario móvil</div>
          </app-mobile-form-shell>
        }
        @case ('MobileStepProgressComponent') {
          <app-mobile-step-progress
            [items]="mobileSteps"
            activeKey="evidencias"
            [kit]="previewKit"
          ></app-mobile-step-progress>
        }
        @case ('MobileActionBarComponent') {
          <app-mobile-action-bar
            secondaryLabel="Anterior"
            primaryLabel="Continuar"
            primaryType="button"
            [kit]="previewKit"
          ></app-mobile-action-bar>
        }
        @case ('MobileEvidenceControlComponent') {
          <app-mobile-evidence-control
            mode="image"
            controlId="preview-mobile-foto"
            name="foto"
            placeholder="Foto obligatoria"
            [value]="mobileEvidenceValue"
            [kit]="previewKit"
            (valueChange)="mobileEvidenceValue = $event"
          ></app-mobile-evidence-control>
          <app-mobile-evidence-control
            mode="gps"
            controlId="preview-mobile-gps"
            name="ubicacion"
            [value]="mobileGpsValue"
            [kit]="previewKit"
            (valueChange)="mobileGpsValue = $event"
          ></app-mobile-evidence-control>
        }
        @case ('ChicleFormlyFieldTypeComponent') {
          <app-formly-runtime
            [definition]="formlyControlExample"
            [model]="formlyControlModel"
            [presentation]="previewPresentation"
            [showActions]="false"
            (modelChange)="formlyControlModel = $event"
          ></app-formly-runtime>
        }
        @case ('ChicleFormlyDisplayTypeComponent') {
          <app-formly-runtime
            [definition]="formlyDisplayExample"
            [showActions]="false"
          ></app-formly-runtime>
        }
        @case ('PrimengFieldRendererComponent') {
          <app-dynamic-field-control
            [field]="primeDynamicField"
            [presentation]="{ kit: 'primeng' }"
            value="client"
          ></app-dynamic-field-control>
        }
        @case ('IonicFieldRendererComponent') {
          <app-dynamic-field-control
            [field]="ionicDynamicField"
            [presentation]="{ kit: 'ionic' }"
            value="client"
          ></app-dynamic-field-control>
        }
        @case ('NativeFieldRendererComponent') {
          <app-dynamic-field-control
            [field]="nativeDynamicField"
            [presentation]="{ kit: 'native' }"
            value="client"
          ></app-dynamic-field-control>
        }
        @case ('MaterialFieldRendererComponent') {
          <app-dynamic-field-control
            [field]="materialDynamicField"
            [presentation]="{ kit: 'material' }"
            value="client"
          ></app-dynamic-field-control>
        }
        @case ('BootstrapFieldRendererComponent') {
          <app-dynamic-field-control
            [field]="bootstrapDynamicField"
            [presentation]="{ kit: 'bootstrap' }"
            value="client"
          ></app-dynamic-field-control>
        }
        @case ('UiPresentationSwitcherComponent') {
          <app-ui-presentation-switcher
            [value]="previewKit"
            [resolvedKit]="resolvedPreviewKit"
            (valueChange)="selectPreviewKit($event)"
          ></app-ui-presentation-switcher>
          <app-dynamic-field-control
            [field]="adaptiveDynamicField"
            [presentation]="previewPresentation"
            [viewportWidth]="390"
            value="client"
          ></app-dynamic-field-control>
        }
        @case ('UiKitButtonComponent') {
          <div class="renderer-comparison">
            @for (kit of kitExamples; track kit) {
              <div class="renderer-example">
                <strong>{{ kit }}</strong>
                <app-ui-kit-button
                  label="Guardar"
                  icon="pi pi-save"
                  [kit]="kit"
                  tone="primary"
                ></app-ui-kit-button>
                <app-ui-kit-button
                  label="Eliminar"
                  icon="pi pi-trash"
                  [kit]="kit"
                  tone="danger"
                  variant="outline"
                ></app-ui-kit-button>
              </div>
            }
          </div>
        }
        @case ('UiKitCardComponent') {
          <div class="renderer-comparison">
            @for (kit of kitExamples; track kit) {
              <div class="renderer-example">
                <strong>{{ kit }}</strong>
                <app-ui-kit-card [kit]="kit" tone="primary" variant="subtle">
                  <strong>Panel operativo</strong>
                  <span>Card real del kit con tokens, bordes y superficie de Chicle.</span>
                </app-ui-kit-card>
              </div>
            }
          </div>
        }
        @case ('UiThemeSelectorComponent') {
          <app-ui-theme-selector
            label="Tema de la pantalla"
            controlId="preview-theme"
            [kit]="previewKit"
          ></app-ui-theme-selector>
        }
        @case ('PreviewViewportComponent') {
          <app-preview-viewport mode="mobile" [kit]="previewKit">
            <div class="workspace-surface">Vista móvil del formulario</div>
          </app-preview-viewport>
        }
        @case ('FlowDataMapperComponent') {
          <app-flow-data-mapper
            [rows]="flowMapRows"
            [options]="flowDataOptions"
            [kit]="previewKit"
          ></app-flow-data-mapper>
        }
        @case ('FlowGraphComponent') {
          <app-flow-graph
            [steps]="flowSteps"
            selectedStepId="step-1"
            [statuses]="flowStatuses"
            [kit]="previewKit"
          ></app-flow-graph>
        }
        @case ('FlowTimelineComponent') {
          <app-flow-timeline
            [steps]="timelineSteps"
            selectedStepId="step-1"
            [statuses]="timelineStatuses"
            [kit]="previewKit"
          ></app-flow-timeline>
        }
        @case ('AppMetricStripComponent') {
          <app-metric-strip [items]="appMetrics" [kit]="previewKit"></app-metric-strip>
        }
        @case ('AppEntityCardComponent') {
          <div class="entity-preview-grid">
            @for (card of appEntityCards; track card.title) {
              <app-entity-card [card]="card" [kit]="previewKit"></app-entity-card>
            }
          </div>
        }
        @case ('AppTimelineComponent') {
          <app-app-timeline [items]="appTimeline" [kit]="previewKit"></app-app-timeline>
        }
        @case ('VerticalAppShowcaseComponent') {
          <div class="showcase-stack">
            @for (vertical of appVerticals; track vertical) {
              <app-vertical-app-showcase [vertical]="vertical" [kit]="previewKit"></app-vertical-app-showcase>
            }
          </div>
        }
      }

      <ng-template #shellPreview>
        <div class="shell-preview">
          <div class="shell-nav">
            <span class="shell-brand">Chicle Engine <small>Contexto de la pantalla</small></span>
            <span class="shell-actions">
              <app-ui-kit-button
                class="shell-action"
                label=""
                ariaLabel="Inicio"
                icon="pi pi-home"
                tone="secondary"
                variant="outline"
                [kit]="previewKit"
              ></app-ui-kit-button>
              <app-ui-kit-button
                class="shell-action"
                label=""
                ariaLabel="Menu"
                icon="pi pi-bars"
                tone="secondary"
                variant="outline"
                [kit]="previewKit"
              ></app-ui-kit-button>
            </span>
          </div>
          <div class="shell-content">
            <span class="shell-line"></span>
            <span class="shell-panel"></span>
          </div>
        </div>
      </ng-template>
    </div>
  `
})
export class ComponentVisualPreviewComponent {
  @Input({ required: true }) componentName = '';
  @Input()
  set kit(value: UiKitPreference) {
    this.selectPreviewKit(value || 'primeng');
  }

  previewKit: UiKitPreference = 'primeng';
  previewPresentation: UiPresentationConfig = { kit: 'primeng' };
  readonly formlyExample = FORMLY_RUNTIME_EXAMPLE;
  formlyModel: Record<string, unknown> = {};
  formlyControlModel: Record<string, unknown> = {};
  readonly formlyControlExample: RuntimeForm = {
    key: 'formly_control_preview',
    title: 'Campo conectado a Formly',
    version: 1,
    fields: [
      {
        name: 'previewName',
        type: 'text',
        label: 'Nombre',
        required: true,
        placeholder: 'Escribe para probar validación'
      }
    ]
  };
  readonly formlyDisplayExample: RuntimeForm = {
    key: 'formly_display_preview',
    title: 'Contenido declarativo',
    version: 1,
    fields: [
      {
        name: 'previewTitle',
        type: 'title',
        label: 'Título de sección',
        layout: 'full'
      },
      {
        name: 'previewParagraph',
        type: 'paragraph',
        label: '',
        text: 'Texto informativo generado desde el mismo esquema JSON.',
        layout: 'full'
      },
      {
        name: 'previewDivider',
        type: 'divider',
        label: '',
        layout: 'full'
      }
    ]
  };

  readonly processSteps: ProcessStepItem[] = [
    { key: 'data', label: 'Datos', summary: 'Identidad', state: 'complete' },
    { key: 'design', label: 'Diseñar', summary: 'Campos', state: 'active' },
    { key: 'publish', label: 'Publicar', summary: 'Activar', state: 'pending' }
  ];
  readonly mobileSteps: ProcessStepItem[] = [
    { key: 'datos', label: 'Datos', summary: '2 campos', state: 'complete' },
    { key: 'evidencias', label: 'Evidencias', summary: '2 campos', state: 'active' },
    { key: 'cierre', label: 'Cierre', summary: '1 campo', state: 'pending' }
  ];
  mobileEvidenceValue: unknown = '';
  mobileGpsValue: unknown = { lat: 4.711, lng: -74.072, accuracy: 12 };
  readonly viewModes: SegmentedControlItem[] = [
    { key: 'visual', label: 'Visual', icon: 'pi pi-eye' },
    { key: 'json', label: 'JSON', icon: 'pi pi-code' }
  ];
  readonly dataTablePreviewColumns = [
    { name: 'email', label: 'Email' },
    { name: 'role', label: 'Role' },
    { name: 'status', label: 'Status' }
  ];
  readonly dataTablePreviewRows = [
    { id: '1', email: 'admin@example.com', role: 'Owner', status: 'Active' },
    { id: '2', email: 'viewer@example.com', role: 'Viewer', status: 'Pending' }
  ];
  readonly kitExamples: UiKitId[] = ['primeng', 'ionic', 'material', 'bootstrap', 'native'];
  readonly filterSearchField = {
    name: 'previewSearch',
    type: 'search',
    label: 'Buscar',
    placeholder: 'Nombre o key'
  };
  readonly filterStatusField = {
    name: 'previewStatus',
    type: 'select',
    label: 'Estado',
    placeholder: 'Todos',
    options: [
      { label: 'Todos', value: 'all' },
      { label: 'Activos', value: 'active' }
    ]
  };
  readonly emailPreviewField = {
    name: 'previewEmail',
    type: 'email',
    label: 'Correo',
    placeholder: 'persona@example.com',
    required: true
  };
  readonly architecturePreviewNodes: ArchitectureDiagramNode[] = [
    {
      id: 'app',
      title: 'App',
      eyebrow: 'Frontend',
      description: 'Páginas, shared components y runtime visual.',
      icon: 'pi pi-desktop',
      status: 'Angular',
      tone: 'ui',
      paths: ['apps/app/src/app']
    },
    {
      id: 'api',
      title: 'API',
      eyebrow: 'Backend',
      description: 'Módulos NestJS, guards y TypeORM.',
      icon: 'pi pi-server',
      status: 'NestJS',
      tone: 'core',
      paths: ['apps/api/src/modules']
    },
    {
      id: 'db',
      title: 'DB',
      eyebrow: 'Datos',
      description: 'Core, runtime, records y custom_*.',
      icon: 'pi pi-database',
      status: 'MariaDB',
      tone: 'data',
      paths: ['apps/api/src/database']
    }
  ];
  readonly architecturePreviewLinks: ArchitectureDiagramLink[] = [
    { from: 'app', to: 'api', label: 'HTTP', description: 'Pantallas consumen endpoints protegidos.' },
    { from: 'api', to: 'db', label: 'TypeORM', description: 'El backend valida y persiste.' }
  ];
  readonly blueprintPreviewNodes: ArchitectureBlueprintNode[] = [
    {
      id: 'front',
      title: 'Front',
      subtitle: 'Angular',
      description: 'Admin y runtime visual.',
      icon: 'pi pi-desktop',
      tone: 'front',
      x: 6,
      y: 14,
      width: 22,
      height: 24,
      bullets: ['app']
    },
    {
      id: 'api',
      title: 'API',
      subtitle: 'NestJS',
      description: 'Kernel modular protegido.',
      icon: 'pi pi-server',
      tone: 'api',
      x: 40,
      y: 18,
      width: 22,
      height: 24,
      bullets: ['guards']
    },
    {
      id: 'db',
      title: 'DB',
      subtitle: 'MariaDB',
      description: 'Core, runtime y custom.',
      icon: 'pi pi-database',
      tone: 'data',
      x: 72,
      y: 18,
      width: 20,
      height: 24,
      bullets: ['custom_*']
    },
    {
      id: 'ai',
      title: 'Chicle AI',
      subtitle: 'Asistente',
      description: 'Propone drafts revisables.',
      icon: 'pi pi-sparkles',
      tone: 'ai',
      x: 40,
      y: 62,
      width: 22,
      height: 22,
      bullets: ['JSON']
    }
  ];
  readonly blueprintPreviewLinks: ArchitectureBlueprintLink[] = [
    { from: 'front', to: 'api', label: 'HTTP', kind: 'sync' },
    { from: 'api', to: 'db', label: 'TypeORM', kind: 'data' },
    { from: 'ai', to: 'front', label: 'Drafts', kind: 'ai' }
  ];
  readonly topologyPreviewZones: ArchitectureTopologyZone[] = [
    { title: 'Front', x: 4, y: 12, width: 24, height: 70, tone: 'front' },
    { title: 'Kernel', x: 38, y: 12, width: 24, height: 70, tone: 'api' },
    { title: 'Datos', x: 72, y: 12, width: 20, height: 70, tone: 'data' }
  ];
  readonly topologyPreviewNodes: ArchitectureTopologyNode[] = [
    { id: 'web', title: 'Web', subtitle: 'Angular', icon: 'pi pi-desktop', tone: 'front', x: 16, y: 34 },
    { id: 'api', title: 'API', subtitle: 'NestJS', icon: 'pi pi-server', tone: 'api', x: 50, y: 34 },
    { id: 'runtime', title: 'Runtime', subtitle: 'JSON', icon: 'pi pi-bolt', tone: 'runtime', x: 50, y: 62 },
    { id: 'db', title: 'DB', subtitle: 'MariaDB', icon: 'pi pi-database', tone: 'data', x: 82, y: 48 }
  ];
  readonly topologyPreviewLinks: ArchitectureTopologyLink[] = [
    { from: 'web', to: 'api', label: 'HTTP', kind: 'sync' },
    { from: 'api', to: 'runtime', label: 'execute', kind: 'sync' },
    { from: 'runtime', to: 'db', label: 'TypeORM', kind: 'data' }
  ];
  readonly primeDynamicField = {
    name: 'customerTypePrime',
    type: 'select',
    label: 'Tipo de cliente',
    required: true,
    options: [
      { label: 'Cliente', value: 'client' },
      { label: 'Proveedor', value: 'supplier' }
    ]
  };
  readonly ionicDynamicField = {
    ...this.primeDynamicField,
    name: 'customerTypeIonic'
  };
  readonly nativeDynamicField = {
    ...this.primeDynamicField,
    name: 'customerTypeNative'
  };
  readonly materialDynamicField = {
    ...this.primeDynamicField,
    name: 'customerTypeMaterial'
  };
  readonly bootstrapDynamicField = {
    ...this.primeDynamicField,
    name: 'customerTypeBootstrap'
  };
  readonly adaptiveDynamicField = {
    ...this.primeDynamicField,
    name: 'customerTypeAdaptive',
    label: 'Resultado del perfil'
  };
  readonly flowMapRows: FlowMapRow[] = [{ key: 'email', value: '{{input.email}}' }];
  readonly flowDataOptions: FlowDataOption[] = [
    { group: 'input', label: 'Correo del formulario', value: '{{input.email}}' },
    { group: 'context', label: 'Tenant actual', value: '{{tenant.id}}' }
  ];
  readonly flowSteps: FlowGraphStep[] = [
    {
      id: 'step-1',
      key: 'validar',
      name: 'Validar correo',
      type: 'validation',
      position: 10,
      nextStepKey: 'responder'
    },
    {
      id: 'step-2',
      key: 'responder',
      name: 'Responder',
      type: 'response',
      position: 20
    }
  ];
  readonly flowStatuses: FlowGraphStatus[] = [{ stepKey: 'validar', status: 'success' }];
  readonly timelineSteps: FlowTimelineStep[] = [
    {
      id: 'step-1',
      key: 'validar',
      name: 'Validar correo',
      type: 'validation',
      position: 10,
      outputKey: 'validacion',
      nextStepKey: 'responder'
    },
    {
      id: 'step-2',
      key: 'responder',
      name: 'Responder',
      type: 'response',
      position: 20,
      outputKey: 'respuesta'
    }
  ];
  readonly timelineStatuses: FlowTimelineStatus[] = [{ stepKey: 'validar', status: 'success' }];
  readonly appMetrics: AppMetricItem[] = [
    { label: 'Activos hoy', value: '128', trend: '+12%', icon: 'pi pi-chart-line' },
    { label: 'Pendientes', value: '7', icon: 'pi pi-clock' },
    { label: 'Conversion', value: '81%', icon: 'pi pi-check-circle' }
  ];
  readonly appEntityCards: AppEntityCard[] = [
    {
      kind: 'event',
      title: 'Evento principal',
      subtitle: 'Agenda, invitados y check-in',
      status: 'Activo',
      actionLabel: 'Abrir'
    },
    {
      kind: 'property',
      title: 'Inmueble destacado',
      subtitle: '3 hab · visita agendada',
      price: '$320K',
      status: 'Publicado'
    },
    {
      kind: 'inspection',
      title: 'Inspeccion movil',
      subtitle: 'Foto, GPS y cola offline',
      status: 'Ready'
    }
  ];
  readonly appTimeline: AppTimelineItem[] = [
    { label: 'Captura', detail: 'Formulario o servicio inicial', state: 'complete' },
    { label: 'Proceso', detail: 'Validacion, flujo o asignacion', state: 'active' },
    { label: 'Cierre', detail: 'Respuesta, evidencia o sincronizacion', state: 'pending' }
  ];
  readonly appVerticals: AppVertical[] = ['events', 'real_estate', 'tickets', 'services', 'games', 'inspection'];

  get structuralPreview() {
    return ['MainNavComponent', 'PageShellComponent', 'PublicPageShellComponent'].includes(this.componentName);
  }

  get resolvedPreviewKit(): UiKitId {
    return this.previewKit === 'auto' || this.previewKit === 'inherit' ? 'ionic' : this.previewKit;
  }

  selectPreviewKit(kit: UiKitPreference) {
    this.previewKit = kit;
    this.previewPresentation = { kit };
  }
}
