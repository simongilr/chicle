# App Template Factory Architecture

Chicle App Factory is the layer that turns configured products into reusable, installable and exportable application
templates. It is the path to build business apps without copying code for every customer.

The MVP does not require GridStack or LiquidJS to be useful. The foundation is a portable template package made of
validated Chicle contracts. GridStack and LiquidJS are optional adapters that can be added when the visual designer and
artifact generator need them.

## Core Principle

Store product intent as Chicle contracts, not as generated source code.

Allowed in a template:

- manifest;
- metadata;
- tables and controlled schema changes;
- dynamic services;
- dynamic forms;
- flows;
- screens;
- menus;
- roles, permissions and resource policies;
- themes and presentation profiles;
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

The first usable App Factory does four things:

1. **Package** an app/template from existing Chicle objects.
2. **Export** that package as a portable file.
3. **Import** a package into another Chicle installation.
4. **Install** it safely into a tenant with preview, validation and conflict handling.

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
    "schemaChanges": [],
    "services": [],
    "forms": [],
    "flows": [],
    "screens": [],
    "menus": [],
    "permissions": [],
    "roles": [],
    "resourcePolicies": [],
    "themes": [],
    "assets": [],
    "docs": [],
    "tests": []
  },
  "install": {
    "mode": "tenant",
    "conflictPolicy": "ask",
    "prefix": "",
    "dryRunRequired": true
  }
}
```

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
must be included when the app needs them to operate.

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
- menus;
- modals/drawers;
- permissions;
- layout by breakpoint.

The screen designer can later use GridStack for drag and resize, but the runtime should use the Chicle screen contract.
That keeps templates portable and avoids locking Chicle to one grid library.

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

## Library Strategy

| Library | MVP role | Later role |
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
| `dynamic_screens` | Screen definitions. |
| `dynamic_screen_versions` | Published screen versions. |
| `template_assets` | Images, icons, files and docs referenced by packages. |

Existing objects such as `dynamic_services`, `dynamic_forms`, `flows`, `menus`, `permissions`, `roles` and
`schema_changes` remain part of the package graph.

## Required Admin Modules

1. **Template Library**: list installed and available templates.
2. **Template Exporter**: select objects, validate references and export package.
3. **Template Importer**: upload, inspect and dry-run a package.
4. **Template Installer**: resolve conflicts and apply safely.
5. **Screen Designer**: create screens using registered components and layout contracts.
6. **Component Registry**: manage reusable component metadata and kit support.
7. **Artifact Builder**: generate deployable assets only after runtime contracts are stable.

## Chicle AI Role

Chicle AI should help with:

- creating forms, services, flows and screens from one request;
- detecting required tables and services;
- explaining package conflicts;
- proposing install decisions;
- generating test data;
- validating that a template is portable;
- documenting what a template installs.

Chicle AI must not install or overwrite templates without explicit user approval.

## MVP Roadmap

### Step 1: Component Registry

Create the registry that maps safe `componentKey` values to reusable Admin/runtime components.

### Step 2: Dynamic Screens

Create `dynamic_screens` and `dynamic_screen_versions`, plus a basic runtime renderer using existing components.

### Step 3: Screen Designer V1

Create a guided screen designer without requiring drag/drop first. Use sections, rows, columns and registered
components. GridStack can be added later as a better canvas.

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

