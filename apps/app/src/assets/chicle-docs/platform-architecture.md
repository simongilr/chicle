# Chicle Platform Architecture

## Formal Name

Technical name:

> Event-Driven, Metadata-Driven and Microkernel Platform Architecture for a Digital Product Factory.

Short name:

> Chicle Platform Architecture.

Product phrase:

> Chicle is a flexible factory for configurable digital products.

## Definition

Chicle is a modular, extensible, multi-tenant and multi-target platform for building digital products from versioned
metadata, events, JSON contracts, templates, declarative services, dynamic forms, flows, actions, reusable visual
components and installable capabilities.

Technical definition:

> Chicle is an event-driven and metadata-driven platform with a microkernel architecture, dynamic runtime, tenant
> security, versioned contracts and adapters for multiple execution targets.

NestJS modules, Angular/Ionic, MariaDB and Docker are implementation technologies. They do not define the primary
architecture. The primary pattern is the platform itself: events, metadata, contracts, extensibility and multi-target
execution.

## What Chicle Is Not

Chicle is not a closed application.

Chicle is not only a CMS.

Chicle is not only a form generator.

Chicle is not a rigid backend tied to one business vertical.

Chicle does not execute arbitrary code stored by users or AI.

Chicle does not depend on copying code per customer. Business differences live in templates, services, forms, flows,
screens, components, adapters, permissions, data and configuration.

## Architectural Mix

| Pattern                          | Role In Chicle                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Event-Driven Platform            | Events, runs, outbox, jobs, audit, retries and workers coordinate processes without coupling domains. |
| Metadata-Driven Architecture     | Services, forms, flows, actions, menus, screens and presentation are expressed as versioned metadata. |
| Microkernel Architecture         | The kernel keeps stable contracts; plugins, templates, adapters and capabilities extend the system.   |
| Template-Based Product Engine    | Business verticals are installed as templates and do not contaminate the core.                        |
| Low-Code/Internal Platform       | Owners and admins configure behavior through guided interfaces or validated JSON.                     |
| Multi-Target Application Factory | One contract can render in web, mobile, desktop, admin or embedded interfaces through adapters.       |
| Adapter / Strategy               | AI, storage, auth, UI kits, integrations, devices and messaging can change by adapter.                |
| Contract First                   | Every dynamic object has a contract, backend validation, examples, versions, tests and publication.   |

## Execution Shape

Chicle runs through separable contract-based pieces:

```txt
Admin
Web / mobile / desktop apps
Tenant + Auth/RBAC
API Kernel
Dynamic Runtime
DB
Event Engine
Chicle AI
Workers / backup
Audit / quality / performance
Docker / artifacts
```

The local installation may start only the pieces required for the environment, but the contracts remain the same:
services, forms, flows, actions, events, permissions, data and components keep the same definition.

The official communication flow is:

```txt
Admin / Apps -> Tenant + Auth/RBAC -> API Kernel -> Runtime -> DB/Events
```

Admin concentrates everything that is administrable, designable and configurable. Web, mobile and desktop apps are
business apps and deployable artifacts that execute what Admin publishes through the API. Docker packages and delivers
artifacts; it does not govern audit, quality or performance. Those capabilities belong to Chicle operational support.

## Architectural Precepts

Chicle is governed by ten precepts. Every technical decision must align with them:

1. Flexible: solves specific customer and vertical needs without closing the core.
2. Adaptable: coexists with different deployments, providers, targets, integrations and architecture styles.
3. Reusable: modules, components, services, contracts, adapters and capabilities are designed to be reused.
4. Quality: the system is readable, tested, maintainable and verifiable.
5. Secure: every dynamic runtime path operates with permissions, tenant scope, validation, limits and audit.
6. Administrable: every important object can be viewed, configured, tested, audited, restored and published.
7. Scalable: supports vertical and horizontal scaling while protecting concurrency, connections, jobs, events and idempotency.
8. Reliable and resilient: records failures, preserves traceability, applies defaults and supports recovery.
9. Extensible: grows through plugins, templates, adapters, capabilities, actions, flows and controlled migrations.
10. Intelligent: AI interprets, asks, proposes, validates and applies reviewable drafts without bypassing the backend.

## Kernel

The Chicle kernel contains:

- Security: auth, sessions, tenant scope, RBAC, permissions, policies and audit.
- Dynamic runtime: dynamic services, dynamic forms, flows, actions, records and bindings.
- Contracts: JSON schema, versioning, publication, tests, history and trash.
- Administration: confisys, menus, preferences, DB designer, schema changes and controlled migrations.
- Environment and deploy: environment profiles, Chicle Vault, runtime config, service registry, generated artifacts,
  validation and deployment audit.
- Events: audit events, service runs, form runs, flow runs, outbox, jobs and retries.
- Adapters: UI kits, AI, storage, integrations, devices, messaging and targets.

## Templates, Plugins And Capabilities

Templates and plugins declare:

- manifest;
- permissions;
- dependencies;
- dynamic services;
- forms;
- flows;
- screens;
- actions;
- components;
- seeds;
- controlled migrations;
- assets;
- documentation;
- tests;
- compatibility;
- rollback.

The core does not contain product-specific rules. Product-specific rules live in installable capabilities and
tenant configuration.

## Declarative Runtime

Chicle stores behavior as validated JSON, not as arbitrary code.

Allowed:

- service definitions;
- dynamic forms;
- flows;
- action bindings;
- data bindings;
- presentation profiles;
- role resource policies;
- templates;
- plugins;
- examples and tests.

Not allowed:

- arbitrary JavaScript from the database;
- raw SQL generated by users or AI;
- secrets inside JSON contracts;
- data leaking from one tenant to another;
- publication without backend validation.

## Multi-Target

The same contract can feed:

- admin;
- mobile app;
- desktop app;
- web portal;
- embedded screen;
- automated flow;
- AI assistant.

Presentation uses adapters and tokens. The functional contract remains independent from PrimeNG, Ionic, Material,
Bootstrap or any installed visual kit.

## Event-Driven

Chicle records and coordinates activity with events:

- audit events;
- dynamic service runs;
- dynamic form runs;
- flow runs;
- flow step runs;
- flow jobs;
- flow outbox events;
- record events;
- integration events.

The owning module transaction keeps immediate consistency. Events coordinate derived processes, observability,
notifications, retries, workers, websockets, offline sync, backup and integrations.

## AI-Assisted And Backend-Validated

Chicle AI helps create and adjust configuration. AI is not the execution authority.

The final authority is the backend:

- validates contracts;
- validates real tables and fields;
- validates permissions;
- validates tenant scope;
- validates limits;
- records audit;
- creates versions;
- publishes only when the screen or authorized user confirms.

## Decision

Use this definition in technical documentation:

> Chicle uses an Event-Driven, Metadata-Driven and Microkernel Platform Architecture.

Use this definition for product language:

> Chicle is a configurable digital product factory.

Use this definition for implementation:

> Chicle executes versioned dynamic contracts on a modular, secure, extensible, event-driven, multi-tenant,
> multi-target kernel assisted by backend-validated AI.
