# Context Handoff For New Codex Conversation

We are creating a new product called Chicle Engine. It must stay generic. Containers is only a reference template seed used to prove the engine can execute a complex operational app from database configuration.

## Closed Decisions

- Repo name: `chicle-engine`
- Backend: NestJS
- Frontend: Ionic Angular + PrimeNG
- Database: MySQL/MariaDB
- ORM: TypeORM
- Package manager: npm
- Monorepo: `apps/api` and `apps/app`
- Storage V1: local disk
- Deployment V1: Docker-packaged artifacts, with compose files for local development
- Tenants: yes, shared database with `tenant_id`

## Product Idea

Chicle Engine is a plug and play application factory. A user should be able to run it, complete a setup wizard, open
Admin, create or install tenant apps, publish them and operate from web, mobile or desktop runtimes.

## Core Must Stay Generic

Do not add core modules named after containers-domain concepts such as container seals, RFID, BLE locks, custody checkpoints or compliance programs. Those concepts belong only in seeds/templates.

## Core Concepts

- setup
- auth
- tenants
- users
- roles
- permissions
- settings
- menus
- App Studio
- dynamic apps
- dynamic screens
- landing pages
- component templates
- dynamic forms
- dynamic services
- workflows
- actions
- records
- events
- text packages
- artifact preferences
- files/evidence
- devices
- offline sync
- audit
- environment/deploy center
- Chicle AI

## App Studio Direction

App Studio belongs to Admin. It manages a tenant app portfolio, not isolated pages. A tenant can own many apps, and each
app owns its screens, routes, navigation, login/security, component bindings, text namespace, theme, permissions,
versions, publication state, package dependencies and audit history.

Generated web, mobile and desktop apps are runtime artifacts. They boot with tenant/app/environment configuration,
load bundled defaults and resolve the active published contract through the API:

```txt
tenant + appKey + target + route
  -> published app version
  -> published screen version
  -> registered components
  -> bindings/actions runtime
  -> text and presentation
```

Prompts such as "create an app called Tuerca with login, home and a menu of forms" must produce an app graph:

```txt
App -> Screens -> Components -> Bindings -> Actions -> Text -> Policies -> Tests
```

The assistant applies reviewable drafts only. Admin users save, version and publish explicitly from App Studio.

## Template Rule

`scripts/templates/containers-reference.seed.ts` may be very complete, but deleting it must leave Chicle Engine fully functional.

## Development Next Step

Continue App Studio after the V2 foundation. `/apps` now has a tenant app portfolio and selected-app workspace with
summary, pages, navigation, security, preview, publish/package JSON and trash. The next goal is the generated-app
runtime: resolve `tenant + appKey + target + route`, render published screens from the component registry, execute
bindings/actions, and harden export/import with dependency dry-run and conflict handling.

Before implementing auth, roles, permissions or transport security, read `docs/security-auth-review.md`. Before
changing app, screen, component or package behavior, read `docs/platform-architecture.md`,
`docs/screen-app-designer-architecture.md`, `docs/app-template-factory-architecture.md` and
`docs/ai-authoring-guide.md`.
