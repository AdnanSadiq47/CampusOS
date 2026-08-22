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
