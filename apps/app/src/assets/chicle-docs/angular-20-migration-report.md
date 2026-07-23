# Angular 20 migration report

## Result

Status: completed on 2026-07-05.

Chicle Engine now uses one aligned Angular 20 dependency family. The migration
preserved the persisted contracts for dynamic services, flows, forms, tenant
security and database schema changes.

## Installed matrix

| Package                     | Installed version |
| --------------------------- | ----------------- |
| Node.js                     | 22.22.3           |
| npm                         | 10.9.8            |
| Angular runtime             | 20.3.25           |
| Angular CLI and build tools | 20.3.31           |
| Angular CDK                 | 20.2.14           |
| TypeScript                  | 5.8.3             |
| Ionic Angular/Core          | 8.8.13            |
| PrimeNG                     | 20.4.0            |
| PrimeUIX themes             | 1.2.5             |
| Formly                      | 7.1.0             |
| RxJS                        | 7.8.2             |
| Zone.js                     | 0.15.1            |

Root npm overrides prevent Angular, CDK and PrimeNG from being split into
incompatible workspace copies. TypeScript 5.8.3 is pinned at the monorepo root to
avoid the Ionic generated-type conflict found during rehearsal.

## Applied migrations

- Executed the official Angular CLI and core v20 schematics.
- Changed TypeScript module resolution to `bundler`.
- Enabled strict Angular template checking.
- Removed the unused `@angular/platform-browser-dynamic` dependency.
- Replaced `@primeng/themes` with `@primeuix/themes`.
- Replaced the remaining deprecated PrimeNG `pTemplate` declarations.
- Replaced the remaining legacy `*ngFor` declarations with `@for`.
- Added Angular ESLint 20 and repaired the API ESLint 9 flat configuration.
- Added a production initial-bundle budget.
- Converted all page routes to lazy `loadComponent` declarations while preserving
  guards and permission metadata.
- Pinned the local and Docker Node runtime to 22.22.3.
- Changed the API Docker image to install from the lockfile with `npm ci`.
- Added MariaDB health gating before the API starts.
- Added a GitHub Actions quality gate for install, lint, test and build.

## Automated verification

- Clean `npm ci`: passed.
- Monorepo lint: passed.
- Frontend tests: 6 suites and 24 tests passed.
- API tests: 6 suites and 29 tests passed.
- API build: passed.
- Shared package build: passed.
- Angular production build: passed.
- Docker API image build: passed.
- Docker API startup after MariaDB health check: passed.
- Setup status endpoint: returned `ready`.

The frontend tests were also run successfully against Angular 20 before applying
the migration to the working tree.

## Visual verification

Validated at desktop and 390 x 844 mobile viewport:

- login;
- operational Docs;
- setup already-created state;
- protected services redirect with `returnUrl`;
- component catalog;
- Formly dynamic field gallery;
- responsive Ionic field selection on mobile;
- responsive PrimeNG field selection on desktop;
- Chicle/Aura, Lara, Material and Nora theme switching.

Observed results:

- no browser console errors;
- no accidental horizontal page overflow;
- 18 Formly fields mounted in the gallery;
- 14 Ionic runtime controls selected on mobile;
- 14 PrimeNG runtime controls selected on desktop;
- all four theme identifiers applied correctly.

## Performance

Lazy page routing reduced the initial production bundle:

| Measurement        |        Before |         After |
| ------------------ | ------------: | ------------: |
| Initial raw bundle | about 2.71 MB | about 1.91 MB |
| Estimated transfer |  about 504 kB |  about 379 kB |

Large administration pages now load as route chunks instead of being included in
the first application download.

## Security audit

| Audit                    |      Before |       After |
| ------------------------ | ----------: | ----------: |
| Full dependency tree     | 58 findings | 38 findings |
| Production dependencies  | 25 findings | 16 findings |
| Production high severity |          11 |           3 |
| Critical                 |           0 |           0 |

The remaining production findings belong to the NestJS 10 backend dependency
family, including Express, Multer, Swagger and UUID transitive paths. They require
a separate NestJS migration and were not hidden inside the Angular change.

## Known follow-up

- Replace the application's legacy Angular route animation with native CSS
  transitions before moving beyond Angular 20. PrimeNG 20 still declares
  compatibility with `@angular/animations`, so the package remains installed.
- Migrate NestJS 10 separately to address the remaining production audit findings.
- Expand browser automation for authenticated service, flow, security and database
  editing workflows as those interfaces continue evolving.
