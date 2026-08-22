# 01. CampusOS Non-Negotiable Core Engineering Principles

---

## 1. Fundamental Engineering Tenets

Every architectural and implementation decision in CampusOS must adhere strictly to these non-negotiable principles. An engineer or AI agent is **never permitted to violate these principles** without explicit architectural consensus.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE 10 CORE COMMANDMENTS                              │
│                                                                             │
│  1. Configure, Don't Customize                                              │
│  2. Stable Core + Extensible Platform + Configurable Organizations          │
│  3. Multi-Tenant by Design (Zero Data Leakage Guarantee)                   │
│  4. Dual-Layer Defense-in-Depth Security (Application + Database RLS)       │
│  5. Server-Side Authority (Never Trust Client Claims)                      │
│  6. Immutable Versioning of Mutable Metadata                                │
│  7. Strict Auditability & Change Data Capture                               │
│  8. Absolute Financial Integrity (Double-Entry Invariants)                  │
│  9. Hybrid Performance Allocation (Dynamic != Everything is JSONB)         │
│ 10. Builders as First-Class Platform Products                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Principles Specification

### Principle 1: Configure, Don't Customize
An organization must never require developers to modify source code for standard operational variations. Adding fields, redesigning intake forms, changing approval chains, customizing role permissions, reorganizing campus hierarchies, or adjusting dashboard KPIs **must** be achievable via runtime configuration.

### Principle 2: Stable Core + Extensible Platform + Configurable Organizations
* **Stable Core**: Core engines (Identity, Hierarchy, RBAC, Ledger, Audit, Event Bus) expose stable internal APIs. Core mechanics are protected from organization-specific tampering.
* **Extensible Platform**: Developers introduce new capabilities via self-contained, pluggable **Domain Modules** without modifying core table definitions.
* **Configurable Organizations**: End-user organizations instantiate, toggle, and configure platform capabilities through declarative metadata.

### Principle 3: Multi-Tenant by Design (Zero Leakage Guarantee)
Multi-tenancy is not an afterthought; it is baked into every data access path. Every table has an `organization_id` foreign key. Cross-tenant reads or writes are prevented at the network, application, cache, and database layers.

### Principle 4: Dual-Layer Defense-in-Depth Security
Security operates on two independent, synchronous tiers:
1. **Tier 1 (Application Layer)**: Identity Guards, Role Permission Evaluators, and Hierarchical Data Scope Filters.
2. **Tier 2 (Database Layer)**: PostgreSQL Row-Level Security (RLS) policies enforcing tenant separation on every database query using connection session variables (`SET LOCAL app.current_tenant_id`).

### Principle 5: Server-Side Authority
The client UI is considered untrusted. While client-side validation provides a responsive user experience, all conditional logic, field requirements, permission checks, workflow transition guards, and formula calculations are re-evaluated and validated on the backend before any database commit.

### Principle 6: Immutable Versioning of Mutable Metadata
When an administrator modifies a form layout, dynamic entity structure, or workflow approval graph, the system **never mutates existing published schemas in place**. Modifications generate a new, immutable `Version`. Historical records remain permanently bound to the version under which they were created.

### Principle 7: Strict Auditability & Change Data Capture
Every state-changing operation (Create, Update, Delete, State Transition) produces an immutable, append-only record in `audit_logs` capturing:
* Actor identity (`actor_id`, `actor_email`, `ip_address`, `user_agent`)
* Target coordinates (`organization_id`, `entity_type`, `entity_id`)
* Action type and exact before/after state snapshots with structured delta diffs.

### Principle 8: Absolute Financial Integrity (Double-Entry Invariants)
Accounting is a strict mathematical science:
* Every financial transaction is balanced: $\sum \text{Debits} = \sum \text{Credits}$.
* **Posted journal entries are immutable**. They cannot be updated or deleted.
* Corrections occur exclusively through offsetting **Reversal Journals** and adjustment entries.
* Transactions cannot be posted to closed or locked fiscal periods.

### Principle 9: Hybrid Performance Allocation (Dynamic != Everything is JSONB)
Flexibility must never compromise query performance or data integrity.
* **Relational SQL Tables**: Core identity, financial ledgers, audit trails, hierarchy nodes.
* **Metadata Catalogs**: Versioned form definitions, workflow graphs, entity definitions.
* **Indexed JSONB**: Dynamic custom attributes on extensible entities, and virtual custom entity records (always indexed with GIN / btree extraction).

### Principle 10: Builders as First-Class Platform Products
CampusOS provides 8 unified, first-class visual builders sharing a common design language, drag-and-drop primitives, AST schemas, and permission models.

---

## 3. Explicit Prohibitions for Developers and AI Agents

| ❌ PROHIBITED VIOLATIONS (NEVER DO THIS) | ✅ REQUIRED ARCHITECTURAL PATTERN |
|---|---|
| Hardcoding specific school roles (e.g. `if (role === 'Teacher')`) in core code. | Querying the dynamic permission evaluator (e.g. `can(user, 'UPDATE', 'grade', record)`). |
| Directly updating or deleting a posted row in `journal_entries` or `journal_lines`. | Creating an offsetting `VOUCHER_TYPE = REVERSAL` journal entry within a transaction. |
| Querying the database without setting the tenant RLS context. | Using the `TenantTransactionManager` to guarantee `SET LOCAL app.current_tenant_id` on the connection. |
| Mutating an existing `form_versions` row that is marked `PUBLISHED`. | Creating a new `DRAFT` version or publishing version `N + 1`. |
| Hardcoding a 3-tier hierarchy (`Org -> Campus -> Dept`) in code. | Traversing `hierarchy_nodes` using PostgreSQL `ltree` path queries (`<@` and `@>`). |
| Putting high-volume relational data (like general ledger accounts) into raw unindexed JSONB. | Using strict relational tables for core financial entities. |
