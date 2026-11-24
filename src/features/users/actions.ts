'use server';

import { requireUser } from '@/lib/auth/session';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { ProfileSchema, type ProfileInput } from '@/features/auth/schema';

export async function updateProfileAction(rawInput: ProfileInput) {
  const parsed = ProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Data profil tidak valid.',
    };
  }

  const user = await requireUser();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('users')
    .update({
      full_name: parsed.data.fullName,
      institution: parsed.data.institution || null,
      phone: parsed.data.phone || null,
    })
    .eq('id', user.id)
    .select('full_name, institution, phone')
    .maybeSingle();

  if (error) {
    return { success: false, message: 'Profil gagal disimpan. Coba lagi.' };
  }
  if (!data) {
    return { success: false, message: 'Profil tidak ditemukan. Muat ulang halaman lalu coba lagi.' };
  }

  return {
    success: true,
    message: 'Perubahan profil berhasil disimpan.',
    data: {
      full_name: data.full_name,
      institution: data.institution || '',
      phone: data.phone || '',
    },
  };
}
