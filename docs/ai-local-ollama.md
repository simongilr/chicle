# Local AI with Ollama

Chicle AI starts local-first. The first supported local stack is:

```txt
Runtime: Ollama
LLM: qwen3-coder:30b
Embeddings: nomic-embed-text:v1.5
```

The assistant is optional. Chicle must keep starting even when Ollama is not installed or the models are not downloaded.

## Why This Stack

- `qwen3-coder:30b` is the recommended local model for generating structured Chicle configuration, JSON drafts and
  assistant responses.
- `nomic-embed-text:v1.5` is the recommended local embedding model for future semantic RAG.
- Ollama gives Chicle a local runtime and an OpenAI-compatible API shape, so the backend can later switch between
  local and cloud providers through adapters.

## Local Mac Setup

Install and start Ollama, then pull the models:

```bash
ollama pull qwen3-coder:30b
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
AI_CHAT_MODEL=qwen3-coder:30b
AI_EMBEDDING_MODEL=nomic-embed-text:v1.5
```

## Docker Compose Setup

The Docker Compose file includes an optional `ai-local` profile.

From `infra/docker`:

```bash
docker compose --env-file .env --profile ai-local up -d ollama
docker compose --env-file .env --profile ai-local exec ollama ollama pull qwen3-coder:30b
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
| `ai.chatModel` | `qwen3-coder:30b` |
| `ai.embeddingModel` | `nomic-embed-text:v1.5` |
| `ai.timeoutMs` | `60000` |
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
