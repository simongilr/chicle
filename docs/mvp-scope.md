# MVP Scope

## Included

- Setup wizard backend contract.
- Tenant creation and tenant-scoped administration.
- Admin user creation.
- Auth foundation.
- Roles, permissions and resource-policy foundation.
- Tenant settings, Confisys and environment-aware defaults.
- Menus and navigation contracts.
- App Studio V2 foundation: tenant app portfolio, app workspace, app versions, screen versions, navigation, preview,
  publish/unpublish, trash/restore and dependency visibility.
- Dynamic screens composed from registered components.
- Dynamic forms with versions, responsive behavior, JSON authoring and service-backed persistence.
- Dynamic services with versions, publication, testing, private/public exposure rules and safe internal queries.
- Flows with versions, tests, execution runs and event-ready orchestration.
- Text packages, language defaults and local fallback bundles for Admin and generated apps.
- Reusable visual components and multikit adapters for PrimeNG, Ionic, Material, Bootstrap and native fallback.
- Generic records.
- Generic events.
- Event engine foundation: runs, outbox, jobs, idempotency and audit trail.
- Declarative actions.
- Local file/evidence upload abstraction.
- Devices registry.
- Offline sync foundation with idempotency keys.
- Docker-packaged artifact base with local compose support.
- App package export/import foundation for moving configured apps between tenants or environments.

## Deferred

- Advanced report builder
- Hardware plugins beyond capability interfaces
- MinIO/S3 driver
- External integrations marketplace
- Marketplace distribution for third-party plugin catalogs

## First Real Proof

The first proof is a tenant that can own multiple generated apps:

```txt
Tenant
  -> App Tuerca
     -> login
     -> home menu
     -> form screens
  -> App Image Gallery
     -> gallery home
     -> media services
     -> file bindings
```

The reference template under `scripts/templates/containers-reference.seed.ts` can still validate that the engine runs a
complex operational app without domain code in core, but the MVP target is broader: any tenant app must be created,
administered, published, rendered and exported from Chicle contracts.
