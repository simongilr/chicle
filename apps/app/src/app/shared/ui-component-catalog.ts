export type UiComponentCategory =
  | 'Shell y navegación'
  | 'Documentación y arquitectura'
  | 'Diseñadores'
  | 'Guía y estados'
  | 'Formularios'
  | 'Temas y presentación'
  | 'Flow especializado'
  | 'Apps verticales'
  | 'Ionic base';

export type UiKitAdapterName = 'native' | 'primeng' | 'ionic' | 'material' | 'bootstrap';
export type UiKitAdapterStatus = 'available' | 'planned' | 'fallback' | 'not_applicable';

export interface UiComponentCatalogEntry {
  name: string;
  componentKey?: string;
  previewKey?: string;
  selector: string;
  category: UiComponentCategory;
  purpose: string;
  importPath: string;
  usedBy: string[];
  supportedKits?: UiKitAdapterName[];
  adapterStatus?: Partial<Record<UiKitAdapterName, UiKitAdapterStatus>>;
  migrationStatus?: 'declarative' | 'single_kit' | 'legacy_wrapper';
  status: 'stable' | 'initial' | 'domain';
  example: string;
}

const IONIC_COMPONENT_DEFINITIONS: Array<[name: string, selector: string]> = [
  ['IonAccordion', 'ion-accordion'],
  ['IonAccordionGroup', 'ion-accordion-group'],
  ['IonActionSheet', 'ion-action-sheet'],
  ['IonAlert', 'ion-alert'],
  ['IonApp', 'ion-app'],
  ['IonAvatar', 'ion-avatar'],
  ['IonBackdrop', 'ion-backdrop'],
  ['IonBadge', 'ion-badge'],
  ['IonBreadcrumb', 'ion-breadcrumb'],
  ['IonBreadcrumbs', 'ion-breadcrumbs'],
  ['IonButton', 'ion-button'],
  ['IonButtons', 'ion-buttons'],
  ['IonCard', 'ion-card'],
  ['IonCardContent', 'ion-card-content'],
  ['IonCardHeader', 'ion-card-header'],
  ['IonCardSubtitle', 'ion-card-subtitle'],
  ['IonCardTitle', 'ion-card-title'],
  ['IonCheckbox', 'ion-checkbox'],
  ['IonChip', 'ion-chip'],
  ['IonCol', 'ion-col'],
  ['IonContent', 'ion-content'],
  ['IonDatetime', 'ion-datetime'],
  ['IonDatetimeButton', 'ion-datetime-button'],
  ['IonFab', 'ion-fab'],
  ['IonFabButton', 'ion-fab-button'],
  ['IonFabList', 'ion-fab-list'],
  ['IonFooter', 'ion-footer'],
  ['IonGrid', 'ion-grid'],
  ['IonHeader', 'ion-header'],
  ['IonIcon', 'ion-icon'],
  ['IonImg', 'ion-img'],
  ['IonInfiniteScroll', 'ion-infinite-scroll'],
  ['IonInfiniteScrollContent', 'ion-infinite-scroll-content'],
  ['IonInput', 'ion-input'],
  ['IonInputOtp', 'ion-input-otp'],
  ['IonInputPasswordToggle', 'ion-input-password-toggle'],
  ['IonItem', 'ion-item'],
  ['IonItemDivider', 'ion-item-divider'],
  ['IonItemGroup', 'ion-item-group'],
  ['IonItemOption', 'ion-item-option'],
  ['IonItemOptions', 'ion-item-options'],
  ['IonItemSliding', 'ion-item-sliding'],
  ['IonLabel', 'ion-label'],
  ['IonList', 'ion-list'],
  ['IonListHeader', 'ion-list-header'],
  ['IonLoading', 'ion-loading'],
  ['IonMenu', 'ion-menu'],
  ['IonMenuButton', 'ion-menu-button'],
  ['IonMenuToggle', 'ion-menu-toggle'],
  ['IonNavLink', 'ion-nav-link'],
  ['IonNote', 'ion-note'],
  ['IonPicker', 'ion-picker'],
  ['IonPickerColumn', 'ion-picker-column'],
  ['IonPickerColumnOption', 'ion-picker-column-option'],
  ['IonPickerLegacy', 'ion-picker-legacy'],
  ['IonProgressBar', 'ion-progress-bar'],
  ['IonRadio', 'ion-radio'],
  ['IonRadioGroup', 'ion-radio-group'],
  ['IonRange', 'ion-range'],
  ['IonRefresher', 'ion-refresher'],
  ['IonRefresherContent', 'ion-refresher-content'],
  ['IonReorder', 'ion-reorder'],
  ['IonReorderGroup', 'ion-reorder-group'],
  ['IonRippleEffect', 'ion-ripple-effect'],
  ['IonRow', 'ion-row'],
  ['IonSearchbar', 'ion-searchbar'],
  ['IonSegment', 'ion-segment'],
  ['IonSegmentButton', 'ion-segment-button'],
  ['IonSegmentContent', 'ion-segment-content'],
  ['IonSegmentView', 'ion-segment-view'],
  ['IonSelect', 'ion-select'],
  ['IonSelectModal', 'ion-select-modal'],
  ['IonSelectOption', 'ion-select-option'],
  ['IonSkeletonText', 'ion-skeleton-text'],
  ['IonSpinner', 'ion-spinner'],
  ['IonSplitPane', 'ion-split-pane'],
  ['IonTab', 'ion-tab'],
  ['IonTabBar', 'ion-tab-bar'],
  ['IonTabButton', 'ion-tab-button'],
  ['IonText', 'ion-text'],
  ['IonTextarea', 'ion-textarea'],
  ['IonThumbnail', 'ion-thumbnail'],
  ['IonTitle', 'ion-title'],
  ['IonToast', 'ion-toast'],
  ['IonToggle', 'ion-toggle'],
  ['IonToolbar', 'ion-toolbar']
];

const IONIC_SELECTORS_ALREADY_STANDARDIZED = new Set([
  'ion-accordion',
  'ion-accordion-group',
  'ion-action-sheet',
  'ion-alert',
  'ion-avatar',
  'ion-badge',
  'ion-breadcrumb',
  'ion-breadcrumbs',
  'ion-button',
  'ion-card',
  'ion-card-content',
  'ion-card-header',
  'ion-card-subtitle',
  'ion-card-title',
  'ion-checkbox',
  'ion-chip',
  'ion-col',
  'ion-content',
  'ion-datetime',
  'ion-fab',
  'ion-footer',
  'ion-grid',
  'ion-header',
  'ion-icon',
  'ion-img',
  'ion-input',
  'ion-item',
  'ion-item-divider',
  'ion-list',
  'ion-list-header',
  'ion-loading',
  'ion-menu',
  'ion-nav-link',
  'ion-note',
  'ion-progress-bar',
  'ion-radio',
  'ion-radio-group',
  'ion-range',
  'ion-row',
  'ion-searchbar',
  'ion-segment',
  'ion-select',
  'ion-select-option',
  'ion-skeleton-text',
  'ion-spinner',
  'ion-split-pane',
  'ion-text',
  'ion-textarea',
  'ion-thumbnail',
  'ion-title',
  'ion-toast',
  'ion-toggle',
  'ion-toolbar'
]);

const IONIC_STANDARD_COMPONENT_KEYS: Record<string, string> = {
  'ion-accordion': 'ui.accordion',
  'ion-accordion-group': 'ui.accordion_group',
  'ion-action-sheet': 'overlay.action_sheet',
  'ion-alert': 'feedback.alert',
  'ion-app': 'shell.app_root',
  'ion-avatar': 'ui.avatar',
  'ion-backdrop': 'overlay.backdrop',
  'ion-badge': 'ui.badge',
  'ion-breadcrumb': 'nav.breadcrumb_item',
  'ion-breadcrumbs': 'nav.breadcrumbs',
  'ion-buttons': 'ui.button_group',
  'ion-chip': 'ui.chip',
  'ion-col': 'layout.column',
  'ion-content': 'layout.content',
  'ion-datetime-button': 'form.datetime_button',
  'ion-fab': 'ui.fab',
  'ion-fab-button': 'ui.fab_button',
  'ion-fab-list': 'ui.fab_list',
  'ion-footer': 'layout.footer',
  'ion-grid': 'layout.grid',
  'ion-header': 'layout.header',
  'ion-icon': 'ui.icon',
  'ion-img': 'media.image',
  'ion-infinite-scroll': 'data.infinite_scroll',
  'ion-infinite-scroll-content': 'data.infinite_scroll_content',
  'ion-input-otp': 'form.otp_input',
  'ion-input-password-toggle': 'form.password_toggle',
  'ion-item': 'data.list_item',
  'ion-item-divider': 'data.list_divider',
  'ion-item-group': 'data.list_group',
  'ion-item-option': 'data.list_item_option',
  'ion-item-options': 'data.list_item_options',
  'ion-item-sliding': 'data.sliding_item',
  'ion-label': 'ui.label',
  'ion-list': 'data.list',
  'ion-list-header': 'data.list_header',
  'ion-loading': 'feedback.loading',
  'ion-menu': 'nav.menu',
  'ion-menu-button': 'nav.menu_button',
  'ion-menu-toggle': 'nav.menu_toggle',
  'ion-nav-link': 'nav.link',
  'ion-note': 'ui.note',
  'ion-picker': 'form.picker',
  'ion-picker-column': 'form.picker_column',
  'ion-picker-column-option': 'form.picker_option',
  'ion-picker-legacy': 'form.legacy_picker',
  'ion-progress-bar': 'feedback.progress',
  'ion-refresher': 'feedback.refresher',
  'ion-refresher-content': 'feedback.refresher_content',
  'ion-reorder': 'data.reorder',
  'ion-reorder-group': 'data.reorder_group',
  'ion-ripple-effect': 'ui.ripple',
  'ion-row': 'layout.row',
  'ion-segment': 'ui.segment',
  'ion-segment-button': 'ui.segment_button',
  'ion-segment-content': 'ui.segment_content',
  'ion-segment-view': 'ui.segment_view',
  'ion-select-modal': 'overlay.select_modal',
  'ion-skeleton-text': 'feedback.skeleton',
  'ion-spinner': 'feedback.spinner',
  'ion-split-pane': 'layout.split_pane',
  'ion-tab': 'nav.tab',
  'ion-tab-bar': 'nav.tab_bar',
  'ion-tab-button': 'nav.tab_button',
  'ion-text': 'ui.text',
  'ion-thumbnail': 'media.thumbnail',
  'ion-title': 'ui.title',
  'ion-toast': 'feedback.toast',
  'ion-toolbar': 'nav.toolbar'
};

const IONIC_SINGLE_KIT_ADAPTER_STATUS = {
  ionic: 'available',
  primeng: 'planned',
  material: 'planned',
  bootstrap: 'planned',
  native: 'planned'
} satisfies Partial<Record<UiKitAdapterName, UiKitAdapterStatus>>;

function ionicDisplayName(name: string) {
  return name
    .replace(/^Ion/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

export const IONIC_COMPONENT_CATALOG: UiComponentCatalogEntry[] = IONIC_COMPONENT_DEFINITIONS.filter(
  ([, selector]) => !IONIC_SELECTORS_ALREADY_STANDARDIZED.has(selector)
).map(([name, selector]) => ({
  name: ionicDisplayName(name),
  componentKey: IONIC_STANDARD_COMPONENT_KEYS[selector] ?? `ui.${selector.replace(/^ion-/, '').replace(/-/g, '_')}`,
  previewKey: name,
  selector,
  category: 'Ionic base',
  purpose: `Standard Chicle component prepared with an Ionic adapter first; ${selector} remains the technical implementation selector.`,
  importPath: '@ionic/angular/standalone',
  usedBy: ['App Studio', 'Component library', 'Mobile runtime'],
  supportedKits: ['ionic'],
  adapterStatus: IONIC_SINGLE_KIT_ADAPTER_STATUS,
  migrationStatus: 'single_kit',
  status: 'initial',
  example: `<${selector}></${selector}>`
}));

const MULTIKIT_AVAILABLE_ADAPTER_STATUS = {
  primeng: 'available',
  ionic: 'available',
  material: 'available',
  bootstrap: 'available',
  native: 'available'
} satisfies Partial<Record<UiKitAdapterName, UiKitAdapterStatus>>;

function renderableComponent(
  name: string,
  componentKey: string,
  category: UiComponentCategory,
  purpose: string,
  example: string
): UiComponentCatalogEntry {
  return {
    name,
    componentKey,
    selector: componentKey,
    category,
    purpose,
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example
  };
}

const DECLARATIVE_RENDERABLE_COMPONENTS: UiComponentCatalogEntry[] = [
  renderableComponent(
    'Chip',
    'ui.chip',
    'Temas y presentación',
    'Pill compacta declarativa para tags, estados cortos y metadatos no sensibles.',
    '{ "componentKey": "ui.chip", "props": { "label": "offline", "tone": "success" } }'
  ),
  renderableComponent(
    'Text',
    'ui.text',
    'Temas y presentación',
    'Texto declarativo con tono de lectura consistente entre kits.',
    '{ "componentKey": "ui.text", "props": { "text": "Contenido" } }'
  ),
  renderableComponent(
    'Title',
    'ui.title',
    'Temas y presentación',
    'Encabezado declarativo con eyebrow, título y subtítulo para secciones de app.',
    '{ "componentKey": "ui.title", "props": { "title": "Clientes", "subtitle": "Resumen" } }'
  ),
  renderableComponent(
    'Note',
    'ui.note',
    'Guía y estados',
    'Nota contextual para ayuda, validaciones y mensajes de configuración.',
    '{ "componentKey": "ui.note", "props": { "message": "Revisa estos datos.", "tone": "info" } }'
  ),
  renderableComponent(
    'Avatar',
    'ui.avatar',
    'Temas y presentación',
    'Avatar declarativo para usuarios, entidades o apps con imagen o iniciales.',
    '{ "componentKey": "ui.avatar", "props": { "initials": "CE", "label": "Chicle" } }'
  ),
  renderableComponent(
    'Icon',
    'ui.icon',
    'Temas y presentación',
    'Icono declarativo con tono visual y tamaño controlado.',
    '{ "componentKey": "ui.icon", "props": { "icon": "pi pi-shield", "label": "Seguro" } }'
  ),
  renderableComponent(
    'Accordion',
    'ui.accordion',
    'Temas y presentación',
    'Sección desplegable declarativa para ayuda, filtros avanzados o detalle compacto.',
    '{ "componentKey": "ui.accordion", "props": { "title": "Más datos", "content": "Detalle" } }'
  ),
  renderableComponent(
    'Accordion Group',
    'ui.accordion_group',
    'Temas y presentación',
    'Grupo de secciones desplegables manejado desde items declarativos.',
    '{ "componentKey": "ui.accordion_group", "props": { "items": [{ "title": "Uno", "content": "Detalle" }] } }'
  ),
  renderableComponent(
    'Segment',
    'ui.segment',
    'Shell y navegación',
    'Selector segmentado declarativo para modos, tabs compactos o filtros principales.',
    '{ "componentKey": "ui.segment", "props": { "activeKey": "web", "items": [{ "key": "web", "label": "Web" }] } }'
  ),
  renderableComponent(
    'Progress',
    'feedback.progress',
    'Guía y estados',
    'Barra de progreso declarativa para carga, pasos y cobertura.',
    '{ "componentKey": "feedback.progress", "props": { "label": "Avance", "percent": 70 } }'
  ),
  renderableComponent(
    'Spinner',
    'feedback.spinner',
    'Guía y estados',
    'Indicador de procesamiento declarativo para acciones o estados transitorios.',
    '{ "componentKey": "feedback.spinner", "props": { "message": "Procesando..." } }'
  ),
  renderableComponent(
    'Layout Row',
    'layout.row',
    'Shell y navegación',
    'Fila responsive declarativa para agrupar controles y acciones con separación estable.',
    '{ "componentKey": "layout.row", "props": { "gap": "12px" }, "children": [] }'
  ),
  renderableComponent(
    'Layout Column',
    'layout.column',
    'Shell y navegación',
    'Columna declarativa para organizar children verticales sin estilos por pantalla.',
    '{ "componentKey": "layout.column", "props": { "gap": "12px" }, "children": [] }'
  ),
  renderableComponent(
    'Split Pane',
    'layout.split_pane',
    'Shell y navegación',
    'Distribución declarativa de dos zonas que colapsa en móvil.',
    '{ "componentKey": "layout.split_pane", "props": { "left": "1fr", "right": "1fr" }, "children": [] }'
  ),
  renderableComponent(
    'Layout Header',
    'layout.header',
    'Shell y navegación',
    'Región superior declarativa para shells, páginas o cards compuestas.',
    '{ "componentKey": "layout.header", "children": [] }'
  ),
  renderableComponent(
    'Layout Content',
    'layout.content',
    'Shell y navegación',
    'Región central declarativa para contenido principal.',
    '{ "componentKey": "layout.content", "children": [] }'
  ),
  renderableComponent(
    'Layout Footer',
    'layout.footer',
    'Shell y navegación',
    'Región inferior declarativa para acciones o estado de pantalla.',
    '{ "componentKey": "layout.footer", "props": { "text": "Listo" }, "children": [] }'
  ),
  renderableComponent(
    'Navigation Link',
    'nav.link',
    'Shell y navegación',
    'Link/botón de navegación declarativo conectado al action runner.',
    '{ "componentKey": "nav.link", "props": { "label": "Abrir" }, "actions": { "onClick": { "type": "navigate", "route": "/home" } } }'
  ),
  renderableComponent(
    'List Header',
    'data.list_header',
    'Apps verticales',
    'Cabecera de lista declarativa para agrupaciones y metadatos cortos.',
    '{ "componentKey": "data.list_header", "props": { "title": "Recientes", "meta": "3" } }'
  ),
  renderableComponent(
    'List Item',
    'data.list_item',
    'Apps verticales',
    'Fila de lista declarativa con título, subtítulo y estado.',
    '{ "componentKey": "data.list_item", "props": { "title": "Cliente", "status": "Activo" } }'
  ),
  renderableComponent(
    'List Divider',
    'data.list_divider',
    'Apps verticales',
    'Separador semántico declarativo para listas largas o secciones.',
    '{ "componentKey": "data.list_divider", "props": { "label": "Hoy" } }'
  ),
  renderableComponent(
    'Image',
    'media.image',
    'Apps verticales',
    'Imagen declarativa con placeholder, caption y proporción controlada.',
    '{ "componentKey": "media.image", "props": { "placeholder": "16:9", "caption": "Imagen" } }'
  ),
  renderableComponent(
    'Thumbnail',
    'media.thumbnail',
    'Apps verticales',
    'Miniatura declarativa para galerías, listas y evidencia.',
    '{ "componentKey": "media.thumbnail", "props": { "title": "Archivo", "placeholder": "IMG" } }'
  ),
  renderableComponent(
    'Floating Action Button',
    'ui.fab',
    'Temas y presentación',
    'Acción flotante declarativa para crear elementos o abrir comandos rápidos.',
    '{ "componentKey": "ui.fab", "props": { "label": "Nuevo", "icon": "pi pi-plus" } }'
  ),
  {
    name: 'Action Group',
    componentKey: 'ui.action_group',
    selector: 'ui.action_group',
    category: 'Temas y presentación',
    purpose: 'Grupo declarativo de botones con separación, wrap, permisos y acciones normalizadas.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example:
      '{ "componentKey": "ui.action_group", "props": { "actions": [{ "label": "Guardar", "action": { "type": "show_message", "message": "Listo" } }] } }'
  },
  {
    name: 'Badge',
    componentKey: 'ui.badge',
    selector: 'ui.badge',
    category: 'Temas y presentación',
    purpose: 'Etiqueta compacta declarativa para estados, conteos y metadatos de pantalla.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "ui.badge", "props": { "label": "Activo", "tone": "success" } }'
  },
  {
    name: 'Metric Card',
    componentKey: 'ui.metric_card',
    selector: 'ui.metric_card',
    category: 'Apps verticales',
    purpose: 'Tarjeta KPI declarativa para dashboards, home de apps y resúmenes administrativos.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "ui.metric_card", "props": { "label": "Clientes", "value": "24" } }'
  },
  {
    name: 'Region',
    componentKey: 'layout.region',
    selector: 'layout.region',
    category: 'Shell y navegación',
    purpose: 'Sección declarativa con título opcional, spacing uniforme y children renderizables.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "layout.region", "props": { "title": "Contenido" }, "children": [] }'
  },
  {
    name: 'Detail',
    componentKey: 'data.detail',
    selector: 'data.detail',
    category: 'Apps verticales',
    purpose: 'Detalle campo/valor para registros, selección actual y respuestas de servicios.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "data.detail", "props": { "record": { "name": "Cliente" } } }'
  },
  {
    name: 'Metric Strip',
    componentKey: 'data.metric_strip',
    selector: 'data.metric_strip',
    category: 'Apps verticales',
    purpose: 'Banda de métricas declarativas desde datos estáticos o bindings.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "data.metric_strip", "bindings": { "props.items": "{{data.metrics}}" } }'
  },
  {
    name: 'Form Runtime Block',
    componentKey: 'form.runtime',
    selector: 'form.runtime',
    category: 'Formularios',
    purpose: 'Formulario embebido desde campos declarativos y acción onSubmit.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "form.runtime", "props": { "fields": [{ "name": "email", "type": "email", "label": "Email" }] } }'
  },
  {
    name: 'Service Result',
    componentKey: 'service.result',
    selector: 'service.result',
    category: 'Apps verticales',
    purpose: 'Panel declarativo para mostrar respuesta, error o resumen de un servicio dinámico.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "service.result", "bindings": { "props.result": "{{data.serviceResult}}" } }'
  },
  {
    name: 'Flow Trigger Button',
    componentKey: 'flow.trigger_button',
    selector: 'flow.trigger_button',
    category: 'Flow especializado',
    purpose: 'Botón declarativo para ejecutar un flow publicado o simular la acción en preview.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "flow.trigger_button", "actions": { "onClick": { "type": "execute_flow", "flowKey": "aprobar" } } }'
  },
  {
    name: 'Record List',
    componentKey: 'record.list',
    selector: 'record.list',
    category: 'Apps verticales',
    purpose: 'Lista declarativa de registros de negocio, formularios o servicios.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "record.list", "props": { "items": [{ "title": "Cliente", "status": "Activo" }] } }'
  },
  {
    name: 'Record Detail',
    componentKey: 'record.detail',
    selector: 'record.detail',
    category: 'Apps verticales',
    purpose: 'Detalle declarativo de un registro seleccionado.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "record.detail", "bindings": { "props.record": "{{data.record}}" } }'
  },
  {
    name: 'Side Menu',
    componentKey: 'nav.side_menu',
    selector: 'nav.side_menu',
    category: 'Shell y navegación',
    purpose: 'Menú lateral declarativo para apps generadas y workspaces administrativos.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "nav.side_menu", "bindings": { "props.items": "{{data.menuItems}}" } }'
  },
  {
    name: 'Bottom Tabs',
    componentKey: 'nav.bottom_tabs',
    selector: 'nav.bottom_tabs',
    category: 'Shell y navegación',
    purpose: 'Tabs inferiores declarativos para shells móviles.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "nav.bottom_tabs", "bindings": { "props.items": "{{data.menuItems}}" } }'
  },
  {
    name: 'Chart Panel',
    componentKey: 'chart.panel',
    selector: 'chart.panel',
    category: 'Apps verticales',
    purpose: 'Gráfico simple declarativo para KPIs, métricas y previews de dashboard.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "chart.panel", "props": { "items": [{ "label": "Avance", "value": 72 }] } }'
  },
  {
    name: 'Map View',
    componentKey: 'map.view',
    selector: 'map.view',
    category: 'Apps verticales',
    purpose: 'Mapa declarativo con pins para GPS, inspecciones y ubicaciones.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "map.view", "props": { "pins": [{ "label": "1", "x": "52%", "y": "48%" }] } }'
  },
  {
    name: 'Gallery',
    componentKey: 'media.gallery',
    selector: 'media.gallery',
    category: 'Apps verticales',
    purpose: 'Galería declarativa para imágenes, documentos y evidencias en apps generadas.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "media.gallery", "props": { "items": [{ "title": "Evidencia", "placeholder": "IMG" }] } }'
  },
  {
    name: 'Modal',
    componentKey: 'overlay.modal',
    selector: 'overlay.modal',
    category: 'Temas y presentación',
    purpose: 'Contenedor declarativo para diálogos, confirmaciones y componentes compuestos.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "overlay.modal", "props": { "title": "Confirmar", "message": "Revisa la acción." } }'
  },
  {
    name: 'Login',
    componentKey: 'auth.login',
    selector: 'auth.login',
    category: 'Apps verticales',
    purpose: 'Bloque declarativo de ingreso para apps generadas, enlazable a Auth o servicio aprobado.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "auth.login", "props": { "title": "Ingresar", "submitLabel": "Entrar" } }'
  },
  {
    name: 'App Shell',
    componentKey: 'app.shell',
    selector: 'app.shell',
    category: 'Shell y navegación',
    purpose: 'Shell declarativo de app generada con encabezado, navegación y children renderizables.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "app.shell", "props": { "title": "Mi app" }, "children": [] }'
  },
  {
    name: 'Home Menu',
    componentKey: 'app.home_menu',
    selector: 'app.home_menu',
    category: 'Shell y navegación',
    purpose: 'Menú de inicio declarativo para rutas, formularios, servicios y flows de una app.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "app.home_menu", "bindings": { "props.items": "{{data.menuItems}}" } }'
  },
  {
    name: 'Offline Status',
    componentKey: 'status.offline',
    selector: 'status.offline',
    category: 'Guía y estados',
    purpose: 'Estado declarativo para indicar disponibilidad offline del manifiesto publicado.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "status.offline", "props": { "title": "Offline listo", "tone": "success" } }'
  },
  {
    name: 'Sync Queue Status',
    componentKey: 'status.sync_queue',
    selector: 'status.sync_queue',
    category: 'Guía y estados',
    purpose: 'Estado declarativo para cola offline, reintentos y sincronización pendiente.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "status.sync_queue", "props": { "title": "Cola", "tone": "warning" } }'
  },
  {
    name: 'Breadcrumbs',
    componentKey: 'nav.breadcrumbs',
    selector: 'nav.breadcrumbs',
    category: 'Shell y navegación',
    purpose: 'Ruta declarativa para navegación contextual y jerarquías de pantallas.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "nav.breadcrumbs", "props": { "items": [{ "label": "Inicio", "route": "/home" }] } }'
  },
  {
    name: 'Mobile Form Shell',
    componentKey: 'form.mobile_shell',
    selector: 'form.mobile_shell',
    category: 'Formularios',
    purpose: 'Contenedor móvil declarativo para formularios por pasos, evidencias y acciones inferiores.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "form.mobile_shell", "props": { "title": "Inspección", "progress": "50%" }, "children": [] }'
  },
  {
    name: 'Service Result Actions',
    componentKey: 'service.result_actions',
    selector: 'service.result_actions',
    category: 'Apps verticales',
    purpose: 'Respuesta de servicio con acciones siguientes declarativas.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "service.result_actions", "props": { "message": "Listo", "actions": [] } }'
  },
  {
    name: 'Flow Stepper',
    componentKey: 'flow.stepper',
    selector: 'flow.stepper',
    category: 'Flow especializado',
    purpose: 'Secuencia visual declarativa de pasos, estados y resultados de un flow.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "flow.stepper", "props": { "steps": [{ "title": "Entrada", "status": "Listo" }] } }'
  },
  {
    name: 'Record Editor',
    componentKey: 'record.editor',
    selector: 'record.editor',
    category: 'Apps verticales',
    purpose: 'Editor declarativo de registros con campos, valores y acciones configurables.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "record.editor", "props": { "fields": [{ "name": "name", "label": "Nombre" }] } }'
  },
  {
    name: 'Action Sheet',
    componentKey: 'overlay.action_sheet',
    selector: 'overlay.action_sheet',
    category: 'Temas y presentación',
    purpose: 'Hoja de acciones declarativa para móviles, confirmaciones rápidas y menús contextuales.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "overlay.action_sheet", "props": { "title": "Acciones", "actions": [] } }'
  },
  {
    name: 'Camera Capture',
    componentKey: 'media.camera_capture',
    selector: 'media.camera_capture',
    category: 'Apps verticales',
    purpose: 'Control declarativo de captura de cámara para evidencias móviles y formularios offline.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "media.camera_capture", "props": { "title": "Foto", "captureLabel": "Capturar" } }'
  },
  {
    name: 'GPS Capture',
    componentKey: 'map.gps_capture',
    selector: 'map.gps_capture',
    category: 'Apps verticales',
    purpose: 'Control declarativo de ubicación GPS con latitud, longitud, estado y acción de captura.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['C-Declarativos', 'App Studio', 'Generated apps'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: MULTIKIT_AVAILABLE_ADAPTER_STATUS,
    migrationStatus: 'declarative',
    status: 'initial',
    example: '{ "componentKey": "map.gps_capture", "props": { "title": "GPS", "lat": "4.7110", "lng": "-74.0721" } }'
  }
];

const DECLARATIVE_KEY_BY_SELECTOR: Record<string, string> = {
  'app-main-nav': 'nav.admin_main',
  'app-page-shell': 'shell.admin_page',
  'app-public-page-shell': 'shell.public_page',
  'app-module-header': 'ui.module_header',
  'app-architecture-diagram': 'docs.architecture_diagram',
  'app-architecture-blueprint': 'docs.architecture_blueprint',
  'app-architecture-topology-diagram': 'docs.architecture_topology',
  'app-designer-workspace': 'studio.designer_workspace',
  'app-app-structure-panel': 'studio.app_structure',
  'app-component-palette': 'studio.component_palette',
  'app-screen-visual-canvas': 'studio.screen_canvas',
  'app-visual-workbench-panel': 'studio.visual_workbench',
  'app-screen-component-inspector': 'studio.component_inspector',
  'app-catalog-header': 'studio.catalog_header',
  'app-designer-catalog-panel': 'studio.catalog_panel',
  'app-assignment-checklist': 'security.assignment_checklist',
  'app-catalog-item': 'studio.catalog_item',
  'app-section-header': 'ui.section_header',
  'app-admin-filter-bar': 'admin.filter_bar',
  'app-admin-form-grid': 'admin.form_grid',
  'app-admin-data-table': 'data.admin_table',
  'app-admin-card-grid': 'layout.card_grid',
  'app-admin-stack': 'layout.stack',
  'app-admin-panel': 'ui.panel',
  'app-admin-metric-card': 'data.metric_card',
  'app-admin-resource-card': 'data.resource_card',
  'app-admin-code-block': 'data.code_block',
  'app-admin-action-toolbar': 'ui.action_toolbar',
  'app-component-doc-card': 'docs.component_card',
  'app-process-steps': 'flow.process_steps',
  'app-workflow-guide': 'flow.workflow_guide',
  'app-context-assistant': 'feedback.context_assistant',
  'app-ai-assistant-launcher': 'assistant.launcher',
  'app-status-notice': 'feedback.status_notice',
  'app-json-authoring-panel': 'studio.json_authoring',
  'app-code-textarea': 'form.code_textarea',
  'app-loading-skeleton': 'feedback.loading_skeleton',
  'app-segmented-control': 'ui.segmented_control',
  'app-ui-kit-button': 'ui.button',
  'app-ui-kit-card': 'ui.card',
  'app-field-shell': 'form.field_shell',
  'app-dynamic-field-control': 'form.field',
  'app-dynamic-field-library': 'form.field_library',
  'app-schema-field-editor': 'data.schema_field_editor',
  'app-mobile-form-shell': 'form.mobile_shell',
  'app-mobile-step-progress': 'form.mobile_step_progress',
  'app-mobile-action-bar': 'form.mobile_action_bar',
  'app-mobile-evidence-control': 'media.evidence_control',
  'app-formly-runtime': 'form.runtime',
  'app-chicle-formly-field-type': 'form.formly_field_adapter',
  'app-chicle-formly-display-type': 'form.formly_display_adapter',
  'app-primeng-field-renderer': 'form.primeng_adapter',
  'app-ionic-field-renderer': 'form.ionic_adapter',
  'app-native-field-renderer': 'form.native_adapter',
  'app-material-field-renderer': 'form.material_adapter',
  'app-bootstrap-field-renderer': 'form.bootstrap_adapter',
  'app-ui-presentation-switcher': 'ui.presentation_switcher',
  'app-ui-theme-selector': 'ui.theme_selector',
  'app-preview-viewport': 'ui.preview_viewport',
  'app-flow-data-mapper': 'flow.data_mapper',
  'app-flow-graph': 'flow.graph',
  'app-flow-timeline': 'flow.timeline',
  'app-metric-strip': 'data.metric_strip',
  'app-entity-card': 'data.entity_card',
  'app-app-timeline': 'data.timeline',
  'app-vertical-app-showcase': 'app.vertical_showcase',
  'app-declarative-runtime-lab': 'engine.declarative_runtime_lab'
};

function defaultDeclarativeNamespace(category: UiComponentCategory) {
  return {
    'Shell y navegación': 'shell',
    'Documentación y arquitectura': 'docs',
    Diseñadores: 'studio',
    'Guía y estados': 'feedback',
    Formularios: 'form',
    'Temas y presentación': 'ui',
    'Flow especializado': 'flow',
    'Apps verticales': 'app',
    'Ionic base': 'ui'
  }[category];
}

function selectorToKeyPart(selector: string) {
  return selector
    .replace(/^app-/, '')
    .replace(/^ion-/, '')
    .replace(/-/g, '_');
}

export function getDeclarativeComponentKey(component: UiComponentCatalogEntry) {
  return (
    component.componentKey ??
    DECLARATIVE_KEY_BY_SELECTOR[component.selector] ??
    `${defaultDeclarativeNamespace(component.category)}.${selectorToKeyPart(component.selector)}`
  );
}

export const UI_COMPONENT_CATALOG: UiComponentCatalogEntry[] = [
  ...IONIC_COMPONENT_CATALOG,
  ...DECLARATIVE_RENDERABLE_COMPONENTS,
  {
    name: 'DeclarativeComponentRendererComponent',
    componentKey: 'engine.declarative_renderer',
    selector: 'app-declarative-component-renderer',
    category: 'Diseñadores',
    purpose: 'Central runtime renderer for declarative component objects: resolves props, bindings, actions, permissions, children and kit adapters.',
    importPath: 'engine/components/declarative-component-renderer.component',
    usedBy: ['App Studio', 'Dynamic app runtime', 'Component library'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: {
      primeng: 'available',
      ionic: 'available',
      material: 'available',
      bootstrap: 'available',
      native: 'available'
    },
    migrationStatus: 'declarative',
    status: 'initial',
    example:
      '<app-declarative-component-renderer [contract]="componentContract" (action)="handleAction($event)"></app-declarative-component-renderer>'
  },
  {
    name: 'DeclarativeRuntimeLabComponent',
    componentKey: 'engine.declarative_runtime_lab',
    selector: 'app-declarative-runtime-lab',
    category: 'Diseñadores',
    purpose:
      'Dedicated visual lab for testing component contracts, bindings, permissions, actions, backend validation, runtime history and offline queue behavior.',
    importPath: 'shared/declarative-runtime-lab/declarative-runtime-lab.component',
    usedBy: ['C-Declarativos page', 'Component library', 'App Studio architecture'],
    supportedKits: ['primeng', 'ionic', 'material', 'bootstrap', 'native'],
    adapterStatus: {
      primeng: 'available',
      ionic: 'available',
      material: 'available',
      bootstrap: 'available',
      native: 'available'
    },
    migrationStatus: 'declarative',
    status: 'initial',
    example: '<app-declarative-runtime-lab></app-declarative-runtime-lab>'
  },
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
      '<app-module-header eyebrow="Fábrica" title="Formularios" description="Diseña formularios." badge="V1"></app-module-header>'
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
    usedBy: ['Services', 'Flows', 'Apps'],
    status: 'stable',
    example:
      '<app-designer-workspace><ng-container designer-navigation>...</ng-container><ng-container designer-workspace>...</ng-container></app-designer-workspace>'
  },
  {
    name: 'AppStructurePanelComponent',
    selector: 'app-app-structure-panel',
    category: 'Diseñadores',
    purpose: 'Panel reutilizable para mostrar la app activa, sus páginas, rutas, versiones y estado de publicación.',
    importPath: 'shared/app-structure-panel/app-structure-panel.component',
    usedBy: ['Apps', 'Future template builder'],
    status: 'initial',
    example:
      '<app-app-structure-panel [appName]="app.name" [screens]="screens" (screenSelected)="select($event)"></app-app-structure-panel>'
  },
  {
    name: 'ComponentPaletteComponent',
    selector: 'app-component-palette',
    category: 'Diseñadores',
    purpose: 'Paleta reusable para agregar bloques, controles, navegación, acciones y componentes visuales a diseñadores.',
    importPath: 'shared/component-palette/component-palette.component',
    usedBy: ['Apps', 'Future screen designer', 'Future component designer'],
    status: 'initial',
    example:
      '<app-component-palette [items]="items" (selected)="addBlock($event)"></app-component-palette>'
  },
  {
    name: 'ScreenVisualCanvasComponent',
    selector: 'app-screen-visual-canvas',
    category: 'Diseñadores',
    purpose:
      'Canvas visual de pantalla con navegación, regiones, bloques seleccionables, bindings, acciones y preview desktop/tablet/móvil.',
    importPath: 'shared/screen-visual-canvas/screen-visual-canvas.component',
    usedBy: ['Apps', 'Future screen designer'],
    status: 'initial',
    example:
      '<app-screen-visual-canvas [components]="components" [selectedId]="selectedId" (selected)="select($event)"></app-screen-visual-canvas>'
  },
  {
    name: 'VisualWorkbenchPanelComponent',
    selector: 'app-visual-workbench-panel',
    category: 'Diseñadores',
    purpose:
      'Panel superpuesto de trabajo visual para abrir canvases, previews administrables e inspectores sin romper el layout estándar de la página.',
    importPath: 'shared/visual-workbench-panel/visual-workbench-panel.component',
    usedBy: ['Apps', 'Future screen designer', 'Future component designer'],
    status: 'initial',
    example:
      '<app-visual-workbench-panel [open]="open" title="Canvas visual" (closed)="open = false">...</app-visual-workbench-panel>'
  },
  {
    name: 'ScreenComponentInspectorComponent',
    selector: 'app-screen-component-inspector',
    category: 'Diseñadores',
    purpose:
      'Inspector reusable para explicar y editar el bloque seleccionado de una pantalla dinámica.',
    importPath: 'shared/screen-component-inspector/screen-component-inspector.component',
    usedBy: ['Apps', 'Future screen designer'],
    status: 'initial',
    example:
      '<app-screen-component-inspector [component]="selectedComponent" [summary]="summary"></app-screen-component-inspector>'
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
      '<app-designer-catalog-panel title="Servicios" summary="2 servicios"><app-ui-kit-button catalog-actions label="Nuevo"></app-ui-kit-button>...</app-designer-catalog-panel>'
  },
  {
    name: 'AssignmentChecklistComponent',
    selector: 'app-assignment-checklist',
    category: 'Diseñadores',
    purpose:
      'Lista reutilizable de asignaciones con checkboxes multikit para roles, permisos, recursos y políticas por tenant.',
    importPath: 'shared/assignment-checklist/assignment-checklist.component',
    usedBy: ['Security', 'Future resource policies'],
    status: 'stable',
    example:
      '<app-assignment-checklist [options]="roleOptions" variant="pills" (optionToggle)="toggle($event)"></app-assignment-checklist>'
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
    example:
      '<app-admin-filter-bar><app-dynamic-field-control [field]="searchField"></app-dynamic-field-control></app-admin-filter-bar>'
  },
  {
    name: 'AdminFormGridComponent',
    selector: 'app-admin-form-grid',
    category: 'Formularios',
    purpose:
      'Grid responsive para formularios administrativos y paneles de propiedades sin acoplar cada página a CSS propio.',
    importPath: 'shared/admin-form-grid/admin-form-grid.component',
    usedBy: ['Preferences', 'Environment Deploy Center', 'Future screen designer', 'Future app designer'],
    status: 'stable',
    example:
      '<app-admin-form-grid><app-dynamic-field-control [field]="field"></app-dynamic-field-control></app-admin-form-grid>'
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
    name: 'AdminStackComponent',
    selector: 'app-admin-stack',
    category: 'Shell y navegación',
    purpose:
      'Stack vertical reusable para listas, grupos de paneles, resultados y secciones con gap consistente y ancho seguro.',
    importPath: 'shared/admin-stack/admin-stack.component',
    usedBy: ['Environment Deploy Center', 'Future DB designer', 'Future screen designer'],
    status: 'stable',
    example: '<app-admin-stack gap="12px"><app-catalog-item title="Item"></app-catalog-item></app-admin-stack>'
  },
  {
    name: 'AdminPanelComponent',
    selector: 'app-admin-panel',
    category: 'Shell y navegación',
    purpose: 'Panel reusable para módulos del Admin con título, descripción, acciones proyectadas y contenido.',
    importPath: 'shared/admin-panel/admin-panel.component',
    usedBy: ['Home', 'Preferences', 'Security', 'Environment Deploy Center'],
    status: 'stable',
    example:
      '<app-admin-panel title="Resumen" description="Estado actual"><app-ui-kit-button panel-actions label="Actualizar"></app-ui-kit-button>...</app-admin-panel>'
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
    name: 'AdminResourceCardComponent',
    selector: 'app-admin-resource-card',
    category: 'Guía y estados',
    purpose:
      'Tarjeta reusable para recursos administrativos: título, metadata, detalle, código seguro y acciones proyectadas.',
    importPath: 'shared/admin-resource-card/admin-resource-card.component',
    usedBy: ['Environment Deploy Center', 'Future DB designer', 'Future services history'],
    status: 'stable',
    example:
      '<app-admin-resource-card title="API_PUBLIC_URL" meta="runtime · api"><app-ui-kit-button resource-actions label="Editar"></app-ui-kit-button></app-admin-resource-card>'
  },
  {
    name: 'AdminCodeBlockComponent',
    selector: 'app-admin-code-block',
    category: 'Diseñadores',
    purpose:
      'Bloque reusable de código/JSON de solo lectura con scroll interno, wrapping seguro y radios por kit visual.',
    importPath: 'shared/admin-code-block/admin-code-block.component',
    usedBy: ['Environment Deploy Center', 'Future docs examples', 'Future deploy bundles'],
    status: 'stable',
    example: '<app-admin-code-block label="Runtime config" [value]="runtimeConfig"></app-admin-code-block>'
  },
  {
    name: 'AdminActionToolbarComponent',
    selector: 'app-admin-action-toolbar',
    category: 'Shell y navegación',
    purpose: 'Toolbar reusable para acciones de panel, botones y links con alineación responsive.',
    importPath: 'shared/admin-action-toolbar/admin-action-toolbar.component',
    usedBy: ['Home', 'Security'],
    status: 'stable',
    example: '<app-admin-action-toolbar><app-ui-kit-button label="Guardar"></app-ui-kit-button></app-admin-action-toolbar>'
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
    name: 'CodeTextareaComponent',
    selector: 'app-code-textarea',
    category: 'Diseñadores',
    purpose:
      'Textarea reusable para JSON, fixtures y snippets de prueba con tema consistente y sin lógica de página.',
    importPath: 'shared/code-textarea/code-textarea.component',
    usedBy: ['Services', 'Future flow tests', 'Future form tests'],
    status: 'stable',
    example:
      '<app-code-textarea label="JSON de prueba" [value]="jsonText" (valueChange)="jsonText = $event"></app-code-textarea>'
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
    usedBy: ['AdminPanelComponent', 'AdminMetricCardComponent', 'AdminResourceCardComponent', 'Components'],
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
    example:
      '<app-field-shell label="Correo" forId="email" [required]="true"><app-dynamic-field-control [field]="emailField"></app-dynamic-field-control></app-field-shell>'
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
    name: 'SchemaFieldEditorComponent',
    selector: 'app-schema-field-editor',
    category: 'Formularios',
    purpose:
      'Editor reutilizable de columnas custom con controles multikit para nombre, tipo, longitud, default, nullable y eliminación.',
    importPath: 'shared/schema-field-editor/schema-field-editor.component',
    usedBy: ['Database'],
    status: 'stable',
    example:
      '<app-schema-field-editor [field]="column" [columnTypes]="columnTypes" (fieldChange)="column = $event"></app-schema-field-editor>'
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
