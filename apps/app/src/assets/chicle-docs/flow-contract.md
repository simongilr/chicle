# Flow JSON contract

Chicle Flow Engine stores a versioned declarative graph. A flow receives input, runs typed steps, records outputs under
`steps`, chooses explicit branches and returns the selected response. It does not execute arbitrary JavaScript.

## Lifecycle

1. Create metadata with `POST /api/flows`.
2. Replace the editable definition with `PUT /api/flows/:flowId/definition`.
3. Preview the draft with `POST /api/flows/:flowId/preview`.
4. Save and run test cases.
5. Create a version and publish it.
6. Discover allowed published flows with `GET /api/flows/available`.
7. Execute by key, enqueue a durable job or connect a trigger.

The frontend uses `DynamicFlowClientService`; published flows become discoverable without adding a new API client
method.

## Authoring document

The visual designer and advanced JSON editor use the same request:

| Field | Meaning |
| --- | --- |
| `flow` | Stable metadata: key, name, description, category and runtime configuration |
| `entry` | How the flow starts: `direct`, `manual`, `http`, `form_submit`, `record_event` or `schedule` |
| `inputFields` | Human-editable input contract and examples |
| `steps` | Ordered graph nodes |
| `output` | Response step and `responseTo=caller` |

Current `inputFields.type` values are `text`, `number`, `boolean`, `email` and `date`. Array/object schema fields are a
known requirement for Dynamic Forms and must be added before the designer claims typed collection inputs.

Every step accepts:

- `key`, `name`, `type`, `position`, `outputKey`
- `config` and `inputMap`
- `nextStepKey`
- `onSuccessStepKey`, `onErrorStepKey`, `onTimeoutStepKey`
- `onTrueStepKey`, `onFalseStepKey`
- optional per-step `runtimeConfig` and visual `ui`

When versioned, the backend normalizes these names into `next`, `onSuccess`, `onError`, `onTimeout`, `onTrue` and
`onFalse` in `FlowDefinitionStep`.

## Execution context

Paths and templates use four roots:

- `input`: original flow input.
- `tenant`: authenticated tenant.
- `user`: authenticated user.
- `steps`: outputs indexed by each step `outputKey`.

An exact template such as `"{{steps.total}}"` preserves the original JSON type. Text containing a template converts
the inserted value to text.

`inputMap` builds the input for a service or subflow:

```json
{
  "email": "{{input.email}}",
  "customer": "{{steps.customer.response.mapped.user}}"
}
```

## Step catalog

| Type | Required configuration | Purpose |
| --- | --- | --- |
| `start` | none | Exposes original input |
| `dynamic_service` | `serviceKey` | Executes a published dynamic service |
| `parallel` | at least two `branches` | Executes service branches concurrently |
| `foreach` | `itemsPath`, `serviceKey` | Executes a service for each array item |
| `subflow` | `flowKey` | Executes a published child flow |
| `delay` | `durationMs` | Waits in a real run; simulates in preview |
| `emit_event` | `eventKey`, optional payload | Writes a durable outbox event |
| `formula` | JSON Logic `rule` | Produces a value |
| `validation` | field/operator/value or rule | Validates and branches/fails |
| `decision` | JSON Logic `rule` | Chooses true/false branch |
| `action` | `action` | Returns a declarative instruction for a consumer |
| `response` | `status`, `body` | Builds the explicit caller response |
| `end` | none | Returns the last output |

Exact fragments for every type live in `docs/examples/flow-step-catalog.examples.json`.

## Expressions and validation

Formula and decision rules use JSON Logic. Supported operators include variable lookup, missing checks, conditionals,
comparisons, boolean operators, arithmetic, array operations, merge, membership, concatenation and substring.

Validation operators:

- `required` / `not_empty`
- `equals` / `not_equals`
- `greater_than` / `min`
- `less_than` / `max`
- `contains`
- `email`

Confisys limits expression length and depth. Unknown operators are rejected.

## Runtime configuration

Flow or step configuration can define:

```json
{
  "maxDurationMs": 30000,
  "maxSteps": 100,
  "defaultStepTimeoutMs": 8000,
  "retry": {
    "attempts": 1,
    "backoffMs": 300
  },
  "logs": {
    "captureInput": true,
    "captureOutput": true,
    "maskSecrets": true
  }
}
```

The backend clamps values against Confisys. `foreach` also limits items and concurrency; subflows limit nesting and
reject recursion; delay and retries have upper bounds.

## Triggers

| Type | Key example | Relevant config |
| --- | --- | --- |
| `manual` | `reprocess_order` | `inputMode` |
| `http` | `order_received` | secret of at least 16 characters, `inputMode` |
| `record_event` | `record.created` | `inputMode` |
| `form_submit` | form key | `inputMode` |
| `schedule` | `daily_reconciliation` | `intervalSeconds`, `input` |

HTTP hooks live under `/api/flow-hooks/:tenantSlug/:triggerKey`. Secrets are hashed; they are not returned by the API.
Durable executions use an idempotency key and jobs can be retried or cancelled.

## Testing and observability

- Preview can stop at `throughStepKey`.
- Test cases target `draft` or `published`.
- Assertions support `equals`, `not_equals`, `contains`, `exists`, `truthy`, `greater_than`, `less_than`.
- Runs and step runs record status, duration, sanitized snapshots and errors.
- SSE `/api/flows/live` emits tenant-scoped progress.
- Observability endpoints require `flows.audit`.

## Canonical examples

- Complete authoring documents: `docs/examples/flows.examples.json`
- Every step type: `docs/examples/flow-step-catalog.examples.json`
- Execution, preview, queue, triggers and tests: `docs/examples/flow-runtime.examples.json`
