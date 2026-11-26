import { z } from 'zod';

export const FormFieldOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Label field wajib diisi'),
  type: z.enum(['text', 'number', 'email', 'url', 'select', 'textarea', 'file']),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  helperText: z.string().optional(),
});

export const SubmissionConfigSchema = z.object({
  allowedTypes: z.array(z.string()).default(['.pdf', '.docx']),
  maxSizeBytes: z.number().positive().default(15728640), // 15MB
  requiresDiagram: z.boolean().default(false),
  allowSeparateDiagram: z.boolean().default(false),
  linkType: z.string().optional(),
});

export const ScoringConfigSchema = z.object({
  judges_per_submission: z.number().int().min(1).default(2),
  blind: z.boolean().default(false),
  aggregation: z.enum(['mean', 'weighted_mean', 'trimmed_mean']).default('mean'),
});

export const StageSchema = z.object({
  id: z.string().optional(),
  competition_id: z.string().optional(),
  name: z.string().min(2, 'Nama tahap wajib diisi'),
  key: z.string().min(2, 'Slug/key tahap wajib diisi'),
  position: z.number().int().min(1).default(1),
  starts_at: z.string().optional().nullable(),
  submission_deadline: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
  is_active: z.boolean().default(false),
});

export const RubricCriterionSchema = z.object({
  id: z.string().optional(),
  competition_id: z.string().optional(),
  stage_id: z.string().optional().nullable(),
  name: z.string().min(2, 'Nama kriteria wajib diisi'),
  description: z.string().optional().nullable(),
  max_score: z.number().min(1).default(100),
  weight: z.number().min(0).max(100),
  position: z.number().int().default(1),
});

export const CompetitionUpsertSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(3, 'Nama kompetisi minimal 3 karakter'),
  slug: z
    .string()
    .min(2, 'Slug minimal 2 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda strip (-)'),
  type: z.enum(['academic', 'esport', 'non_academic']).default('academic'),
  category: z.string().min(2, 'Kategori kompetisi wajib diisi'),
  participation_type: z.enum(['individual', 'team']).default('individual'),
  min_team_size: z.number().int().min(1).default(1),
  max_team_size: z.number().int().min(1).default(1),
  reserve_max: z.number().int().min(0).default(0),
  description: z.string().min(5, 'Deskripsi lomba wajib diisi'),
  theme: z.string().optional().default('Cybersecurity'),
  registration_fee: z.number().min(0, 'Biaya pendaftaran tidak boleh negatif').default(0),
  quota: z.number().int().positive('Kuota harus berupa angka positif').optional().nullable(),
  requires_identity_verification: z.boolean().default(false),
  registration_open_at: z.string().optional().nullable(),
  registration_close_at: z.string().optional().nullable(),
  is_published: z.boolean().default(false),
  payment_qr_url: z.string().optional().nullable(),
  form_fields: z.array(FormFieldOptionSchema).default([]),
  submission_config: SubmissionConfigSchema.optional().default({
    allowedTypes: ['.pdf', '.docx'],
    maxSizeBytes: 15728640,
    requiresDiagram: false,
    allowSeparateDiagram: false,
  }),
  scoring_config: ScoringConfigSchema.optional().default({
    judges_per_submission: 2,
    blind: false,
    aggregation: 'mean',
  }),
});

export type CompetitionUpsertInput = z.infer<typeof CompetitionUpsertSchema>;
export type StageInput = z.infer<typeof StageSchema>;
export type RubricCriterionInput = z.infer<typeof RubricCriterionSchema>;
