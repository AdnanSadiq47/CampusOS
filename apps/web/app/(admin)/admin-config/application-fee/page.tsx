'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminConfigPageHeader,
  FORMS_SETUP_NAV,
} from '../../../../components/AdminConfigPageHeader';
import {
  ApplicationFeeRuleDto,
  ApplicationFeeCollectionRule,
} from '@campus-os/types';
import {
  StatusBadge,
  RowActions,
  EditAction,
  DeleteAction,
} from '../../../../design-system';
import {
  CreditCard,
  Search,
  Calendar,
  Sparkles,
} from 'lucide-react';

const MOCK_RULES: ApplicationFeeRuleDto[] = [
  {
    id: 'fee_rule_clifton_2026',
    organizationId: '11111111-1111-1111-1111-111111111111',
    academicYearId: 'ay_2026_2027',
    academicYearName: 'Academic Year 2026–2027',
    schoolId: '11111111-2222-3333-4444-555555555555',
    schoolName: 'Beaconhouse School System',
    campusIds: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc'],
    campusNames: ['Clifton Campus', 'DHA Campus Phase 6'],
    classIds: ['cls-g1', 'cls-g2', 'cls-g3', 'cls-g4', 'cls-g5', 'cls-g6', 'cls-g7', 'cls-g8'],
    classNames: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'],
    feeAmount: 2000,
    currency: 'PKR',
    collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
    instructions: 'Please transfer PKR 2,000 to HBL Account # 0123-456789-01 (Beaconhouse Admissions) and upload the receipt.',
    feeNotRequired: false,
    isActive: true,
    createdAt: new Date('2026-08-20T10:00:00Z'),
    updatedAt: new Date('2026-08-20T10:00:00Z'),
  },
  {
    id: 'fee_rule_early_years_waiver',
    organizationId: '11111111-1111-1111-1111-111111111111',
    academicYearId: 'ay_2026_2027',
    academicYearName: 'Academic Year 2026–2027',
    schoolId: '11111111-2222-3333-4444-555555555555',
    schoolName: 'Beaconhouse School System',
    campusIds: ['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'],
    campusNames: ['Clifton Junior Campus'],
    classIds: ['cls-pg', 'cls-nursery', 'cls-kg'],
    classNames: ['Playgroup', 'Nursery', 'Kindergarten'],
    feeAmount: 0,
    currency: 'PKR',
    collectionRule: 'PAYMENT_ALLOWED_ON_TEST_DAY',
    instructions: 'Application Fee is exempted for Early Years admissions.',
    feeNotRequired: true,
    isActive: true,
    createdAt: new Date('2026-08-20T10:00:00Z'),
    updatedAt: new Date('2026-08-20T10:00:00Z'),
  },
  {
    id: 'fee_rule_general_k12_all',
    organizationId: '11111111-1111-1111-1111-111111111111',
    academicYearId: 'ay_2026_2027',
    academicYearName: 'Academic Year 2026–2027',
    campusIds: [],
    campusNames: ['All Campuses'],
    classIds: [],
    classNames: ['All Classes'],
    feeAmount: 1500,
    currency: 'PKR',
    collectionRule: 'PAYMENT_ALLOWED_ON_TEST_DAY',
    instructions: 'PKR 1,500 payable online via 1Link / Kuickpay or in cash on Entrance Test day.',
    feeNotRequired: false,
    isActive: true,
    createdAt: new Date('2026-08-20T10:00:00Z'),
    updatedAt: new Date('2026-08-20T10:00:00Z'),
  },
];

export default function ApplicationFeeConfigPage() {
  const [rules, setRules] = useState<ApplicationFeeRuleDto[]>(MOCK_RULES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApplicationFeeRuleDto | null>(null);

  // Live Rule Tester State
  const [testCampus, setTestCampus] = useState('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  const [testClass, setTestClass] = useState('cls-g6');
  const [testYear, setTestYear] = useState('ay_2026_2027');
  const [resolvedFee, setResolvedFee] = useState<{
    amount: number;
    currency: string;
    rule: ApplicationFeeCollectionRule;
    ruleName: string;
    instructions: string;
    feeNotRequired: boolean;
  } | null>(null);

  // Modal Form State
  const [formInstructionsText, setFormInstructionsText] = useState('');
  const [formYear, setFormYear] = useState('ay_2026_2027');
  const [formAmount, setFormAmount] = useState<number>(1500);
  const [formCurrency, setFormCurrency] = useState('PKR');
  const [formCollectionRule, setFormCollectionRule] = useState<ApplicationFeeCollectionRule>('PAYMENT_REQUIRED_BEFORE_TEST');
  const [formFeeNotRequired, setFormFeeNotRequired] = useState(false);
  const [formApplyAllCampuses, setFormApplyAllCampuses] = useState(false);
  const [formSelectedCampuses, setFormSelectedCampuses] = useState<string[]>(['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']);
  const [formApplyAllClasses, setFormApplyAllClasses] = useState(false);
  const [formSelectedClasses, setFormSelectedClasses] = useState<string[]>(['cls-g6']);

  // Evaluate Live Rule Resolution
  useEffect(() => {
    // 1. Direct campus + class match
    const directMatch = rules.find(
      (r) =>
        r.isActive &&
        (r.campusIds.length === 0 || r.campusIds.includes(testCampus)) &&
        (r.classIds.length === 0 || r.classIds.includes(testClass))
    );

    if (directMatch) {
      setResolvedFee({
        amount: directMatch.feeNotRequired ? 0 : directMatch.feeAmount,
        currency: directMatch.currency,
        rule: directMatch.collectionRule,
        ruleName: directMatch.instructions ? directMatch.instructions.slice(0, 45) + '...' : 'Configured Fee Rule',
        instructions: directMatch.instructions || 'Standard fee payment procedures apply.',
        feeNotRequired: directMatch.feeNotRequired,
      });
    } else {
      setResolvedFee({
        amount: 1500,
        currency: 'PKR',
        rule: 'PAYMENT_REQUIRED_BEFORE_TEST',
        ruleName: 'Default System Fallback Rule',
        instructions: 'Please pay PKR 1,500 at the campus admissions desk.',
        feeNotRequired: false,
      });
    }
  }, [testCampus, testClass, testYear, rules]);

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      (r.instructions || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.schoolName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.campusNames || []).some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && r.isActive) ||
      (selectedStatus === 'INACTIVE' && !r.isActive) ||
      (selectedStatus === 'WAIVED' && r.feeNotRequired);
    return matchesSearch && matchesStatus;
  });

  const handleSaveRule = () => {
    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                academicYearId: formYear,
                feeAmount: formFeeNotRequired ? 0 : Number(formAmount),
                currency: formCurrency,
                collectionRule: formCollectionRule,
                instructions: formInstructionsText,
                feeNotRequired: formFeeNotRequired,
                campusIds: formApplyAllCampuses ? [] : formSelectedCampuses,
                campusNames: formApplyAllCampuses ? ['All Campuses'] : ['Clifton Campus'],
                classIds: formApplyAllClasses ? [] : formSelectedClasses,
                classNames: formApplyAllClasses ? ['All Classes'] : ['Grade 6'],
                updatedAt: new Date(),
              }
            : r
        )
      );
    } else {
      const newRule: ApplicationFeeRuleDto = {
        id: `fee_rule_${Date.now()}`,
        organizationId: '11111111-1111-1111-1111-111111111111',
        academicYearId: formYear,
        academicYearName: 'Academic Year 2026–2027',
        campusIds: formApplyAllCampuses ? [] : formSelectedCampuses,
        campusNames: formApplyAllCampuses ? ['All Campuses'] : ['Clifton Campus'],
        classIds: formApplyAllClasses ? [] : formSelectedClasses,
        classNames: formApplyAllClasses ? ['All Classes'] : ['Grade 6'],
        feeAmount: formFeeNotRequired ? 0 : Number(formAmount),
        currency: formCurrency,
        collectionRule: formCollectionRule,
        instructions: formInstructionsText || 'Standard payment instructions',
        feeNotRequired: formFeeNotRequired,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setRules((prev) => [newRule, ...prev]);
    }

    setIsCreateModalOpen(false);
    setEditingRule(null);
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormAmount(1500);
    setFormCurrency('PKR');
    setFormCollectionRule('PAYMENT_REQUIRED_BEFORE_TEST');
    setFormInstructionsText('');
    setFormFeeNotRequired(false);
    setFormApplyAllCampuses(false);
    setFormSelectedCampuses(['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']);
    setFormApplyAllClasses(false);
    setFormSelectedClasses(['cls-g6']);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (rule: ApplicationFeeRuleDto) => {
    setEditingRule(rule);
    setFormYear(rule.academicYearId);
    setFormAmount(rule.feeAmount);
    setFormCurrency(rule.currency);
    setFormCollectionRule(rule.collectionRule);
    setFormInstructionsText(rule.instructions || '');
    setFormFeeNotRequired(rule.feeNotRequired);
    setFormApplyAllCampuses(rule.campusIds.length === 0);
    setFormSelectedCampuses(rule.campusIds);
    setFormApplyAllClasses(rule.classIds.length === 0);
    setFormSelectedClasses(rule.classIds);
    setIsCreateModalOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this Application Fee Rule?')) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <AdminConfigPageHeader
        section="Forms & Admission Setup"
        sectionHref="/admin-config"
        group="Forms Setup"
        groupHref="/admin-config?category=forms_setup"
        title="Application Fee Configuration"
        description="Define rule-based application fee amounts, payment instructions, test-day collection rules, and multi-campus/class waivers."
        categoryNav={FORMS_SETUP_NAV}
        actionButtonText="Create Fee Rule"
        onAction={openCreateModal}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* TOP INTERACTIVE LIVE RESOLVER BANNER */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/40">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                Live Rule Engine Simulator
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Dynamic Application Fee Resolver
              </h2>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                Test which application fee rule applies for any given Academic Year, Campus, and Class. The Form Builder and Public Pre-Registration portal evaluate this dynamically.
              </p>
            </div>

            {/* Selector Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <div>
                <label className="block text-[11px] font-medium text-indigo-200 mb-1">Academic Year</label>
                <select
                  value={testYear}
                  onChange={(e) => setTestYear(e.target.value)}
                  className="w-full bg-slate-900/90 text-white text-xs rounded-lg px-2.5 py-1.5 border border-indigo-400/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="ay_2026_2027">AY 2026–2027</option>
                  <option value="ay_2025_2026">AY 2025–2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-indigo-200 mb-1">Campus</label>
                <select
                  value={testCampus}
                  onChange={(e) => setTestCampus(e.target.value)}
                  className="w-full bg-slate-900/90 text-white text-xs rounded-lg px-2.5 py-1.5 border border-indigo-400/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb">Clifton Campus</option>
                  <option value="cccccccc-cccc-cccc-cccc-cccccccccccc">DHA Campus Phase 6</option>
                  <option value="eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee">Clifton Junior Campus</option>
                  <option value="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa">Gulshan Main Campus</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-indigo-200 mb-1">Class / Grade</label>
                <select
                  value={testClass}
                  onChange={(e) => setTestClass(e.target.value)}
                  className="w-full bg-slate-900/90 text-white text-xs rounded-lg px-2.5 py-1.5 border border-indigo-400/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="cls-g6">Grade 6</option>
                  <option value="cls-g3">Grade 3</option>
                  <option value="cls-kg">Kindergarten</option>
                  <option value="cls-nursery">Nursery</option>
                  <option value="cls-alevel">A-Level 1st Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Resolved Result Card */}
          {resolvedFee && (
            <div className="mt-5 pt-4 border-t border-indigo-800/60 grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-indigo-950/40 p-4 rounded-xl">
              <div>
                <span className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold block">Matched Fee Rule</span>
                <span className="text-sm font-semibold text-white truncate block">{resolvedFee.ruleName}</span>
              </div>

              <div>
                <span className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold block">Effective Fee</span>
                <span className="text-lg font-bold text-emerald-400">
                  {!resolvedFee.feeNotRequired ? `${resolvedFee.currency} ${resolvedFee.amount.toLocaleString()}` : 'Fee Waived / Exempted'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold block">Collection Timing Policy</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                  {resolvedFee.rule.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="md:text-right">
                <span className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold block">Instructions Preview</span>
                <span className="text-xs text-indigo-200 truncate block max-w-xs md:ml-auto">
                  {resolvedFee.instructions}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS & FILTER TOOLBAR */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search fee rules, campuses, schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'ACTIVE', 'INACTIVE', 'WAIVED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Rules' : st === 'ACTIVE' ? 'Active' : st === 'INACTIVE' ? 'Inactive' : 'Fee Waived'}
              </button>
            ))}
          </div>
        </div>

        {/* RULES TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Rule & Academic Year</th>
                  <th className="px-6 py-4">Campuses</th>
                  <th className="px-6 py-4">Classes</th>
                  <th className="px-6 py-4">Fee Amount</th>
                  <th className="px-6 py-4">Collection Rule</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No Application Fee Rules found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{rule.instructions.slice(0, 45)}...</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {rule.academicYearName}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {rule.campusIds.length === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            All Campuses
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(rule.campusNames || []).map((cn) => (
                              <span
                                key={cn}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {cn}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {rule.classIds.length === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            All Classes
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(rule.classNames || []).slice(0, 3).map((cn) => (
                              <span
                                key={cn}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600"
                              >
                                {cn}
                              </span>
                            ))}
                            {(rule.classNames || []).length > 3 && (
                              <span className="text-[11px] text-slate-400 self-center">
                                +{(rule.classNames || []).length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {!rule.feeNotRequired ? (
                          <span>
                            {rule.currency} {rule.feeAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            Waived (PKR 0)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {rule.collectionRule.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={rule.isActive ? 'ACTIVE' : 'INACTIVE'} />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <RowActions>
                          <EditAction onClick={() => openEditModal(rule)} />
                          <DeleteAction onClick={() => handleDeleteRule(rule.id)} />
                        </RowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingRule ? 'Edit Application Fee Rule' : 'New Application Fee Rule'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure fee amount, scope, and test eligibility policy.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ay_2026_2027">Academic Year 2026–2027</option>
                    <option value="ay_2025_2026">Academic Year 2025–2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Timing Policy *</label>
                  <select
                    value={formCollectionRule}
                    onChange={(e) => setFormCollectionRule(e.target.value as ApplicationFeeCollectionRule)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PAYMENT_REQUIRED_BEFORE_TEST">Payment Required Before Test</option>
                    <option value="PAYMENT_ALLOWED_ON_TEST_DAY">Payment Allowed on Test Day</option>
                  </select>
                </div>
              </div>

              {/* Fee Not Required / Waiver Switch */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Exempt / Waive Application Fee</span>
                  <span className="text-xs text-slate-500">Check to exempt fee (e.g. Early Years / Kindergarten admissions)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formFeeNotRequired}
                  onChange={(e) => setFormFeeNotRequired(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>

              {!formFeeNotRequired && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Amount *</label>
                    <input
                      type="number"
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                    <input
                      type="text"
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Instructions for Applicant</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bank Account details, 1Link Consumer ID instructions, or cash collection policy..."
                  value={formInstructionsText}
                  onChange={(e) => setFormInstructionsText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
