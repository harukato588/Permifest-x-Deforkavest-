'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
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
): Promise<AuthActionResult<{ role: string; redirectUrl: string }>> {
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
    const cookieStore = await cookies();

    // Deteksi akun demo resmi Permifest x Deforkafest
    const demoAccounts: Record<string, { role: string; redirectUrl: string; name: string }> = {
      'peserta@permifest.id': {
        role: 'peserta',
        redirectUrl: '/dashboard/peserta',
        name: 'Peserta Permifest',
      },
      'juri@permifest.id': {
        role: 'juri',
        redirectUrl: '/dashboard/juri',
        name: 'Dewan Juri',
      },
      'panitia@permifest.id': {
        role: 'panitia',
        redirectUrl: '/dashboard/admin',
        name: 'Panitia Event',
      },
      'admin@permifest.id': {
        role: 'super_admin',
        redirectUrl: '/dashboard/admin',
        name: 'Super Admin',
      },
    };

    // 1. Coba otentikasi nyata dengan Supabase
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        const userRole = (data.user?.user_metadata?.role as string) || 'peserta';
        const redirectUrl =
          userRole === 'super_admin' || userRole === 'panitia'
            ? '/dashboard/admin'
            : userRole === 'juri'
            ? '/dashboard/juri'
            : '/dashboard/peserta';

        // Bersihkan demo cookie bila ada
        cookieStore.delete('permifest_demo_role');
        cookieStore.delete('permifest_demo_email');

        return {
          success: true,
          message: 'Berhasil masuk ke akun Permifest x Deforkafest',
          data: {
            role: userRole,
            redirectUrl,
          },
        };
      }
    } catch {
      // Abaikan bila Supabase offline
    }

    // 2. Fallback cerdas untuk Seeder Akun Demo (HANYA AKTIF di development atau bila flag eksplisit diaktifkan)
    const isDemoAllowed =
      process.env.NODE_ENV !== 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'true';

    const normalizedEmail = email.toLowerCase().trim();
    const demoMatch = isDemoAllowed ? demoAccounts[normalizedEmail] : undefined;

    if (demoMatch && (password === 'password123' || password === 'demo123')) {
      cookieStore.set('permifest_demo_role', demoMatch.role, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 hari
        sameSite: 'lax',
      });
      cookieStore.set('permifest_demo_email', normalizedEmail, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });

      return {
        success: true,
        message: `Berhasil masuk sebagai ${demoMatch.name}`,
        data: {
          role: demoMatch.role,
          redirectUrl: demoMatch.redirectUrl,
        },
      };
    }

    return {
      success: false,
      message: isDemoAllowed
        ? 'Alamat email atau kata sandi tidak sesuai. Gunakan akun demo atau daftar akun baru.'
        : 'Alamat email atau kata sandi tidak sesuai. Silakan periksa kembali atau daftar akun baru.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mencoba masuk.';
    return {
      success: false,
      message: msg,
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
    const supabase = await createServerSupabase();

    // Golden Rule #3: Peran ditetapkan di server secara statis sebagai 'peserta'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          institution: institution || '',
          phone: phone || '',
          role: 'peserta', // MUTLAK: Selalu peserta
        },
      },
    });

    if (error) {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co')
      ) {
        // Fallback demo simulator
        return {
          success: true,
          message: 'Pendaftaran akun berhasil dibuat (mode simulasi demo)',
          data: {
            email,
            requiresVerification: false,
          },
        };
      }

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
  try {
    const parsed = ForgotPasswordSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: 'Format email tidak valid',
      };
    }

    const { email } = parsed.data;
    const supabase = await createServerSupabase();

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
    });

    // Respons netral untuk mencegah user enumeration / account leakage
    return {
      success: true,
      message: 'Instruksi pemulihan kata sandi telah dikirimkan jika alamat email terdaftar di sistem.',
    };
  } catch {
    return {
      success: true,
      message: 'Instruksi pemulihan kata sandi telah dikirimkan jika alamat email terdaftar di sistem.',
    };
  }
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

/**
 * Server Action: Keluar Akun (Logout)
 */
export async function logoutAction(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('permifest_demo_role');
    cookieStore.delete('permifest_demo_email');

    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch {
    // Abaikan jika sudah tidak ada sesi aktif
  }
  redirect('/login');
}
