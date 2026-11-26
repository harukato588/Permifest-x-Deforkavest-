import { z } from 'zod';
import type { AppRole } from './types';

export const AppRoleSchema = z.enum(['peserta', 'juri', 'panitia', 'super_admin']);

const ROLE_PRIORITY: readonly AppRole[] = ['super_admin', 'panitia', 'juri', 'peserta'];

export function getPrimaryRole(roles: readonly AppRole[]): AppRole | null {
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

export function canAccessRoleArea(
  userRoles: readonly AppRole[],
  allowedRoles: readonly AppRole[]
): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function requiresSuperAdminMfa(
  _userRoles: readonly AppRole[],
  _assuranceLevel: 'aal1' | 'aal2' | null | undefined
): boolean {
  // MFA dinonaktifkan untuk kelancaran operasional event (tidak ada lockout saat hari-H)
  return false;
}

export function getDashboardPath(role: AppRole): string {
  switch (role) {
    case 'peserta':
      return '/dashboard/peserta';
    case 'juri':
      return '/dashboard/juri';
    case 'panitia':
    case 'super_admin':
      return '/dashboard/admin';
  }
}
