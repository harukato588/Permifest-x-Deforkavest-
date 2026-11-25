import { AppRole, AppPermission, AuthSessionUser } from './types';

/**
 * Matriks Izin Granular per Peran
 * Mengacu pada docs/SITEMAP_RBAC.md
 */
export const ROLE_PERMISSIONS: Record<AppRole, readonly AppPermission[]> = {
  peserta: [
    'dashboard.view',
    'competitions.read',
    'registrations.create',
    'payments.upload',
    'submissions.create',
  ],
  juri: [
    'dashboard.view',
    'competitions.read',
    'submissions.read',
    'scores.submit',
  ],
  panitia: [
    'dashboard.view',
    'competitions.read',
    'competitions.write',
    'registrations.read',
    'registrations.update',
    'payments.verify',
    'submissions.read',
    'assignments.manage',
    'scores.monitor',
    'scores.lock',
    'results.write',
    'announcements.publish',
    'audit.read',
  ],
  super_admin: [
    'dashboard.view',
    'competitions.read',
    'competitions.write',
    'registrations.read',
    'registrations.update',
    'payments.verify',
    'submissions.read',
    'assignments.manage',
    'scores.monitor',
    'scores.lock',
    'scores.override',
    'results.write',
    'announcements.publish',
    'users.manage',
    'system.settings',
    'audit.read',
  ],
};

/**
 * Memeriksa apakah role memiliki izin tertentu
 */
export function hasPermission(role: AppRole, permission: AppPermission): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return (allowed as readonly string[]).includes(permission);
}

export function hasUserPermission(
  user: AuthSessionUser,
  permission: AppPermission
): boolean {
  return user.roles.some((role) => hasPermission(role, permission));
}

/**
 * Helper otorisasi level pengguna
 */
export function can(user: AuthSessionUser | null | undefined, permission: AppPermission): boolean {
  if (!user) return false;
  return hasUserPermission(user, permission);
}
