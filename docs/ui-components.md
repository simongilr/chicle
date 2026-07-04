# Visual component catalog

The runtime catalog is `apps/app/src/app/shared/ui-component-catalog.ts`. The in-app manual renders that same source,
so component name, selector, purpose, adoption and invocation stay synchronized.

The dedicated web catalog is available at `/components`. It is separate from the operational manual and provides
search, category/status filters, visual previews, import paths and minimal invocations for every registered visual
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

## Required registration

When creating a visual component:

1. Place generic components under `apps/app/src/app/shared/<component-name>`.
2. Export typed inputs and outputs.
3. Add the component to `UI_COMPONENT_CATALOG`.
4. Include selector, purpose, import path, current consumers and a minimal invocation.
5. Add it to a real page or the future component gallery.
6. Build and verify desktop/mobile.
7. Update `docs/ui-component-inventory.md` when maturity or extraction priorities change.

## Shell adoption

- Authenticated/manual routes use `PageShellComponent`.
- Public routes use `PublicPageShellComponent`.
- Module pages use `ModuleHeaderComponent`.
- Route and data loading use `LoadingSkeletonComponent`.
- Designer modules use `DesignerWorkspaceComponent`, `CatalogHeaderComponent`, `CatalogItemComponent` and
  `SectionHeaderComponent`.
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
| Home | PageShell | navigation and shared spacing | Adopted; dashboard content is domain-specific |
| Docs | PageShell | process guide and catalog registry | Adopted |
| Confisys | PageShell | ModuleHeader, FieldShell, LoadingSkeleton | Adopted |
| Database | PageShell | designer/catalog/status components | Adopted |
| Services | PageShell | full designer lifecycle components | Reference implementation |
| Flows | PageShell | full designer lifecycle plus domain visuals | Adopted; large container still needs gradual extraction |
| Security | PageShell | ModuleHeader, StatusNotice, LoadingSkeleton | Adopted; tables/forms remain extraction candidates |
| Dynamic form runtime | PageShell | field renderer, preview, loading and notices | Forms foundation |
| Login | PublicPageShell | FieldShell, StatusNotice, LoadingSkeleton | Adopted |
| Setup | PublicPageShell | FieldShell, StatusNotice, LoadingSkeleton | Adopted |

Page-local CSS is allowed for domain composition. It must not recreate navigation shells, module headers, loading
states, catalogs, generic field wrappers or preview viewports.

## Multikit rendering

Dynamic fields use one Chicle facade and three concrete adapters: PrimeNG, Ionic and native fallback. Forms and screens
store the optional `presentation` contract documented in `docs/ui-presentation-architecture.md`; they never store
library selectors or CSS classes. Themes remain independent from kits.

The component library exposes every theme registered by `UiThemeService`. Theme selection updates Chicle tokens,
Ionic variables and the active PrimeNG preset together.

Formly is the form lifecycle engine. `FormlyRuntimeComponent` and `FormlySchemaAdapterService` keep stored forms
library-neutral while reusing the same multikit field facade. The complete boundary is documented in
`docs/formly-architecture.md`.

`DynamicFieldLibraryComponent` is the initial field palette: it renders the 17 supported field and display types
from the real runtime and lets the user compare PrimeNG, Ionic and native presentation. Future designer search,
dragging and field insertion will extend this contract instead of creating another palette.
