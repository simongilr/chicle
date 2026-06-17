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
- Declarative actions
- Local file/evidence upload abstraction
- Devices registry
- Offline sync foundation with idempotency keys
- Docker compose base

## Deferred

- Advanced workflow editor
- Advanced report builder
- Hardware plugins beyond capability interfaces
- MinIO/S3 driver
- Redis/queues/workers
- External integrations marketplace
- SmartSeal-specific modules

## First Real Proof

`scripts/templates/smartseal-reference.seed.ts` can validate that the engine can run a complex operational flow without domain code in core.
