import 'server-only';

import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser, requirePermission } from '@/lib/auth/session';

export interface SubmissionRow extends Record<string, unknown> {
  id: string;
  registration_id: string;
  stage_id: string;
  version: number;
  is_latest: boolean;
  kind: 'file' | 'link';
  storage_path: string | null;
  original_filename: string | null;
  mime: string | null;
  size_bytes: number | null;
  link_url: string | null;
  notes?: string | null;
  submitted_at: string;
  competition_name?: string;
  competition_slug?: string;
  stage_name?: string;
  participant_name?: string;
  participant_email?: string;
  team_name?: string | null;
}

/**
 * Mengambil daftar riwayat submission milik user yang sedang login
 */
export async function getMySubmissionsQuery(): Promise<SubmissionRow[]> {
  const user = await requireUser();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      id,
      registration_id,
      stage_id,
      version,
      is_latest,
      kind,
      storage_path,
      original_filename,
      mime,
      size_bytes,
      link_url,
      submitted_at,
      stages (
        id, name
      ),
      registrations!inner (
        id,
        user_id,
        competitions (
          id, name, slug
        ),
        teams (
          name
        )
      )
    `)
    .eq('registrations.user_id', user.id)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil data submission: ${error.message}`);
  }

  return (data || []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const st = r.stages as Record<string, unknown> | null;
    const reg = r.registrations as Record<string, unknown> | null;
    const comp = reg?.competitions as Record<string, unknown> | null;
    const team = reg?.teams as Record<string, unknown> | null;

    return {
      id: String(r.id || ''),
      registration_id: String(r.registration_id || ''),
      stage_id: String(r.stage_id || ''),
      version: Number(r.version || 1),
      is_latest: Boolean(r.is_latest),
      kind: (r.kind as 'file' | 'link') || 'file',
      storage_path: (r.storage_path as string) || null,
      original_filename: (r.original_filename as string) || null,
      mime: (r.mime as string) || null,
      size_bytes: r.size_bytes ? Number(r.size_bytes) : null,
      link_url: (r.link_url as string) || null,
      submitted_at: String(r.submitted_at || ''),
      stage_name: (st?.name as string) || 'Tahapan',
      competition_name: (comp?.name as string) || 'Kompetisi',
      competition_slug: (comp?.slug as string) || '',
      team_name: (team?.name as string) || null,
    };
  });
}

/**
 * Mengambil daftar seluruh submission masuk untuk Panitia / Admin
 */
export async function getAllSubmissionsForAdminQuery(filters?: {
  competitionId?: string;
  stageId?: string;
  onlyLatest?: boolean;
}): Promise<SubmissionRow[]> {
  await requirePermission('submissions.read');
  const supabase = createAdminClient();

  let query = supabase
    .from('submissions')
    .select(`
      id,
      registration_id,
      stage_id,
      version,
      is_latest,
      kind,
      storage_path,
      original_filename,
      mime,
      size_bytes,
      link_url,
      submitted_at,
      stages!inner (
        id, name, competition_id
      ),
      registrations!inner (
        id,
        user_id,
        users!inner (
          id, full_name, email
        ),
        competitions!inner (
          id, name, slug
        ),
        teams (
          name
        )
      )
    `)
    .order('submitted_at', { ascending: false });

  if (filters?.onlyLatest ?? true) {
    query = query.eq('is_latest', true);
  }
  if (filters?.competitionId) {
    query = query.eq('stages.competition_id', filters.competitionId);
  }
  if (filters?.stageId) {
    query = query.eq('stage_id', filters.stageId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Gagal mengambil data submission panitia: ${error.message}`);
  }

  return (data || []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const st = r.stages as Record<string, unknown> | null;
    const reg = r.registrations as Record<string, unknown> | null;
    const usr = reg?.users as Record<string, unknown> | null;
    const comp = reg?.competitions as Record<string, unknown> | null;
    const team = reg?.teams as Record<string, unknown> | null;

    return {
      id: String(r.id || ''),
      registration_id: String(r.registration_id || ''),
      stage_id: String(r.stage_id || ''),
      version: Number(r.version || 1),
      is_latest: Boolean(r.is_latest),
      kind: (r.kind as 'file' | 'link') || 'file',
      storage_path: (r.storage_path as string) || null,
      original_filename: (r.original_filename as string) || null,
      mime: (r.mime as string) || null,
      size_bytes: r.size_bytes ? Number(r.size_bytes) : null,
      link_url: (r.link_url as string) || null,
      submitted_at: String(r.submitted_at || ''),
      stage_name: (st?.name as string) || 'Tahapan',
      competition_name: (comp?.name as string) || 'Kompetisi',
      competition_slug: (comp?.slug as string) || '',
      participant_name: (usr?.full_name as string) || 'Peserta',
      participant_email: (usr?.email as string) || '',
      team_name: (team?.name as string) || null,
    };
  });
}
