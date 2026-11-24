import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { getDashboardPath } from '@/lib/auth/roles';

export const instant = false;

export default async function DashboardIndexPage() {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=%2Fdashboard');
  if (user.roles.includes('super_admin') && user.assurance_level !== 'aal2') {
    redirect('/mfa');
  }
  redirect(getDashboardPath(user.role));
}
