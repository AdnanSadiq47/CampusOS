import React, { useState } from 'react';
import { AdminModal } from '../modals/AdminModal';
import { Button } from '../buttons/Button';
import { StatusBadge } from '../badges/StatusBadge';
import { Eye, Building2, MapPin, MessageSquare, ShieldCheck, Clock } from 'lucide-react';

export function DetailsLayoutDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4 p-4 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
        <Eye className="w-4 h-4 text-indigo-600" />
        <span>View Details Modal Standard (5xl Wide / 1100px)</span>
      </div>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        Demonstrates the canonical View Details modal with Identity Header, Contact Cards, WhatsApp Social Links, IAM Account Details, and Audit Trail.
      </p>
      <div>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Full Details Modal (5xl View)
        </Button>
      </div>

      {isOpen && (
        <AdminModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="School Institution Profile — Beacon Horizon Clifton Campus"
          subtitle="Record ID: SCH-0042 • Organization Scope: Sindh South Region"
          maxWidth="5xl"
          zIndex={100}
        >
          <div className="space-y-6 p-2">
            {/* Identity Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                  🏫
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Beacon Horizon Clifton Campus</h3>
                    <StatusBadge status="ACTIVE" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>School Code: <strong>SCH-CLF-01</strong> • Board: Cambridge International (CIE)</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://wa.me/923001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Contact</span>
                </a>
              </div>
            </div>

            {/* Structured 2-Col Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Location & Geography</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>Country: <span className="font-semibold text-slate-800 dark:text-slate-200">Pakistan</span></div>
                  <div>State/Province: <span className="font-semibold text-slate-800 dark:text-slate-200">Sindh</span></div>
                  <div>City: <span className="font-semibold text-slate-800 dark:text-slate-200">Karachi</span></div>
                  <div>Area/Zone: <span className="font-semibold text-slate-800 dark:text-slate-200">Clifton Block 4</span></div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Linked IAM Administrator</span>
                </span>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div>Principal / Lead: <span className="font-semibold text-slate-800 dark:text-slate-200">Dr. Sarah Mansoor</span></div>
                  <div>Portal Login: <span className="font-semibold text-slate-800 dark:text-slate-200">sarah.mansoor@horizon.edu.pk</span></div>
                  <div>Phone: <span className="font-semibold text-slate-800 dark:text-slate-200">+92 300 1234567</span></div>
                </div>
              </div>
            </div>

            {/* Audit Summary Footer Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Created on: <strong>14 Aug 2024, 10:30 AM</strong> by <strong>Ali Hassan (Admin Lead)</strong></span>
              </span>
              <span>Last Modified: <strong>28 Aug 2026, 04:15 PM</strong> (v1.4)</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Close Details
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
