import React from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export const instant = false;

export default async function JuriAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?redirect=/dashboard/juri');
  }
  if (user.role !== 'juri' && user.role !== 'panitia' && user.role !== 'super_admin') {
    redirect('/dashboard/peserta');
  }

  return <>{children}</>;
}
