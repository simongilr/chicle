# Backup And Worker Architecture

Chicle separates interactive API work from background work through explicit runtime roles, jobs, outbox events and
backup contracts. The same architecture applies whether an installation starts with a compact local runtime or separate
worker artifacts.

The guiding decision is:

> Separate responsibilities by contract. Deploy API, workers and backup support as artifacts according to the
> installation profile.

## Runtime Roles

Chicle recognizes these process roles:

```txt
api
worker
backup
combined-local
```

The same built artifact can start in different roles:

```txt
CHICLE_PROCESS_ROLE=api
CHICLE_PROCESS_ROLE=worker
CHICLE_PROCESS_ROLE=backup
CHICLE_PROCESS_ROLE=combined-local
```

The API role handles request/response. Worker and backup roles handle background work that must not block HTTP
requests. `combined-local` is a development convenience, not a different architecture.

## Internal Responsibility Separation

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

This separation lets Chicle scale horizontally without rewriting the contracts that Admin, apps, flows, forms and
dynamic services already use.

## When A Worker Artifact Is Required

A worker artifact is required when at least one of these is true:

1. Processes take more than 2-3 seconds.
2. Automatic backups are required.
3. Schedules or repeated tasks are required.
4. Flows must continue without blocking API requests.
5. Outbox events or retry queues need independent processing.
6. Integrations require throttling, retries or dead-letter handling.
7. The API is scaled horizontally and background claims must be coordinated.

Supported installation shapes:

```txt
compact local:
  api + db
  combined-local role may process small background tasks

split runtime:
  api + worker + db

resilient runtime:
  api replicas + worker replicas + db + separated backups + external backup copy
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

Artifact shape with worker support:

```yaml
services:
  chicle-db:
    image: mariadb:11
    volumes:
      - /opt/chicle/db-data:/var/lib/mysql

  chicle-worker:
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

Extended retention policy:

- Daily: last 14 days.
- Weekly: last 4 Sundays.
- Monthly: last 3 months.

Production policy:

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

## Configuration

Worker/backup variables:

| Variable | Purpose |
| --- | --- |
| `CHICLE_PROCESS_ROLE` | `api`, `worker`, `backup` or `combined-local` |
| `BACKUP_ENABLED` | Enables scheduled backups in worker role |
| `BACKUP_DIR` | Directory where backup files are written |
| `BACKUP_RETENTION_DAYS` | Simple daily retention window |
| `BACKUP_SCHEDULE` | Cron-like schedule |
| `BACKUP_EXTERNAL_ENABLED` | External copy toggle |
| `BACKUP_EXTERNAL_PROVIDER` | `s3`, `minio`, `drive`, etc. |

## Decision

Chicle separates HTTP runtime, application services, dynamic runtime, async runtime and backup runtime by contract.
Artifacts may be deployed compactly or separately, but the execution model remains event-driven and coordinated through
database claims, outbox records, idempotency keys and audit history.

Database backups must be written as dated compressed dump files to a persistent location separated from the live MariaDB
data volume. Production deployments should copy those backups to an external destination.
