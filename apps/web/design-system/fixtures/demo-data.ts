/**
 * CAMPUSOS DESIGN SYSTEM — PREVIEW DEMO FIXTURES ONLY
 * CAUTION: These fixtures are strictly isolated for UI component rendering in the Design System catalog.
 * NEVER import or use these fixtures in operational ERP business pages.
 */

export interface DemoEntity {
  id: string;
  code: string;
  name: string;
  type: string;
  parentName: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Draft';
  connectedUnits: number;
  email: string;
  phone: string;
  principal: string;
  website: string;
  whatsapp: string;
}

export const DEMO_ENTITIES: DemoEntity[] = [
  {
    id: 'demo-1',
    code: 'SCH_LHR_01',
    name: 'Beacon Horizon Grammar School',
    type: 'Comprehensive K-12',
    parentName: 'Central Regional Directorate (Lahore)',
    location: 'Lahore, Punjab, Pakistan',
    status: 'Active',
    connectedUnits: 3,
    email: 'info@beaconhorizon.edu.pk',
    phone: '+92 42 35889900',
    principal: 'Dr. Tariq Mehmood',
    website: 'https://beaconhorizon.edu.pk',
    whatsapp: '+923001234567',
  },
  {
    id: 'demo-2',
    code: 'SCH_KHI_02',
    name: 'Metropolitan Model Academy',
    type: 'Senior High School (9-12)',
    parentName: 'South Regional Directorate (Karachi)',
    location: 'Karachi, Sindh, Pakistan',
    status: 'Active',
    connectedUnits: 0,
    email: 'contact@metroacademy.edu.pk',
    phone: '+92 21 34567890',
    principal: 'Mrs. Saima Farooq',
    website: 'https://metroacademy.edu.pk',
    whatsapp: '+923219876543',
  },
  {
    id: 'demo-3',
    code: 'SCH_ISB_03',
    name: 'Capital Crest International College',
    type: 'O/A-Levels Cambridge',
    parentName: 'Directorate Head Office (Islamabad)',
    location: 'Islamabad, ICT, Pakistan',
    status: 'Pending',
    connectedUnits: 1,
    email: 'admissions@capitalcrest.edu.pk',
    phone: '+92 51 2345678',
    principal: 'Prof. Haroon Rashid',
    website: 'https://capitalcrest.edu.pk',
    whatsapp: '+923335554433',
  },
];

export const DEMO_TABS = [
  { label: 'Head Offices', href: '#', icon: '🏢', count: 2, active: true },
  { label: 'Regional Offices', href: '#', icon: '🌐', count: 4 },
  { label: 'Schools', href: '#', icon: '🏫', count: 12 },
  { label: 'Branches / Campuses', href: '#', icon: '📍', count: 28 },
  { label: 'School Types', href: '#', icon: '📋' },
];

export const DEMO_METRICS = [
  { label: 'Total Components', value: '62', icon: '🎨', change: '26 Categories' },
  { label: 'Live Centralized', value: '18', icon: '🟢', change: '100% Production Grade' },
  { label: 'Planned Roadmap', value: '44', icon: '📋', change: 'Evolving ERP Catalog' },
];
