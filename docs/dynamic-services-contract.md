# Dynamic services JSON contract

Dynamic services are tenant-owned declarative adapters. A service has stable metadata and immutable numbered
definitions. Only a published version can execute.

## Lifecycle

1. Create metadata with `POST /api/dynamic-services`.
2. Create a draft definition with `POST /api/dynamic-services/:serviceId/versions`.
3. Test the published service from the designer or `POST /api/dynamic-services/:serviceId/test`.
4. Publish with `POST /api/dynamic-services/:serviceId/versions/:versionId/publish`.
5. Discover allowed services with `GET /api/dynamic-services/available`.
6. Execute generically with `POST /api/dynamic-services/by-key/:serviceKey/execute`.

The frontend uses `DynamicServiceClientService`; a new published service does not require a new Angular HTTP method.

## Metadata object

| Field | Type | Rule |
| --- | --- | --- |
| `key` | string | Required on create, `snake_case`, 3-120 characters |
| `name` | string | Required on create, 3-180 characters |
| `description` | string or null | Human purpose |
| `active` | boolean | Inactive services cannot execute |

## Definition object

| Field | Type | Meaning |
| --- | --- | --- |
| `intent` | enum | `query`, `get_one`, `create`, `update`, `delete`, `validate`, `sync`, `notify`, `custom` |
| `source` | enum | `external_api`, `internal_table`, `dynamic_record`, `future_connector` |
| `resultKind` | enum | `none`, `single`, `list`, `paginated_list`, `boolean`, `file` |
| `method` | enum | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| `url` | string | Required for `external_api`; empty for an internal table |
| `headers` | object | String templates rendered by the backend |
| `query` | object | Query parameter templates |
| `body` | JSON | Recursively rendered for methods with a request body |
| `timeoutMs` | number | Per-service request; clamped by Confisys |
| `retry` | object | Reserved service metadata with `attempts` and `backoffMs` |
| `responseMap` | object | Named values read from the sanitized response |
| `pagination` | object | Describes page/offset/cursor semantics for consumers |
| `effects` | array | Declarative result intent; it does not bypass frontend authorization |
| `dataTarget` | object | Safe plan for internal data |

Defaults applied by the backend include `intent=custom`, `source=external_api`, `resultKind=single`,
`pagination.enabled=false`, `effects=[show_response]`, `retry.attempts=0` and `dataTarget.matchMode=all`.

Direct HTTP service execution currently performs one request. Retry metadata is stored for compatibility, but active
retry behavior is implemented by a Flow `dynamic_service` step through that step's `config.retry`. Until direct retry
lands, keep service-level `attempts=0`.

## Template context

Strings can interpolate scalar values:

```json
{
  "Authorization": "Bearer {{input.token}}",
  "X-Tenant": "{{tenant.slug}}",
  "X-User": "{{user.id}}"
}
```

Available roots are:

- `input`: execution `context`.
- `tenant`: authenticated tenant.
- `user`: authenticated user.

Missing paths render as an empty string. For secrets, examples use an input placeholder only to demonstrate the
contract; production values should come from a future approved secret source.

## Internal table plan

`source=internal_table` never accepts SQL. The backend:

- Allows only tables returned by `GET /api/dynamic-services/catalog/tables`.
- Rejects protected runtime/security tables.
- Applies `tenantId` or the current tenant `id` automatically.
- Validates identifiers against the real schema.
- Blocks columns matching password, token, secret or hash.
- Uses bound parameters.
- Executes only `queryMode=single_table` today.
- Limits lists to 100 rows.

`matchMode=all` joins present filters with `AND`. `matchMode=any` joins them with `OR`. An optional filter can be
omitted, but when filters are configured at least one value must arrive.

Filter operators:

- `equals`
- `contains`
- `starts_with`
- `greater_than`
- `greater_or_equal`
- `less_than`
- `less_or_equal`

Value sources:

- `input`: read `inputKey`, falling back to the field name.
- `literal`: use `value`.
- `tenant`: authenticated tenant id.
- `current_user`: authenticated user id.

## Response shape and mapping

External execution stores a sanitized snapshot:

```json
{
  "status": 200,
  "ok": true,
  "headers": {},
  "body": {},
  "truncated": false,
  "mapped": {}
}
```

Internal execution stores:

```json
{
  "table": "users",
  "count": 1,
  "rows": [],
  "result": {},
  "mapped": {}
}
```

`responseMap` reads exact paths rooted at `response`, for example
`"user": "{{response.result}}"` or `"items": "{{response.body.items}}"`.

## Security and limits

- HTTP and HTTPS only.
- Private hosts and private IP ranges blocked unless Confisys explicitly allows them.
- Redirects are not followed automatically.
- Timeout defaults to `services.defaultTimeoutMs` and is capped by `services.maxTimeoutMs`.
- Response snapshots are capped by `services.maxResponseBytes`.
- Authorization, API key, token, secret and cookie headers are masked in history.
- Execution requires both `services.execute` and role access to the service resource.

## Canonical examples

The valid machine-readable catalog is `docs/examples/dynamic-services.examples.json`. It covers metadata, external
validation, internal `all`/`any` filters, pagination, test and generic execution.
