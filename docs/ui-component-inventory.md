# UI component inventory

This inventory is the baseline for dynamic forms, screen design and future visual builders. A component belongs in
`shared` only when it has no business API dependency and communicates through inputs, outputs or content projection.
Page containers keep routing, permissions, loading and orchestration.

## Navigation taxonomy

| Group | Purpose | Current and planned modules |
| --- | --- | --- |
| Principal | Daily entry points | Inicio, Manual |
| Construcción | Create executable product behavior | Servicios, Flows, Formularios, Pantallas, Plantillas, Automatizaciones |
| Administración | Operate and protect the platform | Configuración, Base de datos, Seguridad |

`more` remains a compatibility value in menu configuration, but the UI presents it as `Construcción`.

## Shared components

| Component | Selector | Responsibility | Current use | Maturity |
| --- | --- | --- | --- | --- |
| MainNavComponent | `app-main-nav` | Responsive primary navigation, dropdowns, mobile drawer and logout | Seven authenticated/manual pages | Stable |
| ModuleHeaderComponent | `app-module-header` | Module title, eyebrow, description and badge | Database, Services and Flows | Stable |
| DesignerWorkspaceComponent | `app-designer-workspace` | Responsive catalog plus editing workspace | Services and Flows | Stable; adopt in Forms and Screens |
| CatalogHeaderComponent | `app-catalog-header` | Catalog title, count and projected commands | Database, Services and Flows | Stable |
| CatalogItemComponent | `app-catalog-item` | Selectable catalog row with title, metadata and detail | Database, Services and Flows | Stable |
| SectionHeaderComponent | `app-section-header` | Heading, description, step label and projected actions | Operational designers | Stable |
| ProcessStepsComponent | `app-process-steps` | Guided stages with complete, active and pending states | Services, Flows and Manual | Stable |
| WorkflowGuideComponent | `app-workflow-guide` | Current objective, explanation and next command | Services, Flows and Manual | Stable |
| ContextAssistantComponent | `app-context-assistant` | Local help, example, readiness and next action | Flow authoring blocks | Reusable; adopt in builders |
| StatusNoticeComponent | `app-status-notice` | Empty, info, success, warning and error states | Database, Services and Flows | Stable |
| SegmentedControlComponent | `app-segmented-control` | Compact mutually exclusive view selector | Database and Flows | Stable |

## Domain visual components

| Component | Selector | Responsibility | Reuse decision |
| --- | --- | --- | --- |
| FlowDataMapperComponent | `app-flow-data-mapper` | Map named inputs to context and previous outputs | Generalize into `DataBindingEditorComponent` for forms, screens and actions |
| FlowGraphComponent | `app-flow-graph` | Read and select connected Flow nodes | Keep in Flow domain; reuse a future generic canvas shell |
| FlowTimelineComponent | `app-flow-timeline` | Ordered Flow steps and step commands | Keep in Flow domain; extract generic sortable item list later |

## Page containers

| Page | Current role | UI state |
| --- | --- | --- |
| AppComponent | Ionic application shell and router outlet | Stable |
| HomePageComponent | Operational dashboard | Functional, custom layout |
| SetupPageComponent | First tenant and owner creation | Functional, Ionic shell |
| LoginPageComponent | Policy-driven authentication | Functional, Ionic shell |
| DocsPageComponent | In-app operational manual | Functional, large page |
| ConfisysPageComponent | Runtime configuration | Functional, custom layout |
| DatabasePageComponent | Data viewer and schema designer | Functional; partially uses shared designer language |
| ServicesPageComponent | Dynamic service lifecycle | Functional; reference visual workflow |
| FlowsPageComponent | Declarative process lifecycle | Functional; must continue decomposing |
| SecurityPageComponent | Users, roles, permissions and audit | Functional; needs further component extraction |
| DynamicFormPageComponent | Dynamic form runtime | Placeholder only |

## Runtime services that support visual components

| Service | Purpose | Status |
| --- | --- | --- |
| FormRuntimeService | Normalize a dynamic form definition | Initial skeleton |
| ActionRunnerService | Execute declarative UI actions, including `execute_flow` | Partial |
| DynamicServiceClientService | Discover and execute published services by key | Ready |
| DynamicFlowClientService | Discover and execute published flows by key | Ready |

## Missing component kit for Forms and Screens

These components are required before the builders grow inside page files:

1. `FieldShellComponent`: label, required state, help, validation and error presentation.
2. `DynamicFieldControlComponent`: text, number, date, email, select, checkbox, toggle, textarea and file controls.
3. `FieldPaletteComponent`: searchable catalog of available field and component types.
4. `ComponentTreeComponent`: ordered screen hierarchy with selection and nesting.
5. `PropertyInspectorComponent`: edits the selected field or component without knowing its business module.
6. `SchemaFieldEditorComponent`: key, label, type, default, required and validation rules.
7. `DataBindingEditorComponent`: generalized form of the current Flow data mapper.
8. `ActionBindingEditorComponent`: event, service/flow key, payload map, result handling and error handling.
9. `JsonEditorPanelComponent`: synchronized guided/JSON editing with parse errors and reset.
10. `PreviewViewportComponent`: desktop, tablet and mobile preview modes with stable dimensions.
11. `VersionLifecyclePanelComponent`: draft, version, publish, compare and restore pattern shared by Services, Flows and forms.
12. `TestWorkbenchComponent`: input fixture, execute, response, duration and repeatable cases.
13. `EntityTableComponent`: server pagination, search, filters, empty/loading/error states and row commands.
14. `ConfirmActionComponent`: consistent confirmation for destructive or draft-replacing actions.

## Extraction priorities

### P0: before Dynamic Forms V1

- Field shell and dynamic field controls.
- Property inspector and schema field editor.
- Data/action binding editors.
- JSON editor and responsive preview viewport.
- Reusable entity table with server pagination.

### P1: during Screen Designer V1

- Component palette and component tree.
- Generic builder canvas shell.
- Version lifecycle and test workbench.
- Modal/drawer editing shell.
- Permission-aware component visibility.

### P2: after first complete builder

- Move repeated spacing, colors, borders, controls and typography into design tokens.
- Replace page-local copies of panel, toolbar, grid and button styles.
- Evaluate PrimeNG adoption per component instead of mixing native and PrimeNG controls ad hoc.
- Add a visual component gallery and interaction tests.

## Current risks

- PrimeNG is installed, but current application pages primarily use native controls and PrimeIcons. No shared PrimeNG
  control layer exists yet.
- `FlowsPageComponent`, `ServicesPageComponent`, `DocsPageComponent`, `SecurityPageComponent` and
  `DatabasePageComponent` are large page containers. New builder behavior must not be added directly to them.
- Menu grouping is currently inferred in the frontend because the `menus` table does not persist `group` or `placement`.
  Persist those fields when menu administration becomes editable.
- Dynamic forms have a route and entity, but not a production renderer, field kit, designer, versions or preview system.

## Definition of done for a new visual component

- Standalone Angular component with typed inputs and outputs.
- No direct business API call when placed in `shared`.
- Keyboard operation, labels, focus state and responsive constraints.
- Loading, empty, error, disabled and readonly states where relevant.
- No horizontal overflow at 390 px.
- Demonstrated in the in-app component inventory and covered by a focused interaction test.
