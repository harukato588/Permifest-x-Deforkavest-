import React from 'react';
import { AppProvider } from '@/lib/store';
import { requireDashboardUser, toAppUser } from '@/lib/auth/session';

export const instant = false;

export default async function PesertaAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDashboardUser(['peserta'], '/dashboard/peserta');
  return <AppProvider initialUser={toAppUser(user)}>{children}</AppProvider>;
}
