# 10. Enterprise UI/UX Design System & Standards

---

## 1. Core Visual Identity: Enterprise SaaS Quality

CampusOS must feel like a modern, world-class enterprise SaaS platform (comparable to modern platforms like Linear, Stripe Dashboard, or Salesforce Lightning).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UI/UX DESIGN TENETS                               │
│                                                                             │
│  • Clean, modern, high-density desktop-first interface                      │
│  • Subtle neutral color palettes with crisp contrast and typography         │
│  • Consistent 8-point spatial grid system                                   │
│  • Zero decorative clutter or childish aesthetics                           │
│  • Universal keyboard navigability (Cmd+K Command Palette, Shortcuts)       │
│  • 100% responsive: Fluid layout from 4K monitors to mobile devices         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.1 DATABASE PRESERVATION — LOCKED ENGINEERING RULE (PERMANENT)

> [!CAUTION]
> **PERMANENT SYSTEM-WIDE DATABASE INVARIANT (Applies to All Current and Future Modules)**:
> - **Existing Database Records Must NEVER be Reset**: Existing database data must NEVER be reset, reseeded, deleted, replaced, truncated, recreated, overwritten, or modified merely to implement or test a new page or feature.
> - **Approved Business Records Preserved**: Existing approved business records (Head Offices, Regions, Schools, Branches, Users, Roles, Memberships, Hierarchy Nodes) must remain exactly preserved with their existing UUIDs, relationships, and historical data.
> - **Non-Destructive Schema Evolution**: Schema changes must use only safe, additive, backward-compatible migrations (`ADD COLUMN IF NOT EXISTS`, nullable/defaulted columns). No destructive column/table drops or type alter cascades.
> - **No Auto-Reset on Restart**: Automatic seeding, resetting, or reinitializing on app/API restart is strictly prohibited. The system must reconnect to the existing persistent database.
> - **Isolated Disposable Test Records**: All testing must use isolated, disposable test records that do not mutate existing approved business data.
> - **Reporting Policy**: Any discovery of orphan/inconsistent data must be reported first rather than automatically altered or wiped.
> - **Stop and Report**: Before any potentially destructive DB operation, STOP and report instead of executing it.

---

## 2. Standard Application Shell Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP NAVIGATION BAR                                                                      │
│ [CampusOS Logo] [Tenant Switcher ▼] [Global Search / Cmd+K] [Notifications] [User Menu] │
├───────────────────────────┬─────────────────────────────────────────────────────────────┤
│ COLLAPSIBLE SIDEBAR       │ MAIN CONTENT AREA                                           │
│                           │                                                             │
│ 📁 Academics              │ Breadcrumbs: Home / Academics / Courses                     │
│    • Programs             │ ┌─────────────────────────────────────────────────────────┐ │
│    • Course Catalog       │ │ PAGE HEADER: Course Catalog                             │ │
│    • Timetable            │ │ [Search...] [Filters ▼] [Export ▼] [ + Add Course Button]│ │
│                           │ └─────────────────────────────────────────────────────────┘ │
│ 💳 Fee & Accounts         │                                                             │
│    • Fee Structures       │ ┌─────────────────────────────────────────────────────────┐ │
│    • Invoices             │ │ ENTERPRISE TANSTACK DATA TABLE (Virtual Scrolling)      │ │
│    • Ledger               │ │ [Code]   [Course Title]    [Credits]  [Dept]  [Actions] │ │
│                           │ │ CS-101   Intro to CS       3.0        CS      [...]     │ │
│ ⚙️ Platform Builders       │ │ CS-201   Data Structures   4.0        CS      [...]     │ │
│    • Form Builder         │ └─────────────────────────────────────────────────────────┘ │
│    • Workflow Builder     │                                                             │
└───────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 3. The 3-Panel Visual Builder Standard

All 8 platform builders (Form, Workflow, Dashboard, Entity, Report, Role/Permission, Organization Hierarchy, Menu) share a unified, consistent 3-panel layout:

```
┌────────────────────────┬───────────────────────────────────────┬────────────────────────┐
│ LEFT PANEL: PALETTE    │ CENTER PANEL: CANVAS                  │ RIGHT PANEL: INSPECTOR │
│ (Component Library)    │ (Visual Drag & Drop Workspace)        │ (Properties & Logic)   │
│                        │                                       │                        │
│ • Draggable Items      │ • Interactive visual preview          │ • Field / Node Label   │
│ • Search Filter        │ • Reordering & nestable containers    │ • Validation Rules     │
│ • Category Accordions  │ • Multi-column / Tab layout zones     │ • Conditional Logic    │
│ • Pre-built Snippets   │ • Zoom / Pan controls (for Workflows) │ • Permission Bindings  │
└────────────────────────┴───────────────────────────────────────┴────────────────────────┘
```

---

## 4. Enterprise Component Specifications

### 1. Data Tables (TanStack Table v8)
* **Virtualization**: Tables render smoothly with 100,000+ records via `@tanstack/react-virtual`.
* **Sticky Elements**: Header row and primary identifier column remain pinned on scroll.
* **Column Customization**: Users can toggle column visibility, reorder columns, and resize column widths.
* **Multi-Sort & Multi-Filter**: Filter by date ranges, number thresholds, and multi-select dropdowns.

### 2. Form Inputs & Dynamic Renderers
* High-density inputs with floating or top-aligned labels.
* Real-time inline field validation errors rendered below inputs.
* Clean visual grouping via Cards, Sections, Accordions, and Tabs.

### 3. State Management Standards
* **Loading States**: Skeleton loaders mimicking the target layout (never blank screens or generic full-page spinners).
* **Empty States**: Helpful illustrations, descriptive copy, and a primary call-to-action button.
* **Error States**: Non-blocking toast notifications for transient errors; inline alert banners with retry buttons for page-level failures.

---

## 5. Design System Tokens (Tailwind CSS)

* **Typography**: Clean sans-serif hierarchy (Inter / Geist Sans / System UI fonts).
* **Color Palette**:
  - `Neutral / Slate`: UI backgrounds, borders, cards, and secondary text.
  - `Primary / Indigo-Blue`: Primary buttons, active tabs, focus rings.
  - `Success / Emerald`: Paid badges, approved workflows, active status indicators.
  - `Warning / Amber`: Pending approvals, nearing deadlines, draft statuses.
  - `Danger / Rose`: Overdue fees, rejected workflows, destructive actions.

---

## 6. Permission-Aware Navigation

Navigation visibility must be dynamically derived from the same permission model used by the backend:

- Users must only see modules and pages they are permitted to access.
- If a user has no permission for Finance → the Finance section must be hidden from nav AND rejected at the API.
- Never rely only on hidden navigation. Backend must reject direct URL/API access regardless.
- Navigation changes must not require frontend code deployment — they are driven by permission configuration.

---

## 7. Authorized Multi-Select Campus/Branch Filter (Mandatory Standard)

Every relevant operational/data page must provide an authorized multi-select Campus/Branch/Node filter.

**Required capabilities:**
- Search nodes by name/code
- Select one node
- Select multiple nodes
- Select All Authorized (default behavior)
- Clear selection

**Label may be context-appropriate:** Campus / Branch / School / Location / Organizational Unit

**The filter must NEVER offer nodes the user is not authorized for.** Node list is populated from the user's effective authorized node scope, resolved server-side.

---

## 8. Campus/Branch Column Standard for Data Tables

Every relevant ERP list/data table displaying node-scoped business records **MUST** include a visible Campus/Branch/Organizational Unit column:

```
Example: Student List
┌──────────────┬──────────────────────┬────────┬─────────┬─────────────────────┬──────────┬──────────┐
│ Student ID   │ Student Name         │ Class  │ Section │ Campus / Branch     │ Status   │ Actions  │
├──────────────┼──────────────────────┼────────┼─────────┼─────────────────────┼──────────┼──────────┤
│ STU-2026-001 │ Ali Ahmed            │ Class 8│ 8-A     │ Main Campus         │ Active   │ [...]    │
│ STU-2026-002 │ Sara Khan            │ Class 9│ 9-B     │ North Campus        │ Active   │ [...]    │
└──────────────┴──────────────────────┴────────┴─────────┴─────────────────────┴──────────┴──────────┘

Example: Financial Vouchers
┌────────────┬───────────┬──────────────────┬──────────┬─────────────────────┬──────────┬──────────┐
│ Voucher No │ Date      │ Account          │ Amount   │ Campus / Branch     │ Status   │ Actions  │
├────────────┼───────────┼──────────────────┼──────────┼─────────────────────┼──────────┼──────────┤
│ JV-0001    │ 2026-08-01│ Tuition Revenue  │ 25,000   │ Main Campus         │ Posted   │ [...]    │
└────────────┴───────────┴──────────────────┴──────────┴─────────────────────┴──────────┴──────────┘
```

**Single-location organization**: When there is no separate Branch, the School is the effective operational node. Display the School name in the Campus/Location column. Do NOT create a fake Branch record.

---

## 9. Global Working Scope in the Navigation

The top navigation bar must include a persistent **Global Working Scope** selector:

- Shows currently selected campus/branch/node context
- Persists across page navigation between all modules
- Can be a single node or multiple authorized nodes
- Defaults to "All Authorized" on first login or after scope is cleared
- May NOT offer unauthorized nodes
- Individual pages may add their own scope filter (narrowing only)

---

## 10. Standard Management Page Pattern (Schools Reference Standard)

> **Mandatory Consistency Rule**: The approved Schools management page is the baseline interaction pattern for comparable Administration Configuration management pages. Status controls, row actions, search/filter layout, table styling, dialogs and management interactions must remain consistent unless a documented domain requirement justifies a difference.

Every configuration/management page must follow this consistent pattern:

```
1. PAGE HEADER
   ├── Breadcrumb: Section / Page
   ├── Title (H1)
   ├── Short description
   └── Primary Add / New action button

2. KPI / SUMMARY CARDS (where relevant)
   ├── Total count
   ├── Active count
   ├── Inactive count
   └── Related child entity count

3. SEARCH & FILTER BAR
   ├── Text search
   ├── Campus / Branch / Node multi-select filter (where relevant)
   ├── Status filter
   └── Contextual type / category / location filters

4. RECORDS DATA TABLE
   ├── Code / ID column
   ├── Name / Title column
   ├── Parent / Hierarchy column (where relevant)
   ├── Contact / Description column (where relevant)
   ├── Campus / Branch column (for node-scoped records)
   ├── Status column
   └── Actions column

5. ROW ACTIONS
   ├── View (detail panel or modal)
   ├── Edit
   ├── Activate / Deactivate
   └── Other authorized actions (Manage Users, Manage Child Units, etc.)
```

---

## 11. Administration Configuration Information Architecture

Administration Configuration is the central CampusOS configuration workspace. Use a categorized, searchable interface — NOT a single giant page with all links.

**Standard structure:**

```
Administration Configuration
→ Global Search
→ Recently Used
→ Favorites / Quick Actions
→ Category Cards
   → Category: Organization Setup
   → Category: Location & Geography
   → Category: Academic Setup
   → Category: Student Setup
   → Category: HR & Employee Setup
   → Category: Fee & Billing Setup
   → Category: Payroll Setup
   → Category: Library Setup
   → Category: Transport Setup
   → Category: Exam & Assessment
   → Category: Attendance & Devices
   → Category: Communication Setup
   → Category: General / Shared Masters
   → Category: Users & Access
```

---

## 12. User-Facing Terminology Translation Rule (No Technical Hierarchy Leakage)

> **Mandatory UX Invariant**: Never expose technical hierarchy terminology to school administrators or end users. Technical hierarchy constructs (`hierarchy_nodes`, `node_type_id`, `ltree`, `path`) remain authoritative internally in the database, API, and authorization layers, but all frontend interfaces MUST translate them into clean business and educational domain terminology.

| Internal / Technical Architecture | User-Facing Product Terminology |
|---|---|
| `Hierarchy Node` | **School / Branch / Regional Office / Head Office** |
| `Parent Node` / `Parent Hierarchy Context` | **Head Office / Regional Office / School** |
| `Node Assignment` | **Assigned Campuses / Assigned Locations** |
| `Node Scope` | **Campus / Branch Access** |
| `Node Filter` | **Campus / Branch Filter** or **Office / Region Filter** |
| `Root Node` / `Org Node` | **Organization / Network** |
| `Branch Parent` | **School** (e.g. `[ Select School ]`, not `[ Select Parent Node ]`) |


See full category contents in /docs/12_ADMIN_CONFIG_IA.md.

---

## 12. User-Configurable Quick Actions

Quick Actions must NOT be permanently hardcoded. Authorized users may:

- Add shortcuts to Quick Actions
- Remove shortcuts
- Reorder shortcuts
- Pin frequently used actions

Quick Action hierarchy:
```
System Defaults → Organization Defaults → User Personal Quick Actions
```

A Quick Action must NEVER allow a user to bypass the underlying page, action, or node permission.

---

## 13. Single-Location School UX

For customers with only a School (no Head Office, no Region, no Branch):

- Do NOT burden the user with meaningless hierarchy complexity
- The School is the effective operational node
- Internal data remains node-associated
- UI labels contextually: "Campus", "School", or "Location"
- The same core engine works if the school later adds branches
- No fake Branch record is created

---

## 14. Form Dependency & Master Data Consumption

Administration Configuration forms must consume master data from their authoritative configuration tables. Do NOT hardcode dropdown values when a master exists:

| Dropdown in Form | Consumes From |
|---|---|
| School Type | School Types master table |
| Province/State | Provinces master (under Country) |
| City | Cities master (under Province) |
| Fee Type | Fee Types master |
| Department | Departments master |
| Designation | Designations master (under Department) |
| Academic Year | Academic Years master |
| Exam Type | Exam Types master |

---

## 15. Safe Delete & Record Lifecycle UI Standards

* **No Generic Delete Actions**: Management and CRUD data tables must NEVER display a generic destructive `Delete` button by default.
* **Approved Row Actions**: Standard action dropdowns provide: `View`, `Edit`, `Activate / Deactivate` (with confirmation modal for state transitions).
* **Clear State Indicators**: Inactive records are clearly distinguished with neutral/gray badges and reduced visual emphasis, never discarded from view unless explicitly filtered out.
* **Explicit Lifecycle Terminology**: Use domain-appropriate lifecycle terms: `Deactivate`, `Archive`, `Cancel`, `Reverse`, `Revoke`.

---

## 16. Development Server Static Asset Verification Invariant

* **Zero Unstyled HTML Standard**: The development UI must never be left in a broken or raw unstyled HTML state.
* **No Dev/Build Cache Collision**: Never run `next build` while `next dev` is actively running on the same directory.
* **Mandatory Static Asset Verification (`pnpm web:dev:check`)**: Verify that both the HTML document and all referenced CSS stylesheet bundles and JavaScript chunks return HTTP 200 before claiming the UI is ready for review.

---

## 17. Locked Standard: CampusOS Design System First Policy

* **Canonical UI Source of Truth**: The CampusOS Design System (`apps/web/design-system` and `/admin-config/ui-system`) is the locked canonical UI standard.
* **No Local CSS Duplication**: Every CampusOS page, module, form, table, modal, button, card, status, navigation element, input, selector, feedback state, relationship UI, and hierarchy UI must use the canonical Design System components and tokens.
* **Architecture Flow**:
  $$\text{Design Tokens} \longrightarrow \text{Canonical Shared Components} \longrightarrow \text{Controlled Variants} \longrightarrow \text{Page Config} \longrightarrow \text{Business Pages}$$
* **Canonical Primitives**:
  - Summary / KPI Cards: `StatCard`
  - Status Indicators: `StatusBadge`
  - Row Actions: `RowActions`, `ViewAction`, `EditAction`, `DeleteAction`, `StatusAction`, `MoreActionsMenu`
  - Relationship Pills: `ConnectedCountPill`, `ConnectedUnitsModal`
  - Multiselect Controls: `MultiSelect`, `HierarchyMultiSelect`

### 18. Stat Card Default Contract
* **Canonical Component**: `StatCard` (`apps/web/design-system/components/cards/StatCard.tsx`)
* **Default Visual Structure**:
  - **Top Row**: Left: Label / Title (`text-xs font-semibold text-slate-500 uppercase tracking-wider`). Right: Professional Icon container with rounded tint (`p-2 rounded-xl bg-... border border-...`).
  - **Bottom Row**: Left: Large metric value (`text-2xl font-black text-slate-900 dark:text-white tracking-tight`). Right: Optional trend / context (`text-xs font-semibold text-slate-400`).
* **Variants Supported**: `default`, `primary`, `success`, `warning`, `info`.
* **Icon Standard**: Professional Lucide icons with dimensions (e.g. `<Building2 className="w-5 h-5" />`, `<School className="w-5 h-5" />`, `<GraduationCap className="w-5 h-5" />`, `<Globe className="w-5 h-5" />`, `<Calendar className="w-5 h-5" />`) instead of raw emoji characters.
* **Context Integrity**: If no real context or subtitle exists, do not invent one and do not show placeholder text.

### 19. Row Actions Default Contract
* **Canonical Component**: `RowActions` with composable sub-actions (`apps/web/design-system/components/actions/RowActions.tsx`)
* **Action Sub-components & Standards**:
  - `ViewAction`: Blue (`#2563eb` / `Eye` icon)
  - `EditAction`: Emerald (`#059669` / `Edit2` icon)
  - `DeleteAction`: Rose (`#e11d48` / `Trash2` icon)
  - `StatusAction`: Status toggle action button (`Activate` / `Suspend`)
  - `MoreActionsMenu`: Neutral (`#475569` / `MoreHorizontal` icon)
* **Canonical Action Order**: `View -> Edit -> Status/Contextual Action -> Delete -> More Actions`
* **Business Capability Invariant**: Only render actions supported by the specific page and authorized by the current user's permissions. Do not force unsupported actions.



