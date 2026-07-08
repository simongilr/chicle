# Chicle AI RAG architecture

RAG is the versioned knowledge layer for the future Chicle AI Manager. The model is not expected to know Chicle from
training. Chicle retrieves the right project, template and tenant context before asking the model to generate or explain
configuration.

The goal is to let assistants create safe declarative drafts for Dynamic Services, Dynamic Forms, Flows, Actions and
future Screens without fine-tuning a model and without letting the model invent tables, fields, permissions or runtime
contracts.

## Design Principle

The assistant can propose. Chicle validates and the user publishes.

- Local-first provider stack starts with Ollama, `qwen3-coder:30b` and `nomic-embed-text:v1.5`.
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
