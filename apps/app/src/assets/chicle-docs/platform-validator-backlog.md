# Platform Validator Backlog

This document records the pending checks for the future Chicle Platform Validator. It is not an implementation plan for the current sprint. It is a backlog of quality, architecture, security and maintainability validations that must become automated as the platform grows.

The first version of the validator must run in read-only audit mode. It should report risks, percentages and exact file/object references without modifying code, database rows or generated artifacts.

## Purpose

The validator protects the Chicle principles by continuously checking that dynamic behavior remains seedable, secure, reusable, translatable, testable and free from hardcoded assumptions.

It must validate the Admin, API, runtime contracts, database metadata, generated apps, templates and documentation as one platform, not as isolated projects.

## Operating Model

The validator should produce a structured report with:

- status: pass, warning or fail;
- category: architecture, data, UI, i18n, tests, security, code quality or runtime;
- severity: blocker, high, medium or low;
- evidence: file path, table, endpoint, route, translation key, component selector or migration;
- recommendation: concrete next action;
- score: percentage when the check can be measured.

The first target is observability. Enforcement comes later, once the checks are stable.

## Pending Checks

### Dynamic Database Seeds

Validate that every dynamic object required at startup has an initial seed or a safe default path.

Checks:

- Every DB-backed dynamic feature has a minimum seed: menus, permissions, roles, confisys, text bundles, service templates, flow templates, form templates, app templates and runtime defaults.
- Required seed records are idempotent.
- Seed keys are stable and do not depend on display text.
- Seeds do not create product-specific contamination.
- Trash records do not block new objects with the same key unless restore conflict handling requires it.
- Default values exist when confisys or environment values are unavailable.

Expected report:

- seed coverage percentage by module;
- missing seed list;
- duplicate seed key list;
- unsafe seed mutation list.

### Dynamic Text Coverage

Validate that Admin and generated apps do not depend on hardcoded user-facing text when a dynamic text key should exist.

Checks:

- Admin navigation, page headers, buttons, empty states, validation messages and runtime errors use text keys or a documented exception.
- Dynamic Forms, Services, Flows, Screens and Apps can generate text keys during authoring.
- Form field labels, placeholders, help text, button text and messages can be externalized.
- Assistant-generated contracts prefer text keys for reusable app artifacts.
- Local fallback bundles exist for offline and first-load scenarios.

Expected report:

- dynamic text coverage percentage;
- hardcoded visible text candidates;
- missing text key candidates;
- local fallback gaps.

### Translation Quality

Validate multilingual consistency across supported locales.

Checks:

- Every key in the default locale exists in every installed locale.
- Placeholder variables match across languages.
- No locale contains stale keys that are no longer used.
- Default locale is configurable by environment, tenant, artifact and user preference according to the i18n architecture.
- Generated app packages include their default text bundle.

Expected report:

- locale completeness percentage;
- missing keys by locale;
- placeholder mismatch list;
- unused key list.

### Runtime Cache And Admin-Frontend Consistency

Validate that values changed from the Admin, backend seeds or runtime configuration are reflected correctly in the frontend without stale cache bugs.

Checks:

- Backend responses, database rows and frontend-visible values match after an Admin update.
- Text bundles, menus, preferences, confisys public values, theme preferences, app/screen contracts and published dynamic objects expose a version, hash, timestamp or revision suitable for cache invalidation.
- Frontend local caches use explicit schema/cache versions and are invalidated when runtime contracts change.
- The app refreshes dynamic menus, text bundles and preferences after login, language changes, tenant changes, publish actions and explicit Admin refresh actions.
- Seed-owned values can be updated by a new seed version without overwriting user-managed values.
- User-managed values remain authoritative unless a migration or explicit Admin action changes them.
- Offline fallback data is marked as fallback and replaced when the API becomes available.
- The validator can compare API output against browser-local cached values during UI smoke checks.

Expected report:

- stale cache risk list;
- backend/frontend mismatch list;
- cache key without version list;
- dynamic object without revision/hash list;
- seed-owned value drift list;
- user-managed overwrite risk list.

### Component Reuse

Validate that Admin pages use reusable UI primitives instead of isolated page-local controls.

Checks:

- Each Admin route is mapped to shared shells, module headers, catalog layouts, cards, tabs, buttons, fields, JSON editors, empty states, process steps and preview components.
- Page-local controls are allowed only with a documented domain exception.
- Large designer pages do not add new visual patterns directly without registering reusable components.
- Component inventory and implementation stay aligned.

Expected report:

- structural reuse percentage by route;
- page-local CSS/control count;
- missing reusable component candidates;
- undocumented exceptions.

### Multi-Kit Transformation

Validate that reusable components can render through the active visual kit without breaking behavior.

Checks:

- Core controls support PrimeNG, Ionic, Material, Bootstrap-compatible and native fallback modes where required.
- Inputs, selects, textareas, buttons, cards, tabs, chips, modals, lists, tables, JSON editors and preview shells have an adapter or an explicit exception.
- Kit changes apply consistently across Admin pages and generated app previews.
- Dark mode, density, radius and palette tokens do not break layout.
- Ionic adapters preserve mobile/Capacitor behavior for generated mobile apps.

Expected report:

- multi-kit coverage percentage;
- missing adapter list;
- visual token exception list;
- known component parity gaps.

### Unit And Integration Tests

Validate test coverage for critical platform behavior.

Checks:

- API modules have focused unit tests for services, guards, validators and authoring contracts.
- Dynamic Services cover read, write, filters, joins, publish, trash/restore, public execution and security constraints.
- Dynamic Forms cover JSON authoring, preview, service binding, record persistence, validation and runtime submit.
- Flows cover steps, triggers, tests, preview, execution, queue and observability.
- App Studio covers app/screen lifecycle, tenant scope, versions, navigation and trash/restore.
- Frontend tests cover reusable components and critical user flows.

Expected report:

- test coverage percentage by package and module;
- critical module without tests;
- skipped or disabled test list;
- stale test fixtures.

### Duplicate Code

Validate duplicated logic and repeated UI patterns.

Checks:

- Repeated TS/HTML/SCSS blocks above the accepted threshold are reported.
- Similar page-local button, field, card, catalog and layout implementations are flagged.
- API DTO, validation and mapping duplication is flagged when a shared contract exists.
- Assistant heuristics and JSON generation helpers are not copied independently by domain.

Expected report:

- duplicate code percentage;
- top repeated blocks;
- suggested shared component or helper target.

### Security Validations

Validate that platform security remains explicit and consistent.

Checks:

- Auth guards protect all non-public API endpoints.
- Tenant scope is enforced for tenant-owned data.
- RBAC checks exist for Admin modules, dynamic services, flows, forms, apps, DB designer, environments and secrets.
- Public Dynamic Services require an explicit public policy.
- Swagger, setup reset, DB designer and environment/secrets features cannot become production holes.
- Secrets are never stored in JSON contracts, docs, examples, logs or frontend bundles.
- Passwords are hashed and never returned.
- CORS, security headers, cookies, token lifetime and refresh strategy match the security architecture.
- Audit events exist for sensitive actions.

Expected report:

- unguarded endpoint list;
- tenant-scope risk list;
- permission gap list;
- secret exposure candidates;
- security header and production config findings.

### Hardcoded Configuration

Validate that configurable behavior is not trapped in source code.

Checks:

- Ports, base URLs, provider URLs, tenant IDs, app keys, roles, colors, text, feature flags and timeouts use confisys, environment config, text bundles or artifact preferences as appropriate.
- Dynamic Services, Forms, Flows and Apps expose configurable timeouts and limits with safe defaults.
- Frontend runtime config can be loaded without rebuilding for deploy-time values.
- Local defaults exist for development bootstrap.

Expected report:

- hardcoded config candidates;
- unsupported environment override list;
- missing confisys/default fallback list.

### Broken Or Obsolete Code

Validate dead routes, stale contracts and unused artifacts.

Checks:

- Routes referenced by menus exist.
- Frontend API clients match backend endpoints.
- Obsolete components, CSS classes, assets and translation keys are detected.
- Migrations are ordered and not duplicated.
- Docs point to existing files.
- JSON examples validate against current contracts.
- No generated or legacy names pollute core architecture.

Expected report:

- dead route list;
- broken endpoint/client mapping;
- unused asset/component candidates;
- stale docs links;
- invalid example contracts.

### Dynamic Contract Validity

Validate that all stored and example JSON contracts are executable under the current runtime.

Checks:

- Dynamic Service JSON validates before save, version, publish and execute.
- Dynamic Form JSON validates before save, version, publish and preview submit.
- Flow JSON validates before save, version, publish, preview and execute.
- App and Screen JSON validates before save, version, publish and runtime rendering.
- Versioned contracts remain immutable after publication.
- Draft, published and trash states follow the same lifecycle rules across all builders.

Expected report:

- valid contract percentage by object type;
- invalid draft/published contracts;
- lifecycle rule violations;
- schema drift findings.

### Database And Migration Safety

Validate schema safety for core and custom tables.

Checks:

- Core tables are not modified by the custom DB designer.
- Custom table operations generate preview SQL, schema history and TypeORM migration content.
- Migration names and timestamps are ordered.
- Custom table deletion requires owner-only confirmation and is marked development-only unless promoted by policy.
- Runtime does not depend on `synchronize: true`.
- Idempotency and audit fields exist where required.

Expected report:

- migration ordering issues;
- custom schema drift;
- unsafe table operation candidates;
- missing audit/idempotency fields.

### AI And RAG Readiness

Validate that Chicle AI can use official platform knowledge instead of guessing.

Checks:

- The AI guide references all active contracts, JSON examples and architecture docs.
- RAG source documents are current and synced to the app asset bundle.
- Assistant responses can be traced to known contracts, schema catalogs or user decisions.
- Long-running AI tasks degrade into guided steps instead of timeout loops.
- The assistant never saves or publishes without explicit user approval unless a policy later allows it.

Expected report:

- RAG source freshness;
- missing AI guide references;
- unsupported assistant action list;
- timeout and loop-risk findings.

## Target Scores

Initial reporting targets:

| Area | Target |
| --- | ---: |
| Dynamic seed coverage | 100% for startup-critical modules |
| Dynamic text coverage | 100% for Admin navigation and primary pages |
| Translation completeness | 100% for installed locales |
| Runtime cache consistency | 100% for Admin navigation, text bundles, preferences and published runtime objects |
| Component reuse | 100% for shared Admin shell and common controls |
| Multi-kit transformation | 100% for P0 components |
| Critical tests | 100% for security, tenant scope and dynamic runtime contracts |
| Duplicate code | Below an agreed threshold per module |
| Hardcoded configuration | Zero critical findings |
| Security blockers | Zero |
| Broken routes/docs/contracts | Zero |

## Suggested Validator Phases

### Phase 1: Read-Only Inventory

Collect files, routes, components, docs, translations, migrations, seeds, endpoints and database metadata. Produce a report without scoring enforcement.

### Phase 2: Scored Audit

Add percentages and severity. Report regressions but do not fail builds.

### Phase 3: CI Gate For Blockers

Fail only on security blockers, broken builds, invalid contracts, missing critical seeds and broken migrations.

### Phase 4: Full Platform Quality Gate

Enforce agreed thresholds for reuse, translation, tests, duplication, hardcoded configuration and obsolete code.

## Documentation Rules

Every new validator check must include:

- what it validates;
- why it protects the platform;
- how it measures the result;
- what files, tables or endpoints it inspects;
- what a fix normally looks like;
- whether it can block CI.

The validator must stay aligned with:

- `docs/platform-architecture.md`
- `docs/architecture.md`
- `docs/security-auth-review.md`
- `docs/i18n-text-architecture.md`
- `docs/ui-components.md`
- `docs/ui-component-inventory.md`
- `docs/ui-presentation-architecture.md`
- `docs/dynamic-services-contract.md`
- `docs/dynamic-forms-contract.md`
- `docs/flow-contract.md`
- `docs/screen-app-designer-architecture.md`
- `docs/app-template-factory-architecture.md`
