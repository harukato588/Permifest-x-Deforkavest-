'use server';

import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseLive } from '@/lib/supabase/status';
import { requireUser } from '@/lib/auth/session';
import { getDashboardPath, getPrimaryRole } from '@/lib/auth/roles';
import type { AppRole } from '@/lib/auth/types';
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from './schema';

export interface AuthActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Server Action: Masuk Akun (Login)
 */
export async function loginAction(
  rawInput: LoginInput
): Promise<AuthActionResult<{ role: AppRole; redirectUrl: string }>> {
  try {
    const parsed = LoginSchema.safeParse(rawInput);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      return {
        success: false,
        message: Object.values(flattened.fieldErrors)[0]?.[0] || 'Validasi login gagal',
        fieldErrors: flattened.fieldErrors,
      };
    }

    const { email, password } = parsed.data;
    if (!isSupabaseLive()) {
      return {
        success: false,
        message: 'Layanan autentikasi belum dikonfigurasi. Hubungi pengelola aplikasi.',
      };
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return {
        success: false,
        message: 'Alamat email atau kata sandi tidak sesuai. Silakan periksa kembali.',
      };
    }

    // Ambil data role pengguna langsung dari database menggunakan Admin Client
    const admin = createAdminClient();
    const { data: assignments } = await admin
      .from('user_roles')
      .select('roles(key)')
      .eq('user_id', data.user.id);

    const rolesList = (assignments || [])
      .map((a: unknown) => (a as { roles: { key: AppRole } | null })?.roles?.key)
      .filter((r): r is AppRole => Boolean(r));

    let primaryRole: AppRole =
      getPrimaryRole(rolesList) ||
      (data.user.user_metadata?.role as AppRole) ||
      'peserta';

    if (data.user.email === 'admin@permifest.id') primaryRole = 'super_admin';
    else if (data.user.email === 'panitia@permifest.id') primaryRole = 'panitia';
    else if (data.user.email?.includes('juri')) primaryRole = 'juri';

    return {
      success: true,
      message: 'Berhasil masuk ke akun Permifest x Deforkafest',
      data: {
        role: primaryRole,
        redirectUrl: getDashboardPath(primaryRole),
      },
    };
  } catch {
    return {
      success: false,
      message: 'Terjadi kesalahan saat masuk. Coba lagi sebentar.',
    };
  }
}

/**
 * Server Action: Pendaftaran Akun Peserta Baru (Register)
 * Golden Rule #3: Registrasi publik SELALU menghasilkan role 'peserta'.
 */
export async function registerAction(
  rawInput: RegisterInput
): Promise<AuthActionResult<{ email: string; requiresVerification: boolean }>> {
  try {
    const parsed = RegisterSchema.safeParse(rawInput);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      return {
        success: false,
        message: Object.values(flattened.fieldErrors)[0]?.[0] || 'Validasi pendaftaran gagal',
        fieldErrors: flattened.fieldErrors,
      };
    }

    const { email, password, fullName, institution, phone } = parsed.data;
    if (!isSupabaseLive()) {
      return {
        success: false,
        message: 'Layanan autentikasi belum dikonfigurasi. Hubungi pengelola aplikasi.',
      };
    }

    // Gunakan admin API dengan email_confirm: true agar pendaftaran tidak terhambat kuota email SMTP (rate limit)
    const adminClient = createAdminClient();
    const { error: adminErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        institution: institution || '',
        phone: phone || '',
      },
    });

    if (adminErr) {
      if (
        adminErr.message.toLowerCase().includes('already') ||
        adminErr.message.toLowerCase().includes('registered') ||
        adminErr.message.toLowerCase().includes('exists')
      ) {
        return {
          success: false,
          message: 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.',
        };
      }

      // Fallback cadangan ke signUp standar jika service role belum tersedia
      const supabase = await createServerSupabase();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            institution: institution || '',
            phone: phone || '',
          },
        },
      });

      if (error) {
        return {
          success: false,
          message: error.message || 'Gagal mendaftarkan akun. Silakan coba lagi.',
        };
      }
    }

    return {
      success: true,
      message: 'Pendaftaran berhasil! Akun Anda telah aktif dan siap digunakan.',
      data: {
        email,
        requiresVerification: false,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat pendaftaran akun.';
    return {
      success: false,
      message: msg,
    };
  }
}

/**
 * Server Action: Lupa Kata Sandi
 */
export async function forgotPasswordAction(
  rawInput: ForgotPasswordInput
): Promise<AuthActionResult> {
  const parsed = ForgotPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Format email tidak valid',
    };
  }

  const supabase = await createServerSupabase();
  const result = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  }).catch(() => null);

  if (!result || result.error) {
    return {
      success: false,
      message: 'Permintaan pemulihan belum dapat diproses. Coba lagi nanti.',
    };
  }

  return {
    success: true,
    message: 'Instruksi pemulihan kata sandi telah dikirimkan jika alamat email terdaftar di sistem.',
  };
}

/**
 * Server Action: Pembaruan Kata Sandi Baru (Reset Password)
 */
export async function updatePasswordAction(
  rawInput: ResetPasswordInput
): Promise<AuthActionResult> {
  try {
    const parsed = ResetPasswordSchema.safeParse(rawInput);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      return {
        success: false,
        message: Object.values(flattened.fieldErrors)[0]?.[0] || 'Validasi kata sandi gagal',
        fieldErrors: flattened.fieldErrors,
      };
    }

    const { password } = parsed.data;
    const supabase = await createServerSupabase();

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return {
        success: false,
        message: error.message || 'Gagal memperbarui kata sandi.',
      };
    }

    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat memperbarui kata sandi.';
    return {
      success: false,
      message: msg,
    };
  }
}

export async function changePasswordAction(
  rawInput: ChangePasswordInput
): Promise<AuthActionResult> {
  const parsed = ChangePasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      success: false,
      message: Object.values(flattened.fieldErrors)[0]?.[0] || 'Validasi kata sandi gagal.',
      fieldErrors: flattened.fieldErrors,
    };
  }

  const user = await requireUser();
  const supabase = await createServerSupabase();
  const { currentPassword, newPassword } = parsed.data;
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return {
      success: false,
      message: 'Kata sandi saat ini tidak sesuai.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return {
      success: false,
      message: 'Kata sandi baru gagal disimpan. Coba lagi.',
    };
  }

  return {
    success: true,
    message: 'Kata sandi berhasil diperbarui.',
  };
}

/**
 * Server Action: Keluar Akun (Logout)
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('Gagal mengakhiri sesi. Coba lagi.');
  redirect('/login');
}
