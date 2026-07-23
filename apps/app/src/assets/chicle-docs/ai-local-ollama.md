# Local AI with Ollama

Chicle AI starts local-first. The first supported local stack is:

```txt
Runtime: Ollama
LLM local default: qwen2.5-coder:7b
LLM recommended when Docker has enough memory: qwen3-coder:30b
Embeddings: nomic-embed-text:v1.5
```

The assistant is optional. Chicle must keep starting even when Ollama is not installed or the models are not downloaded.

## Why This Stack

- `qwen2.5-coder:7b` is the default local development model because it runs on smaller Docker Desktop memory limits.
- `qwen3-coder:30b` is the recommended higher-quality local model for generating structured Chicle configuration,
  JSON drafts and assistant responses when the machine has enough memory assigned to Docker.
- `nomic-embed-text:v1.5` is the recommended local embedding model for semantic RAG.
- Ollama gives Chicle a local runtime and an OpenAI-compatible API shape, so the backend can switch between local and
  cloud providers through adapters.

## Local Mac Setup

Install and start Ollama, then pull the models:

```bash
ollama pull qwen3-coder:30b
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text:v1.5
```

The default local URL is:

```txt
http://localhost:11434/v1
```

If the API runs directly on the host, use:

```bash
AI_PROVIDER=ollama
AI_BASE_URL=http://localhost:11434/v1
AI_CHAT_MODEL=qwen2.5-coder:7b
AI_EMBEDDING_MODEL=nomic-embed-text:v1.5
```

## Local Docker Profile

The local Docker profile includes an optional `ai-local` service for Ollama.

From `infra/docker`:

```bash
docker compose --env-file .env --profile ai-local up -d ollama
docker compose --env-file .env --profile ai-local exec ollama ollama pull qwen2.5-coder:7b
docker compose --env-file .env --profile ai-local exec ollama ollama pull nomic-embed-text:v1.5
docker compose --env-file .env --profile ai-local up -d
```

When the API runs inside Compose, use:

```txt
AI_BASE_URL=http://ollama:11434/v1
```

## Confisys Defaults

The API seeds these defaults:

| Key | Default |
| --- | --- |
| `ai.enabled` | `true` |
| `ai.provider` | `ollama` |
| `ai.baseUrl` | `http://localhost:11434/v1` |
| `ai.chatModel` | `qwen2.5-coder:7b` |
| `ai.embeddingModel` | `nomic-embed-text:v1.5` |
| `ai.timeoutMs` | `180000` |
| `ai.rag.enabled` | `true` |
| `ai.rag.mode` | `keyword` |
| `ai.maxContextChunks` | `12` |
| `ai.allowPublish` | `false` |

Environment variables override Confisys values at runtime when present:

```txt
AI_ENABLED
AI_PROVIDER
AI_BASE_URL
AI_CHAT_MODEL
AI_EMBEDDING_MODEL
AI_TIMEOUT_MS
AI_RAG_ENABLED
AI_RAG_MODE
AI_MAX_CONTEXT_CHUNKS
AI_ALLOW_PUBLISH
```

## API Endpoints

The first backend endpoints are:

```txt
GET  /api/ai-assistant/status
POST /api/ai-assistant/chat
```

Both require `ai.assistant.use`.

`status` checks whether the configured provider is reachable and whether the configured chat and embedding models are
available.

`chat` sends the current screen scope and prompt to the provider. It does not save, publish or execute changes.

## Timeout Mitigation

Chicle AI must remain useful even when the local model is slow. The assistant uses a layered path:

1. Fast deterministic generators for common Chicle objects.
2. RAG/context retrieval for requests that need project knowledge.
3. Ollama only when reasoning is needed.
4. Backend validation before any draft reaches the screen.
5. Friendly fallback when the provider times out.

Examples that should not require the LLM:

- service over an internal table and field;
- basic query service with one or more filters;
- simple form from title, steps and field names;
- basic flow chain with ordered services.

If Ollama times out, the API returns a normal assistant message instead of breaking the chat with a raw 503. The message
asks for the missing structure and reminds the user that nothing was saved.

`GET /api/ai-assistant/status` intentionally uses a short provider check so opening the chat never waits for the full
generation timeout.

## RAG Plan

Phase 1 uses keyword/tag retrieval from the Chicle Knowledge Pack.

Phase 2 adds embeddings with `nomic-embed-text:v1.5`.

Phase 3 adds controlled backend tools:

- `getSchema`
- `getAvailableEntities`
- `getEntityFields`
- `getPublishedServices`
- `getPublishedFlows`
- `validateDraftConfig`
- `previewDynamicService`
- `previewFlow`
- `previewForm`

The assistant always proposes. Chicle validates. The user approves.
