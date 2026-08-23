'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminConfigPageHeader,
  FORMS_SETUP_NAV,
} from '../../../../components/AdminConfigPageHeader';
import { FormRuntimeRenderer } from '../../../../components/FormRuntimeRenderer';
import { FormTemplateDto } from '@campus-os/types';

const STARTER_TEMPLATES: FormTemplateDto[] = [
  {
    id: 'tmpl_basic_prereg',
    code: 'TMPL_BASIC_PREREG',
    name: 'Basic Pre-Registration Form',
    formPurpose: 'PRE_REGISTRATION',
    category: 'Standard',
    icon: '⚡',
    description: 'Fast, minimal pre-registration form collecting essential student & parent contact details in under 2 minutes.',
    isSystem: true,
    schemaPayload: {
      settings: { submitButtonText: 'Submit Pre-Registration', saveDraftEnabled: true },
      rules: [],
      sections: [
        {
          id: 'sec_basic_student',
          title: 'Student Basic Details',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_full_name',
              fieldDefinitionId: 'STD_FULL_NAME',
              canonicalKey: 'STUDENT_FULL_NAME',
              customLabel: 'Student Full Name',
              placeholder: 'Enter student official name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_dob',
              fieldDefinitionId: 'STD_DOB',
              canonicalKey: 'STUDENT_DOB',
              customLabel: 'Date of Birth',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
            },
            {
              instanceId: 'fld_gender',
              fieldDefinitionId: 'STD_GENDER',
              canonicalKey: 'STUDENT_GENDER',
              customLabel: 'Gender',
              width: 'HALF',
              isRequired: true,
              sortOrder: 3,
              options: [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }],
            },
            {
              instanceId: 'fld_class',
              fieldDefinitionId: 'ACAD_CLASS_REF',
              canonicalKey: 'APPLYING_CLASS',
              customLabel: 'Applying Class / Grade',
              width: 'HALF',
              isRequired: true,
              sortOrder: 4,
              masterBinding: 'CLASS',
            },
          ],
        },
        {
          id: 'sec_basic_parent',
          title: 'Parent / Guardian Contact',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 2,
          fields: [
            {
              instanceId: 'fld_fat_name',
              fieldDefinitionId: 'FAT_NAME',
              canonicalKey: 'FATHER_NAME',
              customLabel: 'Father Name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_primary_mobile',
              fieldDefinitionId: 'CNT_PRIMARY_MOBILE',
              canonicalKey: 'PRIMARY_CONTACT_MOBILE',
              customLabel: 'Primary Mobile Number (SMS Alerts)',
              placeholder: '+92 300 1234567',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'tmpl_standard_prereg',
    code: 'TMPL_STANDARD_PREREG',
    name: 'Standard Pre-Registration Form',
    formPurpose: 'PRE_REGISTRATION',
    category: 'Standard',
    icon: '📋',
    description: 'Comprehensive pre-registration form including address, previous school history, and emergency numbers.',
    isSystem: true,
    schemaPayload: {
      settings: { submitButtonText: 'Submit Application', saveDraftEnabled: true },
      rules: [],
      sections: [
        {
          id: 'sec_std_info',
          title: 'Student Information',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 1,
          fields: [
            { instanceId: 'fld_fname', fieldDefinitionId: 'STD_FIRST_NAME', canonicalKey: 'STUDENT_FIRST_NAME', customLabel: 'First Name', width: 'HALF', isRequired: true, sortOrder: 1 },
            { instanceId: 'fld_lname', fieldDefinitionId: 'STD_LAST_NAME', canonicalKey: 'STUDENT_LAST_NAME', customLabel: 'Last Name', width: 'HALF', isRequired: true, sortOrder: 2 },
            { instanceId: 'fld_dob', fieldDefinitionId: 'STD_DOB', canonicalKey: 'STUDENT_DOB', customLabel: 'Date of Birth', width: 'HALF', isRequired: true, sortOrder: 3 },
            { instanceId: 'fld_gender', fieldDefinitionId: 'STD_GENDER', canonicalKey: 'STUDENT_GENDER', customLabel: 'Gender', width: 'HALF', isRequired: true, sortOrder: 4, options: [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }] },
            { instanceId: 'fld_class', fieldDefinitionId: 'ACAD_CLASS_REF', canonicalKey: 'APPLYING_CLASS', customLabel: 'Applying Class', width: 'HALF', isRequired: true, masterBinding: 'CLASS', sortOrder: 5 },
          ],
        },
        {
          id: 'sec_parent_info',
          title: 'Parent & Address Details',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 2,
          fields: [
            { instanceId: 'fld_fat_name', fieldDefinitionId: 'FAT_NAME', canonicalKey: 'FATHER_NAME', customLabel: 'Father Full Name', width: 'HALF', isRequired: true, sortOrder: 1 },
            { instanceId: 'fld_fat_mob', fieldDefinitionId: 'FAT_MOBILE', canonicalKey: 'FATHER_MOBILE', customLabel: 'Father Mobile Number', width: 'HALF', isRequired: true, sortOrder: 2 },
            { instanceId: 'fld_city', fieldDefinitionId: 'ADDR_CURR_CITY', canonicalKey: 'CURRENT_CITY', customLabel: 'City', width: 'HALF', isRequired: true, masterBinding: 'CITY', sortOrder: 3 },
            { instanceId: 'fld_area', fieldDefinitionId: 'ADDR_CURR_AREA', canonicalKey: 'CURRENT_AREA', customLabel: 'Area / Zone', width: 'HALF', isRequired: false, masterBinding: 'AREA', sortOrder: 4 },
          ],
        },
      ],
    },
  },
  {
    id: 'tmpl_detailed_admission',
    code: 'TMPL_DETAILED_ADMISSION',
    name: 'Comprehensive Formal Admission Package',
    formPurpose: 'ADMISSION',
    category: 'Detailed',
    icon: '🏫',
    description: 'Complete institutional admission form covering academic history, documents, medical details, transport, and parent declarations.',
    isSystem: true,
    schemaPayload: {
      settings: { submitButtonText: 'Submit Complete Admission Package', saveDraftEnabled: true },
      rules: [
        {
          id: 'rule_transport',
          sourceFieldKey: 'fld_transport_req',
          operator: 'EQUALS',
          value: true,
          action: 'SHOW',
          targetFieldKey: 'fld_transport_pickup',
        },
      ],
      sections: [
        {
          id: 'sec_adm_student',
          title: 'Student Information',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 1,
          fields: [
            { instanceId: 'fld_adm_fullname', fieldDefinitionId: 'STD_FULL_NAME', canonicalKey: 'STUDENT_FULL_NAME', customLabel: 'Official Full Name', width: 'HALF', isRequired: true, sortOrder: 1 },
            { instanceId: 'fld_adm_dob', fieldDefinitionId: 'STD_DOB', canonicalKey: 'STUDENT_DOB', customLabel: 'Date of Birth', width: 'HALF', isRequired: true, sortOrder: 2 },
            { instanceId: 'fld_adm_gender', fieldDefinitionId: 'STD_GENDER', canonicalKey: 'STUDENT_GENDER', customLabel: 'Gender', width: 'HALF', isRequired: true, sortOrder: 3, options: [{ label: 'Male', value: 'MALE' }, { label: 'Female', value: 'FEMALE' }] },
            { instanceId: 'fld_adm_photo', fieldDefinitionId: 'STD_PHOTO', canonicalKey: 'STUDENT_PHOTO', customLabel: 'Student Photograph', width: 'HALF', isRequired: true, sortOrder: 4 },
          ],
        },
        {
          id: 'sec_adm_academic',
          title: 'Academic & Grade Details',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 2,
          fields: [
            { instanceId: 'fld_adm_board', fieldDefinitionId: 'ACAD_BOARD_REF', canonicalKey: 'BOARD', customLabel: 'Curriculum / Board', width: 'HALF', isRequired: true, sortOrder: 1, masterBinding: 'BOARD' },
            { instanceId: 'fld_adm_class', fieldDefinitionId: 'ACAD_CLASS_REF', canonicalKey: 'APPLYING_CLASS', customLabel: 'Enrolling Class / Grade', width: 'HALF', isRequired: true, sortOrder: 2, masterBinding: 'CLASS' },
          ],
        },
        {
          id: 'sec_adm_transport',
          title: 'Transport & Facilities',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 3,
          fields: [
            { instanceId: 'fld_transport_req', fieldDefinitionId: 'TRN_REQUIRED', canonicalKey: 'TRANSPORT_REQUIRED', customLabel: 'School Transport Required?', width: 'HALF', isRequired: false, sortOrder: 1 },
            { instanceId: 'fld_transport_pickup', fieldDefinitionId: 'TRN_PICKUP_AREA', canonicalKey: 'TRANSPORT_PICKUP_AREA', customLabel: 'Preferred Pickup / Drop Location', width: 'HALF', isRequired: false, sortOrder: 2 },
          ],
        },
      ],
    },
  },
];

export default function FormTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplateDto | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const handleUseTemplate = (tmpl: FormTemplateDto) => {
    const newId = `form_from_${tmpl.id}_${Date.now().toString().slice(-4)}`;
    router.push(`/admin-config/form-builder/${newId}`);
  };

  return (
    <div className="space-y-6">
      <AdminConfigPageHeader
        group="Forms Setup"
        title="Form Templates"
        description="Ready-to-use starter templates for Pre-Registration and Admission. Clone or customize for your campuses."
        configItemId="forms_templates"
        categoryNav={FORMS_SETUP_NAV}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STARTER_TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-2xl flex items-center justify-center">
                  {tmpl.icon}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {tmpl.formPurpose.replace('_', ' ')}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white">{tmpl.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {tmpl.description}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-500">
                <span>{tmpl.schemaPayload.sections.length} Sections</span>
                <span>•</span>
                <span>{tmpl.schemaPayload.sections.flatMap((s) => s.fields).length} Fields</span>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTemplate(tmpl)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors text-center"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => handleUseTemplate(tmpl)}
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors text-center"
              >
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-start p-4 overflow-y-auto">
          <div className="w-full max-w-5xl flex items-center justify-between py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">{selectedTemplate.name}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/20">
                Template Preview
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                🖥️ Desktop
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  previewDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                📱 Tablet
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-300'
                }`}
              >
                📱 Mobile
              </button>
            </div>

            <button
              onClick={() => setSelectedTemplate(null)}
              className="p-2 text-slate-300 hover:text-white text-xl font-bold"
            >
              ✕
            </button>
          </div>

          <div
            className={`w-full transition-all duration-300 my-auto ${
              previewDevice === 'desktop'
                ? 'max-w-4xl'
                : previewDevice === 'tablet'
                ? 'max-w-2xl'
                : 'max-w-sm'
            }`}
          >
            <FormRuntimeRenderer
              schema={selectedTemplate.schemaPayload}
              formTitle={selectedTemplate.name}
              formPurpose={selectedTemplate.formPurpose}
            />
          </div>
        </div>
      )}
    </div>
  );
}
