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
