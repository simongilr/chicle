# Official authoring guide for humans and AI

This is the entry point for any person or AI generating configuration for Chicle Engine. The database stores
declarative objects; executable authority, tenant scope, permissions, timeouts and network restrictions remain in the
backend.

## Source of truth

Read these files in order:

1. `docs/ai-ready-authoring.md`
2. `docs/ai-rag-architecture.md`
3. `docs/ai-local-ollama.md`
4. `docs/dynamic-services-contract.md`
5. `docs/flow-contract.md`
6. `docs/examples/dynamic-services.examples.json`
7. `docs/examples/flows.examples.json`
8. `docs/examples/flow-step-catalog.examples.json`
9. `docs/examples/flow-runtime.examples.json`
10. `docs/dynamic-forms-contract.md`
11. `docs/examples/dynamic-forms.examples.json`
12. `docs/ui-components.md`
13. `docs/ui-component-inventory.md`
14. `docs/ui-presentation-architecture.md`
15. `docs/examples/ui-presentation.examples.json`
16. `docs/formly-architecture.md`
17. `docs/examples/dynamic-form-formly.examples.json`
18. `docs/angular-20-migration-roadmap.md`
19. `docs/angular-20-migration-report.md`

The TypeScript contracts remain authoritative when documentation and code differ:

- Dynamic services: `apps/api/src/modules/dynamic-services/dynamic-service-version.entity.ts`
- Flow definition: `apps/api/src/modules/flows/flow-version.entity.ts`
- Flow authoring requests: `apps/api/src/modules/flows/flows.service.ts`
- Flow runtime limits: `apps/api/src/modules/flows/flow.entity.ts`
- Visual component registry: `apps/app/src/app/shared/ui-component-catalog.ts`
- UI presentation contract: `apps/app/src/app/core/ui/ui-presentation.types.ts`
- Form schema adapter: `apps/app/src/app/engine/forms/formly/formly-schema-adapter.service.ts`

## Generation rules

- Output strict JSON. Never include comments, trailing commas, functions or executable source code.
- Use `snake_case` keys with 3-120 characters for services and flows.
- Treat every identifier, table, field, service and flow key as tenant-scoped unless the contract states otherwise.
- Never generate SQL. Internal services use `dataTarget` and validated filters.
- Never put credentials directly in an example or persisted definition. Use placeholders resolved from an approved
  secure input or future secret provider.
- Use only documented step types, operators and template paths.
- Set explicit `onErrorStepKey`, `onTimeoutStepKey`, `onFalseStepKey` or `onTrueStepKey` when failure or branching
  changes the route.
- Give every flow step a unique `key`, `position` and `outputKey`.
- JSON-only and guided visual editing are equivalent authoring paths. Future assistants should use the JSON-only
  endpoints in `docs/ai-ready-authoring.md`.
- RAG context must come from the versioned Knowledge Pack described in `docs/ai-rag-architecture.md`; do not invent
  unavailable tables, fields, permissions, services, flows or template concepts.
- Create or update JSON first, test it when possible, publish it and only then execute it from another component.
- Keep forms and screens library-neutral. Use the optional `presentation` contract; never emit Angular selectors,
  PrimeNG/Ionic component tags or library CSS classes in stored JSON.
- Personalization must use installed themes, `themeMode`, `density`, `radius` and safe semantic `tokens`. Never emit
  CSS blocks, arbitrary classes or unregistered theme imports in stored JSON.
- Build dynamic forms from the Chicle contract first. Use `steps` as the user journey, `fields` as declarative data
  capture, `actions` for submit behavior and `tests` for designer verification.
- Use `commands` for visible buttons. A button must declare placement, style, permission, validation requirements and
  a safe action such as `execute_service`, `execute_flow`, `create_record`, `upload_files` or `navigate`.
- Dynamic forms never write arbitrary tables directly from the frontend. Use `create_record`, `execute_service` or
  `execute_flow`, and document every field/service/flow dependency through bindings.
- If the user asks for a form CRUD over a table, create the needed objects from the same prompt when the table is
  known: companion Dynamic Services for create/list/update/delete where safe, plus a Dynamic Form with
  `persistence.mode=service` and an `execute_service` submit action pointing to the create service. Use only columns
  returned by the table catalog and skip id, tenantId, timestamps and sensitive columns.
- If the user explicitly asks for a new table from a form, generate an `apply_schema_change` action before services or
  forms. The table must be normalized to `custom_*`, the columns must be explicitly provided by the user or inferred
  from clear field/type words, and the action must use the database schema designer contract:
  `operation=create_table`, `tableName=custom_name`, `columns=[...]`. The UI then applies the change through
  `/api/database/schema/apply`, which writes `schema_changes` and a TypeORM migration source. Never generate raw SQL
  from the assistant.
- The schema designer is only for `custom_*` tables. If a user asks to add, edit, delete or drop columns/tables in core
  tables such as `users`, `roles`, `permissions`, `tenants`, `dynamic_forms`, `dynamic_services` or `flows`, do not
  generate an `apply_schema_change` action. Route the request to the appropriate domain module, dynamic service,
  security screen or a reviewed backend migration instead.
- For CRUD forms, infer the safest visual control from the real column catalog instead of rendering every field as a
  text input. Booleans such as `active` or `enabled` become `toggle` with a safe default, `systemRole` becomes a local
  role select, and foreign-key-style columns such as `roleId` become `select` fields backed by a published companion
  lookup service such as `listar_roles` when the related table exists in the catalog.
- Sensitive platform tables may need a domain action instead of direct table CRUD. For `users`, never generate a
  `writeMap` for `passwordHash` and never insert directly into the table. Generate a form with `type: "create_user"`,
  fields `email`, `name`, `password` and a role select, so the backend applies password policy, hashing, membership and
  RBAC role assignment.
- If the user already gave an explicit table name but that table is not present in the current catalog, do not ask for
  the same table name again. Explain whether the catalog failed to load or the table is missing, show visible table
  alternatives when available, and ask the user to choose one or create the table first.
- Login and auth forms use `persistence.mode = "auth"` and `execute_service` with `serviceKey: "auth.login"`.
  Map real fields from the current form into `username` and `password`, then declare `onSuccess` effects such as
  `set_session` and `navigate`, plus `onError` with a clear message. Never turn login into onboarding, record capture
  or `show_message`.
- When the user asks to change where an existing form submits, preserve `steps`, `fields`, `presentation` and `layout`
  unless they explicitly ask to change them. Update only `persistence`, `actions`, submit labels and payload maps.
- Never store Formly functions or JavaScript expressions. Conditional fields use the documented `visibleWhen` object.

## Progressive AI authoring for services

For Dynamic Services, the assistant must not jump directly from a broad prompt to JSON. It should feed itself with small
validated decisions:

1. Normalize the user's request into a precise service prompt and ask for confirmation.
2. Show the real tables involved from `GET /api/dynamic-services/catalog/tables` or the current screen state.
3. Show only fields that exist in those tables.
4. Ask the user to pick the field that receives input.
5. Generate or apply JSON only after explicit confirmation such as `crear draft`.

Example: if the user asks for "usuarios que tienen asignado cierto rol", normalize it as:

```txt
Create a read-only Dynamic Service that receives a role identifier, such as cliente, and returns users that have that
role assigned through users -> user_roles -> roles.
```

Then guide the user:

```txt
Tables: users, user_roles, roles.
Relation: users.id -> user_roles.userId -> roles.id.
Role input field options: roles.key, roles.id, roles.name only if those columns exist.
Recommended input: roles.key when the user will send values such as cliente.
```

The final JSON should use `queryMode=multi_table`, a filter on the chosen `roles` alias field, and explicit selected
columns. Do not invent `name` or any other field if it is not present in the table catalog.

### Stateful decision protocol

This protocol applies to every guided authoring screen, not only to role services:

- Keep the original intent across the whole conversation.
- Treat short user answers as decisions inside the previous question, not as standalone prompts.
- The latest explicit user selection wins over earlier options listed by the assistant.
- If the user answered a question, never ask the same question again unless the answer is invalid.
- Use the full assistant/user conversation to know which flow is active.
- Use only user messages to decide what the user selected.
- Use assistant messages only to recover context, not to choose values.
- Generate JSON only after the required decisions are complete and the user confirms with an action such as `crear draft`.

Examples:

```txt
Assistant: elige resultado: lista, un registro o sí/no
User: lista
Next: show draft summary, do not ask result again.

Assistant: campos reales: roles.key, roles.id, roles.name
User: roles.name
Next: use roles.name, even if roles.key appeared earlier in the assistant options.
```

## In-App Assistant Entry Point

The frontend exposes a global floating assistant through `AiAssistantLauncherComponent`.

Current V1 behavior:

- Accepts a natural-language request from any screen.
- Detects the current screen context from the route.
- Keeps the assistant UI as chat only.
- Emits the user request to the frontend assistant bus.
- Leaves JSON editing, validation, save, version and publish controls inside the current designer screen.
- Does not save, publish or execute anything automatically.

Future AI behavior:

- Replace local templates with a backend-assisted proposal endpoint.
- Load the official Knowledge Pack before generating.
- Validate generated JSON against the relevant contract.
- Explain table, service, flow, permission and runtime dependencies.
- Send proposed changes back to the active screen so its existing visual and JSON editors can show the diff.
- Require explicit user approval before saving, versioning or publishing.

## Validation checklist

Before proposing an object:

1. The JSON parses with a standard parser.
2. Every referenced service or subflow key exists and is published.
3. Every mapped path starts from `input`, `tenant`, `user` or `steps`.
4. Every next/branch key names a step in the same flow.
5. Required input fields have realistic example values.
6. Timeouts and retries remain within Confisys limits.
7. Internal queries use a table and columns returned by `GET /api/dynamic-services/catalog/tables`.
   For read-only joins, use `queryMode=multi_table` with aliases, declarative join conditions and explicit `select`.
8. The draft passes preview and saved test cases before publication.
9. Presentation kits are installed and valid; current values are `auto`, `inherit`, `primeng`, `ionic` and `native`.

## Unsupported assumptions

Do not claim these capabilities are implemented until the backend contract changes:

- Free SQL from the UI.
- `advanced_read_model` execution beyond safe `multi_table` joins.
- Arbitrary JavaScript in formulas or validations.
- Unlimited recursion, retries, response size, delay, concurrency or execution time.
- Direct access to password, token, secret or hash columns.
