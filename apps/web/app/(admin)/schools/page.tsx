import { redirect } from 'next/navigation';

/**
 * /schools is now canonically located at /admin-config/schools
 * Redirect for backward compatibility.
 */
export default function SchoolsRedirectPage() {
  redirect('/admin-config/schools');
}
