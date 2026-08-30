# CampusOS Page & Feature Freeze Policy

**Binding Engineering Policy for Approved Page & Feature Locks**  
*Effective Date: August 29, 2026*

---

## 1. Core Principle: The Freeze Rule
When a CampusOS page or feature is approved and locked, it enters a state of **Technical Freeze**:
```
APPROVED → LOCKED → FROZEN
```
No developer, agent, automation script, or unrelated task may modify a locked feature without following the explicit unlock workflow.

---

## 2. Scope of Protection
A locked page/feature protects the entire vertical slice:
1. **Frontend / UI**: Page layouts, forms, fields, action buttons, modals, table definitions, client-side state.
2. **API & Controller**: REST endpoints, route handlers, parameter extraction, HTTP response shapes.
3. **Domain & Service Logic**: Business validation, transaction handling, dependency checks, audit trails.
4. **Permissions & Security**: Required roles, permission codes, hierarchical scope filters.
5. **Database Schema Contract**: Table definitions, columns, data types, primary/foreign keys, nullability, constraints.
6. **Database Development Scope**: Out-of-scope development mutations to the feature's database tables are strictly blocked.

---

## 3. Critical Distinction: Application Writes vs. Development Mutations

> [!IMPORTANT]
> **LOCKED BUSINESS DATA DOES NOT MEAN READ-ONLY DATA.**

The lock system distinguishes strictly between legitimate application activity and unauthorized development mutations:

### A. Legitimate ERP Application Activity (ALLOWED)
- Authenticated and authorized end-user operations:
  - Creating a record via the approved UI/API
  - Editing an existing record
  - Changing status / activating / deactivating
  - Performing workflow state transitions
  - Executing dependency-safe deletions
- These actions execute through the authenticated API stack and are logged in audit history.

### B. Development & Infrastructure Task Mutations (STRICTLY PROHIBITED)
- Accidental modifications from unrelated development tasks (e.g. HR feature mutating School data)
- Silent data backfills, ad-hoc normalizations, or schema alterations
- Unexpected mass deletes, truncations, re-seeds, or table recreations
- Any development mutation to a locked feature's tables without an explicit task write-scope permit triggers a **`DATABASE DATA LOCK VIOLATION`**.

---

## 4. Explicit Unlock & Versioning Lifecycle
To modify an approved, locked feature:
```
1. EXPLICIT UNLOCK  → pnpm unlock:page <key> --reason "<justification>"
2. IMPLEMENTATION   → Code changes, UI refinements, feature extensions
3. VERIFICATION     → Automated tests, DB schema validation, no-regression checks
4. VISUAL PROOF     → Visual inspection and user sign-off
5. RELOCK           → pnpm lock:page <key> --name "..." --files "..." [--tables "..."]
6. NEW VERSION      → Manifest increments version (e.g. v1 → v2)
```

> [!CAUTION]
> **Locked baselines MUST NEVER auto-update.**
> If a protected file or schema changes without an explicit unlock, `pnpm verify:locks` will fail closed with exit code `1`.

---

## 5. Central Lock Manifest (`campusos-locks.json`)
The lock status is centrally tracked in `campusos-locks.json` in the workspace root:
- `featureKey`: Unique identifier (e.g. `schools`, `branches`)
- `displayName`: Human-readable name
- `status`: `LOCKED` or `UNLOCKED`
- `version`: Monotonically increasing approved version number
- `lockDate`: Timestamp of current lock
- `protectedFiles`: File paths relative to root + deterministic SHA-256 hashes
- `protectedTables`: List of associated database tables
- `protectedSchema`: Deterministic schema hash per table
- `history`: Full audit trail of lock/unlock events with reasons

---

## 6. Task Write-Scope Enforcement
Every development task operates within an approved database write scope:
- **Allowed Scope**: Tables explicitly part of the active development task.
- **Protected Scope**: All locked and shared master tables outside the active task.
- A baseline fingerprint is captured before the task. After the task, fingerprint comparison ensures zero mutations occurred on out-of-scope protected tables.

---

## 7. Shared Master Protection
Consuming features may **read and reference** shared masters (Organizations, Head Offices, Regions, Schools, Branches, Geography) without gaining permission to mutate them. Consuming module development tasks cannot modify shared master rows or schemas.

---

## 8. Global Design System Controlled Exception
CampusOS utilizes a centralized UI design system (`packages/ui-kit`).
- **Page-Specific UI**: HARD-LOCKED per page.
- **Business / API Contracts**: HARD-LOCKED per page.
- **Global Design System Components**: Updates to shared UI components are permitted only via explicitly designated Global Design System tasks, with visual regression verification across consuming locked pages.

---

## 9. Integration with Database Safety Architecture
This freeze policy directly integrates with and enforces the rules established in [`CAMPUSOS_DATABASE_SAFETY.md`](./CAMPUSOS_DATABASE_SAFETY.md), including:
- Single Live Database Owner (`API_CORE`)
- Fail-closed startup contract
- Verified backup snapshots before DDL
- Deterministic SHA-256 database fingerprints
- Destructive-operation authorization tokens
