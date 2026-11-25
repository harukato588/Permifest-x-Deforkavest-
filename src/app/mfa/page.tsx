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
  if (!user.roles.includes('super_admin')) redirect(getDashboardPath(user.role));
  if (user.assurance_level === 'aal2') redirect('/dashboard/admin');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12 text-[var(--foreground)]">
      <MfaClient />
    </main>
  );
}
