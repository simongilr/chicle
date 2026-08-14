# Declarative Component Migration Roadmap

This document consolidates the migration plan for moving Chicle Admin, App Studio and generated apps toward the
declarative component architecture defined in `docs/declarative-component-architecture.md`.

It does not replace the architecture documents. It is the execution plan: scope, phases, progress percentages,
persistence rules, runtime update rules, offline behavior and acceptance gates.

## Canonical Inputs

This roadmap depends on these documents:

| Document                                     | Responsibility                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `docs/declarative-component-architecture.md` | Common component object, component keys, adapters, props, events, bindings and permissions.         |
| `docs/dynamic-app-runtime-architecture.md`   | App manifest, runtime cache, offline queue, app shell boot sequence and published screen execution. |
| `docs/screen-app-designer-architecture.md`   | App Studio, screen ownership, routes, navigation, page authoring and publishing.                    |
| `docs/app-template-factory-architecture.md`  | Export/import packages for apps, screens, forms, services, flows, texts, themes and permissions.    |
| `docs/ui-components.md`                      | Component catalog rules and how reusable components must be invoked.                                |
| `docs/admin-kit-transformation-audit.md`     | Current Admin page audit and multi-kit transformation gaps.                                         |
| `docs/ui-component-inventory.md`             | Current reusable component inventory and missing authoring components.                              |

## Current Baseline

These percentages are implementation estimates, not marketing numbers. They should be updated after every migration
round.

| Area                                   | Current | Target | Notes                                                                                                                      |
| -------------------------------------- | ------: | -----: | -------------------------------------------------------------------------------------------------------------------------- |
| Structural Admin reuse                 |     92% |   100% | Shared shells, navigation, page layout and catalog structures are broadly adopted.                                         |
| Multi-kit visual transformation        |     91% |   100% | Global kit bridge and core adapters work; remaining page-local controls must move to real adapters.                        |
| Component catalog coverage             |     96% |   100% | Shared components, Ionic-backed standard components and the current renderable declarative set are cataloged.              |
| Declarative component contract         |     97% |   100% | Common object, backend validation, frontend types, action checks, nested action checks, bindings and state definitions exist. |
| Central declarative renderer           |     96% |   100% | Renderer supports primitives, app blocks, layout, navigation, feedback, data display, prop bindings, permissions and action execution. |
| Persistent component registry          |     70% |   100% | DB tables, migration, seed sync and secured registry endpoint exist; template/admin CRUD is pending.                       |
| Admin migration to declarative objects |     28% |   100% | Admin remains reusable-component based; C-Declarativos has a dedicated page with action telemetry and validation.          |
| Generated app runtime integration      |     45% |   100% | App-oriented components render in the shared renderer; App Studio still must consume them as the default canvas contract.   |
| Offline component manifest             |     22% |   100% | Offline status and queue actions exist; generic manifest cache and sync processor are pending.                             |
| AI object authoring                    |     38% |   100% | AI creates services, forms and flows; component/app authoring must become registry-driven.                                 |

## Percent Calculation Rules

Use these rules to keep progress honest:

| Percentage | Meaning                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| 0%         | Not implemented. Architecture may exist, but there is no usable code path.                                |
| 25%        | Initial code exists, but it is not the default path and has limited tests.                                |
| 50%        | Usable in one real page or one runtime path with focused validation.                                      |
| 75%        | Reused by multiple pages or runtime paths, with visible catalog examples and basic tests.                 |
| 90%        | Default path for new work, with known edge cases documented.                                              |
| 100%       | Default and audited path, covered by tests, documented, visible in the catalog and safe for AI authoring. |

## Registered Versus Renderable Components

The declarative registry can contain more components than the central renderer can paint today. This is intentional:
backend validation, App Studio planning and AI authoring need to know planned components, but runtime must only execute
components with real adapters.

| Component Key       | Backend Registry | Central Renderer | Action Events | Current Use                                             |
| ------------------- | ---------------- | ---------------- | ------------- | ------------------------------------------------------- |
| `ui.button`         | Yes              | Yes              | `onClick`     | Safe for current visual drafts and runtime lab.         |
| `form.field`        | Yes              | Yes              | `valueChange` | Safe for current visual drafts and runtime lab.         |
| `ui.card`           | Yes              | Yes              | No direct     | Safe as a container for child components.               |
| `layout.stack`      | Yes              | Yes              | No direct     | Safe as a child layout container.                       |
| `layout.grid`       | Yes              | Yes              | No direct     | Safe as a responsive layout container.                  |
| `feedback.alert`    | Yes              | Yes              | No direct     | Safe as inline feedback.                                |
| `feedback.toast`    | Yes              | Yes              | No direct     | Safe as controlled inline toast preview.                |
| `feedback.loading`  | Yes              | Yes              | No direct     | Safe as loading feedback.                               |
| `feedback.skeleton` | Yes              | Yes              | No direct     | Safe as placeholder feedback.                           |
| `nav.menu`          | Yes              | Yes              | `onNavigate`  | Safe for route and menu drafts.                         |
| `nav.tabs`          | Yes              | Yes              | `onNavigate`  | Safe for tab-like route drafts.                         |
| `nav.toolbar`       | Yes              | Yes              | `onClick`     | Safe for header commands.                               |
| `data.table`        | Yes              | Yes              | No direct     | Safe for bound rows and columns.                        |
| `data.list`         | Yes              | Yes              | No direct     | Safe for bound lists.                                   |
| `data.detail`       | Yes              | Yes              | No direct     | Safe for field/value summaries.                         |
| `data.metric_strip` | Yes              | Yes              | No direct     | Safe for dashboards and summary strips.                  |
| `ui.badge`          | Yes              | Yes              | No direct     | Safe for status labels and metadata.                     |
| `ui.metric_card`    | Yes              | Yes              | No direct     | Safe for KPI cards.                                      |
| `ui.action_group`   | Yes              | Yes              | `onClick`     | Safe for grouped commands with nested actions.           |
| `layout.region`     | Yes              | Yes              | No direct     | Safe for titled screen sections.                         |
| `media.gallery`     | Yes              | Yes              | No direct     | Safe as preview gallery; production file policies pending. |
| `overlay.modal`     | Yes              | Yes              | `onClose`     | Safe as inline modal preview; shell overlay ownership pending. |
| `auth.login`        | Yes              | Yes              | `onSubmit`    | Safe as login block preview; production auth binding pending. |
| `app.shell`         | Yes              | Yes              | No direct     | Safe as generated app shell preview.                     |
| `app.home_menu`     | Yes              | Yes              | `onNavigate`  | Safe for home navigation drafts.                         |
| `form.runtime`      | Yes              | Yes              | `onSubmit`    | Safe for embedded form drafts.                           |
| `service.result`    | Yes              | Yes              | No direct     | Safe for dynamic service response display.               |
| `flow.trigger_button` | Yes            | Yes              | `onClick`     | Safe for flow trigger drafts and safe preview actions.    |
| `record.list`       | Yes              | Yes              | `onSelect`    | Safe for record list display; selection inspector pending. |
| `record.detail`     | Yes              | Yes              | No direct     | Safe for selected record details.                         |
| `nav.side_menu`     | Yes              | Yes              | `onNavigate`  | Safe for app side navigation drafts.                     |
| `nav.bottom_tabs`   | Yes              | Yes              | `onNavigate`  | Safe for mobile bottom navigation drafts.                |
| `chart.panel`       | Yes              | Yes              | No direct     | Safe for simple metric charts.                            |
| `map.view`          | Yes              | Yes              | No direct     | Safe as map/pin preview; GPS provider integration pending. |
| `status.offline`    | Yes              | Yes              | No direct     | Safe for offline readiness display.                       |
| `status.sync_queue` | Yes              | Yes              | No direct     | Safe for sync queue display.                              |

Rule: App Studio and Chicle AI may use the renderable set for automatic drafts. Components outside this table require
explicit planned-work wording until their adapter, permissions and preview fixture exist.

## Core Migration Principle

Not every component must be persisted in the database on day one, but every component must be representable as a
declarative object.

The Angular, Ionic, PrimeNG, Material or Bootstrap implementation stays underneath. Chicle stores and exchanges:

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_component",
  "componentKey": "ui.button",
  "props": {},
  "layout": {},
  "data": {},
  "events": {},
  "actions": [],
  "permissions": {},
  "i18n": {},
  "state": {},
  "presentation": {},
  "children": []
}
```

Technical selectors such as `app-ui-kit-button` or `ion-alert` are adapter implementation details. Tenant JSON, AI
drafts and template packages use `componentKey`.

## Persistence Model

The migration must introduce persistence in layers. Runtime apps should only consume published versions.

| Object                                | Scope              | Purpose                                                                                                     |
| ------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `component_definitions`               | global             | Registered component keys, schema versions, default props, event names, allowed children and documentation. |
| `component_adapters`                  | global             | Kit support matrix: PrimeNG, Ionic, Material, Bootstrap and native fallback status.                         |
| `dynamic_component_templates`         | tenant             | Reusable composed components such as custom modals, cards with forms or branded menu blocks.                |
| `dynamic_component_template_versions` | tenant             | Published reusable component templates.                                                                     |
| `screen_component_instances`          | tenant/app/screen  | Component instances placed on a screen: layout, props, data, actions, permissions and text keys.            |
| `screen_component_instance_versions`  | tenant/app/screen  | Frozen published instances for runtime manifests.                                                           |
| `dynamic_app_manifests`               | tenant/app/version | Published app graph consumed by web, mobile and desktop runtime artifacts.                                  |

Drafts are editable. Published versions are immutable. Trash keeps keys available for new objects and restoration must
handle conflicts explicitly.

## Update Model

Admin and App Studio must not edit runtime objects directly. They use kernel commands:

| Command                   | Responsibility                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `createComponentInstance` | Adds a registered component to a screen draft.                                       |
| `updateComponentProps`    | Updates display, presentation or text references.                                    |
| `moveComponentInstance`   | Changes region, order, responsive layout and parent/child ownership.                 |
| `bindComponentData`       | Connects the component to forms, services, flows, tables, app state or route params. |
| `bindComponentAction`     | Connects events to declarative actions such as navigation or service execution.      |
| `setComponentPermissions` | Applies visibility, enabled and execute policies.                                    |
| `publishScreenVersion`    | Freezes a screen draft and invalidates the app manifest cache.                       |
| `publishAppVersion`       | Freezes the app graph used by runtime shells.                                        |

Each command validates tenant scope, permissions, schema version, optimistic locking and allowed component capabilities.
Each command also emits audit/events such as `component.updated`, `screen.draft.updated`, `screen.published` and
`app.manifest.invalidated`.

## Browser And Offline Model

Runtime artifacts must not fetch every component individually. They boot from a published manifest:

```txt
tenant + appKey + target + route + manifestVersion/hash
```

The manifest includes:

- app metadata;
- routes and navigation;
- screens;
- component instances;
- component definitions needed by the app;
- text bundle references;
- theme and presentation tokens;
- permissions needed for UI filtering;
- allowed services and flows;
- offline policy and sync queue rules.

Cache rules:

| Runtime           | Storage                                | Rule                                                                       |
| ----------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Admin web         | IndexedDB plus small local preferences | Cache latest loaded docs, text bundles, preferences and authoring state.   |
| Generated web app | IndexedDB                              | Cache published manifest, screens, texts, theme and public runtime config. |
| Ionic mobile app  | IndexedDB first, SQLite later          | Cache manifest, offline forms, pending actions and sync queue.             |
| Desktop artifact  | Local storage plus IndexedDB           | Same manifest model as web, with desktop packaging rules.                  |

Offline rendering uses the latest valid published manifest. Drafts are never executed as offline production runtime.

## Migration Phases

### Phase 0 - Contract And Persistence

Progress: 94%.

Deliverables:

- finalize the common component object;
- define database tables for definitions, adapters, templates, instances and manifest snapshots;
- define draft, publish, trash and restore rules;
- define migration scripts and seed data for global component definitions;
- document cache invalidation and optimistic locking.

Acceptance gate:

- a component definition can be represented in code and in a future DB row without losing fields;
- seed requirements are listed in the platform validator backlog;
- docs and examples use `componentKey`, not framework selectors.

Implemented:

- `component_definitions` for global component keys, schemas, defaults and docs;
- `component_adapters` for kit support status and technical selectors;
- `dynamic_component_templates` and `dynamic_component_template_versions` for tenant-owned composed components;
- `20260809120000-create-declarative-components.ts` migration;
- seed sync for initial primitives and runtime blocks;
- `/components/registry` and `/components/validate` secured by `components.read`;
- RBAC seed entries for `components.read` and `components.manage`;
- backend validation for actions embedded in component props, such as toolbar actions, action groups and modal actions.

Pending:

- Admin CRUD for component definitions and tenant-owned component templates;
- publish/trash/restore workflow for component templates;
- manifest snapshot persistence for generated apps.

### Phase 1 - Central Declarative Renderer

Progress: 96%.

Deliverables:

- create a renderer that receives a component object and resolves:
  - Angular component implementation;
  - active visual kit;
  - props;
  - data bindings;
  - actions;
  - permissions;
  - children;
  - preview/runtime mode;
- share the same renderer between App Studio preview and generated runtime;
- reject unknown component keys.

Acceptance gate:

- the renderer can display at least `ui.button`, `ui.card`, `form.field`, `nav.menu`, `data.list` and `feedback.alert`;
- the same object renders in preview and runtime mode;
- unsupported adapters show a controlled fallback state.

Implemented:

- frontend contract types in `engine/components/declarative-component.types.ts`;
- local registry bridge in `engine/components/declarative-component-registry.service.ts`;
- standalone `app-declarative-component-renderer`;
- supported render set: `ui.button`, `form.field`, `ui.card`, `ui.badge`, `ui.metric_card`, `ui.action_group`,
  `layout.stack`, `layout.grid`, `layout.region`, `feedback.alert`, `feedback.toast`, `feedback.loading`,
  `feedback.skeleton`, `nav.menu`, `nav.tabs`, `nav.toolbar`, `nav.side_menu`, `nav.bottom_tabs`, `data.table`,
  `data.list`, `data.detail`, `data.metric_strip`, `record.list`, `record.detail`, `form.runtime`, `service.result`,
  `flow.trigger_button`, `media.gallery`, `overlay.modal`, `auth.login`, `app.shell`, `app.home_menu`, `chart.panel`,
  `map.view`, `status.offline` and `status.sync_queue`;
- controlled fallback for registered but not-yet-rendered components;
- dedicated `/components/declarativos` lab that renders a real object through the renderer;
- the lab now exposes navigation, input, grouped actions, service result, form runtime, record list/detail, chart,
  map, gallery, modal, login and offline/sync examples from one editable contract.

Pending:

- app runtime integration with published screen manifests;
- stronger visual fixtures for every supported kit.

### Phase 2 - UI Primitives

Progress: 96%.

Deliverables:

- migrate and validate:
  - button;
  - input;
  - select;
  - card;
  - badge;
  - tabs;
  - modal;
  - alert;
  - table;
  - list item;
  - toolbar;
  - menu item;
- keep Ionic selectors as technical implementation details while using canonical component keys;
- avoid duplicating components already covered by Chicle facades.

Acceptance gate:

- every primitive has catalog entry, preview fixture, props schema and adapter status;
- Ionic mode uses real Ionic components where the adapter is available;
- Material, PrimeNG, Bootstrap and native status are explicit.

Implemented:

- initial primitive seeds for `ui.button`, `form.field`, `ui.card`, `ui.badge`, `ui.metric_card`, `ui.action_group`,
  `layout.stack`, `layout.grid`, `layout.region`, `feedback.alert`, `feedback.toast`, `feedback.loading`,
  `feedback.skeleton`, `nav.menu`, `nav.tabs`, `nav.toolbar`, `data.table`, `data.list`, `data.detail` and
  `data.metric_strip`;
- legacy App Studio component catalog now recognizes the declarative primitive keys, so packages can validate them;
- canonical component keys remain separate from technical selectors such as `ion-button` or `mat-form-field`;
- renderable primitive adapters currently cover the listed primitive set in the backend registry and the frontend
  C-Declarativos lab.

Pending:

- preview fixtures that prove every available kit visually changes without breaking layout.

### Phase 3 - Actions, Bindings And Security

Progress: 95%.

Deliverables:

- standardize event/action contracts:
  - `navigate`;
  - `execute_service`;
  - `execute_flow`;
  - `submit_form`;
  - `open_modal`;
  - `show_message`;
  - `set_state`;
  - `refresh_data`;
  - `queue_offline`;
  - `emit_event`;
- standardize data sources:
  - static;
  - form state;
  - app state;
  - route params;
  - service result;
  - flow result;
  - record/table query;
  - text bundle;
- enforce UI, execute and server-side permission checks.

Acceptance gate:

- a component can navigate, execute a dynamic service and show a message through declarative events;
- server calls still validate tenant, role and permissions.

Implemented:

- frontend `DeclarativeBindingResolverService` resolves expressions from state, data, route, user, tenant and current
  value;
- frontend `DeclarativePermissionService` checks component and action permissions against context or current session;
- `ActionRunnerService` handles `navigate`, `execute_service`, `execute_flow`, `submit_form`, `open_modal`,
  `show_message`, `set_state`, `refresh_data`, `queue_offline` and `emit_event`;
- `ActionRunnerService` writes every action execution to the shared declarative action runtime history;
- `queue_offline` now uses the shared declarative offline queue instead of page-local storage code;
- `DeclarativeComponentRendererComponent` resolves bound props before rendering and can execute configured component
  events;
- the dedicated `/components/declarativos` page exposes a functional declarative lab that shows the contract JSON, real
  preview, backend validation, action history and offline queue;
- the Components page links to the dedicated declarative lab instead of embedding a heavy workspace inside the catalog;
- backend contract validation rejects unknown action types, missing required action keys, invalid permission arrays and
  unsafe binding strings;
- backend contract validation also checks nested action objects inside props, so toolbar/action-group/modal actions
  cannot bypass validation;
- the declarative component tables were applied to the local MariaDB database through TypeORM migrations.

Pending:

- richer server-side resource policy checks per action target;
- App Studio visual inspector for actions and bindings, tracked under Phase 6;
- offline sync processor for queued declarative actions, tracked under Phase 7;
- persisted server telemetry for production runtime execution, tracked under Phase 10.

### Phase 4 - Admin Components

Progress: 45%.

Deliverables:

- wrap and migrate:
  - `ModuleHeader`;
  - `AdminPanel`;
  - `AdminFilterBar`;
  - `AdminDataTable`;
  - `CatalogHeader`;
  - `CatalogItem`;
  - `DesignerWorkspace`;
  - `ProcessSteps`;
  - `StatusNotice`;
  - `PreviewViewport`;
  - JSON authoring panel;
  - test workbench;
  - version lifecycle panel.

Acceptance gate:

- reusable Admin components can be instantiated from declarative objects;
- existing Admin pages keep working while direct usage is gradually replaced;
- page-local clones are removed only after the shared component is stable.

Implemented:

- the catalog documents Admin-oriented reusable components with canonical `componentKey` values;
- C-Declarativos can render the Admin-style primitives used by many pages;
- direct Admin pages remain compatible while the declarative path matures.

Pending:

- replace page-local Admin compositions with persisted component objects route by route;
- add Admin CRUD for tenant-owned component templates;
- add visual regression checks for every Admin page under each kit.

### Phase 5 - Generated App Components

Progress: 52%.

Deliverables:

- create app-oriented declarative components:
  - login;
  - home menu;
  - form container;
  - dynamic form block;
  - service result block;
  - flow trigger button;
  - gallery;
  - record list;
  - detail view;
  - bottom tabs;
  - side menu;
  - modal shell;
  - offline status;
  - sync queue status.

Acceptance gate:

- App Studio can place these components on a screen;
- runtime preview renders real components, not guide cards;
- component actions and bindings are editable from the inspector.

Implemented:

- app-oriented renderable blocks now exist for login, home menu, dynamic form block, service result block, flow trigger,
  gallery, record list, record detail, bottom tabs, side menu, modal preview, offline status and sync queue status;
- these blocks are registered, cataloged and visible in the dedicated C-Declarativos lab.

Pending:

- make App Studio use these blocks as first-class palette items;
- connect production login, service, flow, media and offline policies to published app manifests.

### Phase 6 - Visual Designer

Progress: 40%.

Deliverables:

- App Studio creates component objects, not HTML;
- workspace supports:
  - component palette;
  - component tree;
  - visual canvas;
  - property inspector;
  - actions inspector;
  - binding inspector;
  - permissions inspector;
  - responsive preview;
  - save draft and publish;
- preview uses real runtime renderer.

Acceptance gate:

- users can add a menu, login, form block and action button to an app screen;
- users can configure width, region, order, route, permissions and action without editing code;
- screen JSON matches the published runtime contract.

Implemented:

- the visual designer architecture and C-Declarativos renderer now share the same object model;
- the renderer can be used as the App Studio preview engine for multiple app block families.

Pending:

- replace current App Studio guide cards with real renderer-backed canvas blocks;
- add component tree, binding inspector, action inspector, permissions inspector and responsive layout inspector.

### Phase 7 - Cache And Offline

Progress: 22%.

Deliverables:

- published app manifest endpoint;
- manifest hash/version negotiation;
- IndexedDB manifest cache;
- offline fallback to latest valid published version;
- offline queue action contract;
- cache invalidation after publish.

Acceptance gate:

- generated runtime can open a published app from cache;
- publishing a new app or screen version invalidates only the affected manifest;
- offline mode never executes drafts.

Implemented:

- `queue_offline` action stores work in the shared declarative offline queue;
- offline and sync queue status blocks render from the same component contract.

Pending:

- published manifest cache;
- durable IndexedDB sync processor;
- retry, conflict and idempotency rules for generated apps.

### Phase 8 - AI Authoring

Progress: 38%.

Deliverables:

- AI reads component registry and adapter status;
- AI generates valid component objects;
- AI edits existing objects instead of restarting from generic drafts;
- AI asks one missing decision at a time;
- AI proposes tests and preview fixtures;
- AI never stores raw framework selectors in tenant JSON.

Acceptance gate:

- prompt: "create an app with login, home and form menu" produces app, screens, navigation, components, actions, texts,
  permissions and tests as draft objects;
- prompt: "change this button to full width and green" edits the existing component object only.

### Phase 9 - Admin Migration

Progress: 12%.

Deliverables:

- migrate pages in risk order:
  1. Preferences and Components as references;
  2. Docs and Architecture;
  3. Confisys, Login and Setup;
  4. Database and Security;
  5. Services;
  6. Forms;
  7. Flows;
  8. App Studio;
- remove page-local controls only after equivalent shared components exist;
- keep all routes usable during migration.

Acceptance gate:

- structural reuse reaches 100%;
- multi-kit transformation reaches 100%;
- every Admin route can be audited against the component registry.

### Phase 10 - Validators

Progress: 10%.

Deliverables:

- validator for:
  - components without registry entries;
  - raw selectors stored in JSON;
  - text literals without text keys;
  - missing seeds;
  - missing adapter status;
  - missing preview fixtures;
  - invalid actions;
  - invalid bindings;
  - missing permissions;
  - duplicated UI code;
  - obsolete or broken components;
  - test coverage gaps;
  - offline/cache contract gaps.

Acceptance gate:

- validator report can show current percentages and blockers;
- migration percentages are generated from checks instead of manual estimates.

## Recommended Execution Order

Start with:

1. Phase 0 - Contract And Persistence.
2. Phase 1 - Central Declarative Renderer.
3. Phase 2 - UI Primitives, limited to button, card, input and select first.

Reason:

- persistence prevents runtime drift;
- the renderer prevents each designer from inventing its own behavior;
- primitives make every later page and generated app look consistent.

After that:

4. Phase 3 - Actions, Bindings And Security.
5. Phase 6 - Visual Designer.
6. Phase 5 - Generated App Components.
7. Phase 7 - Cache And Offline.
8. Phase 8 - AI Authoring.
9. Phase 4 and Phase 9 - Admin migration by page.
10. Phase 10 - Validators, then keep validators as continuous gates.

## Completion Definition

This migration is complete when:

- every supported component has a registered `componentKey`;
- every component has a props schema, preview fixture and adapter matrix;
- every Admin page uses shared components or declarative instances;
- App Studio can create, edit, preview, publish and export screens using component objects;
- generated apps can render published manifests in web, Ionic mobile and desktop targets;
- runtime can cache and render the latest published manifest offline;
- AI can generate and edit objects safely without inventing selectors or unsupported actions;
- validators can calculate reuse, kit coverage, text coverage, tests, duplication and security gaps.
