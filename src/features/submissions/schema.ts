import { z } from 'zod';

export const SubmitWorkSchema = z.object({
  registration_id: z.string().min(1, 'ID pendaftaran tidak valid.'),
  stage_id: z.string().min(1, 'ID tahapan tidak valid.'),
  kind: z.enum(['file', 'link']).default('file'),
  storage_path: z.string().min(5, 'Path berkas tidak valid.').optional(),
  original_filename: z.string().max(255).optional(),
  mime: z.string().max(100).optional(),
  size_bytes: z.number().int().nonnegative().optional(),
  link_url: z
    .string()
    .url('Tautan URL harus berformat valid (https://...).')
    .refine(
      (val) => {
        try {
          return new URL(val).protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Tautan karya wajib menggunakan protokol HTTPS yang aman.' }
    )
    .optional(),
  notes: z.string().max(1000, 'Catatan maksimal 1000 karakter.').optional(),
}).refine(
  (data) => {
    if (data.kind === 'file') {
      return Boolean(data.storage_path);
    }
    if (data.kind === 'link') {
      return Boolean(data.link_url);
    }
    return true;
  },
  {
    message: 'Harap lampirkan berkas atau tautan karya sesuai jenis pengumpulan.',
    path: ['storage_path'],
  }
);

export type SubmitWorkInput = z.infer<typeof SubmitWorkSchema>;
