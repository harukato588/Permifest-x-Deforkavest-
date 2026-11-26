'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requirePermission, requireRole, requireUser } from '@/lib/auth/session';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { ProfileSchema, type ProfileInput } from '@/features/auth/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import { isExtensionMimeMatching, sanitizeFilename } from '@/features/storage/schema';
import { z } from 'zod';
import {
  GrantUserRoleSchema,
  KtmUploadConfirmationSchema,
  KtmUploadRequestSchema,
  ReviewKtmSchema,
  RevokeUserRoleSchema,
  UpdateEducationLevelAsAdminSchema,
} from './schema';

export async function updateProfileAction(rawInput: ProfileInput) {
  const parsed = ProfileSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      message: Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Data profil tidak valid.',
    };
  }

  const user = await requireUser();
  const admin = createAdminClient();
  if (parsed.data.educationLevel && !user.roles.includes('peserta')) {
    return { success: false, message: 'Hanya peserta yang dapat mengubah status pendidikannya.' };
  }

  if (parsed.data.educationLevel) {
    const { data: currentProfile, error: profileError } = await admin
      .from('users')
      .select('education_level')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return { success: false, message: 'Status pendidikan gagal diperiksa. Coba lagi.' };
    }

    if (currentProfile?.education_level !== parsed.data.educationLevel) {
      const { data: registration, error: registrationError } = await admin
        .from('registrations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (registrationError) {
        return { success: false, message: 'Status pendidikan gagal diperiksa. Coba lagi.' };
      }

      if (registration) {
        return {
          success: false,
          message: 'Status pendidikan terkunci setelah pendaftaran pertama. Hubungi super admin untuk koreksi.',
        };
      }
    }
  }

  const { data, error } = await admin
    .from('users')
    .update({
      full_name: parsed.data.fullName,
      institution: parsed.data.institution || null,
      phone: parsed.data.phone || null,
      ...(parsed.data.educationLevel ? { education_level: parsed.data.educationLevel } : {}),
    })
    .eq('id', user.id)
    .select('full_name, institution, phone, education_level')
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
      education_level: data.education_level,
    },
  };
}

export async function createKtmUploadUrlAction(rawInput: unknown) {
  const parsed = KtmUploadRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data berkas KTM tidak valid.',
    };
  }

  const user = await requireUser();
  if (!user.roles.includes('peserta')) {
    return { success: false, error: 'Hanya peserta yang dapat mengunggah KTM.' };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('education_level')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    return { success: false, error: 'Status pendidikan gagal diperiksa. Coba lagi.' };
  }
  if (profile?.education_level !== 'mahasiswa') {
    return { success: false, error: 'Unggah KTM hanya tersedia untuk peserta berstatus mahasiswa.' };
  }

  const { data: existing, error: existingError } = await admin
    .from('identity_verifications')
    .select('status')
    .eq('user_id', user.id)
    .eq('document_type', 'ktm')
    .maybeSingle();
  if (existingError) {
    return { success: false, error: 'Status KTM gagal diperiksa. Coba lagi.' };
  }
  if (existing && existing.status !== 'rejected') {
    return { success: false, error: 'KTM sudah dikirim dan tidak dapat diganti kecuali ditolak panitia.' };
  }

  const filename = sanitizeFilename(parsed.data.originalFilename);
  const extension = `.${filename.split('.').pop() || ''}`;
  if (!isExtensionMimeMatching(extension, parsed.data.mimeType)) {
    return { success: false, error: 'Ekstensi berkas tidak sesuai dengan tipe file.' };
  }

  const storagePath = `${user.id}/${randomUUID()}${extension}`;
  const { data, error } = await admin.storage
    .from('identity-docs')
    .createSignedUploadUrl(storagePath);
  if (error || !data) {
    return { success: false, error: 'Tautan unggah KTM gagal dibuat. Coba lagi.' };
  }

  return {
    success: true,
    data: {
      signedUrl: data.signedUrl,
      storagePath,
    },
  };
}

export async function confirmKtmUploadAction(rawInput: unknown) {
  const parsed = KtmUploadConfirmationSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data konfirmasi KTM tidak valid.',
    };
  }

  const user = await requireUser();
  if (!user.roles.includes('peserta')) {
    return { success: false, error: 'Hanya peserta yang dapat mengirim KTM.' };
  }
  if (!parsed.data.storagePath.startsWith(`${user.id}/`)) {
    return { success: false, error: 'Berkas KTM tidak cocok dengan akun ini.' };
  }

  const filename = sanitizeFilename(parsed.data.originalFilename);
  const extension = `.${filename.split('.').pop() || ''}`;
  if (!isExtensionMimeMatching(extension, parsed.data.mimeType)) {
    return { success: false, error: 'Ekstensi berkas tidak sesuai dengan tipe file.' };
  }

  const supabase = await createServerSupabase();
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('education_level')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || profile?.education_level !== 'mahasiswa') {
    return { success: false, error: 'Status pendidikan mahasiswa diperlukan untuk mengunggah KTM.' };
  }

  const { data: existing, error: existingError } = await supabase
    .from('identity_verifications')
    .select('id,status')
    .eq('user_id', user.id)
    .eq('document_type', 'ktm')
    .maybeSingle();
  if (existingError) {
    return { success: false, error: 'Status KTM gagal diperiksa. Coba lagi.' };
  }
  if (existing && existing.status !== 'rejected') {
    return { success: false, error: 'KTM sudah dikirim dan tidak dapat diganti kecuali ditolak panitia.' };
  }

  const admin = createAdminClient();
  const { data: file, error: fileError } = await admin.storage
    .from('identity-docs')
    .download(parsed.data.storagePath);
  if (fileError || !file) {
    return { success: false, error: 'Berkas KTM tidak ditemukan. Unggah ulang berkas tersebut.' };
  }
  if (file.size !== parsed.data.fileSizeBytes || file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'Ukuran berkas yang diterima tidak sesuai. Unggah ulang KTM.' };
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPdf = String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const isWebp =
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  const detectedMime = isPdf
    ? 'application/pdf'
    : isJpeg
      ? 'image/jpeg'
      : isPng
        ? 'image/png'
        : isWebp
          ? 'image/webp'
          : null;

  if (!detectedMime || detectedMime !== parsed.data.mimeType) {
    return { success: false, error: 'Isi berkas tidak cocok dengan format yang dipilih. Unggah ulang KTM.' };
  }

  const { data: current, error: currentError } = await supabase
    .from('identity_verifications')
    .select('id,status')
    .eq('user_id', user.id)
    .eq('document_type', 'ktm')
    .maybeSingle();
  if (currentError || (current && current.status !== 'rejected')) {
    return { success: false, error: 'Status KTM berubah. Muat ulang profil sebelum mencoba lagi.' };
  }

  const now = new Date().toISOString();
  const result = current
    ? await admin
        .from('identity_verifications')
        .update({
          storage_path: parsed.data.storagePath,
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          note: null,
          updated_at: now,
        })
        .eq('id', current.id)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle()
    : await admin
        .from('identity_verifications')
        .insert({
          user_id: user.id,
          document_type: 'ktm',
          storage_path: parsed.data.storagePath,
          status: 'pending',
        })
        .select('id')
        .maybeSingle();

  if (result.error || !result.data) {
    return { success: false, error: 'KTM gagal disimpan. Coba muat ulang halaman lalu unggah lagi.' };
  }

  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: user.role,
    action: 'identity.submit',
    entity_type: 'identity_verifications',
    entity_id: result.data.id,
    payload: { document_type: 'ktm', file_size_bytes: file.size },
  });
  if (auditError) {
    return { success: false, error: 'KTM tersimpan, tetapi pencatatan audit gagal. Hubungi pengelola.' };
  }

  revalidatePath('/dashboard/peserta/profil');
  revalidatePath('/dashboard/admin/peserta');
  return {
    success: true,
    data: { identityVerificationId: result.data.id },
    message: 'KTM berhasil dikirim dan menunggu pemeriksaan panitia.',
  };
}

export async function getKtmDownloadUrlAction(identityVerificationId: string) {
  await requireRole(['panitia', 'super_admin']);
  const id = z.string().uuid().safeParse(identityVerificationId);
  if (!id.success) {
    return { success: false, error: 'Identitas berkas KTM tidak valid.' };
  }

  const supabase = await createServerSupabase();
  const { data: verification, error: verificationError } = await supabase
    .from('identity_verifications')
    .select('storage_path')
    .eq('id', id.data)
    .eq('document_type', 'ktm')
    .maybeSingle();
  if (verificationError || !verification) {
    return { success: false, error: 'KTM tidak ditemukan atau berada di luar cakupan akses kamu.' };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from('identity-docs')
    .createSignedUrl(verification.storage_path, 300, { download: true });
  if (error || !data) {
    return { success: false, error: 'Tautan unduh KTM gagal dibuat. Coba lagi.' };
  }

  return { success: true, url: data.signedUrl };
}

export async function getAssignedSubmissionDownloadUrlAction(assignmentId: string) {
  const user = await requireRole(['juri']);
  const id = z.string().uuid().safeParse(assignmentId);
  if (!id.success) {
    return { success: false, error: 'Penugasan tidak valid.' };
  }

  const admin = createAdminClient();
  const { data: assignment, error: assignmentError } = await admin
    .from('judge_assignments')
    .select('submission:submissions!judge_assignments_submission_id_fkey(storage_path)')
    .eq('id', id.data)
    .eq('judge_id', user.id)
    .maybeSingle();
  const submission = assignment?.submission;
  const storagePath =
    Array.isArray(submission) && submission[0] && typeof submission[0] === 'object'
      ? (submission[0] as { storage_path?: string }).storage_path
      : submission && typeof submission === 'object'
        ? (submission as { storage_path?: string }).storage_path
        : undefined;
  if (assignmentError || !storagePath) {
    return { success: false, error: 'Karya tidak ditemukan atau bukan bagian dari penugasan kamu.' };
  }

  const { data, error } = await admin.storage
    .from('submissions')
    .createSignedUrl(storagePath, 300, { download: true });
  if (error || !data) {
    return { success: false, error: 'Tautan unduh karya gagal dibuat. Coba lagi.' };
  }

  return { success: true, url: data.signedUrl };
}

export async function reviewKtmAction(rawInput: unknown) {
  const parsed = ReviewKtmSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data pemeriksaan KTM tidak valid.',
    };
  }

  const actor = await requirePermission('registrations.update');
  const supabase = await createServerSupabase();
  const { data: verification, error: verificationError } = await supabase
    .from('identity_verifications')
    .select('id,user_id,status')
    .eq('id', parsed.data.identityVerificationId)
    .eq('document_type', 'ktm')
    .maybeSingle();
  if (verificationError || !verification) {
    return { success: false, error: 'KTM tidak ditemukan atau berada di luar cakupan lomba kamu.' };
  }
  if (verification.status !== 'pending') {
    return { success: false, error: 'KTM ini sudah diperiksa. Muat ulang daftar peserta.' };
  }

  const { data: registration, error: registrationError } = await supabase
    .from('registrations')
    .select('id,competition_id')
    .eq('id', parsed.data.registrationId)
    .eq('user_id', verification.user_id)
    .maybeSingle();
  if (registrationError || !registration) {
    return { success: false, error: 'Pendaftaran tidak ditemukan atau berada di luar cakupan akses kamu.' };
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from('identity_verifications')
    .update({
      status: parsed.data.decision,
      reviewed_by: actor.id,
      reviewed_at: now,
      note: parsed.data.decision === 'rejected' ? parsed.data.note?.trim() : null,
      updated_at: now,
    })
    .eq('id', verification.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();
  if (updateError || !updated) {
    return { success: false, error: 'Status KTM gagal diperbarui. Muat ulang daftar peserta.' };
  }

  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: actor.id,
    actor_role: actor.role,
    action: parsed.data.decision === 'verified' ? 'identity.verify' : 'identity.reject',
    entity_type: 'identity_verifications',
    entity_id: verification.id,
    competition_id: registration.competition_id,
    payload: {
      registration_id: registration.id,
      note: parsed.data.decision === 'rejected' ? parsed.data.note?.trim() : null,
    },
  });
  if (auditError) {
    return { success: false, error: 'Status KTM berubah, tetapi pencatatan audit gagal. Hubungi pengelola.' };
  }

  revalidatePath('/dashboard/admin/peserta');
  revalidatePath('/dashboard/peserta/profil');
  return { success: true, message: parsed.data.decision === 'verified' ? 'KTM diterima.' : 'KTM ditolak.' };
}

export async function grantUserRoleAction(rawInput: unknown) {
  const parsed = GrantUserRoleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Data peran tidak valid.' };
  }

  const actor = await requirePermission('users.manage');
  if (parsed.data.userId === actor.id) {
    return { success: false, error: 'Kamu tidak dapat mengubah peran akun yang sedang digunakan.' };
  }

  const admin = createAdminClient();
  const [{ data: target, error: targetError }, { data: role, error: roleError }] = await Promise.all([
    admin.from('users').select('id').eq('id', parsed.data.userId).maybeSingle(),
    admin.from('roles').select('id').eq('key', parsed.data.role).maybeSingle(),
  ]);
  if (targetError || roleError || !target || !role) {
    return { success: false, error: 'Akun atau peran tidak ditemukan.' };
  }

  if (parsed.data.competitionId) {
    const { data: competition, error: competitionError } = await admin
      .from('competitions')
      .select('id')
      .eq('id', parsed.data.competitionId)
      .maybeSingle();
    if (competitionError || !competition) {
      return { success: false, error: 'Lomba yang dipilih tidak ditemukan.' };
    }
  }

  let existingQuery = admin
    .from('user_roles')
    .select('id')
    .eq('user_id', parsed.data.userId)
    .eq('role_id', role.id);
  existingQuery = parsed.data.competitionId
    ? existingQuery.eq('competition_id', parsed.data.competitionId)
    : existingQuery.is('competition_id', null);
  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) {
    return { success: false, error: 'Peran akun gagal diperiksa. Coba lagi.' };
  }
  if (existing) {
    return { success: false, error: 'Akun ini sudah memiliki peran tersebut pada cakupan yang dipilih.' };
  }

  const { data: granted, error: grantError } = await admin
    .from('user_roles')
    .insert({
      user_id: parsed.data.userId,
      role_id: role.id,
      competition_id: parsed.data.competitionId ?? null,
      granted_by: actor.id,
    })
    .select('id')
    .maybeSingle();
  if (grantError || !granted) {
    return { success: false, error: 'Peran gagal diberikan. Coba lagi.' };
  }

  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: actor.id,
    actor_role: actor.role,
    action: 'role.grant',
    entity_type: 'user_roles',
    entity_id: granted.id,
    competition_id: parsed.data.competitionId ?? null,
    payload: { user_id: parsed.data.userId, role: parsed.data.role },
  });
  if (auditError) {
    return { success: false, error: 'Peran telah diberikan, tetapi pencatatan audit gagal. Hubungi pengelola.' };
  }

  revalidatePath('/dashboard/admin/pengguna');
  return { success: true, message: 'Peran berhasil diberikan.' };
}

export async function revokeUserRoleAction(rawInput: unknown) {
  const parsed = RevokeUserRoleSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Data peran tidak valid.' };
  }

  const actor = await requirePermission('users.manage');
  const admin = createAdminClient();
  const { data: assignment, error: assignmentError } = await admin
    .from('user_roles')
    .select('id,user_id,competition_id,role_id,roles(key)')
    .eq('id', parsed.data.userRoleId)
    .maybeSingle();
  if (assignmentError || !assignment) {
    return { success: false, error: 'Penugasan peran tidak ditemukan.' };
  }
  const roleRelation = assignment.roles;
  const roleKey =
    Array.isArray(roleRelation) && roleRelation[0] && typeof roleRelation[0] === 'object'
      ? (roleRelation[0] as { key?: string }).key
      : roleRelation && typeof roleRelation === 'object'
        ? (roleRelation as { key?: string }).key
        : undefined;
  if (roleKey === 'peserta') {
    return { success: false, error: 'Peran peserta dibuat otomatis dan tidak dapat dicabut di sini.' };
  }
  if (assignment.user_id === actor.id) {
    return { success: false, error: 'Kamu tidak dapat mengubah peran akun yang sedang digunakan.' };
  }

  if (roleKey === 'super_admin') {
    const { count, error: countError } = await admin
      .from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('role_id', assignment.role_id)
      .is('competition_id', null);
    if (countError) {
      return { success: false, error: 'Jumlah super admin gagal diperiksa. Coba lagi.' };
    }
    if ((count ?? 0) <= 1) {
      return { success: false, error: 'Peran super admin terakhir tidak dapat dicabut.' };
    }
  }

  const { error: deleteError } = await admin.from('user_roles').delete().eq('id', assignment.id);
  if (deleteError) {
    return { success: false, error: 'Peran gagal dicabut. Coba lagi.' };
  }

  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: actor.id,
    actor_role: actor.role,
    action: 'role.revoke',
    entity_type: 'user_roles',
    entity_id: assignment.id,
    competition_id: assignment.competition_id,
    payload: { user_id: assignment.user_id, role: roleKey },
  });
  if (auditError) {
    return { success: false, error: 'Peran telah dicabut, tetapi pencatatan audit gagal. Hubungi pengelola.' };
  }

  revalidatePath('/dashboard/admin/pengguna');
  return { success: true, message: 'Peran berhasil dicabut.' };
}

export async function updateEducationLevelAsAdminAction(rawInput: unknown) {
  const parsed = UpdateEducationLevelAsAdminSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Data pendidikan tidak valid.' };
  }

  const actor = await requirePermission('users.manage');
  if (parsed.data.userId === actor.id) {
    return { success: false, error: 'Kamu tidak dapat mengubah status pendidikan akun yang sedang digunakan.' };
  }

  const admin = createAdminClient();
  const { data: previous, error: previousError } = await admin
    .from('users')
    .select('education_level')
    .eq('id', parsed.data.userId)
    .maybeSingle();
  if (previousError || !previous) {
    return { success: false, error: 'Profil peserta tidak ditemukan.' };
  }

  const { error: updateError } = await admin
    .from('users')
    .update({ education_level: parsed.data.educationLevel, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.userId);
  if (updateError) {
    return { success: false, error: 'Status pendidikan gagal diperbarui. Coba lagi.' };
  }

  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: actor.id,
    actor_role: actor.role,
    action: 'user.education_level.update',
    entity_type: 'users',
    entity_id: parsed.data.userId,
    payload: {
      old_education_level: previous.education_level,
      new_education_level: parsed.data.educationLevel,
    },
  });
  if (auditError) {
    return { success: false, error: 'Status pendidikan berubah, tetapi pencatatan audit gagal. Hubungi pengelola.' };
  }

  revalidatePath('/dashboard/admin/pengguna');
  revalidatePath('/dashboard/admin/peserta');
  return { success: true, message: 'Status pendidikan peserta berhasil diperbarui.' };
}
