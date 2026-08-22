# 04. Data Scopes & Hierarchy Enforcement

---

## 1. Scope Evaluation Matrix

Data Scopes govern the spatial boundary of records a role can access within the hierarchy tree.

| Scope Code | Resolution Rule | Architectural Boundary |
|---|---|---|
| `EXACT_NODE` | `record.hierarchy_node_id == assignment.hierarchy_node_id` | Isolated strictly to the assigned node. Sibling and descendant nodes are blocked. |
| `HIERARCHY_SUBTREE` | `record.path <@ assignment.path` | Accessible across the assigned node and all descendant branches in the tree. |
| `ORGANIZATION_WIDE` | `record.organization_id == tenant_id` | Explicit policy grant across the entire tenant. **Never inferred from hierarchy naming or "Head Office" assignments.** |
| `OWN_RECORDS` | `record.created_by == current_user_id` | Accessible only by the creator/owner. |
| `ASSIGNED_RECORDS` | `record.assigned_to == current_user_id` | Accessible only when explicitly assigned (e.g. course instructor). |
| `CUSTOM_SCOPE` | AST Boolean Expression | Evaluated dynamically against record attributes and user context. |

---

## 2. Decoupling Scopes from Hierarchy Names

* **Invariant**: `ORGANIZATION_WIDE` access is **never** granted automatically because a node is named "Head Office", "Central Directorate", or has a `level_order = 1`.
* All permissions and scopes must be explicitly declared in `role_permissions`.
* If a Central Office accountant is granted `EXACT_NODE`, they can only access records created at the Central Office node itself, with zero visibility into regional or campus ledgers.
