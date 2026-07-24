# Dynamic Grid And Screen Layout Contract

Chicle does not currently have a true dynamic grid designer. The existing `AdminCardGridComponent` is a reusable
responsive card grid, but it does not provide drag, resize, persisted widget positions or screen-builder behavior.

The screen designer should use a neutral Chicle layout contract and treat GridStack as a design-time adapter, not as the
runtime contract stored in the database.

## Goal

Dynamic screens must be usable in:

- the Admin, for owner/admin configuration and visual builders;
- generated web apps;
- generated mobile apps;
- generated desktop apps;
- future templates and installable modules.

The same stored screen definition must render through the active UI kit and theme without embedding Angular selectors,
PrimeNG classes, Ionic markup, Material classes, Bootstrap classes or raw CSS.

## Decision

Use a Chicle-owned layout schema in the database.

GridStack may be used only in designer mode to provide drag, resize, collision handling and visual authoring. The
published runtime renderer must read the Chicle schema and render it with Chicle components, CSS grid and the selected
kit adapters.

This keeps the database contract stable even if the design-time grid library changes later.

## Modes

| Mode | Purpose | GridStack allowed | Runtime behavior |
| --- | --- | --- | --- |
| `design` | Owner/admin edits a screen visually | Yes | Drag, resize, select, inspect, validate |
| `preview` | User checks desktop, tablet and mobile output | No editing | Simulated viewport with real runtime renderer |
| `runtime` | Final Admin or business app screen | No | Fast rendering, no GridStack dependency |

## Layout Rules

| Viewport | Columns | Behavior |
| --- | ---: | --- |
| Desktop | 12 | Dashboard, forms, tables and panels can share horizontal space. |
| Tablet | 8 | Cards stack earlier; inspectors and sidebars collapse. |
| Mobile | 4 or stacked | Screen becomes a vertical app flow with touch-first actions. |

Rules:

- Store positions per breakpoint.
- Never rely on desktop coordinates to render mobile.
- Every item must have a stable `id`.
- Every item must reference a registered `componentKey`.
- Every item must declare access rules when it is sensitive.
- Every item must use bindings and actions instead of page-specific service calls.
- A published screen must pass validation for desktop, tablet and mobile.

## Stored Contract

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_screen",
  "key": "operations_dashboard",
  "title": "Operations Dashboard",
  "presentation": {
    "profileKey": "adaptive",
    "kit": "auto",
    "theme": "chicle",
    "themeMode": "system",
    "density": "comfortable"
  },
  "layout": {
    "engine": "chicle_grid",
    "breakpoints": {
      "desktop": { "columns": 12, "gap": 16 },
      "tablet": { "columns": 8, "gap": 14 },
      "mobile": { "columns": 4, "gap": 12, "stack": true }
    }
  },
  "items": [
    {
      "id": "users_table",
      "componentKey": "admin_data_table",
      "componentType": "data_table",
      "layout": {
        "desktop": { "x": 0, "y": 0, "w": 8, "h": 5 },
        "tablet": { "x": 0, "y": 0, "w": 8, "h": 5 },
        "mobile": { "order": 1, "w": 4 }
      },
      "bindings": {
        "dataSource": {
          "type": "dynamic_service",
          "serviceKey": "list_users"
        }
      },
      "actions": [
        {
          "event": "rowClick",
          "type": "open_modal",
          "target": "user_detail"
        }
      ],
      "access": {
        "permissions": ["security.users.read"]
      }
    }
  ]
}
```

## Component Families Needed

| Component | Responsibility | First consumers |
| --- | --- | --- |
| `DynamicGridDesignerComponent` | Wrap GridStack in design mode and emit neutral Chicle layout updates. | Screen Designer |
| `DynamicGridRuntimeComponent` | Render the published Chicle layout without GridStack editing behavior. | Admin, generated apps |
| `ScreenComponentPaletteComponent` | Lists allowed components by category, kit support and permissions. | Screen Designer |
| `ScreenComponentTreeComponent` | Shows screen hierarchy, order, nesting and selected component. | Screen Designer |
| `ScreenPropertyInspectorComponent` | Edits selected component props, bindings, actions, access and presentation. | Screen Designer |
| `DynamicRegionComponent` | Reusable named areas such as header, toolbar, content, sidebar and footer. | Admin, apps |
| `ResponsiveLayoutPreviewComponent` | Validates desktop, tablet and mobile layout using the runtime renderer. | Screen Designer |

## Kit Rules

Grid items are not kit-specific. The component inside each item decides how to render:

- fields use `DynamicFieldControlComponent`;
- buttons use `UiKitButtonComponent`;
- cards use `UiKitCardComponent`;
- runtime forms use `FormlyRuntimeComponent`;
- tables should use `AdminDataTableComponent` or a future app table/list adapter;
- modals, drawers, tabs and pagination need shared adapters before being used heavily.

Ionic must remain a real Ionic path. Designer work must not replace `ion-input`, `ion-select`, `ion-button` or
`ion-card` with styled HTML when the active kit is Ionic.

## GridStack Integration Rules

If GridStack is installed, it must be isolated:

1. Import it only in the screen designer route or a lazy designer component.
2. Keep GridStack CSS scoped to the design canvas.
3. Convert GridStack nodes to the Chicle layout contract before saving.
4. Convert the Chicle layout contract back to GridStack nodes only while editing.
5. Do not require GridStack in mobile runtime rendering.
6. Add Playwright checks for desktop, tablet and mobile preview before enabling publish.

## Validation Rules

Before a screen version can be published:

- all component keys must exist in the component registry;
- all services, forms and flows referenced by bindings must exist and be published when required;
- every required input must have a binding, default value or user-editable field;
- every sensitive component must declare permissions;
- mobile layout must be readable without horizontal scrolling;
- no item can overlap another item in the same breakpoint;
- destructive actions must require confirmation;
- generated JSON must pass schema validation before save and publish.

## Current Status

| Capability | Status |
| --- | --- |
| Static responsive card grid | Available through `AdminCardGridComponent`. |
| Device preview shell | Available through `PreviewViewportComponent`. |
| Multikit fields | Available through `DynamicFieldControlComponent`. |
| Multikit buttons | Available through `UiKitButtonComponent`. |
| Multikit cards | Available through `UiKitCardComponent`. |
| Visual screen grid designer | Not implemented yet. |
| GridStack dependency | Not installed yet. |
| Runtime screen renderer | Not implemented yet. |

