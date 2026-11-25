import {
  Competition,
  Registration,
  Submission,
  JudgeAssignment,
  User,
  UserRole,
} from '@/lib/types';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  ICompetitionRepository,
  IRegistrationRepository,
  ISubmissionRepository,
  IScoreRepository,
  IUserRepository,
} from '../types';

function mapCompetitionCategory(slug: string): Competition['category'] {
  if (slug.includes('esai')) return 'esai';
  if (slug.includes('uiux') || slug.includes('ui-ux')) return 'uiux';
  if (slug.includes('it-system') || slug.includes('arsitektur')) return 'it_system_arch';
  if (slug.includes('pes')) return 'pes';
  if (slug.includes('ml') || slug.includes('mobile-legends')) return 'ml';
  return 'esai';
}

function mapDbCompetition(row: Record<string, unknown>): Competition {
  const slug = String(row.slug ?? '');
  const rawFields = Array.isArray(row.form_fields) ? (row.form_fields as Array<Record<string, unknown>>) : [];
  const rawSubConfig = (row.submission_config && typeof row.submission_config === 'object'
    ? row.submission_config
    : {}) as Record<string, unknown>;
  const rawStages = Array.isArray(row.stages) ? (row.stages as Array<Record<string, unknown>>) : [];

  const allowedTypes = Array.isArray(rawSubConfig.allowedTypes)
    ? (rawSubConfig.allowedTypes as string[])
    : Array.isArray(rawSubConfig.accepts)
      ? (rawSubConfig.accepts as string[])
      : [];

  const maxSizeBytes =
    typeof rawSubConfig.maxSizeBytes === 'number'
      ? rawSubConfig.maxSizeBytes
      : typeof rawSubConfig.max_mb === 'number'
        ? rawSubConfig.max_mb * 1024 * 1024
        : undefined;

  return {
    id: String(row.id ?? ''),
    slug,
    name: String(row.name ?? ''),
    type: row.kind === 'esport' || row.type === 'non_academic' ? 'non_academic' : 'academic',
    category: mapCompetitionCategory(slug),
    participation_type:
      row.participation === 'team' || row.participation_type === 'team' ? 'team' : 'individual',
    min_team_size: Number(row.team_min ?? row.min_team_size ?? 1),
    max_team_size: Number(row.team_max ?? row.max_team_size ?? 1),
    description: String(row.description ?? ''),
    theme: String(row.theme ?? 'Securing the Digital Frontier: Innovation & Resilience'),
    registration_fee: Number(row.fee_idr ?? row.registration_fee ?? 0),
    quota: row.quota != null ? Number(row.quota) : undefined,
    registered_count: Number(row.registered_count ?? 0),
    requires_identity_verification: Boolean(row.requires_identity ?? row.requires_identity_verification ?? true),
    registration_open_at: String(row.registration_opens_at ?? row.registration_open_at ?? ''),
    registration_close_at: String(row.registration_closes_at ?? row.registration_close_at ?? ''),
    is_published: Boolean(row.is_published ?? true),
    payment_qr_url: typeof row.payment_qr_url === 'string' ? row.payment_qr_url : undefined,
    form_fields: rawFields.map((f) => ({
      id: String(f.id ?? f.key ?? ''),
      label: String(f.label ?? f.key ?? ''),
      type: (f.type as Competition['form_fields'][number]['type']) ?? 'text',
      placeholder: typeof f.placeholder === 'string' ? f.placeholder : undefined,
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? (f.options as string[]) : undefined,
    })),
    submission_config: {
      allowedTypes,
      maxSizeBytes,
      requiresDiagram: Boolean(rawSubConfig.requiresDiagram),
      allowSeparateDiagram: Boolean(rawSubConfig.allowSeparateDiagram ?? rawSubConfig.allow_separate_diagram),
    },
    stages: rawStages
      .map((s, idx) => ({
        id: String(s.id ?? ''),
        competition_id: String(s.competition_id ?? row.id ?? ''),
        name: String(s.name ?? ''),
        slug: String(s.slug ?? ''),
        stage_order: Number(s.position ?? s.stage_order ?? idx + 1),
        submission_open_at: String(s.opens_at ?? s.submission_open_at ?? ''),
        submission_close_at: String(s.closes_at ?? s.submission_close_at ?? ''),
        is_active: Boolean(s.is_active ?? idx === 0),
      }))
      .sort((a, b) => a.stage_order - b.stage_order),
  };
}

export class SupabaseCompetitionRepository implements ICompetitionRepository {
  async getAll(): Promise<Competition[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('competitions')
      .select('*, stages(*), rubric_criteria(*)')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map((row) => mapDbCompetition(row as unknown as Record<string, unknown>));
  }

  async getBySlug(slug: string): Promise<Competition | null> {
    const slugAliasMap: Record<string, string> = {
      'esai-ilmiah': 'esai',
      'ui-ux-design': 'uiux',
    };
    const resolvedSlug = slugAliasMap[slug] || slug;
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('competitions')
      .select('*, stages(*), rubric_criteria(*)')
      .eq('slug', resolvedSlug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapDbCompetition(data as unknown as Record<string, unknown>) : null;
  }

  async getById(id: string): Promise<Competition | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('competitions')
      .select('*, stages(*), rubric_criteria(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapDbCompetition(data as unknown as Record<string, unknown>) : null;
  }

  async create(data: Omit<Competition, 'id' | 'created_at' | 'updated_at'>): Promise<Competition> {
    const admin = createAdminClient();
    const { data: created, error } = await admin
      .from('competitions')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as unknown as Competition;
  }

  async update(id: string, data: Partial<Competition>): Promise<Competition> {
    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from('competitions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as unknown as Competition;
  }

  async delete(id: string): Promise<void> {
    const admin = createAdminClient();
    const { error } = await admin.from('competitions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export class SupabaseRegistrationRepository implements IRegistrationRepository {
  async getAll(filters?: { competitionId?: string; status?: string }): Promise<Registration[]> {
    const supabase = await createServerSupabase();
    let query = supabase.from('registrations').select('*, competition:competitions(*), user:users(*), payment:payments(*)');

    if (filters?.competitionId) {
      query = query.eq('competition_id', filters.competitionId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as unknown as Registration[];
  }

  async getByUserId(userId: string): Promise<Registration[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('registrations')
      .select('*, competition:competitions(*), payment:payments(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as unknown as Registration[];
  }

  async getById(id: string): Promise<Registration | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('registrations')
      .select('*, competition:competitions(*), user:users(*), payment:payments(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as unknown as Registration) || null;
  }

  async create(data: {
    competition_id: string;
    user_id: string;
    form_data?: Record<string, unknown>;
  }): Promise<Registration> {
    const supabase = await createServerSupabase();
    const { data: created, error } = await supabase
      .from('registrations')
      .insert({
        competition_id: data.competition_id,
        user_id: data.user_id,
        form_data: data.form_data || {},
        status: 'pending_payment',
      })
      .select('*, competition:competitions(*)')
      .single();

    if (error) throw new Error(error.message);
    return created as unknown as Registration;
  }

  async updatePayment(
    registrationId: string,
    payload: {
      status: 'pending' | 'uploaded' | 'verified' | 'rejected';
      proof_url?: string;
      proof_name?: string;
      rejection_reason?: string;
    }
  ): Promise<Registration> {
    const admin = createAdminClient();
    const updateData: Record<string, unknown> = {
      status: payload.status,
    };
    if (payload.proof_url !== undefined) updateData.proof_url = payload.proof_url;
    if (payload.proof_name !== undefined) updateData.proof_name = payload.proof_name;
    if (payload.rejection_reason !== undefined) updateData.rejection_reason = payload.rejection_reason;
    if (payload.status === 'uploaded') updateData.uploaded_at = new Date().toISOString();
    if (payload.status === 'verified') updateData.verified_at = new Date().toISOString();

    const { error: payErr } = await admin
      .from('payments')
      .update(updateData)
      .eq('registration_id', registrationId);

    if (payErr) throw new Error(payErr.message);

    if (payload.status === 'verified') {
      await admin.from('registrations').update({ status: 'verified' }).eq('id', registrationId);
    }

    const updated = await this.getById(registrationId);
    if (!updated) throw new Error('Registrasi tidak ditemukan');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const admin = createAdminClient();
    const { error } = await admin.from('registrations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export class SupabaseSubmissionRepository implements ISubmissionRepository {
  async getAll(filters?: { competitionId?: string; stageId?: string }): Promise<Submission[]> {
    const supabase = await createServerSupabase();
    let query = supabase.from('submissions').select('*, registration:registrations(*, competition:competitions(*), user:users(*))');

    if (filters?.stageId) {
      query = query.eq('stage_id', filters.stageId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as unknown as Submission[];
  }

  async getByRegistrationId(registrationId: string): Promise<Submission[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('registration_id', registrationId)
      .order('version', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as unknown as Submission[];
  }

  async getById(id: string): Promise<Submission | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('submissions')
      .select('*, registration:registrations(*, user:users(*))')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as unknown as Submission) || null;
  }

  async create(data: {
    registration_id: string;
    stage_id: string;
    file_name?: string;
    file_url?: string;
    link_url?: string;
    notes?: string;
  }): Promise<Submission> {
    const supabase = await createServerSupabase();

    // Dapatkan nomor versi berikutnya
    const { data: latest } = await supabase
      .from('submissions')
      .select('version')
      .eq('registration_id', data.registration_id)
      .eq('stage_id', data.stage_id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version || 0) + 1;

    // Set is_latest false untuk entri sebelumnya
    await supabase
      .from('submissions')
      .update({ is_latest: false })
      .eq('registration_id', data.registration_id)
      .eq('stage_id', data.stage_id);

    const { data: created, error } = await supabase
      .from('submissions')
      .insert({
        registration_id: data.registration_id,
        stage_id: data.stage_id,
        version: nextVersion,
        file_name: data.file_name,
        file_url: data.file_url,
        link_url: data.link_url,
        notes: data.notes,
        is_latest: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as unknown as Submission;
  }

  async delete(id: string): Promise<void> {
    const admin = createAdminClient();
    const { error } = await admin.from('submissions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export class SupabaseScoreRepository implements IScoreRepository {
  async getAssignmentsByJudge(judgeId: string): Promise<JudgeAssignment[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('judge_assignments')
      .select('*, submission:submissions(*, registration:registrations(*, user:users(*))), scores:scores(*)')
      .eq('judge_id', judgeId);

    if (error) throw new Error(error.message);
    return (data || []) as unknown as JudgeAssignment[];
  }

  async submitScore(
    assignmentId: string,
    scores: Array<{ criteriaId: string; score: number; comment?: string }>
  ): Promise<void> {
    const supabase = await createServerSupabase();
    for (const item of scores) {
      const { error } = await supabase.from('scores').upsert(
        {
          assignment_id: assignmentId,
          rubric_criteria_id: item.criteriaId,
          score: item.score,
          comment: item.comment || '',
        },
        { onConflict: 'assignment_id,rubric_criteria_id' }
      );
      if (error) throw new Error(error.message);
    }
  }

  async lockScores(competitionId: string): Promise<void> {
    const admin = createAdminClient();
    // Kunci nilai via database function atau update tabel scores
    const { error } = await admin.rpc('lock_competition_scores', {
      p_competition_id: competitionId,
    });
    if (error) {
      // Fallback update langsung jika RPC belum dieksekusi
      await admin
        .from('scores')
        .update({ is_locked: true })
        .not('id', 'is', null);
    }
  }
}

export class SupabaseUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as unknown as User) || null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as unknown as User) || null;
  }

  async getAll(filters?: { role?: UserRole }): Promise<User[]> {
    const supabase = await createServerSupabase();
    let query = supabase.from('users').select('*');
    if (filters?.role) {
      query = query.eq('role', filters.role);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as unknown as User[];
  }

  async updateRole(userId: string, newRole: UserRole): Promise<User> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as User;
  }
}
