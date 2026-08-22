# 12. Administration Configuration — Information Architecture

---

## Overview

Administration Configuration is the central CampusOS configuration workspace for all setup, master data, and access management.

**UX Principle**: Do NOT display hundreds of links at once. Use a categorized, searchable interface.

**Homepage provides:**
- Global Configuration Search (find any config item without knowing its category)
- Category Cards (14 categories)
- Recently Used items
- Favorites / Pinned items
- User-configurable Quick Actions

---

## Category 1: Organization Setup

| Item | Description |
|---|---|
| Head Office | Manage Head Office nodes (optional tier) |
| Regional Offices | Manage Regional Office nodes (optional tier) |
| School Types | Configure school type master (consumed by School creation) |
| Schools | Manage school nodes (operational level) |
| Branches / Campuses | Manage branch/campus nodes (optional child of School) |
| Organization Hierarchy | Visual hierarchy tree editor |
| Cost Centers | Financial cost center nodes |

**Dependency rule**: School Types must be configured before Schools (forms consume the master).

---

## Category 2: Location & Geography

Shared masters reused across Students, Employees, Schools, Branches, Suppliers, and all other modules.

| Item | Description |
|---|---|
| Countries | Country master |
| States / Provinces | Province master (under Country) |
| Cities | City master (under Province) |
| Areas / Zones | Area master (under City) |
| Postal Codes | Postal code master |

**Dependency rule**: Country → Province → City → Area

**Architecture rule**: Do NOT place geography masters inside Student Setup. These are SHARED masters.

---

## Category 3: Academic Setup

| Item | Description |
|---|---|
| Academic Years | Year/session master |
| Boards | Curriculum/board affiliations |
| Classes | Grade levels |
| Sections | Class sections |
| Groups | Student groupings |
| Subjects | Subject/course master |
| Languages | Instruction language master |
| Class Capacity | Maximum student capacity per class |

**Dependency rule**: Academic Year → Class → Section

---

## Category 4: Student Setup

| Item | Description |
|---|---|
| Student Categories | Classification types (regular, scholarship, etc.) |
| Houses | Student house groupings (for co-curricular) |
| Admission Categories | Admission classification types |
| Blood Groups | Blood group master |
| Religion | Religion master |
| Student Status | Status types (enrolled, withdrawn, graduated, etc.) |
| Withdrawal Reasons | Reason master for student withdrawals |

---

## Category 5: HR & Employee Setup

| Item | Description |
|---|---|
| Departments | Organizational departments |
| Designations | Job designations (under Department) |
| Designation Hierarchy | Reporting structure between designations |
| Job Types | Contract, permanent, part-time, etc. |
| Job Status | Active, on-leave, terminated, etc. |
| Employee Categories | Employee classification types |
| Qualifications | Educational qualification master |
| Marital Status | Marital status master |
| Employment Types | Full-time, part-time, contractual, etc. |

**Dependency rule**: Department → Designation → Employee

---

## Category 6: Fee & Billing Setup

| Item | Description |
|---|---|
| Fee Types | Classification of fee (tuition, transport, exam, etc.) |
| Fee Heads / Names | Specific fee line items |
| Discount Categories | Discount eligibility categories |
| Fine Rules | Late payment fine rules |
| Payment Methods | Cash, cheque, bank transfer, online portal, etc. |
| Banks | Bank master (shared across modules) |
| Bank Branches | Bank branch master |

**Architecture rule**: Banks master is shared and must not be duplicated for different modules.

---

## Category 7: Payroll Setup

| Item | Description |
|---|---|
| Allowances | Allowance types (HRA, medical, fuel, etc.) |
| Deductions | Deduction types (EOBI, income tax, loan, etc.) |
| Allowance / Deduction Groups | Groupings for payroll processing |
| Loan Types | Loan category types |
| Leave Types | Annual, sick, casual, etc. |
| Appraisal Scores | Performance appraisal scoring scales |
| Rating Scales | Rating scale definitions |

---

## Category 8: Library Setup

| Item | Description |
|---|---|
| Libraries | Library locations |
| Book Types | Physical, digital, periodical, etc. |
| Categories | Subject/genre categorization |
| Authors | Author master |
| Publishers | Publisher master |
| Subjects | Library subject classification |

---

## Category 9: Transport Setup

| Item | Description |
|---|---|
| Routes | Transport route master |
| Stops | Route stops |
| Vehicles | Vehicle master |
| Vehicle Types | Bus, van, minibus, etc. |
| Transporters | Transport contractor master |
| Drivers | Driver master |

---

## Category 10: Exam & Assessment

| Item | Description |
|---|---|
| Exam Types | Annual, quarterly, unit test, etc. |
| Grades | Grade definitions |
| Grading Schemes | Grading scale definitions |
| Remarks | Standard remark text master |
| Assessment Types | Formative, summative, practical, etc. |

---

## Category 11: Attendance & Devices

| Item | Description |
|---|---|
| Attendance Devices | Biometric / RFID devices |
| Device Types | Device category/type master |
| Device Mapping | Device-to-node/door mapping |
| Attendance Rules | Working hours, grace period, absence rules |

---

## Category 12: Communication Setup

| Item | Description |
|---|---|
| Notice Categories | Notice board categories |
| Notice Types | Announcement, circular, event, etc. |
| Templates | SMS/email/notification templates |
| Communication Channels | SMS gateway, email provider, push notification |

---

## Category 13: General / Shared Masters

| Item | Description |
|---|---|
| Document Types | ID card, passport, birth certificate, etc. |
| Relationship Types | Parent, guardian, sibling, etc. |
| ID Types | CNIC, passport, student ID, etc. |
| Attachment Categories | Academic, HR, financial, medical, etc. |
| Status / Reason Masters | Shared status and reason codes |

---

## Category 14: Users & Access

| Item | Description |
|---|---|
| Administrative Users | Organization user accounts and profiles |
| Roles | Dynamic role definitions |
| Permissions | Role permission configuration |
| Assignments | User-to-node-to-role assignments |
| Data Scopes | Scope configuration per role |

---

## Navigation Architecture Note

These 14 categories map to sub-navigation items within **Administration Configuration**. The top-level nav item routes to the Admin Config homepage. Individual category items route to their management pages.

Each management page follows the Standard Management Page Pattern defined in `/docs/10_UI_UX_RULES.md`.

Configuration ordering must respect the dependency rules listed above — forms must consume authoritative master data rather than hardcoded dropdown values.
