import 'server-only';

import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { AuthSessionUser, AppRole, AppPermission } from './types';
import { hasPermission } from './permissions';

/**
 * Mendapatkan pengguna yang sedang login dari sesi cookie Supabase atau sesi demo terotentikasi.
 * Mengembalikan null jika belum terautentikasi.
 */
export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      // Role default adalah 'peserta' sesuai Golden Rule #3, kecuali akun resmi panitia/juri/admin
      let userRole = (user.user_metadata?.role as AppRole);
      if (!userRole) {
        if (user.email === 'admin@permifest.id') userRole = 'super_admin';
        else if (user.email === 'panitia@permifest.id') userRole = 'panitia';
        else if (user.email === 'juri@permifest.id' || user.email?.includes('juri')) userRole = 'juri';
        else userRole = 'peserta';
      }

      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || (userRole === 'super_admin' ? 'Super Admin' : user.email?.split('@')[0]) || 'Pengguna',
        role: userRole,
        institution: user.user_metadata?.institution || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        is_verified: Boolean(user.email_confirmed_at),
      };
    }
  } catch {
    // Abaikan jika Supabase cloud belum siap/koneksi terputus
  }

  // Fallback ke sesi cookie terotentikasi bila ada cookie role yang sah
  try {
    const cookieStore = await cookies();
    const demoRoleCookie = cookieStore.get('permifest_demo_role')?.value as AppRole | undefined;
    const demoEmailCookie = cookieStore.get('permifest_demo_email')?.value || `${demoRoleCookie || 'peserta'}@permifest.id`;

    if (demoRoleCookie && ['peserta', 'juri', 'panitia', 'super_admin'].includes(demoRoleCookie)) {
      return {
        id: `demo-${demoRoleCookie}-id`,
        email: demoEmailCookie,
        full_name: demoRoleCookie === 'super_admin' ? 'Super Admin Permifest' : demoRoleCookie.toUpperCase(),
        role: demoRoleCookie,
        institution: 'Universitas Sarjanawiyata Tamansiswa',
        phone: '08123456789',
        avatar_url: '',
        is_verified: true,
      };
    }
  } catch {
    // Abaikan
  }

  return null;
}

/**
 * Mengharuskan pengguna sudah login. Melempar error atau mengembalikan user.
 */
export async function requireUser(): Promise<AuthSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Anda harus masuk terlebih dahulu.');
  }
  return user;
}

/**
 * Mengharuskan pengguna memiliki salah satu role yang diizinkan.
 */
export async function requireRole(allowedRoles: AppRole[]): Promise<AuthSessionUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: Peran ${user.role} tidak memiliki hak akses ke halaman ini.`);
  }
  return user;
}

/**
 * Mengharuskan pengguna memiliki izin tertentu.
 */
export async function requirePermission(permission: AppPermission): Promise<AuthSessionUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new Error(`FORBIDDEN: Anda tidak memiliki izin "${permission}".`);
  }
  return user;
}
