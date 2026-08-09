# Visual Component Catalog

The runtime catalog is `apps/app/src/app/shared/ui-component-catalog.ts`. The Docs and Components pages render that
same source, so component name, selector, purpose, adoption and invocation stay synchronized.

The dedicated web catalog is available at `/components`. It is separate from operational Docs and provides search,
category/status filters, visual previews, import paths and minimal invocations for every registered visual
component. Components that cannot be nested safely, such as a page shell or primary navigation, use an explicit
structural miniature; the remaining catalog renders real component instances with sample data.

## Architecture rule

- Pages own routing, permissions, API calls and orchestration.
- Shared visual components receive typed inputs, emit outputs or use content projection.
- Shared components do not call business APIs.
- Every component must handle its relevant loading, empty, error, disabled and readonly states.
- Every component must work at 390 px without horizontal overflow.
- Use global tokens and the existing component before adding page-local copies.
- The current adoption evidence and allowed domain exceptions live in `docs/ui-reuse-audit.md`.
- Reusable components that are available to App Studio or generated apps must also follow
  `docs/declarative-component-architecture.md`. The visual component is only one adapter of the persisted component
  object.
- Generated app rendering, runtime manifests, app cache and offline queues are governed by
  `docs/dynamic-app-runtime-architecture.md`.

## Required registration

When creating a visual component:

1. Place generic components under `apps/app/src/app/shared/<component-name>`.
2. Export typed inputs and outputs.
3. Add the component to `UI_COMPONENT_CATALOG`.
4. Include selector, purpose, import path, current consumers and a minimal invocation.
5. Add it to a real page or the component gallery.
6. Build and verify desktop/mobile.
7. Update `docs/ui-component-inventory.md` when maturity or extraction priorities change.

## Shell adoption

- Authenticated Docs and application routes use `PageShellComponent`.
- Public routes use `PublicPageShellComponent`.
- Module pages use `ModuleHeaderComponent`.
- Technical maps use `ArchitectureDiagramComponent` for reusable nodes, paths and relationships.
- Drawn system blueprints use `ArchitectureBlueprintComponent` when the page needs a spatial view such as
  “front -> API -> DB”, AI sidecar, event engine and infrastructure connections.
- Draw.io-style communication maps use `ArchitectureTopologyDiagramComponent` when the page needs icons, zones and
  short connection labels without long explanations.
- Route and data loading use `LoadingSkeletonComponent`.
- Designer modules use `DesignerWorkspaceComponent`, `CatalogHeaderComponent`, `CatalogItemComponent` and
  `SectionHeaderComponent`.
- Administrative card layouts use `AdminCardGridComponent`, `AdminPanelComponent`, `AdminMetricCardComponent`,
  `AdminActionToolbarComponent`, `AdminStackComponent`, `AdminResourceCardComponent`, `AdminCodeBlockComponent` and
  `ComponentDocCardComponent`.
- Guided lifecycle uses `ProcessStepsComponent`, `WorkflowGuideComponent`, `ContextAssistantComponent`,
  `StatusNoticeComponent` and `SegmentedControlComponent`.

## Dynamic Forms foundation

Already available:

- `FieldShellComponent`
- `DynamicFieldControlComponent`
- `DynamicFieldLibraryComponent`
- `FormlyRuntimeComponent`
- `ChicleFormlyFieldTypeComponent`
- `ChicleFormlyDisplayTypeComponent`
- `PrimengFieldRendererComponent`
- `IonicFieldRendererComponent`
- `NativeFieldRendererComponent`
- `MaterialFieldRendererComponent`
- `BootstrapFieldRendererComponent`
- `AdminCardGridComponent`
- `AdminStackComponent`
- `AdminResourceCardComponent`
- `AdminCodeBlockComponent`
- `ComponentDocCardComponent`
- `UiPresentationSwitcherComponent`
- `UiThemeSelectorComponent`
- `PreviewViewportComponent`
- `FormRuntimeService`
- `PageShellComponent`
- `LoadingSkeletonComponent`
- `StatusNoticeComponent`

Still required for the designer:

- `ComponentTreeComponent`
- `PropertyInspectorComponent`
- `SchemaFieldEditorComponent`
- `DataBindingEditorComponent`
- `ActionBindingEditorComponent`
- `JsonEditorPanelComponent`
- `VersionLifecyclePanelComponent`
- `TestWorkbenchComponent`
- `EntityTableComponent`
- `ConfirmActionComponent`

## Current page audit

| Page | Shell | Shared composition | Status |
| --- | --- | --- | --- |
| Home | PageShell | panels, action toolbar, metrics, cards and shared spacing | Adopted |
| Docs | PageShell | documentation layout, catalog navigation, process guide and catalog registry | Adopted |
| Confisys | PageShell | module header, filter bar, dynamic fields, multikit buttons and loading | Adopted |
| Database | PageShell | catalog, segmented tabs, data table, schema field editor and status components | Adopted |
| Services | PageShell | full designer lifecycle, JSON authoring, fields, buttons and catalog components | Reference implementation |
| Flows | PageShell | full designer lifecycle plus reusable Flow graph, timeline and mapper components | Adopted |
| Security | PageShell | module header, panels, metrics, filters, fields, actions, notices and loading | Adopted |
| Environment Deploy Center | PageShell | panels, stacks, form grids, resource cards, code blocks, fields, metrics and actions | Adopted |
| Text Packages | PageShell | module header, filter bar, panels, fields, actions and search-first lists | Adopted |
| App Studio | PageShell | designer workspace, app catalog, workspace tabs, module header, preview viewport, fields, actions, cards and trash workspace | V2 foundation adopted |
| Dynamic form runtime | PageShell | field renderer, preview, mobile actions, loading and notices | Forms foundation |
| Login | PublicPageShell | dynamic fields, segmented control, notices, loading and multikit actions | Adopted |
| Setup | PublicPageShell | dynamic fields, notices, loading and multikit actions | Adopted |

Page-local CSS is allowed for domain composition. It must not recreate navigation shells, module headers, loading
states, catalogs, generic field wrappers, action buttons, cards, code blocks or preview viewports. Page templates must
use reusable Chicle components for all generic visual primitives.

## Multikit Rendering

Dynamic fields use one Chicle facade and five concrete adapters: PrimeNG, Ionic, Angular Material, Bootstrap and native
fallback. Forms and screens store the optional `presentation` contract documented in
`docs/ui-presentation-architecture.md`; they never store library selectors or CSS classes. Themes remain independent
from kits.

The component library exposes every theme registered by `UiThemeService`. Theme selection updates Chicle tokens,
Ionic variables and the active PrimeNG preset together.

Reusable controls must use framework-native primitives when a kit is selected: PrimeNG controls for PrimeNG, Ionic
controls for Ionic, Angular Material controls for Material, Bootstrap classes for Bootstrap and plain HTML only for the
native fallback. This keeps visual changes real instead of only changing colors.

The current Admin criterion is 100% page-level transformation: no audited Admin page owns raw `button`, `input`,
`select` or `textarea` controls. Native HTML remains only inside reusable boundaries such as field renderers,
`UiKitButtonComponent`, `CodeTextareaComponent`, `CatalogItemComponent`, `SegmentedControlComponent` and mobile evidence
controls.

Dark mode is token-driven. Components must read `--ch-*` variables for surface, text, border, focus, radius, shadows and
semantic states. Page-local dark palettes are not allowed.

Formly is the form lifecycle engine. `FormlyRuntimeComponent` and `FormlySchemaAdapterService` keep stored forms
library-neutral while reusing the same multikit field facade. The complete boundary is documented in
`docs/formly-architecture.md`.

`DynamicFieldLibraryComponent` is the initial field palette: it renders the 17 supported field and display types
through `DynamicFieldControlComponent`, so the same contract can be compared across PrimeNG, Ionic, Material,
Bootstrap and native presentation. Designer search, dragging and field insertion extend this contract instead of
creating another palette.

## App Studio Component Rule

App Studio must use the same reusable primitives as Services, Forms and Flows:

- `DesignerWorkspaceComponent` for app catalog plus selected workspace.
- `CatalogHeaderComponent` and `CatalogItemComponent` for app, screen, component template and package lists.
- `ModuleHeaderComponent` for page titles.
- `ProcessStepsComponent` and `WorkflowGuideComponent` for create, preview and publish sequences.
- `PreviewViewportComponent` for desktop, tablet, mobile and public/embedded previews.
- `DynamicFieldControlComponent` for app identity, navigation, routing, security and preference fields.
- `UiKitButtonComponent` and `UiKitCardComponent` for portable buttons and cards.
- `JsonAuthoringPanelComponent` for JSON-only app and screen authoring.

The app runtime itself must consume the component registry. A generated Ionic app should render `auth_login`,
`bottom_nav`, `form_runtime`, `media_gallery` and other supported components through their Ionic adapters when the
active kit is Ionic. Admin must never fake Ionic mode by restyling native HTML controls.

App Studio components must also be functional declarative objects. The canvas does not store only placement and a
label. It stores `componentKey`, `props`, `layout`, `presentation`, `data`, `events`, `actions`, `permissions`,
`states`, `i18n` and `preview` according to `docs/declarative-component-architecture.md`. This is the rule that lets a
button know whether it navigates, executes a service, opens a modal or runs a flow without hardcoding behavior in the
screen page.

The component catalog must present `componentKey` as the primary identity. Angular selectors such as `app-*` and Ionic
selectors such as `ion-*` are technical implementation selectors. Standardization does not rename those selectors:
`ion-alert` can remain the Ionic adapter implementation, while the public component is `feedback.alert`. The catalog may
show the technical selector as metadata, but AI, templates and tenant JSON must use `componentKey`.

Ionic-backed standard components use canonical Chicle keys such as `feedback.alert`, `nav.tabs`, `layout.grid` or
`overlay.action_sheet`; their adapter matrix says that the Ionic adapter is available and the other kits are planned.
Components already standardized through Chicle facades, such as `ui.button`, `ui.card` or `form.field`, must not be
duplicated as separate Ionic components.

Those component objects are delivered to generated web, Ionic mobile and desktop shells through the published runtime
manifest defined in `docs/dynamic-app-runtime-architecture.md`.
