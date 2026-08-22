# 02. Organization & Multi-Node Assignment Model

---

## 1. Configurable Hierarchy Architecture

CampusOS supports arbitrary-depth, multi-tier organizational hierarchies. The hierarchy is modeled using two metadata concepts:

1. **Hierarchy Node Types (`hierarchy_node_types`)**: Abstract tiers defined by the organization (*e.g., Head Office, Directorate, Region, Campus, School, Faculty, Department, Program, Section*).
2. **Hierarchy Nodes (`hierarchy_nodes`)**: Concrete operational instances organized as a tree indexed via PostgreSQL `ltree` (*e.g., `root.region_north.campus_isb.dept_cs`*).

---

## 2. Global Identity vs. Organization Membership

```
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL IDENTITY LAYER                    │
│   identity_users (Authentication, Credentials, MFA, Status)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ (1 : N)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 TENANT MEMBERSHIP BOUNDARY                  │
│   organization_memberships (Tenant Link, Status, Version)   │
└──────────────┬───────────────────────────────┬──────────────┘
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

## 3. Multi-Node Assignments & Roles

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
