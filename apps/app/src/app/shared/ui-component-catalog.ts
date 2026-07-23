export type UiComponentCategory =
  | 'Shell y navegación'
  | 'Documentación y arquitectura'
  | 'Diseñadores'
  | 'Guía y estados'
  | 'Formularios'
  | 'Temas y presentación'
  | 'Flow especializado'
  | 'Apps verticales';

export interface UiComponentCatalogEntry {
  name: string;
  selector: string;
  category: UiComponentCategory;
  purpose: string;
  importPath: string;
  usedBy: string[];
  status: 'stable' | 'initial' | 'domain';
  example: string;
}

export const UI_COMPONENT_CATALOG: UiComponentCatalogEntry[] = [
  {
    name: 'MainNavComponent',
    selector: 'app-main-nav',
    category: 'Shell y navegación',
    purpose: 'Navegación principal responsive, permisos, menús del tenant y cierre de sesión.',
    importPath: 'shared/main-nav/main-nav.component',
    usedBy: ['PageShellComponent'],
    status: 'stable',
    example: '<app-main-nav contextLabel="Servicios"></app-main-nav>'
  },
  {
    name: 'PageShellComponent',
    selector: 'app-page-shell',
    category: 'Shell y navegación',
    purpose: 'Ancho, márgenes, fondo, navegación y scroll de todas las pantallas autenticadas.',
    importPath: 'shared/page-shell/page-shell.component',
    usedBy: ['Home', 'Docs', 'Components', 'Confisys', 'Database', 'Services', 'Flows', 'Security', 'Dynamic forms'],
    status: 'stable',
    example: '<app-page-shell contextLabel="Formularios">...</app-page-shell>'
  },
  {
    name: 'PublicPageShellComponent',
    selector: 'app-public-page-shell',
    category: 'Shell y navegación',
    purpose: 'Topbar, ancho y márgenes compartidos para rutas públicas.',
    importPath: 'shared/public-page-shell/public-page-shell.component',
    usedBy: ['Login', 'Setup'],
    status: 'stable',
    example:
      '<app-public-page-shell contextLabel="Ingreso"><a public-actions routerLink="/docs">Docs</a>...</app-public-page-shell>'
  },
  {
    name: 'ModuleHeaderComponent',
    selector: 'app-module-header',
    category: 'Shell y navegación',
    purpose: 'Título, descripción, eyebrow y badge uniforme para módulos.',
    importPath: 'shared/module-header/module-header.component',
    usedBy: ['Confisys', 'Database', 'Services', 'Flows', 'Security', 'Dynamic forms'],
    status: 'stable',
    example:
      '<app-module-header eyebrow="Construcción" title="Formularios" description="Diseña formularios." badge="V1"></app-module-header>'
  },
  {
    name: 'ArchitectureDiagramComponent',
    selector: 'app-architecture-diagram',
    category: 'Documentación y arquitectura',
    purpose:
      'Mapa visual reutilizable para explicar partes del proyecto, ubicación en el monorepo y relaciones entre módulos.',
    importPath: 'shared/architecture-diagram/architecture-diagram.component',
    usedBy: ['Architecture', 'Components', 'Docs'],
    status: 'stable',
    example:
      '<app-architecture-diagram title="Mapa técnico" [nodes]="nodes" [links]="links"></app-architecture-diagram>'
  },
  {
    name: 'ArchitectureBlueprintComponent',
    selector: 'app-architecture-blueprint',
    category: 'Documentación y arquitectura',
    purpose:
      'Dibujo tipo plano/canvas para mostrar dónde está cada parte del sistema y cómo se comunican con flechas.',
    importPath: 'shared/architecture-blueprint/architecture-blueprint.component',
    usedBy: ['Architecture', 'Components'],
    status: 'stable',
    example:
      '<app-architecture-blueprint title="Dibujo de arquitectura" [nodes]="nodes" [links]="links"></app-architecture-blueprint>'
  },
  {
    name: 'ArchitectureTopologyDiagramComponent',
    selector: 'app-architecture-topology-diagram',
    category: 'Documentación y arquitectura',
    purpose:
      'Diagrama tipo draw.io para mostrar piezas del sistema con iconos y flechas de comunicación con poco texto.',
    importPath: 'shared/architecture-topology-diagram/architecture-topology-diagram.component',
    usedBy: ['Architecture', 'Components'],
    status: 'stable',
    example:
      '<app-architecture-topology-diagram title="Topología" [zones]="zones" [nodes]="nodes" [links]="links"></app-architecture-topology-diagram>'
  },
  {
    name: 'DesignerWorkspaceComponent',
    selector: 'app-designer-workspace',
    category: 'Diseñadores',
    purpose: 'Distribución responsive de catálogo lateral y área de edición.',
    importPath: 'shared/designer-workspace/designer-workspace.component',
    usedBy: ['Services', 'Flows'],
    status: 'stable',
    example:
      '<app-designer-workspace><ng-container designer-navigation>...</ng-container><ng-container designer-workspace>...</ng-container></app-designer-workspace>'
  },
  {
    name: 'CatalogHeaderComponent',
    selector: 'app-catalog-header',
    category: 'Diseñadores',
    purpose: 'Título, contador y comandos de un catálogo.',
    importPath: 'shared/catalog-header/catalog-header.component',
    usedBy: ['Database', 'Services', 'Flows'],
    status: 'stable',
    example: '<app-catalog-header title="Formularios" summary="3 formularios">...</app-catalog-header>'
  },
  {
    name: 'DesignerCatalogPanelComponent',
    selector: 'app-designer-catalog-panel',
    category: 'Diseñadores',
    purpose:
      'Contenedor reutilizable para catálogos laterales de diseñadores: título, contador, acciones Nuevo/Papelera, loading, error, vacío y lista.',
    importPath: 'shared/designer-catalog-panel/designer-catalog-panel.component',
    usedBy: ['Services', 'Flows', 'Dynamic forms'],
    status: 'stable',
    example:
      '<app-designer-catalog-panel title="Servicios" summary="2 servicios"><button catalog-actions>Nuevo</button>...</app-designer-catalog-panel>'
  },
  {
    name: 'CatalogItemComponent',
    selector: 'app-catalog-item',
    category: 'Diseñadores',
    purpose: 'Fila seleccionable de catálogo con título, metadata y detalle.',
    importPath: 'shared/catalog-item/catalog-item.component',
    usedBy: ['Database', 'Services', 'Flows'],
    status: 'stable',
    example: '<app-catalog-item title="Registro" meta="draft" [active]="true"></app-catalog-item>'
  },
  {
    name: 'SectionHeaderComponent',
    selector: 'app-section-header',
    category: 'Diseñadores',
    purpose: 'Encabezado de bloque con descripción, paso y acciones proyectadas.',
    importPath: 'shared/section-header/section-header.component',
    usedBy: ['Database', 'Services', 'Flows'],
    status: 'stable',
    example:
      '<app-section-header stepLabel="Paso 1" title="Datos" description="Identidad del objeto.">...</app-section-header>'
  },
  {
    name: 'AdminFilterBarComponent',
    selector: 'app-admin-filter-bar',
    category: 'Diseñadores',
    purpose: 'Barra responsive reutilizable para búsquedas, filtros y selectores del Admin.',
    importPath: 'shared/admin-filter-bar/admin-filter-bar.component',
    usedBy: ['Components', 'Confisys', 'Markdown repository'],
    status: 'stable',
    example: '<app-admin-filter-bar><label>Buscar<input type="search" /></label></app-admin-filter-bar>'
  },
  {
    name: 'AdminDataTableComponent',
    selector: 'app-admin-data-table',
    category: 'Diseñadores',
    purpose: 'Tabla reusable para datos administrativos con columnas dinámicas, estado vacío y acción de detalle.',
    importPath: 'shared/admin-data-table/admin-data-table.component',
    usedBy: ['Database'],
    status: 'stable',
    example: '<app-admin-data-table [columns]="columns" [rows]="rows"></app-admin-data-table>'
  },
  {
    name: 'AdminCardGridComponent',
    selector: 'app-admin-card-grid',
    category: 'Shell y navegación',
    purpose:
      'Grid responsive reusable para tarjetas administrativas, catálogos visuales, resúmenes y módulos de navegación.',
    importPath: 'shared/admin-card-grid/admin-card-grid.component',
    usedBy: ['Components'],
    status: 'stable',
    example: '<app-admin-card-grid minColumnWidth="320px"><app-admin-panel>...</app-admin-panel></app-admin-card-grid>'
  },
  {
    name: 'AdminPanelComponent',
    selector: 'app-admin-panel',
    category: 'Shell y navegación',
    purpose: 'Panel reusable para módulos del Admin con título, descripción, acciones proyectadas y contenido.',
    importPath: 'shared/admin-panel/admin-panel.component',
    usedBy: ['Home', 'Preferences', 'Security'],
    status: 'stable',
    example:
      '<app-admin-panel title="Resumen" description="Estado actual"><button panel-actions>Actualizar</button>...</app-admin-panel>'
  },
  {
    name: 'AdminMetricCardComponent',
    selector: 'app-admin-metric-card',
    category: 'Guía y estados',
    purpose: 'Tarjeta métrica para resúmenes operativos, dashboards y estados compactos.',
    importPath: 'shared/admin-metric-card/admin-metric-card.component',
    usedBy: ['Home', 'Security'],
    status: 'stable',
    example: '<app-admin-metric-card label="Usuarios" value="12" detail="Activos" tone="primary"></app-admin-metric-card>'
  },
  {
    name: 'AdminActionToolbarComponent',
    selector: 'app-admin-action-toolbar',
    category: 'Shell y navegación',
    purpose: 'Toolbar reusable para acciones de panel, botones y links con alineación responsive.',
    importPath: 'shared/admin-action-toolbar/admin-action-toolbar.component',
    usedBy: ['Home', 'Security'],
    status: 'stable',
    example: '<app-admin-action-toolbar><button class="primary">Guardar</button></app-admin-action-toolbar>'
  },
  {
    name: 'ComponentDocCardComponent',
    selector: 'app-component-doc-card',
    category: 'Documentación y arquitectura',
    purpose:
      'Tarjeta reusable para documentar componentes con selector, estado, consumidores, importación, ejemplo y preview proyectado.',
    importPath: 'shared/component-doc-card/component-doc-card.component',
    usedBy: ['Components'],
    status: 'stable',
    example:
      '<app-component-doc-card name="Button" selector="app-ui-kit-button" purpose="Reusable action">...</app-component-doc-card>'
  },
  {
    name: 'ProcessStepsComponent',
    selector: 'app-process-steps',
    category: 'Guía y estados',
    purpose: 'Etapas completas, activas y pendientes de un proceso guiado.',
    importPath: 'shared/process-steps/process-steps.component',
    usedBy: ['Services', 'Flows', 'Docs'],
    status: 'stable',
    example: '<app-process-steps [items]="steps" activeKey="design"></app-process-steps>'
  },
  {
    name: 'WorkflowGuideComponent',
    selector: 'app-workflow-guide',
    category: 'Guía y estados',
    purpose: 'Explica el objetivo actual y el siguiente comando del usuario.',
    importPath: 'shared/workflow-guide/workflow-guide.component',
    usedBy: ['Services', 'Flows', 'Docs'],
    status: 'stable',
    example:
      '<app-workflow-guide stepLabel="Paso 2" title="Diseña" description="Configura el comportamiento."></app-workflow-guide>'
  },
  {
    name: 'ContextAssistantComponent',
    selector: 'app-context-assistant',
    category: 'Guía y estados',
    purpose: 'Ayuda contextual, ejemplo, estado de preparación y siguiente acción.',
    importPath: 'shared/context-assistant/context-assistant.component',
    usedBy: ['Flows'],
    status: 'stable',
    example:
      '<app-context-assistant title="Entrada" description="Define los datos." example="email"></app-context-assistant>'
  },
  {
    name: 'AiAssistantLauncherComponent',
    selector: 'app-ai-assistant-launcher',
    category: 'Guía y estados',
    purpose:
      'Botón flotante global de chat para pedir ayuda en lenguaje natural y enviar la intención a la pantalla actual.',
    importPath: 'shared/ai-assistant-launcher/ai-assistant-launcher.component',
    usedBy: ['AppComponent'],
    status: 'initial',
    example: '<app-ai-assistant-launcher></app-ai-assistant-launcher>'
  },
  {
    name: 'StatusNoticeComponent',
    selector: 'app-status-notice',
    category: 'Guía y estados',
    purpose: 'Estados vacío, informativo, correcto, advertencia y error.',
    importPath: 'shared/status-notice/status-notice.component',
    usedBy: ['Login', 'Setup', 'Database', 'Services', 'Flows', 'Security', 'Dynamic forms'],
    status: 'stable',
    example: '<app-status-notice tone="error" title="No se pudo cargar">Reintenta.</app-status-notice>'
  },
  {
    name: 'JsonAuthoringPanelComponent',
    selector: 'app-json-authoring-panel',
    category: 'Diseñadores',
    purpose:
      'Editor JSON estándar para asistentes y usuarios avanzados: valida, aplica a la guía, guarda draft y publica.',
    importPath: 'shared/json-authoring-panel/json-authoring-panel.component',
    usedBy: ['Dynamic forms', 'Services', 'Flows'],
    status: 'stable',
    example:
      '<app-json-authoring-panel artifactLabel="Formulario" endpoint="/api/forms/authoring/json" [value]="jsonText"></app-json-authoring-panel>'
  },
  {
    name: 'LoadingSkeletonComponent',
    selector: 'app-loading-skeleton',
    category: 'Guía y estados',
    purpose: 'Skeleton accesible para páginas, listas, tablas y formularios.',
    importPath: 'shared/loading-skeleton/loading-skeleton.component',
    usedBy: ['Router', 'Login', 'Setup', 'Confisys', 'Database', 'Services', 'Flows', 'Security', 'Dynamic forms'],
    status: 'stable',
    example: '<app-loading-skeleton variant="form" label="Cargando formulario" [rows]="6"></app-loading-skeleton>'
  },
  {
    name: 'SegmentedControlComponent',
    selector: 'app-segmented-control',
    category: 'Guía y estados',
    purpose: 'Selector compacto de una sola vista o modo.',
    importPath: 'shared/segmented-control/segmented-control.component',
    usedBy: ['Database', 'Flows', 'PreviewViewportComponent'],
    status: 'stable',
    example: '<app-segmented-control [items]="modes" [value]="mode" (valueChange)="mode = $event"></app-segmented-control>'
  },
  {
    name: 'UiKitButtonComponent',
    selector: 'app-ui-kit-button',
    category: 'Temas y presentación',
    purpose:
      'Botón multikit real: renderiza con PrimeNG, ion-button, Angular Material, Bootstrap o HTML base según la presentación activa.',
    importPath: 'shared/ui-kit-button/ui-kit-button.component',
    usedBy: ['Components', 'Future shared actions'],
    status: 'initial',
    example: '<app-ui-kit-button label="Guardar" kit="material" tone="primary"></app-ui-kit-button>'
  },
  {
    name: 'UiKitCardComponent',
    selector: 'app-ui-kit-card',
    category: 'Temas y presentación',
    purpose:
      'Card multikit real: usa PrimeNG Card, ion-card, mat-card, Bootstrap o HTML base según la presentación activa.',
    importPath: 'shared/ui-kit-card/ui-kit-card.component',
    usedBy: ['AdminMetricCardComponent', 'Components', 'Future admin panels'],
    status: 'initial',
    example:
      '<app-ui-kit-card tone="primary" variant="subtle"><strong>Título</strong><span>Contenido</span></app-ui-kit-card>'
  },
  {
    name: 'FieldShellComponent',
    selector: 'app-field-shell',
    category: 'Formularios',
    purpose: 'Label, requerido, ayuda y error accesible alrededor de un control.',
    importPath: 'shared/field-shell/field-shell.component',
    usedBy: ['Login', 'Setup', 'Components', 'Confisys', 'DynamicFieldControlComponent'],
    status: 'stable',
    example: '<app-field-shell label="Correo" forId="email" [required]="true"><input id="email" /></app-field-shell>'
  },
  {
    name: 'DynamicFieldControlComponent',
    selector: 'app-dynamic-field-control',
    category: 'Formularios',
    purpose: 'Renderiza controles desde una definición declarativa: texto, números, moneda, selección, evidencias y GPS.',
    importPath: 'shared/dynamic-field-control/dynamic-field-control.component',
    usedBy: ['Dynamic forms'],
    status: 'initial',
    example:
      '<app-dynamic-field-control [field]="field" [presentation]="presentation" [viewportWidth]="390" [value]="value" (valueChange)="value = $event"></app-dynamic-field-control>'
  },
  {
    name: 'DynamicFieldLibraryComponent',
    selector: 'app-dynamic-field-library',
    category: 'Formularios',
    purpose: 'Galería reutilizable de todos los campos declarativos disponibles, incluyendo evidencias, ubicación y presentaciones instaladas.',
    importPath: 'shared/dynamic-field-library/dynamic-field-library.component',
    usedBy: ['Components', 'Dynamic form designer'],
    status: 'initial',
    example: '<app-dynamic-field-library [viewportWidth]="390"></app-dynamic-field-library>'
  },
  {
    name: 'MobileFormShellComponent',
    selector: 'app-mobile-form-shell',
    category: 'Formularios',
    purpose: 'Contenedor móvil para formularios: encabezado compacto, descripción corta, metadata y cuerpo táctil.',
    importPath: 'shared/mobile-form/mobile-form-shell.component',
    usedBy: ['Dynamic forms preview', 'Future mobile dynamic screens'],
    status: 'initial',
    example:
      '<app-mobile-form-shell title="Inspección" description="Captura evidencias.">...</app-mobile-form-shell>'
  },
  {
    name: 'MobileStepProgressComponent',
    selector: 'app-mobile-step-progress',
    category: 'Formularios',
    purpose: 'Progreso compacto para formularios móviles por pasos, con barra y chips horizontales.',
    importPath: 'shared/mobile-form/mobile-step-progress.component',
    usedBy: ['FormlyRuntimeComponent'],
    status: 'initial',
    example: '<app-mobile-step-progress [items]="steps" activeKey="datos"></app-mobile-step-progress>'
  },
  {
    name: 'MobileActionBarComponent',
    selector: 'app-mobile-action-bar',
    category: 'Formularios',
    purpose: 'Barra inferior táctil para acciones primarias y secundarias en formularios móviles.',
    importPath: 'shared/mobile-form/mobile-action-bar.component',
    usedBy: ['FormlyRuntimeComponent'],
    status: 'initial',
    example:
      '<app-mobile-action-bar secondaryLabel="Anterior" primaryLabel="Continuar" primaryType="submit"></app-mobile-action-bar>'
  },
  {
    name: 'MobileEvidenceControlComponent',
    selector: 'app-mobile-evidence-control',
    category: 'Formularios',
    purpose: 'Control táctil reutilizable para archivo, foto/evidencia y GPS en formularios móviles.',
    importPath: 'shared/mobile-form/mobile-evidence-control.component',
    usedBy: [
      'IonicFieldRendererComponent',
      'PrimengFieldRendererComponent',
      'MaterialFieldRendererComponent',
      'BootstrapFieldRendererComponent',
      'NativeFieldRendererComponent'
    ],
    status: 'initial',
    example:
      '<app-mobile-evidence-control mode="image" controlId="foto" name="foto" (valueChange)="value = $event"></app-mobile-evidence-control>'
  },
  {
    name: 'FormlyRuntimeComponent',
    selector: 'app-formly-runtime',
    category: 'Formularios',
    purpose: 'Compone formularios, pasos declarativos, validación, comandos extra y renderer multikit.',
    importPath: 'shared/formly-runtime/formly-runtime.component',
    usedBy: ['Dynamic forms'],
    status: 'initial',
    example:
      '<app-formly-runtime [definition]="form" [model]="model" [presentation]="presentation" (submitted)="submit($event)"></app-formly-runtime>'
  },
  {
    name: 'ChicleFormlyFieldTypeComponent',
    selector: 'app-chicle-formly-field-type',
    category: 'Formularios',
    purpose: 'Puente entre el ciclo de validación de Formly y el control dinámico multikit de Chicle.',
    importPath: 'engine/forms/formly/chicle-formly-field.type',
    usedBy: ['FormlyRuntimeComponent'],
    status: 'initial',
    example: "{ type: 'chicle-field', props: { runtimeField: field } }"
  },
  {
    name: 'ChicleFormlyDisplayTypeComponent',
    selector: 'app-chicle-formly-display-type',
    category: 'Formularios',
    purpose: 'Renderiza títulos, párrafos y divisores declarativos dentro de un formulario Formly.',
    importPath: 'engine/forms/formly/chicle-formly-display.type',
    usedBy: ['FormlyRuntimeComponent'],
    status: 'initial',
    example: "{ type: 'chicle-display', props: { runtimeField: field } }"
  },
  {
    name: 'PrimengFieldRendererComponent',
    selector: 'app-primeng-field-renderer',
    category: 'Formularios',
    purpose: 'Adaptador de controles dinámicos para pantallas web basadas en PrimeNG, con fallback para archivo, imagen y GPS.',
    importPath: 'shared/field-renderers/primeng-field-renderer.component',
    usedBy: ['DynamicFieldControlComponent'],
    status: 'initial',
    example:
      '<app-primeng-field-renderer [field]="field" controlId="field-id" [value]="value"></app-primeng-field-renderer>'
  },
  {
    name: 'IonicFieldRendererComponent',
    selector: 'app-ionic-field-renderer',
    category: 'Formularios',
    purpose:
      'Adaptador Ionic real para controles dinámicos: ion-input, ion-select, ion-textarea, ion-checkbox, ion-toggle y ion-radio, con fallback para archivo, imagen y GPS.',
    importPath: 'shared/field-renderers/ionic-field-renderer.component',
    usedBy: ['DynamicFieldControlComponent'],
    status: 'initial',
    example:
      '<app-ionic-field-renderer [field]="field" controlId="field-id" [value]="value"></app-ionic-field-renderer>'
  },
  {
    name: 'NativeFieldRendererComponent',
    selector: 'app-native-field-renderer',
    category: 'Formularios',
    purpose: 'Adaptador HTML base y dependencia mínima para controles dinámicos cuando no se desea una librería visual.',
    importPath: 'shared/field-renderers/native-field-renderer.component',
    usedBy: ['DynamicFieldControlComponent'],
    status: 'initial',
    example:
      '<app-native-field-renderer [field]="field" controlId="field-id" [value]="value"></app-native-field-renderer>'
  },
  {
    name: 'MaterialFieldRendererComponent',
    selector: 'app-material-field-renderer',
    category: 'Formularios',
    purpose: 'Adaptador real de controles dinámicos usando Angular Material.',
    importPath: 'shared/field-renderers/material-field-renderer.component',
    usedBy: ['DynamicFieldControlComponent'],
    status: 'initial',
    example:
      '<app-material-field-renderer [field]="field" controlId="field-id" [value]="value"></app-material-field-renderer>'
  },
  {
    name: 'BootstrapFieldRendererComponent',
    selector: 'app-bootstrap-field-renderer',
    category: 'Formularios',
    purpose: 'Adaptador real de controles dinámicos usando estructura y clases Bootstrap.',
    importPath: 'shared/field-renderers/bootstrap-field-renderer.component',
    usedBy: ['DynamicFieldControlComponent'],
    status: 'initial',
    example:
      '<app-bootstrap-field-renderer [field]="field" controlId="field-id" [value]="value"></app-bootstrap-field-renderer>'
  },
  {
    name: 'UiPresentationSwitcherComponent',
    selector: 'app-ui-presentation-switcher',
    category: 'Temas y presentación',
    purpose:
      'Alterna entre resolución adaptativa, PrimeNG, Ionic, Material, Bootstrap y controles base durante diseño y pruebas.',
    importPath: 'shared/ui-presentation-switcher/ui-presentation-switcher.component',
    usedBy: ['Dynamic forms'],
    status: 'initial',
    example:
      '<app-ui-presentation-switcher [value]="kit" [resolvedKit]="resolvedKit" (valueChange)="kit = $event"></app-ui-presentation-switcher>'
  },
  {
    name: 'UiThemeSelectorComponent',
    selector: 'app-ui-theme-selector',
    category: 'Temas y presentación',
    purpose: 'Lista los temas registrados y aplica tokens coordinados a Chicle, PrimeNG e Ionic.',
    importPath: 'shared/ui-theme-selector/ui-theme-selector.component',
    usedBy: ['Components'],
    status: 'initial',
    example: '<app-ui-theme-selector controlId="screen-theme"></app-ui-theme-selector>'
  },
  {
    name: 'PreviewViewportComponent',
    selector: 'app-preview-viewport',
    category: 'Formularios',
    purpose: 'Vista previa estable en escritorio, tablet y móvil.',
    importPath: 'shared/preview-viewport/preview-viewport.component',
    usedBy: ['Dynamic forms'],
    status: 'initial',
    example: '<app-preview-viewport [(mode)]="previewMode">...</app-preview-viewport>'
  },
  {
    name: 'FlowDataMapperComponent',
    selector: 'app-flow-data-mapper',
    category: 'Flow especializado',
    purpose: 'Mapea entradas de un paso desde input, contexto y resultados previos.',
    importPath: 'pages/flows/flow-data-mapper.component',
    usedBy: ['Flows'],
    status: 'domain',
    example: '<app-flow-data-mapper [rows]="rows" [options]="options"></app-flow-data-mapper>'
  },
  {
    name: 'FlowGraphComponent',
    selector: 'app-flow-graph',
    category: 'Flow especializado',
    purpose: 'Representa y selecciona nodos conectados de un flow.',
    importPath: 'pages/flows/flow-graph.component',
    usedBy: ['Flows'],
    status: 'domain',
    example: '<app-flow-graph [steps]="steps" [selectedStepId]="selectedStepId"></app-flow-graph>'
  },
  {
    name: 'FlowTimelineComponent',
    selector: 'app-flow-timeline',
    category: 'Flow especializado',
    purpose: 'Lista ordenada de pasos, estado y comandos de edición.',
    importPath: 'pages/flows/flow-timeline.component',
    usedBy: ['Flows'],
    status: 'domain',
    example: '<app-flow-timeline [steps]="steps" [selectedStepId]="selectedStepId"></app-flow-timeline>'
  },
  {
    name: 'AppMetricStripComponent',
    selector: 'app-metric-strip',
    category: 'Apps verticales',
    purpose: 'Banda reutilizable de métricas para dashboards, home de apps y pantallas de operación.',
    importPath: 'shared/app-visuals/app-metric-strip.component',
    usedBy: ['Components', 'Future screen designer', 'Template installer'],
    status: 'initial',
    example: '<app-metric-strip [items]="metrics"></app-metric-strip>'
  },
  {
    name: 'AppEntityCardComponent',
    selector: 'app-entity-card',
    category: 'Apps verticales',
    purpose:
      'Tarjeta reusable para elementos de negocio: eventos, inmuebles, tickets, servicios, juegos e inspecciones.',
    importPath: 'shared/app-visuals/app-entity-card.component',
    usedBy: ['Components', 'Future screen designer', 'Template installer'],
    status: 'initial',
    example: '<app-entity-card [card]="eventCard"></app-entity-card>'
  },
  {
    name: 'AppTimelineComponent',
    selector: 'app-app-timeline',
    category: 'Apps verticales',
    purpose: 'Timeline compacto de estado para procesos de apps verticales y operaciones móviles.',
    importPath: 'shared/app-visuals/app-timeline.component',
    usedBy: ['Components', 'Future screen designer', 'Template installer'],
    status: 'initial',
    example: '<app-app-timeline [items]="timeline"></app-app-timeline>'
  },
  {
    name: 'VerticalAppShowcaseComponent',
    selector: 'app-vertical-app-showcase',
    category: 'Apps verticales',
    purpose:
      'Showcase visual por tipo de app importante: eventos, inmobiliaria, tickets, servicios, minijuegos e inspección.',
    importPath: 'shared/app-visuals/vertical-app-showcase.component',
    usedBy: ['Components', 'Future screen designer', 'Template installer'],
    status: 'initial',
    example: '<app-vertical-app-showcase vertical="events"></app-vertical-app-showcase>'
  }
];
