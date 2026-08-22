# CampusOS Architectural Changelog

All major architectural specifications, amendments, and governance updates to CampusOS are documented in this log.

---

## [1.0.0] - 2026-08-22

### Baseline Architecture Finalized & Approved

#### Added
* **Product Vision & Dual-Engine Architecture (`00_PRODUCT_VISION.md`)**:
  - Established the foundational philosophy: *"Configure, Don't Customize"*.
  - Defined the dual-layer system: Dynamic Visual Builders + High-Performance Runtime.
  - Established domain-agnostic core platform primitives (`Party`, `Node`, `Entity`, `Record`, `WorkflowInstance`, `Posting`).
  - Defined Education / School Management as the first flagship domain module.
  - Specified three distinct client experiences: Staff/Admin ERP, Student Portal, and Parent Portal.

* **Non-Negotiable Core Engineering Principles (`01_CORE_PRINCIPLES.md`)**:
  - Defined 10 Core Engineering Commandments.
  - Mandated multi-tenant zero-leakage guarantees and defense-in-depth security.
  - Mandated immutable versioning for mutable metadata and double-entry balance invariants.

* **Arbitrary-Depth Organization Hierarchy Engine (`02_ORGANIZATION_MODEL.md`)**:
  - Prohibited hardcoded hierarchy structures.
  - Specified configurable `hierarchy_node_types` and `hierarchy_nodes` using PostgreSQL `ltree` indexing.
  - Defined $O(\log N)$ subtree search (`<@`) and rollup traversal (`@>`) mechanics.

* **Dynamic Roles, Permissions & ABAC Architecture (`03_ROLES_PERMISSIONS.md`)**:
  - Prohibited hardcoded institutional roles; enabled dynamic role creation per organization.
  - Defined 5-tier permission evaluation pipeline (Module, Entity, Action, Scope, Field).
  - Standardized 12 canonical action codes (`READ`, `CREATE`, `UPDATE`, `DELETE`, `SUBMIT`, `APPROVE`, `REJECT`, `PRINT`, `EXPORT`, `IMPORT`, `CONFIGURE`, `AUDIT_VIEW`).

* **Hierarchical Data Scopes Engine (`04_DATA_SCOPE.md`)**:
  - Defined 6 standard data scope predicates (`GLOBAL_ORGANIZATION`, `HIERARCHY_SUBTREE`, `EXACT_NODE`, `OWN_RECORDS`, `ASSIGNED_RECORDS`, `CUSTOM_SCOPE`).
  - Mandated server-side query predicate injection for Reports, Dashboards, Exports, and Background Jobs.

* **Pluggable Module Architecture (`05_MODULE_ARCHITECTURE.md`)**:
  - Specified declarative module manifest contract (`CampusOSModule`).
  - Defined lifecycle hooks (`onInstall`, `onEnable`, `onDisable`, `onUpgrade`).
  - Enabled per-tenant module activation and dynamic navigation menu generation.

* **Dynamic Workflow Builder & FSM Runtime (`06_WORKFLOW_ENGINE.md`)**:
  - Specified Finite State Machine (FSM) runtime with visual node-and-edge designer.
  - Defined approval gates (Role-based, User-based, Amount/Field thresholds, Parallel gates).
  - Mandated immutable workflow versioning with in-flight instance version binding.

* **Dynamic Dashboard Builder (`07_DASHBOARD_ENGINE.md`)**:
  - Defined three-tier dashboard ownership: System Default -> Role Dashboard -> User Personalized.
  - Specified 12-column responsive grid layout with 7 first-class widget types.
  - Integrated automatic data scope injection and missing widget fallback protection.

* **Database Architecture & Hybrid Storage Model (`08_DATABASE_ARCHITECTURE.md`)**:
  - Selected PostgreSQL 16+ with Drizzle ORM as primary database framework.
  - Defined Three-Tier Storage Strategy: Native Relational (Strategy A), Hybrid Extensible (Strategy B), and Virtual Custom (Strategy C).
  - Specified double-entry accounting schema with transaction balance checks and period locking.
  - Specified Transactional Outbox pattern for reliable domain event streaming.

* **Security Rules & Tenant Isolation (`09_SECURITY_RULES.md`)**:
  - Specified Dual-Layer Defense-in-Depth model: Application RBAC + PostgreSQL RLS.
  - Mandated `TenantTransactionManager` lifecycle for pooled connection safety (`SET LOCAL app.current_tenant_id`).
  - Defined tenant context propagation across Redis, BullMQ job envelopes, WebSockets, and Outbox events.

* **Enterprise UI/UX Design System (`10_UI_UX_RULES.md`)**:
  - Established desktop-first, high-density, professional SaaS design standards.
  - Defined standardized 3-Panel Visual Builder interface (Palette | Canvas | Inspector).
  - Specified enterprise data table standards using TanStack Table v8 with virtual scrolling.

* **AI Agent & Developer Governance Rules (`11_AI_RULES.md`)**:
  - Declared `/docs` as the final, authoritative source of truth.
  - Defined mandatory 12-point Pre-Implementation Checklist.
  - Established strict anti-hardcoding prohibitions and conflict resolution protocols.
