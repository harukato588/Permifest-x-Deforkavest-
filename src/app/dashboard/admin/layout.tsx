import React from 'react';
import { AppProvider } from '@/lib/store';
import { requireDashboardUser, toAppUser } from '@/lib/auth/session';

export const instant = false;

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDashboardUser(['panitia', 'super_admin'], '/dashboard/admin');
  return <AppProvider initialUser={toAppUser(user)}>{children}</AppProvider>;
}
