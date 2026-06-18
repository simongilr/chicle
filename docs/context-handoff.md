# Context Handoff For New Codex Conversation

We are creating a new product called Chicle Engine. It must not be a SmartSeal fork. SmartSeal is only a reference template seed used to prove the engine can execute a complex operational app from database configuration.

## Closed Decisions

- Repo name: `chicle-engine`
- Backend: NestJS
- Frontend: Ionic Angular + PrimeNG
- Database: MySQL/MariaDB
- ORM: TypeORM
- Package manager: npm
- Monorepo: `apps/api` and `apps/app`
- Storage V1: local disk
- Deployment V1: docker compose
- Tenants: yes, shared database with `tenant_id`

## Product Idea

Chicle Engine is a plug and play application engine. A user should be able to run it, complete a setup wizard, optionally load a template, and start operating.

## Core Must Stay Generic

Do not add core modules named after SmartSeal concepts such as seals, containers, RFID, BLE locks or BASC. Those concepts belong only in seeds/templates.

## Core Concepts

- setup
- auth
- tenants
- users
- roles
- permissions
- settings
- menus
- dynamic forms
- workflows
- actions
- records
- events
- files/evidence
- devices
- offline sync
- audit

## Template Rule

`scripts/templates/smartseal-reference.seed.ts` may be very complete, but deleting it must leave Chicle Engine fully functional.

## Development Next Step

Continue from the scaffold, install dependencies, and make the API and app boot locally. Then implement setup, tenants and auth first.

Before implementing auth, roles, permissions or transport security, read `docs/security-auth-review.md`.
