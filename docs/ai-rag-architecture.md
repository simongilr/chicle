# Chicle AI RAG architecture

RAG is the versioned knowledge layer for the future Chicle AI Manager. The model is not expected to know Chicle from
training. Chicle retrieves the right project, template and tenant context before asking the model to generate or explain
configuration.

The goal is to let assistants create safe declarative drafts for Dynamic Services, Dynamic Forms, Flows, Actions and
future Screens without fine-tuning a model and without letting the model invent tables, fields, permissions or runtime
contracts.

## Design Principle

The assistant can propose. Chicle validates and the user publishes.

- Local-first provider stack starts with Ollama, `qwen2.5-coder:7b` for development, optional
  `qwen3-coder:30b` for higher-capacity local machines, and `nomic-embed-text:v1.5`.
- Cloud providers are optional adapters, not mandatory platform dependencies.
- RAG provides current knowledge.
- The model generates a draft JSON artifact.
- The backend validates schemas, tenant scope, permissions, tables, fields, service/flow references and limits.
- The frontend shows the proposal in the same JSON authoring panels used by humans.
- Publication remains an explicit operation through Chicle endpoints.

## Knowledge Layers

Chicle separates knowledge into three layers so the engine stays generic while templates and tenants can add domain
meaning.

### 1. Core Knowledge

Core knowledge belongs to Chicle Engine itself. It applies to every tenant and template.

Planned location:

```txt
docs/ai/core/
  principles.md
  dynamic-services.md
  dynamic-forms.md
  flows.md
  actions.md
  records.md
  permissions.md
  security.md
  tenant-scope.md
```

Core rules include:

- Chicle does not execute arbitrary JavaScript from the database.
- Configuration is declarative JSON.
- JSON-only and guided visual editing are equivalent authoring paths.
- The backend owns validation, execution, tenant scope and permissions.
- Generated objects are drafts until explicitly published.
- Runtime contracts must not include secrets, raw SQL or product-specific assumptions.

### 2. Template Knowledge

Template knowledge belongs to an installed product or vertical solution. It must not contaminate Chicle core.

Planned location:

```txt
templates/<template-key>/ai/
  overview.md
  entities.md
  permissions.md
  examples/
    service.example.json
    flow.example.json
    form.example.json
```

Examples:

- A logistics template can describe containers, routes, readings and field devices.
- A real-estate template can describe properties, visits, owners and leads.
- A ticketing template can describe events, tickets, seats and check-in.

The engine remains generic. The template contributes domain vocabulary, examples and approved defaults.

### 3. Instance Knowledge

Instance knowledge belongs to one tenant.

Examples:

- Active custom tables and columns.
- Published services and flows.
- Existing dynamic forms.
- Tenant permissions and role resource policies.
- Confisys values and runtime limits.
- Installed templates and selected theme/profile.

This layer is always tenant-scoped and must never leak into another tenant's retrieval result.

## Knowledge Pack

A Knowledge Pack is a versioned bundle of docs, schemas, examples and metadata that can be indexed for retrieval and
used by people, Codex, tests and future AI assistants.

Planned structure:

```txt
docs/ai/
  core/
  schemas/
    dynamic-service.schema.json
    dynamic-form.schema.json
    flow.schema.json
  examples/
    dynamic-service.basic-query.json
    dynamic-form.basic-capture.json
    flow.service-chain.json
```

Each document can start with metadata:

```yaml
---
tags: [dynamic_service, query, response_map, filters]
objectType: dynamic_service
version: 1
---
```

Versioning matters because Chicle will evolve. A tenant or template can be pinned to a Chicle version, template version
or schema version, and retrieval must prefer matching knowledge.

## Database Model

Initial tables:

### `ai_knowledge_sources`

Stores one logical source of knowledge.

| Column | Purpose |
| --- | --- |
| `id` | Primary key |
| `tenant_id` | Null for core/template sources, set for tenant instance knowledge |
| `scope` | `core`, `template`, `instance` |
| `template_key` | Optional template owner |
| `source_type` | `doc`, `schema`, `example`, `db_metadata`, `form`, `service`, `flow`, `permission`, `confisys` |
| `name` | Human-readable source name |
| `path` | File path or logical DB source path |
| `version` | Source version |
| `enabled` | Exclude without deleting |
| `created_at` / `updated_at` | Audit timestamps |

### `ai_knowledge_chunks`

Stores searchable chunks derived from a source.

| Column | Purpose |
| --- | --- |
| `id` | Primary key |
| `source_id` | Source reference |
| `tenant_id` | Redundant tenant scope for filtering |
| `scope` | `core`, `template`, `instance` |
| `content` | Chunk text |
| `content_hash` | Idempotent indexing |
| `tags_json` | Search and filtering tags |
| `embedding_json` | Optional embedding vector until a vector store is introduced |
| `metadata_json` | Object type, version, paths, permissions, source refs |
| `created_at` | Audit timestamp |

### `ai_retrieval_runs`

Stores traceability for each retrieval.

| Column | Purpose |
| --- | --- |
| `id` | Primary key |
| `tenant_id` | Tenant scope |
| `user_id` | Caller |
| `task_type` | `generate_service`, `generate_form`, `generate_flow`, `explain`, etc. |
| `query` | User request |
| `retrieved_chunks_json` | Chunk ids, scores, scopes and versions |
| `created_at` | Audit timestamp |

## Retrieval Flow

Example user request:

> Create a service that finds a user by email or name.

Internal flow:

1. Detect intent: `generate_dynamic_service`.
2. Retrieve core service contract and examples.
3. Retrieve tenant DB table metadata.
4. Retrieve published service/action constraints if needed.
5. Build a prompt with strict rules: no raw SQL, no JavaScript, use only available tables/fields, return JSON only.
6. Model returns a draft.
7. Backend validates the draft.
8. Frontend opens the proposal in `JsonAuthoringPanelComponent`.
9. User saves draft or publishes.

## Reliability Strategy

The assistant is not a single direct call to a model. It is an authoring pipeline:

```txt
user prompt
  -> scope and intent router
  -> deterministic generator when the request matches a safe pattern
  -> RAG context when Chicle knowledge is needed
  -> LLM provider only for reasoning gaps
  -> backend validation
  -> frontend draft proposal
  -> explicit user save or publish
```

This matters because services, flows and forms have different failure modes:

| Scope | Fast path | LLM path | Required validation |
| --- | --- | --- | --- |
| Dynamic Services | Internal table + field + filter + result type | Ambiguous integrations, complex joins, SOAP/WebSocket guidance | Table, fields, URL policy, timeouts, response map |
| Dynamic Forms | Title + steps + fields + actions | Complex UX grouping, conditional steps, cross-field rules | Schema, field types, actions, bindings, presentation |
| Flows | Ordered service chain, simple validation branch | Multi-branch orchestration, retries, async triggers | Step catalog, service refs, next keys, timeouts, loop limits |

Timeouts are expected with local models, especially inside Docker. A timeout must not invalidate the screen state or
delete a draft. The backend returns a controlled assistant message, and the frontend keeps the current editor untouched.

The assistant should prefer smaller operations:

- create the first safe draft;
- ask for one missing detail;
- apply the proposal to the current screen;
- let the user test;
- continue with the next refinement.

For complex authoring requests, Chicle AI answers with a stable operational shape:

1. Interpretation: what the user is asking for.
2. Roadmap: how Chicle should approach it safely.
3. Review: what the assistant checked or why it cannot proceed blindly.
4. Proposal: concrete actions or draft pieces.
5. Next step: the smallest user/app action that moves the work forward.

This is the expected behavior for Dynamic Services lifecycle requests too. Create and edit may produce drafts. Trash,
restore and publish remain explicit user-confirmed actions in the UI.

### Incremental Dialogue

Chicle AI should not try to solve broad authoring requests in one provider call. The frontend sends the recent chat
conversation with each request, and the backend uses recent user messages as intent context.

Expected flow:

1. Interpret the current request.
2. Pick the safe mechanism: service, flow, form, action or a combination.
3. Ask only for the missing critical detail.
4. On the next user answer, continue from the previous intent instead of treating the short answer as a new request.
5. Apply a draft only when the shape is executable by the current runtime.

When Chicle AI asks for a decision, the API may return `suggestions`. The floating assistant renders those suggestions
as buttons. Selecting a button sends that text as the next user message, preserves conversation context, clears the old
buttons and lets the backend ask the next smallest question. This keeps non-technical users out of prompt wording and
lets the assistant move one decision at a time.

For Dynamic Services, even simple requests use a preflight turn. Chicle AI first returns interpretation, route, review,
proposal and next step. The frontend should receive an `apply_dynamic_service_json` action only after the user confirms
with a continuation such as "continúa", "hazlo" or "genera el draft". This prevents the assistant from creating a generic
service just because a fast deterministic generator recognized one table.

Example:

```txt
User: necesito un servicio que consulte un usuario y si existe vaya a role...
AI: necesito saber qué campo llega desde el front. Suggestions: por email, por nombre, por id.
User clicks: por email
AI: servicio avanzado con queryMode=multi_table, users -> user_roles -> roles. Suggestions: crear servicio avanzado, ajustar entrada, explicar join.
User clicks: crear servicio avanzado
AI: emits apply_dynamic_service_json for consultar_usuario_roles_por_email.
```

This small-step approach keeps local models from timing out and makes future RAG safer because each turn has a narrower
question.

### Composite Services

Requests such as "create a service with two queries" must not be forced into the simple table/filter generator. They use
a separate reasoning route:

1. If the prompt does not identify the input fields, the two queries, their relationship or the expected frontend
   response, Chicle AI asks for the missing pieces.
2. If enough information exists, Chicle checks whether the runtime can execute the requested shape.
3. If the request is a read-only join, Chicle can create one Dynamic Service with `queryMode=multi_table`.
4. If the request needs branching, side effects, retries, async work or multiple command steps, Chicle should still
   use a Flow to orchestrate services.
5. If model reasoning is still needed, Chicle sends a compact prompt to the configured model with limited output tokens.
6. If the model times out, Chicle returns a continuation checklist instead of a raw provider error.
7. If a service is already open, the assistant receives the current draft, definition, test context, available tables and
   last run error so it can repair or continue from the existing state.

This lets Chicle feel conversational without making the LLM a fragile runtime dependency.

## Phased Implementation

### Phase 1: Keyword RAG

Use tags, object types, file paths and simple text search.

Deliverables:

- `docs/ai` Knowledge Pack structure.
- Indexer for markdown and JSON examples.
- Chunk table with tags and metadata.
- Retrieval by tags/keywords.
- Prompt builder for Dynamic Service generation.
- Validate generated draft through existing `/authoring/json` endpoints.

This phase is enough for the first AI assistant because Chicle already has strict docs and JSON endpoints.

### Phase 2: Embedding RAG

Add semantic retrieval when the keyword path is proven.

Deliverables:

- Provider abstraction for embeddings.
- Optional local or hosted embedding model.
- `embedding_json` persistence or future vector store.
- Hybrid ranking: tenant/version filters first, then keyword and semantic score.

Embeddings are optional per environment so small installations are not forced to run a heavy AI stack.

### Phase 3: RAG + Controlled Tools

The assistant can call safe backend tools instead of relying only on documents.

Initial tools:

- `getSchema(objectType)`
- `getAvailableEntities()`
- `getEntityFields(tableName)`
- `getPublishedServices()`
- `getPublishedFlows()`
- `getActionCatalog()`
- `validateDraftConfig(objectType, json)`
- `previewDynamicService(json, input)`
- `previewFlow(json, input)`
- `previewForm(json, input)`

Tools must be permission-aware, tenant-scoped and read-only unless the final explicit save endpoint is called.

## AI Manager Modules

Planned API modules:

```txt
apps/api/src/modules/ai/
  knowledge/
    knowledge-source.service.ts
    knowledge-indexer.service.ts
    knowledge-search.service.ts
    chunker.service.ts
    embedding.service.ts
  retrieval/
    retrieve-context.service.ts
    rank-context.service.ts
  prompts/
    prompt-builder.service.ts
  assistant/
    ai-orchestrator.service.ts
```

Flow:

```txt
AI Orchestrator
  -> intent detection
  -> retrieve context
  -> rank context
  -> prompt builder
  -> model provider
  -> backend validator
  -> draft artifact
```

## What May Enter RAG

Allowed:

- Core documentation.
- JSON schemas.
- Approved examples.
- Action and operator catalogs.
- Database metadata, not table data.
- Published service, form and flow metadata.
- Permission names and role resource policy metadata.
- Tenant Confisys keys and non-secret values when allowed.

Restricted:

- Passwords, hashes, tokens and API secrets.
- Evidence files or private uploads.
- Raw customer records unless an explicit future permission model allows it.
- Full logs.
- Data from other tenants.
- Anything marked sensitive by Confisys or security policy.

## Relationship With Existing Chicle Contracts

RAG does not replace existing authoring contracts. It feeds them.

- Dynamic Services still publish through `/api/dynamic-services/authoring/json`.
- Dynamic Forms still publish through `/api/forms/authoring/json`.
- Flows still publish through `/api/flows/authoring/json`.
- The shared frontend JSON panel remains the authoring surface for AI proposals.
- Backend validation remains authoritative.

## MVP Acceptance Criteria

RAG V1 is useful when it can:

1. Index Chicle core docs and examples.
2. Retrieve relevant chunks by task type and tags.
3. Include tenant DB metadata without exposing row data.
4. Generate a Dynamic Service draft that references only existing tables/fields.
5. Send the generated draft to the existing JSON authoring endpoint with `publish=false`.
6. Store a retrieval run showing which chunks were used.
7. Show warnings when required context is missing instead of inventing values.

## Architecture Sentence

Chicle RAG is the versioned knowledge layer of the AI Manager. It lets assistants generate declarative configuration
from Chicle documentation, schemas, examples, metadata and installed templates, without training a custom model and
without bypassing backend validation.
