// ============================================================================
// Permifest x Deforkafest: Comprehensive Types
// ============================================================================

export type UserRole = 'peserta' | 'juri' | 'panitia' | 'super_admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  institution?: string;
  phone?: string;
  education_level?: 'mahasiswa' | 'sma_smk' | 'umum' | null;
  avatar_url?: string | null;
  role: UserRole;
  email_verified: boolean;
  created_at?: string;
}

export type CompetitionCategory = 'esai' | 'uiux' | 'it_system_arch' | 'pes' | 'ml';
export type CompetitionType = 'academic' | 'non_academic';
export type ParticipationType = 'individual' | 'team';

export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'url' | 'select' | 'textarea' | 'file';
  placeholder?: string;
  required: boolean;
  options?: string[];
  helperText?: string;
}

export interface SubmissionConfig {
  allowedTypes: string[]; // e.g. ['.pdf', '.docx'] or ['figma_url']
  maxSizeBytes?: number; // e.g. 20971520 (20MB)
  requiresDiagram?: boolean;
  allowSeparateDiagram?: boolean;
}

export interface Competition {
  id: string;
  slug: string;
  name: string;
  type: CompetitionType;
  category: CompetitionCategory;
  participation_type: ParticipationType;
  min_team_size: number;
  max_team_size: number;
  description: string;
  theme: string;
  registration_fee: number; // in IDR (0 = free)
  quota?: number;
  registered_count: number;
  requires_identity_verification: boolean;
  registration_open_at: string;
  registration_close_at: string;
  is_published: boolean;
  payment_qr_url?: string;
  form_fields: FormFieldConfig[];
  submission_config: SubmissionConfig;
  stages: Stage[];
}

export interface Stage {
  id: string;
  competition_id: string;
  name: string; // 'Penyisihan' | 'Final'
  slug: string;
  stage_order: number;
  submission_open_at: string;
  submission_close_at: string;
  is_active: boolean;
}

export type RegistrationStatus = 'pending' | 'payment_pending' | 'verified' | 'rejected' | 'cancelled';

export interface Registration {
  id: string;
  user_id: string;
  competition_id: string;
  competition?: Competition;
  user?: User;
  team_id?: string;
  team?: Team;
  form_data: Record<string, unknown>;
  status: RegistrationStatus;
  payment?: Payment;
  registered_at: string;
}

export interface Team {
  id: string;
  competition_id: string;
  name: string;
  captain_id: string;
  captain?: User;
  invite_code: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  user?: User;
  role: 'captain' | 'member' | 'substitute';
  joined_at: string;
}

export type PaymentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export interface Payment {
  id: string;
  registration_id: string;
  amount: number;
  proof_url?: string;
  proof_name?: string;
  status: PaymentStatus;
  verified_by?: string;
  rejection_reason?: string;
  uploaded_at?: string;
  verified_at?: string;
}

export interface Submission {
  id: string;
  registration_id: string;
  stage_id: string;
  stage?: Stage;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  link_url?: string;
  additional_files?: { name: string; url: string; size: number }[];
  notes?: string;
  submitted_at: string;
  version: number;
  is_latest: boolean;
  // Included relations
  registration?: Registration;
  scores?: Score[];
  final_score?: number;
}

export interface RubricCriteria {
  id: string;
  competition_id: string;
  stage_id?: string;
  name: string;
  description: string;
  max_score: number;
  weight: number; // 0.0 to 1.0 (sum should be 1.0)
  sort_order: number;
}

export interface JudgeAssignment {
  id: string;
  judge_id: string;
  submission_id: string;
  judge?: User;
  submission?: Submission;
  status: 'assigned' | 'in_progress' | 'completed';
  assigned_at: string;
  completed_at?: string;
  scores?: Score[];
}

export interface Score {
  id: string;
  judge_assignment_id: string;
  rubric_criteria_id: string;
  rubric_criteria?: RubricCriteria;
  score: number;
  comment?: string;
  is_locked: boolean;
  locked_by?: string;
  locked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreChangeLog {
  id: string;
  score_id: string;
  old_score: number;
  new_score: number;
  old_comment?: string;
  new_comment?: string;
  reason: string;
  changed_by: string;
  changed_by_user?: User;
  changed_at: string;
}

export interface MatchResult {
  id: string;
  competition_id: string;
  stage_id?: string;
  registration_id?: string;
  team_id?: string;
  participant_name: string;
  position: number; // 1, 2, 3, etc.
  result_data?: Record<string, unknown>;
  notes?: string;
  input_by?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  competition_id?: string | null; // null = global announcement
  competition_name?: string;
  title: string;
  excerpt: string;
  content: string;
  is_published: boolean;
  published_at: string;
  author_name: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  participant_name: string;
  institution: string;
  competition_name: string;
  category: CompetitionCategory;
  score?: number;
  notes?: string;
}

export interface SystemSettings {
  event_name: string;
  registration_open: boolean;
  maintenance_mode: boolean;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  qris_nmid: string;
  qris_image_url?: string;
  whatsapp_helpdesk: string;
  email_helpdesk: string;
  instagram_permikomnas?: string;
  instagram_impsi?: string;
  venue_name?: string;
  venue_address?: string;
  registration_close_at?: string;
}

export interface ScoreChange {
  id: string;
  submission_id: string;
  old_score: number;
  new_score: number;
  reason: string;
  changed_by: string;
  created_at: string;
}

export type TimelineEventType =
  | 'daftar'
  | 'technical-meeting'
  | 'penyisihan'
  | 'final'
  | 'pengumuman';

export interface TimelineEvent {
  id: string;
  judul: string;
  deskripsi: string;
  tanggal_mulai: string; // ISO String: YYYY-MM-DD
  tanggal_selesai?: string;
  jam?: string;
  jenis: TimelineEventType;
  cabang_id?: string;
  cabang_nama?: string;
  lokasi?: string;
  is_deadline?: boolean;
}

export type PartnerCategory = 'organizer' | 'kabinet' | 'co_host' | 'sponsor' | 'media_partner';

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  logo_url: string;
  website_url?: string;
  description?: string;
  tier?: 'utama' | 'platinum' | 'gold' | 'silver' | 'partner';
  order_index: number;
  is_active: boolean;
}

export type GuidebookCategory = 'general' | 'esai' | 'uiux' | 'it_system_arch' | 'pes' | 'ml';

export interface Guidebook {
  id: string;
  title: string;
  category: GuidebookCategory;
  competition_id?: string;
  file_url: string;
  file_name: string;
  file_size_bytes?: number;
  version: string;
  description: string;
  release_notes?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Event / Seminar & Webinar Agenda
// ============================================================================

export type EventType = 'seminar' | 'webinar' | 'workshop' | 'ceremony';
export type EventFormat = 'online' | 'offline' | 'hybrid';

export interface EventSpeaker {
  name: string;
  role_title: string;
  organization: string;
  avatar_url?: string;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  format: EventFormat;
  start_time: string; // ISO string
  end_time?: string;
  location_name: string;
  location_url?: string;
  description: string;
  speakers: EventSpeaker[];
  price: number; // 0 = Gratis
  quota?: number;
  registered_count: number;
  registration_url?: string;
  banner_url?: string;
  is_published: boolean;
  certificate_provided: boolean;
  order_index: number;
}

// ============================================================================
// Dynamic FAQs
// ============================================================================

export interface DynamicFaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'umum' | 'lomba' | 'pembayaran' | 'teknis' | 'pendaftaran';
  order_index: number;
  is_published: boolean;
}




