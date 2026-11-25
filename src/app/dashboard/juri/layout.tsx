import React from 'react';
import { AppProvider } from '@/lib/store';
import { requireDashboardUser, toAppUser } from '@/lib/auth/session';

export const instant = false;

export default async function JuriAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDashboardUser(['juri'], '/dashboard/juri');
  return <AppProvider initialUser={toAppUser(user)}>{children}</AppProvider>;
}
