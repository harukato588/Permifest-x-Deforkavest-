export type AppRole = 'peserta' | 'juri' | 'panitia' | 'super_admin';

export type AppPermission =
  | 'dashboard.view'
  | 'competitions.read'
  | 'competitions.write'
  | 'registrations.create'
  | 'registrations.read'
  | 'registrations.update'
  | 'payments.upload'
  | 'payments.verify'
  | 'submissions.create'
  | 'submissions.read'
  | 'assignments.manage'
  | 'scores.submit'
  | 'scores.monitor'
  | 'scores.lock'
  | 'scores.override'
  | 'results.write'
  | 'announcements.publish'
  | 'users.manage'
  | 'system.settings'
  | 'audit.read';

export interface AuthSessionUser {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  roles: AppRole[];
  institution?: string;
  phone?: string;
  education_level?: 'mahasiswa' | 'sma_smk' | 'umum' | null;
  avatar_url?: string;
  is_verified?: boolean;
  assurance_level?: 'aal1' | 'aal2' | null;
}
