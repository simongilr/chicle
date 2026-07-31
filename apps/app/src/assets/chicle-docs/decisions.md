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
- Business templates: versioned app packages and optional database seeds/scripts

## Architectural Boundaries

- No MongoDB as a required dependency.
- No Redis as a required dependency.
- No MinIO/S3 as a required dependency.
- No deployment style is allowed to define the architecture by itself. Chicle separates behavior by contracts, runtime
  roles and adapters; an installation may run compactly or distribute artifacts according to its scale.
- No product-specific domain code in core.
- No arbitrary JavaScript execution from database configuration.
- No generated app may bypass tenant scope, RBAC, publication state or backend validation.
- No public landing page may expose secrets, private runtime configuration or unpublished contracts.

## Core Principle

Chicle Engine executes generic, versioned contracts. Business behavior is provided by tenant apps, templates, dynamic
services, forms, flows, screens, component templates, text packages and declarative actions.

## Platform Architecture Language

Chicle uses an Event-Driven, Metadata-Driven and Microkernel Platform Architecture.

Implementation language: versioned dynamic contracts executed by a modular, secure, extensible, event-driven,
multi-tenant, multi-target kernel assisted by backend-validated AI.

Product language: configurable product factory for digital applications.

## App Studio Decision

The Admin contains App Studio. App Studio is the control plane for tenant-owned apps, screens, navigation, landing
pages, component templates, artifact preferences, text namespaces, publication and export/import packages.

Generated apps are not detached source-code forks. They are runtime artifacts that boot with a tenant, app key,
environment profile and bundled defaults, then resolve the published app contract through the API:

```txt
tenant + appKey + target + route
  -> published app version
  -> published screen version
  -> component registry
  -> bindings/actions runtime
  -> text bundle and presentation profile
```

Admin can create many apps inside one tenant. Each app keeps isolated routes, menus, text namespaces, permissions,
versions, publication status and package dependencies.

## Worker And Backup Execution

Chicle separates HTTP, application/core, dynamic runtime and async runtime responsibilities by contract. API, workers,
backup, schedules, outbox processing, retries, notifications and long-running flows share the same event and runtime
contracts even when the local environment runs only the required containers.

Database backups must be dated compressed dump files stored outside the live MariaDB data volume. Production deployments
should copy those backups to an external destination.
