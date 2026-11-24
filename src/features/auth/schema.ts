import { z } from 'zod';

export const NewPasswordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter.')
  .regex(/[0-9]/, 'Password minimal 8 karakter dan harus mengandung angka.');

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email wajib diisi')
    .email('Format alamat email tidak valid'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi'),
});

export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Nama lengkap minimal 2 karakter')
      .max(100, 'Nama lengkap maksimal 100 karakter'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, 'Email wajib diisi')
      .email('Format alamat email tidak valid'),
    password: NewPasswordSchema,
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
    institution: z.string().trim().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+-\s]*$/, 'Format nomor telepon tidak valid')
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmPassword'],
  });

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email wajib diisi')
    .email('Format alamat email tidak valid'),
});

export const ResetPasswordSchema = z
  .object({
    password: NewPasswordSchema,
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi kata sandi baru tidak cocok',
    path: ['confirmPassword'],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
    newPassword: NewPasswordSchema,
    confirmPassword: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi kata sandi baru tidak cocok',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Kata sandi baru harus berbeda dari kata sandi saat ini',
    path: ['newPassword'],
  });

export const ProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama lengkap minimal 2 karakter').max(100),
  institution: z.string().trim().max(255, 'Nama instansi maksimal 255 karakter'),
  phone: z
    .string()
    .trim()
    .max(20, 'Nomor telepon maksimal 20 karakter')
    .regex(/^[0-9+-\s]*$/, 'Format nomor telepon tidak valid'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
