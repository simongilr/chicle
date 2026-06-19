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
