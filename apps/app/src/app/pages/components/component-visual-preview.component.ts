import { NgTemplateOutlet } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  UiKitId,
  UiKitPreference,
  UiPresentationConfig
} from '../../core/ui/ui-presentation.types';
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
    ModuleHeaderComponent,
    NgTemplateOutlet,
    PreviewViewportComponent,
    ProcessStepsComponent,
    SectionHeaderComponent,
    SegmentedControlComponent,
    StatusNoticeComponent,
    UiPresentationSwitcherComponent,
    UiThemeSelectorComponent,
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
        border: 1px dashed #b9c9d8;
        border-radius: 8px;
        background: #f7f9fc;
        padding: 12px;
      }

      .preview-label {
        color: #64748b;
        font-size: 0.72rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      .shell-preview {
        overflow: hidden;
        border: 1px solid #ccd9e5;
        border-radius: 7px;
        background: #eef3f8;
      }

      .shell-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 42px;
        border-bottom: 1px solid #ccd9e5;
        background: #ffffff;
        padding: 8px 10px;
      }

      .shell-brand {
        display: grid;
        gap: 2px;
        color: #173b5f;
        font-size: 0.72rem;
        font-weight: 850;
      }

      .shell-brand small {
        color: #64748b;
      }

      .shell-actions {
        display: flex;
        gap: 5px;
      }

      .shell-action,
      .preview-button {
        border: 1px solid #bfd0e0;
        border-radius: 6px;
        background: #ffffff;
        color: #173b5f;
        font: inherit;
        font-weight: 800;
      }

      .shell-action {
        width: 28px;
        height: 26px;
      }

      .shell-content {
        display: grid;
        gap: 8px;
        padding: 12px;
      }

      .shell-line,
      .shell-panel {
        border-radius: 5px;
        background: #dce6ef;
      }

      .shell-line {
        width: 54%;
        height: 10px;
      }

      .shell-panel {
        height: 54px;
        border: 1px solid #d0dce7;
        background: #ffffff;
      }

      .preview-button {
        min-height: 34px;
        padding: 6px 10px;
      }

      .preview-input {
        width: 100%;
        min-height: 40px;
        border: 1px solid #b9c9d8;
        border-radius: 8px;
        background: #ffffff;
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

      .workspace-list {
        background: #e8f2ff;
        color: #173b5f;
        font-weight: 800;
      }

      .workspace-surface {
        min-height: 120px;
        border: 1px dashed #bfd0e0;
        background: #ffffff;
        color: #52677a;
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
          ></app-module-header>
        }
        @case ('DesignerWorkspaceComponent') {
          <app-designer-workspace>
            <div designer-navigation class="workspace-list">Formulario seleccionado</div>
            <div designer-workspace class="workspace-surface">Área de edición</div>
          </app-designer-workspace>
        }
        @case ('CatalogHeaderComponent') {
          <app-catalog-header title="Formularios" summary="3 formularios">
            <button class="preview-button" type="button">Nuevo</button>
          </app-catalog-header>
        }
        @case ('DesignerCatalogPanelComponent') {
          <app-designer-catalog-panel title="Servicios" summary="2 servicios">
            <button catalog-actions class="preview-button" type="button">Papelera</button>
            <button catalog-actions class="preview-button" type="button">Nuevo</button>
            <app-catalog-item
              title="Buscar usuario"
              meta="buscar_usuario · activo"
              detail="publicada: v4"
              [active]="true"
            ></app-catalog-item>
            <app-catalog-item title="Buscar roles" meta="roles · activo" detail="publicada: v1"></app-catalog-item>
          </app-designer-catalog-panel>
        }
        @case ('CatalogItemComponent') {
          <app-catalog-item
            title="Registro de cliente"
            meta="draft · v2"
            detail="Actualizado recientemente"
            [active]="true"
          ></app-catalog-item>
        }
        @case ('SectionHeaderComponent') {
          <app-section-header
            stepLabel="Paso 2"
            title="Configura los campos"
            description="Define tipos, etiquetas y validaciones."
          >
            <button class="preview-button" type="button">Agregar</button>
          </app-section-header>
        }
        @case ('ProcessStepsComponent') {
          <app-process-steps
            [items]="processSteps"
            activeKey="design"
            [interactive]="false"
          ></app-process-steps>
        }
        @case ('WorkflowGuideComponent') {
          <app-workflow-guide
            stepLabel="Paso 2 de 4"
            title="Diseña el formulario"
            description="Agrega campos y revisa la vista previa."
          ></app-workflow-guide>
        }
        @case ('ContextAssistantComponent') {
          <app-context-assistant
            title="Asistente"
            description="Selecciona un campo para configurar sus propiedades."
            example="Correo, fecha o selector"
            nextAction="Agrega el primer campo"
          ></app-context-assistant>
        }
        @case ('StatusNoticeComponent') {
          <app-status-notice tone="success" title="Definición válida">
            El componente está listo para continuar.
          </app-status-notice>
        }
        @case ('LoadingSkeletonComponent') {
          <app-loading-skeleton
            variant="list"
            label="Cargando catálogo"
            [rows]="2"
          ></app-loading-skeleton>
        }
        @case ('SegmentedControlComponent') {
          <app-segmented-control
            [items]="viewModes"
            value="visual"
            ariaLabel="Vista del diseñador"
          ></app-segmented-control>
        }
        @case ('FieldShellComponent') {
          <app-field-shell
            label="Correo"
            forId="preview-email"
            help="Usaremos este correo para notificaciones."
            [required]="true"
          >
            <input id="preview-email" class="preview-input" type="email" placeholder="persona@example.com" />
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
          <app-dynamic-field-library [viewportWidth]="390"></app-dynamic-field-library>
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
        @case ('UiThemeSelectorComponent') {
          <app-ui-theme-selector
            label="Tema de la pantalla"
            controlId="preview-theme"
          ></app-ui-theme-selector>
        }
        @case ('PreviewViewportComponent') {
          <app-preview-viewport mode="mobile">
            <div class="workspace-surface">Vista móvil del formulario</div>
          </app-preview-viewport>
        }
        @case ('FlowDataMapperComponent') {
          <app-flow-data-mapper
            [rows]="flowMapRows"
            [options]="flowDataOptions"
          ></app-flow-data-mapper>
        }
        @case ('FlowGraphComponent') {
          <app-flow-graph
            [steps]="flowSteps"
            selectedStepId="step-1"
            [statuses]="flowStatuses"
          ></app-flow-graph>
        }
        @case ('FlowTimelineComponent') {
          <app-flow-timeline
            [steps]="timelineSteps"
            selectedStepId="step-1"
            [statuses]="timelineStatuses"
          ></app-flow-timeline>
        }
      }

      <ng-template #shellPreview>
        <div class="shell-preview">
          <div class="shell-nav">
            <span class="shell-brand">Chicle Engine <small>Contexto de la pantalla</small></span>
            <span class="shell-actions">
              <button class="shell-action" type="button"><i class="pi pi-home"></i></button>
              <button class="shell-action" type="button"><i class="pi pi-bars"></i></button>
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
  previewKit: UiKitPreference = 'auto';
  previewPresentation: UiPresentationConfig = { kit: 'auto' };
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
  readonly viewModes: SegmentedControlItem[] = [
    { key: 'visual', label: 'Visual', icon: 'pi pi-eye' },
    { key: 'json', label: 'JSON', icon: 'pi pi-code' }
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
