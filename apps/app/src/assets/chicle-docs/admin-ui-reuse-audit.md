# Admin UI Reuse Audit

Audit date: 2026-07-23.

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

| Page | Reuse Score | Kit Portability | Current State | Main Risk |
| --- | ---: | ---: | --- | --- |
| Dynamic form runtime | 90% | 82% | Uses preview, Formly runtime, mobile shell and notices | Runtime submit/test layout is still local |
| Architecture | 88% | 75% | Uses documentation layout and reusable diagrams | Diagram data stays inline |
| Components | 88% | 86% | Uses header, reusable filter bar, field library, theme selector, card grid, doc cards and live visual previews | Some field-library examples still expose domain-specific copy |
| Services | 84% | 70% | Best reference implementation for designers | Some service-specific filter/editor controls remain inline |
| Docs source | 82% | 72% | Uses shared documentation layout and section card | Large manual content arrays remain page-local |
| Preferences | 78% | 80% | Uses header, Admin panel, dynamic fields and multikit button | Preview chips and roadmap items remain local |
| Markdown repository | 72% | 68% | Uses documentation layout, section cards, status notices and reusable filter bar | Markdown parser/viewer still page-local |
| Database | 72% | 62% | Uses header, catalog, tabs, section header, notices and reusable data table | Modal editor, pagination and schema designer remain inline |
| Login | 72% | 55% | Public shell, field shell, notices and loading | Auth policy panel and tabs are custom |
| Setup | 70% | 55% | Public shell, field shell, notices and loading | Setup cards and review flow are custom |
| Security | 68% | 60% | Uses shell, header, Admin panel, metrics, reusable filter bar, notices and loading | Users, roles, policy matrix and audit list are custom |
| Confisys | 64% | 58% | Uses shell, header, field shell, loading and reusable filter bar | Parameter list/editor is custom |
| Forms designer | 64% | 66% | Uses designer shell, catalog, fields, preview, JSON and guide | Step manager, field inspector, actions and test bench are inline |
| Services/Flows shared pattern | 63% | 62% | Pattern exists and is reusable | Flows has not fully extracted to it |
| Home | 60% | 58% | Uses page shell, Admin panel, action toolbar and metric cards | Module cards/grid still local |
| Flows designer | 34% | 44% | Uses shared designer shell, JSON panel and guide | Very large page with many inline editors, tabs, graph controls and test UI |

Latest extraction:

- `AdminCardGridComponent` now owns reusable responsive card grids.
- `ComponentDocCardComponent` now owns the visual documentation card used by the component catalog.
- `UiKitButtonComponent` now renders a real `ion-button` when the active kit is Ionic instead of a styled native button.
- `UiKitCardComponent` now provides the native card path: PrimeNG `p-card`, Ionic `ion-card`, Material `mat-card`,
  Bootstrap-compatible card markup and native HTML fallback.
- `AdminMetricCardComponent` now uses `UiKitCardComponent`, proving the card adapter on an existing shared component.
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
- `AdminPanelComponent`, `AdminActionToolbarComponent` and `AdminMetricCardComponent` now cover Home, Preferences and
  Security summary panels.
- `AdminDataTableComponent` now owns the reusable data table pattern in Database.
- The next safe pass should extract pagination, row detail modal, user/role editors, schema designer forms and the
  Services/Forms/Flows lifecycle/test workbench.

## Page Findings

### Home

Current reusable pieces:

- `PageShellComponent`.
- `AdminPanelComponent`;
- `AdminActionToolbarComponent`;
- `AdminMetricCardComponent`.

Own UI still inside page:

- dashboard module cards;
- module grid;
- tenant/session detail rows.

Required extraction:

- `AdminDashboardGridComponent`;
- `AdminShortcutGridComponent`;
- `AdminActivityPanelComponent`.

Target reuse: 80%.

### Manual / Docs

Current reusable pieces:

- `DocumentationLayoutComponent`;
- `DocumentationSectionCardComponent`;
- `ProcessStepsComponent`;
- `WorkflowGuideComponent`;
- several catalog/preview components rendered as examples.

Own UI still inside page:

- long manual content arrays;
- some documentation-specific visual groups;
- code/example rendering.

Required extraction:

- `DocsCodeBlockComponent`;
- `DocsExamplePanelComponent`;
- `DocsReferenceListComponent`.

Target reuse: 85%.

### Markdown Repository

Current reusable pieces:

- `DocumentationLayoutComponent`;
- `DocumentationSectionCardComponent`;
- `StatusNoticeComponent`.
- `AdminFilterBarComponent`.

Own UI still inside page:

- Markdown parser;
- Markdown viewer;

Required extraction:

- `MarkdownViewerComponent`.

Target reuse: 90%.

### Architecture

Current reusable pieces:

- `DocumentationLayoutComponent`;
- `DocumentationSectionCardComponent`;
- `ArchitectureDiagramComponent`;
- `ArchitectureBlueprintComponent`;
- `ArchitectureTopologyDiagramComponent`.

Own UI still inside page:

- architecture data arrays;
- several content sections and narrative blocks;
- source-doc mapping.

Required extraction:

- `ArchitectureSectionMapComponent`;
- `ArchitecturePrinciplesGridComponent`;
- optional data files for diagram definitions.

Target reuse: 85%.

### Components

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `AdminFilterBarComponent`;
- `UiThemeSelectorComponent`;
- `DynamicFieldLibraryComponent`;
- `StatusNoticeComponent`;
- `ComponentVisualPreviewComponent`.
- `AdminCardGridComponent`;
- `ComponentDocCardComponent`.

Own UI still inside page:

- preview details.

Required extraction:

- `ComponentVisualPreviewComponent` should move from page-local to shared once the examples become useful outside
  `/components`.

Target reuse: 92%.

### Confisys

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `AdminFilterBarComponent`;
- `FieldShellComponent`;
- `LoadingSkeletonComponent`.

Own UI still inside page:

- parameter list;
- value editor;
- save/reset actions;
- per-type rendering.

Required extraction:

- `AdminEntityListComponent`;
- `AdminFormGridComponent`;
- `AdminActionToolbarComponent`;
- `KeyValueEditorComponent`.

Target reuse: 80%.

### Database

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `AdminDataTableComponent`;
- `SegmentedControlComponent`;
- `CatalogHeaderComponent`;
- `CatalogItemComponent`;
- `SectionHeaderComponent`;
- `StatusNoticeComponent`;
- `LoadingSkeletonComponent`.

Own UI still inside page:

- pagination;
- table row detail modal;
- schema designer form;
- migration preview/history;
- destructive action confirmation.

Required extraction:

- `AdminPaginationComponent`;
- `RowDetailModalComponent`;
- `SchemaDesignerFormComponent`;
- `SchemaPreviewPanelComponent`;
- `MigrationHistoryPanelComponent`;
- `ConfirmDangerActionComponent`.

Target reuse: 80%.

### Preferences

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `DynamicFieldControlComponent`;
- `UiKitButtonComponent`.

Own UI still inside page:

- preference sections;
- preview card;
- roadmap cards;
- save/reset layout.

Required extraction:

- `SettingsSectionComponent`;
- `SettingsPreviewPanelComponent`;
- `AdminActionToolbarComponent`;
- `AdminCardGridComponent`.

Target reuse: 80%.

### Security

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `StatusNoticeComponent`;
- `LoadingSkeletonComponent`.

Own UI still inside page:

- users catalog;
- filters;
- user editor;
- role editor;
- permissions matrix;
- resource policy matrix;
- audit event list;
- create/edit/reset-password flows.

Required extraction:

- `AdminFilterBarComponent`;
- `AdminEntityListComponent`;
- `AdminSplitWorkspaceComponent`;
- `UserAccessEditorComponent`;
- `RoleEditorComponent`;
- `PermissionMatrixComponent`;
- `ResourcePolicyMatrixComponent`;
- `AuditEventListComponent`;
- `ConfirmDangerActionComponent`.

Target reuse: 75% after domain extraction, 85% after generic table/list/filter components.

### Services

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `ProcessStepsComponent`;
- `WorkflowGuideComponent`;
- `DesignerWorkspaceComponent`;
- `DesignerCatalogPanelComponent`;
- `CatalogItemComponent`;
- `SectionHeaderComponent`;
- `JsonAuthoringPanelComponent`;
- `StatusNoticeComponent`.

Own UI still inside page:

- service definition guide;
- table/filter builder;
- join builder;
- live test panel;
- run history;
- publish/version cards.

Required extraction:

- `DataSourceDesignerComponent`;
- `FilterBuilderComponent`;
- `RelationBuilderComponent`;
- `VersionLifecyclePanelComponent`;
- `TestWorkbenchComponent`;
- `RunHistoryPanelComponent`.

Target reuse: 88%.

### Flows

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `ProcessStepsComponent`;
- `WorkflowGuideComponent`;
- `DesignerWorkspaceComponent`;
- `DesignerCatalogPanelComponent`;
- `CatalogItemComponent`;
- `SectionHeaderComponent`;
- `SegmentedControlComponent`;
- `JsonAuthoringPanelComponent`;
- `ContextAssistantComponent`;
- `StatusNoticeComponent`;
- domain components: `FlowGraphComponent`, `FlowTimelineComponent`, `FlowDataMapperComponent`.

Own UI still inside page:

- most flow wizard blocks;
- trigger editor;
- step editor;
- route editor;
- test suite;
- version/publish;
- graph/list switching and many specialized action bars.

Required extraction:

- `TriggerEditorComponent`;
- `StepEditorComponent`;
- `RouteEditorComponent`;
- `DataBindingEditorComponent`;
- `VersionLifecyclePanelComponent`;
- `TestWorkbenchComponent`;
- `RunHistoryPanelComponent`;
- `DesignerAssistantPanelComponent`;
- `GraphCanvasShellComponent`.

Target reuse: 75% after first extraction, 85% after graph/test/version reuse.

### Forms Designer

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `ProcessStepsComponent`;
- `WorkflowGuideComponent`;
- `DesignerWorkspaceComponent`;
- `DesignerCatalogPanelComponent`;
- `CatalogItemComponent`;
- `SectionHeaderComponent`;
- `FieldShellComponent`;
- `PreviewViewportComponent`;
- `FormlyRuntimeComponent`;
- `MobileFormShellComponent`;
- `JsonAuthoringPanelComponent`;
- `StatusNoticeComponent`.

Own UI still inside page:

- purpose assistant cards;
- presentation/layout editor;
- command/action editor;
- step manager;
- field palette;
- field inspector;
- validations;
- data-source and visibility rules;
- preview/test panels;
- version/publish flow.

Required extraction:

- `StepManagerComponent`;
- `FieldPaletteComponent`;
- `SchemaFieldEditorComponent`;
- `FieldValidationEditorComponent`;
- `VisibilityRuleEditorComponent`;
- `AccessRuleEditorComponent`;
- `ActionBindingEditorComponent`;
- `DataBindingEditorComponent`;
- `PresentationLayoutEditorComponent`;
- `VersionLifecyclePanelComponent`;
- `TestWorkbenchComponent`.

Target reuse: 80%.

### Dynamic Form Runtime

Current reusable pieces:

- `PageShellComponent`;
- `ModuleHeaderComponent`;
- `PreviewViewportComponent`;
- `UiPresentationSwitcherComponent`;
- `FormlyRuntimeComponent`;
- `MobileFormShellComponent`;
- `StatusNoticeComponent`;
- `LoadingSkeletonComponent`.

Own UI still inside page:

- runtime action placement;
- preview/run wrapper;
- submit feedback placement.

Required extraction:

- `RuntimeSubmitPanelComponent`;
- `RuntimeFeedbackPanelComponent`.

Target reuse: 90%.

### Login And Setup

Current reusable pieces:

- `PublicPageShellComponent`;
- `FieldShellComponent`;
- `StatusNoticeComponent`;
- `LoadingSkeletonComponent`.

Own UI still inside pages:

- auth policy cards;
- setup status cards;
- public form layout;
- action placement.

Required extraction:

- `PublicAuthPanelComponent`;
- `PublicFormCardComponent`;
- `SetupStatusCardComponent`;
- `AdminActionToolbarComponent` adapted for public routes.

Target reuse: 85%.

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
