# Admin Kit Transformation Audit

Audit date: 2026-07-23.

This audit verifies whether each Chicle Admin page is actually coupled to the reusable visual system and whether it can
transform when the active UI kit changes in Admin Preferences.

The important distinction is:

- shared composition means the page uses common shells, headers, panels, catalog layouts or notices;
- kit transformation means the page uses controls that can render as PrimeNG, Ionic, Angular Material, Bootstrap or
  native HTML through Chicle adapters;
- native kit fidelity means the rendered control is a real kit component, such as `ion-input`, `ion-select`,
  `ion-button`, `mat-form-field`, `mat-select`, `p-select` or `p-button`.

## Current conclusion

The Admin now has a global kit bridge, so legacy page-local controls visually follow the active Admin Preferences kit.
This means a route with raw `input`, `select`, `textarea` or `button` tags no longer ignores Ionic, Material, Bootstrap or
Native mode.

The Admin is still not yet 100% native-kit transformed.

The platform already has a strong reusable base, but several large pages still contain page-local `input`, `select`,
`textarea` and `button` elements. The global bridge keeps them visually aligned, but they cannot become real Ionic or
Material controls until they are migrated to reusable adapters.

The latest foundation pass adds `UiKitCardComponent`, a native-card adapter that renders `p-card`, `ion-card`,
`mat-card`, Bootstrap-compatible markup or native HTML according to the active kit. `AdminMetricCardComponent` now uses
this card adapter, and the component catalog can preview cards across all installed kits. This is the card path new
Admin surfaces should use instead of page-local `.card` blocks.

## Kit bridge added

The global stylesheet applies kit-specific rules from the root attributes written by `UiPreferencesService`:

- `html[data-ui-kit="ionic"]` gives legacy controls Ionic-like line fields, native-select dropdown behavior and rounded
  touch actions;
- `html[data-ui-kit="material"]` gives legacy controls Material-like density, radius and raised primary actions;
- `html[data-ui-kit="bootstrap"]` gives legacy controls Bootstrap-like control radius and button colors;
- `html[data-ui-kit="native"]` keeps a plain HTML fallback.

This bridge is intentionally a compatibility layer. The final target remains:

- fields through `DynamicFieldControlComponent`;
- actions through `UiKitButtonComponent`;
- cards through `UiKitCardComponent`;
- structural surfaces through shared Admin components.

## Strict page audit

| Page | Raw controls | Dynamic fields | Kit buttons | Shared layout | Transformation status | Priority |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| Preferences | 0 | 9 | 2 | 5 | Strong. This is the reference implementation for Admin preferences. | Keep as reference |
| Components | 0 | 3 | 1 | 7 | Strong for the page itself. It now previews reusable multikit buttons, fields and cards. | Keep as reference |
| Docs library | 0 | 2 | 0 | 6 | Strong after migration. Filters now use `DynamicFieldControlComponent`. | Keep as reference |
| Docs operational | 0 | 0 | 0 | 3 | Good composition. Mostly documentation content and reusable documentation layout. | Low |
| Architecture | 0 | 0 | 0 | 18 | Good composition. Diagram components are reusable, but not native-kit components. | Low |
| Home | 0 | 0 | 0 | 11 | Good composition. Dashboard cards are reusable enough for this phase. | Low |
| Dynamic form runtime | 0 | 0 | 0 | 8 | Good runtime composition. Form controls are generated through Formly and dynamic field adapters. | Low |
| Confisys | 5 | 0 | 0 | 3 | Partial. Header/filter structure is shared, but parameter editors and actions are page-local. | Medium |
| Login | 7 | 0 | 0 | 1 | Partial. Public shell is shared, but auth controls and channel buttons are page-local. | Medium |
| Setup | 8 | 0 | 0 | 3 | Partial. Public shell and status pieces are shared, but setup form controls are page-local. | Medium |
| Security | 35 | 0 | 0 | 17 | Partial. Structure is improving, but users, roles, permissions and audit controls are page-local. | High |
| Database | 36 | 0 | 0 | 6 | Partial. Data table is reusable, but schema designer, pagination and row modal are page-local. | High |
| Services | 40 | 0 | 0 | 11 | Partial. Designer structure is shared, but most service editor fields/actions remain page-local. | High |
| Forms designer | 110 | 0 | 0 | 23 | Partial. The runtime preview is reusable, but the builder/editor itself is still page-local. | Critical |
| Flows designer | 135 | 0 | 0 | 11 | Weakest transformation. Flow builder has many page-local controls and needs extraction. | Critical |

## Reusable component kit coverage

| Component family | PrimeNG | Ionic | Material | Bootstrap | Native | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `DynamicFieldControlComponent` | Native kit adapter | Native kit adapter | Native kit adapter | Bootstrap-class adapter | Native HTML adapter | This is the correct field entrypoint for Admin and runtime forms. |
| `UiKitButtonComponent` | `p-button` | `ion-button` | Material buttons | Bootstrap classes | HTML button | This is the correct action entrypoint. |
| `UiKitCardComponent` | `p-card` | `ion-card` | `mat-card` | Bootstrap-compatible card | HTML card | This is the correct card/surface entrypoint for new Admin UI. |
| `AdminPanelComponent` | Styled by tokens | Styled by tokens | Styled by tokens | Styled by tokens | Styled by tokens | Structural component, not a native-card adapter yet. |
| `AdminFilterBarComponent` | Host-aware | Host-aware | Host-aware | Host-aware | Host-aware | No longer overwrites dynamic field renderers; raw controls only use the compatibility bridge. |
| `DocumentationLayoutComponent` | Host-aware | Host-aware | Host-aware | Host-aware | Host-aware | Mobile picker now uses dynamic fields. Side navigation still uses semantic buttons. |
| `DesignerWorkspaceComponent` | Shared layout | Shared layout | Shared layout | Shared layout | Shared layout | Structural only. Editors inside must use dynamic fields/buttons. |
| `StatusNoticeComponent` | Styled by tokens | Styled by tokens | Styled by tokens | Styled by tokens | Styled by tokens | Structural/status component. |
| `JsonAuthoringPanelComponent` | Partial | Partial | Partial | Partial | Partial | Uses page-local textarea/buttons and should move to dynamic field/button adapters. |
| `MobileActionBarComponent` | Styled by tokens | Styled by tokens | Styled by tokens | Styled by tokens | Styled by tokens | Should use `UiKitButtonComponent` internally. |
| `MobileEvidenceControlComponent` | Shared fallback | Shared fallback | Shared fallback | Shared fallback | Shared fallback | Needs native `ion-button`/Material/Bootstrap button delegation. |

## Required reusable components

These components are needed to finish Admin-wide transformation:

| Needed component | Purpose | First consumers |
| --- | --- | --- |
| `AdminFormGridComponent` | Standard responsive form grids using `DynamicFieldControlComponent`. | Confisys, Security, Services, Forms, Flows, Database |
| `AdminFormFieldListComponent` | Repeatable field rows with add/remove/reorder actions. | Forms designer, Flows, Services |
| `AdminPaginationComponent` | Shared pagination and page-size controls. | Database, Security, service runs, flow runs |
| `AdminModalComponent` | Shared modal shell with kit-aware actions. | Database row detail, Security user editor, confirmations |
| `AdminTabsComponent` | Shared tab/segmented navigation with kit-aware behavior. | Security, Database, Services, Forms, Flows |
| `AdminEntityEditorComponent` | Common create/edit form shell with toolbar and validation notice. | Confisys, Security, Services |
| `VersionLifecyclePanelComponent` | Draft, version, publish, restore and trash actions. | Services, Forms, Flows |
| `TestWorkbenchComponent` | Input fixture, run button, response panel and execution history. | Services, Forms, Flows |
| `SchemaDesignerFormComponent` | Controlled DB table/field designer using dynamic controls. | Database |
| `JsonEditorPanelComponent` | JSON textarea, validation, apply, save draft and publish actions. | Services, Forms, Flows |

## Migration order

1. Migrate shared internals first:
   - page-local cards to `UiKitCardComponent`;
   - `JsonAuthoringPanelComponent`;
   - `MobileActionBarComponent`;
   - `MobileEvidenceControlComponent`;
   - `AdminActionToolbarComponent`;
   - `SegmentedControlComponent`.

2. Migrate medium-risk pages:
   - Confisys;
   - Login;
   - Setup.

3. Migrate admin workbenches:
   - Database;
   - Security;
   - Services.

4. Migrate builders:
   - Forms designer;
   - Flows designer.

## Acceptance rules

A page is considered fully transformed only when:

- standard fields use `DynamicFieldControlComponent`;
- standard actions use `UiKitButtonComponent` or a reusable component that delegates to it;
- standard panels, cards, lists, tabs, filters, modals and pagination come from shared components;
- switching Admin Preferences kit changes the page controls without reloading custom CSS;
- Ionic mode renders real Ionic controls;
- Material mode renders real Material controls;
- dark mode and all installed themes keep readable contrast;
- the page has no page-local clone of a reusable component that already exists.
