import 'server-only';

import { cache } from 'react';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseLive } from '@/lib/supabase/status';
import { AuthSessionUser, AppRole, AppPermission } from './types';
import {
  AppRoleSchema,
  canAccessRoleArea,
  getDashboardPath,
  getPrimaryRole,
  requiresSuperAdminMfa,
} from './roles';
import { hasUserPermission } from './permissions';

export const getCurrentUser = cache(async (): Promise<AuthSessionUser | null> => {
  if (!isSupabaseLive()) return null;

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) return null;

  const admin = createAdminClient();
  const [
    { data: profileData, error: profileError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    admin
      .from('users')
      .select('full_name, institution, phone, avatar_url, education_level')
      .eq('id', user.id)
      .maybeSingle(),
    admin
      .from('user_roles')
      .select('role:roles!user_roles_role_id_fkey(key)')
      .eq('user_id', user.id),
  ]);

  if (profileError) throw new Error('Unable to load the authenticated user profile.');
  if (!profileData) return null;

  const profile = z
    .object({
      full_name: z.string().min(1),
      institution: z.string().nullable(),
      phone: z.string().nullable(),
      avatar_url: z.string().nullable(),
      education_level: z.enum(['mahasiswa', 'sma_smk', 'umum']).nullable(),
    })
    .safeParse(profileData);

  if (!profile.success) throw new Error('The authenticated user profile is invalid.');

  if (assignmentsError) throw new Error('Unable to load the authenticated user roles.');
  if (!assignments.length) return null;

  const rawRoleKeys = assignments
    .map((assignment) => {
      const roleObj = Array.isArray(assignment.role) ? assignment.role[0] : assignment.role;
      return (roleObj as { key?: string } | null)?.key;
    })
    .filter((key): key is string => Boolean(key));

  const roles = [...new Set(rawRoleKeys.map((key) => AppRoleSchema.parse(key)))];
  const role = getPrimaryRole(roles);
  if (!role) return null;

  return {
    id: user.id,
    email: user.email,
    full_name: profile.data.full_name,
    role,
    roles,
    institution: profile.data.institution || '',
    phone: profile.data.phone || '',
    education_level: profile.data.education_level,
    avatar_url: profile.data.avatar_url || '',
    is_verified: Boolean(user.email_confirmed_at),
    assurance_level: null,
  };
});

export async function requireUser(): Promise<AuthSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Anda harus masuk terlebih dahulu.');
  }
  if (requiresSuperAdminMfa(user.roles, user.assurance_level)) {
    throw new Error('MFA_REQUIRED: Super Admin must complete multi-factor authentication.');
  }
  return user;
}

export async function requireRole(allowedRoles: AppRole[]): Promise<AuthSessionUser> {
  const user = await requireUser();
  if (!canAccessRoleArea(user.roles, allowedRoles)) {
    throw new Error(`FORBIDDEN: Peran ${user.role} tidak memiliki hak akses ke halaman ini.`);
  }
  return user;
}

export async function requirePermission(permission: AppPermission): Promise<AuthSessionUser> {
  const user = await requireUser();
  if (!hasUserPermission(user, permission)) {
    throw new Error(`FORBIDDEN: Anda tidak memiliki izin "${permission}".`);
  }
  return user;
}

export async function requireDashboardUser(
  allowedRoles: AppRole[],
  dashboardPath: string
): Promise<AuthSessionUser> {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    redirectToLogin(dashboardPath);
  }

  if (requiresSuperAdminMfa(user.roles, user.assurance_level)) {
    redirect('/mfa');
  }

  if (!canAccessRoleArea(user.roles, allowedRoles)) {
    redirect(getDashboardPath(user.role));
  }

  return user;
}

export function toAppUser(user: AuthSessionUser) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    institution: user.institution,
    phone: user.phone,
    education_level: user.education_level,
    avatar_url: user.avatar_url,
    email_verified: user.is_verified ?? false,
  };
}

function redirectToLogin(dashboardPath: string): never {
  redirect(`/login?redirect=${encodeURIComponent(dashboardPath)}`);
}
