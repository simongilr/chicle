# AI-Ready Authoring

This document is the official contract for Chicle AI assistants that create Chicle artifacts from JSON.

The assistant must be able to create, update, version, publish and test Apps, Screens, Forms, Dynamic Services and
Flows without depending on the guided UI. The guided UI is helpful for humans; the JSON contract is the source of truth
for AI.

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

Apps, Screens, Forms, Dynamic Services and Flows use the same JSON authoring principle in the frontend. The component
surface exposes the same visual sequence for all artifacts:

1. Edit the JSON contract.
2. Review JSON valid/invalid status.
3. Apply JSON to the guided UI when a human wants to inspect it visually.
4. Save draft with `publish=false`.
5. Save and publish with `publish=true`.

This is the UI surface assistants use when operating from the browser. The guided controls and the JSON
editor are equivalent authoring paths; the JSON panel is the canonical path for AI-generated artifacts.

## Permissions

The caller needs normal tenant auth plus the module permission:

| Artifact | Create/update | Execute/test |
| --- | --- | --- |
| Dynamic Apps | `apps.manage` | Runtime contract: authenticated user plus published app/screen/component permissions |
| Dynamic Screens | `apps.manage` | Runtime contract: authenticated user plus published screen/component permissions |
| Dynamic Forms | `forms.manage` | `forms.submit` |
| Dynamic Services | `services.manage` | `services.execute` |
| Flows | `flows.create` or `flows.update` | `flows.execute` |

Admin authoring endpoints still use Admin permissions such as `apps.read`, `apps.manage`, `apps.publish`,
`apps.export` and `apps.install`. Generated apps do not require Admin read access to run; they only receive published
runtime contracts filtered by business permissions.

## Apps JSON-only endpoint

```http
POST /api/apps/authoring/json
```

Request:

```json
{
  "publish": false,
  "document": {
    "schemaVersion": 1,
    "kind": "dynamic_app",
    "key": "tuerca",
    "name": "Tuerca",
    "description": "Business app for operational forms.",
    "category": "operations",
    "targets": ["web", "mobile"],
    "presentation": {
      "kit": "auto",
      "theme": "chicle",
      "themeMode": "system",
      "density": "comfortable"
    },
    "text": {
      "namespace": "app.tuerca",
      "defaultLocale": "en",
      "bundledLocales": ["en", "es"]
    },
    "navigation": {
      "mode": "screen_routes",
      "startRoute": "/home",
      "groups": [
        { "key": "main", "label": "Main", "placement": "top" },
        { "key": "mobile", "label": "Mobile", "placement": "bottom" }
      ]
    },
    "routing": {
      "basePath": "/apps/tuerca",
      "publicBasePath": "/public/tuerca",
      "strategy": "tenant_app_routes"
    },
    "security": {
      "mode": "authenticated",
      "loginScreenKey": "login",
      "publicScreens": []
    },
    "lifecycle": {
      "status": "draft",
      "publishedVersion": null
    },
    "permissions": ["apps.tuerca.read"],
    "screens": ["login", "home"],
    "settings": {}
  }
}
```

Runtime use after publish:

```http
GET /api/apps/by-key/tuerca/runtime
```

Preferred route-level runtime lookup for generated web, Ionic or desktop shells:

```http
GET /api/apps/by-key/tuerca/runtime-route?route=/home&target=web
```

The route-level response returns the published app manifest, selected published screen, target-filtered navigation,
component catalog and cache metadata. Assistants should use this endpoint when validating that a generated app can boot
one route without loading every screen.

Admin shell validation after publish:

```text
/apps/run/tuerca?route=/home&target=web
```

Use this route to confirm that the published app contract can render through the generated-app shell before exporting
or packaging the app.

Package install dry-run:

```http
POST /api/apps/packages/dry-run
```

Use this endpoint before installing a generated package. It validates the app key, screen keys, component keys and
dependency snapshot without creating database rows. Assistants should call or propose this step before package install.

## Screens JSON-only endpoint

```http
POST /api/apps/screens/authoring/json
```

Request:

```json
{
  "publish": false,
  "document": {
    "schemaVersion": 1,
    "kind": "dynamic_screen",
    "appKey": "tuerca",
    "key": "home",
    "title": "Home",
    "description": "Main menu for the Tuerca app.",
    "route": "/home",
    "target": "multi",
    "category": "main",
    "navigation": {
      "showInMenu": true,
      "label": "Home",
      "group": "main",
      "icon": "home",
      "permissions": ["apps.tuerca.read"]
    },
    "layout": {
      "strategy": "responsive_regions",
      "regions": ["header", "content", "actions"],
      "desktop": { "columns": 2 },
      "tablet": { "columns": 1 },
      "mobile": { "columns": 1, "navigation": "bottom_actions" }
    },
    "components": [
      {
        "id": "main_menu",
        "componentKey": "nav_menu",
        "title": "Main menu",
        "region": "content",
        "order": 1,
        "bindings": {
          "type": "source",
          "key": "tuerca"
        },
        "actions": [],
        "layout": {
          "desktop": "full",
          "tablet": "full",
          "mobile": "full",
          "align": "stretch",
          "chrome": "card"
        }
      }
    ],
    "dataSources": [],
    "actions": [],
    "permissions": ["apps.tuerca.read"],
    "tests": []
  }
}
```

Runtime use after publish:

```http
GET /api/apps/by-key/tuerca/runtime
```

The current runtime endpoint returns the published app contract and its published screens. The frontend runtime selects
the route and target-specific renderer from that contract.

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
    "key": "client_onboarding",
    "title": "Client onboarding",
    "description": "Capture initial client data.",
    "category": "clients",
    "runtime": {
      "mode": "guided",
      "submitLabel": "Create client",
      "offline": {
        "enabled": true,
        "queueKey": "client_onboarding",
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
          "recordType": "client_onboarding"
      }
    },
    "steps": [
      {
        "key": "basic_data",
        "title": "Basic data",
        "fields": [
          { "key": "name", "name": "name", "type": "text", "label": "Name", "required": true },
          { "key": "email", "name": "email", "type": "email", "label": "Email", "required": true }
        ]
      }
    ],
    "commands": [],
    "actions": [
      {
        "event": "onSubmit",
        "type": "create_record",
        "recordType": "client_onboarding",
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
GET /api/forms/by-key/client_onboarding/runtime
POST /api/forms/by-key/client_onboarding/submit
```

## Dynamic Services JSON-only endpoint

```http
POST /api/dynamic-services/authoring/json
```

Request:

```json
{
  "key": "find_user",
  "name": "Find user",
  "description": "Query users by email or name.",
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
POST /api/dynamic-services/by-key/find_user/execute
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
      "key": "validate_user_report",
      "name": "Validate user and respond",
      "description": "Validates a user with a service and returns a response to the caller.",
      "category": "operations"
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
        "key": "find_user",
        "name": "Find user",
        "type": "dynamic_service",
        "position": 1,
        "config": {
          "serviceKey": "find_user",
          "timeoutMs": 8000
        },
        "inputMap": {
          "email": "{{input.email}}"
        },
        "outputKey": "user",
        "nextStepKey": "respond"
      },
      {
        "key": "respond",
        "name": "Respond",
        "type": "response",
        "position": 2,
        "config": {
          "status": "success",
          "body": {
            "ok": true,
            "user": "{{steps.user}}"
          }
        },
        "inputMap": {},
        "outputKey": "response"
      }
    ],
    "output": {
      "stepKey": "respond",
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

1. Determine whether the request is for an app graph, one screen, one form, one service or one flow.
2. Read existing tenant artifacts if the request references forms, services, flows, tables, screens, component
   templates, text packages or permissions.
3. Generate JSON using the official examples.
4. Call the relevant `/authoring/json` endpoint with `publish=false` for a draft.
5. Test the runtime endpoint when possible.
6. Call `/authoring/json` again with `publish=true` when the JSON is ready.
7. Store the returned key, id and published version for apps, screens, forms, services and flows.

## Current gaps before assistant UI

- Add automated integration tests for every `/authoring/json` endpoint.
- Add stronger JSON schema validation errors with field paths.
- Add optional dry-run mode: validate without saving.
- Extend `JsonAuthoringPanelComponent` with schema-path validation details when backend validators return them.
- Add assistant guardrails so generated JSON cannot reference blocked tables, private hosts or secrets.
