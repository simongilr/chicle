# Screen And App Designer Architecture

## Purpose

The Screen And App Designer turns Chicle into an application factory. It defines installable app packages and the screens that those apps expose across web, mobile, desktop and admin targets.

The designer is part of the Admin control plane. It does not create isolated pages. It creates tenant-scoped runtime
contracts that remain connected to the organization for administration, permissions, publication, export, audit and
template installation.

The designer follows the same platform rules already used by Dynamic Services, Dynamic Forms and Flows:

- The visual guide and the JSON editor write the same contract.
- Drafts are editable until a version is published.
- Published versions become the runtime contract.
- Deleted artifacts move to trash so their keys can be reused safely.
- Runtime execution uses published contracts only.

The canonical runtime graph, bootstrap manifest, component binding, action execution, offline cache and generated app
artifact model are defined in `docs/dynamic-app-runtime-architecture.md`. This document focuses on the Admin authoring
experience and screen designer behavior that produces those runtime contracts.

## App Studio Governance

An organization can own many generated apps and many pages per app. Chicle must therefore provide an App Studio, not
only a screen editor.

The App Studio has these administrative responsibilities:

- list all apps owned by the current tenant with search, status, category, target and publication filters;
- create an app shell with identity, targets, theme, default locale, security mode and first route;
- manage app navigation, route groups and default start route;
- manage screens/pages inside the selected app;
- manage landing pages that belong to the same tenant but can be public;
- connect screens with reusable component templates, forms, services, flows, tables, text bundles and permissions;
- preview the complete app across desktop, tablet, mobile and public/embedded targets;
- version, publish, unpublish, duplicate, trash and restore apps and screens;
- export an app as a template package and install template packages into the tenant;
- audit who changed, tested, published or installed each app artifact.

The core hierarchy is:

```txt
Tenant
  -> App
     -> App version
     -> Screens / Pages
        -> Screen versions
        -> Regions
        -> Components
        -> Bindings
        -> Actions
     -> Navigation
     -> App preferences
     -> Text namespaces
     -> Template package dependencies
```

Pages are not displayed as one unfiltered tenant-wide list. They must be searchable, paginated and grouped by app,
target, category, status and navigation group.

## Current Implementation Cut

App Studio is being delivered in usable cuts. The current implementation covers cuts 0 through 14 as an integrated
MVP pass for generated apps:

| Cut | Scope | Current state |
| --- | --- | --- |
| 0 | Reusable Admin baseline: shared shell, panels, catalogs, fields, buttons, cards, JSON authoring, previews, loading states, docs and multikit adapters | Completed under the current Admin UI criterion. New App Studio screens must consume these primitives instead of creating page-local controls. |
| 1 | Base App Studio model: tenant-scoped apps, app versions, screens, screen versions, navigation metadata, status, trash/restore and permissions | Implemented. Screens are unique by `tenantId + appId + key`, so multiple apps in the same tenant can each own routes such as `home` or `login`. |
| 2 | App Studio V2 Admin workspace: app portfolio, selected app workspace, summary, pages, navigation, security, preview, publish and trash sections | Implemented as the `/apps` V2 foundation. It manages apps and screens as one tenant app graph, not detached pages. |
| 3 | Page designer inside an app: routes, screen targets, regions, components, bindings, actions and preview | Implemented as guided screen composition. Drag/resizable canvas and advanced component templates remain outside this cut. |
| 4 | Published runtime contract: `tenant + appKey + route + target` returns only published app/screen contracts | Implemented through `GET /api/apps/by-key/:key/runtime-route`. `/apps` can test the published runtime route from Preview and open the first generated-app shell at `/apps/run/:appKey`. Runtime access is authenticated and then filtered by published screen/component permissions. |
| 5 | AI app graph authoring | Implemented as draft actions for app and screen JSON. Full multi-artifact graph creation remains a controlled next step. |
| 6 | Export/import app packages | Implemented as metadata package export/install with dependency snapshots and install dry-run. Bundled dependency installers remain pending. |
| 7 | Generated runtime execution | Implemented with route runtime rendering, safe navigation, service execution, flow execution, search/data table loading, metric strips, media gallery and modal preview adapters. Advanced mobile/desktop parity remains a hardening step. |
| 8 | Visual app designer usability | Implemented with a region canvas, click/drag component insertion, component selection/editing, duplication, guided presets, binding/action summary and component-level permission authoring. Freeform resize remains an advanced enhancement, not a contract dependency. |
| 9 | Canvas and inspector | Implemented as a professional region canvas plus selected-component inspector. The inspector exposes location, width, binding, action and permission without requiring the JSON editor. |
| 10 | Real app navigation | Implemented through screen navigation metadata and runtime adapters for top menu, side menu, bottom mobile menu and tabs. Published runtime navigation is permission-filtered. |
| 11 | App component library | Implemented as first-class presets for login, forms, tables, CRUD entry points, dashboards, service buttons, flow buttons, gallery, modal, profile/detail, map and timeline. |
| 12 | Runtime renderer expansion | Implemented with adapters for navigation variants, auth login, forms, data tables, search, services, flows, metrics, charts, entity/detail cards, timeline, media gallery, map and modal shell. |
| 13 | AI app authoring context | Implemented by exposing App Studio capabilities, supported bindings/actions, component presets and definition-of-done rules to Chicle AI. The backend draft generator also recognizes gallery, dashboard, map, timeline, modal and mobile navigation requests. |
| 14 | Template/package closure | Implemented as package export/install foundation with dependency snapshots and dry-run validation. Conflict UX and bundled dependency installers remain the next hardening layer. |

This cut includes the first executable generated-app runtime shell, a clearer screen composition workflow, a broader
component set and a package transfer foundation. The remaining layers are stronger resize editing, deeper
AI graph orchestration, conflict-resolution UX for installed packages and full parity QA across every target and UI kit.

## Professional Visual Designer Architecture

The App Studio visual designer is a region-based canvas, not a free absolute-position editor. This is intentional. Chicle
must generate apps that remain responsive, portable, themeable and executable by web, Ionic mobile and desktop runtimes.
Freeform coordinates can be added later as an advanced layout mode, but the stable authoring model is:

```txt
App
  -> Screens
     -> Regions
        -> Components
           -> Bindings
           -> Actions
           -> Permissions
           -> Responsive layout
```

Screen components are governed by the declarative component contract in
`docs/declarative-component-architecture.md`. A screen component is not only a preview block. It must carry visual props,
data bindings, event/action mappings, permissions, states, i18n keys and preview fixtures so the same object can be
edited in App Studio, rendered in a generated app and understood by Chicle AI.

The professional designer experience is built from five layers:

| Layer | Responsibility |
| --- | --- |
| App structure | Shows the selected app, its pages/routes and the current screen context. |
| Component palette | Offers reusable blocks such as navigation, login, forms, tables, services, flows, gallery, map and modal. Components can be clicked or dragged. |
| Visual canvas | Shows realistic component previews inside semantic regions: header, content, aside and actions. Drag/drop chooses placement; inspector controls exact behavior. |
| Inspector | Edits title, region, width, alignment, chrome, binding, action and permission for the selected component. |
| Contract authoring | Keeps the visual guide and JSON editor synchronized so the same screen can be created by a user, by Chicle AI or by importing a package. |

The designer must not hardcode component behavior in the page implementation. Page code can orchestrate editing state,
but the component behavior that belongs to generated apps must live in the component object:

```txt
componentKey -> props -> bindings -> events -> actions -> permissions -> states -> preview
```

For example, a menu component reads `app_navigation`, filters by permissions and uses a `navigate` action per item. A
button emits `onClick` and the Action Runner executes `execute_service`, `execute_flow`, `open_modal`, `logout` or
`navigate` based on the stored contract.

### Component Palette Rule

The palette is a vertical working list. It must not become a horizontal-scrolling catalog that hides available blocks.
Users should scan components from top to bottom, filter by category, search by purpose and see target/kit support before
adding anything to the canvas.

Each palette entry must show:

- component name and business purpose;
- supported targets: web, mobile, desktop, admin or public;
- supported visual kits: PrimeNG, Ionic, Material, Bootstrap or native fallback;
- whether it needs data binding, action configuration or permissions;
- its recommended region and default width.

This rule is important for Chicle AI as well. The assistant must be able to read the same palette inventory and choose
components by intent, not by guessing UI fragments.

### Region-Based Canvas

The canvas uses semantic drop zones:

| Region | Use |
| --- | --- |
| `header` | App navigation, tabs, hero headers and screen-level context. |
| `content` | Main business components such as forms, tables, cards, dashboards, galleries and maps. |
| `aside` | Filters, secondary navigation, record context or helper panels. |
| `actions` | Buttons, service actions, flow triggers and bottom/mobile action areas. |

Each component stores its region and responsive layout. Desktop can use multi-column widths, while tablet and mobile
collapse to full width by default. This keeps one contract usable across generated web, mobile and desktop artifacts.

### Viewport Switching

Viewport switching is a design requirement, not a label change. When the user changes between desktop, tablet and
mobile, the designer must:

- resize the preview frame to the selected device family;
- apply the same responsive layout rules that the runtime will apply;
- collapse multi-column layouts on tablet/mobile when required;
- show mobile navigation and sticky action patterns when the selected target needs them;
- keep the selected component and inspector state stable while switching.

The preview frame must make it obvious what will happen to the app in each target. This prevents the generated mobile
app from feeling like a squeezed desktop page, and prevents the generated desktop app from looking like a stretched
phone screen.

### Why This Is Not a Free Canvas First

A free canvas is visually attractive but dangerous for a runtime application factory:

- absolute positions do not translate cleanly to mobile;
- generated apps become harder to theme across PrimeNG, Ionic, Material and Bootstrap;
- components become harder to validate for accessibility and permissions;
- imported templates are more fragile across tenants and screen sizes;
- AI-generated layouts become harder to reason about and repair.

Chicle therefore starts with a professional responsive canvas. Advanced freeform editing may later be exposed as a
special layout strategy for landing pages, dashboards or kiosk screens, but the default remains region-based and
contract-driven.

### Drag, Drop And Inspect Workflow

The expected workflow is:

```txt
1. Select an app and screen.
2. Drag a component from the palette into a region.
3. Click the component in the canvas.
4. Use the inspector to select binding, action, width, chrome and permissions.
5. Preview desktop, tablet and mobile.
6. Save or publish the screen contract.
```

Clicking a palette item still adds the component using its recommended region. Dragging allows the user to override the
region directly.

The Admin implementation must make this workflow visible without requiring training:

- the palette is grouped by business purpose, not only by technical component key;
- each palette item is draggable and still works with click/tap;
- the canvas shows a short instruction banner and a live count by region;
- empty regions are explicit drop targets;
- selected components show a mini preview and quiet editing actions;
- the inspector explains what to edit next when no component is selected.

### Canvas Preview And Interaction Contract

The canvas preview must show what type of component the user is adding. It must not display generic guide cards only.
Expected previews:

- navigation blocks show real menu items, tabs or mobile navigation controls;
- login and forms show real input/select/button controls with sample state;
- tables show headers, rows and row actions;
- service and flow buttons show clickable action controls;
- metrics show KPI boxes with sample values;
- galleries show media tiles;
- maps show a map surface;
- timelines show event rows;
- modals show an openable modal preview;
- cards and details show representative data.

Preview interaction is sandboxed. Users should be able to type, open selects, click sample buttons, open modals and
move through navigation without accidentally publishing or corrupting the screen contract. When a preview action needs
real execution, it must go through a test mode that clearly reports sample data, service response, flow response,
success and error state.

Design-time preview and runtime rendering must use the same component registry whenever possible. The designer may use
mock data, but it must not invent a different visual language from the generated app.

### Ionic Component Coverage

Generated mobile apps depend on strong Ionic support. Ionic is not only a color theme; it is a component kit. Chicle
must provide Ionic-native adapters or faithful wrappers for the same declarative component contracts used by web/admin
screens.

Minimum Ionic families:

- form controls: `ion-input`, `ion-textarea`, `ion-select`, `ion-toggle`, `ion-checkbox`, `ion-radio-group`,
  `ion-datetime`;
- actions: `ion-button`, `ion-fab`, sticky bottom actions and action sheets;
- navigation: `ion-menu`, `ion-tabs`, bottom navigation, segments and toolbar/header patterns;
- display: `ion-list`, `ion-item`, `ion-card`, badges, chips, empty states and skeleton states;
- feedback: `ion-modal`, `ion-alert`, `ion-toast`, `ion-loading`;
- mobile capabilities: camera, file upload, GPS/location and evidence capture.

Every new app component should declare whether it has an Ionic adapter. Components without mobile support must be
clearly marked so the assistant does not use them in a mobile app by mistake.

### Build While Previewing

The expected professional workflow is:

```txt
1. Select or create an app.
2. Select or create a screen.
3. Pick a component from the vertical palette.
4. Drop or add it into a region.
5. See a real preview immediately.
6. Configure binding, action, permissions and responsive width in the inspector.
7. Switch desktop/tablet/mobile and confirm the layout.
8. Test the component or full screen in sandbox mode.
9. Save draft or publish a reviewed version.
```

This workflow is the baseline for Chicle AI. The assistant should be able to "cook" an app by creating the app graph,
adding screens, placing components, connecting dependencies and explaining the visible result.

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
    "startRoute": "/home",
    "groups": [
      { "key": "main", "label": "Main", "placement": "top" },
      { "key": "mobile", "label": "Mobile", "placement": "bottom" }
    ]
  },
  "routing": {
    "basePath": "/apps/events_app",
    "publicBasePath": "/public/events_app",
    "strategy": "tenant_app_routes"
  },
  "security": {
    "mode": "authenticated",
    "loginScreenKey": "login",
    "publicScreens": []
  },
  "lifecycle": {
    "status": "draft",
    "publishedVersion": null
  },
  "permissions": [],
  "screens": [],
  "settings": {},
  "metadata": {
    "designer": "app_studio_tanda_9_14"
  }
}
```

Required governance fields:

| Field | Purpose |
| --- | --- |
| `tenantId` | Tenant owner of the app. |
| `key` | Stable technical app key within the tenant. |
| `category` | Portfolio grouping such as operations, sales, events, internal or landing. |
| `targets` | Supported runtime targets. |
| `navigation` | Menu mode, groups and start route. |
| `routing` | Tenant-aware route strategy and base paths. |
| `security` | Auth mode, login screen and public screens. |
| `presentation` | Default kit, theme, density and visual tokens. |
| `text` | Default namespace and supported locales. |
| `lifecycle` | Draft/published/archive status and current published version. |
| `settings` | App-level configurable values that are not secrets. |

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
    "designer": "app_studio_tanda_9_14"
  }
}
```

### dynamic_screen_versions

`dynamic_screen_versions` freezes a screen definition. Publishing a screen version makes it available to runtime consumers.

The version stores a dependency snapshot with component keys and referenced `formKey`, `serviceKey` and `flowKey` values.

## App, Page And Landing Taxonomy

Chicle uses precise names so the Admin experience stays clear:

| Concept | Meaning | Typical visibility |
| --- | --- | --- |
| App | Product container owned by a tenant. It groups pages, navigation, theme, language, security and package metadata. | Admin-managed, runtime-consumed |
| Screen / Page | One route or view inside an app. It is composed from regions and registered components. | Private, public or embedded |
| Landing page | Public page optimized for marketing, SEO, CMS sharing and lead capture. It still belongs to a tenant and app portfolio. | Public |
| Component template | Reusable composed block such as a login panel, form card, modal, search + table or landing hero. | Reused by screens and landings |
| Template package | Portable export/import bundle containing app contracts and dependencies. | Admin install/export |

Landing pages should use the same component registry, themes, text packages, actions and service bindings, but they are
managed through a public-page workflow with SEO, slug, publish URL, external embed and CMS-sharing options.

## Tenant Runtime Resolution

Runtime resolution always starts from tenant context:

```txt
tenantSlug + appKey + route + target
  -> published app version
  -> published screen version
  -> navigation and permissions
  -> text bundle and presentation profile
  -> component registry
  -> bindings/actions runtime
```

The frontend must not decide which unpublished page to run. The API returns only contracts that are valid for the
published runtime. A generated web, Ionic or desktop artifact uses this lookup:

```http
GET /api/apps/by-key/{appKey}/runtime-route?route=/home&target=web
```

The response includes:

- the published app manifest;
- the selected published screen;
- target-filtered published screens;
- calculated navigation from screen contracts;
- component catalog available to the renderer;
- cache metadata with app version and screen version.

The older full-app runtime endpoint remains useful when a shell wants to preload every published screen:

```http
GET /api/apps/by-key/{appKey}/runtime
```

Both endpoints require tenant auth. They never return drafts, trashed screens or unpublished contracts.

Runtime security is contract-driven:

- Runtime route lookup is not Admin-gated by `apps.read`; generated apps should not need Admin read permission.
- Screen access is evaluated from the published screen `permissions` contract.
- Component access is evaluated from `permissions` or `visibility.permissions` inside the published component.
- Inaccessible screens are rejected with a forbidden response.
- Inaccessible components are filtered out before the runtime contract reaches the client.
- Owner/Admin roles keep the same bypass semantics used by the RBAC guard.

The Admin frontend also provides a first route runtime shell:

```text
/apps/run/{appKey}?route=/home&target=web
```

That shell consumes `runtime-route`, renders published navigation and renders reusable component adapters. It is
intentionally contract-driven: the shell does not know about draft pages and does not hardcode app-specific screens.

## Generated Runtime Component Adapters

The generated runtime renderer supports a safe adapter surface. Components that need backend execution call the
existing runtime clients instead of inventing page-specific HTTP logic.

| Component key | Runtime behavior |
| --- | --- |
| `hero_header` | Renders the published title, subtitle and source metadata. |
| `nav_menu` | Renders navigation items from the published app/screen contracts. |
| `auth_login` | Renders a route link toward the configured login screen or login route. |
| `form_runtime` | Opens the published Dynamic Form route by `formKey`. |
| `data_table` | Loads rows from a bound Dynamic Service or table-style source. |
| `search_panel` | Executes a bound Dynamic Service with a search query payload. |
| `service_button` | Executes a published Dynamic Service with editable JSON input. |
| `flow_button` | Executes a published Flow with editable JSON input. |
| `metric_strip` | Renders metric cards from component inputs. |
| `media_gallery` | Renders gallery items from component inputs. |
| `modal_shell` | Opens an inline modal preview from component inputs. |

Runtime adapters stay intentionally small. Complex business logic remains in Dynamic Services, Dynamic Forms or Flows.

## Multi-App Authoring Scenarios

The architecture must support repeated prompts that create different apps inside the same tenant without mixing their
routes, forms, services, texts or permissions.

### Scenario: Tuerca business app

User request:

```txt
Create an app called Tuerca. It should use a login form, have a home page with a menu of buttons and open several
prefabricated dynamic forms.
```

Expected tenant graph:

```txt
Tenant
  -> App: tuerca
     -> Security: authenticated
     -> Login screen: login
        -> Component: auth_login
        -> Action: execute_service auth.login
     -> Home screen: home
        -> Component: nav_menu or button_menu
        -> Components: service_button / form_launcher / route_card
        -> Actions: navigate to form screens
     -> Form screens
        -> form_runtime bound to published Dynamic Forms
     -> Navigation groups
        -> main
        -> forms
     -> Text namespace
        -> app.tuerca
     -> Resource policies
        -> apps.tuerca.read
        -> apps.tuerca.manage
        -> forms referenced by the app
```

The assistant may create missing screens and draft bindings, but it must clearly mark any form/service/flow that still
needs creation or publication before runtime.

### Scenario: Gallery app

User request:

```txt
Create an image gallery app.
```

Expected tenant graph:

```txt
Tenant
  -> App: image_gallery
     -> Security: authenticated or public, depending on the prompt
     -> Home screen
        -> Component: media_gallery
        -> Optional component: search_panel
        -> Optional component: upload_button or form_runtime for metadata
     -> Dynamic services
        -> list images
        -> upload image
        -> update image metadata
     -> File storage bindings
        -> files module
     -> Text namespace
        -> app.image_gallery
     -> Resource policies
        -> gallery.read
        -> gallery.upload
        -> gallery.manage
```

If the user does not specify public access, Chicle defaults to authenticated access and asks before exposing a public
gallery route.

## App Studio V2 Experience

The current `/apps` route evolves into App Studio V2 with two levels:

```txt
App Studio
  -> Tenant app portfolio
     -> Search, filters, status, target, category, publication
     -> Create app with AI or guided wizard
  -> Selected app workspace
     -> Overview
     -> Pages
     -> Navigation
     -> Login and security
     -> Component templates
     -> Forms/services/flows used by the app
     -> Theme and text package
     -> Preview
     -> Publish
     -> Export/install package
```

The selected app workspace is the place where users understand and manage the app after it has been created. Screen
editing remains inside that app context, so a user is never editing a detached page without knowing which app owns it.

## App Creation Pipeline

App Studio creates an app graph inside the current tenant. A prompt or guided wizard does not create a detached screen;
it creates the minimum set of tenant-scoped artifacts required for the app to exist, be previewed and be governed.

The creation pipeline is:

```txt
1. Intent
   -> app name, app key, category, targets, security mode and default language
2. Discovery
   -> available forms, services, flows, tables, components, themes, text namespaces and permissions
3. App graph draft
   -> dynamic_app, screens, navigation, components, bindings, actions, texts, policies and tests
4. Dependency plan
   -> what already exists, what must be created, what must be published and what is blocked
5. Preview
   -> desktop, tablet, mobile, public or embedded target simulation
6. Save and version
   -> drafts become versioned contracts
7. Publish
   -> runtime can resolve the app through tenant + appKey + route + target
8. Export or install
   -> app package can move between environments or tenants
```

App Studio must show this graph in plain language. For example, a request for an app named `tuerca` with login, home
menu and several prefabricated forms becomes:

```txt
App: tuerca
  Security: authenticated
  Login: screen login -> auth_login -> auth.login
  Home: screen home -> nav_menu/button_menu
  Form pages: one screen per selected published Dynamic Form
  Navigation: main group with routes to every form page
  Text: app.tuerca namespace
  Policies: app access plus referenced form/service/flow permissions
```

If the user asks for an image gallery app, the graph changes but the governance stays the same:

```txt
App: image_gallery
  Security: authenticated by default, public only if approved
  Home: screen home -> media_gallery
  Data: list_images service and optional upload_image service
  Files: storage binding and evidence permissions
  Text: app.image_gallery namespace
  Policies: gallery.read, gallery.upload and gallery.manage
```

Every app remains editable from Admin after creation. Owners and admins can open the app workspace, see its pages,
navigation, dependencies, text package, theme, permissions, published version, package exports and audit history.

## Multi-Tenant App Rules

- A tenant may own many apps, pages, landing pages and template installs.
- `appKey` is unique inside one tenant, not globally.
- A screen route is unique inside one app.
- Navigation is scoped to the app, so menus from one app do not leak into another app.
- Text namespaces are scoped by app, for example `app.tuerca` or `app.image_gallery`.
- App preferences are scoped by app and may override tenant defaults for kit, theme, locale, density and target support.
- Permissions are evaluated by tenant, app, screen, component action and referenced runtime object.
- Public routes can expose only published public contracts and never expose secrets or admin-only actions.
- Deleted apps, screens and component templates move to trash so active keys can be reused safely.
- Restoring an app checks key and route conflicts before reactivation.

## Component Contract

Screens are made of allowed visual component keys. V1 registers these keys:

- `hero_header`
- `nav_menu`
- `side_nav`
- `bottom_nav`
- `auth_login`
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
- `modal_shell`

Each component must declare:

- `componentKey`
- `title`
- `region`
- `order`
- `inputs`
- `bindings`
- `actions`
- `visibility`
- `permissions`
- `layout`

The component contract is intentionally close to Dynamic Forms and Dynamic Services so an assistant can build screens by combining known artifacts instead of generating custom code.

The Admin designer edits components through a region map. Selecting a component loads its editable contract fields:
component key, title, region, desktop width, alignment, chrome, binding type/key, action type/target and optional
permission. The generated JSON writes the permission both as `permissions[]` and `visibility.permissions[]` so runtime
filtering can remain compatible with direct and visibility-based policies.

### Guided Presets

The designer exposes guided presets for common app-building tasks. A preset is not a separate runtime shortcut. It is a
small authoring helper that inserts a normal `components[]` entry using the same contract documented above.

Current presets:

| Preset | Component key | Default region | Default binding | Default action |
| --- | --- | --- | --- | --- |
| Menu | `nav_menu` | `header` | current app source | `navigate` to the current route |
| Standard login | `auth_login` | `content` | `auth.login` service | `execute_service` |
| Form | `form_runtime` | `content` | selected `formKey` | `submit_form` |
| Table | `data_table` | `content` | selected `serviceKey` or table | service-backed read |
| Action | `service_button` | `actions` | selected `serviceKey` | `execute_service` |

The preview must name these presets in human terms. It should not expose internal metadata as pill buttons. Runtime
metadata such as target, kit and theme is shown as quiet informational text because it explains the simulated rendering
environment but is not an action.

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
- `nav_menu`, `side_nav` and `bottom_nav` are renderers for this same contract. They do not own navigation data by
  themselves.
- Login, setup, password recovery and protected internal screens normally use `showInMenu: false` so they stay routable
  without appearing in the main menu.
- Generated web, mobile and desktop apps read the published app/screen contracts and choose the appropriate menu
  renderer for the active target.

### Standard Login Contract

Login is a first-class screen pattern because most generated apps need a predictable entry point. A login screen should
not be generated as an onboarding or generic record form.

Default login screen behavior:

```json
{
  "key": "login",
  "route": "/login",
  "target": "multi",
  "navigation": {
    "showInMenu": false,
    "label": "Login",
    "group": "security"
  },
  "components": [
    {
      "componentKey": "auth_login",
      "title": "Sign in",
      "region": "content",
      "bindings": {
        "type": "service",
        "key": "auth.login"
      },
      "actions": [
        {
          "event": "primary",
          "type": "execute_service",
          "serviceKey": "auth.login"
        }
      ],
      "layout": {
        "desktop": "half",
        "tablet": "full",
        "mobile": "full",
        "align": "center",
        "chrome": "card"
      }
    }
  ]
}
```

The `auth_login` renderer is responsible for using the active UI kit and platform conventions: PrimeNG on Admin/web,
Ionic on mobile/native targets, Material or Bootstrap when those kits are selected, and native fallback only when no kit
adapter is active.

## Preview Rules

The preview is a simulation of the published runtime contract, not a debugger dump.

- Show a top app bar only when there are menu-visible routes or a menu component.
- Show menu labels from `navigation.label` and routes from the current screen list.
- Show "visible in menu" versus "internal route" in plain language.
- Keep target, kit and theme as quiet context text, not command buttons.
- Desktop preview may use wider regions and cards. Tablet and mobile stack content and choose the target navigation
  shape.
- Components without a binding should say "no binding configured" so the user knows what is missing before publishing.

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

## Package Dry-Run

Before installing a package, Admin or Chicle AI can ask the backend for a non-mutating install plan:

```http
POST /api/apps/packages/dry-run
```

Request:

```json
{
  "package": {
    "schemaVersion": 1,
    "kind": "chicle_app_package",
    "packageKey": "events_app",
    "app": {
      "key": "events_app",
      "manifest": {
        "schemaVersion": 1,
        "kind": "dynamic_app",
        "key": "events_app",
        "name": "Events App"
      }
    },
    "screens": []
  }
}
```

The response reports whether the app would be created, blocked by an active key, affected by a trashed key, or would
create/update screens. It also lists dependencies and unknown component keys. Dry-run never creates rows, versions,
screens, dependencies or publications.

## Authoring Flow

1. Create or select an app.
2. Create or select a screen inside that app.
3. Add reusable components or use guided presets such as Menu, Standard login, Form, Table or Action.
4. Preview the screen in desktop, tablet and mobile.
5. Edit JSON directly if needed.
6. Save draft.
7. Publish a version when the contract is stable.

The visual guide and JSON editor are equivalent entry points. The JSON contract is the source used for import/export, AI authoring and future template installation.

## AI-Assisted App Authoring

Chicle AI can now propose app and screen drafts from the Apps designer. The assistant must operate on the current
screen state and return draft actions, not save or publish automatically.

Supported draft actions:

- `apply_dynamic_app_json`: applies a dynamic app manifest to the visual designer.
- `apply_dynamic_screen_json`: applies a dynamic screen definition to the visual designer.

Expected prompt flow:

1. Normalize the user request into app intent, target and first screen.
2. Detect common patterns such as login, dashboard, CRUD screen, list screen, form screen, flow action or menu.
3. Insert safe preset components with bindings and actions when the request is clear.
4. Ask for missing keys only when a form, service, flow or table cannot be inferred.
5. Apply the draft to the designer and let the user preview, edit JSON, save and publish from the page.

Examples:

| User request | Expected draft |
| --- | --- |
| "Create a mobile app with login and a home menu" | app manifest, `login` screen with `auth_login`, `home` route/menu context |
| "Add a form screen for customer registration" | screen with `form_runtime`, `formKey` placeholder and submit action |
| "Add a screen that lists service results" | screen with `data_table` bound to a published dynamic service |
| "Add a button to run the approval flow" | component using `flow_button` and `execute_flow` |

## API Surface

```text
GET  /api/apps
GET  /api/apps/trash
POST /api/apps/authoring/json
POST /api/apps/packages/install
POST /api/apps/packages/dry-run
GET  /api/apps/by-key/:key
GET  /api/apps/by-key/:key/runtime
GET  /api/apps/by-key/:key/runtime-route?route=/home&target=web
WEB  /apps/run/:appKey?route=/home&target=web
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

Runtime endpoints only expose published contracts to authenticated users. Business access is enforced through the
published screen and component permissions, while Admin authoring continues to use the permissions above.

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
- Dynamic And Administrable: apps, screens, navigation, texts, bindings, preferences and runtime behavior are versioned metadata managed from Admin.
- Reusable: screens consume shared components, services, forms and flows.
- High Quality: JSON contracts are validated before versioning and remain consistent across preview, publish and runtime.
- Secure: RBAC protects authoring and publishing.
- Scalable: published contracts can be served by the API runtime or separated services.
- Reliable And Resilient: versioning allows stable runtime contracts and rollback paths.
- Extensible: new component keys, targets and package installers can be added without rewriting existing apps.
- Intelligent: the JSON contract is structured for AI-assisted authoring.
