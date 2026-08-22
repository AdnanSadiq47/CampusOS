# AGENTS.md — Developer & AI Agent Directive

> **CRITICAL NOTICE FOR ALL AI AGENTS AND DEVELOPERS**:  
> `/docs` is the **PERMANENT, AUTHORITATIVE ARCHITECTURAL SOURCE OF TRUTH** for CampusOS.

---

## 1. Mandatory Reading Before Any Task

Before creating or modifying any code in this repository, you **MUST READ** the relevant documentation files in `/docs`:

1. [`/docs/00_PRODUCT_VISION.md`](./docs/00_PRODUCT_VISION.md) — Product Vision, Platform Philosophy & Core Primitives
2. [`/docs/01_CORE_PRINCIPLES.md`](./docs/01_CORE_PRINCIPLES.md) — Non-Negotiable Core Engineering Principles
3. [`/docs/11_AI_RULES.md`](./docs/11_AI_RULES.md) — Mandatory 12-Point Checklist & Conflict Protocols
4. Any relevant domain-specific specification (e.g., [`08_DATABASE_ARCHITECTURE.md`](./docs/08_DATABASE_ARCHITECTURE.md) for DB tasks, [`09_SECURITY_RULES.md`](./docs/09_SECURITY_RULES.md) for auth/tenant tasks).

---

## 2. Core Operational Mandates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. CONFIGURE, DON'T CUSTOMIZE                                               │
│    Never hardcode organization-specific or school-specific logic when the    │
│    Dynamic Entity, Form, Hierarchy, or Workflow engines can handle it.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. DUAL-LAYER SECURITY (APP RBAC + POSTGRESQL RLS)                          │
│    All database queries must execute with the active tenant RLS context     │
│    via TenantTransactionManager (`SET LOCAL app.current_tenant_id`).         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. IMMUTABLE VERSIONING OF MUTABLE METADATA                                 │
│    Published forms, dynamic entities, and workflows are IMMUTABLE.           │
│    Modifications generate new version instances ($V_{N+1}$).                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. STRICT DOUBLE-ENTRY ACCOUNTING INVARIANTS                                │
│    Posted journal entries are NEVER updated or deleted. Corrections are     │
│    made exclusively via offsetting Reversal Journals. $\sum Dr = \sum Cr$.  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. CONFLICT REPORTING PROTOCOL                                              │
│    If a prompt or code request conflicts with `/docs`:                      │
│    STOP IMMEDIATELY. Report the conflict and request architectural approval.│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 12-Point Pre-Implementation Checklist

Before writing any code, evaluate:
1. **Ownership**: Which domain module or core engine owns this feature?
2. **Reuse**: Which existing platform engine must be reused?
3. **Configuration**: Can this requirement be solved via metadata rather than writing hardcoded code?
4. **Permissions**: What action permissions apply? (`READ`, `CREATE`, `APPROVE`, etc.)
5. **Data Scope**: What hierarchy data scope applies? (`SUBTREE`, `EXACT_NODE`, `OWN`, etc.)
6. **Multi-Tenancy**: Is tenant isolation enforced via RLS and `TenantTransactionManager`?
7. **Audit Logging**: Does this state mutation produce a CDC audit entry?
8. **Versioning**: Does this mutate metadata, and does it require a new immutable version?
9. **Event Bus**: Does this emit domain events to the Outbox table?
10. **Accounting Check**: Does this affect financial balances, and does it comply with double-entry balance invariants?
11. **Background Task**: Should this long-running task be offloaded to BullMQ?
12. **Documentation**: Does this change require updating `/docs` & `CHANGELOG.md`?

---

> **Final Directive**: Never sacrifice CampusOS configurability merely to make implementation faster.
