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

function standardSeed(
  componentKey: string,
  name: string,
  category: string,
  description: string,
  defaultProps: Record<string, unknown> = {},
  technicalSelectors: Partial<Record<ComponentAdapterKit, string>> = {}
): ComponentDefinitionSeed {
  return {
    componentKey,
    name,
    category,
    description,
    propsSchema: { type: 'object' },
    defaultProps,
    adapters: adapters({
      primeng: technicalSelectors.primeng ?? componentKey,
      ionic: technicalSelectors.ionic ?? componentKey,
      material: technicalSelectors.material ?? componentKey,
      bootstrap: technicalSelectors.bootstrap ?? componentKey,
      native: technicalSelectors.native ?? componentKey
    })
  };
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
  },
  {
    componentKey: 'nav.breadcrumbs',
    name: 'Breadcrumbs',
    category: 'navigation',
    description: 'Contextual route trail for screens, detail pages and app studio previews.',
    propsSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        activeKey: { type: 'string' },
        items: { type: 'array' },
        emptyText: { type: 'string' }
      }
    },
    eventsSchema: {
      onNavigate: { actionTypes: ['navigate', 'show_message'] }
    },
    defaultProps: { label: 'Breadcrumbs', activeKey: '', items: [], emptyText: 'No route.' },
    adapters: adapters({ primeng: 'p-breadcrumb', ionic: 'ion-breadcrumbs', material: 'mat-nav-list', bootstrap: '.breadcrumb', native: 'nav' })
  },
  {
    componentKey: 'form.mobile_shell',
    name: 'Mobile Form Shell',
    category: 'form',
    description: 'Mobile-first shell for step screens, evidence capture and bottom actions.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        badge: { type: 'string' },
        progress: { type: 'string' },
        width: { type: 'string' },
        actions: { type: 'array' }
      }
    },
    defaultProps: { title: 'Mobile form', subtitle: '', badge: '', progress: '35%', width: '390px', actions: [] },
    allowedChildren: { mode: 'many' },
    adapters: adapters({ primeng: 'p-card', ionic: 'ion-content + ion-footer', material: 'mat-card', bootstrap: '.card', native: 'section' })
  },
  {
    componentKey: 'service.result_actions',
    name: 'Service Result Actions',
    category: 'service',
    description: 'Dynamic service response block with follow-up actions.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        message: { type: 'string' },
        result: {},
        tone: { enum: ['info', 'success', 'warning', 'danger'] },
        actions: { type: 'array' }
      }
    },
    eventsSchema: {
      onClick: { actionTypes: ['navigate', 'execute_service', 'execute_flow', 'open_modal', 'show_message', 'set_state', 'queue_offline'] }
    },
    defaultProps: { title: 'Service result', subtitle: '', message: 'No response yet.', result: null, tone: 'info', actions: [] },
    adapters: adapters({ primeng: 'p-panel + p-button', ionic: 'ion-card + ion-button', material: 'mat-card + button', bootstrap: '.card .btn', native: 'section' })
  },
  {
    componentKey: 'flow.stepper',
    name: 'Flow Stepper',
    category: 'flow',
    description: 'Readable flow execution or design sequence with status per step.',
    propsSchema: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        steps: { type: 'array' },
        emptyText: { type: 'string' }
      }
    },
    defaultProps: { label: 'Flow steps', steps: [], emptyText: 'No steps.' },
    adapters: adapters({ primeng: 'p-steps', ionic: 'ion-list', material: 'mat-stepper', bootstrap: '.list-group', native: 'ol' })
  },
  {
    componentKey: 'record.editor',
    name: 'Record Editor',
    category: 'record',
    description: 'Record editing surface generated from field metadata, values and declarative actions.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        fields: { type: 'array' },
        values: { type: 'object' },
        record: { type: 'object' },
        actions: { type: 'array' }
      }
    },
    eventsSchema: {
      valueChange: { actionTypes: ['set_state', 'refresh_data'] },
      onClick: { actionTypes: ['execute_service', 'submit_form', 'show_message', 'queue_offline'] }
    },
    defaultProps: { title: 'Edit record', subtitle: '', fields: [], values: {}, actions: [] },
    adapters: adapters({ primeng: 'p-panel + p-inputText', ionic: 'ion-list + ion-input', material: 'mat-card + mat-form-field', bootstrap: '.card .form-control', native: 'form' })
  },
  {
    componentKey: 'overlay.action_sheet',
    name: 'Action Sheet',
    category: 'overlay',
    description: 'Mobile-friendly action sheet for contextual decisions and compact command groups.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        actions: { type: 'array' },
        emptyText: { type: 'string' }
      }
    },
    eventsSchema: {
      onClick: { actionTypes: ['navigate', 'execute_service', 'execute_flow', 'open_modal', 'show_message', 'set_state', 'queue_offline'] }
    },
    defaultProps: { title: 'Actions', message: '', actions: [], emptyText: 'No actions.' },
    adapters: adapters({ primeng: 'p-overlayPanel', ionic: 'ion-action-sheet', material: 'mat-bottom-sheet', bootstrap: '.dropdown-menu', native: 'section' })
  },
  {
    componentKey: 'media.camera_capture',
    name: 'Camera Capture',
    category: 'media',
    description: 'Declarative camera/evidence capture block for mobile forms and offline workflows.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        src: { type: 'string' },
        placeholder: { type: 'string' },
        captureLabel: { type: 'string' },
        tone: { enum: ['primary', 'secondary', 'success', 'danger', 'neutral'] },
        variant: { enum: ['solid', 'outline', 'ghost'] }
      }
    },
    eventsSchema: {
      onCapture: { actionTypes: ['open_modal', 'show_message', 'set_state', 'queue_offline'] }
    },
    defaultProps: { title: 'Photo', subtitle: '', placeholder: 'No image captured', captureLabel: 'Capture photo', tone: 'primary', variant: 'outline' },
    adapters: adapters({ primeng: 'fileupload/camera adapter', ionic: 'Capacitor Camera + ion-button', material: 'mat-card + button', bootstrap: '.card .btn', native: 'input[type=file]' })
  },
  {
    componentKey: 'map.gps_capture',
    name: 'GPS Capture',
    category: 'media',
    description: 'Declarative GPS capture block with latitude, longitude and capture action.',
    propsSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        lat: { type: 'string' },
        lng: { type: 'string' },
        status: { type: 'string' },
        captureLabel: { type: 'string' },
        tone: { enum: ['primary', 'secondary', 'success', 'danger', 'neutral'] },
        variant: { enum: ['solid', 'outline', 'ghost'] }
      }
    },
    eventsSchema: {
      onCapture: { actionTypes: ['show_message', 'set_state', 'queue_offline'] }
    },
    defaultProps: { title: 'GPS location', subtitle: '', lat: '', lng: '', status: 'Waiting for location permission', captureLabel: 'Capture location', tone: 'primary', variant: 'outline' },
    adapters: adapters({ primeng: 'map/location adapter', ionic: 'Capacitor Geolocation + ion-button', material: 'mat-card + button', bootstrap: '.card .btn', native: 'section' })
  },
  standardSeed('ui.chip', 'Chip', 'primitive', 'Compact pill for tags, states and non-sensitive metadata.', { label: 'Chip', tone: 'info' }, { ionic: 'ion-chip', material: 'mat-chip', bootstrap: '.badge', native: 'span' }),
  standardSeed('ui.text', 'Text', 'primitive', 'Declarative text block with consistent typography across kits.', { text: 'Text' }, { ionic: 'ion-text', material: 'p', bootstrap: 'p', native: 'p' }),
  standardSeed('ui.title', 'Title', 'primitive', 'Declarative section heading with optional eyebrow and subtitle.', { title: 'Title', subtitle: '' }, { ionic: 'ion-title', material: 'h2', bootstrap: 'h2', native: 'h2' }),
  standardSeed('ui.note', 'Note', 'feedback', 'Context note for help, validation and guidance.', { message: 'Note', tone: 'info' }, { ionic: 'ion-note', material: 'mat-card', bootstrap: '.alert', native: 'aside' }),
  standardSeed('ui.avatar', 'Avatar', 'primitive', 'Avatar with image or initials for users, entities and apps.', { initials: 'CE', label: 'Avatar' }, { ionic: 'ion-avatar', material: '.mat-mdc-avatar', bootstrap: '.rounded-circle', native: 'span' }),
  standardSeed('ui.icon', 'Icon', 'primitive', 'Icon block with tone and controlled size.', { icon: 'pi pi-circle', label: 'Icon' }, { ionic: 'ion-icon', material: 'mat-icon', bootstrap: '.bi', native: 'i' }),
  standardSeed('ui.accordion', 'Accordion', 'layout', 'Single collapsible section for help, details and advanced options.', { title: 'Section', content: '' }, { ionic: 'ion-accordion', material: 'mat-expansion-panel', bootstrap: '.accordion-item', native: 'details' }),
  standardSeed('ui.accordion_group', 'Accordion Group', 'layout', 'Group of collapsible sections driven by declarative items.', { items: [] }, { ionic: 'ion-accordion-group', material: 'mat-accordion', bootstrap: '.accordion', native: 'div' }),
  standardSeed('ui.segment', 'Segment', 'navigation', 'Segmented control for modes, compact tabs and main filters.', { activeKey: '', items: [] }, { ionic: 'ion-segment', material: 'mat-button-toggle-group', bootstrap: '.btn-group', native: 'div' }),
  standardSeed('feedback.progress', 'Progress', 'feedback', 'Progress bar for loading, completion and coverage states.', { label: 'Progress', percent: 0 }, { ionic: 'ion-progress-bar', material: 'mat-progress-bar', bootstrap: '.progress', native: 'progress' }),
  standardSeed('feedback.spinner', 'Spinner', 'feedback', 'Processing indicator for transient actions and loading states.', { message: 'Processing...' }, { ionic: 'ion-spinner', material: 'mat-progress-spinner', bootstrap: '.spinner-border', native: 'span' }),
  standardSeed('layout.row', 'Layout Row', 'layout', 'Responsive horizontal group for controls and actions.', { gap: '12px' }, { ionic: 'ion-row', material: '.layout-row', bootstrap: '.row', native: 'div' }),
  standardSeed('layout.column', 'Layout Column', 'layout', 'Vertical layout container for declarative children.', { gap: '12px' }, { ionic: 'ion-col', material: '.layout-column', bootstrap: '.col', native: 'div' }),
  standardSeed('layout.split_pane', 'Split Pane', 'layout', 'Two-zone layout that collapses safely on small screens.', { left: '1fr', right: '1fr' }, { ionic: 'ion-split-pane', material: '.split-pane', bootstrap: '.row', native: 'div' }),
  standardSeed('layout.header', 'Layout Header', 'layout', 'Top region for shells, pages and composed cards.', {}, { ionic: 'ion-header', material: 'header', bootstrap: 'header', native: 'header' }),
  standardSeed('layout.content', 'Layout Content', 'layout', 'Main content region for declarative screens.', {}, { ionic: 'ion-content', material: 'main', bootstrap: 'main', native: 'main' }),
  standardSeed('layout.footer', 'Layout Footer', 'layout', 'Bottom region for actions and screen status.', { text: '' }, { ionic: 'ion-footer', material: 'footer', bootstrap: 'footer', native: 'footer' }),
  standardSeed('nav.link', 'Navigation Link', 'navigation', 'Clickable navigation link connected to the declarative action runner.', { label: 'Open' }, { ionic: 'ion-nav-link', material: 'a[mat-button]', bootstrap: '.nav-link', native: 'button' }),
  standardSeed('data.list_header', 'List Header', 'data', 'Semantic list header with optional metadata.', { title: 'List', meta: '' }, { ionic: 'ion-list-header', material: 'mat-list-subheader', bootstrap: '.list-group-item', native: 'div' }),
  standardSeed('data.list_item', 'List Item', 'data', 'Single list row with title, subtitle and status.', { title: 'Item', subtitle: '', status: '' }, { ionic: 'ion-item', material: 'mat-list-item', bootstrap: '.list-group-item', native: 'article' }),
  standardSeed('data.list_divider', 'List Divider', 'data', 'Semantic divider for long lists and sections.', { label: 'Section' }, { ionic: 'ion-item-divider', material: 'mat-divider', bootstrap: '.dropdown-divider', native: 'hr' }),
  standardSeed('media.image', 'Image', 'media', 'Image block with placeholder, caption and controlled ratio.', { placeholder: 'Image', caption: '' }, { ionic: 'ion-img', material: 'img', bootstrap: 'img.img-fluid', native: 'img' }),
  standardSeed('media.thumbnail', 'Thumbnail', 'media', 'Small visual thumbnail for lists, galleries and evidence.', { placeholder: 'IMG', title: '' }, { ionic: 'ion-thumbnail', material: 'img', bootstrap: '.img-thumbnail', native: 'figure' }),
  standardSeed('ui.fab', 'Floating Action Button', 'action', 'Floating action command for create flows and compact app actions.', { label: 'New', icon: 'pi pi-plus', tone: 'primary' }, { ionic: 'ion-fab', material: 'button[mat-fab]', bootstrap: '.btn', native: 'button' })
];
