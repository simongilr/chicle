# UI reuse audit

Audit date: 2026-07-03.

This document verifies that visual infrastructure is shared and that route pages do not create parallel shells,
navigation, loading states or basic field wrappers. Domain editors may keep specialized composition when their
behavior is genuinely different.

## Result

- All 11 route pages use `PageShellComponent` or `PublicPageShellComponent`.
- Every component registered in `UI_COMPONENT_CATALOG` has a real consumer and a visual example in `/components`.
- Generic loading, status, module heading, catalog, process and field patterns are shared.
- No route owns a second main navigation, page shell or loading implementation.
- The visual catalog contains 29 entries: 26 live component previews and 3 structural miniatures for components that
  cannot be nested safely (`MainNavComponent`, `PageShellComponent` and `PublicPageShellComponent`).
- The catalog was verified at desktop and 390 px without horizontal overflow.

## Visual verification

The routes `/home`, `/docs`, `/components`, `/confisys`, `/database`, `/security`, `/services`, `/flows`,
`/forms/:key`, `/login` and `/setup` were rendered at 1280 px and 390 px.

- Every authenticated route rendered exactly one `PageShellComponent` and one `MainNavComponent`.
- Login and Setup rendered exactly one `PublicPageShellComponent` and no authenticated navigation.
- No route widened the document beyond the viewport.
- The Manual and Flow workspace intrinsic-width defects found during the mobile pass were corrected.
- Database columns intentionally use an internal PrimeNG horizontal scroller; the table is wider than its viewport,
  but it does not widen or clip the page.
- No Angular runtime errors were reported during the route pass.

## Theme verification

The component library was rendered with every installed theme at 1280 px and 390 px:

| Theme | Chicle / Ionic / PrimeNG primary | White-on-primary contrast | Text-on-background contrast | Overflow |
| --- | --- | --- | --- | --- |
| Chicle / Aura | `#1554a2` | 7.44:1 | 10.70:1 | None |
| Lara | `#047857` | 5.48:1 | 12.38:1 | None |
| Material | `#3f51b5` | 6.87:1 | 14.79:1 | None |
| Nora | `#0f766e` | 5.47:1 | 13.68:1 | None |

All themes preserve the shared catalog structure, synchronize the three token systems and persist after reload.
Non-default PrimeNG presets are emitted as lazy chunks.

## Route adoption

| Route | Shell | Shared composition | Domain composition |
| --- | --- | --- | --- |
| `/home` | `PageShellComponent` | Main navigation and global layout | Operational dashboard |
| `/docs` | `PageShellComponent` | Process guide, notices and component registry | Long-form manual navigation |
| `/components` | `PageShellComponent` | Module header, field shells and live previews | Searchable component gallery |
| `/confisys` | `PageShellComponent` | Module header, field shells and loading skeleton | Runtime parameter editor |
| `/database` | `PageShellComponent` | Designer workspace, catalog, sections, notices and loading | Data/schema workbench |
| `/services` | `PageShellComponent` | Complete designer lifecycle kit | Dynamic service authoring |
| `/flows` | `PageShellComponent` | Complete designer lifecycle kit | Graph, timeline and Flow mapping |
| `/security` | `PageShellComponent` | Module header, notices and loading skeleton | Users, roles, resources and audit |
| `/forms/:key` | `PageShellComponent` | Dynamic fields, preview, notices and loading | Declarative form runtime |
| `/login` | `PublicPageShellComponent` | Field shells, notices and loading skeleton | Authentication policy |
| `/setup` | `PublicPageShellComponent` | Field shells, notices and loading skeleton | First tenant creation |

## Component adoption

| Component family | Shared components | Production consumers |
| --- | --- | --- |
| Shell and navigation | `MainNavComponent`, `PageShellComponent`, `PublicPageShellComponent`, `ModuleHeaderComponent` | Every route |
| Designer structure | `DesignerWorkspaceComponent`, `CatalogHeaderComponent`, `CatalogItemComponent`, `SectionHeaderComponent` | Database, Services and Flows |
| Guidance and state | `ProcessStepsComponent`, `WorkflowGuideComponent`, `ContextAssistantComponent`, `StatusNoticeComponent`, `LoadingSkeletonComponent`, `SegmentedControlComponent` | Operational designers and data-driven pages |
| Forms | `FieldShellComponent`, `DynamicFieldControlComponent`, `DynamicFieldLibraryComponent`, `FormlyRuntimeComponent`, Formly type adapters, kit renderers, `UiPresentationSwitcherComponent`, `PreviewViewportComponent` | Login, Setup, Components, Confisys and dynamic form runtime |
| Themes | `UiThemeSelectorComponent` | Component library and future screen/form designers |
| Flow domain | `FlowDataMapperComponent`, `FlowGraphComponent`, `FlowTimelineComponent` | Flows |

The single source of truth for exact selectors, imports and invocations is
`apps/app/src/app/shared/ui-component-catalog.ts`.

## Allowed domain exceptions

An interface is not considered isolated merely because its page layout is unique. The following pieces encode
specialized behavior and should remain domain-owned until another real consumer proves a common contract:

- Docs section navigation and long-form article layout.
- Home operational summary cards.
- Confisys parameter rows and value-type editing.
- Security user, role, resource-access and audit workspaces.
- Database schema preview, data table and migration history.
- Flow graph, timeline and step mapper.
- Service and Flow JSON authoring details.

These pages must still compose the shared shell, headers, fields, notices, loading and workflow components.

## Extraction backlog

Extract these only with a typed contract and at least two concrete consumers:

1. `EntityTableComponent`: server pagination, filters, sorting, selection and row commands.
2. `DataBindingEditorComponent`: generalize the current Flow mapper for forms, screens and actions.
3. `JsonEditorPanelComponent`: synchronized guided/JSON editing, parsing and reset.
4. `VersionLifecyclePanelComponent`: draft, version, publish, compare and restore.
5. `TestWorkbenchComponent`: fixtures, execution, output, duration and repeatable cases.
6. `ConfirmActionComponent`: destructive and draft-replacing confirmation.

## Guardrails

- New routes must choose one of the two shared page shells.
- New API-driven views must use `LoadingSkeletonComponent` and `StatusNoticeComponent`.
- New standard fields must use `FieldShellComponent` or `DynamicFieldControlComponent`.
- New designers must start from `DesignerWorkspaceComponent` and the catalog/section components.
- Do not add a page-local copy of navigation, module header, segmented controls, process steps or preview viewport.
- Register every reusable component in `UI_COMPONENT_CATALOG` and provide a live visual example in `/components`.
- Verify desktop and 390 px before considering a component stable.
