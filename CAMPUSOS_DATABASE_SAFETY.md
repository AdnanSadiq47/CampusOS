# CampusOS Database Safety & Architecture Policy

**Binding Engineering Policy for CampusOS Embedded & Production Databases**  
*Effective Date: August 29, 2026*

---

## 1. Single Database Owner Architecture
- The canonical live embedded database (`.pglite-data`) has exactly **ONE authorized owner process**: the **CampusOS Core API** (`process.env.CAMPUSOS_AUTHORIZED_DB_OWNER = 'API_CORE'`).
- All other tools, services, and interfaces (Web UI, DB Studio, inspection tools, CLI utilities) **MUST access the database exclusively via the Core API HTTP interface (port 4000)**.
- Direct physical filesystem instantiation from multiple concurrent processes is strictly forbidden to prevent PostgreSQL WAL corruption.

---

## 2. Canonical Path Resolution
- Live Canonical Database Path: `<workspace_root>/.pglite-data`
- The database location is resolved deterministically from the workspace root (`packages/database/src/client.ts`).
- Scratch paths, temporary directories, or non-canonical subfolders must never be used as the live database.

---

## 3. Startup Contract (Zero Data Mutation)
Normal CampusOS Core API startup follows a strict, data-neutral lifecycle:
```
RESOLVE CANONICAL DB → VERIFY DATABASE IDENTITY → CONNECT → VERIFY REQUIRED SCHEMA / COMPATIBILITY → START
```
### Absolute Restrictions for Normal Startup:
- **NO Seeding**: Does not seed system roles, default users, or reference data on API startup.
- **NO ON CONFLICT Mutations**: Does not update organization details, geography records, or operational entities.
- **NO Backfill / Normalization**: Does not perform silent repair or backfilling on boot.
- **NO Automatic Migrations**: Verifies schema presence and compatibility; does not silently alter schema definitions.
- Normal server restarts are **100% data-neutral** (`BEFORE Fingerprint === AFTER Fingerprint`).

---

## 4. Graceful Shutdown & WAL Checkpoint Protection
- NestJS shutdown hooks (`app.enableShutdownHooks()`) and process event handlers (`SIGINT`, `SIGTERM`, `beforeExit`) are active.
- On shutdown, `closeSharedDatabase()` explicitly quiesces and flushes the embedded PostgreSQL engine, creating a clean checkpoint and preventing invalid `xl_info` WAL corruption.

---

## 5. No Scratch Live Access Guard
- `assertAuthorizedDbAccess(targetDir)` runs whenever a database connection is requested.
- Any attempt by scratch scripts, unit tests, or external processes to open `<workspace_root>/.pglite-data` directly without `API_CORE` credentials throws an immediate, fatal error.

---

## 6. Database Identity Verification
- Stamped in the persistent `_campusos_database_identity` table:
  - `system_id`: `campusos-local-canonical`
  - `cluster_name`: `CampusOS Canonical Cluster`
  - `schema_version`: `1.0.0`
- **Fail-Closed Behavior**: If `system_id` is missing, mismatched, or corrupted, startup aborts immediately to prevent operating against an unintended database.

---

## 7. Schema Version Enforcement
- The application enforces a strict schema compatibility contract (`CURRENT_SCHEMA_VERSION = '1.0.0'`).
- `verifySchemaCompatibility()` checks for all required tables and verifies matching schema versions.
- If the schema is missing tables or has an incompatible version, startup **FAILS CLOSED** with clear guidance.

---

## 8. Explicit Migration Architecture
- Migrations are versioned, sequential, and tracked in `_campusos_migrations`.
- Migrations are triggered **only via explicit administrative execution** (`runMigrations(pglite)`), never implicitly during server boot.
- Every migration run automatically enforces a verified pre-migration snapshot before DDL execution.

---

## 9. Explicit Seed Architecture
- Initial System Reference Seeding is decoupled from API boot:
  - Command: `pnpm db:seed` (or `pnpm --filter @campus-os/database db:seed`).
  - Seeds only initial system reference data (System Roles, Canonical Geography, Canonical Identity Users) using `ON CONFLICT DO NOTHING`.
  - **Zero Fake Business Seeding**: Operational entities (Head Offices, Regions, Schools, Branches, Admissions, Students) are never seeded into existing databases.

---

## 10. Safe Snapshot System
- Storage Directory: `<workspace_root>/.backups/YYYY-MM-DD_HH-mm-ss_<reason>/`
- Snapshots include `database-dump.json` and a validated `manifest.json`.
- **Verification Requirement**: A snapshot is marked `CREATED` upon export, then validated in an isolated sandbox before being promoted to `VERIFIED`.

---

## 11. Snapshot Retention Policy
- `pruneOldSnapshots(keepCount = 10)` keeps the 10 most recent development backups.
- Incident archives (e.g. `.pglite-data-ARCHIVED-CORRUPTED`, `.pglite-data-BACKUP-INCIDENT`) reside outside `.backups/` in the workspace root and are **permanently protected**.

---

## 12. Destructive-Operation Guard
- Guarded Operations: `DROP_TABLE`, `TRUNCATE_TABLE`, `MASS_DELETE`, `MASS_UPDATE`, `RESEED_DATABASE`, `REINITIALIZE_DATABASE`.
- Execution requires an explicit, short-lived (5-minute), single-use authorization token (`authorizeDestructiveOperation()`).
- High-risk operations require a verified pre-risk snapshot.

---

## 13. Deterministic Database Fingerprinting
- Computes SHA-256 hashes across 9 protected tables:
  `organizations`, `head_offices`, `regions`, `schools`, `branches`, `countries`, `states`, `cities`, `areas`.
- **Content Hash**: Canonical JSON sorting (`ORDER BY id ASC`), recursive key-ordering.
- **Schema Hash**: Column names, data types, nullability, primary key constraints.
- **Composite Hash**: Deterministic SHA-256 across all protected tables.
- Guarantees detection of in-place row mutations even when row counts remain unchanged.

---

## 14. Test Database Isolation
- All unit, integration, and failure simulation tests **MUST use isolated in-memory or temporary sandbox instances** (`new PGlite()`).
- Tests must never target the canonical live database path.

---

## 15. Incident Recovery Rules
- Corrupted or incident databases are treated as permanent evidence.
- Direct write/repair attempts against corrupted originals are strictly forbidden.
- Recovery procedures must always execute against an isolated disk clone, followed by controlled cutover and verification.
