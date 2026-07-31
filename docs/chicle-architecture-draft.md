# Chicle Architecture Draft

## Status

This document is a draft for the named architecture Chicle is evolving toward.

It does not replace the current platform architecture. It gives the project a precise architectural language for the
next decisions, especially when the platform grows through installable capabilities, generated apps, event processing,
runtime contracts and optional service extraction.

## Working Name

Technical name:

> Chicle Architecture

Expanded definition:

> Chicle Architecture is a dynamic, administrable, event-driven and microkernel platform architecture for building,
> operating and exporting configurable digital products.

Short definition:

> Chicle is an Event-Driven Microkernel for dynamic product factories.

## Why A Named Architecture

Chicle is using several proven architecture ideas:

- Event-Driven Architecture for runs, jobs, outbox, audit, retries, integration events and async work.
- Microkernel Architecture for a stable core with installable capabilities, adapters, templates and plugins.
- Metadata-Driven Architecture for services, forms, flows, screens, menus, texts, themes and app contracts.
- Contract-First Architecture for validation, versioning, tests, publication, rollback and runtime safety.
- Multi-Tenant Architecture for isolated organizations, apps, permissions, data and preferences.
- Multi-Target Runtime for admin, web, mobile, desktop, public and embedded artifacts.

The Chicle Architecture draft is the synthesis of those patterns. It gives the project one architectural identity
without pretending that every known pattern is the same thing.

## Core Thesis

Chicle keeps a small governed kernel and moves product variability into safe dynamic contracts.

The kernel owns:

- tenant scope;
- auth and RBAC;
- contract validation;
- versioning and publication;
- event recording;
- audit;
- runtime limits;
- adapter boundaries;
- secret boundaries;
- install and export rules.

Everything that changes per customer, product, app or process should become:

- metadata;
- a versioned contract;
- a reusable component;
- a capability;
- a template;
- an adapter;
- a flow;
- a dynamic service;
- a text package;
- a screen or app definition.

## Architecture Shape

```txt
Admin / App Factory
  -> Tenant + Auth/RBAC
  -> Kernel API
  -> Dynamic Runtime
  -> Events / DB / Registered Services
  -> Generated Apps And Artifacts
```

The Admin is the control plane. It creates and governs apps, screens, forms, services, flows, translations,
preferences, themes, secrets, environments, schema changes and templates.

Generated apps are runtime artifacts. They do not own private secrets or custom backend logic. They execute published
contracts through the API and local bundled fallbacks when needed.

## Event-Driven Side

Chicle uses events to coordinate work without turning every module into a hard dependency.

Events should exist for:

- dynamic service execution;
- form submit execution;
- flow execution;
- flow step execution;
- record lifecycle;
- audit;
- outbox dispatch;
- background jobs;
- AI-assisted authoring;
- app publication;
- template install/export;
- security-sensitive operations;
- deploy and environment changes.

Events are not a replacement for direct validation. The backend still validates permissions, tenant scope, schemas,
limits and contracts before an event is accepted.

## Microkernel Side

The kernel must stay stable and small enough to trust.

The kernel should expose extension points for:

- dynamic services;
- dynamic forms;
- flows;
- actions;
- UI components;
- visual kits;
- text packages;
- app templates;
- app targets;
- AI providers;
- storage providers;
- auth providers;
- device capabilities;
- integration adapters;
- background workers;
- public API exposure policies.

Extensions can be installed, enabled, disabled, versioned, tested, audited and removed without rewriting the kernel.

## Metadata-Driven Side

Chicle avoids customer-specific code paths by storing product behavior as validated metadata.

Metadata can define:

- screens;
- app navigation;
- form steps and fields;
- service filters, joins, write maps and public exposure rules;
- flow triggers, steps, decisions and response shape;
- component layout;
- text keys;
- themes;
- permissions;
- app artifact preferences;
- environment bindings.

Metadata must not contain:

- raw SQL from the user or AI;
- arbitrary JavaScript to execute;
- secrets;
- unvalidated URLs;
- cross-tenant references;
- unpublished private object references.

## Ten Precepts Alignment

The Chicle Architecture draft must stay aligned with the ten platform precepts:

1. Flexible: product differences are solved through contracts, templates, adapters and capabilities.
2. Adaptable: Chicle can run in different infrastructure and architecture styles without changing product contracts.
3. Dynamic and Administrable: every configurable behavior is managed from Admin with lifecycle, audit and cache rules.
4. Reusable: modules, visual components, services, flows, templates and adapters are reused across products.
5. High Quality: contracts, examples, tests and validators protect maintainability.
6. Secure: no dynamic path bypasses tenant scope, RBAC, validation, limits or audit.
7. Scalable: modules can scale vertically, horizontally or through controlled extraction.
8. Reliable and Resilient: events, runs, retries, defaults, rollback and audit keep the system recoverable.
9. Extensible: new product capabilities are installed through controlled extension points.
10. Intelligent: AI assists authoring but the backend remains the execution authority.

## Evolution Rules

Chicle can evolve without a rewrite if these rules are respected:

- Do not make generated apps depend on private implementation details.
- Do not let templates contaminate the kernel.
- Do not expose secrets to frontend artifacts.
- Do not execute arbitrary user code from metadata.
- Do not let AI publish or mutate production state without backend validation and user authorization.
- Do not create page-local UI primitives when a reusable component should exist.
- Do not split a module into a microservice unless the logical contract remains stable.
- Do not use events to hide synchronous validation errors.
- Do not allow cache to make Admin and runtime disagree about the active contract.

## Service Extraction Rule

Chicle can run as a compact modular API or as separated services.

The extraction rule is:

> A capability may move out of the API only when it keeps the same logical contract, service registry key, security
> model, audit model and deployment configuration path.

This allows a module to become a worker or microservice without forcing forms, flows, screens or generated apps to be
rewritten.

## Draft Decision

Use this phrase when describing the evolved architecture:

> Chicle Architecture is an Event-Driven Microkernel Architecture powered by versioned metadata, reusable components,
> validated contracts and administrable product factories.

Use this phrase when explaining why Chicle is not just a CMS or low-code tool:

> Chicle separates product variability from the trusted kernel. Business behavior changes through contracts; execution
> remains governed by the kernel.

