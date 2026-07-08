# AI-ready authoring

This document is the official contract for future AI assistants that create Chicle artifacts from JSON.

The assistant must be able to create, update, version, publish and test Forms, Dynamic Services and Flows without
depending on the guided UI. The guided UI is helpful for humans; the JSON contract is the source of truth for AI.

## Shared rules

- JSON is editable from the beginning.
- Saving uses the current JSON, not stale guided controls.
- Every JSON-only endpoint accepts the same envelope: `{ "document": {...}, "publish": boolean }`.
- `publish=false` means: save/update draft only.
- `publish=true` means: save/update draft, create immutable version and publish it.
- Published artifacts become available by `key`.
- Keys must be stable, lowercase and technical.
- JSON must not contain secrets, raw SQL, JavaScript functions or product-specific hardcoded names.
- The assistant should prefer published Dynamic Services and Flows over creating custom endpoints.

## Front authoring pattern

Forms, Dynamic Services and Flows use the same `JsonAuthoringPanelComponent` in the frontend. The component exposes
the same visual sequence for all artifacts:

1. Edit the JSON contract.
2. Review JSON valid/invalid status.
3. Apply JSON to the guided UI when a human wants to inspect it visually.
4. Save draft with `publish=false`.
5. Save and publish with `publish=true`.

This is the UI surface future assistants should use when operating from the browser. The guided controls and the JSON
editor are equivalent authoring paths; the JSON panel is the canonical path for AI-generated artifacts.

## Permissions

The caller needs normal tenant auth plus the module permission:

| Artifact | Create/update | Execute/test |
| --- | --- | --- |
| Dynamic Forms | `forms.manage` | `forms.submit` |
| Dynamic Services | `services.manage` | `services.execute` |
| Flows | `flows.create` or `flows.update` | `flows.execute` |

## Forms JSON-only endpoint

```http
POST /api/forms/authoring/json
```

Request:

```json
{
  "publish": true,
  "document": {
    "schemaVersion": 1,
    "kind": "dynamic_form",
    "key": "cliente_onboarding",
    "title": "Onboarding de cliente",
    "description": "Captura datos iniciales del cliente.",
    "category": "clientes",
    "runtime": {
      "mode": "guided",
      "submitLabel": "Crear cliente",
      "offline": {
        "enabled": true,
        "queueKey": "cliente_onboarding",
        "idempotencyKey": "{{input.email}}"
      }
    },
    "presentation": {
      "profileKey": "adaptive",
      "kit": "auto",
      "theme": "chicle",
      "themeMode": "system",
      "density": "comfortable"
    },
    "layout": {
      "strategy": "adaptive_steps",
      "desktop": { "mode": "step_cards", "cardColumns": 2 },
      "mobile": { "mode": "step_screens", "navigation": "bottom_actions" }
    },
    "persistence": {
      "mode": "record",
      "defaultTarget": {
        "type": "record",
        "recordType": "cliente_onboarding"
      }
    },
    "steps": [
      {
        "key": "datos_basicos",
        "title": "Datos básicos",
        "fields": [
          { "key": "nombre", "name": "nombre", "type": "text", "label": "Nombre", "required": true },
          { "key": "email", "name": "email", "type": "email", "label": "Email", "required": true }
        ]
      }
    ],
    "commands": [],
    "actions": [
      {
        "event": "onSubmit",
        "type": "create_record",
        "recordType": "cliente_onboarding",
        "payloadMap": { "input": "{{input}}" }
      }
    ],
    "dataSources": [],
    "tests": []
  }
}
```

Runtime use after publish:

```http
GET /api/forms/by-key/cliente_onboarding/runtime
POST /api/forms/by-key/cliente_onboarding/submit
```

## Dynamic Services JSON-only endpoint

```http
POST /api/dynamic-services/authoring/json
```

Request:

```json
{
  "key": "buscar_usuario",
  "name": "Buscar usuario",
  "description": "Consulta usuarios por email o nombre.",
  "active": true,
  "publish": true,
  "document": {
    "intent": "query",
    "source": "internal_table",
    "resultKind": "list",
    "dataTarget": {
      "queryMode": "single_table",
      "primaryTable": "users",
      "matchMode": "any",
      "filters": [
        { "field": "email", "operator": "contains", "valueSource": "input", "inputKey": "email", "required": false },
        { "field": "name", "operator": "contains", "valueSource": "input", "inputKey": "name", "required": false }
      ]
    },
    "method": "GET",
    "timeoutMs": 8000,
    "retry": { "attempts": 0, "backoffMs": 0 },
    "responseMap": {}
  }
}
```

Runtime use after publish:

```http
POST /api/dynamic-services/by-key/buscar_usuario/execute
```

## Flows JSON-only endpoint

```http
POST /api/flows/authoring/json
```

Request:

```json
{
  "publish": true,
  "document": {
    "flow": {
      "key": "validar_usuario_reporte",
      "name": "Validar usuario y responder",
      "description": "Valida un usuario con un servicio y devuelve una respuesta al caller.",
      "category": "operaciones"
    },
    "entry": {
      "mode": "direct",
      "key": "direct",
      "config": {}
    },
    "inputFields": [
      { "key": "email", "label": "Email", "type": "email", "required": true }
    ],
    "steps": [
      {
        "key": "buscar_usuario",
        "name": "Buscar usuario",
        "type": "dynamic_service",
        "position": 1,
        "config": {
          "serviceKey": "buscar_usuario",
          "timeoutMs": 8000
        },
        "inputMap": {
          "email": "{{input.email}}"
        },
        "outputKey": "usuario",
        "nextStepKey": "responder"
      },
      {
        "key": "responder",
        "name": "Responder",
        "type": "response",
        "position": 2,
        "config": {
          "status": "success",
          "body": {
            "ok": true,
            "usuario": "{{steps.usuario}}"
          }
        },
        "inputMap": {},
        "outputKey": "response"
      }
    ],
    "output": {
      "stepKey": "responder",
      "responseTo": "caller"
    }
  }
}
```

Runtime use after publish:

```http
POST /api/flows/by-key/validar_usuario_reporte/execute
```

## Recommended AI sequence

1. Read available services and flows if the artifact references existing logic.
2. Generate JSON using the official examples.
3. Call the relevant `/authoring/json` endpoint with `publish=false` for a draft.
4. Test the runtime endpoint when possible.
5. Call `/authoring/json` again with `publish=true` when the JSON is ready.
6. Store the returned key, id and published version for future screens/forms/flows.

## Current gaps before assistant UI

- Add automated integration tests for all three `/authoring/json` endpoints.
- Add stronger JSON schema validation errors with field paths.
- Add optional dry-run mode: validate without saving.
- Extend `JsonAuthoringPanelComponent` with schema-path validation details when backend validators return them.
- Add assistant guardrails so generated JSON cannot reference blocked tables, private hosts or secrets.
