# MVP Scope

## Included

- Setup wizard backend contract
- Tenant creation
- Admin user creation
- Auth foundation
- Roles and permissions foundation
- Tenant settings
- Menus
- Dynamic forms with versions
- Generic records
- Generic events
- Event engine foundation: runs, outbox, jobs, idempotency and audit trail
- Declarative actions
- Local file/evidence upload abstraction
- Devices registry
- Offline sync foundation with idempotency keys
- Docker-packaged artifact base with local compose support

## Deferred

- Advanced report builder
- Hardware plugins beyond capability interfaces
- MinIO/S3 driver
- External integrations marketplace
- Containers-specific modules

## First Real Proof

`scripts/templates/containers-reference.seed.ts` can validate that the engine can run a complex operational flow without domain code in core.
