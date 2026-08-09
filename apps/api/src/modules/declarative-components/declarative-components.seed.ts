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
  }
];
