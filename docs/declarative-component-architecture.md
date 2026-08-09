# Declarative Component Architecture

## Purpose

Chicle components must be reusable visual and functional objects. A component is not only an Angular template, an Ionic
control or a styled card. It is a versionable contract that describes what the component is, how it looks, where it gets
data from, which events it emits, which actions it runs, which permissions protect it, how it behaves in every visual
kit and how it is rendered in design-time preview and runtime apps.

This document is the canonical rule for Admin components, generated apps, App Studio, Dynamic Forms, landing pages and
future component templates.

Generated app delivery, app manifests, runtime cache, offline queues and app-level binding/action orchestration are
defined in `docs/dynamic-app-runtime-architecture.md`. This document defines the component object used inside that
runtime graph.

## Core Principle

Store component behavior as declarative objects, not as page-local code.

Allowed:

- typed component contracts;
- registered component keys;
- declarative properties;
- bindings to forms, services, flows, tables, text bundles, app state or route params;
- declarative events and actions;
- permission and visibility policies;
- kit adapters for PrimeNG, Ionic, Material, Bootstrap and native fallback;
- preview fixtures and tests;
- explicit lifecycle states.

Not allowed:

- hardcoded business routes inside visual components;
- page-local buttons that call business logic directly when the same behavior can be an action contract;
- raw Angular, Ionic, PrimeNG, Material or Bootstrap selectors stored in tenant JSON;
- CSS classes stored as product behavior;
- API URLs, secrets or tenant-specific values embedded in component props;
- generated components that only work in one screen;
- mock previews that differ from runtime behavior when a real adapter exists.

## Architecture Layers

```txt
Component Contract
  -> Component Registry
     -> Kit Adapter
        -> Design-Time Preview
        -> Runtime Renderer
  -> Binding Resolver
  -> Action Runner
  -> Permission Resolver
  -> Text Resolver
  -> State Resolver
```

| Layer | Responsibility |
| --- | --- |
| Component contract | The persisted object that describes visual, data and behavior configuration. |
| Component registry | The source of truth for component keys, schemas, default props, adapter support and examples. |
| Kit adapter | The implementation that renders the same component through PrimeNG, Ionic, Material, Bootstrap or native fallback. |
| Design-time preview | The App Studio/component-gallery renderer. It uses safe sample data and the same registry as runtime. |
| Runtime renderer | The generated app renderer. It reads published contracts only and executes bindings/actions safely. |
| Binding resolver | Reads data from approved sources and maps it into component inputs. |
| Action runner | Executes declarative actions such as navigation, service execution, flow execution, modal open or message display. |
| Permission resolver | Filters visibility and execution by tenant, user, role, permission and resource policy. |
| Text resolver | Resolves labels, help text, messages and placeholders through text bundles and local fallbacks. |
| State resolver | Normalizes loading, empty, error, success, disabled and readonly states. |

## Standard Component Object

Every component created by App Studio, Dynamic Forms, a template package or Chicle AI must follow this shape. Specific
component families can add typed fields, but they must not replace the common structure.

```json
{
  "schemaVersion": 1,
  "kind": "dynamic_component",
  "id": "cmp_home_save_customer",
  "componentKey": "button",
  "name": "Save Customer",
  "description": "Runs the customer save service and navigates back to the list.",
  "version": 1,
  "status": "draft",
  "target": {
    "surfaces": ["web", "mobile", "desktop"],
    "roles": ["runtime", "preview"]
  },
  "layout": {
    "region": "actions",
    "width": "full",
    "align": "stretch",
    "order": 30,
    "responsive": {
      "desktop": { "width": "one_third", "align": "end" },
      "tablet": { "width": "full", "align": "stretch" },
      "mobile": { "width": "full", "align": "stretch", "sticky": "bottom" }
    }
  },
  "presentation": {
    "kit": "auto",
    "theme": "inherit",
    "density": "inherit",
    "variant": "solid",
    "tone": "success",
    "tokens": {}
  },
  "props": {
    "labelKey": "screens.customers.save",
    "icon": "save",
    "disabledWhen": "{{state.saving}}"
  },
  "data": {
    "sources": [
      {
        "key": "customerForm",
        "type": "form_state",
        "ref": "form.customer"
      }
    ],
    "bindings": {
      "payload": "{{customerForm.value}}"
    }
  },
  "events": {
    "onClick": [
      {
        "type": "execute_service",
        "serviceKey": "create_customer",
        "payloadMap": {
          "input": "{{bindings.payload}}"
        },
        "resultKey": "createdCustomer",
        "onSuccess": [
          {
            "type": "show_message",
            "tone": "success",
            "messageKey": "screens.customers.saved"
          },
          {
            "type": "navigate",
            "route": "/customers"
          }
        ],
        "onError": [
          {
            "type": "show_message",
            "tone": "danger",
            "messageKey": "screens.customers.saveFailed"
          }
        ]
      }
    ]
  },
  "permissions": {
    "visibleWhen": ["customers.read"],
    "enabledWhen": ["customers.create"],
    "executeWhen": ["customers.create"]
  },
  "states": {
    "loading": {
      "labelKey": "common.saving"
    },
    "empty": {
      "messageKey": "common.noData"
    },
    "error": {
      "messageKey": "common.unexpectedError"
    }
  },
  "i18n": {
    "namespace": "screens.customers",
    "requiredKeys": [
      "screens.customers.save",
      "screens.customers.saved",
      "screens.customers.saveFailed"
    ]
  },
  "preview": {
    "fixture": {
      "customerForm": {
        "value": {
          "name": "Customer Demo",
          "email": "customer@example.com"
        }
      }
    },
    "interactive": true
  },
  "audit": {
    "createdBy": "{{currentUser.id}}",
    "createdAt": "{{now}}"
  }
}
```

## Required Fields

| Field | Rule |
| --- | --- |
| `schemaVersion` | Required. Enables safe migration. |
| `kind` | Required. Use `dynamic_component` for standalone reusable component objects and embedded screen components. |
| `componentKey` | Required. Must exist in the registry. AI and imports must not invent it. |
| `layout` | Required for screen components. Defines region, order and responsive behavior. |
| `presentation` | Required. Stores kit/theme intent, not CSS classes or library tags. |
| `props` | Required, can be empty. Stores component-specific display options. |
| `data` | Required, can be empty. Defines sources and bindings. |
| `events` | Required, can be empty. Maps component events to declarative actions. |
| `permissions` | Required, can be empty. Defines visible, enabled and executable authority. |
| `states` | Required. Components must know how to show loading, empty, error, success, disabled and readonly states. |
| `i18n` | Required for user-facing components. Text keys are preferred over literal labels. |
| `preview` | Required. Allows App Studio and Components gallery to render and test the component. |

## Component Registry Contract

The registry describes what the platform supports. It is the source used by the Components page, App Studio palette,
Chicle AI and runtime validation.

```json
{
  "componentKey": "side_nav",
  "name": "Side Navigation",
  "family": "navigation",
  "purpose": "Shows application routes from the selected app navigation tree.",
  "targets": ["web", "desktop", "mobile"],
  "recommendedRegions": ["header", "aside"],
  "supportedKits": ["primeng", "ionic", "material", "bootstrap", "native"],
  "propsSchema": {
    "titleKey": "string",
    "mode": ["inline", "overlay", "drawer"]
  },
  "dataSchema": {
    "sources": ["app_navigation", "service", "static_options"]
  },
  "eventsSchema": {
    "onItemSelect": ["navigate", "execute_service", "execute_flow"]
  },
  "defaultContract": {},
  "previewFixture": {},
  "definitionOfDone": [
    "Renders in every declared kit.",
    "Works at 390 px without horizontal overflow.",
    "Filters items by permission.",
    "Design preview and runtime use the same adapter."
  ]
}
```

Registry rules:

- A component cannot be added to App Studio until it has a registry entry.
- A component cannot claim Ionic, Material, Bootstrap or PrimeNG support until it has a real adapter or an explicit
  fallback note.
- A component cannot be exported in a template package unless its component key and version are known to the registry.
- AI must choose from the registry and must explain missing components instead of inventing new keys.

## Visual Kit Adapter Rule

The stored component contract never names framework-specific tags. It asks for a semantic component and a presentation
preference. The adapter chooses the real implementation.

```txt
button + kit=ionic    -> ion-button
button + kit=material -> mat-button
button + kit=primeng  -> p-button
button + kit=bootstrap -> btn classes
button + kit=native   -> HTML button
```

The same rule applies to fields, cards, menus, tabs, modals, lists, tables, galleries, maps and action bars.

Kit adapter requirements:

- consume Chicle tokens for color, radius, density and typography;
- use native framework primitives when the kit exists;
- keep events normalized so runtime actions are kit-independent;
- support readonly, disabled, loading, error and validation states;
- include preview fixtures;
- include a fallback only when the target kit cannot represent the component yet.

## Event And Action Contract

Components do not execute business logic directly. Components emit events. The Action Runner executes actions declared
in the component contract.

Supported event names are component-specific, but common names are:

- `onClick`
- `onSubmit`
- `onChange`
- `onSelect`
- `onOpen`
- `onClose`
- `onLoad`
- `onRefresh`
- `onRowAction`

Supported action types:

| Action | Use |
| --- | --- |
| `navigate` | Move to another route inside the generated app. |
| `execute_service` | Run a Dynamic Service by key. |
| `execute_flow` | Run a Flow by key. |
| `open_modal` | Open a modal component or modal template. |
| `close_modal` | Close the active modal. |
| `show_message` | Display a success, info, warning or error message. |
| `set_state` | Update local screen/app state. |
| `emit_event` | Emit an application event for the event engine or local runtime. |
| `refresh_binding` | Reload a data source. |
| `submit_form` | Submit an embedded Dynamic Form. |
| `download_file` | Start a safe file download through backend authorization. |
| `logout` | End the current session through Auth. |

Actions must be validated before publication. Unsafe actions require explicit permissions and backend validation.

## Binding Contract

Bindings connect components to data. A component can read from multiple approved source types:

| Source | Example |
| --- | --- |
| `static` | Fixed options or demo cards. |
| `text_bundle` | Labels, placeholders and messages. |
| `app_navigation` | Published app navigation tree. |
| `route_params` | `customerId` from the current route. |
| `query_params` | Filters from the URL. |
| `form_state` | Current values/errors from an embedded form. |
| `dynamic_service` | Service response data. |
| `dynamic_flow` | Flow result data. |
| `record` | Generic record payload. |
| `table` | Controlled internal table data through a Dynamic Service. |
| `current_user` | Current authenticated user claims. |
| `current_tenant` | Current tenant metadata. |
| `local_state` | Screen state such as selected tab, modal open or row selected. |

Direct SQL, raw API URLs and direct table writes are not valid bindings. Backend modules and Dynamic Services own data
access.

## Permission Contract

Every component has three permission layers:

| Layer | Meaning |
| --- | --- |
| `visibleWhen` | User can see the component. |
| `enabledWhen` | User can interact with the component. |
| `executeWhen` | User can run the action behind the interaction. |

The runtime must re-check execute permissions server-side when an action calls backend functionality. UI filtering is
not security by itself.

## Text Contract

Components must use text keys whenever the value is user-facing. Literal strings are allowed only for local development
fixtures or temporary drafts.

Recommended pattern:

```json
{
  "props": {
    "labelKey": "apps.tuerca.home.openInspection",
    "helpKey": "apps.tuerca.home.openInspectionHelp"
  },
  "i18n": {
    "namespace": "apps.tuerca",
    "requiredKeys": [
      "apps.tuerca.home.openInspection",
      "apps.tuerca.home.openInspectionHelp"
    ]
  }
}
```

When AI creates a component, it must also propose required text keys. The text manager remains the place to edit,
translate, import and publish text packages.

## Preview And Runtime Parity

Design-time preview and runtime rendering must share the same registry and adapters.

Allowed preview differences:

- safe sample data;
- sandboxed service/flow execution;
- visible test status;
- mocked device frame;
- non-destructive modal or navigation simulation.

Not allowed:

- a generic placeholder when a real adapter exists;
- a visual style that differs from the runtime kit;
- preview-only component props that cannot be published;
- controls that appear interactive but do not report their state.

## Component Families

Chicle component contracts are grouped into families:

| Family | Examples |
| --- | --- |
| Navigation | `nav_menu`, `side_nav`, `bottom_nav`, `tabs`, `breadcrumb`. |
| Auth | `auth_login`, `logout_button`, `session_badge`. |
| Forms | `form_runtime`, `field_group`, `submit_bar`, `validation_summary`. |
| Data | `data_table`, `search_panel`, `detail_panel`, `entity_card`, `metric_strip`. |
| Actions | `button`, `service_button`, `flow_button`, `action_bar`, `row_action`. |
| Feedback | `status_notice`, `toast`, `alert`, `empty_state`, `loading_state`. |
| Overlays | `modal_shell`, `drawer`, `confirm_dialog`, `action_sheet`. |
| Media | `media_gallery`, `image_viewer`, `camera_capture`, `file_uploader`. |
| Location | `map_view`, `gps_capture`. |
| Timeline | `timeline`, `activity_feed`, `audit_list`. |
| Layout | `card`, `panel`, `section`, `grid`, `split_view`, `stack`. |
| Text | `heading`, `paragraph`, `rich_text`, `markdown_view`. |

Each family can have specialized props and events, but must keep the common contract shape.

## Versioning And Publication

Component contracts follow the same lifecycle as services, forms, flows and screens:

```txt
draft -> version -> published -> runtime
trash -> restore or permanent delete by policy
```

Publication rules:

- Drafts can be visually edited and JSON-edited.
- Versions are immutable.
- Published versions are the only runtime source.
- Trash releases keys for new drafts unless a restore conflict exists.
- Restore must ask how to handle conflicts when a key has been reused.
- Template packages store component version references and compatibility requirements.

## App Studio Authoring Flow

The constructor edits components through an inspector, not by changing page code.

```txt
1. Choose a component from the registry palette.
2. Place it in a semantic region.
3. Configure layout and presentation.
4. Choose bindings from approved sources.
5. Configure events and actions.
6. Add permissions.
7. Add text keys.
8. Preview desktop, tablet and mobile.
9. Save draft, create version or publish.
```

The inspector must expose:

- identity and component key;
- region, width, alignment and order;
- visual kit, theme, density and tone;
- props;
- data bindings;
- events and actions;
- permissions;
- states;
- text keys;
- JSON advanced editor;
- preview/test panel.

## AI Authoring Rule

Chicle AI must never output arbitrary UI instructions when a component contract is expected. It must:

1. Read the current app, screen, selected component and registry.
2. Normalize the user request into a component intent.
3. Choose an existing component key or report that a new reusable component template is required.
4. Generate or modify the declarative component contract.
5. Add text keys, permissions, bindings and actions.
6. Apply a draft visually.
7. Ask the user to review, test and publish from the designer.

AI must not save or publish automatically unless the platform has a specific, permission-protected approval flow.

## Backend Validation

Before a screen or component version can be published, backend validation must check:

- component key exists;
- schema version is supported;
- target and kit support are valid;
- required props are present;
- bindings use allowed source types;
- referenced services, forms, flows, screens, text keys and permissions exist or are allowed drafts;
- actions are allowed for the current tenant and user;
- no raw secrets, URLs or unsupported code snippets are embedded;
- preview fixture is safe;
- runtime fallback exists for every declared target.

## Definition Of Done For A New Component

A component is not complete until all points are true:

1. It has a registry entry.
2. It has a typed contract schema.
3. It renders in design-time preview.
4. It renders in runtime.
5. It supports every kit it declares.
6. It has loading, empty, error, disabled and readonly states when relevant.
7. It accepts bindings through the Binding Resolver.
8. It emits events through the Action Runner.
9. It supports permission filtering and execution checks.
10. It uses text keys for user-facing text.
11. It works at desktop, tablet and 390 px mobile widths.
12. It is documented in the component catalog and inventory.
13. It has examples that Chicle AI can use.
14. It has tests or preview fixtures that prove the main path.

## Migration Rule For Existing Admin Components

Existing reusable Admin components can keep Angular inputs and outputs, but App Studio components need a declarative
wrapper. The migration path is:

```txt
Existing Angular component
  -> Registry entry
  -> Declarative contract schema
  -> Preview adapter
  -> Runtime adapter
  -> AI examples
```

This lets the Admin keep moving while the generated-app runtime becomes fully object-driven.

## Current Priority

The next implementation work should focus on:

1. creating the shared `DynamicComponentContract` type;
2. extending the component registry with props, bindings, events, actions, permissions, states and adapter support;
3. making App Studio preview consume registry adapters instead of handwritten placeholders;
4. adding Ionic-native adapters for the mobile component families;
5. adding backend validation for component contracts before screen publication;
6. adding AI examples for component creation and component modification.

These steps make the application generator dynamic, administrable and safe without hardcoding behavior into pages.
