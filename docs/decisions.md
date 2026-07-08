# Architecture Decisions

## Phase 0 Decisions

- Project name: `chicle-engine`
- Repository shape: monorepo
- Package manager: npm workspaces
- Backend: NestJS
- Frontend: Ionic Angular with PrimeNG for desktop/admin renderers
- Database: MySQL/MariaDB
- ORM: TypeORM
- Initial storage: local disk through a storage service abstraction
- Initial deployment: docker compose
- Multi-tenant: yes, shared database with `tenant_id`
- Business templates: database seeds/scripts only

## Non Goals For V1

- No MongoDB as a required dependency.
- No Redis as a required dependency.
- No MinIO/S3 as a required dependency.
- No microservices.
- No product-specific domain code in core.
- No arbitrary JavaScript execution from database configuration.

## Core Principle

Chicle Engine executes generic configuration. Business behavior is provided by templates and declarative actions.

## Platform Architecture Language

Chicle uses an Evolutionary Modular Platform Architecture.

Implementation language: metadata-driven modular monolith prepared for event-driven, AI-assisted, multi-tenant and
multi-target platform execution.

Product language: configurable product factory for digital applications.

## Worker And Backup Evolution

Chicle V1 deploys initially as API + DB. The code must separate HTTP, application/core, dynamic runtime and async
runtime responsibilities now, but `api-worker` becomes a separate container only after the V1 base is stable or when
backups, schedules, outbox processing, retries, notifications or long-running flows require it.

Database backups must be dated compressed dump files stored outside the live MariaDB data volume. Production deployments
should copy those backups to an external destination.
