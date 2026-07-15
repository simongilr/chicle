# Chicle Engine Architecture

## Declarative contract documentation

Configuration objects are part of the public architecture and stay documented beside the implementation:

- `docs/platform-architecture.md` defines the platform-level architecture, naming and evolution path.
- `docs/backup-worker-architecture.md` defines background worker and backup evolution.
- `docs/ai-authoring-guide.md` is the entry point for people and AI.
- `docs/ai-ready-authoring.md` defines JSON-only endpoints and sequences for future assistants.
- `docs/ai-rag-architecture.md` defines the versioned knowledge layer for the future AI Manager.
- `docs/ai-local-ollama.md` defines the first local AI provider stack.
- `docs/dynamic-services-contract.md` defines executable service objects.
- `docs/flow-contract.md` defines flow authoring and runtime objects.
- `docs/dynamic-forms-contract.md` defines tenant-owned dynamic form documents, steps, fields, actions and responsive
  behavior.
- `docs/examples/*.json` contains strict machine-readable examples.
- `docs/ui-components.md` and `apps/app/src/app/shared/ui-component-catalog.ts` define the visual reuse contract.
- `docs/ui-presentation-architecture.md` defines adaptive PrimeNG/Ionic rendering and future kit adapters.
- `docs/formly-architecture.md` defines declarative form orchestration and the multikit Formly bridge.
- `docs/angular-20-migration-roadmap.md` defines the audited dependency matrix, safety gates and phased Angular 20 migration.
- `docs/angular-20-migration-report.md` records the installed Angular 20 matrix and final verification results.

When a backend contract or visual component changes, its documentation and canonical example change in the same work.

## Repository

```txt
chicle-engine/
  apps/
    api/
    app/
  packages/
    shared/
  infra/
    docker/
  scripts/
    templates/
  docs/
```

## API

The API is a NestJS application that owns tenant scoping, authentication, configuration, dynamic form definitions, action definitions, records, files and sync contracts.

```txt
apps/api/src/
  config/
  database/
  common/
  modules/
    setup/
    auth/
    tenants/
    users/
    roles/
    permissions/
    settings/
    menus/
    dynamic-forms/
    workflows/
    actions/
    records/
    files/
    devices/
    sync/
    audit/
  templates/
```

## App

The app is one Angular application with Ionic and PrimeNG adapters. Declarative screens select a presentation profile,
not library-specific selectors. The initial adaptive renderer uses PrimeNG for desktop, Ionic for mobile/native and
native controls as a fallback. Business screens are rendered from configuration.

```txt
apps/app/src/app/
  core/
    navigation/
    ui/
  engine/
  capabilities/
  shared/
    main-nav/
  pages/
```

## Frontend Components

Shared UI must live in reusable components instead of being copied into pages. The main navigation starts with `app-main-nav`, which reads menu options from the API when a session exists and falls back to local defaults while the database-driven menu is not available.

Menus are tenant data. Default menu rows are seeded during first setup, then `/api/menus/current` returns only the options visible for the current user's permissions.

Navigation uses three product groups: Principal for daily entry points, Construcción for Services, Flows, Forms,
Screens, Templates and Automations, and Administración for configuration, database and security.

The maintained component catalog, maturity map and extraction backlog live in
`docs/ui-component-inventory.md`. Dynamic Forms and Screen Designer must build the P0 component kit there before adding
new authoring behavior directly to page containers.

## Dynamic Runtime

The engine renders:

- Menus
- Forms
- Fields
- Views
- Services
- Actions
- Workflows

The app does not contain pages named after business operations. It contains generic pages such as dynamic form, record list and record detail.

Dynamic forms use a Chicle-owned JSON contract documented in `docs/dynamic-forms-contract.md`. The contract keeps
`steps` as the top-level user journey, uses JSON-Schema-style validation, stores UI behavior as declarative metadata
and delegates Angular rendering to Formly through the Chicle multikit adapters. One published form key must render on
web, mobile web and native mobile without storing PrimeNG or Ionic selectors in the database.

Form definitions and submitted business data are separate. `dynamic_forms` stores the form recipe; submissions go
through the form runtime and then use one of the approved persistence modes: `records`, a published dynamic service, a
published flow or an offline queue. A field can call services for options, validation, default values and enrichment,
but the browser never writes arbitrary tables directly. `dynamic_form_bindings` records every field/service/flow
dependency and pins target versions when a form is published.

## Database Designer Boundary

The database viewer and the database designer have different responsibilities.

- The viewer may display approved core tables according to the current user's permissions.
- The designer may only create, alter or drop schema for tables whose names start with `custom_`.
- Core tables such as `users`, `roles`, `permissions`, `tenants`, `dynamic_forms`, `dynamic_services`, `flows` and
  `schema_changes` are not editable at the schema level from the visual designer.
- Core behavior must be changed through domain modules, typed services and reviewed TypeORM migrations.
- Dynamic forms or Chicle AI may request schema changes only through the `apply_schema_change` contract and only for
  `custom_*` tables. They must never generate raw SQL or schema mutations against core tables.

This boundary keeps authentication, tenant scope, platform metadata and migration history stable while still allowing
tenant-specific or prototype data structures to evolve from the UI.

Dynamic services are tenant-owned executable objects stored in the database. A service is created once, versioned, published and then consumed by key from the frontend, workflows or actions. The frontend calls a stable contract instead of creating one HTTP method per business service:

```ts
dynamicServices.execute("buscar_usuario", { name: "simon" });
```

The API resolves the published definition behind `POST /api/dynamic-services/by-key/:serviceKey/execute`, applies tenant scope and permissions, runs the service, and records the execution in `dynamic_service_runs`.

Frontend consumers discover executable services through `GET /api/dynamic-services/available`. The catalog and execution endpoint apply both `services.execute` and per-role resource policy. The reusable Angular client exposes `available()` and `execute(key, context)`, so publishing a service makes it consumable without adding frontend API code.

The same contract must survive future capabilities such as guided joins, unions, read models, SOAP, WebSocket, webhooks, async queues and response mapping.

## Chicle Flow Engine

Flows use declarative workflow orchestration. The database stores tenant-owned recipes, while the API owns execution, permissions, limits and traceability.

- `flows` stores editable process metadata.
- `flow_steps` stores draft and versioned steps.
- `flow_versions` stores immutable snapshots.
- `flow_templates` stores reusable system and tenant authoring documents.
- `flow_runs` and `flow_step_runs` store published execution history.
- `POST /api/flows/:flowId/preview` executes a draft in memory, optionally through one step.
- `POST /api/flows/by-key/:flowKey/execute` executes the published version.
- `GET /api/flows/available` exposes published flows allowed for the current user's roles.

`DynamicFlowClientService` mirrors the dynamic-service client with `available()` and `execute(key, input)`. A screen builder can therefore bind a component to a published flow key without generating a new Angular service. Declarative actions use `execute_flow` plus `flowKey` and `payloadMap`, so forms and future screen components consume a published flow without adding Angular API code.

Role resource authorization uses `role_resource_policies` and `role_resource_grants`. Each role selects `all`, `selected` or `none` independently for dynamic services and flows. General permissions remain mandatory. Multiple roles use additive RBAC semantics, `owner` always retains access, and internal service calls made by an authorized flow do not grant direct access to those services.

Decisions and formulas use JSON Logic as a serializable abstract syntax tree. Validations use a controlled operator catalog. The runtime never evaluates JavaScript stored in the database.

The UI follows four explicit stages: define, build, test and publish. Start and end nodes are synthesized when omitted, so common processes do not require technical plumbing.

Flow authoring separates three contracts:

- Entry determines who starts the flow: direct API/front call, manual action, signed webhook, event, form submit or schedule.
- The first persisted step determines what the process does first. It may call a dynamic service, validate, calculate or branch; it is not the trigger.
- A `response` step defines the output returned under the run `output` to the calling front or integration.

The Define stage exposes a versioned authoring JSON document from the beginning. `PUT /api/flows/:flowId/definition` validates keys, routes and the response target, then replaces flow metadata and draft steps in one database transaction. Webhook secrets are deliberately excluded from this document and remain in the protected trigger workflow.

Operational designers share the same reusable interface language:

- `ProcessStepsComponent` renders progress, readiness and navigation for both Dynamic Services and Flows.
- `WorkflowGuideComponent` explains the current objective, the blocking condition and the next recommended action.
- `DesignerWorkspaceComponent` owns the responsive catalog-and-workspace shell used by both designers, including the mobile collapse behavior.
- `ModuleHeaderComponent`, `CatalogHeaderComponent`, `CatalogItemComponent` and `SectionHeaderComponent` keep module titles, catalogs and workspace sections identical across Database, Dynamic Services and Flows.
- `StatusNoticeComponent` centralizes empty, information, success, warning and error states.
- `ContextAssistantComponent` gives each authoring block a purpose, business example, readiness state and next action without nesting another full workflow guide.
- `SegmentedControlComponent` provides the same compact view selector for Database modes and Flow map/list views.
- Active, trash and new states use the same navigation contract. A trashed object opens a restore-only workspace instead of its editor.
- The guided configuration is always presented before its generated JSON. The complete flow JSON and each step JSON remain visible for review, while manual editing is an explicit advanced action.
- Frontend validation mirrors publish-time constraints so missing services, broken routes, subflows and event keys are visible before version creation.

Flow Designer V3 treats data contracts as first-class configuration:

- Flow input fields live in `flows.metadata.inputFields` and become a JSON-like `inputSchema` inside each immutable version.
- The API validates required values and primitive types before preview or published execution.
- The frontend infers service inputs from `{{input.*}}` references and internal filters.
- Previous outputs are presented as named options instead of requiring users to type template paths.
- Dynamic service `responseMap` aliases are materialized under `response.mapped`.
- Preview results enrich the mapper with fields observed during a real test.

The visual timeline and data mapper are standalone Angular components. Parallel branches, loops, subflows, delays and durable events use the same persisted step contract shown by the designer.

Flow Assistant V3.1 adds a progressive authoring loop:

1. A starter template creates a complete draft, including the final response.
2. Service templates require published services before creation.
3. Each step can be saved and previewed immediately.
4. A successful preview keeps observed outputs available to the next step.
5. Test inputs render as typed form controls, while raw JSON remains advanced mode.
6. The container smoke test builds temporary internal services, chains them in a flow, previews, publishes, executes and cleans up.

Each step follows one vertical authoring sequence: purpose, operation configuration, data mapping when needed, execution routes, generated JSON, then save and test. The step editor deliberately avoids nesting another workflow assistant inside the top-level assistant.

Flow Designer V3.2 makes execution routing and regression tests explicit:

- The graph view renders every draft step and labels its outgoing routes: success, error, timeout, true and false.
- A blank connection means "continue by visual order"; an explicit connection stores the target step key.
- Starter flows can chain any number of published services. The two-service wizard is no longer a structural limit.
- `flow_test_cases` persists draft or published targets, input fixtures, expected status, partial expected output and path assertions.
- A test suite executes every active case and records the latest result on each case.
- Timeout routes are honored by both draft preview and published execution.
- The Docker smoke test chains three services and validates draft preview, assertions, test suite, publication and execution.

Flow Runtime V4 adds the asynchronous execution layer around the deterministic runner:

- `flow_triggers` activates a published flow manually, by signed HTTP hook, record event, form submit or interval schedule.
- `flow_jobs` is a durable MariaDB queue. Workers claim jobs conditionally, recover stale locks and retry with bounded exponential backoff.
- `flow_outbox_events` implements the transactional outbox pattern. Records and their events are persisted in the same transaction.
- Socket.IO and the authenticated SSE endpoint publish live progress; the database remains the source of truth.
- Idempotency keys prevent duplicate jobs and duplicate outbox events.
- Published runs support parallel service branches, bounded `foreach`, nested published subflows, short controlled delays and durable event emission.
- Successful service steps may register a compensation service. If a later step fails, compensations execute in reverse order and are included in the run error.

The internal worker is suitable for the initial deployment and multiple API replicas coordinate through database claims. A dedicated worker process can later reuse the same queue contract without changing flow definitions.

Flow Lifecycle V1 closes the operational authoring loop:

- system templates are seeded into `flow_templates`; tenant admins can save a current draft as a reusable template;
- instantiating or duplicating creates a new independent draft and never shares versions or publication state;
- immutable versions can be compared by path and restored into the editable draft without changing the currently published version;
- `GET /api/flows/:flowId/observability` aggregates status, success rate, average/P50/P95 latency, trigger counts, step failure rates and recent errors;
- observability defaults to a bounded sample and accepts status, trigger and date filters, avoiding unbounded history scans;
- the Docker smoke test validates templates, duplication, version comparison/restoration, concurrent execution and observability in addition to runtime behavior.

### Flow capability boundary

Flow Engine currently owns orchestration:

- validation, decisions, formulas and caller responses;
- sequential services, parallel branches, bounded `foreach` and published subflows;
- short delays, durable event emission, retries, timeout routes and compensation;
- direct, manual, signed HTTP, form, record-event and schedule entry channels;
- draft previews, persisted regression cases, immutable versions and execution history.

Dynamic Services own technical operations:

- reads and writes against internal tables and records;
- REST request/response mapping and future SOAP, WebSocket or connector implementations;
- integration credentials, secrets and transport-specific policies.

The current engine does not claim support for human tasks, multi-day durable waits, arbitrary `while` loops, free-form code, BPMN import/export or distributed ACID transactions. Long-running orchestration will require resumable workflow state; cross-system consistency currently uses idempotency, retries and compensation.

## Declarative Actions

Supported action types start small:

- `create_record`
- `http_request`
- `upload_files`
- `show_modal`
- `navigate`
- `queue_offline`
- `capability`
- `get_gps`
- `execute_flow`

No arbitrary code is executed from the database.

## Tenant Scope

Every operational table carries `tenant_id`. Requests are scoped by authenticated tenant.

## Storage

V1 stores files on local disk through `StorageService`. Future drivers such as MinIO/S3 must not change the app contract.
