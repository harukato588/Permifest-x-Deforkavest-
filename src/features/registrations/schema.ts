import { z } from 'zod';

// ─── Skema Pendaftaran Kompetisi ───────────────────────────────────────────
export const RegisterCompetitionSchema = z.object({
  competition_id: z.guid('ID kompetisi tidak valid.'),
  form_data: z.record(z.string(), z.unknown()).default({}),
  team_name: z.string().min(1).max(100).optional(),
  team_members: z
    .array(
      z.object({
        full_name: z.string().min(1),
        email: z.string().email().optional(),
        institution: z.string().optional(),
      })
    )
    .optional(),
});

export type RegisterCompetitionInput = z.infer<typeof RegisterCompetitionSchema>;

// ─── Skema Unggah Bukti Pembayaran ────────────────────────────────────────
export const UploadPaymentProofSchema = z.object({
  registration_id: z.string().uuid('ID pendaftaran tidak valid.'),
  proof_path: z.string().min(5, 'Path berkas tidak valid.'),
});

export type UploadPaymentProofInput = z.infer<typeof UploadPaymentProofSchema>;

// ─── Skema Verifikasi Pembayaran (Admin) ─────────────────────────────────
export const VerifyPaymentSchema = z.object({
  payment_id: z.string().uuid('ID pembayaran tidak valid.'),
  action: z.enum(['approve', 'reject']),
  reject_reason: z.string().max(500).optional(),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
