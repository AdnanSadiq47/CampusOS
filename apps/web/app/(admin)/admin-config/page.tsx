import { redirect } from 'next/navigation';

/**
 * Administration Configuration root → redirect to Regional Offices (first implemented section)
 */
export default function AdminConfigPage() {
  redirect('/admin-config/regions');
}
