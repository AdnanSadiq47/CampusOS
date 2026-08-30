# CampusOS Global Data Validation, Normalization & Display Standardization Policy

**Permanent Engineering Standard for Current & Future ERP Modules**  
*Contract Version: 2.0.0*  
*Effective Date: August 29, 2026*

---

## 1. Executive Summary & Architectural Separation
CampusOS enforces a permanent, tripartite architectural separation:
```
Flexible User Input / Import (CSV/Excel)
       ↓
Canonical Validation (Country-Aware)
       ↓
Canonical Normalization (Digits-Only Stable Identity)
       ↓
Safe Persistence (Canonical Storage)
       ↓
Organization / School Display Preferences
       ↓
Shared Formatter (Consistent Display Everywhere)
```

### Core Principles
1. **Validation**: Centrally controlled by CampusOS. Organizations/Schools **cannot** weaken validation.
2. **Canonical Identity**: Digits-only, formatting-independent representation used for database storage, duplicate matching, search, and login resolution.
3. **Display Format**: Configurable per Organization / School. Changing display format changes visual presentation only—it **never** rewrites database identities.

---

## 2. Semantic Data Types & Standardization Specifications

### A. MOBILE / CELL PHONE Contract (Pakistan Standard + Country-Aware)
- **Input Acceptance**: Accepts equivalent valid presentation inputs:
  - `03451123603`
  - `0345-1123603`
  - `0345 1123603`
  - `+923451123603`
  - `+92 345 1123603`
  - `00923451123603`
- **Structure (Pakistan)**: Domestic trunk `03` + 2-digit network code + 7 subscriber digits = 11 digits total.
- **Canonical Normalized Identity**: `923XXXXXXXXX` (12 digits, digits-only, e.g. `923451123603`).
- **Rejected Examples**: `0345abc603`, `0345112360` (too short), `034511236033` (too long), `01234567890` (invalid network code), `04235871234` (landline, not mobile).
- **Configurable Display Options**:
  - `03XX-XXXXXXX` (e.g. `0345-1123603` — CampusOS Default for Pakistan)
  - `03XXXXXXXXX` (e.g. `03451123603` — Continuous domestic)
  - `+92 XXX XXXXXXX` (e.g. `+92 345 1123603` — International)

---

### B. OFFICIAL PHONE / LANDLINE Contract (Pakistan Standard + Country-Aware)
- **Decoupled from Mobile**: The 11-digit mobile rule is **never** applied to landlines.
- **Structure (Pakistan)**: Area codes (2 to 4 digits e.g. `021` Karachi, `042` Lahore, `051` ISB, `022`, `091`, `0992`, etc.) + 5 to 8 subscriber digits. Domestic length: 9 to 11 digits.
- **Input Acceptance**: `021-34567890`, `(021) 34567890`, `021 34567890`, `+92-21-34567890`, `+92 21 34567890`.
- **Canonical Normalized Identity**: `92` + Area Code (without leading 0) + Subscriber digits (e.g. `922134567890`, `92519261234`).
- **Rejected Examples**: Letters, words, malformed lengths (< 8 or > 13 digits).
- **Configurable Display Options**:
  - `0XX-XXXXXXX` / `DOMESTIC_HYPHEN` (e.g. `021-34567890` — CampusOS Default)
  - `0XX XXXXXXX` / `DOMESTIC_SPACE` (e.g. `021 34567890`)
  - `+92 XX XXXXXXXX` / `INTERNATIONAL` (e.g. `+92 21 34567890`)

---

### C. CNIC (National Identity Card) Contract
- **Input Acceptance**: Both dashed (`42501-3064512-8`) and plain (`4250130645128`) inputs resolve to the **SAME** CNIC identity.
- **Canonical Normalized Identity**: Exactly 13 numeric digits (`4250130645128`).
- **Rejected Examples**: Letters (`42501-ABC4512-8`), wrong digit count (< 13 or > 13 digits).
- **Configurable Display Options**:
  - `XXXXX-XXXXXXX-X` / `DASHED` (e.g. `42501-3064512-8` — CampusOS Default)
  - `XXXXXXXXXXXXX` / `PLAIN` (e.g. `4250130645128`)

---

### D. EMAIL & WEBSITE / URL Contracts
- **EMAIL**: RFC-5322 standard. Normalized to trimmed lowercase (`principal@school.edu.pk`).
- **URL**: Valid domain / web address. Normalized to prepend `https://` if protocol omitted.

---

## 3. Display Preference Inheritance Architecture
Presentation formatting resolves through hierarchical inheritance:
```
School Override (if defined)
       ↓
Organization Default (if defined)
       ↓
CampusOS Country Default (03XX-XXXXXXX, 0XX-XXXXXXX, XXXXX-XXXXXXX-X)
```
- A change in display format preference affects rendering in UI, tables, view cards, and print reports across the school context.
- **Zero Identity Mutation**: Format switching never rewrites database records.

---

## 4. Import & Duplicate Detection Standard
- **File Imports (CSV/Excel)**:
  - Files containing mixed formats (e.g. `42501-3064512-8` and `4250130645128`) are normalized to 13-digit canonical values during ingestion.
  - Duplicate detection is strictly executed on the canonical identity.
  - Dashed and plain entries match the same existing entity.

---

## 5. Parent Login & IAM Normalization Standard
- **CNIC as Login Identifier**:
  - Parents can log in using either `42501-3064512-8` or `4250130645128`.
  - The login resolver automatically detects CNIC candidates, strips visual formatting, and authenticates against the canonical 13-digit identity.
  - Password security remains strictly separate (passwords are hashed with Argon2id and never stored as plaintext).

---

## 6. Search Query Normalization
- Global search and table filters normalize user input where appropriate.
- Searching `42501-3064512-8` finds records stored with canonical identity `4250130645128`.

---

## 7. Dynamic Form Builder & Future ERP-Wide Inheritance
- All future modules (Admissions, Students, Parents, Guardians, HR, Employees, Finance, Transport, Hostel, CRM, Dynamic Forms) inherit:
  1. Canonical validation
  2. Canonical normalization
  3. Country-aware rules
  4. Display formatting preferences
- Schools configure labels, visibility, and requiredness, but cannot alter the validation contract.

---

## 8. Database Safety & Legacy Record Preservation
- Existing approved records are **never automatically mutated, backfilled, or deleted**.
- Database schemas store canonical identities.
- READ-ONLY audits ensure complete transparency of baseline and current data states.
- Compatible with [`CAMPUSOS_DATABASE_SAFETY.md`](./CAMPUSOS_DATABASE_SAFETY.md) and [`CAMPUSOS_PAGE_FREEZE_POLICY.md`](./CAMPUSOS_PAGE_FREEZE_POLICY.md).
