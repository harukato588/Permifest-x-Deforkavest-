'use server';

import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser, requirePermission } from '@/lib/auth/session';
import {
  RegisterCompetitionSchema,
  UploadPaymentProofSchema,
  VerifyPaymentSchema,
  type RegisterCompetitionInput,
  type UploadPaymentProofInput,
  type VerifyPaymentInput,
} from './schema';

// ─── Tipe Hasil Action ────────────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// ─── Action: Daftar Kompetisi ─────────────────────────────────────────────

export async function registerCompetitionAction(
  raw: RegisterCompetitionInput
): Promise<ActionResult<{ registration_id: string }>> {
  try {
    const user = await requireUser();
    const parsed = RegisterCompetitionSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
      const firstErrorMessage =
        Object.entries(fieldErrors).map(([field, errs]) => `${field}: ${errs.join(', ')}`)[0] ||
        'Data formulir tidak valid.';
      return {
        success: false,
        error: `Data formulir tidak valid (${firstErrorMessage}).`,
        fieldErrors,
      };
    }

    const { competition_id, form_data, team_name, team_members } = parsed.data;
    if (!user.roles.includes('peserta')) {
      return { success: false, error: 'Hanya akun peserta yang dapat mendaftar lomba.' };
    }

    // Gunakan admin client supaya bisa membaca kompetisi tanpa RLS user
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('education_level')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile?.education_level) {
      return {
        success: false,
        error: 'Lengkapi status pendidikan di Profil sebelum mendaftar lomba.',
      };
    }

    if (profile.education_level === 'mahasiswa') {
      const { data: ktm, error: ktmError } = await admin
        .from('identity_verifications')
        .select('status')
        .eq('user_id', user.id)
        .eq('document_type', 'ktm')
        .maybeSingle();

      if (ktmError || !ktm || !['pending', 'verified'].includes(ktm.status)) {
        return {
          success: false,
          error: 'Mahasiswa wajib mengunggah KTM di Profil sebelum mendaftar lomba.',
        };
      }
    }

    // 1. Validasi kompetisi tersedia & cek window pendaftaran
    const { data: comp, error: compErr } = await admin
      .from('competitions')
      .select('id, name, fee_idr, quota, registration_opens_at, registration_closes_at, is_published, participation, team_min, team_max, form_fields')
      .eq('id', competition_id)
      .maybeSingle();

    if (compErr || !comp) {
      return { success: false, error: 'Kompetisi tidak ditemukan.' };
    }
    if (!comp.is_published) {
      return { success: false, error: 'Kompetisi belum dibuka.' };
    }

    const now = new Date();
    if (comp.registration_opens_at && new Date(comp.registration_opens_at) > now) {
      return { success: false, error: 'Pendaftaran belum dibuka.' };
    }
    if (comp.registration_closes_at && new Date(comp.registration_closes_at) < now) {
      return { success: false, error: 'Pendaftaran sudah ditutup.' };
    }

    // 2. Cek kuota jika ada
    if (comp.quota) {
      const { count } = await admin
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', competition_id)
        .in('status', ['draft', 'registered']);
      if ((count ?? 0) >= comp.quota) {
        return { success: false, error: 'Kuota pendaftaran sudah penuh.' };
      }
    }

    // 3. Cek duplikasi
    const { data: existing } = await admin
      .from('registrations')
      .select('id')
      .eq('competition_id', competition_id)
      .eq('user_id', user.id)
      .not('status', 'eq', 'cancelled')
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Anda sudah terdaftar di kompetisi ini.' };
    }

    // 4. Validasi form_fields dinamis
    const requiredFields = Array.isArray(comp.form_fields)
      ? (comp.form_fields as Array<{ id?: string; key?: string; label?: string; required?: boolean }>).filter((f) => f.required)
      : [];
    for (const field of requiredFields) {
      const fieldKey = field.id || field.key;
      if (fieldKey && !form_data[fieldKey]) {
        return { success: false, error: `Kolom "${field.label || fieldKey}" wajib diisi.` };
      }
    }

    // 5. Buat tim jika kompetisi beregu
    let teamId: string | null = null;
    if (comp.participation === 'team' && team_name) {
      const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const { data: team, error: teamErr } = await admin
        .from('teams')
        .insert({
          competition_id,
          name: team_name,
          captain_id: user.id,
          invite_code: inviteCode,
        })
        .select('id')
        .single();

      if (teamErr || !team) {
        return { success: false, error: `Gagal membuat tim: ${teamErr?.message}` };
      }
      teamId = team.id;

      // Tambahkan kapten sebagai anggota
      await admin.from('team_members').insert({ team_id: teamId, user_id: user.id, role: 'captain' });

      // Tambahkan anggota lain jika ada
      if (team_members && team_members.length > 0) {
        for (const member of team_members) {
          if (member.email) {
            const { data: memberUser } = await admin
              .from('users')
              .select('id')
              .eq('email', member.email.toLowerCase())
              .maybeSingle();
            if (memberUser) {
              await admin.from('team_members').insert({
                team_id: teamId,
                user_id: memberUser.id,
                role: 'member',
              });
            }
          }
        }
      }
    }

    // 6. Insert registrasi
    const { data: reg, error: regErr } = await admin
      .from('registrations')
      .insert({
        competition_id,
        user_id: user.id,
        team_id: teamId,
        form_data,
        status: 'draft',
      })
      .select('id')
      .single();

    if (regErr || !reg) {
      return { success: false, error: `Gagal mendaftarkan: ${regErr?.message}` };
    }

    // 7. Buat baris pembayaran jika ada biaya
    if (Number(comp.fee_idr) > 0) {
      const { error: payErr } = await admin.from('payments').insert({
        registration_id: reg.id,
        amount_idr: Number(comp.fee_idr),
        status: 'awaiting_proof',
        attempt: 1,
      });
      if (payErr) {
        // Rollback registrasi
        await admin.from('registrations').delete().eq('id', reg.id);
        return { success: false, error: `Gagal membuat tagihan pembayaran: ${payErr.message}` };
      }
    } else {
      // Gratis → langsung registered
      await admin
        .from('registrations')
        .update({ status: 'registered' })
        .eq('id', reg.id);
    }

    // 8. Audit log
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'registration.create',
      entity_type: 'registrations',
      entity_id: reg.id,
      details: { competition_id, competition_name: comp.name, fee: comp.fee_idr },
    });

    return { success: true, data: { registration_id: reg.id } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftar.';
    if (msg.startsWith('UNAUTHORIZED') || msg.startsWith('FORBIDDEN')) {
      return { success: false, error: msg };
    }
    return { success: false, error: 'Terjadi kesalahan server. Coba lagi nanti.' };
  }
}

// ─── Action: Unggah Bukti Pembayaran ─────────────────────────────────────

export async function submitPaymentProofAction(
  raw: UploadPaymentProofInput
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = UploadPaymentProofSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: 'Data tidak valid.', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
    }

    const { registration_id, proof_path } = parsed.data;

    const supabase = await createServerSupabase();

    // Pastikan registrasi milik user ini
    const { data: reg, error: regErr } = await supabase
      .from('registrations')
      .select('id, user_id, status')
      .eq('id', registration_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (regErr || !reg) {
      return { success: false, error: 'Pendaftaran tidak ditemukan.' };
    }
    if (reg.status === 'registered') {
      return { success: false, error: 'Pembayaran sudah diverifikasi.' };
    }

    // Update payment
    const { error: payErr } = await supabase
      .from('payments')
      .update({
        proof_path,
        proof_uploaded_at: new Date().toISOString(),
        status: 'pending_review',
      })
      .eq('registration_id', registration_id);

    if (payErr) {
      return { success: false, error: `Gagal menyimpan bukti pembayaran: ${payErr.message}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
    if (msg.startsWith('UNAUTHORIZED') || msg.startsWith('FORBIDDEN')) {
      return { success: false, error: msg };
    }
    return { success: false, error: 'Terjadi kesalahan server.' };
  }
}

// ─── Action: Verifikasi Pembayaran (Admin/Panitia) ─────────────────────

export async function verifyPaymentAction(raw: VerifyPaymentInput): Promise<ActionResult> {
  try {
    const admin_user = await requirePermission('payments.verify');
    const parsed = VerifyPaymentSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: 'Data tidak valid.' };
    }

    const { payment_id, action, reject_reason } = parsed.data;

    const admin = createAdminClient();

    // Ambil data payment dan registration_id
    const { data: payment, error: payFetchErr } = await admin
      .from('payments')
      .select('id, registration_id, status')
      .eq('id', payment_id)
      .maybeSingle();

    if (payFetchErr || !payment) {
      return { success: false, error: 'Data pembayaran tidak ditemukan.' };
    }

    if (payment.status === 'verified') {
      return { success: false, error: 'Pembayaran sudah diverifikasi sebelumnya.' };
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const { error: payErr } = await admin
        .from('payments')
        .update({ status: 'verified', reviewed_by: admin_user.id, reviewed_at: now, reject_reason: null })
        .eq('id', payment_id);

      if (payErr) return { success: false, error: `Gagal memverifikasi: ${payErr.message}` };

      // Update status registrasi → registered
      const { error: regErr } = await admin
        .from('registrations')
        .update({ status: 'registered' })
        .eq('id', payment.registration_id);

      if (regErr) return { success: false, error: `Gagal update status registrasi: ${regErr.message}` };
    } else {
      if (!reject_reason?.trim()) {
        return { success: false, error: 'Alasan penolakan wajib diisi.' };
      }
      const { error: payErr } = await admin
        .from('payments')
        .update({
          status: 'rejected',
          reviewed_by: admin_user.id,
          reviewed_at: now,
          reject_reason: reject_reason.trim(),
          proof_path: null,
          proof_uploaded_at: null,
        })
        .eq('id', payment_id);

      if (payErr) return { success: false, error: `Gagal menolak pembayaran: ${payErr.message}` };
    }

    // Audit log
    await admin.from('audit_logs').insert({
      user_id: admin_user.id,
      action: `payment.${action}`,
      entity_type: 'payments',
      entity_id: payment_id,
      details: { registration_id: payment.registration_id, action, reject_reason },
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
    if (msg.startsWith('UNAUTHORIZED') || msg.startsWith('FORBIDDEN')) {
      return { success: false, error: msg };
    }
    return { success: false, error: 'Terjadi kesalahan server.' };
  }
}

