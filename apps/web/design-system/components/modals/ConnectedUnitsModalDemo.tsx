import React, { useState } from 'react';
import { AdminModal } from './AdminModal';
import { Button } from '../buttons/Button';
import { StatusBadge } from '../badges/StatusBadge';
import { Link2, Building, MapPin } from 'lucide-react';

export function ConnectedUnitsModalDemo() {
  const [isOpen, setIsOpen] = useState(false);

  const dummyConnectedSchools = [
    { id: 'sch-1', code: 'SCH-001', name: 'Beaconhouse Horizon Main Campus', city: 'Karachi', status: 'ACTIVE', campuses: 4 },
    { id: 'sch-2', code: 'SCH-002', name: 'Beaconhouse Horizon Gulshan Campus', city: 'Karachi', status: 'ACTIVE', campuses: 2 },
    { id: 'sch-3', code: 'SCH-003', name: 'Beaconhouse Horizon Clifton Campus', city: 'Karachi', status: 'ACTIVE', campuses: 3 },
  ];

  return (
    <div className="space-y-4 p-4 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300">
        <Link2 className="w-4 h-4 text-blue-600" />
        <span>Connected Units Demonstration</span>
      </div>
      <p className="text-xs text-slate-500 max-w-md mx-auto">
        Click below to open the actual nested Connected Units Modal with isolated z-index stacking (zIndex: 120) and full viewport backdrop.
      </p>
      <div>
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Connected Units Modal (🔗 3 Schools)
        </Button>
      </div>

      {isOpen && (
        <AdminModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Connected Schools — Beacon Horizon Education Network"
          subtitle="Showing 3 linked institutions under Regional Office: Sindh South Region"
          maxWidth="5xl"
          zIndex={120}
        >
          <div className="space-y-4 p-2">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">School Code</th>
                    <th className="py-2.5 px-3">Institution Name</th>
                    <th className="py-2.5 px-3">City / Area</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Campuses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dummyConnectedSchools.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.code}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.city}
                      </td>
                      <td className="py-2.5 px-3"><StatusBadge status={item.status as any} /></td>
                      <td className="py-2.5 px-3 text-right font-bold">{item.campuses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Close Connected View
              </Button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
