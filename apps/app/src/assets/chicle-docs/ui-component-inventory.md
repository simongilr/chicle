# UI component inventory

This inventory is the baseline for dynamic forms, screen design and visual builders. A component belongs in
`shared` only when it has no business API dependency and communicates through inputs, outputs or content projection.
Page containers keep routing, permissions, loading and orchestration.

The detailed Admin page reuse percentages and extraction roadmap live in `docs/admin-ui-reuse-audit.md`.

## Navigation taxonomy

| Group | Purpose | Current and planned modules |
| --- | --- | --- |
| Primary | Daily entry points | Home, Manual |
| Construction | Create executable product behavior | Services, Flows, Forms, Screens, Templates, Automations |
| Administration | Operate and protect the platform | Configuration, Database, Security |

`more` remains a compatibility value in menu configuration, but the UI presents it as `Construction`.

## Shared components

| Component | Selector | Responsibility | Current use | Maturity |
| --- | --- | --- | --- | --- |
| MainNavComponent | `app-main-nav` | Responsive primary navigation, dropdowns, mobile drawer and logout | Authenticated app and Docs pages | Stable |
| PageShellComponent | `app-page-shell` | Ionic content, navigation, shared width, margins, background and responsive padding | Home, Docs, Confisys, Security, Database, Services, Flows and dynamic forms | Stable |
| PublicPageShellComponent | `app-public-page-shell` | Shared public topbar, width, margins, background and responsive padding | Login and Setup | Stable |
| ModuleHeaderComponent | `app-module-header` | Module title, eyebrow, description and badge | Confisys, Security, Database, Services, Flows and dynamic forms | Stable |
| AdminPanelComponent | `app-admin-panel` | Shared Admin panel with header, description, projected actions and content | Home, Preferences and Security | Stable |
| AdminActionToolbarComponent | `app-admin-action-toolbar` | Responsive action/link toolbar for panel and module commands | Home and Security | Stable |
| AdminMetricCardComponent | `app-admin-metric-card` | Compact metric/status card for dashboards and operational summaries | Home and Security | Stable |
| ArchitectureDiagramComponent | `app-architecture-diagram` | Visual architecture map with reusable nodes, repository paths and module relationships | Architecture and Components | Stable |
| ArchitectureBlueprintComponent | `app-architecture-blueprint` | Drawn architecture blueprint with positioned nodes, arrows, connection labels and responsive stacked fallback | Architecture and Components | Stable |
| ArchitectureTopologyDiagramComponent | `app-architecture-topology-diagram` | Draw.io-style communication diagram with zones, icon nodes and short connection labels | Architecture and Components | Stable |
| DesignerWorkspaceComponent | `app-designer-workspace` | Responsive catalog plus editing workspace | Services and Flows | Stable; adopt in Forms and Screens |
| CatalogHeaderComponent | `app-catalog-header` | Catalog title, count and projected commands | Database, Services and Flows | Stable |
| CatalogItemComponent | `app-catalog-item` | Selectable catalog row with title, metadata and detail | Database, Services and Flows | Stable |
| SectionHeaderComponent | `app-section-header` | Heading, description, step label and projected actions | Operational designers | Stable |
| AdminFilterBarComponent | `app-admin-filter-bar` | Responsive filter/search bar with consistent multikit spacing and projected controls | Components, Confisys and Markdown repository | Stable |
| AdminFormGridComponent | `app-admin-form-grid` | Responsive administrative form grid for property panels and settings without page-local layout CSS | Preferences and future builders | Stable |
| AdminDataTableComponent | `app-admin-data-table` | Dynamic Admin table with columns, rows, empty state and detail action | Database | Stable |
| ProcessStepsComponent | `app-process-steps` | Guided stages with complete, active and pending states | Services, Flows and Docs | Stable |
| WorkflowGuideComponent | `app-workflow-guide` | Current objective, explanation and next command | Services, Flows and Docs | Stable |
| ContextAssistantComponent | `app-context-assistant` | Local help, example, readiness and next action | Flow authoring blocks | Reusable; adopt in builders |
| AiAssistantLauncherComponent | `app-ai-assistant-launcher` | Floating global chat entry point for natural-language requests; delegates the requested action to the current screen context | AppComponent, all routes | Initial local prototype; connected to screen handlers, backend AI and RAG |
| StatusNoticeComponent | `app-status-notice` | Empty, info, success, warning and error states | Login, Setup, Database, Services, Flows, Security and dynamic forms | Stable |
| LoadingSkeletonComponent | `app-loading-skeleton` | Page, list, table and form loading placeholders with accessible status | Route transitions and data-driven modules | Stable |
| SegmentedControlComponent | `app-segmented-control` | Compact mutually exclusive view selector | Database and Flows | Stable |
| FieldShellComponent | `app-field-shell` | Accessible label, required state, help and validation error | Dynamic field controls, component catalog and legacy public forms | Stable |
| DynamicFieldControlComponent | `app-dynamic-field-control` | Render fields through PrimeNG, Ionic, Material, Bootstrap or native adapters without changing the schema | Dynamic form runtime | Initial multikit renderer |
| DynamicFieldLibraryComponent | `app-dynamic-field-library` | Show every supported dynamic field through the multikit facade and compare installed presentation kits | Component library and form designer | Initial field palette |
| FormlyRuntimeComponent | `app-formly-runtime` | Reactive form, validation, conditional fields, command buttons and multi-step navigation from RuntimeForm | Dynamic form runtime and component library | Initial |
| ChicleFormlyFieldTypeComponent | `app-chicle-formly-field-type` | Connect Formly state and validation to the multikit field facade | Formly runtime | Initial internal adapter |
| ChicleFormlyDisplayTypeComponent | `app-chicle-formly-display-type` | Render declarative title, paragraph and divider content | Formly runtime | Initial internal adapter |
| PrimengFieldRendererComponent | `app-primeng-field-renderer` | Render the field contract with PrimeNG controls | Dynamic field facade | Initial adapter |
| IonicFieldRendererComponent | `app-ionic-field-renderer` | Render the field contract with Ionic controls | Dynamic field facade | Initial adapter |
| MaterialFieldRendererComponent | `app-material-field-renderer` | Render the field contract with Angular Material controls | Dynamic field facade | Initial adapter |
| BootstrapFieldRendererComponent | `app-bootstrap-field-renderer` | Render the field contract with Bootstrap form classes | Dynamic field facade | Initial adapter |
| NativeFieldRendererComponent | `app-native-field-renderer` | Render the field contract with native HTML controls | Dynamic field facade | Initial fallback |
| UiKitButtonComponent | `app-ui-kit-button` | Render actions and submit buttons through PrimeNG, Ionic, Material, Bootstrap or native buttons | Login, Setup, Preferences, Components and future Admin actions | Initial multikit action adapter |
| UiKitCardComponent | `app-ui-kit-card` | Render surfaces through PrimeNG, Ionic, Material, Bootstrap-compatible or native cards | Metrics, Components and future Admin panels | Initial multikit surface adapter |
| UiPresentationSwitcherComponent | `app-ui-presentation-switcher` | Preview adaptive, PrimeNG, Ionic and native rendering | Dynamic form runtime | Initial |
| UiThemeSelectorComponent | `app-ui-theme-selector` | Select installed themes and synchronize Chicle, Ionic and PrimeNG tokens | Component library | Initial |
| PreviewViewportComponent | `app-preview-viewport` | Device-aware preview shell with desktop, tablet and mobile chrome, size metadata and projected runtime content | Dynamic form designer, dynamic form runtime and screen designer | Stable |

## Domain visual components

| Component | Selector | Responsibility | Reuse decision |
| --- | --- | --- | --- |
| FlowDataMapperComponent | `app-flow-data-mapper` | Map named inputs to context and previous outputs | Generalize into `DataBindingEditorComponent` for forms, screens and actions |
| FlowGraphComponent | `app-flow-graph` | Read and select connected Flow nodes | Keep in Flow domain; reuse a generic canvas shell when another domain needs it |
| FlowTimelineComponent | `app-flow-timeline` | Ordered Flow steps and step commands | Keep in Flow domain; extract generic sortable item list when another domain needs it |

## Page containers

| Page | Current role | UI state |
| --- | --- | --- |
| AppComponent | Ionic application shell and router outlet | Stable |
| HomePageComponent | Operational dashboard | Functional, custom layout |
| SetupPageComponent | First tenant and owner creation | Functional, shared public shell, dynamic fields and multikit actions |
| LoginPageComponent | Policy-driven authentication | Functional, shared public shell, dynamic fields, segmented channel selector and multikit actions |
| DocsPageComponent | In-app operational Docs | Functional, large page |
| ConfisysPageComponent | Runtime configuration | Functional, custom layout |
| DatabasePageComponent | Data viewer and schema designer | Functional; partially uses shared designer language |
| ServicesPageComponent | Dynamic service lifecycle | Functional; reference visual workflow |
| FlowsPageComponent | Declarative process lifecycle | Functional; must continue decomposing |
| FormsPageComponent | Dynamic form designer | Functional V1; templates, guided draft, field sets, validation checklist, always-editable JSON, preview, test, version and publish |
| SecurityPageComponent | Users, roles, permissions and audit | Functional; needs further component extraction |
| DynamicFormPageComponent | Dynamic form runtime | Loads published runtime schema, renders fields, previews responsive modes and submits through API |

## Runtime services that support visual components

| Service | Purpose | Status |
| --- | --- | --- |
| FormRuntimeService | Normalize a dynamic form definition | Initial skeleton |
| FormlySchemaAdapterService | Convert RuntimeField contracts into safe Formly configuration | Initial |
| ActionRunnerService | Execute declarative UI actions, including `execute_flow` | Partial |
| DynamicServiceClientService | Discover and execute published services by key | Ready |
| DynamicFlowClientService | Discover and execute published flows by key | Ready |

## Missing component kit for Forms and Screens

These components are required before the builders grow inside page files:

1. Extend `DynamicFieldLibraryComponent` with search, categories and insertion events for the visual designer.
2. `StepManagerComponent`: create, reorder, select and validate form steps.
3. `ComponentTreeComponent`: ordered screen hierarchy with selection and nesting.
4. `PropertyInspectorComponent`: edits the selected form, step, field or component without knowing its business module.
5. `SchemaFieldEditorComponent`: key, label, type, default, required and validation rules.
6. `DataBindingEditorComponent`: generalized form of the current Flow mapper for forms, screens and actions.
7. `ActionBindingEditorComponent`: event, service/flow key, payload map, result handling and error handling.
8. `DynamicGridDesignerComponent`: optional GridStack-backed design canvas that emits Chicle layout JSON instead of storing GridStack internals.
9. `DynamicGridRuntimeComponent`: read-only responsive runtime renderer for Admin and generated apps.
10. `ScreenComponentPaletteComponent`: registered components grouped by purpose, kit support and permissions.
11. `ScreenPropertyInspectorComponent`: edits props, bindings, actions, access and presentation for selected screen components.
12. `JsonAuthoringPanelComponent`: synchronized guided/JSON editing with parse errors, reset, draft save and publish.
13. `VersionLifecyclePanelComponent`: draft, version, publish, compare and restore pattern shared by Services, Flows and forms.
14. `TestWorkbenchComponent`: input fixture, execute, response, duration and repeatable cases.
15. `AdminDataTableComponent`: reusable Admin table for Database now; extend with server pagination and filters for Security and Confisys.
16. `AdminPaginationComponent`: shared pagination, page-size selection and result totals.
17. `AdminModalComponent`: shared modal/drawer shell with kit-aware actions.
18. `ConfirmActionComponent`: consistent confirmation for destructive or draft-replacing actions.
19. `AdminFilterBarComponent`: shared Admin search/filter strip for Components, Confisys, Markdown repository and the next Database/Security extraction pass.
20. `EnvironmentResourceCardComponent`: shared variable, secret and service registry resource card for the Deploy Center.
21. `ReadinessValidationListComponent`: shared readiness checklist with ok, warning and danger states.
22. `DeploymentBundlePanelComponent`: safe generated artifact viewer without exposing secrets.
23. `DesignerCatalogPanelComponent`: shared designer side catalog with title, count, New/Trash actions, loading, error, empty and item projection.

## Dynamic Forms readiness audit

| Capability | Existing reusable pieces | Status |
| --- | --- | --- |
| Runtime rendering | `FormlyRuntimeComponent`, `FormRuntimeService`, `FormlySchemaAdapterService` | V1 usable; cards, continuous, paged modes, command buttons, dynamic options and access filtering |
| Multikit fields | `DynamicFieldControlComponent`, PrimeNG/Ionic/Material/Bootstrap/native renderers | Initial, usable; includes text, numeric, choice, file/image metadata and GPS fallback |
| Labels/help/errors | `FieldShellComponent` | Ready |
| Responsive preview | `PreviewViewportComponent`, `UiPresentationSwitcherComponent` | Ready; preview now separates device simulation, runtime content and integration contract |
| Form lifecycle guide | `ProcessStepsComponent`, `WorkflowGuideComponent`, `StatusNoticeComponent` | Ready |
| Designer workspace | `DesignerWorkspaceComponent`, `DesignerCatalogPanelComponent`, catalog items and section components | Ready |
| Field palette | Inline V1 in `FormsPageComponent` with quick sets; `DynamicFieldLibraryComponent` documents renderer examples through the same multikit facade | Extract shared insertion component next |
| Step management | Inline V1 in `FormsPageComponent` with add/remove/select | Extract shared component next |
| Field inspector | Inline V1 in `FormsPageComponent` with duplicate/reorder, options, validations, service bindings, access rules and visibility conditions | Extract shared component next |
| JSON editor | `JsonAuthoringPanelComponent` shared by Forms, Services and Flows; current JSON can apply to the guide, save draft or publish through `/authoring/json` endpoints | Ready |
| Data binding | Inline V1 service/flow selectors, hybrid submit, runtime limits and payload/response maps in `FormsPageComponent`; Flow mapper exists only in Flow domain | Missing shared component |
| Action binding | Inline V1 commands in `FormsPageComponent`; runtime can execute service/flow/show_message buttons with permissions and confirmations | Extract shared component next |
| Version and publish panel | Inline V1 checklist in `FormsPageComponent`; page-local patterns in Services/Flows | Missing shared component |
| Test workbench | Inline V1 fixture generator and submit runner in `FormsPageComponent`; runtime component tests cover layout and dynamic options | Missing shared component |
| Server pagination/list for many forms | No shared entity table yet | Missing |

Conclusion: the runtime foundation is present; the visual authoring foundation still needs the P0 builder components
before the designer should grow.

## Extraction priorities

### P0: before Dynamic Forms V1

- Extend the field renderer with files, catalogs, masks and rule-driven validation.
- Property inspector and schema field editor.
- Data/action binding editors.
- Reuse `JsonAuthoringPanelComponent`, `DesignerCatalogPanelComponent` and responsive preview viewport in screen/page designers.
- Reusable entity table with server pagination.

### P1: during Screen Designer V1

- Component palette and component tree.
- Generic builder canvas shell.
- Version lifecycle and test workbench.
- Modal/drawer editing shell.
- Permission-aware component visibility.

### P2: after first complete builder

- Continue moving repeated controls and typography into design tokens. Page spacing, background, text, muted,
  borders and radius already use global tokens.
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
- Dynamic forms now have an initial runtime renderer and responsive preview, but still need a designer, version
  lifecycle, action execution, richer validation and field types before production use.

## Definition of done for a new visual component

- Standalone Angular component with typed inputs and outputs.
- No direct business API call when placed in `shared`.
- Keyboard operation, labels, focus state and responsive constraints.
- Loading, empty, error, disabled and readonly states where relevant.
- No horizontal overflow at 390 px.
- Demonstrated in the in-app component inventory and covered by a focused interaction test.
- Themes are registered centrally, lazy-load their non-default PrimeNG preset and are audited through `/components`.

The latest route-by-route adoption check and domain exceptions are recorded in `docs/ui-reuse-audit.md`.
