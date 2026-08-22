# 07. Dynamic Dashboard Builder & Layout Engine

---

## 1. Overview & Core Philosophy

Dashboards in CampusOS provide real-time operational visibility tailored to an individual's role, hierarchy scope, and personal workflow requirements.

The **Dynamic Dashboard Builder** is a first-class visual tool allowing administrators and authorized users to configure drag-and-drop widget layouts without writing frontend code.

---

## 2. Three-Tier Dashboard Ownership Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SYSTEM DEFAULT DASHBOARDS (Platform Base Templates)                      │
│    Base templates bundled with modules (e.g. Default Academic SIS Overview).│
│─────────────────────────────────────────────────────────────────────────────┤
│ 2. ORGANIZATION / ROLE DASHBOARDS (Configured by Organization Admin)       │
│    Assigned to specific institutional roles (e.g. "Dean's Executive Portal")│
│─────────────────────────────────────────────────────────────────────────────┤
│ 3. USER PERSONALIZED DASHBOARDS (Configured by Individual User)             │
│    Personal widgets, shortcuts, and layout adjustments for daily workflows. │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **Precedence Rule**: If a user has a personalized dashboard layout, it takes precedence. Otherwise, the system renders the assigned Role Dashboard. If neither exists, it falls back to the System Default.

---

## 3. Supported First-Class Widget Types

The Dashboard Builder includes a rich, extensible **Widget Registry**:

| Widget Category | Widget Code | Features & Data Binding |
|---|---|---|
| **KPI Metric Card** | `WIDGET_KPI_CARD` | Single aggregated metric with trend indicator (e.g. *Total Active Enrollments: 4,520 [+12% vs last term]*). |
| **Analytical Charts** | `WIDGET_CHART` | Line, Bar, Stacked Area, Pie, Donut, and Radar charts rendered via Recharts/Chart.js. |
| **Data Grid List** | `WIDGET_DATA_GRID` | Live, compact table displaying recent records, fee defaulters, or student alerts with quick-action buttons. |
| **Pending Approvals** | `WIDGET_APPROVALS` | Unified inbox displaying pending workflow approval items awaiting the current user's action. |
| **Activity Feed** | `WIDGET_ACTIVITY` | Real-time stream of audit events and system actions occurring within the user's data scope. |
| **Quick Action Launcher**| `WIDGET_SHORTCUTS` | User-configurable action shortcuts triggering dynamic form modals (*"Add School"*, *"Create Fee Voucher"*). |
| **Report Snapshot** | `WIDGET_SAVED_REPORT`| Live view of an existing Visual Report Builder query embedded into the dashboard. |

---

## 4. Hierarchy Scope & Aggregation Invariants

1. **Automatic Node Scope Injection**:
   * Every dashboard widget query, KPI calculation, chart aggregation, and grid list is strictly filtered by the user's **effective authorized node scope** (intersected with any active Global Working Scope filter).
   * Example: A user authorized for Branch A + Branch B will see aggregated metrics for Branch A + Branch B only. Under no circumstances may Branch C data be aggregated into any dashboard total, metric card, or chart.
2. **Permission Masking**: If a user lacks permission to view financial entities, financial KPI cards and widgets are completely hidden from their dashboard rendering.
3. **No Unrestricted Organization Aggregation**: Dashboards never default to organization-wide totals unless the user explicitly possesses `ORGANIZATION_WIDE` data scope for that entity.
4. **Missing Source Graceful Degradation**: If an underlying custom entity or report is retired, the widget displays a clean placeholder (*"Widget data source unavailable"*) rather than causing a JavaScript runtime error.

---

## 5. Layout Architecture (12-Column Responsive Grid)

```json
{
  "version": 1,
  "grid_columns": 12,
  "layouts": {
    "lg": [
      { "i": "kpi_total_students", "x": 0, "y": 0, "w": 3, "h": 2 },
      { "i": "kpi_fees_collected", "x": 3, "y": 0, "w": 3, "h": 2 },
      { "i": "kpi_pending_approvals", "x": 6, "y": 0, "w": 3, "h": 2 },
      { "i": "kpi_attendance_rate", "x": 9, "y": 0, "w": 3, "h": 2 },
      { "i": "chart_enrollment_trend", "x": 0, "y": 2, "w": 8, "h": 6 },
      { "i": "list_my_pending_tasks", "x": 8, "y": 2, "w": 4, "h": 6 }
    ]
  },
  "widgets": [
    {
      "id": "kpi_total_students",
      "type": "WIDGET_KPI_CARD",
      "title": "Total Enrolled Students",
      "data_source": {
        "entity": "student",
        "aggregation": "COUNT",
        "filter": { "field": "status", "operator": "EQUALS", "value": "ACTIVE" }
      }
    }
  ]
}
```

---

## 6. Database Schema Specification

```sql
CREATE TABLE dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,              -- e.g., "DEAN_DASHBOARD"
    name VARCHAR(128) NOT NULL,
    ownership_type VARCHAR(32) NOT NULL,    -- 'SYSTEM_DEFAULT', 'ROLE_ASSIGNED', 'USER_PERSONAL'
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    layout_config JSONB NOT NULL,           -- Grid layout coordinates (12 columns)
    widgets_config JSONB NOT NULL,          -- Widget definitions & query bindings
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_dashboard_lookup ON dashboard_layouts (organization_id, role_id, user_id);
```
