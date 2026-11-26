import { z } from 'zod';
import { EducationLevelSchema } from '@/features/auth/schema';
import { BUCKET_RULES, isExtensionMimeMatching } from '@/features/storage/schema';

const ktmFileFields = {
  fileSizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1),
  originalFilename: z
    .string()
    .min(3)
    .max(255)
    .refine((name) => !name.includes('..') && !/[/\\]/.test(name)),
};

export const KtmUploadRequestSchema = z.object(ktmFileFields).superRefine((data, ctx) => {
  const rule = BUCKET_RULES['identity-docs'];
  const extension = `.${data.originalFilename.split('.').pop()?.toLowerCase() || ''}`;

  if (data.fileSizeBytes > rule.maxSizeBytes) {
    ctx.addIssue({
      code: 'custom',
      path: ['fileSizeBytes'],
      message: 'Ukuran KTM maksimal 5 MB.',
    });
  }
  if (!rule.allowedMimeTypes.includes(data.mimeType)) {
    ctx.addIssue({
      code: 'custom',
      path: ['mimeType'],
      message: 'Gunakan berkas JPG, PNG, WEBP, atau PDF.',
    });
  }
  if (!rule.allowedExtensions.includes(extension) || !isExtensionMimeMatching(extension, data.mimeType)) {
    ctx.addIssue({
      code: 'custom',
      path: ['originalFilename'],
      message: 'Ekstensi berkas tidak sesuai dengan tipe file.',
    });
  }
});

export const KtmUploadConfirmationSchema = z.object({
  ...ktmFileFields,
  storagePath: z.string().min(1).max(500),
});

export const ReviewKtmSchema = z
  .object({
    identityVerificationId: z.string().uuid(),
    registrationId: z.string().uuid(),
    decision: z.enum(['verified', 'rejected']),
    note: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.decision !== 'rejected' || (data.note?.length ?? 0) >= 10, {
    message: 'Alasan penolakan minimal 10 karakter.',
    path: ['note'],
  });

export const GrantUserRoleSchema = z
  .object({
    userId: z.string().min(1, 'ID pengguna tidak valid.'),
    role: z.enum(['juri', 'panitia', 'super_admin']),
    competitionId: z.string().min(1).optional(),
  })
  .refine((data) => data.role === 'super_admin' || Boolean(data.competitionId), {
    message: 'Pilih lomba untuk peran juri atau panitia.',
    path: ['competitionId'],
  })
  .refine((data) => data.role !== 'super_admin' || !data.competitionId, {
    message: 'Peran super admin berlaku global.',
    path: ['competitionId'],
  });

export const RevokeUserRoleSchema = z.object({
  userRoleId: z.string().uuid(),
});

export const UpdateEducationLevelAsAdminSchema = z.object({
  userId: z.string().uuid(),
  educationLevel: EducationLevelSchema,
});

export type KtmUploadRequest = z.infer<typeof KtmUploadRequestSchema>;
export type KtmUploadConfirmation = z.infer<typeof KtmUploadConfirmationSchema>;
export type EducationLevel = z.infer<typeof EducationLevelSchema>;
