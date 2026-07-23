# Chicle Engine

Chicle Engine is a plug and play base for building operational applications from configuration, dynamic forms, declarative actions, records, events, files and offline sync.

This repository starts clean. Business templates such as `containers-reference.seed.ts` are only reference seeds and must not leak domain rules into the core.

## Stack

- Monorepo with npm workspaces
- API: NestJS + TypeORM + MySQL/MariaDB
- App: Ionic Angular + PrimeNG
- Storage V1: local filesystem volume
- Deployment V1: Docker-packaged artifacts for API/app/runtime support, with local compose files for development

## Initial Apps

```txt
apps/api  NestJS backend
apps/app  Ionic Angular responsive app
```

## Local Development

```txt
nvm use
npm install
npm run build
```

## First Run Goal

```txt
docker compose --env-file infra/docker/.env.example -f infra/docker/docker-compose.yml up --build
open app
setup tenant/admin
load optional template
start operating
```

The API container runs pending TypeORM migrations before starting Nest. Keep
`DB_SYNCHRONIZE=false`; local API development should run `npm run migration:run`
before `npm run dev:api`.

Read `docs/context-handoff.md` before continuing development in a new Codex conversation.

Security and authentication decisions should be checked against `docs/security-auth-review.md` before implementation.

## Official Configuration Documentation

- Platform architecture and product factory vision: `docs/platform-architecture.md`
- Current project state analysis: `docs/project-state-analysis.md`
- Backup and worker evolution: `docs/backup-worker-architecture.md`
- Human/AI entry point: `docs/ai-authoring-guide.md`
- AI-ready JSON-only endpoints: `docs/ai-ready-authoring.md`
- AI RAG architecture and Knowledge Packs: `docs/ai-rag-architecture.md`
- Local AI with Ollama: `docs/ai-local-ollama.md`
- Dynamic services contract: `docs/dynamic-services-contract.md`
- Flow contract: `docs/flow-contract.md`
- Dynamic forms contract: `docs/dynamic-forms-contract.md`
- Visual components and adoption: `docs/ui-components.md`
- In-app visual component catalog: `/components`
- Machine-readable examples: `docs/examples/*.json`
