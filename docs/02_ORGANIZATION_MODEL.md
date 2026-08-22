# 02. Organization Structure & Hierarchy Engine

---

## 1. Overview & Core Concept

Institutions exhibit vastly diverse administrative topographies:
* **Collegiate University**: *Organization -> Main Campus -> Faculty -> Academic Department -> Degree Program -> Section*
* **National School Network**: *Organization -> Head Office -> Region -> District Zone -> Campus -> Academic Wing -> Grade Level -> Class Section*
* **Vocational Academy**: *Organization -> Training Center -> Workshop Unit -> Cohort Batch*

**CampusOS does NOT hardcode hierarchy levels.** 
Instead, it provides an **Arbitrary-Depth Organization Hierarchy Engine** where institutions define their own **Hierarchy Node Types** (the blueprint tiers) and instantiate their own **Hierarchy Nodes** (the physical operational units).

---

## 2. Structural Architecture

```mermaid
graph TD
    subgraph 1. Hierarchy Node Types Definition (Blueprint)
        T1[Type: Head Office / Directorate - Level 1] --> T2[Type: Regional Office - Level 2]
        T2 --> T3[Type: Campus / Branch - Level 3]
        T3 --> T4[Type: Faculty / Wing - Level 4]
        T4 --> T5[Type: Department / Grade - Level 5]
        T5 --> T6[Type: Section / Cohort - Level 6]
    end

    subgraph 2. Concrete Hierarchy Nodes (Operational Tree)
        N_Root[National Education Trust] --> N_HO[Central Secretariat - Islamabad]
        N_Root --> N_RegNorth[North Region Directorate]
        N_Root --> N_RegSouth[South Region Directorate]
        
        N_RegNorth --> N_Camp1[City Campus A]
        N_RegNorth --> N_Camp2[Hill Campus B]
        
        N_Camp1 --> N_DeptCS[Computer Science Dept]
        N_Camp1 --> N_DeptEE[Electrical Engineering Dept]
        
        N_DeptCS --> N_SecA[BSCS Section 2026-A]
        N_DeptCS --> N_SecB[BSCS Section 2026-B]
    end
```

---

## 3. Database Schema Specification

```sql
-- 1. Root Organization (Tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,       -- e.g., "beaconhouse_group"
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_identifier VARCHAR(64),
    primary_currency VARCHAR(3) DEFAULT 'USD',
    domain VARCHAR(255) UNIQUE,             -- e.g., "portal.beaconhouse.edu"
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hierarchy Node Types (Configurable Blueprint Tiers per Tenant)
CREATE TABLE hierarchy_node_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,              -- e.g., "CAMPUS", "REGION", "FACULTY"
    name VARCHAR(128) NOT NULL,             -- e.g., "Campus / Branch", "Regional Directorate"
    level_order INT NOT NULL,                -- 1 = Top Tier, 2 = Second Tier, etc.
    allow_financial_posting BOOLEAN DEFAULT TRUE, -- Can vouchers be assigned to this tier?
    allow_user_assignment BOOLEAN DEFAULT TRUE,   -- Can users be scoped to this tier?
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- 3. Hierarchy Nodes (Concrete Tree Instances)
CREATE TABLE hierarchy_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    node_type_id UUID NOT NULL REFERENCES hierarchy_node_types(id) ON DELETE RESTRICT,
    parent_id UUID REFERENCES hierarchy_nodes(id) ON DELETE RESTRICT,
    code VARCHAR(64) NOT NULL,              -- e.g., "ISB_CAMPUS_01"
    name VARCHAR(255) NOT NULL,             -- e.g., "Islamabad Main Campus"
    path LTREE NOT NULL,                    -- Materialized path (e.g. 'root.reg_north.camp_isb')
    address JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- Indexes for lightning-fast hierarchical traversal
CREATE INDEX idx_hierarchy_nodes_path ON hierarchy_nodes USING GIST (path);
CREATE INDEX idx_hierarchy_nodes_org_parent ON hierarchy_nodes (organization_id, parent_id);
```

---

## 4. PostgreSQL `ltree` Traversal Mechanics

Every hierarchy node maintains an indexed material path string composed of node UUIDs or cleaned alphanumeric identifiers (e.g., `root.reg_north.camp_isb.dept_cs`).

### Subtree Search (Descendant Queries)
To find all records belonging to a branch and all its downstream departments/sections:
```sql
-- Finds the node and all its infinite descendants in O(log N) time
SELECT * FROM hierarchy_nodes 
WHERE path <@ 'root.reg_north.camp_isb' 
  AND organization_id = 'tenant_uuid';
```

### Ancestor Search (Upward Rollup Queries)
To find the parent branch, region, and head office governing a specific class section:
```sql
SELECT * FROM hierarchy_nodes 
WHERE path @> 'root.reg_north.camp_isb.dept_cs.sec_a'
  AND organization_id = 'tenant_uuid'
ORDER BY path ASC;
```

---

## 5. Node Movement & Structural Integrity Rules

1. **Cycle Prevention**: A node can never be made a child of itself or any of its own descendants.
2. **Path Cascade Update**: When a parent node (e.g. `reg_north`) is moved under a new parent, a database trigger or transactional service updates the `path` prefix for that node and all its descendants atomically in a single transaction:
   ```sql
   UPDATE hierarchy_nodes
   SET path = 'root.new_zone' || subpath(path, nlevel('root.old_zone'))
   WHERE path <@ 'root.old_zone.camp_isb';
   ```
3. **Deletion Protection**: A node cannot be deleted if it contains active child nodes, assigned users, or historical accounting/student records. It must be soft-deactivated (`is_active = false`).

---

## 6. Organization Structure Builder (Visual Tool)

The **Organization Structure Builder** is one of the 8 first-class platform builders:
* **Tree Visualizer**: Visual pan/zoom node tree rendering parent-child connections.
* **Tier Manager**: Drag-to-reorder tier definitions (`hierarchy_node_types`).
* **Node Inspector**: Configure node metadata, geographical coordinates, contact details, cost center codes, and operational parameters.
* **Bulk Import/Export**: CSV/JSON upload for enterprise initial onboarding.
