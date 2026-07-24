# Text And Language Architecture

Chicle treats user-facing text as a versioned platform contract. Admin, generated apps, templates, dynamic forms,
services, flows and screens must resolve labels, messages and help text through the same text runtime instead of
depending on hardcoded strings as the primary source of truth.

## Goals

- Let every generated app ship with a safe default text package.
- Let Admin and business apps update translations without rebuilding source code.
- Let the backend control default language per platform, tenant, app and artifact.
- Keep mobile apps usable offline with embedded and cached language bundles.
- Let Chicle AI generate, edit and explain text keys as part of forms, services, flows, screens and app templates.
- Avoid runtime performance problems by loading bundles, not querying one text key at a time.
- Keep secrets, private configuration and credentials out of translation packages.

## Core Rule

Every persisted dynamic object must prefer text keys plus fallback text:

```json
{
  "labelKey": "forms.login.fields.email.label",
  "fallbackLabel": "Email",
  "helpKey": "forms.login.fields.email.help",
  "fallbackHelp": "Use the email assigned to your account."
}
```

The fallback keeps the object readable when a translation is missing. The key lets Admin, templates and generated
artifacts replace the visible text by language, tenant, app or artifact.

## Scope

The same text architecture applies to:

- Chicle Admin.
- Generated web apps.
- Generated mobile apps.
- Generated desktop apps.
- Dynamic forms and fields.
- Dynamic screens and reusable components.
- Dynamic services, when they expose descriptions, examples, validation messages or user-visible errors.
- Flows, steps, status labels and final responses.
- Menus, permissions, preferences, setup, docs navigation and operational messages.
- App templates and exported/imported packages.

## Resolution Order

The text resolver returns the first available value in this order:

1. User language preference for the current session.
2. Artifact preference, when a generated app forces a default language.
3. App-level default language.
4. Tenant default language.
5. Platform default language.
6. Installed template default text package.
7. Embedded local fallback package.
8. `fallbackLabel`, `fallbackDescription`, `fallbackMessage` or equivalent fallback value from the object.
9. The key itself, only as a last debugging fallback.

This order lets Chicle run locally with no backend configuration, while still allowing production installations to
centralize language and text governance.

## Default Text Package For Generated Apps

Every generated app artifact must include a default text package at build/export time:

```json
{
  "schemaVersion": 1,
  "kind": "text_bundle",
  "artifactKey": "field_inspection_mobile",
  "namespace": "app.field_inspection",
  "defaultLocale": "en",
  "supportedLocales": ["en", "es"],
  "version": "1.0.0",
  "hash": "sha256-placeholder",
  "entries": {
    "app.title": "Inspections",
    "menu.home": "Home",
    "forms.inspection.submit": "Save inspection",
    "messages.saved": "Record saved successfully."
  }
}
```

The package is copied into the artifact so web, mobile and desktop apps can boot even when the API is temporarily
unavailable. After boot, the app asks the API for the active text bundle manifest and refreshes the cache only when the
version or hash changes.

## Backend Controlled Defaults

Language defaults are controlled by backend configuration, not by frontend constants:

| Level    | Example key                            | Purpose                                                 |
| -------- | -------------------------------------- | ------------------------------------------------------- |
| Platform | `i18n.defaultLocale`                   | Default when tenant or app does not specify a language. |
| Tenant   | `tenant.defaultLocale`                 | Organization-wide default.                              |
| App      | `app.<appKey>.defaultLocale`           | Default for a generated app.                            |
| Artifact | `artifact.<artifactKey>.defaultLocale` | Default for a specific deployed artifact.               |
| User     | `user.preference.locale`               | Personal session override.                              |

Admin preferences may change the current user's language immediately. Tenant, app and artifact defaults require an
owner/admin action and should be audited.

## Artifact Preferences

Generated artifacts need their own preferences, separate from Admin preferences:

```json
{
  "schemaVersion": 1,
  "kind": "artifact_preferences",
  "artifactKey": "field_inspection_mobile",
  "locale": {
    "defaultLocale": "es",
    "supportedLocales": ["es", "en"],
    "allowUserOverride": true,
    "fallbackLocale": "en"
  },
  "presentation": {
    "theme": "chicle",
    "themeMode": "system",
    "kit": "ionic",
    "density": "comfortable"
  },
  "runtime": {
    "offlineTextCache": true,
    "syncTextOnStart": true
  }
}
```

Admin must expose an Artifact Preferences module where owner/admin users can manage default language, supported
languages, theme, visual kit, density, mode and other runtime preferences for each generated app.

## Backend Objects

Implemented V1 objects:

| Object                        | Purpose                                                             |
| ----------------------------- | ------------------------------------------------------------------- |
| `translation_namespaces`      | Groups text by platform, tenant, template, app, module or artifact. |
| `translation_entries`         | Stores keys, locale, text, status and fallback metadata.            |
| `translation_bundle_versions` | Freezes published bundles by namespace, locale, version and hash.   |
| `translation_missing_keys`    | Observability table for keys requested but not found.               |

`confisys` remains useful for platform defaults, but high-volume text must live in translation bundles so the runtime
can cache and sync it efficiently.

Artifact and tenant preference contracts still belong to the same architecture, but their storage is handled by the
artifact/template preference modules instead of the core translation bundle tables.

## Runtime Endpoints

The API exposes the translation runtime under the `Translations` Swagger tag:

| Endpoint                                              | Protection             | Purpose                                                                                                       |
| ----------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /api/translations/namespaces`                    | `translations.read`    | Lists managed namespaces so Admin, generated apps and the assistant can discover available text packages.     |
| `GET /api/translations/bundles/{namespace}?locale=en` | Public bundle read     | Loads the active bundle for a namespace and locale. Falls back to seed text when the database is unavailable. |
| `PUT /api/translations/bundles/{namespace}/{locale}`  | `translations.manage`  | Publishes a new active bundle version and updates editable entries.                                           |
| `POST /api/translations/keys`                         | `translations.manage`  | Creates or updates one stable key across supported locales without forcing the user to edit the whole bundle. |
| `POST /api/translations/missing`                      | Public low-risk report | Stores missing keys asynchronously so rendering never blocks.                                                 |

The Admin route `/translations` requires `translations.read`. Publishing from the page requires
`translations.manage`. Owner/admin users can operate the page after the security seed has synchronized the new
permissions.

The Admin menu entry is seeded as `translations` under Administration. If an existing database does not show it, run the
security/base menu sync from the Security page so the tenant receives the new route permission and menu row.

## Frontend Runtime

The frontend exposes one text service with the following responsibilities:

- Resolve text by key and fallback.
- Load the active bundle manifest after login or app boot.
- Cache bundles locally by namespace, locale, version and hash.
- Support offline fallback for generated mobile apps.
- Report missing keys without blocking the screen.
- Let Admin preview another language without changing tenant defaults.
- Provide a simple pipe/helper for templates and dynamic renderers.

Recommended API:

```ts
text.t("forms.login.submit", "Sign in");
text.resolve({ key: "forms.login.submit", fallback: "Sign in" });
text.loadBundle({ namespace: "admin", locale: "en" });
```

Page components should not import language files directly. Dynamic form, screen and component renderers call the same
text service.

Current frontend runtime implementation:

- `I18nService` loads `i18n.defaultLocale` from public `confisys` when no user preference exists.
- `I18nService` loads `/translations/bundles/admin` and caches it under `localStorage` by namespace and language.
- `I18nService.refresh(namespace, locale)` can load app, form or screen namespaces on demand.
- Keys may be resolved from the active Admin dictionary or from an already loaded namespace using
  `namespace:key`, for example `forms.login:fields.email.label`.
- `TranslatePipe` exposes `{{ "key" | t }}` for templates.
- `ModuleHeaderComponent`, `PageShellComponent` and `MainNavComponent` support translation keys with local fallback
  text.
- Admin Preferences changes the current user's language immediately and refreshes the active bundle.
- The Text Bundles page can select existing namespaces, create a new namespace, search large packages, add one key
  across Spanish and English, edit current-locale values and publish a new version.

## Text Bundle Manager UX

The Admin text manager is search-first because a real product can have thousands of keys per namespace.

Rules:

- Do not render every key by default when a bundle is large.
- Show a clear search prompt when the active package has more than the interactive threshold.
- Search by key and by visible text.
- Limit visible results and show how many matches are hidden.
- Create one key with values for the installed languages in the same action.
- Editing a row updates the active locale only; creating a key can publish values for multiple locales at once.
- Keep namespace selection separate from language selection so generated apps can own their own text package.
- Chicle AI may prepare `namespace`, `key` and values through an `apply_translation_key` draft action, but the user must
  still review and save explicitly from the page.

The current V1 runtime ships with Spanish and English installed. Additional language installation is a runtime
registration step, not just a UI dropdown, because generated offline apps must know which bundles to embed, cache,
sync and validate. New locales should be added through the same contract: register the locale, publish default bundles,
include it in artifact preferences and sync it into generated app packages.

## Dynamic Form Contract

Dynamic forms should keep text keys beside fallbacks:

```json
{
  "key": "login",
  "titleKey": "forms.login.title",
  "title": "Sign in",
  "descriptionKey": "forms.login.description",
  "description": "Access with your credentials.",
  "runtime": {
    "submitLabelKey": "forms.login.submit",
    "submitLabel": "Sign in"
  },
  "steps": [
    {
      "key": "credentials",
      "titleKey": "forms.login.steps.credentials.title",
      "title": "Credentials",
      "fields": [
        {
          "key": "email",
          "type": "email",
          "labelKey": "forms.login.fields.email.label",
          "label": "Email",
          "placeholderKey": "forms.login.fields.email.placeholder",
          "placeholder": "admin@example.com",
          "validationMessages": {
            "requiredKey": "forms.login.fields.email.required",
            "required": "Email is required."
          }
        }
      ]
    }
  ]
}
```

The direct `title`, `description`, `label`, `placeholder`, `help`, `text` and `runtime.submitLabel` values are the
fallbacks. New authoring should generate the matching `*Key` beside each fallback, not a separate `fallback*` property.
This keeps JSON readable for humans and immediately usable when a bundle is missing.

## Dynamic Screen Contract

Dynamic screens follow the same rule:

```json
{
  "componentKey": "ui.action-card",
  "titleKey": "screens.home.cards.pending.title",
  "title": "Pending work",
  "bodyKey": "screens.home.cards.pending.body",
  "body": "Review items waiting for action."
}
```

Screens may compose forms, services and flows, but text remains independent from component implementation.

## Template Package Integration

Template packages must include public text bundles and artifact preferences:

```json
{
  "objects": {
    "forms": [],
    "services": [],
    "flows": [],
    "screens": [],
    "textBundles": [],
    "artifactPreferences": []
  },
  "locales": {
    "defaultLocale": "es",
    "supportedLocales": ["es", "en"],
    "requiredNamespaces": ["app.field_inspection", "forms.inspection"]
  }
}
```

Rules:

- A template may include public labels, messages and help text.
- A template must not include secrets, credentials, private API keys or environment values.
- Import dry-run must report key conflicts, missing locales and missing fallbacks.
- Install must ask before overwriting tenant overrides.
- Export must include every namespace referenced by exported screens, forms, menus and flows.

## Admin Rules

Admin must comply with the same architecture:

- Admin UI text uses the text service.
- Admin ships with an embedded default Admin bundle.
- Admin can refresh backend-managed Admin translations after login.
- Admin preferences control the current user's language.
- Owner/admin users can manage platform, tenant, app and artifact language defaults.
- Missing Admin keys are visible in an operational report.

Hardcoded text is acceptable only as a local fallback during migration. It is not the final source of truth.

## Chicle AI Rules

When Chicle AI creates or edits objects, it must:

- Generate keys and fallback text together.
- Use stable namespaces based on object type and key.
- Avoid duplicate keys when editing an existing object.
- Ask before changing the default language of a tenant, app or artifact.
- Include missing translations in a reviewable draft.
- Prefer concise, user-facing text over technical explanations inside runtime objects.
- Never place secrets inside text bundles.
- When a prompt creates a form or screen, insert `titleKey`, `descriptionKey`, field keys, button keys and message keys
  automatically.
- When a prompt creates a generated app, create or reuse one app namespace and one namespace per portable form/screen
  when that object can be exported independently.
- When a prompt edits text, update the text bundle first and then adjust the referenced object only if the key changes.
- When the user asks for another language, verify the language is installed before generating a bundle for it.

Assistant actions for the text manager:

```json
{
  "type": "apply_translation_key",
  "namespace": "forms.login",
  "key": "submit",
  "values": {
    "es": "Iniciar sesion",
    "en": "Sign in"
  }
}
```

This action only fills the Admin text manager. The persistence step is still `POST /api/translations/keys`, triggered by
the user's explicit save.

Example assistant output for a new login form should include:

```json
{
  "titleKey": "forms.login.title",
  "title": "Sign in",
  "runtime": {
    "submitLabelKey": "forms.login.submit",
    "submitLabel": "Sign in"
  }
}
```

## Performance

The runtime must never request one key at a time during normal rendering.

Required behavior:

- Load bundles by namespace and locale.
- Use ETag, hash or version checks before downloading a bundle.
- Cache locally in browser storage or IndexedDB.
- Preload required namespaces for the current route, form or screen.
- Keep generated mobile artifacts bootable with embedded bundles.
- Report missing keys asynchronously.

## Security

Translation and artifact preference management is administrative functionality:

- Read public app bundles only when the app is public.
- Require authentication for Admin bundles and tenant-private bundles.
- Require owner/admin permissions to edit platform, tenant, app or artifact defaults.
- Audit every publish, override and rollback.
- Sanitize rendered text. Text bundles must not execute HTML, scripts or Angular templates.
- Keep secrets in Chicle Vault or approved environment providers, never in translations.

## Implemented V1 Scope

V1 delivers:

1. Text contract with key plus fallback support.
2. Backend translation bundle storage and read endpoints.
3. Admin embedded default bundle.
4. Frontend text resolver with backend bundle loading and local cache.
5. Backend default language from `confisys`.
6. Admin preferences language selector connected to the same resolver.
7. Admin Text Bundles page for owner/admin users.
8. Missing-key observability endpoint.
9. `translations.read` and `translations.manage` permissions.
10. Swagger documentation under the `Translations` tag.
11. Search-first bundle manager for large namespaces.
12. Multi-locale key creation through `POST /api/translations/keys`.

The same runtime contract is used by the surrounding dynamic modules:

1. Generated app default text package in template export.
2. Artifact Preferences module for locale/theme/kit/density defaults.
3. Dynamic Forms integration for titles, labels, placeholders, help and validation messages.
4. Dynamic Screens integration for component labels, messages and page copy.
5. AI authoring rules for text keys, fallbacks and translation drafts.
6. Missing-key observability and audit events.

This gives Chicle one consistent language system for Admin and generated artifacts without sacrificing local startup,
offline execution or backend-controlled governance.
