import 'server-only';

import { connection } from 'next/server';
import type { AppRole } from '@/lib/auth/types';
import { requirePermission, requireRole } from '@/lib/auth/session';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ParticipantProfileData {
  educationLevel: 'mahasiswa' | 'sma_smk' | 'umum' | null;
  hasRegistrations: boolean;
  ktm: {
    id: string;
    status: 'pending' | 'verified' | 'rejected';
    note: string | null;
    updatedAt: string;
  } | null;
}

export interface ManagedParticipant {
  registrationId: string;
  userId: string;
  competitionId: string;
  competitionName: string;
  registrationStatus: string;
  registeredAt: string;
  fullName: string;
  email: string;
  institution: string;
  phone: string;
  educationLevel: string | null;
  ktm: {
    id: string;
    status: string;
    note: string | null;
  } | null;
}

export interface AssignedParticipantWork {
  assignmentId: string;
  anonymousId: string;
  competitionName: string;
  status: 'assigned' | 'in_progress' | 'submitted';
  version: number;
  hasFile: boolean;
  linkUrl: string | null;
}

export interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  institution: string;
  phone: string;
  educationLevel: string | null;
  createdAt: string;
  roles: Array<{
    assignmentId: string;
    role: AppRole;
    competitionId: string | null;
    competitionName: string | null;
  }>;
}

export interface RoleCompetitionOption {
  id: string;
  name: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  return Array.isArray(value) ? asRecord(value[0]) : asRecord(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function assignmentStatus(value: unknown): AssignedParticipantWork['status'] {
  if (value === 'assigned' || value === 'in_progress' || value === 'submitted') {
    return value;
  }
  throw new Error('Status penugasan juri tidak valid.');
}

function roleValue(value: unknown): AppRole | null {
  return value === 'peserta' || value === 'juri' || value === 'panitia' || value === 'super_admin'
    ? value
    : null;
}

export async function getParticipantProfileData(): Promise<ParticipantProfileData> {
  await connection();
  const user = await requireRole(['peserta']);
  const admin = createAdminClient();
  const [profileResult, registrationResult, ktmResult] = await Promise.all([
    admin.from('users').select('education_level').eq('id', user.id).maybeSingle(),
    admin.from('registrations').select('id').eq('user_id', user.id).limit(1).maybeSingle(),
    admin
      .from('identity_verifications')
      .select('id,status,note,updated_at')
      .eq('user_id', user.id)
      .eq('document_type', 'ktm')
      .maybeSingle(),
  ]);

  if (profileResult.error || registrationResult.error || ktmResult.error) {
    throw new Error('Profil peserta gagal dimuat. Muat ulang halaman untuk mencoba lagi.');
  }

  const educationLevel = profileResult.data?.education_level;
  const ktmStatus = ktmResult.data?.status;
  const ktm =
    ktmResult.data && (ktmStatus === 'pending' || ktmStatus === 'verified' || ktmStatus === 'rejected')
      ? {
          id: ktmResult.data.id,
          status: ktmStatus,
          note: nullableString(ktmResult.data.note),
          updatedAt: stringValue(ktmResult.data.updated_at),
        }
      : null;

  return {
    educationLevel:
      educationLevel === 'mahasiswa' || educationLevel === 'sma_smk' || educationLevel === 'umum'
        ? educationLevel
        : null,
    hasRegistrations: Boolean(registrationResult.data),
    ktm,
  };
}

export async function getManagedParticipants(): Promise<ManagedParticipant[]> {
  await connection();
  await requirePermission('registrations.read');
  const supabase = await createServerSupabase();
  const pageSize = 500;
  const rows: unknown[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        user_id,
        competition_id,
        status,
        created_at,
        competition:competitions!registrations_competition_id_fkey(id,name),
        participant:users!registrations_user_id_fkey(
          id,
          full_name,
          email,
          institution,
          phone,
          education_level,
          identity_verifications(id,document_type,status,note)
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Data peserta gagal dimuat: ${error.message}`);
    }

    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows.flatMap((value) => {
    const row = asRecord(value);
    const participant = firstRecord(row?.participant);
    const competition = firstRecord(row?.competition);
    if (!row || !participant || !competition) return [];

    const verifications = Array.isArray(participant.identity_verifications)
      ? participant.identity_verifications
      : [];
    const ktmRow = verifications
      .map(asRecord)
      .find((verification) => verification?.document_type === 'ktm');

    return [{
      registrationId: stringValue(row.id),
      userId: stringValue(row.user_id),
      competitionId: stringValue(row.competition_id),
      competitionName: stringValue(competition.name),
      registrationStatus: stringValue(row.status),
      registeredAt: stringValue(row.created_at),
      fullName: stringValue(participant.full_name),
      email: stringValue(participant.email),
      institution: stringValue(participant.institution),
      phone: stringValue(participant.phone),
      educationLevel: nullableString(participant.education_level),
      ktm: ktmRow
        ? {
            id: stringValue(ktmRow.id),
            status: stringValue(ktmRow.status),
            note: nullableString(ktmRow.note),
          }
        : null,
    }];
  });
}

export async function getAssignedParticipantWork(): Promise<AssignedParticipantWork[]> {
  await connection();
  const user = await requireRole(['juri']);
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('judge_assignments')
    .select(`
      id,
      status,
      submission:submissions!judge_assignments_submission_id_fkey(
        version,
        storage_path,
        link_url,
        registration:registrations!submissions_registration_id_fkey(
          competition:competitions!registrations_competition_id_fkey(name)
        )
      )
    `)
    .eq('judge_id', user.id)
    .order('assigned_at', { ascending: false });

  if (error) {
    throw new Error(`Penugasan juri gagal dimuat: ${error.message}`);
  }

  return (data ?? []).flatMap((value) => {
    const row = asRecord(value);
    const submission = firstRecord(row?.submission);
    const registration = firstRecord(submission?.registration);
    const competition = firstRecord(registration?.competition);
    if (!row || !submission || !competition) return [];

    const assignmentId = stringValue(row.id);
    return [{
      assignmentId,
      anonymousId: `Karya ${assignmentId.slice(0, 8).toUpperCase()}`,
      competitionName: stringValue(competition.name),
      status: assignmentStatus(row.status),
      version: typeof submission.version === 'number' ? submission.version : 1,
      hasFile: Boolean(submission.storage_path),
      linkUrl: nullableString(submission.link_url),
    }];
  });
}

export async function getAssignedParticipantWorkDetail(
  assignmentId: string,
): Promise<AssignedParticipantWork | null> {
  const works = await getAssignedParticipantWork();
  return works.find((work) => work.assignmentId === assignmentId) ?? null;
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  await connection();
  await requirePermission('users.manage');
  const supabase = await createServerSupabase();
  const [{ data: users, error: usersError }, { data: assignments, error: assignmentsError }] =
    await Promise.all([
      supabase
        .from('users')
        .select('id,full_name,email,institution,phone,education_level,created_at')
        .is('deleted_at', null)
        .order('full_name'),
      supabase
        .from('user_roles')
        .select('id,user_id,competition_id,role:roles!user_roles_role_id_fkey(key),competition:competitions!user_roles_competition_id_fkey(name)'),
    ]);

  if (usersError || assignmentsError) {
    throw new Error('Daftar pengguna dan peran gagal dimuat.');
  }

  const rolesByUser = new Map<string, ManagedUser['roles']>();
  for (const value of assignments ?? []) {
    const row = asRecord(value);
    const roleRow = firstRecord(row?.role);
    const role = roleValue(roleRow?.key);
    if (!row || !role) continue;

    const userId = stringValue(row.user_id);
    const userRoles = rolesByUser.get(userId) ?? [];
    const competition = firstRecord(row.competition);
    userRoles.push({
      assignmentId: stringValue(row.id),
      role,
      competitionId: nullableString(row.competition_id),
      competitionName: nullableString(competition?.name),
    });
    rolesByUser.set(userId, userRoles);
  }

  return (users ?? []).flatMap((value) => {
    const row = asRecord(value);
    if (!row) return [];
    return [{
      id: stringValue(row.id),
      fullName: stringValue(row.full_name),
      email: stringValue(row.email),
      institution: stringValue(row.institution),
      phone: stringValue(row.phone),
      educationLevel: nullableString(row.education_level),
      createdAt: stringValue(row.created_at),
      roles: rolesByUser.get(stringValue(row.id)) ?? [],
    }];
  });
}

export async function getRoleCompetitionOptions(): Promise<RoleCompetitionOption[]> {
  await connection();
  await requirePermission('users.manage');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('competitions')
    .select('id,name')
    .order('name');

  if (error) {
    throw new Error(`Daftar lomba untuk penugasan peran gagal dimuat: ${error.message}`);
  }

  return (data ?? []).map((competition) => ({
    id: stringValue(competition.id),
    name: stringValue(competition.name),
  }));
}
