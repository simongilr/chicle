# Chicle Engine

Chicle Engine is a plug and play base for building operational applications from configuration, dynamic forms, declarative actions, records, events, files and offline sync.

This repository starts clean. Business templates such as `containers-reference.seed.ts` are only reference seeds and must not leak domain rules into the core.

## Stack

- Monorepo with npm workspaces
- API: NestJS + TypeORM + MySQL/MariaDB
- App: Ionic Angular + PrimeNG
- Storage V1: local filesystem volume
- Deployment V1: docker compose

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
docker compose up
open app
setup tenant/admin
load optional template
start operating
```

Read `docs/context-handoff.md` before continuing development in a new Codex conversation.

Security and authentication decisions should be checked against `docs/security-auth-review.md` before implementation.
