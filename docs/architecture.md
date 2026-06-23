# Chicle Engine Architecture

## Repository

```txt
chicle-engine/
  apps/
    api/
    app/
  packages/
    shared/
  infra/
    docker/
  scripts/
    templates/
  docs/
```

## API

The API is a NestJS application that owns tenant scoping, authentication, configuration, dynamic form definitions, action definitions, records, files and sync contracts.

```txt
apps/api/src/
  config/
  database/
  common/
  modules/
    setup/
    auth/
    tenants/
    users/
    roles/
    permissions/
    settings/
    menus/
    dynamic-forms/
    workflows/
    actions/
    records/
    files/
    devices/
    sync/
    audit/
  templates/
```

## App

The app is one Ionic Angular application. It uses Ionic for mobile/field experiences and PrimeNG for desktop/admin experiences. Business screens are rendered from configuration.

```txt
apps/app/src/app/
  core/
    navigation/
  engine/
  capabilities/
  shared/
    main-nav/
  pages/
```

## Frontend Components

Shared UI must live in reusable components instead of being copied into pages. The main navigation starts with `app-main-nav`, which reads menu options from the API when a session exists and falls back to local defaults while the database-driven menu is not available.

Menus are tenant data. Default menu rows are seeded during first setup, then `/api/menus/current` returns only the options visible for the current user's permissions.

## Dynamic Runtime

The engine renders:

- Menus
- Forms
- Fields
- Views
- Services
- Actions
- Workflows

The app does not contain pages named after business operations. It contains generic pages such as dynamic form, record list and record detail.

Dynamic services are tenant-owned executable objects stored in the database. A service is created once, versioned, published and then consumed by key from the frontend, workflows or actions. The frontend calls a stable contract instead of creating one HTTP method per business service:

```ts
dynamicServices.execute('buscar_usuario', { name: 'simon' });
```

The API resolves the published definition behind `POST /api/dynamic-services/by-key/:serviceKey/execute`, applies tenant scope and permissions, runs the service, and records the execution in `dynamic_service_runs`.

The same contract must survive future capabilities such as guided joins, unions, read models, SOAP, WebSocket, webhooks, async queues and response mapping.

## Declarative Actions

Supported action types start small:

- `create_record`
- `http_request`
- `upload_files`
- `show_modal`
- `navigate`
- `queue_offline`
- `capability`
- `get_gps`

No arbitrary code is executed from the database.

## Tenant Scope

Every operational table carries `tenant_id`. Requests are scoped by authenticated tenant.

## Storage

V1 stores files on local disk through `StorageService`. Future drivers such as MinIO/S3 must not change the app contract.
