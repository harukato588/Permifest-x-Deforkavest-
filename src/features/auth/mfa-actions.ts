'use server';

import { z } from 'zod';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseLive } from '@/lib/supabase/status';
import { getCurrentUser } from '@/lib/auth/session';
import type { MfaSetupResult } from './mfa-types';

const MfaCodeSchema = z.object({
  factorId: z.uuid(),
  code: z.string().regex(/^\d{6}$/, 'Masukkan kode autentikator 6 digit.'),
});

export async function beginSuperAdminMfaAction(): Promise<MfaSetupResult> {
  if (!isSupabaseLive()) {
    return { success: false, message: 'Supabase belum dikonfigurasi.' };
  }

  const user = await getCurrentUser();
  if (!user?.roles.includes('super_admin')) {
    return { success: false, message: 'Akun ini tidak memiliki akses Super Admin.' };
  }

  const supabase = await createServerSupabase();
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) {
    return { success: false, message: 'Status autentikator tidak dapat diperiksa. Coba lagi.' };
  }

  const verifiedFactor = factors.totp.find((factor) => factor.status === 'verified');
  if (verifiedFactor) {
    return {
      success: true,
      data: { factorId: verifiedFactor.id, setupRequired: false },
    };
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Permifest Super Admin',
  });

  if (error) {
    return { success: false, message: 'Autentikator tidak dapat disiapkan. Coba lagi.' };
  }

  return {
    success: true,
    data: {
      factorId: data.id,
      setupRequired: true,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    },
  };
}

export async function verifySuperAdminMfaAction(
  rawInput: unknown
): Promise<{ success: boolean; message?: string }> {
  const parsed = MfaCodeSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message || 'Kode autentikator tidak valid.',
    };
  }

  const user = await getCurrentUser();
  if (!user?.roles.includes('super_admin')) {
    return { success: false, message: 'Akun ini tidak memiliki akses Super Admin.' };
  }

  const supabase = await createServerSupabase();
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) {
    return { success: false, message: 'Status autentikator tidak dapat diperiksa. Coba lagi.' };
  }

  const factor = factors.totp.find((item) => item.id === parsed.data.factorId);
  if (!factor) {
    return { success: false, message: 'Autentikator tidak ditemukan. Mulai penyiapan ulang.' };
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify(parsed.data);
  if (error) {
    return { success: false, message: 'Kode autentikator salah atau sudah kedaluwarsa.' };
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance.currentLevel !== 'aal2') {
    return { success: false, message: 'Verifikasi dua langkah belum selesai. Coba lagi.' };
  }

  return { success: true, message: 'Verifikasi dua langkah berhasil.' };
}
