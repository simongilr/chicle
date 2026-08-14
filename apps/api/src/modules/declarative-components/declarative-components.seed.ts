import { ComponentAdapterKit, ComponentAdapterStatus } from './component-adapter.entity';

export interface ComponentAdapterSeed {
  kit: ComponentAdapterKit;
  adapterStatus: ComponentAdapterStatus;
  technicalSelector?: string;
  importPath?: string;
  previewKey?: string;
  adapterMetadata?: Record<string, unknown>;
}

export interface ComponentDefinitionSeed {
  componentKey: string;
  name: string;
  category: string;
  description: string;
  propsSchema?: Record<string, unknown>;
  eventsSchema?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  allowedChildren?: Record<string, unknown>;
  documentation?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  adapters: ComponentAdapterSeed[];
}

const ALL_KITS: ComponentAdapterKit[] = ['primeng', 'ionic', 'material', 'bootstrap', 'native'];

function adapters(
  technicalSelectors: Partial<Record<ComponentAdapterKit, string>>,
  fallback: ComponentAdapterStatus = 'fallback'
): ComponentAdapterSeed[] {
  return ALL_KITS.map((kit) => ({
    kit,
    adapterStatus: technicalSelectors[kit] ? 'available' : fallback,
    technicalSelector: technicalSelectors[kit]
  }));
}

export const DECLARATIVE_COMPONENT_SEEDS: ComponentDefinitionSeed[] = [
  {
    componentKey: 'ui.button',
    name: 'Button',
    category: 'primitive',
    description: 'Reusable command button with multikit rendering and declarative actions.',
    propsSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        tone: { enum: ['primary', 'secondary', 'success', 'danger', 'neutral'] },
        variant: { enum: ['solid', 'outline', 'ghost'] },
        size: { enum: ['small', 'medium'] },
        full: { type: 'boolean' },
        disabled: { type: 'boolean' },
        icon: { type: 'string' }
      }
    },
    eventsSchema: {
      onClick: { actionTypes: ['navigate', 'execute_service', 'execute_flow', 'submit_form', 'open_modal', 'show_message', 'set_state'] }
    },
    defaultProps: { label: 'Action', tone: 'primary', variant: 'solid', size: 'medium', full: false },
    documentation: {
      selector: 'app.ui.button',
      minimalInvocation: {
        componentKey: 'ui.button',
        props: { label: 'Guardar', tone: 'primary' },
        actions: { onClick: { type: 'show_message', message: 'Guardado' } }
      }
    },
    adapters: adapters({
      primeng: 'p-button',
      ionic: 'ion-button',
      material: 'button[mat-raised-button]',
      bootstrap: 'button.btn',
      native: 'button'
    })
  },
  {
    componentKey: 'form.field',
    name: 'Field',
    category: 'primitive',
    description: 'Single dynamic form control resolved by kit and field metadata.',
    propsSchema: {
      type: 'object',
      properties: {
        field: { type: 'object' },
        value: {},
        disabled: { type: 'boolean' },
        readonly: { type: 'boolean' },
        help: { type: 'string' },
        error: { type: 'string' }
      },
      required: ['field']
    },
    eventsSchema: {
      valueChange: { actionTypes: ['set_state', 'refresh_data'] }
    },
    defaultProps: {
      field: { name: 'value', label: 'Value', type: 'text', placeholder: 'Write a value' },
      value: ''
    },
    documentation: {
      selector: 'app.form.field',
      minimalInvocation: {
        componentKey: 'form.field',
        props: { field: { name: 'email', label: 'Email', type: 'email' } }
      }
    },
    adapters: adapters({
      primeng: 'p-inputText / p-dropdown',
      ionic: 'ion-input / ion-select',
      material: 'mat-form-field',
      bootstrap: '.form-control',
      native: 'input / select'
    })
  },
  {
    componentKey: 'ui.card',
    name: 'Card',
    category: 'primitive',
    description: 'Surface container with multikit visual behavior and child component support.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        tone: { enum: ['neutral', 'primary', 'success', 'warning', 'danger'] },
        variant: { enum: ['surface', 'subtle', 'outline'] },
        padding: { type: 'string' }
      }
    },
    defaultProps: { tone: 'neutral', variant: 'surface', padding: '16px' },
    allowedChildren: { mode: 'many', categories: ['primitive', 'layout', 'content', 'data', 'action'] },
    documentation: {
      selector: 'app.ui.card',
      minimalInvocation: {
        componentKey: 'ui.card',
        props: { title: 'Resumen' },
        children: [{ componentKey: 'ui.button', props: { label: 'Abrir' } }]
      }
    },
    adapters: adapters({
      primeng: 'p-card',
      ionic: 'ion-card',
      material: 'mat-card',
      bootstrap: '.card',
      native: 'article'
    })
  },
  {
    componentKey: 'layout.stack',
    name: 'Stack',
    category: 'layout',
    description: 'Vertical or horizontal layout container for declarative children.',
    propsSchema: {
      type: 'object',
      properties: {
        direction: { enum: ['vertical', 'horizontal'] },
        gap: { type: 'string' },
        align: { enum: ['start', 'center', 'end', 'stretch'] }
      }
    },
    defaultProps: { direction: 'vertical', gap: '12px', align: 'stretch' },
    allowedChildren: { mode: 'many' },
    adapters: adapters({}, 'fallback')
  },
  {
    componentKey: 'layout.grid',
    name: 'Grid',
    category: 'layout',
    description: 'Responsive grid container for panels, cards, and fields.',
    propsSchema: {
      type: 'object',
      properties: {
        columns: { type: 'number' },
        gap: { type: 'string' },
        minColumnWidth: { type: 'string' }
      }
    },
    defaultProps: { columns: 2, gap: '12px', minColumnWidth: '240px' },
    allowedChildren: { mode: 'many' },
    adapters: adapters({ ionic: 'ion-grid', bootstrap: '.row' }, 'fallback')
  },
  {
    componentKey: 'feedback.alert',
    name: 'Alert',
    category: 'feedback',
    description: 'Inline or modal feedback message with tone and actions.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        tone: { enum: ['info', 'success', 'warning', 'danger'] }
      }
    },
    defaultProps: { title: 'Notice', message: 'Review this information.', tone: 'info' },
    adapters: adapters({ primeng: 'p-message', ionic: 'ion-alert', material: 'mat-card', bootstrap: '.alert', native: 'section' })
  },
  {
    componentKey: 'feedback.toast',
    name: 'Toast',
    category: 'feedback',
    description: 'Transient feedback triggered by actions.',
    propsSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        tone: { enum: ['info', 'success', 'warning', 'danger'] }
      }
    },
    defaultProps: { message: 'Done', tone: 'success' },
    adapters: adapters({ primeng: 'p-toast', ionic: 'ion-toast', material: 'mat-snack-bar', bootstrap: '.toast' }, 'planned')
  },
  {
    componentKey: 'feedback.loading',
    name: 'Loading',
    category: 'feedback',
    description: 'Loading indicator for async services, flows, and offline sync.',
    propsSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        active: { type: 'boolean' }
      }
    },
    defaultProps: { message: 'Loading...', active: true },
    adapters: adapters({ primeng: 'p-progressSpinner', ionic: 'ion-loading / ion-spinner', material: 'mat-progress-spinner', bootstrap: '.spinner-border', native: 'progress' })
  },
  {
    componentKey: 'feedback.skeleton',
    name: 'Skeleton',
    category: 'feedback',
    description: 'Skeleton placeholder used while screens and app runtime load.',
    propsSchema: {
      type: 'object',
      properties: {
        rows: { type: 'number' },
        shape: { enum: ['line', 'card', 'avatar'] }
      }
    },
    defaultProps: { rows: 3, shape: 'line' },
    adapters: adapters({ primeng: 'p-skeleton', ionic: 'ion-skeleton-text', material: 'mat-progress-bar', bootstrap: '.placeholder', native: 'div' })
  },
  {
    componentKey: 'nav.menu',
    name: 'Menu',
    category: 'navigation',
    description: 'Navigation menu generated from app routes and role-aware visibility.',
    propsSchema: {
      type: 'object',
      properties: {
        mode: { enum: ['top', 'side', 'bottom'] },
        items: { type: 'array' }
      }
    },
    defaultProps: { mode: 'top', items: [] },
    eventsSchema: {
      onNavigate: { actionTypes: ['navigate'] }
    },
    adapters: adapters({ primeng: 'p-menu / p-menubar', ionic: 'ion-menu / ion-tab-bar', material: 'mat-nav-list', bootstrap: '.nav', native: 'nav' })
  },
  {
    componentKey: 'nav.tabs',
    name: 'Tabs',
    category: 'navigation',
    description: 'Tab navigation for grouped screens or local sections.',
    propsSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        activeKey: { type: 'string' }
      }
    },
    defaultProps: { items: [], activeKey: '' },
    adapters: adapters({ primeng: 'p-tabs', ionic: 'ion-segment / ion-tabs', material: 'mat-tab-group', bootstrap: '.nav-tabs', native: 'div' })
  },
  {
    componentKey: 'nav.toolbar',
    name: 'Toolbar',
    category: 'navigation',
    description: 'Top or contextual command bar for pages and modals.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        actions: { type: 'array' }
      }
    },
    defaultProps: { title: '', actions: [] },
    adapters: adapters({ primeng: 'p-toolbar', ionic: 'ion-toolbar', material: 'mat-toolbar', bootstrap: '.navbar', native: 'header' })
  },
  {
    componentKey: 'data.table',
    name: 'Table',
    category: 'data',
    description: 'Queryable table view backed by a service, form, record source, or static rows.',
    propsSchema: {
      type: 'object',
      properties: {
        columns: { type: 'array' },
        rows: { type: 'array' },
        emptyText: { type: 'string' }
      }
    },
    defaultProps: { columns: [], rows: [], emptyText: 'No records.' },
    adapters: adapters({ primeng: 'p-table', material: 'mat-table', bootstrap: '.table', native: 'table' }, 'fallback')
  },
  {
    componentKey: 'data.list',
    name: 'List',
    category: 'data',
    description: 'Mobile-friendly record list backed by dynamic data sources.',
    propsSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        titleKey: { type: 'string' },
        subtitleKey: { type: 'string' }
      }
    },
    defaultProps: { items: [], titleKey: 'title', subtitleKey: 'subtitle' },
    adapters: adapters({ primeng: 'p-listbox', ionic: 'ion-list', material: 'mat-list', bootstrap: '.list-group', native: 'ul' })
  },
  {
    componentKey: 'ui.badge',
    name: 'Badge',
    category: 'primitive',
    description: 'Compact status, count or label marker rendered with the active visual kit.',
    propsSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        tone: { enum: ['primary', 'success', 'warning', 'danger', 'info'] }
      }
    },
    defaultProps: { label: 'Badge', tone: 'info' },
    adapters: adapters({ primeng: 'p-badge', ionic: 'ion-badge', material: 'mat-chip', bootstrap: '.badge', native: 'span' })
  },
  {
    componentKey: 'ui.metric_card',
    name: 'Metric Card',
    category: 'data',
    description: 'Compact KPI card for dashboards, Admin summaries and generated app home screens.',
    propsSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        value: { type: 'string' },
        help: { type: 'string' },
        tone: { enum: ['primary', 'success', 'warning', 'danger', 'info'] }
      }
    },
    defaultProps: { label: 'Metric', value: '0', help: '', tone: 'info' },
    adapters: adapters({ primeng: 'p-card', ionic: 'ion-card', material: 'mat-card', bootstrap: '.card', native: 'article' })
  },
  {
    componentKey: 'ui.action_group',
    name: 'Action Group',
    category: 'action',
    description: 'Grouped command buttons with spacing, wrapping and normalized declarative actions.',
    propsSchema: {
      type: 'object',
      properties: {
        actions: { type: 'array' },
        align: { enum: ['start', 'center', 'end', 'stretch'] }
      }
    },
    eventsSchema: {
      onClick: { actionTypes: ['navigate', 'execute_service', 'execute_flow', 'submit_form', 'open_modal', 'show_message', 'set_state', 'queue_offline'] }
    },
    defaultProps: { actions: [], align: 'start' },
    adapters: adapters({ primeng: 'p-toolbar', ionic: 'ion-buttons', material: 'mat-button-toggle-group', bootstrap: '.btn-group', native: 'div' })
  },
  {
    componentKey: 'layout.region',
    name: 'Region',
    category: 'layout',
    description: 'Named screen section that groups child components with consistent spacing and optional heading.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        gap: { type: 'string' },
        align: { enum: ['start', 'center', 'end', 'stretch'] }
      }
    },
    defaultProps: { title: '', subtitle: '', gap: '12px', align: 'stretch' },
    allowedChildren: { mode: 'many' },
    adapters: adapters({ ionic: 'ion-grid', bootstrap: '.container-fluid', native: 'section' }, 'fallback')
  },
  {
    componentKey: 'data.detail',
    name: 'Detail',
    category: 'data',
    description: 'Field/value detail block for records, selected items and inspection summaries.',
    propsSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        record: { type: 'object' },
        emptyText: { type: 'string' }
      }
    },
    defaultProps: { items: [], record: {}, emptyText: 'No details.' },
    adapters: adapters({ primeng: 'p-panel', ionic: 'ion-list', material: 'mat-list', bootstrap: 'dl.row', native: 'dl' })
  },
  {
    componentKey: 'data.metric_strip',
    name: 'Metric Strip',
    category: 'data',
    description: 'Responsive strip of metric cards bound to a dashboard or app state source.',
    propsSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        emptyText: { type: 'string' }
      }
    },
    defaultProps: { items: [], emptyText: 'No metrics.' },
    adapters: adapters({ primeng: 'p-card grid', ionic: 'ion-grid', material: 'mat-grid-list', bootstrap: '.row', native: 'div' })
  },
  {
    componentKey: 'media.gallery',
    name: 'Gallery',
    category: 'media',
    description: 'Responsive media gallery for images, documents and evidence previews.',
    propsSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        emptyText: { type: 'string' }
      }
    },
    defaultProps: { items: [], emptyText: 'No media.' },
    adapters: adapters({ primeng: 'p-galleria', ionic: 'ion-grid / ion-img', material: 'mat-grid-list', bootstrap: '.card-grid', native: 'figure' })
  },
  {
    componentKey: 'overlay.modal',
    name: 'Modal',
    category: 'overlay',
    description: 'Modal shell contract for dialogs, confirmations and composed component templates.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        actions: { type: 'array' }
      }
    },
    eventsSchema: {
      onClose: { actionTypes: ['show_message', 'set_state', 'emit_event'] }
    },
    defaultProps: { title: 'Modal', message: '', actions: [] },
    allowedChildren: { mode: 'many' },
    adapters: adapters({ primeng: 'p-dialog', ionic: 'ion-modal', material: 'mat-dialog', bootstrap: '.modal', native: 'dialog' })
  },
  {
    componentKey: 'auth.login',
    name: 'Login',
    category: 'app',
    description: 'Standard login block for generated apps, bound to an approved auth action or service.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        identityName: { type: 'string' },
        passwordName: { type: 'string' },
        submitLabel: { type: 'string' }
      }
    },
    eventsSchema: {
      onSubmit: { actionTypes: ['execute_service', 'submit_form', 'show_message'] }
    },
    defaultProps: { title: 'Login', identityName: 'email', passwordName: 'password', submitLabel: 'Sign in' },
    adapters: adapters({ primeng: 'form + p-inputText', ionic: 'ion-card + ion-input', material: 'mat-card + mat-form-field', bootstrap: '.card .form-control', native: 'form' })
  },
  {
    componentKey: 'app.shell',
    name: 'App Shell',
    category: 'app',
    description: 'Generated app shell with title, navigation area and child screen content.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        menuItems: { type: 'array' }
      }
    },
    defaultProps: { title: 'App', subtitle: '', menuItems: [] },
    allowedChildren: { mode: 'many' },
    adapters: adapters({ ionic: 'ion-app / ion-content', bootstrap: '.app-shell', native: 'section' }, 'fallback')
  },
  {
    componentKey: 'app.home_menu',
    name: 'Home Menu',
    category: 'app',
    description: 'Generated app home menu for routes, forms, services and flows.',
    propsSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        emptyText: { type: 'string' }
      }
    },
    eventsSchema: {
      onNavigate: { actionTypes: ['navigate', 'show_message'] }
    },
    defaultProps: { items: [], emptyText: 'No navigation options.' },
    adapters: adapters({ primeng: 'p-menu', ionic: 'ion-list', material: 'mat-nav-list', bootstrap: '.list-group', native: 'nav' })
  },
  {
    componentKey: 'status.offline',
    name: 'Offline Status',
    category: 'feedback',
    description: 'Runtime status block that tells whether the published manifest can work offline.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        tone: { enum: ['primary', 'success', 'warning', 'danger', 'info'] }
      }
    },
    defaultProps: { title: 'Offline', message: 'Latest manifest is cached.', tone: 'info' },
    adapters: adapters({ primeng: 'p-message', ionic: 'ion-note', material: 'mat-card', bootstrap: '.alert', native: 'aside' })
  },
  {
    componentKey: 'status.sync_queue',
    name: 'Sync Queue Status',
    category: 'feedback',
    description: 'Runtime status block for pending offline actions and retry state.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        tone: { enum: ['primary', 'success', 'warning', 'danger', 'info'] }
      }
    },
    defaultProps: { title: 'Sync queue', message: 'No pending actions.', tone: 'info' },
    adapters: adapters({ primeng: 'p-message', ionic: 'ion-note', material: 'mat-card', bootstrap: '.alert', native: 'aside' })
  },
  {
    componentKey: 'form.runtime',
    name: 'Form Runtime Block',
    category: 'form',
    description: 'Embedded dynamic form block with declarative fields and submit action.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        fields: { type: 'array' },
        submitLabel: { type: 'string' }
      }
    },
    eventsSchema: {
      onSubmit: { actionTypes: ['submit_form', 'execute_service', 'execute_flow', 'show_message', 'queue_offline'] }
    },
    defaultProps: { title: 'Form', subtitle: '', fields: [], submitLabel: 'Submit' },
    adapters: adapters({
      primeng: 'form + p-inputText',
      ionic: 'ion-list + ion-input',
      material: 'mat-form-field',
      bootstrap: '.form-control',
      native: 'form'
    })
  },
  {
    componentKey: 'service.result',
    name: 'Service Result',
    category: 'service',
    description: 'Result panel for dynamic service responses, errors and execution summaries.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        message: { type: 'string' },
        result: {},
        tone: { enum: ['info', 'success', 'warning', 'danger'] }
      }
    },
    defaultProps: { title: 'Service result', message: 'No response yet.', result: null, tone: 'info' },
    adapters: adapters({ primeng: 'p-panel', ionic: 'ion-card', material: 'mat-card', bootstrap: '.card', native: 'section' })
  },
  {
    componentKey: 'flow.trigger_button',
    name: 'Flow Trigger Button',
    category: 'flow',
    description: 'Command button that starts a published flow or shows a safe preview action.',
    propsSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        flowKey: { type: 'string' },
        tone: { enum: ['primary', 'secondary', 'success', 'danger', 'neutral'] },
        variant: { enum: ['solid', 'outline', 'ghost'] },
        full: { type: 'boolean' }
      }
    },
    eventsSchema: {
      onClick: { actionTypes: ['execute_flow', 'show_message', 'queue_offline'] }
    },
    defaultProps: { label: 'Run flow', tone: 'primary', variant: 'solid', full: false },
    adapters: adapters({ primeng: 'p-button', ionic: 'ion-button', material: 'button[mat-raised-button]', bootstrap: '.btn', native: 'button' })
  },
  {
    componentKey: 'record.list',
    name: 'Record List',
    category: 'record',
    description: 'Record list block for business objects, forms and service-backed collections.',
    propsSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        titleKey: { type: 'string' },
        subtitleKey: { type: 'string' },
        emptyText: { type: 'string' }
      }
    },
    eventsSchema: {
      onSelect: { actionTypes: ['navigate', 'set_state', 'open_modal', 'show_message'] }
    },
    defaultProps: { items: [], titleKey: 'title', subtitleKey: 'subtitle', emptyText: 'No records.' },
    adapters: adapters({ primeng: 'p-listbox', ionic: 'ion-list', material: 'mat-list', bootstrap: '.list-group', native: 'ul' })
  },
  {
    componentKey: 'record.detail',
    name: 'Record Detail',
    category: 'record',
    description: 'Field/value detail view for one selected record.',
    propsSchema: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        record: { type: 'object' },
        emptyText: { type: 'string' }
      }
    },
    defaultProps: { items: [], record: {}, emptyText: 'No record selected.' },
    adapters: adapters({ primeng: 'p-panel', ionic: 'ion-list', material: 'mat-list', bootstrap: 'dl.row', native: 'dl' })
  },
  {
    componentKey: 'nav.side_menu',
    name: 'Side Menu',
    category: 'navigation',
    description: 'Vertical navigation menu for generated apps and admin workspaces.',
    propsSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        items: { type: 'array' },
        activeKey: { type: 'string' },
        emptyText: { type: 'string' }
      }
    },
    eventsSchema: {
      onNavigate: { actionTypes: ['navigate', 'show_message'] }
    },
    defaultProps: { label: 'Navigation', items: [], activeKey: '', emptyText: 'No navigation options.' },
    adapters: adapters({ primeng: 'p-menu', ionic: 'ion-menu / ion-list', material: 'mat-nav-list', bootstrap: '.nav.flex-column', native: 'nav' })
  },
  {
    componentKey: 'nav.bottom_tabs',
    name: 'Bottom Tabs',
    category: 'navigation',
    description: 'Bottom navigation tabs for mobile app shells.',
    propsSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        items: { type: 'array' },
        activeKey: { type: 'string' },
        emptyText: { type: 'string' }
      }
    },
    eventsSchema: {
      onNavigate: { actionTypes: ['navigate', 'show_message'] }
    },
    defaultProps: { label: 'Tabs', items: [], activeKey: '', emptyText: 'No tabs.' },
    adapters: adapters({ primeng: 'p-tabs', ionic: 'ion-tab-bar', material: 'mat-tab-nav-bar', bootstrap: '.nav-tabs', native: 'nav' })
  },
  {
    componentKey: 'chart.panel',
    name: 'Chart Panel',
    category: 'data',
    description: 'Simple metric chart panel for dashboards and app previews.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        items: { type: 'array' },
        emptyText: { type: 'string' }
      }
    },
    defaultProps: { title: 'Metrics', items: [], emptyText: 'No chart data.' },
    adapters: adapters({ primeng: 'p-chart', ionic: 'ion-card', material: 'mat-card', bootstrap: '.progress', native: 'section' })
  },
  {
    componentKey: 'map.view',
    name: 'Map View',
    category: 'media',
    description: 'Map placeholder with declarative pins for GPS, inspection and location previews.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        pins: { type: 'array' }
      }
    },
    defaultProps: { title: 'Map', subtitle: '', pins: [] },
    adapters: adapters({ primeng: 'map adapter', ionic: 'capacitor/geolocation + ion-card', material: 'mat-card', bootstrap: '.card', native: 'section' })
  }
];
