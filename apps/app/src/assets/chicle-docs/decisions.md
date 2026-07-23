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
- Initial deployment: Docker-packaged artifacts, with compose files for local development
- Multi-tenant: yes, shared database with `tenant_id`
- Business templates: database seeds/scripts only

## Architectural Boundaries

- No MongoDB as a required dependency.
- No Redis as a required dependency.
- No MinIO/S3 as a required dependency.
- No deployment style is allowed to define the architecture by itself. Chicle separates behavior by contracts, runtime
  roles and adapters; an installation may run compactly or distribute artifacts according to its scale.
- No product-specific domain code in core.
- No arbitrary JavaScript execution from database configuration.

## Core Principle

Chicle Engine executes generic configuration. Business behavior is provided by templates and declarative actions.

## Platform Architecture Language

Chicle uses an Event-Driven, Metadata-Driven and Microkernel Platform Architecture.

Implementation language: versioned dynamic contracts executed by a modular, secure, extensible, event-driven,
multi-tenant, multi-target kernel assisted by backend-validated AI.

Product language: configurable product factory for digital applications.

## Worker And Backup Execution

Chicle separates HTTP, application/core, dynamic runtime and async runtime responsibilities by contract. API, workers,
backup, schedules, outbox processing, retries, notifications and long-running flows share the same event and runtime
contracts even when the local environment runs only the required containers.

Database backups must be dated compressed dump files stored outside the live MariaDB data volume. Production deployments
should copy those backups to an external destination.
