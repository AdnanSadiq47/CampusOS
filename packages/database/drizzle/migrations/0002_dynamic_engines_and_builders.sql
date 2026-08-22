-- Phase 2 Migration: Dynamic Engines & Visual Builder Suite Tables

-- 1. Dynamic Entities & Virtual ORM
CREATE TABLE IF NOT EXISTS "entity_definitions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN DEFAULT FALSE NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_entity_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "uq_entity_org_code" UNIQUE ("organization_id", "code")
);

CREATE TABLE IF NOT EXISTS "entity_fields" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "entity_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "field_type" VARCHAR(32) NOT NULL,
    "is_required" BOOLEAN DEFAULT FALSE NOT NULL,
    "is_unique" BOOLEAN DEFAULT FALSE NOT NULL,
    "is_searchable" BOOLEAN DEFAULT FALSE NOT NULL,
    "default_value" JSONB,
    "validation_rules" JSONB DEFAULT '{}'::jsonb NOT NULL,
    "options" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "reference_entity_id" UUID,
    "sort_order" INT DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_entity_field_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "uq_entity_field_code" UNIQUE ("organization_id", "entity_id", "code"),
    CONSTRAINT "fk_entity_fields_entity" FOREIGN KEY ("organization_id", "entity_id")
      REFERENCES "entity_definitions"("organization_id", "id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "entity_records" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "entity_id" UUID NOT NULL,
    "hierarchy_node_id" UUID NOT NULL,
    "data" JSONB DEFAULT '{}'::jsonb NOT NULL,
    "created_by" UUID REFERENCES "identity_users"("id") ON DELETE SET NULL,
    "updated_by" UUID REFERENCES "identity_users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_entity_record_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "fk_entity_records_entity" FOREIGN KEY ("organization_id", "entity_id")
      REFERENCES "entity_definitions"("organization_id", "id") ON DELETE CASCADE,
    CONSTRAINT "fk_entity_records_node" FOREIGN KEY ("organization_id", "hierarchy_node_id")
      REFERENCES "hierarchy_nodes"("organization_id", "id") ON DELETE RESTRICT
);

-- 2. Form Builder & Declarative Versioned AST
CREATE TABLE IF NOT EXISTS "form_definitions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "entity_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_form_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "uq_form_org_code" UNIQUE ("organization_id", "code"),
    CONSTRAINT "fk_form_entity" FOREIGN KEY ("organization_id", "entity_id")
      REFERENCES "entity_definitions"("organization_id", "id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "form_versions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "form_id" UUID NOT NULL,
    "version" INT NOT NULL,
    "status" VARCHAR(32) DEFAULT 'DRAFT' NOT NULL,
    "schema_ast" JSONB NOT NULL,
    "rules" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "published_at" TIMESTAMPTZ,
    "published_by" UUID REFERENCES "identity_users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_form_version_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "uq_form_version_number" UNIQUE ("organization_id", "form_id", "version"),
    CONSTRAINT "fk_form_versions_form" FOREIGN KEY ("organization_id", "form_id")
      REFERENCES "form_definitions"("organization_id", "id") ON DELETE CASCADE
);

-- 3. Workflow FSM Engine
CREATE TABLE IF NOT EXISTS "workflow_definitions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "entity_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "initial_state_code" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_workflow_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "uq_workflow_org_code" UNIQUE ("organization_id", "code"),
    CONSTRAINT "fk_workflow_entity" FOREIGN KEY ("organization_id", "entity_id")
      REFERENCES "entity_definitions"("organization_id", "id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "workflow_states" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "workflow_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "state_type" VARCHAR(32) DEFAULT 'INTERMEDIATE' NOT NULL,
    "color" VARCHAR(32) DEFAULT 'gray' NOT NULL,
    "sort_order" INT DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_workflow_state_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "uq_workflow_state_code" UNIQUE ("organization_id", "workflow_id", "code"),
    CONSTRAINT "fk_workflow_states_workflow" FOREIGN KEY ("organization_id", "workflow_id")
      REFERENCES "workflow_definitions"("organization_id", "id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "workflow_transitions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "workflow_id" UUID NOT NULL,
    "from_state_code" VARCHAR(64) NOT NULL,
    "to_state_code" VARCHAR(64) NOT NULL,
    "action_name" VARCHAR(128) NOT NULL,
    "guard_rule" JSONB DEFAULT '{}'::jsonb NOT NULL,
    "required_roles" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "actions" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_workflow_transition_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "fk_workflow_transitions_workflow" FOREIGN KEY ("organization_id", "workflow_id")
      REFERENCES "workflow_definitions"("organization_id", "id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "workflow_instances" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "workflow_id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "current_state_code" VARCHAR(64) NOT NULL,
    "assigned_node_id" UUID NOT NULL,
    "started_by" UUID REFERENCES "identity_users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_workflow_instance_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "fk_workflow_instances_workflow" FOREIGN KEY ("organization_id", "workflow_id")
      REFERENCES "workflow_definitions"("organization_id", "id") ON DELETE CASCADE,
    CONSTRAINT "fk_workflow_instances_record" FOREIGN KEY ("organization_id", "record_id")
      REFERENCES "entity_records"("organization_id", "id") ON DELETE CASCADE,
    CONSTRAINT "fk_workflow_instances_node" FOREIGN KEY ("organization_id", "assigned_node_id")
      REFERENCES "hierarchy_nodes"("organization_id", "id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "workflow_history" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "instance_id" UUID NOT NULL,
    "from_state_code" VARCHAR(64) NOT NULL,
    "to_state_code" VARCHAR(64) NOT NULL,
    "action_taken" VARCHAR(128) NOT NULL,
    "performed_by" UUID REFERENCES "identity_users"("id") ON DELETE SET NULL,
    "comments" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_workflow_history_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "fk_workflow_history_instance" FOREIGN KEY ("organization_id", "instance_id")
      REFERENCES "workflow_instances"("organization_id", "id") ON DELETE CASCADE
);

-- 4. Dynamic Navigation & Menus
CREATE TABLE IF NOT EXISTS "navigation_menus" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_nav_menu_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "uq_nav_menu_code" UNIQUE ("organization_id", "code")
);

CREATE TABLE IF NOT EXISTS "navigation_items" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "menu_id" UUID NOT NULL,
    "parent_id" UUID,
    "label" VARCHAR(128) NOT NULL,
    "icon" VARCHAR(64),
    "route_path" VARCHAR(255) NOT NULL,
    "required_module" VARCHAR(64),
    "required_permissions" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "sort_order" INT DEFAULT 0 NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_nav_item_org_id" UNIQUE ("organization_id", "id"),
    CONSTRAINT "fk_nav_items_menu" FOREIGN KEY ("organization_id", "menu_id")
      REFERENCES "navigation_menus"("organization_id", "id") ON DELETE CASCADE,
    CONSTRAINT "fk_nav_items_parent" FOREIGN KEY ("organization_id", "parent_id")
      REFERENCES "navigation_items"("organization_id", "id") ON DELETE CASCADE
);

-- 5. Pluggable Organization Modules
CREATE TABLE IF NOT EXISTS "organization_modules" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "module_code" VARCHAR(64) NOT NULL,
    "is_enabled" BOOLEAN DEFAULT FALSE NOT NULL,
    "settings" JSONB DEFAULT '{}'::jsonb NOT NULL,
    "activated_at" TIMESTAMPTZ,
    "activated_by" UUID REFERENCES "identity_users"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT "uq_org_module" UNIQUE ("organization_id", "module_code")
);

-- 6. Enable & Force Row-Level Security on all 13 new Phase 2 tenant tables
ALTER TABLE "entity_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entity_definitions" FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_definitions_tenant_select ON entity_definitions FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_definitions_tenant_insert ON entity_definitions FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_definitions_tenant_update ON entity_definitions FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_definitions_tenant_delete ON entity_definitions FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "entity_fields" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entity_fields" FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_fields_tenant_select ON entity_fields FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_fields_tenant_insert ON entity_fields FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_fields_tenant_update ON entity_fields FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_fields_tenant_delete ON entity_fields FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "entity_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entity_records" FORCE ROW LEVEL SECURITY;
CREATE POLICY entity_records_tenant_select ON entity_records FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_records_tenant_insert ON entity_records FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_records_tenant_update ON entity_records FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY entity_records_tenant_delete ON entity_records FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "form_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "form_definitions" FORCE ROW LEVEL SECURITY;
CREATE POLICY form_definitions_tenant_select ON form_definitions FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY form_definitions_tenant_insert ON form_definitions FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY form_definitions_tenant_update ON form_definitions FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY form_definitions_tenant_delete ON form_definitions FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "form_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "form_versions" FORCE ROW LEVEL SECURITY;
CREATE POLICY form_versions_tenant_select ON form_versions FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY form_versions_tenant_insert ON form_versions FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY form_versions_tenant_update ON form_versions FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY form_versions_tenant_delete ON form_versions FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "workflow_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_definitions" FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_definitions_tenant_select ON workflow_definitions FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_definitions_tenant_insert ON workflow_definitions FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_definitions_tenant_update ON workflow_definitions FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_definitions_tenant_delete ON workflow_definitions FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "workflow_states" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_states" FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_states_tenant_select ON workflow_states FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_states_tenant_insert ON workflow_states FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_states_tenant_update ON workflow_states FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_states_tenant_delete ON workflow_states FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "workflow_transitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_transitions" FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_transitions_tenant_select ON workflow_transitions FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_transitions_tenant_insert ON workflow_transitions FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_transitions_tenant_update ON workflow_transitions FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_transitions_tenant_delete ON workflow_transitions FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "workflow_instances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_instances" FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_instances_tenant_select ON workflow_instances FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_instances_tenant_insert ON workflow_instances FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_instances_tenant_update ON workflow_instances FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_instances_tenant_delete ON workflow_instances FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "workflow_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow_history" FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_history_tenant_select ON workflow_history FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_history_tenant_insert ON workflow_history FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_history_tenant_update ON workflow_history FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY workflow_history_tenant_delete ON workflow_history FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "navigation_menus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "navigation_menus" FORCE ROW LEVEL SECURITY;
CREATE POLICY navigation_menus_tenant_select ON navigation_menus FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY navigation_menus_tenant_insert ON navigation_menus FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY navigation_menus_tenant_update ON navigation_menus FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY navigation_menus_tenant_delete ON navigation_menus FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "navigation_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "navigation_items" FORCE ROW LEVEL SECURITY;
CREATE POLICY navigation_items_tenant_select ON navigation_items FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY navigation_items_tenant_insert ON navigation_items FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY navigation_items_tenant_update ON navigation_items FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY navigation_items_tenant_delete ON navigation_items FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

ALTER TABLE "organization_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_modules" FORCE ROW LEVEL SECURITY;
CREATE POLICY organization_modules_tenant_select ON organization_modules FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY organization_modules_tenant_insert ON organization_modules FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY organization_modules_tenant_update ON organization_modules FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid) WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
CREATE POLICY organization_modules_tenant_delete ON organization_modules FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 7. Grant access on new tables to runtime role
GRANT SELECT, INSERT, UPDATE, DELETE ON 
  "entity_definitions", "entity_fields", "entity_records",
  "form_definitions", "form_versions",
  "workflow_definitions", "workflow_states", "workflow_transitions", "workflow_instances", "workflow_history",
  "navigation_menus", "navigation_items", "organization_modules"
TO campus_app_user;
