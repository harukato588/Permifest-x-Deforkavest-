'use server';

import { redirect } from 'next/navigation';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseLive } from '@/lib/supabase/status';
import { getCurrentUser, requireUser } from '@/lib/auth/session';
import { getDashboardPath } from '@/lib/auth/roles';
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

    const user = await getCurrentUser().catch(() => null);
    if (!user || user.id !== data.user.id) {
      await supabase.auth.signOut();
      return {
        success: false,
        message: 'Profil atau role akun belum tersedia. Hubungi pengelola aplikasi.',
      };
    }

    return {
      success: true,
      message: 'Berhasil masuk ke akun Permifest x Deforkafest',
      data: {
        role: user.role,
        redirectUrl:
          user.roles.includes('super_admin') && user.assurance_level !== 'aal2'
            ? '/mfa'
            : getDashboardPath(user.role),
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

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.auth.signUp({
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

    const requiresVerification = !data.session;

    return {
      success: true,
      message: requiresVerification
        ? 'Pendaftaran berhasil! Tautan verifikasi telah dikirimkan ke alamat email Anda.'
        : 'Pendaftaran berhasil! Akun Anda telah siap digunakan.',
      data: {
        email,
        requiresVerification,
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
