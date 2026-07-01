# Chicle Engine Architecture

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

The app is one Ionic Angular application. It uses Ionic for mobile/field experiences and PrimeNG for desktop/admin experiences. Business screens are rendered from configuration.

```txt
apps/app/src/app/
  core/
    navigation/
  engine/
  capabilities/
  shared/
    main-nav/
  pages/
```

## Frontend Components

Shared UI must live in reusable components instead of being copied into pages. The main navigation starts with `app-main-nav`, which reads menu options from the API when a session exists and falls back to local defaults while the database-driven menu is not available.

Menus are tenant data. Default menu rows are seeded during first setup, then `/api/menus/current` returns only the options visible for the current user's permissions.

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

Dynamic services are tenant-owned executable objects stored in the database. A service is created once, versioned, published and then consumed by key from the frontend, workflows or actions. The frontend calls a stable contract instead of creating one HTTP method per business service:

```ts
dynamicServices.execute('buscar_usuario', { name: 'simon' });
```

The API resolves the published definition behind `POST /api/dynamic-services/by-key/:serviceKey/execute`, applies tenant scope and permissions, runs the service, and records the execution in `dynamic_service_runs`.

The same contract must survive future capabilities such as guided joins, unions, read models, SOAP, WebSocket, webhooks, async queues and response mapping.

## Chicle Flow Engine

Flows use declarative workflow orchestration. The database stores tenant-owned recipes, while the API owns execution, permissions, limits and traceability.

- `flows` stores editable process metadata.
- `flow_steps` stores draft and versioned steps.
- `flow_versions` stores immutable snapshots.
- `flow_runs` and `flow_step_runs` store published execution history.
- `POST /api/flows/:flowId/preview` executes a draft in memory, optionally through one step.
- `POST /api/flows/by-key/:flowKey/execute` executes the published version.

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
- `SegmentedControlComponent` provides the same compact view selector for Database modes and Flow map/list views.
- Active, trash and new states use the same navigation contract. A trashed object opens a restore-only workspace instead of its editor.
- Advanced JSON and reusable test suites stay behind progressive disclosure; the first path remains guided and visual.
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

Each step has its own authoring sequence: purpose, operation configuration, data mapping when needed, execution routes, then save and test. This nested guide uses the same shared progress and contextual-guide components as the top-level flow.

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

No arbitrary code is executed from the database.

## Tenant Scope

Every operational table carries `tenant_id`. Requests are scoped by authenticated tenant.

## Storage

V1 stores files on local disk through `StorageService`. Future drivers such as MinIO/S3 must not change the app contract.
