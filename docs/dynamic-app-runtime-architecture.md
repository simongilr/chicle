# Dynamic App Runtime Architecture

## Purpose

Dynamic Apps are the layer that turns Chicle from a set of builders into a real application factory. A generated app is
not a hardcoded Angular page and it is not a disconnected exported artifact. It is a tenant-owned, versioned, executable
runtime contract that combines screens, navigation, components, forms, services, flows, permissions, text bundles,
themes, offline policies and tests.

This document is the canonical architecture for how Chicle stores, publishes, delivers, caches and executes generated
apps across Admin, web apps, mobile apps and desktop apps.

## Core Principle

Store the app as a published graph of Chicle contracts, not as generated screen code.

Allowed:

- tenant-scoped app objects;
- versioned app snapshots;
- versioned screen snapshots;
- declarative component instances;
- declarative navigation;
- bindings to Dynamic Services, Dynamic Forms, Flows, records, app state, route params and text bundles;
- permission-filtered runtime manifests;
- local cache and offline queues;
- runtime shells for web, Ionic mobile and desktop artifacts;
- portable template packages.

Not allowed:

- generated apps that depend on Admin-only page code;
- tenant JSON that stores Angular, Ionic, PrimeNG, Material or Bootstrap selectors directly;
- frontend code that writes arbitrary tables without a published service/form/flow contract;
- runtime structure changes from unversioned service responses;
- secrets, provider credentials or environment-specific URLs embedded in app contracts;
- offline writes without idempotency;
- public screens that bypass tenant, route, permission or publication validation.

## Architecture Layers

```txt
App Studio
  -> Draft App Graph
     -> Versioned App Graph
        -> Published Runtime Manifest
           -> Runtime Cache
              -> Dynamic Renderer
                 -> Component Registry
                 -> Binding Resolver
                 -> Action Runner
                 -> Permission Resolver
                 -> Text Resolver
                 -> Offline Queue
```

| Layer | Responsibility |
| --- | --- |
| App Studio | Creates and edits tenant apps, screens, navigation, components, bindings, permissions and publication state. |
| Draft app graph | Editable objects that owners/admins and Chicle AI can modify safely before publication. |
| Versioned app graph | Frozen app and screen snapshots with pinned dependencies. |
| Runtime manifest | Permission-aware payload returned by the API for a specific tenant, app, target and route set. |
| Runtime cache | IndexedDB/local cache used by web/mobile/desktop shells for fast boot and offline use. |
| Dynamic renderer | Generic renderer that paints routes, navigation, components, forms and state from contracts. |
| Component registry | Validates component keys and chooses PrimeNG, Ionic, Material, Bootstrap or native adapters. |
| Binding resolver | Loads approved data sources and maps them into component inputs. |
| Action runner | Executes navigation, services, flows, forms, modals, messages, state updates and offline queue operations. |
| Permission resolver | Filters screens, components and actions by tenant, user, roles, permissions and resource policy. |
| Text resolver | Resolves labels, placeholders, messages and errors from text bundles with local fallbacks. |
| Offline queue | Stores allowed offline operations and syncs them with idempotency when connectivity returns. |

## Runtime Object Model

The app runtime is a graph. Forms and components are important nodes, but they are not enough by themselves. Chicle also
needs app identity, screens, navigation, bindings, actions, state, offline policy, text and presentation.

```txt
Tenant
  -> Dynamic App
     -> App Versions
     -> Screens
        -> Screen Versions
           -> Component Instances
              -> Bindings
              -> Events
              -> Actions
              -> States
              -> Permissions
     -> Navigation
     -> Text Namespace
     -> Presentation Profile
     -> Offline Policy
     -> Template Package Dependencies
```

### Dynamic App

The app object is the product container. It identifies one tenant-owned business app, public page set or embedded app.

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_app",
  "key": "tuerca",
  "name": "Tuerca",
  "description": "Operations app for mechanics and service requests.",
  "category": "operations",
  "status": "draft",
  "targets": ["web", "mobile", "desktop"],
  "defaultRoute": "/home",
  "security": {
    "mode": "tenant_auth",
    "loginRoute": "/login",
    "publicRoutes": []
  },
  "presentation": {
    "kit": "auto",
    "theme": "chicle",
    "themeMode": "system",
    "density": "comfortable"
  },
  "i18n": {
    "namespace": "app.tuerca",
    "defaultLocale": "en",
    "supportedLocales": ["en", "es"]
  },
  "offline": {
    "enabled": true,
    "bootstrapCache": true,
    "textCache": true,
    "assetCache": true,
    "actionQueue": true
  }
}
```

### App Version

An app version is the published snapshot used by runtime shells. Runtime apps should not assemble live behavior from
many mutable draft rows. They must execute the published app version.

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_app_version",
  "appKey": "tuerca",
  "version": 4,
  "status": "published",
  "publishedAt": "2026-08-09T00:00:00.000Z",
  "dependencies": {
    "screens": ["login@2", "home@5", "inspection@3"],
    "forms": ["login@1", "inspection_form@4"],
    "services": ["create_inspection@2", "list_inspections@1"],
    "flows": ["inspection_review@1"],
    "textPackages": ["app.tuerca/en@4", "app.tuerca/es@4"],
    "componentRegistry": "runtime-components@1"
  }
}
```

### Screen

A screen is one route or view inside an app. Screens are always scoped by tenant and app, so multiple apps in the same
tenant can each own `/home`, `/login` or `/settings`.

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_screen",
  "appKey": "tuerca",
  "key": "home",
  "route": "/home",
  "titleKey": "app.tuerca.screens.home.title",
  "target": ["web", "mobile", "desktop"],
  "status": "draft",
  "navigation": {
    "visible": true,
    "group": "main",
    "order": 10,
    "icon": "home"
  },
  "permissions": {
    "visibleWhen": ["tuerca.home.read"]
  }
}
```

### Screen Version

A screen version is the layout and component graph for one route.

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_screen_version",
  "appKey": "tuerca",
  "screenKey": "home",
  "version": 5,
  "layout": {
    "strategy": "regions",
    "regions": ["header", "content", "aside", "actions"],
    "responsive": {
      "desktop": { "contentColumns": 12, "aside": "right" },
      "tablet": { "contentColumns": 8, "aside": "below" },
      "mobile": { "contentColumns": 4, "aside": "below", "actions": "bottom_sticky" }
    }
  },
  "components": [
    {
      "id": "cmp_main_nav",
      "componentKey": "nav_menu",
      "region": "header",
      "order": 10
    },
    {
      "id": "cmp_recent_inspections",
      "componentKey": "data_table",
      "region": "content",
      "order": 20
    }
  ]
}
```

### Navigation

Navigation is not hardcoded in the app shell. It is an app-owned object that can render as top navigation, side menu,
tabs or bottom mobile navigation depending on target and presentation rules.

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_navigation",
  "appKey": "tuerca",
  "groups": [
    {
      "key": "main",
      "labelKey": "app.tuerca.nav.main",
      "type": "adaptive",
      "targets": {
        "desktop": "top_nav",
        "tablet": "side_nav",
        "mobile": "bottom_nav"
      },
      "items": [
        {
          "labelKey": "app.tuerca.nav.home",
          "route": "/home",
          "icon": "home",
          "permissions": ["tuerca.home.read"]
        }
      ]
    }
  ]
}
```

### Component Instance

Component instances follow the canonical structure defined in `docs/declarative-component-architecture.md`. A screen
stores component instances, not component implementations.

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_component",
  "id": "cmp_recent_inspections",
  "componentKey": "data_table",
  "name": "Recent inspections",
  "layout": {
    "region": "content",
    "width": "two_thirds",
    "responsive": {
      "mobile": { "width": "full" }
    }
  },
  "props": {
    "titleKey": "app.tuerca.inspections.recent",
    "emptyMessageKey": "app.tuerca.inspections.empty"
  },
  "data": {
    "sources": [
      {
        "key": "rows",
        "type": "dynamic_service",
        "serviceKey": "list_inspections",
        "params": {
          "status": "{{state.filters.status}}"
        },
        "cache": {
          "enabled": true,
          "ttlSeconds": 300,
          "offlineFallback": true
        }
      }
    ],
    "bindings": {
      "rows": "{{rows.result}}"
    }
  },
  "events": {
    "onRowClick": [
      {
        "type": "navigate",
        "route": "/inspections/{{event.row.id}}"
      }
    ]
  },
  "permissions": {
    "visibleWhen": ["inspections.read"]
  }
}
```

## Storage Responsibilities

The exact table names can evolve through migrations, but the responsibilities must remain stable.

| Responsibility | Storage |
| --- | --- |
| App identity and lifecycle | `dynamic_apps` |
| Frozen app snapshots | `dynamic_app_versions` |
| Screen identity and route metadata | `dynamic_screens` |
| Frozen screen layout/component snapshots | `dynamic_screen_versions` |
| Navigation graph | `dynamic_navigation` or app version metadata until the table is split |
| Reusable component definitions | component registry plus future `dynamic_component_definitions` |
| Component instances | screen version payloads or future `dynamic_component_instances` |
| Dynamic forms | `dynamic_forms`, `dynamic_form_versions`, `dynamic_form_bindings` |
| Dynamic services | `dynamic_services`, `dynamic_service_versions`, `dynamic_service_runs` |
| Flows | `flows`, `flow_versions`, `flow_steps`, `flow_runs` |
| Text bundles | text package module and generated app namespaces |
| Presentation profiles | UI presentation config, app preferences and theme tokens |
| Permissions and policies | roles, permissions, user roles and resource policies |
| Offline queue and sync | client IndexedDB plus backend idempotency/event records |
| Audit | audit events, run logs and publish history |

Draft objects are editable. Published versions are immutable. Trash removes active availability but keeps audit and
restore history.

## Published Runtime Manifest

Generated app shells should request a permission-filtered manifest. The backend may expose multiple endpoints, but the
canonical lookup is:

```http
GET /api/runtime/apps/:appKey/bootstrap?target=web
GET /api/runtime/apps/:appKey/routes/:route?target=mobile
```

The bootstrap manifest should include only what the current user, tenant, target and publication state can access.

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_app_runtime_manifest",
  "tenant": {
    "id": "tenant-id",
    "slug": "meteoro"
  },
  "app": {
    "key": "tuerca",
    "version": 4,
    "defaultRoute": "/home",
    "targets": ["web", "mobile", "desktop"]
  },
  "security": {
    "authenticated": true,
    "permissions": ["tuerca.home.read", "inspections.read"],
    "sessionStrategy": "refresh_cookie"
  },
  "navigation": [],
  "routes": [
    {
      "route": "/home",
      "screenKey": "home",
      "screenVersion": 5
    }
  ],
  "screens": [],
  "componentRegistry": {
    "version": "runtime-components@1",
    "keys": ["nav_menu", "dynamic_form", "data_table", "service_button"]
  },
  "forms": [],
  "services": [],
  "flows": [],
  "texts": {
    "namespace": "app.tuerca",
    "locale": "en",
    "fallbackLocale": "es",
    "bundleVersion": 4
  },
  "presentation": {
    "kit": "auto",
    "theme": "chicle",
    "themeMode": "system"
  },
  "offline": {
    "enabled": true,
    "manifestCache": true,
    "textCache": true,
    "assetCache": true,
    "actionQueue": true,
    "syncPolicy": "when_online"
  }
}
```

## Runtime Boot Sequence

```txt
1. Load bundled defaults from the app artifact.
2. Read cached manifest and text bundle from IndexedDB.
3. Validate tenant, appKey, target and cached version metadata.
4. If online, request the published runtime manifest from the API.
5. Server filters by tenant, session, route, permissions and publication state.
6. Store the new manifest, screens, texts and safe assets in cache.
7. Render navigation and the active route through the Dynamic Renderer.
8. Resolve data bindings and execute allowed initial loaders.
9. Fall back to cached data when offline and allowed by policy.
```

This keeps first load fast, lets mobile artifacts boot offline, and keeps Admin as the source of truth whenever the
deployment profile allows refresh.

## Binding Resolution

Components do not call arbitrary URLs. They request data through approved binding sources.

| Binding source | Use |
| --- | --- |
| `dynamic_service` | Read, validate, write or integrate through a published Dynamic Service. |
| `dynamic_form` | Render a published form version and receive form state. |
| `flow` | Execute a published Flow and receive shaped output. |
| `record` | Read record data through approved runtime endpoints. |
| `table_view` | Read safe views exposed by backend policy, not raw SQL from the browser. |
| `route_param` | Use current route params such as `/customers/:id`. |
| `query_param` | Use current query params such as `?status=open`. |
| `session` | Use current user, tenant and permission context. |
| `state` | Use runtime state shared inside the screen/app. |
| `static` | Use safe constant data from the contract. |
| `cache` | Use previously cached data when offline policy allows it. |

Example:

```json
{
  "key": "customer",
  "type": "dynamic_service",
  "serviceKey": "get_customer",
  "params": {
    "id": "{{route.params.customerId}}"
  },
  "cache": {
    "enabled": true,
    "ttlSeconds": 600,
    "offlineFallback": true
  }
}
```

## Action Execution

Every user interaction goes through the Action Runner. The component emits an event; the stored contract defines the
actions.

| Action | Purpose |
| --- | --- |
| `navigate` | Move to a route inside the app. |
| `execute_service` | Call a published Dynamic Service. |
| `execute_flow` | Run a published Flow. |
| `submit_form` | Submit a Dynamic Form. |
| `open_modal` | Open a declarative modal component. |
| `close_modal` | Close the current modal. |
| `show_message` | Show toast/alert/banner feedback. |
| `set_state` | Update runtime state. |
| `refresh_binding` | Reload a data source. |
| `queue_offline` | Store an operation for later sync. |
| `logout` | End the current session through auth runtime. |

Example:

```json
{
  "onClick": [
    {
      "type": "execute_service",
      "serviceKey": "create_inspection",
      "payloadMap": {
        "input": "{{state.inspectionForm}}"
      },
      "resultKey": "createdInspection",
      "offline": {
        "allowed": true,
        "idempotencyKey": "{{state.inspectionForm.localId}}"
      },
      "onSuccess": [
        {
          "type": "show_message",
          "tone": "success",
          "messageKey": "app.tuerca.inspections.saved"
        },
        {
          "type": "navigate",
          "route": "/inspections"
        }
      ],
      "onError": [
        {
          "type": "show_message",
          "tone": "danger",
          "messageKey": "app.tuerca.inspections.saveFailed"
        }
      ]
    }
  ]
}
```

## Updating Components With Services

Service responses can update component data and runtime state. They should not silently mutate the published screen
structure.

### Data Update

Use this when the component already exists and only its content changes.

```txt
button click
  -> execute_service list_customers
  -> resultKey customers
  -> table.rows = customers.result
```

### State Update

Use this when one component changes what another component sees.

```txt
search input
  -> set_state filters.search
  -> refresh_binding customers
  -> table repaints
```

### Structural Update

Use this when the app gains a new component, screen, route or navigation item.

```txt
Admin / App Studio
  -> modify draft app graph
  -> publish new screen/app version
  -> runtime detects new version
  -> manifest refresh
  -> renderer shows new structure
```

A service can recommend a structural change only through an authoring operation in Admin. Runtime services must not
inject arbitrary new components into a user's active app session without publication.

## Offline Architecture

Offline support is app-level, screen-level and action-level. It is not a global assumption.

### Local Stores

Runtime shells use IndexedDB for structured offline data.

| Store | Content |
| --- | --- |
| `app_manifests` | Published app manifests by tenant, appKey, target and version. |
| `screen_versions` | Published screen contracts used by cached routes. |
| `component_registry` | Component registry metadata and adapter availability. |
| `text_bundles` | Locale bundles and fallback strings. |
| `asset_cache` | Safe assets declared by the manifest. |
| `binding_cache` | Cached service/form/flow read results with TTL and source metadata. |
| `action_queue` | Offline writes and deferred operations with idempotency keys. |
| `sync_state` | Last sync cursor, retry count, errors and conflict state. |

### Offline Policy

```json
{
  "offline": {
    "enabled": true,
    "manifestCache": true,
    "textCache": true,
    "assetCache": true,
    "dataCache": {
      "enabled": true,
      "defaultTtlSeconds": 600
    },
    "actionQueue": {
      "enabled": true,
      "retry": {
        "attempts": 5,
        "backoffMs": 1500
      },
      "conflictPolicy": "server_wins_unless_manual"
    }
  }
}
```

### Offline Write Rules

- Every offline write must have an idempotency key.
- The backend must deduplicate by tenant, user, action and idempotency key.
- The queued payload must reference a published service/form/flow version.
- Secrets are never stored in offline queues.
- Sensitive cached data must follow the app security policy.
- Conflicts must produce visible sync state, not silent data loss.

## Permission And Security Model

The runtime is filtered twice:

1. The backend sends only published screens/components/actions visible to the current context.
2. The frontend still evaluates local visibility/enabled rules for responsive states and cached manifests.

Security rules:

- Tenant scope is required for every runtime lookup.
- App key and route must resolve to a published app version.
- Component permissions are checked before rendering and before executing actions.
- Dynamic Services and Flows enforce their own permission and tenant policies.
- Public routes are explicit and limited.
- Admin-only contracts are not delivered to generated business apps.
- Environment URLs and secrets resolve through Environment And Deploy Center or Chicle Vault, not app JSON.

## Runtime Artifacts

Generated artifacts are thin runtime shells plus bundled defaults. They do not embed every customer screen as source
code.

| Artifact | Behavior |
| --- | --- |
| Web | Loads runtime manifest from API, caches contracts/texts/assets and renders through web adapters. |
| Ionic mobile | Uses Ionic-native adapters, embedded defaults and IndexedDB/local device storage for offline boot. |
| Desktop | Uses the same runtime contracts with desktop shell packaging and local cache. |
| Public/embedded | Loads only explicit public contracts and never receives private Admin data. |

At boot:

```txt
artifact config
  -> tenant/app bootstrap
  -> bundled defaults
  -> cached manifest
  -> API refresh when allowed
  -> dynamic renderer
```

## App Studio Authoring Contract

App Studio must expose the graph, not hide it behind disconnected forms.

Minimum authoring areas:

- app identity and targets;
- pages/routes;
- navigation;
- component canvas;
- component inspector;
- data bindings;
- actions;
- permissions;
- texts;
- theme/presentation;
- offline behavior;
- preview;
- tests;
- publish;
- export/import.

The visual guide and JSON editor must always modify the same app graph. Chicle AI can create drafts, but the user
saves, publishes, exports and installs explicitly.

## AI Authoring Requirements

When Chicle AI creates or changes an app, it must:

1. identify the app graph it is editing;
2. ask for missing business decisions only when they cannot be inferred safely;
3. use registered component keys only;
4. create or reuse app text keys instead of hardcoding UI copy;
5. connect components through approved bindings and actions;
6. validate permissions and offline policies;
7. produce a reviewable draft manifest;
8. never publish, expose public routes or install packages without user confirmation.

AI should understand commands such as:

```txt
Create an app named Tuerca with login, home, a menu, inspection forms and offline evidence capture.
Add a gallery screen to this app.
Connect this form to the home menu.
Make this component visible only to operators.
Turn this action into an offline queue.
```

## Template Package Integration

App export/import walks the published app graph recursively:

```txt
App
  -> app version
  -> screens and screen versions
  -> navigation
  -> components
  -> forms/services/flows referenced by components
  -> text bundles
  -> presentation profiles
  -> roles/permissions/resource policies
  -> assets
  -> tests
```

Packages must not include secrets. If a dependency needs a secret or environment URL, install must request it through
Chicle Vault or the Environment And Deploy Center.

## Definition Of Done

Dynamic App Runtime is considered complete when:

- App Studio stores apps, screens, navigation and components as versioned tenant objects.
- Published runtime manifests are immutable, permission-aware and target-aware.
- The same component registry powers App Studio preview and generated runtime rendering.
- Components can bind to services, forms, flows, route params, session, state and cache.
- Actions can navigate, execute services/flows, submit forms, open modals, update state and queue offline operations.
- Runtime apps can boot from cached manifests when offline.
- Offline writes use idempotency and sync state.
- Text bundles and presentation profiles are resolved dynamically with safe local fallbacks.
- Web, Ionic mobile and desktop shells consume the same published contract.
- App packages export/import the full graph without secrets.
- Chicle AI can generate and adjust drafts using the same contract.
