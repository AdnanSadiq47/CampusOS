# 03. Roles, Permissions & Tri-State Authorization Engine

---

## 1. Tri-State Permission Precedence

CampusOS evaluates permissions using a strict **Tri-State Conflict Resolution Model**:

$$\mathbf{Explicit\ DENY} \succ \mathbf{Explicit\ ALLOW} \succ \mathbf{Default\ DENY}$$

```
                ┌──────────────────────────────────────┐
                │ Check All In-Scope Role Permissions  │
                └──────────────────┬───────────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
        [Any Explicit DENY?]               [No Explicit DENY]
                  │                                 │
                 YES                                │
                  │                                 ▼
                  ▼                        [Any Explicit ALLOW?]
       ┌─────────────────────┐                      │
       │   ACCESS DENIED     │             ┌────────┴────────┐
       │ (Explicit Override) │             ▼                 ▼
       └─────────────────────┘            YES                NO
                                           │                 │
                                           ▼                 ▼
                                 ┌───────────────────┐ ┌───────────────┐
                                 │  ACCESS GRANTED   │ │ ACCESS DENIED │
                                 │ (Apply AST Rules) │ │(Default-Deny) │
                                 └───────────────────┘ └───────────────┘
```

1. **Explicit DENY (`effect = 'DENY'`)**: Overrides all sibling `ALLOW` permissions granted by other active roles on matching in-scope nodes.
2. **Explicit ALLOW (`effect = 'ALLOW'`)**: Grants permission provided no matching `DENY` exists and AST conditions pass.
3. **Default DENY**: If no matching rule grants permission, access fails closed ($403\text{ Forbidden}$).

---

## 2. Multi-Node Permission Evaluation Algorithm

When an authenticated user requests an action `(module, entity, action)` on a record located at `record_node_path`:

1. **Verify Active Membership**: The server confirms `organization_memberships` is `ACTIVE` and within `[valid_from, valid_until]`.
2. **Identify In-Scope Node Assignments**:
   * For each active `membership_node_assignments` record, inspect its node's `ltree` path $P_{\text{assigned}}$.
   * Check if the target record path $P_{\text{record}}$ satisfies the assigned role's `data_scope`:
     * `EXACT_NODE`: $P_{\text{record}} = P_{\text{assigned}}$
     * `HIERARCHY_SUBTREE`: $P_{\text{record}} \text{ <@ } P_{\text{assigned}}$
     * `ORGANIZATION_WIDE`: Explicit policy grant across the entire tenant.
     * `OWN_RECORDS`: Record created by or owned by the identity.
3. **Aggregate Permissions**: Combine permissions across all in-scope node assignments.
4. **Apply Tri-State Precedence**:
   * If any in-scope rule has `effect = 'DENY'` for `(module, entity, action)` $\rightarrow$ **DENY**.
   * If at least one in-scope rule has `effect = 'ALLOW'` $\rightarrow$ **ALLOW** (subject to field-level rules and AST condition filters).
   * Otherwise $\rightarrow$ **DENY**.

---

## 3. Dynamic Field-Level Permission Restrictions

Role permissions can declare field-level read/write rules:
* `fieldRules: [{ fieldName: "salary", access: "HIDDEN" }, { fieldName: "ssn", access: "READ_ONLY" }]`
* Enforced during payload serialization and Drizzle query projections.

---

## 4. Dynamic Role Management

CampusOS role management is fully dynamic. Roles are NOT hardcoded to a fixed organization-wide list.

Authorized administrators may:
- Create roles
- Configure roles (name, description, scope, permissions)
- Assign permissions per action/module
- Assign data scopes per role
- Delegate roles to downstream nodes
- Revoke role assignments
- Activate / deactivate roles

All within their **authorized privilege ceiling** (see §5).

---

## 5. Delegated Role Management & Anti-Privilege-Escalation

Head Office / higher-authorized administrators may delegate selected roles to downstream organizational nodes.

**Permanent invariant:** No downstream administrator may create, assign, or delegate a role or permission greater than their own authorized/delegated privilege ceiling.

```
Head Office defines:        [School Admin] [Accountant] [HR Officer] [Finance Controller]
                                   │
Head Office delegates to School A: [School Admin] [Accountant]
                                   │
School A admin can only assign:    [School Admin] [Accountant]
School A admin CANNOT assign:      [Finance Controller] [Platform Admin] [Org-Wide Auditor]
```

---

## 6. Per-Node Role Differentiation

The same employee may have different roles at different nodes. Authorization must resolve the **effective permission for the current node/context** without flattening all assignments into one organization-wide role.

```
Employee: Ali Hassan
  Head Office assignment    → Finance Viewer
  South Region assignment   → Finance Approver
  Karachi Campus assignment → Accountant
  Malir Campus assignment   → Read Only
```

Ali's effective permissions when acting on Karachi Campus records = Accountant scope.
Ali's effective permissions when acting on Malir Campus records = Read Only.

---

## 7. Domain-Level Authorization Depth

Hierarchy scope is only one authorization layer. CampusOS must support deeper domain-specific assignments.

Example — Teacher Ahmed:
```
Authorized Node:  Karachi Campus
Allowed Module:   Academics
Allowed Pages:    Attendance, Marks
Assigned Classes: Class 8, Class 9
Assigned Sections: 8-A, 8-B, 9-A
```

Ahmed must only see:
- Karachi Campus (not other branches)
- Class 8 / Class 9 (not other classes)
- Sections 8-A, 8-B, 9-A (not other sections)
- Students/records belonging to those assignments

This concept is extensible to future domain scopes.

---

## 8. Role Audit Requirements

All role lifecycle events must be captured in the audit log:

| Event | Required Audit Fields |
|---|---|
| Role Creation | actor, org, role name, permissions, timestamp |
| Role Update | actor, org, role, before/after state, diff |
| Role Deactivation | actor, org, role, timestamp |
| Permission Changes | actor, org, role, permission, before/after |
| Role Delegation | actor, org, delegating node, target node, roles |
| Role Assignment | actor, org, target user, target node, role |
| Role Revocation | actor, org, target user, target node, role, timestamp |
| Node Assignment | actor, org, user, node, roles, timestamp |
| Node Removal | actor, org, user, node, timestamp |
| Scope Changes | actor, org, role, scope before/after |

Audit records must NEVER expose sensitive secrets (passwords, MFA keys).
