# Backup and Worker Architecture

Chicle keeps the first deployment simple, but the code and deployment model must be ready for background work and safe
database backups.

The guiding decision is:

> Separate responsibilities in code now. Separate worker containers after the V1 base is stable.

## Current Deployment Shape

The initial V1 deployment remains:

```txt
api
db
```

This keeps local development and first deployment simple while the engine foundation is still evolving.

## Future Deployment Shape

After the V1 base is stable, Chicle should support:

```txt
api
api-worker
db
```

The same API image should be able to start in different roles:

```txt
CHICLE_PROCESS_ROLE=api
CHICLE_PROCESS_ROLE=worker
```

The worker role is responsible for background processes that should not block HTTP requests.

## Internal Responsibility Separation

Even before deploying a worker container, the monolith must keep these responsibilities separated in code.

### HTTP/API

Owns request/response concerns:

- controllers
- guards
- DTO validation
- auth and session context
- permissions
- API endpoints

### Application/Core

Owns business use cases:

- application services
- validations
- tenant scope
- transactions
- domain orchestration

### Dynamic Runtime

Owns configurable execution:

- dynamic services
- dynamic forms
- actions
- flows
- records
- files

### Async/Future Worker Runtime

Owns background and long-running work:

- jobs
- outbox processing
- schedules
- backups
- retries
- notifications
- long-running flows
- external sync

This separation lets Chicle begin as a modular monolith and later run worker responsibilities in a separate container
without rewriting the core.

## When To Add `api-worker`

Do not make a worker mandatory too early. Add the worker container when at least one of these is true:

1. Setup, auth, tenants, roles, permissions and menus are stable.
2. Dynamic forms and records are usable.
3. Dynamic services or actions are running real work.
4. Some processes take more than 2-3 seconds.
5. Automatic backups are required.
6. Schedules or repeated tasks are required.
7. Flows should continue without blocking API requests.
8. Outbox events or retry queues need independent processing.

Recommended order:

```txt
Now:
  api + db
  with internal responsibility separation

After V1 base:
  api + api-worker + db

Production hardening:
  api + api-worker + db + separated local backups + external backup copy
```

## Backup Principle

A backup must not depend on the same storage location as the live database volume.

Bad:

```txt
db volume
  live MariaDB data
  backups
```

Better:

```txt
/opt/chicle/db-data
  live MariaDB data

/opt/chicle/backups
  dated compressed dumps
```

The backup is a new file created periodically, not a new database volume.

Example files:

```txt
chicle-backup-20260629-020000.sql.gz
chicle-backup-20260630-020000.sql.gz
chicle-backup-20260701-020000.sql.gz
```

## Recommended Production Host Layout

For a single-server deployment:

```txt
/opt/chicle/
  db-data/
    live MariaDB data
  backups/
    chicle-backup-20260629-020000.sql.gz
    chicle-backup-20260630-020000.sql.gz
    chicle-backup-20260701-020000.sql.gz
```

Compose shape after worker support:

```yaml
services:
  chicle-db:
    image: mariadb:11
    volumes:
      - /opt/chicle/db-data:/var/lib/mysql

  chicle-api-worker:
    image: chicle-engine-api:latest
    environment:
      CHICLE_PROCESS_ROLE: worker
      BACKUP_ENABLED: "true"
      BACKUP_DIR: /backups
      BACKUP_RETENTION_DAYS: "14"
    volumes:
      - /opt/chicle/backups:/backups
    depends_on:
      - chicle-db
```

Docker named volumes are acceptable for local development, but production deployments should prefer host paths or a
managed volume strategy where backups can be inspected and copied independently from the live DB data.

## Backup Policy

V1 simple policy:

- Create one daily backup during low-traffic hours.
- Compress with gzip.
- Keep the last 14 daily backups.
- Delete older daily backups automatically.
- Record the result in audit/logs.

Future retention policy:

- Daily: last 14 days.
- Weekly: last 4 Sundays.
- Monthly: last 3 months.

Future production policy:

- local backup
- external copy

External targets can include:

- another server
- S3 or compatible object storage
- MinIO
- Backblaze
- Google Drive or equivalent provider
- hosting provider object storage

## Backup Flow

```txt
api-worker
  -> scheduled backup trigger
  -> run MariaDB dump
  -> write dated .sql.gz file to BACKUP_DIR
  -> delete backups outside retention policy
  -> record success/failure in audit/logs
```

The backup protects against:

- human error
- bad migrations
- logical data corruption
- accidental table deletes
- application bugs

It does not fully protect against full server or disk loss unless backups are copied to an external destination.

## Environment Variables

Planned worker/backup variables:

| Variable | Purpose |
| --- | --- |
| `CHICLE_PROCESS_ROLE` | `api`, `worker` or future combined local mode |
| `BACKUP_ENABLED` | Enables scheduled backups in worker role |
| `BACKUP_DIR` | Directory where backup files are written |
| `BACKUP_RETENTION_DAYS` | Simple daily retention window |
| `BACKUP_SCHEDULE` | Future cron-like schedule |
| `BACKUP_EXTERNAL_ENABLED` | Future external copy toggle |
| `BACKUP_EXTERNAL_PROVIDER` | Future `s3`, `minio`, `drive`, etc. |

## Decision

Chicle V1 initially deploys with API and DB to preserve simplicity.

The code must separate HTTP runtime, application services and async runtime now.

The same Docker image should later run as API or worker through `CHICLE_PROCESS_ROLE`.

The worker is not mandatory for the first V1, but it must be activatable when backups, schedules, outbox, retries,
notifications, long-running flows or other background processes become necessary.

Database backups must be written as dated compressed dump files to a persistent location separated from the live MariaDB
data volume. Production deployments should copy those backups to an external destination.
