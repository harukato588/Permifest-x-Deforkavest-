import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { MfaClient } from '@/features/auth/MfaClient';
import { getCurrentUser } from '@/lib/auth/session';
import { getDashboardPath } from '@/lib/auth/roles';

export const instant = false;

export default async function MfaPage() {
  await connection();
  const user = await getCurrentUser();

  if (!user) redirect('/login');
  redirect(getDashboardPath(user.role));
}
