# Environment, Deploy And Vault Roadmap

## Purpose

This document defines the planned Chicle module for environments, secrets, production deployment, generated artifacts
and dynamically configured service endpoints.

The module name is:

> Environment And Deploy Center

The internal secret subsystem is:

> Chicle Vault

The endpoint and microservice catalog is:

> Service Registry

The goal is to keep deployment, secrets, runtime URLs and generated artifacts understandable from one Admin experience
while preserving a high security standard.

## Problem

Chicle needs to run in several environments without forcing users to understand every file involved in deployment.

Default environments:

- `local`
- `dev`
- `qa`
- `pre`
- `prod`

Custom environments must also be supported, for example:

- `demo`
- `training`
- `client_a_prod`
- `sandbox`

The system must support:

- local startup with safe defaults;
- server setup with minimal bootstrap variables;
- encrypted secrets managed from Admin;
- generated deployment artifacts;
- frontend runtime configuration without rebuilding;
- microservice endpoints configured by environment;
- AI-assisted diagnosis and configuration;
- audit, recovery and validation.

## Design Principle

Chicle separates artifact, configuration and secret material.

```txt
Same artifact
+ environment profile
+ runtime configuration
+ encrypted secrets
+ service registry
= local/dev/qa/pre/prod deployment
```

The same Docker image should be able to run in multiple environments. Differences belong to environment profiles,
runtime config, secrets and service registry records, not to copied code.

## Configuration Layers

| Layer                 | Stored In                               | Contains                                                       | Secret                | Editable From Admin            |
| --------------------- | --------------------------------------- | -------------------------------------------------------------- | --------------------- | ------------------------------ |
| Bootstrap             | Real server environment or mounted file | DB host, DB user, DB password, current environment, vault path | Yes                   | No for unsafe values           |
| Chicle Vault          | Server volume outside DB                | Master key material and recovery metadata                      | Yes                   | Controlled setup/rotation only |
| Environment Variables | DB                                      | Non-secret environment variables                               | No                    | Yes                            |
| Environment Secrets   | DB encrypted                            | API keys, tokens, JWT material, SMTP secrets, storage secrets  | Yes                   | Yes, masked                    |
| Confisys              | DB + API memory cache                   | Runtime behavior and limits                                    | No                    | Yes                            |
| Runtime Config        | Generated public JSON                   | Frontend public configuration                                  | No                    | Yes                            |
| Service Registry      | DB                                      | Logical service and microservice endpoints by environment      | References only       | Yes                            |
| Artifacts             | Generated files/package                 | Compose, proxy, runtime config and checklists                  | No secrets by default | Yes                            |

## Bootstrap Standard

Chicle must stay self-sufficient. It must not require external Vault/KMS products to run.

Minimum server bootstrap:

```env
CHICLE_ENV=prod
CHICLE_VAULT_PATH=/var/lib/chicle/vault
DB_HOST=db.example.internal
DB_PORT=3306
DB_NAME=chicle_engine
DB_USER=chicle
DB_PASSWORD=replace_me
```

Optional bootstrap:

```env
API_PORT=3000
APP_PORT=8100
LOG_LEVEL=info
```

Local default behavior:

- if `CHICLE_ENV` is missing, use `local`;
- if no advanced profile exists, use documented local defaults;
- if the vault path is missing in local development, generate a local development vault;
- never write generated secrets into Git.

## Chicle Vault

Chicle Vault is the self-managed secret root for installations that do not use an external secret manager.

Recommended production location:

```txt
/var/lib/chicle/vault
```

Docker volume:

```txt
chicle_vault:/var/lib/chicle/vault
```

Vault responsibilities:

- generate or load the server master key;
- keep master key material outside the database;
- support recovery kit creation during first setup;
- support key rotation with versioned encrypted secrets;
- keep audit metadata for initialization, rotation and restore operations.

Database responsibilities:

- store encrypted secret values;
- store secret metadata;
- store environment profiles;
- store service registry references;
- store audit events.

Security rule:

> The database must never contain enough information to decrypt secrets by itself.

## Secret Encryption Standard

V1 must use:

- AES-256-GCM for authenticated encryption;
- per-secret random IV/nonce;
- authentication tag storage;
- master key outside DB;
- secret versioning;
- masked reads;
- write-only replacement from Admin;
- audit on create, update, rotate, read metadata and export.

The Admin UI must never display the full value of a stored secret after save.

Displayed state:

```txt
JWT_SECRET      Configured · rotated 4 days ago
SMTP_PASSWORD   Configured · ends with 9AF2
AI_API_KEY      Pending
```

## Environment Model

### `environment_profiles`

Stores every available environment.

Suggested fields:

| Field                     | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `id`                      | Stable identifier                                 |
| `key`                     | `local`, `dev`, `qa`, `pre`, `prod` or custom key |
| `name`                    | Human name                                        |
| `kind`                    | `local`, `non_prod`, `production`, `custom`       |
| `active`                  | Whether the environment can be used               |
| `isDefault`               | Current default for authoring                     |
| `requiresReauth`          | Stronger protection for sensitive environments    |
| `createdAt` / `updatedAt` | Audit support                                     |

### `environment_variables`

Stores non-secret values.

Suggested fields:

| Field             | Purpose                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `environmentId`   | Environment                                                      |
| `groupKey`        | `api`, `app`, `ai`, `storage`, `auth`, `deploy`, `microservices` |
| `key`             | Variable key                                                     |
| `value`           | Non-secret value                                                 |
| `valueType`       | `string`, `number`, `boolean`, `json`                            |
| `target`          | `api`, `app`, `worker`, `docker`, `runtime`, `microservice`      |
| `editable`        | Whether Admin may edit                                           |
| `requiresRestart` | Whether API/app restart is required                              |

### `environment_secrets`

Stores encrypted sensitive values.

Suggested fields:

| Field            | Purpose                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| `environmentId`  | Environment                                                                      |
| `scopeType`      | `api`, `app`, `worker`, `integration`, `dynamic_service`, `flow`, `microservice` |
| `scopeKey`       | Logical owner such as `billing`, `smtp`, `ai`, `storage`                         |
| `key`            | Secret key                                                                       |
| `encryptedValue` | Ciphertext                                                                       |
| `algorithm`      | `aes-256-gcm`                                                                    |
| `keyVersion`     | Vault key version                                                                |
| `maskedPreview`  | Safe masked preview                                                              |
| `status`         | `active`, `pending`, `rotating`, `disabled`                                      |
| `lastRotatedAt`  | Rotation audit                                                                   |

### `service_registry`

Stores logical endpoints by environment.

Suggested fields:

| Field               | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `environmentId`     | Environment                                                             |
| `key`               | Logical service key such as `billing`                                   |
| `type`              | `internal_module`, `microservice`, `external_api`, `worker`, `provider` |
| `baseUrl`           | Environment-specific base URL                                           |
| `healthPath`        | Healthcheck path                                                        |
| `authMode`          | `none`, `service_token`, `jwt`, `mtls`, `basic`, `api_key`              |
| `secretRef`         | Reference to `environment_secrets`                                      |
| `timeoutMs`         | Default timeout                                                         |
| `retryPolicy`       | Retry policy                                                            |
| `tlsRequired`       | Required for production external traffic                                |
| `allowedOperations` | Operation allowlist                                                     |
| `active`            | Runtime availability                                                    |

Example:

```json
{
  "environment": "prod",
  "key": "billing",
  "type": "microservice",
  "baseUrl": "http://billing-service:3001",
  "healthPath": "/health",
  "authMode": "service_token",
  "secretRef": "secret:prod.microservice.billing.SERVICE_TOKEN",
  "timeoutMs": 8000,
  "retryPolicy": {
    "attempts": 2,
    "backoffMs": 300
  },
  "tlsRequired": true,
  "allowedOperations": ["invoice.create", "invoice.get"]
}
```

## Secret References

Dynamic objects must use references, not raw secrets.

Allowed:

```txt
{{secret:prod.integration.twilio.AUTH_TOKEN}}
{{secret:qa.microservice.billing.SERVICE_TOKEN}}
{{secret:current.ai.OLLAMA_TOKEN}}
```

Not allowed:

```txt
sk-live-plain-secret
smtp-real-password
hardcoded-jwt-secret
```

The backend resolves references only at execution time, after validating:

- current environment;
- tenant scope;
- user or service permission;
- target resource;
- allowed operation;
- audit policy;
- runtime limits.

## Runtime Config

The frontend must avoid hardcoded production URLs when deployed.

Generated public config example:

```json
{
  "environment": "prod",
  "apiUrl": "/api",
  "appName": "Chicle Engine",
  "features": {
    "aiAssistant": true,
    "dynamicForms": true,
    "flows": true
  }
}
```

This file is public and must never include secrets.

## Artifact Generation

The Environment And Deploy Center can generate deployment bundles.

Generated files may include:

- `docker-compose.local.yml`
- `docker-compose.dev.yml`
- `docker-compose.qa.yml`
- `docker-compose.pre.yml`
- `docker-compose.prod.yml`
- `.env.template`
- `runtime-config.json`
- proxy/nginx configuration;
- healthcheck configuration;
- worker configuration;
- backup configuration;
- deployment checklist.

Secrets must not be written by default into generated artifacts. If an owner explicitly exports a secret-bearing file,
the action requires reauthentication, permission checks, warning confirmation and audit.

## Production Flow

```txt
1. Build artifact once.
2. Tag and publish image or copy artifact bundle.
3. Select environment in Admin.
4. Validate required variables and secrets.
5. Generate runtime config and deployment bundle.
6. Start containers using bootstrap variables and vault path.
7. API loads Confisys, environment profile, service registry and secrets metadata.
8. Healthchecks validate DB, API, AI, storage, workers and microservices.
9. Admin shows environment state and required actions.
```

## AI-Assisted Operation

Chicle AI must use this document when helping with environments, deployment, secrets and microservices.

The assistant can:

- explain what each environment needs;
- detect missing variables;
- detect missing secrets;
- generate safe draft values for non-secret configuration;
- ask for secret values one at a time;
- create masked secret entries after owner confirmation;
- generate runtime config;
- generate deployment bundle previews;
- diagnose CORS, API URL, JWT, AI, storage and microservice errors;
- suggest security fixes;
- explain why a value cannot be stored in JSON or Git.

The assistant cannot:

- reveal stored secret values;
- bypass backend validation;
- publish deployment changes without owner confirmation;
- lower production security without a warning and audit;
- generate raw credentials into examples or docs.

## Security Gates

Production must fail validation when:

- `JWT_SECRET` is missing or weak;
- `CHICLE_CORS_ORIGINS` is missing or uses `*`;
- Swagger is enabled without authentication;
- TLS is not configured for public traffic;
- a microservice uses a secret inline instead of a secret reference;
- a production secret is stored as a plain variable;
- a required healthcheck is missing;
- `CHICLE_SCHEMA_ALLOW_DROP_TABLE` is enabled;
- `CHICLE_ALLOW_SYSTEM_RESET` is enabled;
- AI publish mode is enabled without explicit security policy;
- service-to-service authentication is missing for private microservices that require it.

## V1 Scope

V1 is the secure, self-managed foundation.

### Included

- Default environments: `local`, `dev`, `qa`, `pre`, `prod`.
- Custom environment profiles.
- Environment variables for non-secret values.
- Encrypted environment secrets.
- Chicle Vault with local master key outside DB.
- Recovery kit for first setup and restore.
- Owner/admin Admin UI for environments and secrets.
- Permissions: `env.read`, `env.update`, `secrets.write`, `secrets.rotate`, `deploy.validate`.
- Reauthentication for production secret changes.
- Audit events for create, update, rotate, export and validation.
- Runtime config generator for frontend public config.
- Service Registry for logical endpoints.
- Microservice endpoint records by environment.
- Healthcheck validation for API, DB, AI, storage and registered services.
- Security validator for production readiness.
- AI-assisted diagnosis and safe draft generation.
- Documentation and examples for the assistant.

### Not Included

- External Vault/KMS adapters.
- Kubernetes manifests.
- Full artifact promotion pipelines.
- Automatic secret rotation across external providers.
- Multi-region deployment orchestration.
- Blue/green or canary release automation.
- mTLS certificate lifecycle automation.

### V1 Acceptance Criteria

- Local starts with defaults.
- Server setup requires only bootstrap DB and vault path values.
- Owner can configure `dev`, `qa`, `pre` and `prod` from one Admin screen.
- Secrets are never stored plain in DB.
- Secrets are never returned fully to the frontend after save.
- Runtime config can be generated without rebuilding the frontend.
- A microservice can be registered and called by logical key.
- Production validation detects unsafe CORS, weak JWT, exposed Swagger and dangerous development flags.
- Chicle AI can explain missing configuration and propose safe next actions.

## V2 Scope

V2 adds advanced deployment, enterprise integrations and deeper operational automation.

### Included

- External secret provider adapters:
  - HashiCorp Vault;
  - AWS KMS/Secrets Manager;
  - Azure Key Vault;
  - Google Secret Manager;
  - Kubernetes Secrets.
- Artifact promotion between environments.
- Deployment bundle versioning.
- Rollback plans for environment config.
- Advanced microservice registry:
  - operation contracts;
  - per-operation auth;
  - circuit breaker policy;
  - rate limits;
  - dependency graph;
  - compatibility checks.
- Worker and async service topology management.
- Deployment health dashboard.
- API performance checks.
- security audit checks;
- code quality audit integration points;
- backup and restore drill validation.
- AI-assisted remediation plans with staged execution.
- Secret rotation workflows with provider-specific adapters.
- Export/import of sanitized environment templates.

### Not Included Unless Explicitly Enabled

- Automatic public DNS changes.
- Automatic certificate purchase or renewal.
- Automatic cloud account provisioning.
- Arbitrary shell execution from Admin.
- Direct editing of production server files without generated, reviewed artifacts.

### V2 Acceptance Criteria

- A team can promote a tested environment profile from `qa` to `pre` and `prod`.
- Chicle can validate registered microservice compatibility before deploy.
- Chicle can use an external secret provider without changing dynamic service/form/flow contracts.
- Operators can see service health, dependency state and deployment risks from Admin.
- AI can diagnose environment failures using logs, healthchecks, docs and current environment state.

## Owner Experience

The Admin screen should be task-oriented:

```txt
Environment: prod
Status: 82% ready
High risks: 2
Warnings: 3
Next action: Configure JWT secret and restrict CORS.
```

Primary tasks:

- Configure environment.
- Configure public URLs.
- Configure secrets.
- Register microservice.
- Generate runtime config.
- Generate deployment bundle.
- Validate environment.
- Review audit.

The user should not need to know whether Chicle writes one file or several files. The screen owns the experience and
the generated artifacts remain inspectable.

## Microservice Experience

When a module is separated into a microservice, existing dynamic objects should not hardcode its URL.

Use logical operations:

```json
{
  "target": {
    "type": "microservice",
    "key": "billing"
  },
  "operation": "invoice.create",
  "payloadMap": {
    "tenantId": "{{tenant.id}}",
    "amount": "{{input.amount}}"
  }
}
```

The Service Registry resolves:

- current environment;
- base URL;
- auth mode;
- secret reference;
- timeout;
- retry;
- health status;
- allowed operation.

This makes microservice extraction dynamic and avoids rewriting forms, flows or services when deployment topology
changes.

## Documentation Set

This module should be documented through:

- this roadmap and scope document;
- an implementation contract after V1 starts;
- JSON examples for environment profiles, secrets, runtime config and service registry;
- AI authoring guide additions;
- Admin UI usage guide;
- security validation checklist;
- recovery kit procedure;
- production deployment checklist.

## Decision

Chicle will use:

```txt
Environment And Deploy Center
+ Chicle Vault
+ Environment Profiles
+ Runtime Config
+ Service Registry
+ Artifact Generator
+ Security Validator
+ Chicle AI assistance
```

V1 delivers the secure self-managed foundation. V2 adds enterprise providers, promotion workflows and advanced
operational automation.
