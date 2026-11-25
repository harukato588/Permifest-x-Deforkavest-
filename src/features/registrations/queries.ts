import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser, requirePermission } from '@/lib/auth/session';

// ─── Tipe Data ────────────────────────────────────────────────────────────

export interface PaymentRow {
  id: string;
  registration_id: string;
  status: 'awaiting_proof' | 'pending_review' | 'verified' | 'rejected';
  amount: number;
  proof_path: string | null;
  proof_uploaded_at: string | null;
  reject_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  attempt: number;
  created_at: string;
}

export interface CompetitionSnapshot {
  id: string;
  slug: string;
  name: string;
  registration_fee: number;
  participation_type: 'individual' | 'team';
  min_team_size: number;
  max_team_size: number;
  payment_qr_url?: string | null;
  form_fields: Array<Record<string, unknown>>;
}

export interface RegistrationWithRelations {
  id: string;
  user_id: string;
  competition_id: string;
  status: 'draft' | 'registered' | 'cancelled' | 'disqualified';
  form_data: Record<string, unknown>;
  registered_at: string;
  competition: CompetitionSnapshot | null;
  payment: PaymentRow | null;
}

export interface AdminPaymentRow extends Record<string, unknown> {
  payment_id: string;
  registration_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_institution: string;
  competition_id: string;
  competition_name: string;
  competition_slug: string;
  registration_status: string;
  payment_status: 'awaiting_proof' | 'pending_review' | 'verified' | 'rejected';
  amount: number;
  proof_path: string | null;
  proof_uploaded_at: string | null;
  reject_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  registered_at: string;
  form_data: Record<string, unknown>;
}

// ─── Helper mapper DB → App ───────────────────────────────────────────────

function mapDbCompetition(c: Record<string, unknown> | null): CompetitionSnapshot | null {
  if (!c) return null;
  return {
    id: String(c.id ?? ''),
    slug: String(c.slug ?? ''),
    name: String(c.name ?? ''),
    registration_fee: Number(c.fee_idr ?? 0),
    participation_type: (c.participation as 'individual' | 'team') ?? 'individual',
    min_team_size: Number(c.team_min ?? 1),
    max_team_size: Number(c.team_max ?? 1),
    payment_qr_url: (c.payment_qr_path as string) || null,
    form_fields: Array.isArray(c.form_fields)
      ? (c.form_fields as Array<Record<string, unknown>>)
      : [],
  };
}

function mapDbPayment(p: Record<string, unknown> | null): PaymentRow | null {
  if (!p) return null;
  return {
    id: String(p.id ?? ''),
    registration_id: String(p.registration_id ?? ''),
    status: (p.status as PaymentRow['status']) ?? 'awaiting_proof',
    amount: Number(p.amount_idr ?? p.amount ?? 0),
    proof_path: (p.proof_path as string) || null,
    proof_uploaded_at: (p.proof_uploaded_at as string) || null,
    reject_reason: (p.reject_reason as string) || null,
    reviewed_by: (p.reviewed_by as string) || null,
    reviewed_at: (p.reviewed_at as string) || null,
    attempt: Number(p.attempt ?? 1),
    created_at: String(p.created_at ?? ''),
  };
}

// ─── Query: Pendaftaran Milik User yang Sedang Login ─────────────────────

export async function getMyRegistrations(): Promise<RegistrationWithRelations[]> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('registrations')
    .select(`
      id,
      user_id,
      competition_id,
      status,
      form_data,
      created_at,
      competitions (
        id, slug, name, fee_idr, participation, team_min, team_max,
        payment_qr_path, form_fields
      ),
      payments (
        id, registration_id, status, amount_idr, proof_path, proof_uploaded_at,
        reject_reason, reviewed_by, reviewed_at, attempt, created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Gagal mengambil data pendaftaran: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const compRaw = r.competitions as Record<string, unknown> | null;
    const payRaw = Array.isArray(r.payments)
      ? (r.payments[0] as Record<string, unknown> | null)
      : (r.payments as Record<string, unknown> | null);

    return {
      id: String(r.id ?? ''),
      user_id: String(r.user_id ?? ''),
      competition_id: String(r.competition_id ?? ''),
      status: (r.status as RegistrationWithRelations['status']) ?? 'draft',
      form_data: (r.form_data as Record<string, unknown>) ?? {},
      registered_at: String(r.created_at ?? ''),
      competition: mapDbCompetition(compRaw),
      payment: mapDbPayment(payRaw),
    };
  });
}

// ─── Query: Detail Satu Pendaftaran Milik User ───────────────────────────

export async function getRegistrationById(
  id: string
): Promise<RegistrationWithRelations | null> {
  const user = await requireUser();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('registrations')
    .select(`
      id,
      user_id,
      competition_id,
      status,
      form_data,
      created_at,
      competitions (
        id, slug, name, fee_idr, participation, team_min, team_max,
        payment_qr_path, form_fields
      ),
      payments (
        id, registration_id, status, amount_idr, proof_path, proof_uploaded_at,
        reject_reason, reviewed_by, reviewed_at, attempt, created_at
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mengambil detail pendaftaran: ${error.message}`);
  }
  if (!data) return null;

  const r = data as unknown as Record<string, unknown>;
  const compRaw = r.competitions as Record<string, unknown> | null;
  const payRaw = Array.isArray(r.payments)
    ? (r.payments[0] as Record<string, unknown> | null)
    : (r.payments as Record<string, unknown> | null);

  return {
    id: String(r.id ?? ''),
    user_id: String(r.user_id ?? ''),
    competition_id: String(r.competition_id ?? ''),
    status: (r.status as RegistrationWithRelations['status']) ?? 'draft',
    form_data: (r.form_data as Record<string, unknown>) ?? {},
    registered_at: String(r.created_at ?? ''),
    competition: mapDbCompetition(compRaw),
    payment: mapDbPayment(payRaw),
  };
}

// ─── Query: Semua Pembayaran untuk Admin / Panitia ────────────────────────

export async function getAllPaymentsForAdmin(filters?: {
  status?: string;
  competitionId?: string;
}): Promise<AdminPaymentRow[]> {
  await requirePermission('payments.verify');
  const admin = createAdminClient();

  let query = admin
    .from('payments')
    .select(`
      id,
      registration_id,
      status,
      amount_idr,
      proof_path,
      proof_uploaded_at,
      reject_reason,
      reviewed_by,
      reviewed_at,
      created_at,
      registrations (
        id,
        status,
        form_data,
        created_at,
        competition_id,
        user_id,
        competitions (
          id, slug, name
        ),
        users (
          id, email, full_name, institution
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Gagal mengambil data pembayaran: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const p = row as unknown as Record<string, unknown>;
    const reg = p.registrations as Record<string, unknown> | null;
    const comp = reg?.competitions as Record<string, unknown> | null;
    const usr = reg?.users as Record<string, unknown> | null;

    return {
      payment_id: String(p.id ?? ''),
      registration_id: String(reg?.id ?? ''),
      user_id: String(usr?.id ?? ''),
      user_email: String(usr?.email ?? ''),
      user_name: String(usr?.full_name ?? ''),
      user_institution: String(usr?.institution ?? ''),
      competition_id: String(comp?.id ?? ''),
      competition_name: String(comp?.name ?? ''),
      competition_slug: String(comp?.slug ?? ''),
      registration_status: String(reg?.status ?? ''),
      payment_status: (p.status as AdminPaymentRow['payment_status']) ?? 'awaiting_proof',
      amount: Number(p.amount_idr ?? p.amount ?? 0),
      proof_path: (p.proof_path as string) || null,
      proof_uploaded_at: (p.proof_uploaded_at as string) || null,
      reject_reason: (p.reject_reason as string) || null,
      reviewed_by: (p.reviewed_by as string) || null,
      reviewed_at: (p.reviewed_at as string) || null,
      registered_at: String(reg?.created_at ?? ''),
      form_data: (reg?.form_data as Record<string, unknown>) ?? {},
    };
  });
}
