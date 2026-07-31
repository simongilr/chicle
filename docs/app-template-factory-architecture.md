# App Template Factory Architecture

Chicle App Factory is the layer that turns configured products into reusable, installable and exportable application
templates. It is the path to build business apps without copying code for every customer.

The foundation is a tenant app graph and a portable template package made of validated Chicle contracts. GridStack and
LiquidJS are optional adapters. They support design-time canvases or generated files when useful, but they do not define
the runtime contract.

## Core Principle

Store product intent as Chicle contracts, not as generated source code.

Allowed in a template:

- manifest;
- metadata;
- apps;
- tables and controlled schema changes;
- dynamic services;
- dynamic forms;
- flows;
- screens;
- landing pages;
- component templates;
- menus;
- roles, permissions and resource policies;
- themes and presentation profiles;
- text bundles and locale manifests;
- artifact preferences;
- assets;
- documentation;
- seed data;
- tests;
- compatibility and install rules.

Not allowed in a template:

- raw Angular components;
- arbitrary JavaScript;
- private environment values;
- raw SQL without backend validation;
- provider secrets;
- business-specific code inside the Chicle core.

## MVP Scope

The first usable App Factory does these things:

1. **Create** a tenant app in App Studio.
2. **Manage** app screens, navigation, login/security, preferences, text, permissions and dependencies.
3. **Preview** the app across desktop, tablet, mobile, public or embedded targets.
4. **Publish** app and screen versions as runtime contracts.
5. **Package** an app/template from existing Chicle objects.
6. **Export** that package as a portable file.
7. **Import** a package into another Chicle installation.
8. **Install** it safely into a tenant with preview, validation and conflict handling.

This is enough to share a configured app, move it between environments, reuse it for another client and let Chicle AI
understand what the app contains.

## Template Package Shape

```json
{
  "schemaVersion": 1,
  "kind": "chicle_template_package",
  "key": "field_inspection_app",
  "name": "Field Inspection App",
  "version": "1.0.0",
  "chicle": {
    "minVersion": "0.1.0",
    "contracts": ["dynamic_service@1", "dynamic_form@1", "flow@1", "dynamic_screen@1"]
  },
  "targets": ["admin", "web", "mobile", "desktop"],
  "dependencies": {
    "kits": ["primeng", "ionic"],
    "capabilities": ["camera", "gps", "offline_queue"]
  },
  "objects": {
    "apps": [],
    "appVersions": [],
    "schemaChanges": [],
    "services": [],
    "forms": [],
    "flows": [],
    "screens": [],
    "landingPages": [],
    "componentTemplates": [],
    "menus": [],
    "permissions": [],
    "roles": [],
    "resourcePolicies": [],
    "themes": [],
    "textBundles": [],
    "artifactPreferences": [],
    "assets": [],
    "docs": [],
    "tests": []
  },
  "locales": {
    "defaultLocale": "en",
    "supportedLocales": ["en", "es"],
    "requiredNamespaces": ["app.field_inspection"]
  },
  "install": {
    "mode": "tenant",
    "conflictPolicy": "ask",
    "prefix": "",
    "dryRunRequired": true
  }
}
```

## App Graph Before Package

A package starts from an app graph, not from a manually selected pile of files. Admin may still let an advanced user
select extra dependencies, but the default export scope is one app and everything needed by that app.

```txt
Tenant
  -> App
     -> App version
     -> Screens and screen versions
     -> Navigation groups
     -> Component templates
     -> Forms, services and flows referenced by components
     -> Text namespaces and artifact preferences
     -> Roles, permissions and resource policies
     -> Tables, schema changes, assets, docs and tests
```

The export process walks this graph recursively and produces a dependency report before the package is generated.

## Export Flow

```txt
Admin
  -> Select app/template scope
  -> Collect referenced objects
  -> Validate dependencies
  -> Remove secrets and environment values
  -> Freeze object versions
  -> Generate template package
  -> Run package tests
  -> Download or store package
```

Export must include referenced objects recursively. A screen that uses a form must include that form. A form that calls a
service must include that service. A flow that calls several services must include all of them. Permissions and menus
must be included when the app needs them to operate. Text namespaces referenced by screens, menus, forms, flows and
runtime messages must be included as public text bundles with safe fallbacks.

Tenant ownership is preserved as install context, not as a fixed exported tenant id. A package can be installed into a
different tenant, but all objects are recreated under the receiving tenant with conflict handling, audit and draft-first
publication rules.

## Import And Install Flow

```txt
Admin
  -> Upload template package
  -> Validate manifest and signatures/checksums
  -> Preview contents
  -> Run dry-run install
  -> Detect conflicts
  -> Ask for conflict decisions
  -> Apply schema changes
  -> Insert versioned objects
  -> Map tenant-specific values
  -> Publish selected objects
  -> Run smoke tests
  -> Register install history
```

Install must never overwrite active tenant behavior silently.

Conflict handling:

| Conflict | Default |
| --- | --- |
| Same key exists and active | Ask: keep, rename, replace, install as draft |
| Same key exists in trash | Restore or replace after confirmation |
| Required capability missing | Block until installed or disabled |
| Required table missing | Create through controlled schema changes |
| Secret required | Ask for value through Chicle Vault, never package the secret |
| Text key conflict | Ask: keep tenant override, replace, rename namespace or install as draft |
| Missing locale | Install with fallback or block when the package marks the locale as required |

## Screens

Screens are the missing piece between forms and full generated apps.

The screen contract should compose:

- forms;
- tables/lists;
- cards;
- charts;
- buttons/actions;
- service results;
- flow triggers;
- menus and route navigation;
- standard authentication screens;
- modals/drawers;
- permissions;
- layout by breakpoint.

The screen designer can later use GridStack for drag and resize, but the runtime should use the Chicle screen contract.
That keeps templates portable and avoids locking Chicle to one grid library.

Screens always belong to an app. A screen may be private, public, embedded or internal, but it still resolves through
tenant, app key, route, target, publication state and permissions.

## App Portfolio Management

Each tenant owns an app portfolio. The Admin must expose a tenant-scoped App Studio where owners and admins manage:

- business apps;
- internal admin-like apps;
- public landing pages;
- embedded pages;
- reusable component templates;
- app-level themes, locales and artifact preferences;
- navigation groups and menus;
- publication status and version history;
- export/import packages.

The portfolio UI must be searchable and paginated from the beginning. Chicle should assume that a tenant may eventually
have hundreds of pages and many apps. Users should be able to filter by app, status, target, category, route, template
source, owner, last update and publication state.

Generated apps do not become disconnected code. Every generated artifact keeps a logical link to its app key, version,
tenant, text package, service registry entries and publication metadata. Runtime apps refresh their published contracts
from the API when allowed by the deployment profile, and use bundled defaults when offline or packaged.

## Runtime Artifact Model

Generated web, Ionic/mobile and desktop artifacts are runtime shells plus bundled defaults. They do not need one custom
source tree per customer screen.

At boot, an artifact resolves:

```txt
environment profile
  -> tenant/app bootstrap config
  -> bundled app defaults
  -> API runtime contract refresh
  -> published app/screen/component graph
  -> text and presentation bundles
```

When Admin activates, disables, adds or removes a component, it changes the app/screen contract and publishes a new
version. Runtime artifacts pick up the new contract according to their refresh policy. A truly new component requires a
registered capability with supported kit renderers and tests before any app can use it.

## Components

The component registry is the bridge between template JSON and actual UI rendering.

Each registered component should declare:

- `componentKey`;
- category;
- supported targets;
- supported kits;
- allowed inputs;
- allowed outputs/events;
- allowed bindings;
- required permissions;
- preview examples;
- migration/version compatibility.

Templates reference components by `componentKey`, never by Angular selector.

Baseline application components that every generated app can reuse:

| Component key | Purpose |
| --- | --- |
| `nav_menu` | Top or compact route navigation from the app/screen navigation contract. |
| `side_nav` | Desktop/admin-style navigation when the target needs persistent sections. |
| `bottom_nav` | Mobile route navigation for app-like experiences. |
| `auth_login` | Standard login pattern bound to `auth.login` or another approved auth service. |
| `form_runtime` | Published Dynamic Form renderer. |
| `data_table` | Service or table-backed list/grid. |
| `service_button` | Direct Dynamic Service action. |
| `flow_button` | Direct Flow trigger. |
| `modal_shell` | Reusable modal container for forms, confirmations or details. |

The screen preview must render these as real app structure. Technical runtime metadata such as target, kit and theme is
displayed as context, not as command buttons.

## Component Templates

Component templates let Chicle reuse designed blocks without copying screen definitions. They are database objects that
compose registered components into a reusable unit.

Examples:

- a dynamic form inside a card with a fixed submit action;
- a modal with a form, validation summary and service response panel;
- a search area plus results grid;
- an evidence block with camera, GPS and offline state;
- a role-protected action bar.

Component templates are the right place for reusable composites such as "form in card", "login panel", "modal with
form and response", "search plus table" or "mobile evidence capture". They stay portable because they reference
registered components, bindings, actions and text keys instead of Angular implementation details.

Template packages may include component templates when a screen references them. Import rules are the same as other
versioned objects: validate first, install as draft by default and never overwrite an active key without an explicit
conflict decision.

Component templates must use the same portable contract:

- `componentKey` references only registered runtime components;
- `slots` define where nested components can be placed;
- `bindings` and `actions` are declarative;
- `presentation` inherits app theme and UI kit unless the template explicitly overrides them;
- permissions are enforced by the runtime, not by hidden frontend-only logic.

## Library Strategy

| Library | Baseline role | Expansion role |
| --- | --- | --- |
| Angular | Admin and web runtime shell | Same |
| Ionic | Mobile runtime and native-capable controls | Same |
| Formly | Dynamic form runtime | Same |
| PrimeNG / Material / Bootstrap | Installed visual kits | More adapters as needed |
| GridStack | Not required for template export/import | Optional design-time screen canvas |
| LiquidJS | Not required for runtime templates | Optional artifact generation for files/configs |

## LiquidJS Boundary

LiquidJS should be used only when Chicle needs to generate files or text artifacts:

- Docker files;
- environment templates;
- Capacitor configuration;
- generated README files;
- deployment manifests;
- starter seed files;
- package metadata.

LiquidJS should not render live UI and should not decide runtime permissions or data access.

## Artifact Generation

Template export/import and artifact generation are related but different.

| Concern | Template Package | Generated Artifact |
| --- | --- | --- |
| Purpose | Share app configuration | Deploy runnable app/build |
| Format | JSON package plus assets/docs | Docker image, web build, mobile project, desktop package |
| Secrets | Never included | Injected by environment/vault at deploy time |
| Text | Public bundles plus fallbacks | Embedded default package plus backend refresh |
| Runtime | Requires Chicle runtime | Contains or points to Chicle runtime |
| MVP required | Yes | Only basic Docker/app build is required |

The MVP should export/import templates before trying to generate many artifact types.

## Required Backend Objects

| Object | Purpose |
| --- | --- |
| `app_templates` | Template metadata and lifecycle. |
| `app_template_versions` | Immutable package versions. |
| `template_installs` | Tenant install history, status and conflict decisions. |
| `component_registry` | Components allowed in screens/templates. |
| `dynamic_component_templates` | Reusable component compositions such as modals, cards and compound blocks. |
| `dynamic_component_template_versions` | Immutable versions of reusable component templates. |
| `dynamic_apps` | Tenant app containers and app portfolio entries. |
| `dynamic_app_versions` | Immutable app manifest versions. |
| `dynamic_screens` | Screen definitions. |
| `dynamic_screen_versions` | Published screen versions. |
| `dynamic_landing_pages` | Public page definitions that share the same component/runtime model. |
| `dynamic_landing_page_versions` | Immutable landing page versions with SEO and public routing metadata. |
| `template_assets` | Images, icons, files and docs referenced by packages. |
| `translation_namespaces` | Text namespaces installed by templates and artifacts. |
| `translation_bundle_versions` | Immutable text bundles by namespace, locale and version. |
| `artifact_preferences` | Default language, theme, kit, density and runtime preferences per generated app. |

Existing objects such as `dynamic_services`, `dynamic_forms`, `flows`, `menus`, `permissions`, `roles` and
`schema_changes` remain part of the package graph.

## Required Admin Modules

1. **Template Library**: list installed and available templates.
2. **Template Exporter**: select objects, validate references and export package.
3. **Template Importer**: upload, inspect and dry-run a package.
4. **Template Installer**: resolve conflicts and apply safely.
5. **App Studio**: govern all apps, pages, navigation, app preferences and publication per tenant.
6. **Screen Designer**: create screens using registered components and layout contracts.
7. **Landing Builder**: create public pages, SEO metadata, external share links and CMS-friendly embeds.
8. **Component Registry**: manage reusable component metadata and kit support.
9. **Component Template Designer**: create reusable cards, modals, drawers and compound blocks from registered components.
10. **Artifact Builder**: generate deployable assets only after runtime contracts are stable.
11. **Text And Artifact Preferences**: manage default language, supported locales and runtime presentation preferences
   for generated apps.

## Chicle AI Role

Chicle AI should help with:

- creating forms, services, flows and screens from one request;
- detecting required tables and services;
- explaining package conflicts;
- proposing install decisions;
- generating test data;
- validating that a template is portable;
- documenting what a template installs.
- generating text keys, fallback copy and translation bundle drafts;
- configuring artifact preferences such as default locale, theme, kit and density.

Chicle AI must not install or overwrite templates without explicit user approval.

## MVP Roadmap

### Step 1: Component Registry

Create the registry that maps safe `componentKey` values to reusable Admin/runtime components.

Status: implemented as the current screen component catalog foundation.

### Step 2: Dynamic Screens

Create `dynamic_screens` and `dynamic_screen_versions`, plus a basic runtime renderer using existing components.

Status: implemented as tenant-scoped screens owned by apps, with keys unique by `tenantId + appId + key`.

### Step 3: Screen Designer V1

Create a guided screen designer without requiring drag/drop first. Use sections, rows, columns and registered
components. GridStack can be added later as a better canvas.

Status: implemented as the App Studio V2 foundation in `/apps`: app portfolio, selected app workspace, pages,
navigation, security, preview, publish/package JSON and trash.

### Step 4: Template Package Export

Export selected app objects and dependencies into a portable JSON package.

### Step 5: Template Package Import

Validate and preview a package before install.

### Step 6: Template Installer

Apply package objects to a tenant with dry-run, conflict handling, trash-aware restore and audit.

### Step 7: Artifact Builder

Generate deployable artifacts and environment-specific files. LiquidJS can enter here if it adds value.

## Definition Of Done

The App Factory is MVP-ready when:

- a user can create a small app with tables, services, forms, screens and menus;
- the app can be exported as a package;
- the package can be imported into a fresh tenant;
- conflicts are shown before install;
- secrets are never exported;
- installed objects are versioned and auditable;
- the app renders in Admin/web/mobile preview;
- the package includes tests and documentation;
- Chicle AI can explain and assist the process using the same contracts.
