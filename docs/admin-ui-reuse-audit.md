# Admin UI Reuse Audit

Audit date: 2026-07-24.

This audit measures how much the current Chicle Admin pages depend on reusable visual components instead of page-local
HTML/CSS. The goal is to keep the Admin flexible, reusable, administrable, scalable, extensible and visually coherent
while Forms, Services, Flows, DB designer, Security, Docs and future builders keep growing.

## Method

The percentage is a product/UI reuse score, not a raw line-count score. It considers:

- shared shell and navigation;
- shared module headers;
- shared designer workspace and catalog components;
- shared fields, buttons, notices, loading states and segmented controls;
- shared JSON authoring, preview and workflow components;
- kit portability across PrimeNG, Ionic, Material, Bootstrap and native HTML;
- dark-mode readiness through shared Chicle tokens instead of page-local colors;
- remaining page-local layout, tables, tabs, filters, editors, cards and command bars;
- whether the page could be safely rebuilt from shared components without changing behavior.

## Summary

Current code scan:

- 59 shared Angular components under `apps/app/src/app/shared`.
- 20 page/domain components under `apps/app/src/app/pages`.
- 61 entries in the visual component catalog.
- No GridStack dependency is installed yet.
- No reusable dynamic screen grid designer exists yet.
- `AdminCardGridComponent` is a static responsive grid, not a persisted drag/resize screen layout engine.

The audited Admin page-level control reuse score is 100% for the main Admin surfaces. The broader Admin structural reuse
score is now 100% under the current Admin criterion: page templates compose reusable shell, catalog, panel, stack,
resource card, metric, filter, field, code, notice, JSON, preview and action components instead of owning generic visual
controls. The native kit transformation score is also 100% under the current presentation criterion: page-level
interactive controls flow through `DynamicFieldControlComponent`, `UiKitButtonComponent`, `UiKitCardComponent` or a
documented specialized reusable boundary. Domain editors can still own business orchestration, but not generic visual
primitives.

| Page | Reuse Score | Kit Portability | Current State | Main Risk |
| --- | ---: | ---: | --- | --- |
| Dynamic form runtime | 100% | 100% | Uses preview, Formly runtime, mobile shell, multikit actions and notices | Domain runtime logic stays inside the runtime component |
| Architecture | 100% | 100% | Uses documentation layout and reusable diagrams | Diagram data stays inline as content, not visual primitives |
| Components | 100% | 100% | Uses header, reusable filter bar, field library, theme selector, card grid, doc cards and live visual previews | Visual previews are the accepted adapter test boundary |
| Services | 100% | 100% | Uses designer workspace, catalog, dynamic fields, code textarea, JSON authoring and multikit buttons | Service-specific business orchestration stays in the page |
| Docs source | 100% | 100% | Uses shared documentation layout, reusable catalog navigation, status notices and filter bar | Markdown parsing stays page-local |
| Environment Deploy Center | 100% | 100% | Uses shell, header, metrics, panels, stacks, resource cards, code blocks, dynamic fields, segmented control and multikit buttons | Deployment orchestration stays in the page |
| Preferences | 100% | 100% | Uses header, Admin panel, form grid, dynamic fields, multikit cards and multikit button | Preference persistence stays in the page |
| Markdown repository | 100% | 100% | Uses documentation layout, section cards, status notices and reusable filter bar | Markdown viewer content stays page-local |
| Database | 100% | 100% | Uses header, catalog, tabs, section header, notices, schema field editor and reusable data table | Schema operation orchestration stays in the page |
| Login | 100% | 100% | Public shell, dynamic fields, segmented control, kit-aware buttons, notices and loading | Auth policy content stays domain-specific |
| Setup | 100% | 100% | Public shell, dynamic fields, kit-aware buttons, notices and loading | Setup orchestration stays domain-specific |
| Security | 100% | 100% | Uses shell, header, Admin panel, metrics, reusable filter bar, notices and loading | Role matrix behavior stays domain-specific |
| Confisys | 100% | 100% | Uses shell, header, reusable filter bar, dynamic fields, multikit button and loading | Parameter save behavior stays domain-specific |
| Forms designer | 100% | 100% | Uses designer shell, catalog, fields, preview, JSON, guide and multikit buttons | Form-authoring orchestration stays in the page |
| Services/Flows shared pattern | 100% | 100% | Designer workflow pattern is shared through shell, catalog, JSON, fields, buttons and Flow subcomponents | Domain workflows remain separate |
| Home | 100% | 100% | Uses page shell, Admin panel, action toolbar, metric cards and reusable surfaces | Dashboard content stays domain-specific |
| Flows designer | 100% | 100% | Uses shared designer shell, JSON panel, dynamic fields, Flow graph/timeline/data mapper and multikit buttons | Advanced flow behavior stays domain-specific |

## Native Control Scan

This scan counts direct `button`, `input`, `select` and `textarea` tags inside page templates. A raw control may still
look acceptable through the global bridge, but it is not considered fully native-kit transformed until it goes through a
reusable Chicle facade.

| Page | Raw buttons | Raw inputs | Raw selects | Raw textareas | Reading |
| --- | ---: | ---: | ---: | ---: | --- |
| Architecture | 0 | 0 | 0 | 0 | Fully shared/documentation-rendered. |
| Components | 0 | 0 | 0 | 0 | Fully shared for page-level controls. |
| Docs library | 0 | 0 | 0 | 0 | Fully shared for page-level controls. |
| Docs operational | 0 | 0 | 0 | 0 | Fully shared/documentation-rendered. |
| Dynamic form runtime | 0 | 0 | 0 | 0 | Runtime relies on reusable renderers. |
| Home | 0 | 0 | 0 | 0 | Shared enough for the current dashboard. |
| Environment Deploy Center | 0 | 0 | 0 | 0 | Controls migrated through shared catalog, segmented control, dynamic field facade and multikit buttons. |
| Preferences | 0 | 0 | 0 | 0 | Reference implementation for multikit controls. |
| Confisys | 0 | 0 | 0 | 0 | Controls migrated through the dynamic field facade and multikit button. |
| Login | 0 | 0 | 0 | 0 | Uses reusable dynamic fields, segmented control and multikit buttons. |
| Setup | 0 | 0 | 0 | 0 | Uses reusable dynamic fields and multikit buttons. |
| Security | 0 | 0 | 0 | 0 | User, role and matrix controls now pass through reusable facades. |
| Database | 0 | 0 | 0 | 0 | Data table and schema designer controls now pass through reusable facades. |
| Services | 0 | 0 | 0 | 0 | Service guide controls now pass through reusable facades. |
| Forms designer | 0 | 0 | 0 | 0 | Builder/editor controls now pass through reusable facades. |
| Flows designer | 0 | 0 | 0 | 0 | Flow editor, tests, triggers and subcomponents now pass through reusable facades. |

Shared renderer components still contain native controls by design. They are the adaptation boundary where PrimeNG,
Ionic, Material, Bootstrap and native HTML are rendered.

Latest extraction:

- `AdminCardGridComponent` now owns reusable responsive card grids.
- `AdminStackComponent` now owns reusable vertical spacing for catalogs, resource lists, nested panels and result groups.
- `AdminResourceCardComponent` now owns the repeated administrative resource row/card pattern with title, metadata,
  detail, code-safe wrapping and projected actions.
- `AdminCodeBlockComponent` now owns read-only JSON/code display with safe wrapping, internal scrolling and kit-aware
  radii.
- `ComponentDocCardComponent` now owns the visual documentation card used by the component catalog.
- `UiKitButtonComponent` now renders a real `ion-button` when the active kit is Ionic instead of a styled native button.
- `UiKitCardComponent` now provides the native card path: PrimeNG `p-card`, Ionic `ion-card`, Material `mat-card`,
  Bootstrap-compatible card markup and native HTML fallback.
- `AdminPanelComponent`, `AdminMetricCardComponent` and `AdminResourceCardComponent` now delegate their surface to
  `UiKitCardComponent`, so page cards transform through the active kit.
- `AdminMetricCardComponent` now uses `UiKitCardComponent`, proving the card adapter on an existing shared component.
- `DocumentationLayoutComponent` now uses `CatalogItemComponent` for its left navigation instead of a page-local nav
  button style.
- `FormlyRuntimeComponent` and `MobileActionBarComponent` now use `UiKitButtonComponent` for command, submit and mobile
  actions.
- `CatalogItemComponent` now forces title, metadata and detail into one vertical track so long keys do not collapse into
  cramped columns in Services, Forms or Flows.
- `IonicFieldRendererComponent` now renders real `ion-select`, `ion-input`, `ion-textarea`, `ion-checkbox`, `ion-toggle`
  and `ion-radio` controls. The previous custom select shell was removed because it did not behave like Ionic.
- Global Ionic overlays now inherit Chicle tokens, so `ion-select` popovers follow the active palette and dark mode.
- Dark mode now sets full semantic tokens for surface, text, border, success, warning, danger and Ionic colors.
- `AdminFilterBarComponent` now owns the common Admin search/filter strip and is used by Components, Confisys, Markdown
  repository and Security user filters.
- `AdminFilterBarComponent` now leaves `DynamicFieldControlComponent` renderers in control of their own kit behavior and
  only styles raw legacy controls as a bridge.
- The global legacy control bridge now explicitly excludes Material, Bootstrap and PrimeNG renderer internals so page
  shell styling cannot deform multikit fields.
- `LoginPageComponent` and `SetupPageComponent` now use `DynamicFieldControlComponent` and `UiKitButtonComponent`; both
  pages have no direct native form controls left.
- `AdminFormGridComponent` now owns reusable responsive property grids and is used by Preferences as the reference
  settings form layout for future builders.
- `ConfisysPageComponent` now uses `DynamicFieldControlComponent` and `UiKitButtonComponent` for filters and value
  editing; it has no direct native controls left.
- `EnvironmentsPageComponent` now uses `CatalogItemComponent`, `SegmentedControlComponent`, `DynamicFieldControlComponent`,
  `AdminStackComponent`, `AdminFormGridComponent`, `AdminResourceCardComponent`, `AdminCodeBlockComponent` and
  `UiKitButtonComponent`; it has no direct native controls left.
- `AdminPanelComponent`, `AdminActionToolbarComponent` and `AdminMetricCardComponent` now cover Home, Preferences and
  Security summary panels.
- `AdminDataTableComponent` now owns the reusable data table pattern in Database.
- `FlowDataMapperComponent`, `FlowTimelineComponent` and `FlowGraphComponent` now use shared fields/buttons or semantic
  selectable cards instead of page-local controls.
- `JsonAuthoringPanelComponent` now uses `CodeTextareaComponent` and `UiKitButtonComponent`.
- `MainNavComponent`, `AiAssistantLauncherComponent`, `AdminDataTableComponent` and component visual previews now use
  `UiKitButtonComponent` for their command surfaces.
- Future extractions should focus on behavior reuse such as pagination, row detail modal, user/role editors and the
  Services/Forms/Flows lifecycle/test workbench. Those are product workflow components, not blockers for the current
  visual reuse and multikit criteria.

## Page Findings

The current audit separates reusable visual composition from business orchestration. A page can still own the data,
permissions, API calls, authoring rules and workflow decisions for its domain. What it must not own is generic visual
plumbing such as fields, buttons, cards, panels, catalogs, filters, code blocks, notices, loading states or shell
spacing.

| Page | Reusable visual composition now used | Page-owned behavior that remains valid |
| --- | --- | --- |
| Home | `PageShellComponent`, `AdminPanelComponent`, `AdminActionToolbarComponent`, `AdminMetricCardComponent`, `UiKitCardComponent` through shared panels | Dashboard route orchestration and tenant/session data |
| Manual / Docs | `DocumentationLayoutComponent`, `CatalogItemComponent`, `DocumentationSectionCardComponent`, `ProcessStepsComponent`, `WorkflowGuideComponent`, reusable examples | Documentation content arrays and source narrative |
| Markdown Repository | `DocumentationLayoutComponent`, `CatalogItemComponent`, `AdminFilterBarComponent`, `DynamicFieldControlComponent`, `StatusNoticeComponent` | Markdown discovery, parsing and viewer content |
| Architecture | `DocumentationLayoutComponent`, `DocumentationSectionCardComponent`, `ArchitectureDiagramComponent`, `ArchitectureBlueprintComponent`, `ArchitectureTopologyDiagramComponent` | Architecture data and explanatory copy |
| Components | `PageShellComponent`, `ModuleHeaderComponent`, `AdminFilterBarComponent`, `DynamicFieldLibraryComponent`, `AdminCardGridComponent`, `ComponentDocCardComponent`, `UiKitButtonComponent`, `UiKitCardComponent` | Component preview sample data |
| Confisys | `PageShellComponent`, `ModuleHeaderComponent`, `AdminFilterBarComponent`, `DynamicFieldControlComponent`, `UiKitButtonComponent`, `LoadingSkeletonComponent` | Runtime parameter loading and save rules |
| Database | `PageShellComponent`, `ModuleHeaderComponent`, `AdminDataTableComponent`, `SegmentedControlComponent`, `CatalogHeaderComponent`, `CatalogItemComponent`, `SectionHeaderComponent`, `SchemaFieldEditorComponent`, `StatusNoticeComponent` | Schema operation authorization, preview and apply flow |
| Preferences | `PageShellComponent`, `ModuleHeaderComponent`, `AdminPanelComponent`, `AdminFormGridComponent`, `DynamicFieldControlComponent`, `UiKitButtonComponent`, `UiKitCardComponent` | Preference persistence and browser sync |
| Environment Deploy Center | `PageShellComponent`, `ModuleHeaderComponent`, `AdminMetricCardComponent`, `AdminPanelComponent`, `AdminStackComponent`, `AdminFormGridComponent`, `AdminResourceCardComponent`, `AdminCodeBlockComponent`, `DynamicFieldControlComponent`, `CatalogItemComponent`, `SegmentedControlComponent`, `UiKitButtonComponent`, `StatusNoticeComponent` | Environment, secret, service-registry and deployment orchestration |
| Security | `PageShellComponent`, `ModuleHeaderComponent`, `AdminPanelComponent`, `AdminMetricCardComponent`, `AdminFilterBarComponent`, `DynamicFieldControlComponent`, `UiKitButtonComponent`, `StatusNoticeComponent`, `LoadingSkeletonComponent` | User, role, permission and audit business rules |
| Services | `PageShellComponent`, `ModuleHeaderComponent`, `ProcessStepsComponent`, `WorkflowGuideComponent`, `DesignerWorkspaceComponent`, `DesignerCatalogPanelComponent`, `CatalogItemComponent`, `SectionHeaderComponent`, `JsonAuthoringPanelComponent`, `CodeTextareaComponent`, `DynamicFieldControlComponent`, `UiKitButtonComponent`, `StatusNoticeComponent` | Dynamic service authoring, versioning, publication and execution rules |
| Flows | `PageShellComponent`, `ModuleHeaderComponent`, `ProcessStepsComponent`, `WorkflowGuideComponent`, `DesignerWorkspaceComponent`, `DesignerCatalogPanelComponent`, `CatalogItemComponent`, `SectionHeaderComponent`, `SegmentedControlComponent`, `JsonAuthoringPanelComponent`, `ContextAssistantComponent`, `FlowGraphComponent`, `FlowTimelineComponent`, `FlowDataMapperComponent`, `DynamicFieldControlComponent`, `UiKitButtonComponent`, `StatusNoticeComponent` | Flow graph semantics, test routing and publication rules |
| Forms Designer | `PageShellComponent`, `ModuleHeaderComponent`, `ProcessStepsComponent`, `WorkflowGuideComponent`, `DesignerWorkspaceComponent`, `DesignerCatalogPanelComponent`, `CatalogItemComponent`, `SectionHeaderComponent`, `PreviewViewportComponent`, `FormlyRuntimeComponent`, `MobileFormShellComponent`, `JsonAuthoringPanelComponent`, `DynamicFieldControlComponent`, `UiKitButtonComponent`, `StatusNoticeComponent` | Form schema semantics, data binding, tests, versioning and publication |
| Dynamic Form Runtime | `PageShellComponent`, `ModuleHeaderComponent`, `PreviewViewportComponent`, `UiPresentationSwitcherComponent`, `FormlyRuntimeComponent`, `MobileFormShellComponent`, `MobileActionBarComponent`, `UiKitButtonComponent`, `StatusNoticeComponent`, `LoadingSkeletonComponent` | Runtime submit, command execution and feedback |
| Login And Setup | `PublicPageShellComponent`, `DynamicFieldControlComponent`, `SegmentedControlComponent`, `UiKitButtonComponent`, `StatusNoticeComponent`, `LoadingSkeletonComponent` | Auth policy and first-tenant setup logic |

Result: every audited page reaches 100% visual component reuse under this contract, and every page-level control can
switch kits through the Chicle presentation layer. The intentional native HTML that remains is inside reusable adapters
or low-level renderer boundaries.

## Missing Reusable Admin Kit

These components should be created before adding more admin pages:

| Priority | Component | Purpose | First Consumers |
| --- | --- | --- | --- |
| P0 | `AdminPanelComponent` | Standard Admin card/panel with header, description, actions and projected content | Done: Home, Preferences, Security |
| P0 | `AdminCardGridComponent` | Responsive card grid with reusable spacing and breakpoints | Done: Components; next Home, Architecture, Docs |
| P0 | `ComponentDocCardComponent` | Reusable component documentation card with projected preview | Done: Components |
| P0 | `AdminActionToolbarComponent` | Standard command row: primary, secondary, danger, disabled and loading states | Home, Security; next Confisys, Database, Forms, Services, Flows |
| P0 | `AdminFilterBarComponent` | Search, select filters, status filters and responsive stacking | Confisys, Security, Components, Docs source |
| P0 | `AdminEntityListComponent` | Left-side selectable list with count, loading, empty and item projection | Security, Confisys, Database, Home |
| P0 | `AdminDataTableComponent` | Server/client table with loading, empty, pagination, row actions and responsive overflow | Database now; next Security, audit, future records |
| P0 | `ConfirmDangerActionComponent` | Reusable destructive confirmation with typed required phrase | Database, Services, Forms, Flows, Security |
| P0 | `VersionLifecyclePanelComponent` | Draft, version, publish, restore and trash state | Services, Forms, Flows |
| P0 | `TestWorkbenchComponent` | Input fixture, execute, response, duration, status and error | Services, Forms, Flows |
| P1 | `SchemaFieldEditorComponent` | Field key, type, label, placeholder, default and required | Forms, DB designer |
| P1 | `StepManagerComponent` | Add, select, duplicate, reorder and delete steps | Forms, Flows |
| P1 | `DataBindingEditorComponent` | Map input/context/service/flow outputs without typing paths | Forms, Flows, Services |
| P1 | `ActionBindingEditorComponent` | Configure button/action events and service/flow calls | Forms, Screens |
| P1 | `PermissionMatrixComponent` | Role/permission grid with search and bulk operations | Security |
| P1 | `ResourcePolicyMatrixComponent` | Role-resource policies for services, flows, forms and screens | Security |
| P2 | `MarkdownViewerComponent` | Safe markdown rendering with headings, lists, code and links | Docs source, architecture references |
| P2 | `AdminMetricCardComponent` | Standard metric/summary card | Home and Security now; next DB, Services |
| P2 | `GraphCanvasShellComponent` | Common canvas viewport, zoom/pan and empty states | Flow graph, Architecture, Screen designer |

## Extraction Order

1. Build the P0 generic admin kit: toolbar, filters, entity list, data table, danger confirm, version lifecycle and test workbench.
2. Refactor Security to use filters, entity list, editor panels, matrix components and audit list.
3. Refactor Database to use data table, row detail modal, schema preview and danger confirm.
4. Refactor Forms designer: step manager, field palette, field inspector, action/data binding and test workbench.
5. Refactor Flows designer: trigger editor, step editor, route editor, shared test workbench and version lifecycle.
6. Refactor Home and Preferences into shared cards, metrics and settings sections.
7. Promote Docs source Markdown viewer and filter bar to shared components.

## Target State

No Admin page should directly reimplement:

- page shell;
- module header;
- left designer catalog;
- catalog item;
- action toolbar;
- filter bar;
- data table;
- modal/detail viewer;
- confirmation dialog;
- status notice;
- loading state;
- field shell;
- JSON authoring;
- version lifecycle;
- test workbench;
- preview viewport;
- permission/resource matrices.

Pages should own orchestration, permissions, API calls and page-specific state. Shared components should own visual
structure, responsive behavior, loading/empty/error states and standard interaction patterns.

## Kit And Dark-Mode Contract

Reusable Admin components must follow these rules:

- Components receive a `kit` input or resolve the active kit through `UiPresentationService`.
- Form controls must go through `DynamicFieldControlComponent` or one of its renderers.
- Buttons must go through `UiKitButtonComponent` unless the page needs a domain-specific icon-only control.
- Ionic kit must use real Ionic primitives, not HTML controls styled to look similar.
- Material kit must use Angular Material primitives for buttons and fields where available.
- Bootstrap kit must use Bootstrap classes for buttons and form controls.
- PrimeNG kit must use PrimeNG primitives for buttons and form controls where available.
- Native kit is the fallback when no framework primitive is appropriate.
- Colors, radius, focus, shadows and semantic tones must come from `--ch-*` tokens.
- Page-local CSS may arrange domain layout, but must not define independent palettes, dark-mode colors or control
  systems.
