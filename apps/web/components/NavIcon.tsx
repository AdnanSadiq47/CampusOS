'use client';

import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  CreditCard,
  Users,
  Banknote,
  Clock,
  ClipboardCheck,
  Library,
  MessageSquare,
  Boxes,
  FileText,
  Layers,
  GitBranch,
  Building2,
  MapPin,
  School,
  Shield,
  ShieldCheck,
  Calendar,
  Globe,
  SlidersHorizontal,
  Workflow,
  Sparkles,
  TrendingUp,
  RefreshCw,
  LogOut,
  UserCheck,
  HelpCircle,
  FileEdit,
  DollarSign,
  FolderTree,
  Languages,
  Award,
  ListTodo,
  CheckCircle2,
  LucideProps,
} from 'lucide-react';

export type NavIconName =
  | 'dashboard'
  | 'student'
  | 'academic'
  | 'billing'
  | 'hr'
  | 'payroll'
  | 'timetable'
  | 'quiz'
  | 'library'
  | 'comm'
  | 'inventory'
  | 'accounts'
  | 'more'
  | 'form_builder'
  | 'form_templates'
  | 'field_library'
  | 'admission_process'
  | 'head_offices'
  | 'regions'
  | 'schools'
  | 'branches'
  | 'school_types'
  | 'countries'
  | 'states'
  | 'cities'
  | 'areas'
  | 'academic_years'
  | 'boards'
  | 'academic_levels'
  | 'classes'
  | 'sections'
  | 'subjects'
  | 'languages'
  | 'preadmissions'
  | 'verification'
  | 'tests'
  | 'interviews'
  | 'decisions'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'promotion'
  | 'transfer'
  | 'withdrawal'
  | 'rejoining'
  | 'graduates'
  | 'attendance'
  | 'reports'
  | 'edit';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  dashboard: LayoutDashboard,
  student: GraduationCap,
  academic: BookOpen,
  billing: CreditCard,
  hr: Users,
  payroll: Banknote,
  timetable: Clock,
  quiz: ClipboardCheck,
  library: Library,
  comm: MessageSquare,
  inventory: Boxes,
  accounts: DollarSign,
  more: SlidersHorizontal,
  form_builder: FileText,
  form_templates: Sparkles,
  field_library: Layers,
  admission_process: Workflow,
  head_offices: Building2,
  regions: MapPin,
  schools: School,
  branches: GitBranch,
  school_types: FolderTree,
  countries: Globe,
  states: MapPin,
  cities: Building2,
  areas: MapPin,
  academic_years: Calendar,
  boards: Award,
  academic_levels: TrendingUp,
  classes: GraduationCap,
  sections: Users,
  subjects: BookOpen,
  languages: Languages,
  preadmissions: FileText,
  verification: ShieldCheck,
  tests: ListTodo,
  interviews: MessageSquare,
  decisions: CheckCircle2,
  users: Users,
  roles: Shield,
  permissions: Shield,
  promotion: TrendingUp,
  transfer: RefreshCw,
  withdrawal: LogOut,
  rejoining: UserCheck,
  graduates: Award,
  attendance: Calendar,
  reports: FileText,
  edit: FileEdit,
};

// Semantic Color Classes for Navigation Icons
export const NAV_ICON_COLORS: Record<string, { active: string; default: string; muted: string }> = {
  // Main Modules
  dashboard: { active: 'text-blue-600 dark:text-blue-400', default: 'text-blue-600 dark:text-blue-400', muted: 'text-blue-500/80' },
  student: { active: 'text-blue-600 dark:text-blue-400', default: 'text-blue-600 dark:text-blue-400', muted: 'text-blue-500/80' },
  billing: { active: 'text-emerald-600 dark:text-emerald-400', default: 'text-emerald-600 dark:text-emerald-400', muted: 'text-emerald-500/80' },
  hr: { active: 'text-amber-600 dark:text-amber-400', default: 'text-amber-600 dark:text-amber-400', muted: 'text-amber-500/80' },
  payroll: { active: 'text-purple-600 dark:text-purple-400', default: 'text-purple-600 dark:text-purple-400', muted: 'text-purple-500/80' },
  timetable: { active: 'text-cyan-600 dark:text-cyan-400', default: 'text-cyan-600 dark:text-cyan-400', muted: 'text-cyan-500/80' },
  quiz: { active: 'text-rose-600 dark:text-rose-400', default: 'text-rose-600 dark:text-rose-400', muted: 'text-rose-500/80' },
  library: { active: 'text-teal-600 dark:text-teal-400', default: 'text-teal-600 dark:text-teal-400', muted: 'text-teal-500/80' },
  comm: { active: 'text-sky-600 dark:text-sky-400', default: 'text-sky-600 dark:text-sky-400', muted: 'text-sky-500/80' },
  inventory: { active: 'text-amber-500 dark:text-amber-400', default: 'text-amber-500 dark:text-amber-400', muted: 'text-amber-500/80' },
  accounts: { active: 'text-emerald-600 dark:text-emerald-400', default: 'text-emerald-600 dark:text-emerald-400', muted: 'text-emerald-500/80' },
  more: { active: 'text-slate-600 dark:text-slate-400', default: 'text-slate-500 dark:text-slate-400', muted: 'text-slate-400' },

  // Student Lifecycle Items
  preadmissions: { active: 'text-blue-600 dark:text-blue-400', default: 'text-blue-600 dark:text-blue-400', muted: 'text-blue-500/80' },
  verification: { active: 'text-teal-600 dark:text-teal-400', default: 'text-teal-600 dark:text-teal-400', muted: 'text-teal-500/80' },
  tests: { active: 'text-amber-600 dark:text-amber-400', default: 'text-amber-600 dark:text-amber-400', muted: 'text-amber-500/80' },
  interviews: { active: 'text-purple-600 dark:text-purple-400', default: 'text-purple-600 dark:text-purple-400', muted: 'text-purple-500/80' },
  decisions: { active: 'text-emerald-600 dark:text-emerald-400', default: 'text-emerald-600 dark:text-emerald-400', muted: 'text-emerald-500/80' },
  view_students: { active: 'text-cyan-600 dark:text-cyan-400', default: 'text-cyan-600 dark:text-cyan-400', muted: 'text-cyan-500/80' },
  attendance: { active: 'text-amber-500 dark:text-amber-400', default: 'text-amber-500 dark:text-amber-400', muted: 'text-amber-500/80' },
  promotion: { active: 'text-emerald-600 dark:text-emerald-400', default: 'text-emerald-600 dark:text-emerald-400', muted: 'text-emerald-500/80' },
  transfer: { active: 'text-cyan-600 dark:text-cyan-400', default: 'text-cyan-600 dark:text-cyan-400', muted: 'text-cyan-500/80' },
  withdrawal: { active: 'text-rose-600 dark:text-rose-400', default: 'text-rose-600 dark:text-rose-400', muted: 'text-rose-500/80' },
  graduates: { active: 'text-purple-600 dark:text-purple-400', default: 'text-purple-600 dark:text-purple-400', muted: 'text-purple-500/80' },
  rejoining: { active: 'text-emerald-600 dark:text-emerald-400', default: 'text-emerald-600 dark:text-emerald-400', muted: 'text-emerald-500/80' },
  edit: { active: 'text-amber-600 dark:text-amber-400', default: 'text-amber-600 dark:text-amber-400', muted: 'text-amber-500/80' },
  reports: { active: 'text-indigo-600 dark:text-indigo-400', default: 'text-indigo-600 dark:text-indigo-400', muted: 'text-indigo-500/80' },
};

interface NavIconProps extends LucideProps {
  name?: string;
  variant?: 'default' | 'active' | 'muted';
}

export function NavIcon({ name, variant = 'default', className = 'w-4 h-4', ...props }: NavIconProps) {
  if (!name) return null;
  const key = name.toLowerCase();
  const Component = ICON_MAP[key] || HelpCircle;
  const colorDef = NAV_ICON_COLORS[key];
  const colorClass = colorDef ? colorDef[variant] : '';

  return <Component className={`${className} ${colorClass}`} strokeWidth={1.75} {...props} />;
}
