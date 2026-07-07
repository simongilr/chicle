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
| MainNavComponent | `app-main-nav` | Responsive primary navigation, dropdowns, mobile drawer and logout | Eight authenticated/manual pages | Stable |
| PageShellComponent | `app-page-shell` | Ionic content, navigation, shared width, margins, background and responsive padding | Home, Manual, Confisys, Security, Database, Services, Flows and dynamic forms | Stable |
| PublicPageShellComponent | `app-public-page-shell` | Shared public topbar, width, margins, background and responsive padding | Login and Setup | Stable |
| ModuleHeaderComponent | `app-module-header` | Module title, eyebrow, description and badge | Confisys, Security, Database, Services, Flows and dynamic forms | Stable |
| DesignerWorkspaceComponent | `app-designer-workspace` | Responsive catalog plus editing workspace | Services and Flows | Stable; adopt in Forms and Screens |
| CatalogHeaderComponent | `app-catalog-header` | Catalog title, count and projected commands | Database, Services and Flows | Stable |
| CatalogItemComponent | `app-catalog-item` | Selectable catalog row with title, metadata and detail | Database, Services and Flows | Stable |
| SectionHeaderComponent | `app-section-header` | Heading, description, step label and projected actions | Operational designers | Stable |
| ProcessStepsComponent | `app-process-steps` | Guided stages with complete, active and pending states | Services, Flows and Manual | Stable |
| WorkflowGuideComponent | `app-workflow-guide` | Current objective, explanation and next command | Services, Flows and Manual | Stable |
| ContextAssistantComponent | `app-context-assistant` | Local help, example, readiness and next action | Flow authoring blocks | Reusable; adopt in builders |
| StatusNoticeComponent | `app-status-notice` | Empty, info, success, warning and error states | Login, Setup, Database, Services, Flows, Security and dynamic forms | Stable |
| LoadingSkeletonComponent | `app-loading-skeleton` | Page, list, table and form loading placeholders with accessible status | Route transitions and data-driven modules | Stable |
| SegmentedControlComponent | `app-segmented-control` | Compact mutually exclusive view selector | Database and Flows | Stable |
| FieldShellComponent | `app-field-shell` | Accessible label, required state, help and validation error | Login, Setup, component catalog, Confisys and dynamic field controls | Stable |
| DynamicFieldControlComponent | `app-dynamic-field-control` | Render fields through PrimeNG, Ionic or native adapters without changing the schema | Dynamic form runtime | Initial multikit renderer |
| DynamicFieldLibraryComponent | `app-dynamic-field-library` | Show every supported dynamic field and compare installed presentation kits | Component library and future form designer | Initial field palette |
| FormlyRuntimeComponent | `app-formly-runtime` | Reactive form, validation, conditional fields, command buttons and multi-step navigation from RuntimeForm | Dynamic form runtime and component library | Initial |
| ChicleFormlyFieldTypeComponent | `app-chicle-formly-field-type` | Connect Formly state and validation to the multikit field facade | Formly runtime | Initial internal adapter |
| ChicleFormlyDisplayTypeComponent | `app-chicle-formly-display-type` | Render declarative title, paragraph and divider content | Formly runtime | Initial internal adapter |
| PrimengFieldRendererComponent | `app-primeng-field-renderer` | Render the field contract with PrimeNG controls | Dynamic field facade | Initial adapter |
| IonicFieldRendererComponent | `app-ionic-field-renderer` | Render the field contract with Ionic controls | Dynamic field facade | Initial adapter |
| NativeFieldRendererComponent | `app-native-field-renderer` | Render the field contract with native HTML controls | Dynamic field facade | Initial fallback |
| UiPresentationSwitcherComponent | `app-ui-presentation-switcher` | Preview adaptive, PrimeNG, Ionic and native rendering | Dynamic form runtime | Initial |
| UiThemeSelectorComponent | `app-ui-theme-selector` | Select installed themes and synchronize Chicle, Ionic and PrimeNG tokens | Component library | Initial |
| PreviewViewportComponent | `app-preview-viewport` | Device-aware preview shell with desktop, tablet and mobile chrome, size metadata and projected runtime content | Dynamic form designer, dynamic form runtime and future screen designer | Stable |

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
| SetupPageComponent | First tenant and owner creation | Functional, shared public shell |
| LoginPageComponent | Policy-driven authentication | Functional, shared public shell |
| DocsPageComponent | In-app operational manual | Functional, large page |
| ConfisysPageComponent | Runtime configuration | Functional, custom layout |
| DatabasePageComponent | Data viewer and schema designer | Functional; partially uses shared designer language |
| ServicesPageComponent | Dynamic service lifecycle | Functional; reference visual workflow |
| FlowsPageComponent | Declarative process lifecycle | Functional; must continue decomposing |
| FormsPageComponent | Dynamic form designer | Functional V1; templates, guided draft, field sets, validation checklist, JSON, preview, test, version and publish |
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
6. `DataBindingEditorComponent`: generalized form of the current Flow data mapper.
7. `ActionBindingEditorComponent`: event, service/flow key, payload map, result handling and error handling.
8. `JsonEditorPanelComponent`: synchronized guided/JSON editing with parse errors and reset.
9. `VersionLifecyclePanelComponent`: draft, version, publish, compare and restore pattern shared by Services, Flows and forms.
10. `TestWorkbenchComponent`: input fixture, execute, response, duration and repeatable cases.
11. `EntityTableComponent`: server pagination, search, filters, empty/loading/error states and row commands.
12. `ConfirmActionComponent`: consistent confirmation for destructive or draft-replacing actions.

## Dynamic Forms readiness audit

| Capability | Existing reusable pieces | Status |
| --- | --- | --- |
| Runtime rendering | `FormlyRuntimeComponent`, `FormRuntimeService`, `FormlySchemaAdapterService` | V1 usable; cards, continuous, paged modes, command buttons and dynamic options |
| Multikit fields | `DynamicFieldControlComponent`, PrimeNG/Ionic/native renderers | Initial, usable; includes text, numeric, choice, file/image metadata and GPS fallback |
| Labels/help/errors | `FieldShellComponent` | Ready |
| Responsive preview | `PreviewViewportComponent`, `UiPresentationSwitcherComponent` | Ready; preview now separates device simulation, runtime content and integration contract |
| Form lifecycle guide | `ProcessStepsComponent`, `WorkflowGuideComponent`, `StatusNoticeComponent` | Ready |
| Designer workspace | `DesignerWorkspaceComponent`, catalog and section components | Ready |
| Field palette | Inline V1 in `FormsPageComponent` with quick sets; `DynamicFieldLibraryComponent` documents renderer examples | Extract shared insertion component next |
| Step management | Inline V1 in `FormsPageComponent` with add/remove/select | Extract shared component next |
| Field inspector | Inline V1 in `FormsPageComponent` with duplicate/reorder, options, validations, service bindings and visibility conditions | Extract shared component next |
| JSON editor | Inline V1 result panel below guided editing plus full editor step in `FormsPageComponent` | Extract shared component next |
| Data binding | Inline V1 service/flow selectors, runtime limits and payload/response maps in `FormsPageComponent`; Flow mapper exists only in Flow domain | Missing shared component |
| Action binding | Inline V1 commands in `FormsPageComponent`; runtime can execute service/flow/show_message buttons | Extract shared component next |
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
- JSON editor and responsive preview viewport extraction for future screen/page designers.
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
