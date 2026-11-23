'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/session';
import { SubmitWorkSchema, type SubmitWorkInput } from './schema';

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Mengumpulkan Karya Peserta (File atau Tautan Figma)
 * Memvalidasi batas waktu tahapan, status pembayaran, dan versi pengumpulan
 */
export async function submitWorkAction(raw: SubmitWorkInput): Promise<ActionResult<{ submission_id: string; version: number }>> {
  try {
    const user = await requireUser();
    const parsed = SubmitWorkSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Data pengumpulan karya tidak valid.',
      };
    }

    const {
      registration_id,
      stage_id,
      kind,
      storage_path,
      original_filename,
      mime,
      size_bytes,
      link_url,
      notes,
    } = parsed.data;

    const admin = createAdminClient();

    // 1. Verifikasi registrasi milik user (atau user sebagai kapten/anggota tim)
    const { data: reg, error: regErr } = await admin
      .from('registrations')
      .select('id, user_id, competition_id, status, team_id')
      .eq('id', registration_id)
      .maybeSingle();

    if (regErr || !reg) {
      return { success: false, error: 'Pendaftaran tidak ditemukan.' };
    }

    // Jika registrasi bukan dibuat oleh user langsung, cek apakah user anggota tim
    if (reg.user_id !== user.id) {
      if (!reg.team_id) {
        return { success: false, error: 'Anda tidak memiliki hak akses ke pendaftaran ini.' };
      }

      const { data: member } = await admin
        .from('team_members')
        .select('id')
        .eq('team_id', reg.team_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!member) {
        return { success: false, error: 'Anda bukan anggota dari tim pendaftar ini.' };
      }
    }

    // 2. Verifikasi status pendaftaran (harus sudah verified / registered)
    if (reg.status !== 'registered') {
      return {
        success: false,
        error: 'Pendaftaran Anda belum terverifikasi atau pembayaran belum disetujui panitia.',
      };
    }

    // 3. Verifikasi tahapan lomba & batas waktu pengumpulan
    const { data: stage, error: stageErr } = await admin
      .from('stages')
      .select('id, name, competition_id, submission_deadline, ends_at, scores_locked_at')
      .eq('id', stage_id)
      .maybeSingle();

    if (stageErr || !stage) {
      return { success: false, error: 'Tahapan kompetisi tidak valid.' };
    }

    if (stage.competition_id !== reg.competition_id) {
      return { success: false, error: 'Tahapan tidak sesuai dengan cabang kompetisi yang didaftarkan.' };
    }

    if (stage.scores_locked_at) {
      return { success: false, error: 'Penilaian tahapan ini telah dikunci oleh panitia.' };
    }

    const now = new Date();
    const deadlineStr = stage.submission_deadline || stage.ends_at;
    if (deadlineStr && new Date(deadlineStr) < now) {
      return {
        success: false,
        error: `Batas waktu pengumpulan karya untuk tahapan "${stage.name}" telah berakhir.`,
      };
    }

    // 4. Hitung versi pengumpulan (version = last_version + 1)
    const { data: latestSub } = await admin
      .from('submissions')
      .select('id, version')
      .eq('registration_id', registration_id)
      .eq('stage_id', stage_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newVersion = latestSub ? latestSub.version + 1 : 1;

    // 5. Update versi sebelumnya agar is_latest = false
    if (latestSub) {
      await admin
        .from('submissions')
        .update({ is_latest: false })
        .eq('registration_id', registration_id)
        .eq('stage_id', stage_id);
    }

    // 6. Simpan baris submission baru
    const { data: newSub, error: insertErr } = await admin
      .from('submissions')
      .insert({
        registration_id,
        stage_id,
        version: newVersion,
        is_latest: true,
        kind,
        storage_path: kind === 'file' ? storage_path : null,
        original_filename: kind === 'file' ? original_filename : null,
        mime: kind === 'file' ? mime : null,
        size_bytes: kind === 'file' ? size_bytes : null,
        link_url: kind === 'link' ? link_url : null,
        additional_files: notes ? [{ type: 'notes', content: notes }] : [],
        submitted_at: now.toISOString(),
      })
      .select('id')
      .single();

    if (insertErr || !newSub) {
      return { success: false, error: `Gagal menyimpan submission: ${insertErr?.message}` };
    }

    // 7. Catat audit log
    await admin.from('audit_logs').insert({
      user_id: user.id,
      action: 'submission.create',
      entity_type: 'submissions',
      entity_id: newSub.id,
      details: {
        registration_id,
        stage_id,
        stage_name: stage.name,
        version: newVersion,
        kind,
        original_filename,
        link_url,
      },
    });

    return {
      success: true,
      data: {
        submission_id: newSub.id,
        version: newVersion,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kegagalan server.';
    return { success: false, error: msg };
  }
}
