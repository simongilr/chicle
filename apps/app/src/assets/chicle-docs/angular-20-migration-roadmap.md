# Angular 20 migration roadmap

Status: completed on 2026-07-05. See
`docs/angular-20-migration-report.md` for the installed matrix and verification
evidence.

## Purpose

This document is the official execution plan for moving the Chicle Engine frontend
from Angular 19 to Angular 20 without mixing unrelated platform changes.

The migration is considered complete only when the application compiles in
production, its critical workflows pass, the visual component catalog is stable,
and the dependency tree contains one compatible copy of Angular, PrimeNG and
TypeScript.

This is a migration plan, not an instruction to update packages immediately.
Each phase has its own entry conditions, validation and rollback point.

## Decision

Target Angular 20.3 instead of Angular 21 or 22.

Reasons:

- Angular 19 is no longer in active support.
- Angular 20.3 supports Node 22 and TypeScript 5.8.
- PrimeNG 20 is aligned with Angular 20.
- Ionic 8 supports the Angular 20 line used by the application.
- Angular 21 support is not yet a sufficiently conservative target for the full
  Ionic, PrimeNG and Formly combination used here.

Angular 21, Angular 22, NestJS 11, Capacitor 8, zoneless Angular and the new
application builder are separate platform decisions. They must not be added to this
migration.

## Audited baseline

Audit date: 2026-07-04.

| Area                    | Current state                             | Finding                               |
| ----------------------- | ----------------------------------------- | ------------------------------------- |
| Node                    | 22.22.2 through `.nvmrc`                  | Compatible with Angular 20            |
| Angular                 | 19.2.25                                   | Upgrade required                      |
| Angular CLI             | 19.2.27                                   | Upgrade required                      |
| Ionic Angular           | 8.8.11                                    | Patch to 8.8.13                       |
| PrimeNG                 | 19.1.4                                    | Upgrade to 20.4.0                     |
| PrimeNG themes          | `@primeng/themes` 19.1.4                  | Replace with `@primeuix/themes`       |
| Formly                  | 7.1.0                                     | Keep during the migration             |
| TypeScript              | 5.8.3 installed, `^5.6.3` declared        | Pin exactly to 5.8.3 at monorepo root |
| RxJS                    | 7.8.1                                     | Patch to 7.8.2                        |
| Zone.js                 | 0.15.1                                    | Keep                                  |
| Capacitor               | 7.x                                       | Keep                                  |
| API                     | NestJS 10                                 | Keep; migrate independently           |
| Frontend tests          | 6 suites, 24 tests passing                | Critical migration gate available     |
| Frontend lint           | Script exists but Angular target does not | Blocking quality gap                  |
| API tests               | 6 suites, 29 tests passing                | Valid baseline                        |
| API lint                | ESLint 9 has no flat config               | Must be repaired independently        |
| Production build        | Passes on Angular 19                      | Valid baseline                        |
| Default root build      | Builds the frontend in development mode   | False-green risk                      |
| Initial frontend bundle | About 2.67 MB raw                         | No size budgets configured            |
| Routes                  | All page components imported eagerly      | Performance debt                      |

The current dependency audit reports:

- Full tree: 58 findings, with 25 high severity.
- Production tree: 25 findings, with 11 high severity.
- No critical findings.

These numbers are a baseline, not an acceptance threshold. Findings affecting the
NestJS backend are handled in a separate security update so a backend framework
migration cannot obscure Angular regressions.

## Target matrix

The first successful Angular 20 release must use this coherent set:

| Package                         | Target                   |
| ------------------------------- | ------------------------ |
| Node.js                         | 22.22.3                  |
| npm                             | 10.9.x                   |
| `@angular/*` runtime            | 20.3.25                  |
| `@angular/cli`                  | 20.3.31                  |
| `@angular-devkit/build-angular` | 20.3.31                  |
| `@angular/compiler-cli`         | 20.3.25                  |
| `@angular/cdk`                  | 20.2.14                  |
| TypeScript                      | exactly 5.8.3            |
| Ionic Angular/Core              | 8.8.13                   |
| PrimeNG                         | 20.4.0                   |
| PrimeIcons                      | 7.x                      |
| Prime UI themes                 | `@primeuix/themes` 1.2.5 |
| Formly core                     | 7.1.0                    |
| RxJS                            | 7.8.2                    |
| Zone.js                         | 0.15.1                   |
| Capacitor                       | 7.x                      |

Do not use caret ranges for Angular, Angular CDK, PrimeNG or TypeScript in the
migration commit. Exact versions make the install reproducible and prevent npm
from selecting a newer incompatible framework copy through a peer dependency.

## Rehearsal findings

A disposable copy of the complete workspace was migrated before changing this
repository.

### What migrated cleanly

- Angular's update schematic changed `moduleResolution` from `node` to `bundler`.
- The mandatory Angular 20 migrations did not need to rewrite application source.
- No current use was found for removed or changed APIs such as `InjectFlags`,
  `TestBed.get`, router `getCurrentNavigation`, server bootstrap context or the
  old `DOCUMENT` import.
- The Angular 20 frontend production build passed after dependency alignment.
- The unchanged API compiled and all 24 Jest tests passed against the regenerated
  lockfile.

### Dependency split discovered

The first clean install placed Angular 20 under the app but retained Angular 19 at
the monorepo root for Ionic and Formly. `npm ls` did not report this as invalid,
yet the frontend failed with missing internal Angular symbols.

Therefore `npm ls` alone is not an acceptance check. The root package must enforce
one exact framework family through `overrides`, and the lockfile must be recreated
from an empty `node_modules`.

Required root overrides for the migration:

```json
{
  "@angular/animations": "20.3.25",
  "@angular/common": "20.3.25",
  "@angular/compiler": "20.3.25",
  "@angular/core": "20.3.25",
  "@angular/forms": "20.3.25",
  "@angular/platform-browser": "20.3.25",
  "@angular/platform-browser-dynamic": "20.3.25",
  "@angular/router": "20.3.25",
  "@angular/cdk": "20.2.14",
  "primeng": "20.4.0"
}
```

### TypeScript and Ionic conflict discovered

When TypeScript remained declared as `^5.6.3`, npm selected TypeScript 5.9.3 at
the monorepo root. Ionic 8.8.13 then failed on the generated `autocorrect` types
for `ion-input` and `ion-searchbar`.

Pinning TypeScript 5.8.3 exactly at the root produced one TypeScript copy and made
the Angular 20 production build pass. This pin is a hard requirement, not a
temporary `skipLibCheck` workaround.

### Rehearsal result

With exact alignment:

- Angular 20 frontend production build: passed.
- Initial bundle: approximately 2.71 MB raw and 504 kB estimated transfer.
- NestJS API build: passed.
- API tests: 5 suites and 24 tests passed.
- Production dependency audit: 16 findings, 3 high and 13 moderate.

The small bundle increase is accepted only provisionally. Budgets and route
lazy-loading are required follow-up gates before calling the migration complete.

## Code impact

### Angular

- Accept the schematic change to `moduleResolution: "bundler"`.
- Keep the current browser builder for this migration.
- Add `strictTemplates: true` in a preparation phase and fix findings before the
  package upgrade where practical.
- Remove `@angular/platform-browser-dynamic` if the import audit still confirms it
  is unused.
- Convert the two remaining `*ngFor` templates in the services page to `@for`.
- Keep Zone.js. Zoneless execution is not part of this work.

### Routing and bundle size

All pages are imported eagerly in `app.routes.ts`. The largest frontend files are:

| Component          | Approximate lines |
| ------------------ | ----------------: |
| Flow designer      |             7,092 |
| Service designer   |             2,332 |
| Operational Docs   |             2,323 |
| Security           |             1,375 |
| Database           |             1,298 |

Route lazy-loading with `loadComponent` should be completed before or directly
after the framework update. Refactoring these large components is valuable, but
must be split into separate behavior-preserving work rather than hidden inside the
version migration.

### PrimeNG

- Upgrade PrimeNG and Angular CDK together.
- Replace `@primeng/themes` imports with `@primeuix/themes`.
- Replace the three deprecated `pTemplate` declarations in the database page with
  template references.
- Exercise Dialog, Table, Checkbox, InputText, RadioButton, Select, Textarea and
  ToggleSwitch in the component catalog and in their real pages.
- Compare every installed theme, not just the default Chicle theme.

### Ionic

- Patch Angular and Ionic together in the rehearsal branch.
- Compile with root TypeScript 5.8.3.
- Test `ion-input`, `ion-searchbar`, navigation, modal, loading and responsive
  shells on browser and mobile widths.
- Keep Capacitor 7 and native plugins unchanged during this migration.

### Formly

The application uses its own Chicle presentation adapter over Formly core.
`@ngx-formly/ionic` and `@ngx-formly/primeng` are declared but are not currently
imported.

During preparation, decide explicitly between:

1. Remove the unused UI adapter packages and keep `@ngx-formly/core`.
2. Add isolated, tested adapters if the runtime is intended to invoke them.

Do not retain unused adapters merely to imply support. The component catalog and
runtime tests are the source of truth.

### Animations

Angular 20 deprecates the legacy animations package, while PrimeNG 20 still
declares compatibility with it. Keep `@angular/animations` for this target and
migrate the application's own route transition to CSS/native transitions in a
separate change before Angular 21.

## Execution phases

### Phase 0 - Freeze and snapshot

Estimated effort: half a day.

Actions:

1. Create a dedicated migration branch from a known green commit.
2. Record Node, npm, package tree, audit output and production bundle sizes.
3. Export screenshots of critical desktop and mobile routes.
4. Back up the current lockfile and confirm the working tree contains no
   accidental generated files.
5. Freeze unrelated frontend feature merges until Phase 5 is green.

Exit gate:

- Angular 19 production build passes.
- API build and all 29 API tests pass.
- Baseline screenshots and audit reports are attached to the migration record.

Rollback:

- Return to the pre-migration commit and original lockfile.

### Phase 1 - Build the safety net

Estimated effort: two to three days.

Status: in progress. The one-day critical test gate is implemented and passes on
both Angular 19 and the isolated Angular 20 rehearsal.

Implemented coverage:

- browser session persistence and logout;
- authentication, login and permission guards;
- setup state and API-down redirects;
- protected route declarations;
- dynamic service discovery, execution and failure mapping;
- dynamic flow discovery, execution and output mapping;
- adaptive native, PrimeNG and Ionic presentation selection;
- database schema tenant isolation, protected identifiers and TypeORM migration
  preview safety.

Actions:

1. Add a real frontend lint target using the Angular ESLint toolchain compatible
   with Angular 19 and 20.
2. Extend the frontend unit-test runner with:
   - auth and setup redirects;
   - dynamic service and flow clients;
   - presentation profile selection;
   - Formly field mapping;
   - navigation loading state.
3. Add Playwright smoke tests for login and each protected administration route.
4. Make the root build call the frontend production configuration explicitly.
5. Add production bundle budgets using the measured baseline.
6. Add `angularCompilerOptions.strictTemplates`.
7. Repair the API ESLint 9 flat configuration without changing runtime behavior.
8. Add a CI job that uses Node 22 and `npm ci`.

Exit gate:

- Lint, unit tests, Playwright smoke tests, app production build, API build and API
  tests all pass from a clean install.
- A failed production build or test stops CI.

Rollback:

- Each quality tool is introduced in a separate commit and can be reverted without
  changing application dependencies.

### Phase 2 - Dependency hygiene

Estimated effort: half to one day.

Actions:

1. Pin Node 22.22.3 in `.nvmrc`, Docker and CI.
2. Pin TypeScript 5.8.3 exactly at the monorepo root.
3. Remove manual RxJS `paths` aliases after verifying normal workspace resolution.
4. Patch Ionic to 8.8.13 and RxJS to 7.8.2.
5. Decide and document the unused Formly and Capacitor package cleanup.
6. Keep the API framework unchanged.

Exit gate:

- Existing Angular 19 app and API remain green.
- `npm ci` resolves one root TypeScript 5.8.3.

Rollback:

- Restore manifests and lockfile from the Phase 1 green commit.

### Phase 3 - Angular 20 core migration

Estimated effort: one day.

Actions:

1. Apply exact Angular 20.3 versions and root overrides.
2. Remove all workspace `node_modules` directories and regenerate the lockfile.
3. Run Angular's mandatory update schematics.
4. Keep `moduleResolution: "bundler"`.
5. Do not run the optional application-builder, zoneless or broad control-flow
   migrations in this phase.
6. Verify that every Angular package resolves to 20.3.25 and that no Angular 19 or
   Angular 21 copy exists.

Exit gate:

- Clean `npm ci`.
- One Angular version family.
- Frontend production build passes.
- Frontend lint and tests pass.
- API build and tests pass.

Rollback:

- Revert the phase commit and restore the previous lockfile. Do not repair a split
  Angular tree by adding `skipLibCheck`.

### Phase 4 - PrimeNG 20 and themes

Estimated effort: one to two days.

Actions:

1. Upgrade PrimeNG to 20.4.0 and CDK to 20.2.14.
2. Migrate theme imports to `@primeuix/themes`.
3. Replace deprecated PrimeNG templates.
4. Verify overlays, dialogs, table templates, selects and form controls.
5. Render every component-catalog example under each supported presentation
   profile and theme.

Exit gate:

- No deprecated package import remains for `@primeng/themes`.
- No visual overflow, overlay clipping or broken control state at supported
  viewports.
- Theme selection persists and does not cause runtime import errors.

Rollback:

- Revert the PrimeNG/theme commit independently from Angular core if necessary.

### Phase 5 - Ionic, Formly and presentation verification

Estimated effort: one to two days.

Actions:

1. Run the dynamic Formly example set with native, PrimeNG and Ionic presentation
   profiles.
2. Validate required, numeric, date, select, checkbox, radio, textarea, file and
   conditional fields.
3. Validate mobile keyboard, focus, search and modal behavior.
4. Confirm that presentation JSON remains library-neutral.
5. Confirm loading, skeleton and page-transition components still behave
   consistently.

Exit gate:

- Form values, validation messages and disabled/loading states match Angular 19.
- No browser console errors.
- No application page bypasses the shared presentation components.

Rollback:

- Revert adapter-specific changes without changing persisted form contracts.

### Phase 6 - Routing and performance

Estimated effort: one day.

Actions:

1. Convert page routes to lazy `loadComponent`.
2. Preserve guards, route data and setup redirects exactly.
3. Record the new initial bundle and route chunk sizes.
4. Tighten budgets from the new measured baseline.
5. Confirm that navigation skeletons cover lazy-load time.

Exit gate:

- Initial raw bundle is lower than the pre-migration baseline.
- Every protected route preserves its guard and permission behavior.
- Deep links and browser refresh work on every route.

Rollback:

- Revert route declarations only; no page behavior belongs in this phase.

### Phase 7 - Security and release closure

Estimated effort: half to one day for the migration closure. Backend remediation
is estimated separately.

Actions:

1. Run full and production dependency audits.
2. Classify remaining findings by frontend, backend and tooling ownership.
3. Open a separate NestJS security upgrade plan for backend findings.
4. Generate the production web artifact and Docker image from a clean checkout.
5. Update operational Docs and component documentation with final versions.
6. Tag the last Angular 19 release and the first Angular 20 release.

Exit gate:

- No critical vulnerability.
- No new high vulnerability introduced by the frontend migration.
- All mandatory automation and manual regression checks pass.
- Release and rollback artifacts are reproducible.

## Required validation matrix

### Application workflows

| Route or workflow | Required checks                                                    |
| ----------------- | ------------------------------------------------------------------ |
| Setup             | Pending, ready, already-created and API-down states                |
| Login             | Password login, invalid credentials, logout, refresh session       |
| Home              | Dynamic menus, role visibility, loading and responsive navigation  |
| Manual            | Section navigation, scroll tracking, Swagger links                 |
| Components        | All kits, themes, states and Formly examples                       |
| Confisys          | Read, edit, validation and permission denial                       |
| Database          | Table list, row modal, edit, designer preview and history          |
| Security          | Search, pagination, user edit, roles, permissions and audit        |
| Services          | Create, version, publish, test, history, trash and restore         |
| Flows             | Create, map, version, publish, execute, history, trash and restore |
| Dynamic forms     | Load by key, validate, submit and display errors                   |

### Viewports

At minimum:

- 390 x 844 mobile.
- 768 x 1024 tablet.
- 1280 x 800 desktop.
- 1440 x 900 wide desktop.

No text overlap, accidental horizontal page scrolling, clipped overlays or
unreachable controls are accepted.

### Presentation combinations

Verify:

- Chicle native components.
- PrimeNG components.
- Ionic components.
- Every installed PrimeNG theme exposed by the component catalog.

### Runtime checks

- No Angular, Ionic, PrimeNG or Formly error in the browser console.
- No failed lazy chunk or theme request.
- API authentication and refresh-cookie flow remain unchanged.
- WebSocket connections reconnect and close normally.
- Dynamic services and flows remain discoverable by role.
- Existing persisted JSON contracts load without migration.

## Concise execution commands

Run all commands from the monorepo root with Node selected from `.nvmrc`.

Baseline and final gates:

```bash
nvm use
npm ci
npm run test --workspace=@chicle/app
npm run build --workspace=@chicle/app -- --configuration production
npm run build --workspace=@chicle/api
npm run test --workspace=@chicle/api -- --runInBand
npm audit --omit=dev
```

During Phase 3, first run the official schematic from the Angular 19 tree. Then
apply the audited exact versions and root overrides before recreating the install:

```bash
npx ng update @angular/core@20 @angular/cli@20 --force
# Apply the exact target matrix and root overrides to package.json.
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm package-lock.json
npm install
npm ci
```

The lockfile removal is intentional only in the controlled migration phase. The
new lockfile must be reviewed and committed once; normal development returns to
`npm ci`.

Version-family gate:

```bash
npm ls @angular/core @angular/common @angular/forms @angular/router \
  @angular/cdk primeng @ionic/angular @ionic/core typescript --all
```

The output must show Angular 20.3.25, PrimeNG 20.4.0, Ionic 8.8.13 and root
TypeScript 5.8.3 without another major or minor framework family.

## Stop and rollback conditions

Stop the migration instead of layering workarounds when any of these occurs:

- More than one Angular major or minor family is installed.
- TypeScript resolves above 5.8.3 during this target.
- A production build only passes with `skipLibCheck`.
- Authentication, tenant scope or permission checks differ from the baseline.
- Existing dynamic service, flow or form JSON can no longer be loaded.
- A visual regression blocks a mobile workflow.
- The dependency audit introduces a critical finding.
- A fix requires upgrading NestJS, Capacitor or changing persisted contracts in
  the same release.

## Delivery sequence

Recommended pull request sequence:

1. Quality gates and baseline tests.
2. Node, TypeScript and dependency hygiene.
3. Angular 20 core and lockfile alignment.
4. PrimeNG 20 and theme migration.
5. Ionic, Formly and presentation regression fixes.
6. Lazy routes and bundle budgets.
7. Documentation and release closure.
8. Separate NestJS security remediation.

Each pull request must be independently buildable and revertible. Do not combine
large page refactors with the framework migration.

## Estimated effort

Expected total: six to ten working days.

- Safety net: two to three days.
- Core dependency migration: one to two days.
- PrimeNG, Ionic, Formly and visual validation: two to three days.
- Routing, security review and release closure: one to two days.

The main uncertainty is not Angular's schematic. It is regression coverage across
the large flow, service, security and database pages that currently have no
frontend automated tests.

## Completion definition

The project is at 100% of this migration when:

- the target matrix is installed as one coherent dependency tree;
- clean `npm ci` is reproducible locally, in CI and in Docker;
- production app and API builds pass;
- frontend lint, unit and Playwright suites pass;
- API's 24 existing tests and any new tests pass;
- all validation-matrix workflows pass without console errors;
- initial bundle budgets pass;
- supported themes and responsive viewports pass visual review;
- no persisted dynamic contract changes;
- remaining security findings have an owner and separate remediation plan;
- operational and component documentation show the final supported versions.

## Official references

- Angular version compatibility:
  <https://angular.dev/reference/versions>
- Angular 20 release:
  <https://github.com/angular/angular/releases/tag/20.0.0>
- PrimeNG 20 migration:
  <https://primeng.dev/migration/v20>
- Ionic 8.8.13 release:
  <https://github.com/ionic-team/ionic-framework/releases/tag/v8.8.13>
- Ionic Angular 21 support status:
  <https://github.com/ionic-team/ionic-framework/issues/30907>
- Formly compatibility:
  <https://formly.dev/>
- Node.js 22.22.3 release:
  <https://nodejs.org/en/blog/release/v22.22.3>
