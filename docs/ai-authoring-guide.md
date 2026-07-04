# Official authoring guide for humans and AI

This is the entry point for any person or AI generating configuration for Chicle Engine. The database stores
declarative objects; executable authority, tenant scope, permissions, timeouts and network restrictions remain in the
backend.

## Source of truth

Read these files in order:

1. `docs/dynamic-services-contract.md`
2. `docs/flow-contract.md`
3. `docs/examples/dynamic-services.examples.json`
4. `docs/examples/flows.examples.json`
5. `docs/examples/flow-step-catalog.examples.json`
6. `docs/examples/flow-runtime.examples.json`
7. `docs/ui-components.md`
8. `docs/ui-component-inventory.md`
9. `docs/ui-presentation-architecture.md`
10. `docs/examples/ui-presentation.examples.json`
11. `docs/formly-architecture.md`
12. `docs/examples/dynamic-form-formly.examples.json`

The TypeScript contracts remain authoritative when documentation and code differ:

- Dynamic services: `apps/api/src/modules/dynamic-services/dynamic-service-version.entity.ts`
- Flow definition: `apps/api/src/modules/flows/flow-version.entity.ts`
- Flow authoring requests: `apps/api/src/modules/flows/flows.service.ts`
- Flow runtime limits: `apps/api/src/modules/flows/flow.entity.ts`
- Visual component registry: `apps/app/src/app/shared/ui-component-catalog.ts`
- UI presentation contract: `apps/app/src/app/core/ui/ui-presentation.types.ts`
- Form schema adapter: `apps/app/src/app/engine/forms/formly/formly-schema-adapter.service.ts`

## Generation rules

- Output strict JSON. Never include comments, trailing commas, functions or executable source code.
- Use `snake_case` keys with 3-120 characters for services and flows.
- Treat every identifier, table, field, service and flow key as tenant-scoped unless the contract states otherwise.
- Never generate SQL. Internal services use `dataTarget` and validated filters.
- Never put credentials directly in an example or persisted definition. Use placeholders resolved from an approved
  secure input or future secret provider.
- Use only documented step types, operators and template paths.
- Set explicit `onErrorStepKey`, `onTimeoutStepKey`, `onFalseStepKey` or `onTrueStepKey` when failure or branching
  changes the route.
- Give every flow step a unique `key`, `position` and `outputKey`.
- Prefer the visual designer. JSON editing is an advanced synchronized representation, not a separate execution path.
- Create metadata first, then a draft version, test it, publish it and only then execute it from another component.
- Keep forms and screens library-neutral. Use the optional `presentation` contract; never emit Angular selectors,
  PrimeNG/Ionic component tags or library CSS classes in stored JSON.
- Never store Formly functions or JavaScript expressions. Conditional fields use the documented `visibleWhen` object.

## Validation checklist

Before proposing an object:

1. The JSON parses with a standard parser.
2. Every referenced service or subflow key exists and is published.
3. Every mapped path starts from `input`, `tenant`, `user` or `steps`.
4. Every next/branch key names a step in the same flow.
5. Required input fields have realistic example values.
6. Timeouts and retries remain within Confisys limits.
7. Internal queries use a table and columns returned by `GET /api/dynamic-services/catalog/tables`.
8. The draft passes preview and saved test cases before publication.
9. Presentation kits are installed and valid; current values are `auto`, `inherit`, `primeng`, `ionic` and `native`.

## Unsupported assumptions

Do not claim these capabilities are implemented until the backend contract changes:

- Free SQL from the UI.
- Internal multi-table joins or `advanced_read_model` execution. They are represented for future design but only
  `single_table` is executed today.
- Arbitrary JavaScript in formulas or validations.
- Unlimited recursion, retries, response size, delay, concurrency or execution time.
- Direct access to password, token, secret or hash columns.
