# Dynamic forms contract

Dynamic Forms are tenant-owned, versioned UI recipes. A form describes what data is needed, how the user is guided,
how fields validate, how the same definition renders on web and mobile, and what should happen when the user submits
it. The stored JSON is the Chicle contract; Formly is only the Angular runtime adapter.

## Design standard

The contract follows a layered pattern used by mature form builders:

1. **Form document**: identity, lifecycle, security, presentation, steps and submit behavior.
2. **Data schema**: JSON-Schema-inspired field types and validation constraints.
3. **UI schema**: layout, kit preference, responsive behavior, help text and grouping.
4. **Rule schema**: declarative visibility, enabled state, calculations and validation. No JavaScript is stored.
5. **Action schema**: what the form does on submit, success, failure or field events.
6. **Test schema**: fixtures and assertions used by the designer before publishing.

This keeps the contract close to JSON Schema and Formly concepts while avoiding direct dependency on Angular,
PrimeNG, Ionic or any business product.

Official references behind the design:

- JSON Schema describes data shape, constraints and validation vocabulary.
- Formly provides the Angular dynamic form lifecycle, field configuration and expression support.
- Chicle adds tenant scope, permissions, presentation profiles, offline behavior, actions and mobile capabilities.

## Storage model

Current base tables:

```txt
dynamic_forms
  id, tenant_id, key, title, description, category, version, schema, published,
  status, published_version_id, metadata, tags, trashed_at

dynamic_form_versions
  id, tenant_id, form_id, version, status, schema, bindings_snapshot,
  input_schema, output_schema, created_by_user_id, published_at

dynamic_form_runs
  id, tenant_id, form_id, form_version_id, version, status, idempotency_key,
  input, output, error, bindings_snapshot, duration_ms, actor_user_id, created_at

dynamic_form_bindings
  id, tenant_id, form_id, form_version_id, field_key, binding_type, event,
  target_type, target_key, target_version_id, operation, payload_map,
  response_map, cache_policy, timeout_ms, required, active

dynamic_form_write_policies
  id, tenant_id, form_id, form_version_id, target_type, target_key, table_name,
  allowed_operation, allowed_columns, required_columns, tenant_column, active
```

The runtime table split is already part of the product baseline. `dynamic_forms` keeps the current editable schema and
the pointer to the published version. `dynamic_form_versions` freezes each publishable recipe. `dynamic_form_bindings`
stores the service, flow and field relationships extracted from JSON. `dynamic_form_runs` audits every submit with
idempotency. `dynamic_form_write_policies` reserves the approved-write contract for table-specific persistence.

The schema must include `schemaVersion` so the API can migrate old definitions later without changing every consumer at
once.

## Canonical document shape

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_form",
  "key": "client_onboarding",
  "title": "Client onboarding",
  "description": "Capture and validate client information.",
  "category": "clients",
  "lifecycle": {
    "status": "draft",
    "version": 1,
    "published": false
  },
  "security": {
    "visibilityPermission": "forms.read",
    "submitPermission": "forms.submit",
    "roles": ["owner", "admin", "operator"]
  },
  "runtime": {
    "mode": "guided",
    "submitLabel": "Create client",
    "autosave": false,
    "offline": {
      "enabled": true,
      "queueKey": "client_onboarding",
      "idempotencyKey": "{{input.email}}"
    },
    "limits": {
      "timeoutMs": 10000,
      "maxPayloadKb": 512
    }
  },
  "presentation": {
    "profileKey": "adaptive",
    "kit": "auto",
    "theme": "chicle",
    "themeMode": "system",
    "density": "comfortable",
    "radius": "md",
    "rules": [
      { "kit": "ionic", "maxWidth": 767 },
      { "kit": "primeng", "minWidth": 768 }
    ],
    "tokens": {}
  },
  "layout": {
    "strategy": "adaptive_steps",
    "desktop": {
      "mode": "step_cards",
      "cardColumns": 2,
      "allowSingleLongForm": true,
      "maxFieldsPerSection": 8
    },
    "tablet": {
      "mode": "step_cards",
      "cardColumns": 1,
      "maxFieldsPerSection": 6
    },
    "mobile": {
      "mode": "step_screens",
      "progress": "compact",
      "navigation": "bottom_actions",
      "maxFieldsPerScreen": 6
    },
    "autoSplit": {
      "enabled": true,
      "suggestAfterFields": 8,
      "forceReviewAfterFields": 14
    }
  },
  "persistence": {
    "mode": "submit_action",
    "defaultTarget": {
      "type": "record",
      "recordType": "client_onboarding"
    },
    "audit": {
      "storeSubmissionSnapshot": true,
      "storeResolvedBindings": true
    }
  },
  "dataSources": [],
  "commands": [],
  "steps": [],
  "actions": [],
  "tests": []
}
```

## Data ownership and persistence strategy

Dynamic forms have two different persistence concerns:

1. **Form definition persistence**: `dynamic_forms.schema` stores the UI recipe, validation rules, bindings and actions.
2. **Captured data persistence**: the submitted values may become a generic record, a write to an approved table, a
   call to a dynamic service, a flow execution or a combination of these.

The form runtime is the only public entry point. The frontend does not call arbitrary table writes or internal services
directly from a field.

```txt
Frontend form
  -> GET /api/forms/by-key/:formKey/runtime
  -> POST /api/forms/by-key/:formKey/submit
  -> Form Runtime validates schema, permissions, field bindings and idempotency
  -> execute action:
       create_record
       execute_service
       execute_flow
       upload_files
       queue_offline
  -> audit form run and binding versions
```

### Persistence modes

| Mode | Use when | Behavior |
| --- | --- | --- |
| `record` | You need flexible captured data without a custom table | Submit creates a row in `records` with `data` and metadata. |
| `service` | One approved service owns the write | Submit calls a published dynamic service such as `upsert_client_profile`. |
| `flow` | The form must write several tables, call integrations or branch | Submit calls a published flow. This is the preferred complex path. |
| `hybrid` | Store an audit record and then execute business writes | Runtime creates `records` entry and then executes service/flow actions. |
| `none` | Search/filter/calculator form | Runtime validates and returns output without persisting captured data. |

Recommended default:

- Simple data capture: `record`.
- Business process: `flow`.
- Single controlled table mutation: `service`.
- Multi-table mutation or external side effects: `flow` with outbox/event steps.

Hybrid submit example:

```json
{
  "persistence": {
    "mode": "hybrid",
    "defaultTarget": {
      "type": "record",
      "recordType": "client_onboarding"
    }
  },
  "actions": [
    {
      "event": "onSubmit",
      "type": "create_record",
      "recordType": "client_onboarding",
      "resultKey": "record",
      "payloadMap": {
        "input": "{{input}}"
      }
    },
    {
      "event": "onSubmit",
      "type": "execute_flow",
      "flowKey": "client_onboarding_after_submit",
      "resultKey": "flow",
      "payloadMap": {
        "input": "{{input}}",
        "tenant": "{{tenant.slug}}"
      }
    }
  ]
}
```

### Field-to-service bindings

Fields may use dynamic services for read or validation behavior:

| Binding type | Event | Purpose |
| --- | --- | --- |
| `options` | `onLoad`, `onOpen`, `onChange` | Load select, radio, autocomplete or lookup options. |
| `default_value` | `onLoad`, `onChange` | Pre-fill values from tenant, user, service or previous field. |
| `validation` | `onBlur`, `onChange`, `onSubmit` | Validate uniqueness, eligibility or an external rule. |
| `calculation` | `onChange` | Calculate values through a controlled service or formula. |
| `enrichment` | `onChange`, `onSubmit` | Fetch related attributes after selecting an entity. |
| `submit` | `onSubmit` | Execute the form's write path. |

Example field binding:

```json
{
  "key": "city_id",
  "type": "catalog_select",
  "label": "City",
  "dataSource": {
    "type": "dynamic_service",
    "serviceKey": "catalog_cities",
    "bindingType": "options",
    "event": "onOpen",
    "payloadMap": {
      "countryId": "{{input.country_id}}"
    },
    "labelPath": "name",
    "valuePath": "id",
    "cache": {
      "scope": "tenant",
      "ttlSeconds": 300
    },
    "timeoutMs": 5000
  }
}
```

### Write targets

A form must not write arbitrary tables by naming table and column values directly from the browser. A write target is
approved through one of these mechanisms:

1. A published dynamic service with `intent=create`, `update`, `upsert` or `delete`.
2. A published flow that orchestrates one or more services and actions.
3. A generic `create_record` action for flexible record capture.

Example controlled table write through a service:

```json
{
  "event": "onSubmit",
  "type": "execute_service",
  "serviceKey": "upsert_client_profile",
  "operation": "upsert",
  "payloadMap": {
    "id": "{{input.client_id}}",
    "name": "{{input.client_name}}",
    "email": "{{input.client_email}}",
    "tenantId": "{{tenant.id}}"
  },
  "resultKey": "client"
}
```

Example multi-table write through a flow:

```json
{
  "event": "onSubmit",
  "type": "execute_flow",
  "flowKey": "create_client_and_request",
  "payloadMap": {
    "client": {
      "name": "{{input.client_name}}",
      "email": "{{input.client_email}}"
    },
    "request": {
      "serviceType": "{{input.service_type}}",
      "description": "{{input.description}}"
    }
  },
  "resultKey": "created"
}
```

### Dependency inventory

`dynamic_form_bindings` is the dependency map for every published version. It answers:

- Which fields call which services.
- Which submit action calls which service or flow.
- Which service/flow version was pinned when the form was published.
- Which cache, timeout and payload mapping were active.
- Which forms would break if a service, flow, field or table changes.

Draft forms may point to `latest_published`. Published forms should pin `target_version_id` when the target supports
versioning. If a service is moved to trash, the designer must show impacted forms before allowing destructive changes.

### Write safety rules

- Backend validates the full schema and submitted values before executing actions.
- Backend applies tenant scope; the form cannot trust hidden fields for `tenantId` or ownership.
- Allowed tables, operations and columns come from a backend allowlist or an approved dynamic service definition.
- Protected columns such as password, hash, token, secret and internal audit columns are blocked.
- The runtime builds DTO-like payloads from `payloadMap`; it never passes the raw submitted object into an entity save.
- Every write path has an idempotency key when offline, retries or double-submit are possible.
- Same-database writes that must succeed together run in one transaction.
- External calls, events and long work use a flow plus outbox/event pattern instead of holding a database transaction
  open across the network.
- Runs store sanitized snapshots for audit and troubleshooting.

### Transaction strategy

| Scenario | Strategy |
| --- | --- |
| One table write | Dynamic service or flow step inside one database transaction. |
| Several tables in same database | Flow coordinates all internal writes inside one transaction where possible. |
| Database write plus external API/event | Commit local write and outbox/event record together; worker publishes/calls external system. |
| Offline mobile submit | Queue payload with idempotency key, replay through form runtime, deduplicate on backend. |
| Long process | Submit starts a flow run and returns accepted/pending state; UI observes status later. |

The form runtime must prefer short transactions and explicit orchestration over hidden side effects.

## Steps

`steps` are the top-level user journey. They are not backend flow steps. They group fields, control progress and let
mobile screens stay readable.

Rules:

- Every form should use `steps`, even if there is only one step.
- A step has `key`, `title`, optional `description`, optional `visibleWhen`, optional `layout` and `fields`.
- A step is a semantic group. It is not always a full page on desktop.
- On desktop, steps may render as cards, sections in one large form or a wizard, depending on the form layout strategy.
- On mobile, each step normally becomes a screen with compact progress and bottom navigation.
- A hidden step is skipped but its model values are preserved unless a rule explicitly resets them.

Example:

```json
{
  "key": "identity",
  "title": "Identity",
  "description": "Basic client information.",
  "layout": {
    "desktopColumns": 12,
    "tabletColumns": 8,
    "mobileColumns": 4
  },
  "fields": []
}
```

## Adaptive layout decision

The same form must feel native in large web resolutions and mobile resolutions. Chicle does not simply squeeze a web
form into a phone. The renderer changes the visual pattern while preserving the same `steps`, fields, rules and submit
contract.

Form-level `layout.strategy` controls this transformation:

```json
{
  "layout": {
    "strategy": "adaptive_steps",
    "desktop": {
      "mode": "step_cards",
      "cardColumns": 2,
      "allowSingleLongForm": true,
      "maxFieldsPerSection": 8
    },
    "tablet": {
      "mode": "step_cards",
      "cardColumns": 1,
      "maxFieldsPerSection": 6
    },
    "mobile": {
      "mode": "step_screens",
      "progress": "compact",
      "navigation": "bottom_actions",
      "maxFieldsPerScreen": 6
    },
    "autoSplit": {
      "enabled": true,
      "suggestAfterFields": 8,
      "forceReviewAfterFields": 14
    }
  }
}
```

Supported layout modes:

| Mode | Intended context | Behavior |
| --- | --- | --- |
| `single_form` | Short desktop forms | All steps render as sections in one continuous form. |
| `step_cards` | Medium/large desktop forms | Each step renders as an integrated card/section; default is two cards per row on wide screens. |
| `wizard` | Sensitive or sequential desktop forms | One step at a time, even on desktop. |
| `step_screens` | Mobile web/native | One step per mobile screen with compact progress and bottom actions. |
| `auto` | Designer-generated forms | The renderer chooses from field count, step count, viewport and density. |

Recommended heuristics:

| Form size | Desktop behavior | Mobile behavior |
| --- | --- | --- |
| 1-6 fields | `single_form` or one card | One screen |
| 7-14 fields | `step_cards`, one or two cards per row | Steps become screens |
| 15+ fields | Require explicit steps or designer review | Steps become screens; large steps are suggested for split |
| Step with 7+ mobile fields | Still allowed on desktop | Designer suggests splitting the step |

Designer behavior:

- The designer should ask the user whether the form is a single form, a grouped form or a guided process.
- If a user adds many fields without steps, the designer suggests step groups instead of silently creating a poor
  mobile experience.
- If `autoSplit.enabled` is true, the designer can propose steps but must not publish a forced split without review.
- A user may lock a step by setting `layout.locked = true` when a group must remain together.
- Desktop cards are visual grouping only. They do not create extra submit events.
- Mobile step screens are runtime navigation. They validate before moving to the next screen.

Visual intent:

```txt
Large web, step_cards:

[ Client data                ] [ Request data               ]
[ name ][ email ][ phone ]     [ type ][ priority ]          ]
[ address                  ]   [ description              ]  ]

Mobile, step_screens:

Step 1 of 2
Client data
[ name ]
[ email ]
[ phone ]
[ Continue ]
```

## Fields

Fields describe intent, not the concrete UI library.

Base field:

```json
{
  "key": "email",
  "type": "email",
  "label": "Email",
  "required": true,
  "placeholder": "client@example.com",
  "help": "Used for notifications and login recovery.",
  "defaultValue": "",
  "layout": {
    "desktopSpan": 6,
    "tabletSpan": 8,
    "mobileSpan": 4
  },
  "validation": {
    "format": "email",
    "messages": {
      "required": "Email is required.",
      "format": "Enter a valid email."
    }
  }
}
```

Supported V1 field types:

| Type | Purpose | Web rendering | Mobile rendering |
| --- | --- | --- | --- |
| `text` | Generic string | PrimeNG input | Ionic input |
| `email` | Email value | PrimeNG input type email | Ionic input type email |
| `password` | Password input | PrimeNG input type password | Ionic input type password |
| `number` | Numeric value | PrimeNG input type number | Ionic input type number |
| `currency` | Monetary numeric value | PrimeNG numeric input baseline | Ionic numeric input baseline |
| `tel` | Phone value | PrimeNG input type tel | Ionic input type tel |
| `url` | URL value | PrimeNG input type url | Ionic input type url |
| `textarea` | Long text | PrimeNG textarea | Ionic textarea |
| `select` | Single selection | PrimeNG select | Ionic select |
| `radio` | Short single choice | PrimeNG radio buttons | Ionic radio group |
| `checkbox` | Boolean checkbox | PrimeNG checkbox | Ionic checkbox |
| `toggle` | Boolean switch | PrimeNG toggle switch | Ionic toggle |
| `date` | Date | Native/Prime input | Ionic input date |
| `time` | Time | Native/Prime input | Ionic input time |
| `datetime` | Date and time | Native/Prime datetime-local | Ionic datetime-compatible input |
| `file` | File evidence metadata | Native file input fallback | Native file input fallback |
| `image` | Image evidence metadata | Native image input fallback | Native image input fallback |
| `gps` | Location capture metadata | Geolocation button fallback | Geolocation button fallback |
| `title` | Display heading | Chicle display type | Chicle display type |
| `paragraph` | Display text | Chicle display type | Chicle display type |
| `divider` | Visual divider | Chicle display type | Chicle display type |

Planned field families:

- `camera`, `signature`, `barcode`, `qr`, `nfc`, `rfid`, `ble_device`.
- `catalog_select`, `multi_select`, `entity_lookup`, `table_editor`, `repeater`, `object_group`.
- `percentage`, `mask`, `color`, `rating`, `slider`.

Each new field must have PrimeNG, Ionic and native fallback behavior, or an explicit unsupported state.

## Validation

Validation is declarative and serializable. The runtime may compile it into Formly validators, Angular validators or
backend validators, but stored JSON never contains functions.

Allowed V1 validation keys:

```json
{
  "required": true,
  "min": 1,
  "max": 100,
  "minLength": 3,
  "maxLength": 80,
  "exactLength": 10,
  "pattern": "^[A-Z0-9-]+$",
  "format": "email",
  "oneOf": ["active", "inactive"],
  "messages": {
    "required": "This field is required."
  }
}
```

Advanced validation should use controlled operators:

```json
{
  "rules": [
    {
      "key": "adult_required",
      "when": {
        "field": "document_type",
        "operator": "equals",
        "value": "national_id"
      },
      "assert": {
        "field": "age",
        "operator": "greater_or_equal",
        "value": 18
      },
      "message": "The person must be at least 18 years old."
    }
  ]
}
```

Backend validation must repeat critical constraints before executing submit actions. Frontend validation improves user
experience; it is not the security boundary.

## Conditions and calculations

Conditions use the same safe operator catalog used by services and flows.

Supported V1 operators:

- `equals`
- `not_equals`
- `truthy`
- `falsy`
- `contains`
- `in`
- `not_in`
- `greater_than`
- `greater_or_equal`
- `less_than`
- `less_or_equal`

Example:

```json
{
  "visibleWhen": {
    "field": "channel",
    "operator": "equals",
    "value": "phone"
  }
}
```

Calculated values are planned as declarative formulas, not JavaScript:

```json
{
  "key": "total",
  "type": "number",
  "label": "Total",
  "readonly": true,
  "calculated": {
    "operator": "multiply",
    "args": ["{{input.quantity}}", "{{input.unit_price}}"]
  }
}
```

## Data sources

Field options can be static or dynamic.

Static:

```json
{
  "key": "channel",
  "type": "select",
  "label": "Preferred channel",
  "options": [
    { "label": "Email", "value": "email" },
    { "label": "Phone", "value": "phone" }
  ]
}
```

Dynamic:

```json
{
  "key": "city_id",
  "type": "catalog_select",
  "label": "City",
  "dataSource": {
    "type": "dynamic_service",
    "serviceKey": "catalog_cities",
    "payloadMap": {
      "countryId": "{{input.country_id}}"
    },
    "labelPath": "name",
    "valuePath": "id",
    "cache": {
      "scope": "tenant",
      "ttlSeconds": 300
    }
  }
}
```

Dynamic data sources must use published services, not custom HTTP code inside the form.

## Actions

Forms can execute actions on lifecycle events.

Allowed event names:

- `onLoad`
- `onChange`
- `onStepEnter`
- `onStepLeave`
- `onSubmit`
- `onSuccess`
- `onError`
- `onOfflineQueued`

Preferred submit actions:

```json
{
  "event": "onSubmit",
  "type": "execute_flow",
  "flowKey": "create_client_from_form",
  "payloadMap": {
    "client": "{{input}}",
    "tenant": "{{tenant.slug}}"
  },
  "resultKey": "createdClient",
  "success": {
    "type": "navigate",
    "route": "/records/{{result.createdClient.id}}"
  },
  "error": {
    "type": "show_message",
    "tone": "error",
    "message": "The client could not be created."
  }
}
```

The form designer should guide users toward `execute_flow` for business processes and `execute_service` for small,
direct lookups. Complex submit behavior belongs in flows.

Action selection guidance:

| Need | Preferred action |
| --- | --- |
| Save flexible form capture | `create_record` |
| Write one approved table or entity | `execute_service` |
| Write multiple tables | `execute_flow` |
| Call external API after local write | `execute_flow` with outbox/event step |
| Upload evidence | `upload_files`, then `execute_flow` or `create_record` |
| Navigate or show result only | `navigate`, `show_message` |
| Work offline | `queue_offline` with idempotency |

## Commands and buttons

Buttons are not visual-only elements. In Chicle they are declarative commands that may execute services, flows or UI
actions. The renderer decides whether a command appears as a desktop toolbar button, an inline section button, a mobile
bottom action or an overflow menu item.

Command contract:

```json
{
  "key": "validate_email",
  "label": "Validar correo",
  "icon": "shield-check",
  "placement": "field",
  "fieldKey": "email",
  "style": "secondary",
  "event": "onClick",
  "access": {
    "permissions": ["forms.submit"],
    "roles": ["operator"],
    "deniedMode": "hidden"
  },
  "visibleWhen": {
    "field": "email",
    "operator": "truthy"
  },
  "enabledWhen": {
    "field": "email",
    "operator": "truthy"
  },
  "confirm": {
    "message": "Validar este correo ahora?"
  },
  "action": {
    "type": "execute_service",
    "serviceKey": "validate_email",
    "payloadMap": {
      "email": "{{input.email}}"
    },
    "resultKey": "emailValidation"
  },
  "feedback": {
    "loadingLabel": "Validando...",
    "successMessage": "Correo validado.",
    "errorMessage": "No se pudo validar el correo."
  }
}
```

The designer may also store the action flattened at command level for runtime convenience:

```json
{
  "key": "validate_email",
  "label": "Validar correo",
  "placement": "form_toolbar",
  "style": "secondary",
  "event": "onClick",
  "type": "execute_service",
  "serviceKey": "validate_email",
  "payloadMap": {
    "input": "{{input}}"
  },
  "requiresValidForm": true,
  "responseMode": "show_response"
}
```

Backend accepts both shapes. `action` is the canonical long form; flattened `type/serviceKey/flowKey/payloadMap` is the
friendly form produced by the V1 designer.

## Access rules

Forms inherit route/backend permissions, but the JSON can also declare field and button access for generated screens:

```json
{
  "key": "internal_notes",
  "type": "textarea",
  "label": "Notas internas",
  "access": {
    "permissions": ["forms.read_internal"],
    "roles": ["admin"],
    "readonlyUnlessPermission": "forms.edit_internal",
    "deniedMode": "hidden"
  }
}
```

Rules:

- `permissions` and `roles` are additive: if present, the user must satisfy them.
- `deniedMode=hidden` removes the field or command from runtime.
- `deniedMode=readonly` keeps the field visible but blocks editing.
- `readonlyUnlessPermission` is useful for sensitive values that some users can view but not change.

Command placements:

| Placement | Desktop behavior | Mobile behavior |
| --- | --- | --- |
| `form_toolbar` | Top or sticky command bar | Overflow menu or sticky secondary actions |
| `step_header` | Button in the current step/card header | Compact header action or overflow |
| `field` | Button beside or below a field | Inline full-width action below the field |
| `row` | Row command inside table/repeater fields | Swipe/action menu or compact icon button |
| `bottom` | Bottom command area | Native-style bottom action |
| `overflow` | More menu | More menu |

Command styles:

- `primary`
- `secondary`
- `danger`
- `ghost`
- `link`
- `icon`

Allowed command actions:

| Action | Use |
| --- | --- |
| `execute_service` | Validate, calculate, lookup, update a controlled target. |
| `execute_flow` | Start a business process. |
| `create_record` | Save a generic record. |
| `upload_files` | Upload evidence before submit or as a field action. |
| `show_message` | Show informational feedback. |
| `navigate` | Move to another route. |
| `reset_form` | Clear all or part of the model. |
| `set_field_value` | Write a resolved result into one or more fields. |
| `open_modal` | Show a detail, selector or confirmation dialog. |
| `queue_offline` | Store action for later sync. |

Rules:

- Submit is a command too. The default submit button is generated from `runtime.submitLabel`, but complex forms may
  define explicit `commands` with `placement=bottom` or `form_toolbar`.
- A command can require the current step to be valid before it runs with `requiresValidStep=true`.
- A command can require the entire form to be valid before it runs with `requiresValidForm=true`.
- Dangerous commands must define confirmation.
- Command actions use the same secure action runtime as lifecycle `actions`.
- Buttons never expose raw table names or unrestricted endpoints.
- Published forms pin service/flow target versions for command actions.
- In mobile, primary navigation commands stay at the bottom; extra commands go to overflow to avoid clutter.

Example bottom submit command:

```json
{
  "key": "submit_request",
  "label": "Crear solicitud",
  "placement": "bottom",
  "style": "primary",
  "event": "onClick",
  "requiresValidForm": true,
  "action": {
    "type": "execute_flow",
    "flowKey": "create_service_request",
    "payloadMap": {
      "request": "{{input}}"
    },
    "resultKey": "request"
  }
}
```

Example field enrichment command:

```json
{
  "key": "lookup_client",
  "label": "Buscar cliente",
  "placement": "field",
  "fieldKey": "client_document",
  "style": "secondary",
  "requiresValidStep": false,
  "action": {
    "type": "execute_service",
    "serviceKey": "find_client_by_document",
    "payloadMap": {
      "document": "{{input.client_document}}"
    },
    "resultKey": "client"
  },
  "onSuccess": [
    {
      "type": "set_field_value",
      "values": {
        "client_name": "{{result.client.name}}",
        "client_email": "{{result.client.email}}"
      }
    }
  ]
}
```

## Web and mobile behavior

Presentation is resolved in this order:

1. Field or command-level `presentation`.
2. Step-level `presentation`.
3. Form-level `presentation`.
4. Selected app/template default.
5. Tenant default from Confisys.
6. Chicle default.

Recommended defaults:

| Context | Kit | Layout |
| --- | --- | --- |
| Desktop web | PrimeNG | 12-column grid; sections or two step cards per row when useful |
| Tablet web | PrimeNG or Ionic by rule | 8-column grid; one card per row or compact sections |
| Mobile web/native | Ionic | 4-column grid; one step screen at a time |
| Unknown/fallback | Native | Accessible HTML controls |

Rules:

- Text must not overflow at 390 px.
- Controls keep stable heights where possible.
- Buttons become full width on mobile.
- Step progress remains visible. On desktop it may be a card/section state; on mobile it becomes compact progress.
- Capability fields show unsupported, permission denied, loading, retry and offline states.

## Personalization

Forms inherit the active app or tenant theme by default. A form, step, field or command may force a different
presentation only through the declarative `presentation` object.

```json
{
  "presentation": {
    "theme": "material",
    "themeMode": "dark",
    "density": "compact",
    "radius": "sm",
    "tokens": {
      "primary": "#3f51b5",
      "primaryContrast": "#ffffff"
    }
  }
}
```

Hierarchy:

```txt
field/command override
  -> step override
  -> form override
  -> selected app template
  -> tenant Confisys default
  -> Chicle default
```

Rules:

- `theme` must be an installed theme key.
- `themeMode` is `light`, `dark`, `system` or `inherit`.
- `density` is `comfortable`, `compact`, `spacious` or `inherit`.
- `radius` is `none`, `sm`, `md`, `lg` or `inherit`.
- `tokens` may only override allowlisted semantic tokens: `primary`, `primaryContrast`, `surface`, `background`,
  `text`, `muted`, `border`, `success`, `warning`, `danger` and `info`.
- The designer must validate contrast before publishing a forced color override.
- Stored JSON never includes CSS classes, CSS selectors, inline style blocks or component-library-specific theme
  imports.
- A forced form theme should be visible in the dependency/impact panel because changing or deleting that theme affects
  the form.

Recommended use:

| Need | Preferred approach |
| --- | --- |
| App-wide branding | App template or tenant Confisys default |
| One vertical/product skin | Installed theme selected by app template |
| One special form | Form-level `presentation.theme` |
| One warning/critical field | Semantic `tone` before custom tokens |
| Campaign or customer-specific variant | Form-level theme plus limited tokens |
| Dark mode | `themeMode=system` by default; force `dark` only when required |

## Security

- Forms are tenant-scoped.
- Listing, reading, editing, publishing and submitting require permissions.
- Role resource policies can later restrict specific form keys the same way services and flows are restricted.
- Hidden fields are not trusted. Backend submit actions must re-check tenant, user and permission.
- Secret values are never stored in form schema.
- Fields that reference sensitive backend columns must be blocked by catalog policy.

## Lifecycle

The designer lifecycle should match Dynamic Services and Flows:

1. **Datos**: key, title, description, category and owner.
2. **Disenar**: steps, fields, layout, validation, data sources and actions.
3. **Versionar**: create immutable version from the draft.
4. **Probar**: run test fixtures in web, tablet and mobile preview.
5. **Publicar**: expose the version to runtime, screens, menus and actions.

Draft edits never change a published version. Screens consume published forms by key.

### Designer UX rule

The visual assistant and JSON editor are equivalent authoring paths. Non-developer users can follow the guided
configuration, while advanced users or AI agents can work directly in the JSON from the first screen. JSON is always
visible and editable; it is not a separate mandatory lifecycle step.

Saving, versioning and publishing must use the current JSON contract as the source of truth. If JSON is edited
manually, the user may apply it to synchronize the visual assistant, but applying it is not required before saving.

The designer must guide the user in this order:

1. Pick a starter template: capture, lookup, approval, inspection or blank.
2. Define identity, presentation, responsive behavior, persistence and runtime limits.
3. Add steps and fields with quick field sets, then refine each field in the inspector.
4. Edit the JSON directly when needed, or keep using the guided controls.
5. Preview web/tablet/mobile and generate example input.
6. Save draft, create immutable version and publish only when the checklist has no blocking issues.

Publishing controls must remain disabled when required targets are missing, JSON is invalid, fields are incomplete, or
the form has not been saved/versioned/tested successfully.

## Component responsibilities

Shared components required by the form designer:

| Component | Responsibility | Current status |
| --- | --- | --- |
| `PageShellComponent` | Authenticated page shell, spacing and navigation | Ready |
| `ModuleHeaderComponent` | Form module title, badge and description | Ready |
| `DesignerWorkspaceComponent` | Catalog plus editing workspace | Ready |
| `CatalogHeaderComponent` | Form list title, count and commands | Ready |
| `CatalogItemComponent` | Selectable form or step item | Ready |
| `SectionHeaderComponent` | Section title, description and actions | Ready |
| `ProcessStepsComponent` | Lifecycle steps: Datos, Disenar, Versionar, Probar, Publicar | Ready |
| `WorkflowGuideComponent` | Explains the current authoring objective | Ready |
| `ContextAssistantComponent` | Local help for field, step, action and test blocks | Ready |
| `StatusNoticeComponent` | Empty, info, success, warning and error states | Ready |
| `LoadingSkeletonComponent` | Loading state for forms, catalogs and previews | Ready |
| `FieldShellComponent` | Label, required marker, help and validation error | Ready |
| `DynamicFieldControlComponent` | Multikit field facade | Initial, usable |
| `PrimengFieldRendererComponent` | Desktop/web field adapter | Initial, usable |
| `IonicFieldRendererComponent` | Mobile field adapter | Initial, usable |
| `NativeFieldRendererComponent` | Accessible fallback field adapter | Initial, usable |
| `DynamicFieldLibraryComponent` | Field palette and visual examples | Initial; needs search/categories/insert events |
| `FormlyRuntimeComponent` | Runtime form rendering, validation, adaptive layouts and step navigation | Initial V1; supports cards, continuous and paged modes |
| `UiPresentationSwitcherComponent` | Preview kit switcher | Ready for preview |
| `PreviewViewportComponent` | Desktop, tablet and mobile preview frame | Ready |
| `StepManagerComponent` | Create, reorder, select and validate steps | Missing |
| `SchemaFieldEditorComponent` | Field key, type, label, options and validation | Missing |
| `PropertyInspectorComponent` | Edits selected form, step, field or action | Missing |
| `JsonEditorPanelComponent` | Synchronized advanced JSON editing | Inline V1 in Forms; extract shared component next |
| `ActionBindingEditorComponent` | Submit, command buttons and field event actions | Missing |
| `DataBindingEditorComponent` | Dynamic service payload and response mapping | Missing; generalize from Flow mapper |
| `VersionLifecyclePanelComponent` | Draft, version, publish and restore | Missing; pattern exists in Services/Flows pages |
| `TestWorkbenchComponent` | Fixtures, submit, response and assertions | Missing; pattern exists in Services/Flows pages |
| `ConfirmActionComponent` | Consistent destructive confirmation | Missing |

Pages must compose these components. They must not reimplement grids, field editors, JSON editors, test panels or
version buttons locally.

### Component readiness decision

The runtime path is ready enough to render and preview stored forms:

```txt
dynamic_forms.schema
  -> FormRuntimeService
  -> FormlySchemaAdapterService
  -> FormlyRuntimeComponent
  -> DynamicFieldControlComponent
  -> PrimeNG | Ionic | native renderer
```

The authoring path is not complete yet. Form Designer V1 must be built from the missing components above before adding
large editing logic to `DynamicFormPageComponent`.

## JSON quality checklist

Every canonical dynamic form example must pass these checks before it is used as a seed, demo or AI prompt:

1. `schemaVersion`, `kind`, `key`, `title`, `presentation`, `layout`, `steps`, `commands`, `actions` and `tests` exist.
2. `kind` is `dynamic_form`.
3. Every step has a unique `key`, a `title`, a `layout` and a `fields` array.
4. Every field has a unique `key` inside its step, a `type` and a `label`.
5. Field layout spans are positive integers and fit the declared breakpoint columns.
6. Desktop, tablet and mobile layout modes are documented values: `single_form`, `step_cards`, `wizard`,
   `step_screens` or `auto`.
7. Conditions use only approved operators.
8. Dynamic options reference `dataSources` or published dynamic services, never raw HTTP or SQL.
9. Submit actions prefer `execute_flow` for business processes.
10. Commands define placement, style, permission, validation requirements and action.
11. Test fixtures cover at least one desktop and one mobile behavior when responsive layout matters.

## What we can build with this contract

- Tenant setup forms.
- Admin CRUD forms.
- Client onboarding.
- Event registration.
- Real estate intake.
- Ticket sales forms.
- Service request forms.
- Inspection forms with evidence.
- Mobile offline capture forms.
- Forms that call dynamic services for catalogs or validation.
- Forms that submit into flows for multi-step business processing.

## What is not in V1

- Arbitrary Angular templates stored in the database.
- JavaScript expressions stored in the database.
- Free SQL from form configuration.
- Unrestricted external HTTP calls from the browser.
- Complex nested repeaters with offline merge conflict resolution.
- Native hardware fields without capability services and permission states.
- Direct mutation of published versions.

## Implementation roadmap

### Phase 1 - Contract and runtime hardening

- Align TypeScript `RuntimeForm` with this document.
- Keep backward compatibility with current `fields` root by normalizing it into a single `steps` item.
- Add schema validation in the API before saving a form.
- Expand validation, conditions and layout mapping in `FormlySchemaAdapterService`.

### Phase 2 - Designer V1

- Status: functional baseline implemented in `FormsPageComponent`.
- Current capabilities: list forms, create draft, start from templates, edit identity, configure presentation kit/theme,
  configure responsive behavior, configure runtime timeout/offline/autosave, configure persistence mode, select
  published services/flows, configure payload/response maps, manage extra command buttons, manage steps, add fields
  from palette or quick sets, duplicate/reorder/remove fields, inspect/edit selected field, configure select/radio
  options, basic validation, visual visibility conditions, review/apply JSON, responsive preview, generate test
  fixtures, run submit tests against the backend, display publishing checklist, save draft, create version and publish.
- Runtime V1 now consumes the generated layout contract: desktop `step_cards` renders steps as integrated cards,
  `single_form`/`single_scroll` render continuously, and `wizard`/`step_screens` render with paged navigation. Fields
  with `dataSource.type=dynamic_service` can load option lists from a published dynamic service. Runtime command
  buttons can execute a published dynamic service, execute a published flow or show local feedback.
- Next cleanup: extract `StepManagerComponent`, `SchemaFieldEditorComponent`, `JsonEditorPanelComponent` and
  `VersionLifecyclePanelComponent` so Screens, Forms and future builders share the same controls.
- Current publish rule: publish is enabled only after a saved draft, valid schema, immutable version and successful
  backend submit test.
- Next UX rule: persist successful preview/test status across reloads. Add async field-level remote validators with
  debounce, timeout and explicit error copy.

### Phase 3 - Actions and data sources

- Bind fields to dynamic services.
- Bind submit and extra buttons to `execute_flow`, `execute_service`, `create_record`, `upload_files` and navigation.
- Add test fixtures and recorded runs.
- Expand visual selectors for published services and flows into a reusable `DataBindingEditorComponent`.
- Extract the inline form submit workbench into reusable `TestWorkbenchComponent`.

### Phase 4 - Mobile and offline

- Add capability fields.
- Add offline queue policy per form.
- Add evidence handling and idempotency.
