# 02. Organization & Multi-Node Assignment Model

---

## 1. Configurable Hierarchy Architecture

CampusOS supports arbitrary-depth, multi-tier organizational hierarchies. The hierarchy is modeled using two metadata concepts:

1. **Hierarchy Node Types (`hierarchy_node_types`)**: Abstract tiers defined by the organization (*e.g., Head Office, Directorate, Region, Campus, School, Faculty, Department, Program, Section*).
2. **Hierarchy Nodes (`hierarchy_nodes`)**: Concrete operational instances organized as a tree indexed via PostgreSQL `ltree` (*e.g., `root.region_north.campus_isb.dept_cs`*).

---

## 2. Platform Owner vs. Customer Organization Boundary

CampusOS has a security-separated **Platform/Owner Administration** tier above all customer organizations:

```
┌──────────────────────────────────────────────────────────────────┐
│              PLATFORM ADMIN (CampusOS Owner)                     │
│  Provisions customer orgs, Head Offices, initial org admins,     │
│  manages platform-level modules and licensing.                   │
│  STRICT security boundary — NOT an org-data bypass.             │
└──────────────────────────────────┬───────────────────────────────┘
                                   │ (1 : N)
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│              CUSTOMER ORGANIZATION (Tenant)                      │
│  organizations table — the root tenant boundary.                 │
└──────────────────────────────────┬───────────────────────────────┘
                                   │ (0 or 1+: configurable nodes)
                                   ▼
            Configurable Hierarchy Nodes (hierarchy_node_types + hierarchy_nodes)
```

Platform-level operations and tenant-level operations must have explicit security boundaries, audit trails, and privileged service paths.

---

## 3. Variable-Depth Hierarchy (All Structures Are Valid)

CampusOS MUST NOT assume any fixed hierarchy depth. All of the following are valid and fully supported:

| Case | Structure |
|---|---|
| **A — Full hierarchy** | Organization → Head Office → Region → School → Branch |
| **B — No region** | Organization → Head Office → School → Branch |
| **C — No head office** | Organization → School → Branch |
| **D — Single-location** | Organization → School *(no Head Office, no Region, no Branch)* |

**Permanent rules:**
- Head Office is **optional**.
- Region is **optional**.
- Branch/Campus child level is **optional**.
- A School may itself be the effective **operational node**.
- **Never create fake Head Office, Region, or Branch records to satisfy application logic.**
- The generic configurable hierarchy engine remains authoritative for all node types.

Future node types (Zone, District Office, Faculty, Division, Department, Learning Center) must be supportable without code changes.

---

## 4. Global Identity vs. Organization Membership

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL IDENTITY LAYER                        │
│   identity_users (Authentication, Credentials, MFA, Status)    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ (1 : N)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TENANT MEMBERSHIP BOUNDARY                      │
│   organization_memberships (Tenant Link, Status, Version)       │
└──────────────┬───────────────────────────────┬──────────────────┘
               │ (1 : N)                       │ (1 : N)
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│    DOMAIN PERSONA PROFILES   │ │  MULTI-NODE ASSIGNMENTS     │
│  employee_profiles /         │ │  membership_node_assignments│
│  student_profiles /          │ │  (Head Office, Region,      │
│  parent_profiles             │ │   Campus A, Campus B)       │
└──────────────────────────────┘ └─────────────┬───────────────┘
                                               │ (1 : N)
                                               ▼
                                 ┌─────────────────────────────┐
                                 │     ASSIGNMENT ROLES        │
                                 │  assignment_roles           │
                                 │  (Roles per specific node)  │
                                 └─────────────────────────────┘
```

1. **Global Identity (`identity_users`)**: Contains global login credentials, Argon2id password hashes, and AES-256-GCM encrypted MFA secrets. Kept strictly isolated from tenant business queries.
2. **Organization Membership (`organization_memberships`)**: Formal contract between an identity and an organization (`UNIQUE (organization_id, identity_user_id)`). Contains lifecycle status (`INVITED`, `ACTIVE`, `SUSPENDED`, `TERMINATED`) and `version` counter for instant token revocation.
3. **Persona Profiles**: Domain HR, academic, or family extensions (`employee_profiles`, `student_profiles`, `parent_profiles`) linked directly to the membership.

---

## 5. Multi-Node Assignments & Roles

Employees and subjects are **never** hardcoded to a single campus or branch.

* **Many-to-Many Node Assignments (`membership_node_assignments`)**: An individual can hold multiple active assignments simultaneously across distinct hierarchy tiers (*e.g., Head Office + Region South + Campus A + Campus B*).
* **Multiple Roles per Assignment (`assignment_roles`)**: A user can have distinct roles at different nodes (*e.g., Finance Officer at Head Office, Accountant at Campus A, Viewer at Campus C*).
* **Composite Foreign Keys**:
  * `(organization_id, membership_id) REFERENCES organization_memberships(organization_id, id)`
  * `(organization_id, hierarchy_node_id) REFERENCES hierarchy_nodes(organization_id, id)`
  * `(organization_id, assignment_id) REFERENCES membership_node_assignments(organization_id, id)`
  * `(organization_id, role_id) REFERENCES roles(organization_id, id)`
  Cross-tenant assignment corruption is physically impossible at the SQL engine level.
* **Primary Assignment Invariant**:
  ```sql
  CREATE UNIQUE INDEX uq_primary_assignment_per_membership 
  ON membership_node_assignments (organization_id, membership_id) 
  WHERE is_primary = TRUE AND status = 'ACTIVE';
  ```
  Enforces at most one active primary node assignment per membership. `is_primary` is strictly UI metadata and never alters security boundaries.

---

## 6. Authorization Requires All Layers

Node assignment alone does NOT grant access. Actual access requires the correct intersection of ALL applicable layers:

```
Identity
→ Organization Membership (ACTIVE, within valid_from/valid_until)
→ Hierarchy Node Assignment (authorized node scope)
→ Delegated Role(s)
→ Module Permission
→ Page Permission
→ Action Permission
→ Data Scope (EXACT_NODE / HIERARCHY_SUBTREE / ORGANIZATION_WIDE / OWN_RECORDS)
→ Domain Scope (class/section assignments, teacher assignments, etc.)
→ Record Scope
→ Field Scope
```

A user must only see and operate on what ALL applicable authorization layers permit.

---

## 7. Organizational Node Association on Business Data

Every business record that is organizationally scoped MUST retain an authoritative organizational node association to enable authorization, filtering, search, grouping, aggregation, reporting, and export by organizational node.

**Records requiring node association (examples):**
- Students, Admissions, Enrollment
- Employees, Attendance, Leave
- Fees, Invoices, Receipts, Financial Vouchers
- Payroll
- Examinations
- Inventory Transactions
- Transport Operational Records
- Library Transactions
- Academic Operational Records

**Records that are global/shared and must NOT carry a node owner:**
- Countries, Currencies, Field Definitions, System Metadata, Permission Definitions

---

## 8. Role Delegation Ceiling

Head Office / higher-authorized administrators may delegate selected roles to downstream nodes. **No downstream administrator may create, assign, or delegate a role or permission greater than their own authorized/delegated privilege ceiling.** This is a mandatory anti-privilege-escalation invariant.

Role assignments and delegation must be audited (actor, target user/role, target node, before/after state, timestamp).

---

## 9. Login Credentials vs. Organizational Records

Organizational records (schools, regions, branches, head offices) must NEVER store plaintext username/password credentials. Credentials belong exclusively to `identity_users`.

Organization creation flows may optionally offer "Create Administrator Login" which uses the approved Argon2id password service. Existing passwords must never be displayed. Credentials must never appear in audit payloads.
