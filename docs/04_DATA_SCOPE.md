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

---

## 3. Authorized Node Scope Enforcement (Backend Responsibility)

Every API endpoint, query, list, report, dashboard, export, background job, and scheduled task must:

1. Resolve the authenticated user's **effective authorized node scope** from `membership_node_assignments` + `assignment_roles` + `role_permissions`.
2. Validate that every requested node ID (`branchIds`, `campusIds`, etc.) is within the user's authorized scope.
3. Apply the scope as an additional SQL filter to all returned data.
4. **Fail closed** if a requested node is not in the user's authorized scope — return empty or 403, never unauthorized data.

**Frontend filters are UX only. The backend must never trust them as authorization boundaries.**

---

## 4. Authorized Multi-Select Node Filter (UI Standard)

Every relevant operational/data page MUST provide an authorized multi-select Campus/Branch/Node filter.

**Required filter capabilities:**
- Search nodes by name/code
- Select one node
- Select multiple nodes
- Select All Authorized (default)
- Clear Selection

**The filter MUST NEVER offer unauthorized nodes** (nodes the user has no assignment to).

The filter may use context-appropriate labels:
- Campus
- Branch
- School
- Location
- Organizational Unit

Internally it uses the generic hierarchy node model.

---

## 5. Global Working Scope

The frontend must maintain a persistent **Global Working Scope** — the user's currently selected organizational context (one or more authorized nodes).

```
User authorized: [Main Campus] [North Campus] [South Campus]
User selects:    [Main Campus] + [South Campus]
→ All subsequent pages show combined data for Main Campus + South Campus only.
```

- The working scope persists across navigation between modules.
- Individual pages may narrow the selection (e.g., filter to a specific campus within their scope).
- **A page may ONLY NARROW the working scope. It can never EXPAND authorization.**
- On a new page load, if the page has its own scoped filter, it defaults to the current Global Working Scope.

---

## 6. Node-Scoped Business Record Association

Every business record that requires campus/location-based authorization, filtering, reporting, or aggregation MUST retain an authoritative organizational node association using the generic hierarchy/node architecture.

**Records requiring node association:**

| Module | Example Records |
|---|---|
| Student Management | Student profiles, enrollment records |
| Admissions | Applications, merit lists |
| Fee & Billing | Invoices, receipts, discount applications |
| Financial | Vouchers, journal entries (sub-ledger level) |
| Payroll | Payroll runs, salary disbursements |
| HR | Employee profiles, leave records, attendance |
| Academics | Class schedules, attendance sheets, exam results |
| Inventory | Transactions, stock movements |
| Transport | Route logs, vehicle assignments |
| Library | Borrowing transactions, returns |

**Records that are global/shared (must NOT carry node owner):**

| Category | Examples |
|---|---|
| Geography Masters | Countries, Provinces, Cities, Areas, Postal Codes |
| Configuration Masters | Permission definitions, system metadata, field definitions |
| Shared Finance Masters | Account chart of accounts structure, currencies |

---

## 7. Campus/Branch Column Standard for Data Tables

Every relevant ERP list/data table displaying node-scoped business records **MUST** include a visible organizational node column:

| Field Name (display) | Purpose |
|---|---|
| Campus / Branch / Organizational Unit | Identifies the source node of every row |

This column must support:
- Filtering
- Sorting
- Grouping
- Reporting
- Export

**Single-location organization behavior**: When an organization has no separate Branch, the School itself is the effective operational node. The UI displays the School name in the Campus/Location column. No fake Branch is created.

---

## 8. Scope in Reporting, Dashboards & Background Jobs

The exact same node scope rules apply to:

| Surface | Rule |
|---|---|
| Dashboards / KPI cards | Aggregate only over authorized/selected scope |
| Reports | Filter to authorized/selected scope |
| Charts | Represent only authorized/selected scope |
| Exports | Include only authorized/selected rows |
| Scheduled reports | Use the scope of the scheduling user/job context |
| Background jobs | Propagate organizationId, actorId, authorized node scope, and selected scope |

A user authorized for Branch A + Branch B must never see Branch C aggregated in any dashboard total, report figure, or export.

Background workers must not accidentally execute with organization-wide access when the initiating operation was branch-scoped.
