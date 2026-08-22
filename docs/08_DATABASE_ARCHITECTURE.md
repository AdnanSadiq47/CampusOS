# 08. Database Architecture & Hybrid Data Model

---

## 1. Overview & Technology Decisions

CampusOS utilizes **PostgreSQL 16+** as its primary relational engine, managed via **Drizzle ORM** for zero-runtime-overhead TypeScript query composition and native Row-Level Security (RLS) support.

### The Hybrid Storage Decision
To balance strict financial ACID guarantees, high-performance reporting, and infinite runtime configurability, CampusOS divides all platform data into **Three Distinct Storage Strategies**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. STRATEGY A: NATIVE RELATIONAL SQL TABLES                                 │
│    Organizations, Users, Roles, Chart of Accounts, Journal Entries, Audit   │
│    • High write volume, strict ACID consistency, foreign keys, constraints. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. STRATEGY B: HYBRID EXTENSIBLE ENTITIES (SQL Core + JSONB Attributes)     │
│    Students, Faculty, Invoices, Admissions Applications                     │
│    • Core identity in typed SQL columns; custom fields stored in GIN JSONB. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. STRATEGY C: VIRTUAL CUSTOM ENTITY RECORDS                                │
│    Hostel Rooms, Transport Routes, Assets, Visitor Logs                     │
│    • Fully virtual entities created at runtime by organization admins.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Strict Rule**: Do NOT put everything into JSONB simply because it is dynamic. High-frequency relational joins and financial ledgers must always utilize Strategy A.

---

## 2. Core Relational Schema (Strategy A)

```sql
-- PostgreSQL Extensions Required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (Authentication & Identity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(32),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(64),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, email)
);
```

---

## 3. Double-Entry Accounting Core Schema (Strategy A)

```sql
-- 1. Financial Years & Fiscal Periods
CREATE TABLE financial_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,              -- e.g. "FY-2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

CREATE TABLE fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_year_id UUID NOT NULL REFERENCES financial_years(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,              -- e.g. "January 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,        -- If true, no backdated entries allowed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chart of Accounts
CREATE TABLE chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,              -- e.g. "1001", "2010"
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,              -- 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    parent_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- 3. Journal Entry Headers
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    node_id UUID REFERENCES hierarchy_nodes(id), -- Scoped to Campus / Branch
    entry_number VARCHAR(64) NOT NULL,      -- Sequential sequence number
    entry_date DATE NOT NULL,
    voucher_type VARCHAR(32) NOT NULL,      -- 'RECEIPT', 'PAYMENT', 'JOURNAL', 'CONTRA', 'REVERSAL'
    narration TEXT,
    is_posted BOOLEAN DEFAULT FALSE,
    reversal_of_id UUID REFERENCES journal_entries(id), -- Linked if this is a reversal
    created_by UUID NOT NULL,
    posted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, entry_number)
);

-- 4. Journal Entry Lines (Double-Entry Balance Enforcement)
CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    credit_amount NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    cost_center_id UUID REFERENCES hierarchy_nodes(id),
    memo VARCHAR(255),
    CONSTRAINT check_positive_debit CHECK (debit_amount >= 0),
    CONSTRAINT check_positive_credit CHECK (credit_amount >= 0),
    CONSTRAINT check_single_side CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0)
    )
);
```

---

## 4. Virtual Custom Entity Records Schema (Strategy C)

```sql
CREATE TABLE custom_entity_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entity_definitions(id) ON DELETE CASCADE,
    form_version_id UUID REFERENCES form_versions(id) ON DELETE SET NULL,
    node_id UUID REFERENCES hierarchy_nodes(id), -- Hierarchy node scope
    data JSONB NOT NULL DEFAULT '{}'::jsonb,     -- Dynamic field values
    is_archived BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- High-Performance GIN Index for arbitrary sub-field JSONB queries
CREATE INDEX idx_custom_entity_data_gin ON custom_entity_records USING GIN (data);
CREATE INDEX idx_custom_entity_org_entity ON custom_entity_records (organization_id, entity_id, is_archived);
```

---

## 5. Transactional Outbox Pattern Schema

To ensure reliable, fault-tolerant asynchronous event publishing without distributed transaction failures:

```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    event_type VARCHAR(128) NOT NULL,      -- e.g. "student.enrolled", "invoice.paid"
    aggregate_type VARCHAR(64) NOT NULL,   -- e.g. "student", "invoice"
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PUBLISHED', 'FAILED'
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
CREATE INDEX idx_outbox_pending ON outbox_events (status, created_at) WHERE status = 'PENDING';
```

---

## 6. PostgreSQL Row-Level Security (RLS) Configuration

```sql
-- Enable RLS on all tenant-isolated tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hierarchy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_entity_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy
CREATE POLICY tenant_isolation_policy ON custom_entity_records
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
```
