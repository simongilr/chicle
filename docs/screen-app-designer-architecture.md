# Screen And App Designer Architecture

## Purpose

The Screen And App Designer turns Chicle into an application factory. It defines installable app packages and the screens that those apps expose across web, mobile, desktop and admin targets.

The designer follows the same platform rules already used by Dynamic Services, Dynamic Forms and Flows:

- The visual guide and the JSON editor write the same contract.
- Drafts are editable until a version is published.
- Published versions become the runtime contract.
- Deleted artifacts move to trash so their keys can be reused safely.
- Runtime execution uses published contracts only.

## Runtime Objects

### dynamic_apps

`dynamic_apps` is the product container. It stores the app identity, supported targets, base presentation, text namespace, navigation rules and exportable metadata.

Minimum manifest:

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_app",
  "key": "events_app",
  "name": "Events App",
  "description": "Event registration and agenda experience.",
  "category": "events",
  "targets": ["web", "mobile"],
  "presentation": {
    "kit": "auto",
    "theme": "chicle",
    "themeMode": "system",
    "density": "comfortable"
  },
  "text": {
    "namespace": "app.events_app",
    "defaultLocale": "en",
    "bundledLocales": ["en"]
  },
  "navigation": {
    "mode": "screen_routes",
    "startRoute": "/home"
  },
  "permissions": [],
  "screens": [],
  "settings": {},
  "metadata": {
    "designer": "screen_app_designer_v1"
  }
}
```

### dynamic_app_versions

`dynamic_app_versions` freezes an app manifest. Publishing an app version marks the previous published version as archived and points the runtime to the new version.

The version stores a dependency snapshot with the screens known at publish time.

### dynamic_screens

`dynamic_screens` stores one route or view inside an app. A screen is not hard-coded UI. It is a declarative composition of regions, components, bindings, data sources, permissions and actions.

Minimum definition:

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_screen",
  "appKey": "events_app",
  "key": "home",
  "title": "Home",
  "description": "Main entry point for the event app.",
  "route": "/home",
  "target": "multi",
  "category": "main",
  "textNamespace": "screen.home",
  "layout": {
    "strategy": "responsive_regions",
    "mode": "dashboard",
    "regions": ["header", "content", "actions", "aside"],
    "desktop": { "columns": 2 },
    "tablet": { "columns": 1 },
    "mobile": { "columns": 1, "navigation": "bottom_actions" }
  },
  "regions": [
    { "key": "header", "label": "Header" },
    { "key": "content", "label": "Content" },
    { "key": "actions", "label": "Actions" },
    { "key": "aside", "label": "Aside" }
  ],
  "components": [
    {
      "id": "hero_header_1",
      "componentKey": "hero_header",
      "title": "Welcome",
      "region": "header",
      "order": 1,
      "inputs": {
        "sourceKey": "events_app"
      },
      "bindings": {},
      "actions": [],
      "visibility": {},
      "layout": {
        "desktop": "full",
        "tablet": "full",
        "mobile": "full"
      }
    }
  ],
  "dataSources": [],
  "actions": [],
  "permissions": [],
  "presentation": {
    "kit": "auto",
    "theme": "chicle",
    "themeMode": "system"
  },
  "tests": [
    {
      "name": "Basic preview",
      "viewport": "desktop",
      "input": {}
    }
  ],
  "metadata": {
    "designer": "screen_app_designer_v1"
  }
}
```

### dynamic_screen_versions

`dynamic_screen_versions` freezes a screen definition. Publishing a screen version makes it available to runtime consumers.

The version stores a dependency snapshot with component keys and referenced `formKey`, `serviceKey` and `flowKey` values.

## Component Contract

Screens are made of allowed visual component keys. V1 registers these keys:

- `hero_header`
- `nav_menu`
- `tabs`
- `metric_strip`
- `chart_panel`
- `data_table`
- `search_panel`
- `form_runtime`
- `service_button`
- `flow_button`
- `entity_card`
- `detail_panel`
- `timeline`
- `media_gallery`
- `map_view`

Each component must declare:

- `componentKey`
- `title`
- `region`
- `order`
- `inputs`
- `bindings`
- `actions`
- `visibility`
- `layout`

The component contract is intentionally close to Dynamic Forms and Dynamic Services so an assistant can build screens by combining known artifacts instead of generating custom code.

### Component Placement

Every component has explicit placement metadata so a non-developer can understand what will happen before saving:

```json
{
  "id": "form_runtime_1",
  "componentKey": "form_runtime",
  "title": "Customer form",
  "region": "content",
  "order": 1,
  "inputs": {
    "formKey": "form_customers"
  },
  "bindings": {
    "mode": "contract_input",
    "type": "form",
    "key": "form_customers"
  },
  "actions": [
    {
      "event": "primary",
      "type": "submit_form",
      "formKey": "form_customers"
    }
  ],
  "layout": {
    "desktop": "half",
    "tablet": "full",
    "mobile": "full",
    "align": "stretch",
    "chrome": "card"
  }
}
```

Placement rules:

- `region` decides where the component appears: `header`, `content`, `actions` or `aside`.
- `layout.desktop` decides how much horizontal space it uses on large screens: `full`, `two_thirds`, `half`, `third`, `quarter` or `auto`.
- `tablet` and `mobile` default to `full` so the generated app does not feel forced into a desktop grid.
- `align` controls how the component sits inside its area: `stretch`, `start`, `center` or `end`.
- `chrome` describes the visual container: `card`, `plain`, `modal`, `drawer` or `toolbar`.

### Bindings And Actions

Bindings connect a component with an existing Chicle object. Actions define what happens when the user interacts with it.

Supported binding types in the designer:

| Binding type | Stored input | Typical component |
| --- | --- | --- |
| `form` | `formKey` | `form_runtime` |
| `service` | `serviceKey` | `data_table`, `service_button`, `detail_panel` |
| `flow` | `flowKey` | `flow_button` |
| `table` | `table` | data and CRUD components |
| `source` | `sourceKey` | headers, cards and static summaries |
| `none` | no input | purely visual block |

Supported action types in the designer:

| Action type | Target key |
| --- | --- |
| `navigate` | `route` |
| `execute_service` | `serviceKey` |
| `execute_flow` | `flowKey` |
| `open_modal` | `modalKey` |
| `submit_form` | `formKey` |
| `emit_event` | `eventName` |

This keeps screen logic declarative. A screen can place a form inside a card, open a modal, execute a service, run a flow
or navigate without writing page-specific Angular code.

## Navigation Contract

Navigation belongs to the screen contract because an app package must know which screens are visible and how they are
grouped.

```json
{
  "navigation": {
    "showInMenu": true,
    "label": "Customers",
    "group": "sales",
    "icon": "users",
    "permissions": ["customers.read"]
  }
}
```

Rules:

- `route` is the technical path used by web, mobile and desktop runtimes.
- `navigation.showInMenu` controls whether the screen is shown in generated menus.
- `navigation.group` allows sidebar, tab bar or mobile menu grouping.
- `navigation.permissions` lets the runtime hide or block the route based on RBAC.

## Dynamic Component Designer

The screen designer uses registered component keys. The next administrative layer is the Dynamic Component Designer: a
registry of reusable component templates stored in the database.

A component template is not arbitrary Angular code. It is a declarative object that can compose existing Chicle
components into reusable blocks such as:

- a form inside a card with a fixed action footer;
- a custom modal with a dynamic form and service result area;
- a search panel plus data table;
- a KPI strip connected to several services;
- a mobile inspection card with camera, GPS and offline state.

Expected object shape:

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_component_template",
  "key": "customer_form_modal",
  "name": "Customer Form Modal",
  "category": "customers",
  "targets": ["web", "mobile"],
  "presentation": {
    "chrome": "modal",
    "kit": "auto",
    "theme": "inherit"
  },
  "slots": [
    { "key": "body", "accepts": ["form_runtime", "detail_panel"] },
    { "key": "footer", "accepts": ["service_button", "flow_button"] }
  ],
  "components": [],
  "inputs": {},
  "outputs": {},
  "actions": [],
  "permissions": []
}
```

The runtime resolves templates from the component registry, then renders their internal components with the same UI kit,
theme, RBAC and binding rules as a normal screen.

## Package Contract

An app package is the portable artifact used to move an app between environments or share it as a template. It contains the app manifest, every screen definition and a dependency snapshot.

Minimum package:

```json
{
  "schemaVersion": 1,
  "kind": "chicle_app_package",
  "packageKey": "events_app",
  "name": "Events App",
  "description": "Event registration and agenda experience.",
  "exportedAt": "2026-07-24T00:00:00.000Z",
  "app": {
    "key": "events_app",
    "version": 1,
    "status": "published",
    "published": true,
    "manifest": {
      "schemaVersion": 1,
      "kind": "dynamic_app",
      "key": "events_app",
      "name": "Events App",
      "targets": ["web", "mobile"],
      "text": {
        "namespace": "app.events_app",
        "defaultLocale": "en"
      }
    }
  },
  "screens": [
    {
      "key": "home",
      "version": 1,
      "status": "published",
      "published": true,
      "definition": {
        "schemaVersion": 1,
        "kind": "dynamic_screen",
        "appKey": "events_app",
        "key": "home",
        "title": "Home",
        "route": "/home",
        "target": "multi",
        "components": []
      }
    }
  ],
  "dependencies": {
    "componentKeys": [],
    "formKeys": [],
    "serviceKeys": [],
    "flowKeys": [],
    "textNamespaces": ["app.events_app"],
    "customTables": []
  },
  "install": {
    "mode": "upsert",
    "conflictStrategy": "active_keys_block",
    "publishOnInstall": false
  }
}
```

Package rules:

- `kind` must be `chicle_app_package`.
- `app.manifest.kind` must be `dynamic_app`.
- Each screen definition must use `kind: dynamic_screen`.
- Imported packages are normalized as drafts until the user chooses to publish.
- Dependencies are extracted from known component inputs, screen data sources and app text namespaces.
- The installer does not invent missing Forms, Services, Flows, text bundles or custom tables. It reports the dependency snapshot so Admin can validate what must exist.

## Authoring Flow

1. Create or select an app.
2. Create or select a screen inside that app.
3. Add reusable components.
4. Preview the screen in desktop, tablet and mobile.
5. Edit JSON directly if needed.
6. Save draft.
7. Publish a version when the contract is stable.

The visual guide and JSON editor are equivalent entry points. The JSON contract is the source used for import/export, AI authoring and future template installation.

## API Surface

```text
GET  /api/apps
GET  /api/apps/trash
POST /api/apps/authoring/json
POST /api/apps/packages/install
GET  /api/apps/by-key/:key
GET  /api/apps/by-key/:key/runtime
GET  /api/apps/:appId/package
POST /api/apps/:appId/trash
POST /api/apps/:appId/restore
POST /api/apps/:appId/versions
POST /api/apps/:appId/versions/:versionId/publish

GET  /api/apps/components/catalog
GET  /api/apps/:appId/screens
GET  /api/apps/:appId/screens/trash
POST /api/apps/screens/authoring/json
POST /api/apps/:appId/screens/:screenId/trash
POST /api/apps/:appId/screens/:screenId/restore
POST /api/apps/:appId/screens/:screenId/versions
POST /api/apps/:appId/screens/:screenId/versions/:versionId/publish
```

## Security

The designer is protected by RBAC:

- `apps.read`: read apps, screens and runtime contracts.
- `apps.manage`: create, edit, trash and restore apps or screens.
- `apps.publish`: publish app and screen versions.
- `apps.export`: export app packages.
- `apps.install`: install app packages.

Runtime endpoints only expose published contracts to authenticated users with read access.

## Template Strategy

An app package is exported as a bundle containing:

- App manifest.
- Screen definitions.
- Referenced text namespaces.
- Referenced Dynamic Forms.
- Referenced Dynamic Services.
- Referenced Flows.
- Referenced custom tables.
- Install metadata and compatibility checks.

The designer can generate a package from the current app, edit it as JSON, install it as a draft and optionally publish it during installation. The package is intentionally metadata-only: Forms, Services, Flows, translations and schema changes stay as first-class artifacts with their own versioning and permissions.

## Designer Responsibilities

- Create apps as product containers.
- Create screens as reusable component compositions.
- Preview screens by region and target.
- Keep guided editing and JSON editing aligned to the same contract.
- Export package JSON from the selected app.
- Install package JSON into the current tenant.
- Preserve keys through trash/restore rules so active artifacts remain conflict-safe.

## Runtime Responsibilities

- Serve only published app and screen contracts.
- Apply Auth/RBAC and tenant context before returning runtime definitions.
- Let generated web, mobile or desktop apps consume the same screen contracts.
- Execute referenced Forms, Dynamic Services and Flows through their own runtime modules.

## Alignment With Chicle Principles

- Flexible: apps can model different business domains without custom code.
- Adaptable: one contract can target web, mobile, desktop or admin contexts.
- Reusable: screens consume shared components, services, forms and flows.
- Quality: JSON contracts are validated before versioning.
- Secure: RBAC protects authoring and publishing.
- Administrable: owners and admins manage apps from the Admin.
- Scalable: published contracts can be served by the API runtime or separated services.
- Reliable And Resilient: versioning allows stable runtime contracts and rollback paths.
- Extensible: new component keys, targets and package installers can be added without rewriting existing apps.
- Intelligent: the JSON contract is structured for AI-assisted authoring.
