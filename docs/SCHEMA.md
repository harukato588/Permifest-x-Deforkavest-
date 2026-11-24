# SCHEMA.md

22 tabel dalam 5 kelompok (PRD bagian 7). **Dokumen ini adalah target.** Bandingkan dengan `supabase/schema.sql` yang sudah ada (tugas T0.4) lalu buat migrasi selisihnya; jangan menimpa mentah-mentah. Kolom di bawah adalah usulan minimum; sesuaikan dengan yang sudah ada dan catat di DECISIONS.

Konvensi: PK `id uuid default gen_random_uuid()`; `created_at/updated_at timestamptz default now()` (UTC); soft delete `deleted_at` hanya di `users`; semua FK `on delete restrict` kecuali dicatat.

## 1. Enum

`app_role`: `peserta | juri | panitia | super_admin`
`competition_kind`: `academic | esport` | `participation`: `individual | team`
`payment_status`: `awaiting_proof | pending_review | verified | rejected`
`assignment_status`: `assigned | in_progress | submitted`
`team_role`: `captain | member | reserve`
`submission_kind`: `file | link`

## 2. Tabel

### A. Pengguna dan akses
| Tabel | Kolom penting | Constraint |
|---|---|---|
| `users` | `id` (= `auth.users.id`), `full_name`, `institution`, `phone`, `education_level`, `deleted_at` | PK = FK auth; `education_level` dikunci setelah pendaftaran pertama dan hanya dapat dikoreksi super admin |
| `roles` | `id`, `key app_role`, `label` | unique `key`; seed 4 baris |
| `user_roles` | `user_id`, `role_id`, `competition_id null`, `granted_by`, `granted_at` | unique `(user_id, role_id, competition_id)`; `competition_id null` = semua lomba; super_admin selalu null |
| `identity_verifications` | `user_id`, `document_type`, `storage_path`, `status`, `reviewed_by`, `reviewed_at`, `note` | satu KTM per pengguna; juri tidak mendapat akses; panitia dibatasi scope lomba |

### B. Event dan lomba
| Tabel | Kolom penting | Constraint |
|---|---|---|
| `events` | `slug`, `name`, `starts_at`, `ends_at`, `settings jsonb` | `settings`: `leaderboard_mode`, `allow_multiple_competitions`, `panitia_scope`, `email_announcements` |
| `themes` | `event_id`, `name`, `subtheme null`, `description` | |
| `competitions` | `event_id`, `theme_id`, `slug`, `name`, `kind`, `participation`, `description`, `fee_idr null`, `quota null`, `team_min/team_max/reserve_max null`, `requires_identity bool`, `registration_opens_at`, `registration_closes_at`, `form_fields jsonb`, `submission_config jsonb`, `scoring_config jsonb`, `is_published bool`, `created_by` | unique `slug`; `opens < closes` |
| `stages` | `competition_id`, `key` (`penyisihan`/`final`), `name`, `position`, `starts_at`, `submission_deadline`, `ends_at`, `scores_locked_at null`, `scores_locked_by null`, `results_published_at null` | unique `(competition_id, position)` |

`scoring_config` (semua configurable, belum diputuskan): `{ "judges_per_submission": 2, "aggregation": "mean" | "weighted_mean" | "trimmed_mean" }`.

Tampilan juri hanya memuat karya yang ditugaskan, dengan ID anonim. Nama, kontak, institusi, dan dokumen identitas peserta tidak dikirim ke komponen juri.
`submission_config`: `{ "accepts": ["pdf","docx"], "max_mb": 15, "link_type": "figma", "allow_separate_diagram": true }`.
`form_fields`: array `{ key, label, type, required, options?, help?, visible_if? }`.

### C. Pendaftaran dan pembayaran
| Tabel | Kolom penting | Constraint |
|---|---|---|
| `registrations` | `user_id`, `competition_id`, `team_id null`, `form_data jsonb`, `status` (`draft/registered/cancelled/disqualified`), `current_stage_id null`, `advanced bool` | unique `(user_id, competition_id)`; cek kuota dan jendela daftar via fungsi |
| `teams` | `competition_id`, `name`, `captain_id`, `invite_code` (acak, unik), `locked_at null` | unique `(competition_id, name)` |
| `team_members` | `team_id`, `user_id`, `role team_role` | unique `(team_id, user_id)`; jumlah dibatasi `team_max/reserve_max` |
| `payments` | `registration_id`, `amount_idr`, `status`, `proof_path`, `proof_uploaded_at`, `reviewed_by`, `reviewed_at`, `reject_reason`, `attempt int` | unique `registration_id`; `reject_reason` wajib saat `rejected` |

### D. Karya dan penilaian
| Tabel | Kolom penting | Constraint |
|---|---|---|
| `submissions` | `registration_id`, `stage_id`, `version int`, `is_latest bool`, `kind`, `storage_path null`, `original_filename`, `mime`, `size_bytes`, `link_url null`, `additional_files jsonb`, `submitted_at` | unique `(registration_id, stage_id, version)`; unique parsial `(registration_id, stage_id) where is_latest` |
| `rubric_criteria` | `competition_id`, `stage_id null`, `name`, `description`, `max_score`, `weight`, `position` | total `weight` per `(competition, stage)` = 100, divalidasi saat rubrik dipublikasikan |
| `judge_assignments` | `submission_id`, `judge_id`, `status`, `general_comment`, `assigned_by`, `submitted_at` | unique `(submission_id, judge_id)`; juri harus punya peran `juri` untuk lomba itu |
| `scores` | `assignment_id`, `criterion_id`, `score numeric`, `comment` | unique `(assignment_id, criterion_id)`; `0 <= score <= max_score` |
| `score_changes` | `score_id`, `old_score`, `new_score`, `old_comment`, `new_comment`, `reason`, `changed_by`, `changed_at` | `reason` min. 10 karakter; append-only |
| `match_results` | `competition_id`, `stage_id`, `registration_id`, `placement int`, `note`, `entered_by`, `entered_at` | unique `(competition_id, stage_id, placement)`; hanya lomba `esport` |

Nilai akhir tidak disimpan sebagai sumber kebenaran; dihitung oleh view `v_final_scores` dari `scores` + `scoring_config`, dan hanya tersedia bila `stages.scores_locked_at is not null`.

### E. Publikasi dan audit
| Tabel | Kolom penting |
|---|---|
| `announcements` | `event_id`, `competition_id null`, `title`, `body`, `is_pinned`, `author_id`, `published_at null` |
| `audit_logs` | `id bigserial`, `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `competition_id null`, `payload jsonb`, `ip inet`, `user_agent`, `created_at` | 

`audit_logs` dan `score_changes`: **append-only** (tanpa policy update/delete; `revoke update, delete`).

Aksi audit wajib: `payment.verify|reject`, `score.submit`, `scores.lock`, `scores.override`, `result.write`, `announcement.publish`, `role.grant|revoke`, `competition.update`, `rubric.update`, `auth.superadmin_login`.

## 3. Fungsi dan trigger kunci

```sql
-- peran dengan scope lomba (null = semua lomba)
create or replace function public.has_role(_role public.app_role, _competition uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = (select auth.uid()) and r.key = _role
      and (ur.competition_id is null or _competition is null or ur.competition_id = _competition));
$$;

-- registrasi publik SELALU peserta; abaikan metadata klien
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  insert into public.user_roles(user_id, role_id) select new.id, id from public.roles where key = 'peserta';
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- blokir ubah nilai setelah dikunci (kecuali jalur darurat)
create or replace function public.guard_locked_scores() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.judge_assignments ja
             join public.submissions s on s.id = ja.submission_id
             join public.stages st on st.id = s.stage_id
             where ja.id = coalesce(new.assignment_id, old.assignment_id) and st.scores_locked_at is not null)
     and coalesce(current_setting('app.break_glass', true), 'off') <> 'on' then
    raise exception 'scores_locked';
  end if;
  return coalesce(new, old);
end $$;
create trigger scores_guard before insert or update or delete on public.scores
  for each row execute function public.guard_locked_scores();

-- koreksi darurat: alasan wajib, nilai lama tersimpan
create or replace function public.admin_override_score(_score uuid, _new numeric, _comment text, _reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.scores;
begin
  if not public.has_role('super_admin') then raise exception 'forbidden'; end if;
  if length(trim(coalesce(_reason,''))) < 10 then raise exception 'reason_required'; end if;
  select * into s from public.scores where id = _score for update;
  insert into public.score_changes(score_id, old_score, new_score, old_comment, new_comment, reason, changed_by)
    values (s.id, s.score, _new, s.comment, _comment, _reason, (select auth.uid()));
  perform set_config('app.break_glass', 'on', true);
  update public.scores set score = _new, comment = _comment where id = _score;
  insert into public.audit_logs(actor_id, actor_role, action, entity_type, entity_id, payload)
    values ((select auth.uid()), 'super_admin', 'scores.override', 'score', _score,
            jsonb_build_object('reason', _reason, 'old', s.score, 'new', _new));
end $$;
```

Fungsi pendukung lain (tugas T1.x): `registration_window_open(competition)`, `competition_has_quota(competition)`, `can_assign_judge(judge, submission)` (cek peran + benturan instansi sesuai konfigurasi).

## 4. Matriks RLS

RLS **aktif di semua tabel**. Tanpa policy = ditolak. `own` = `user_id = auth.uid()` atau anggota timnya; `mgr(c)` = `has_role('panitia', c)`; `sa` = `has_role('super_admin')`.

| Tabel | Peserta | Juri | Panitia | Super admin |
|---|---|---|---|---|
| `users` | baca/ubah diri sendiri | baca diri | baca peserta lomba `mgr` | all |
| `user_roles` | baca diri | baca diri | baca | all (tulis hanya sa) |
| `events/themes/competitions/stages` | baca yang `is_published` | idem | baca | all |
| `registrations` | CRUD own (sebelum tutup) | - | baca/ubah status `mgr` | all |
| `teams/team_members` | own (kapten kelola) | - | baca `mgr` | all |
| `payments` | baca own; update bukti saat `awaiting_proof/rejected` | - | baca + verifikasi `mgr` | all |
| `submissions` | insert own sebelum deadline; baca own | baca yang ditugaskan | baca `mgr` | all |
| `rubric_criteria` | - | baca lomba yang ditugaskan | baca | all |
| `judge_assignments` | - | baca/ubah status milik sendiri | CRUD `mgr` | all |
| `scores` | **tidak ada akses** | insert/update milik sendiri sebelum kunci | baca `mgr` | all |
| `score_changes` | - | - | baca `mgr` (lomba terkait) | baca; tulis via fungsi |
| `match_results` | baca yang dirilis | baca | CRUD `mgr` | all |
| `announcements` | baca yang `published_at <= now()` | idem | CRUD `mgr` | all |
| `audit_logs` | - | - | baca entri lomba `mgr` (terbatas) | baca; insert via fungsi/server |
| `identity_verifications` | own | - | baca `mgr` bila `requires_identity` | all |

Pola umum policy (selalu bungkus `auth.uid()` dengan `(select ...)` agar dioptimasi):

```sql
create policy "payments_owner_read" on public.payments for select to authenticated
using (exists (select 1 from public.registrations r where r.id = registration_id and r.user_id = (select auth.uid())));
create policy "payments_mgr_all" on public.payments for all to authenticated
using (exists (select 1 from public.registrations r where r.id = registration_id and public.has_role('panitia', r.competition_id)))
with check (true);
```

Setiap migrasi tabel baru **wajib** menyertakan `alter table ... enable row level security` dan policy-nya.

## 5. Storage

| Bucket | Akses | Path | Batas |
|---|---|---|---|
| `payment-proofs` | privat | `{user_id}/{registration_id}/{uuid}.{ext}` | jpg/png/pdf, <= 5 MB |
| `submissions` | privat | `{competition_id}/{registration_id}/{stage_id}/{uuid}.{ext}` | sesuai `submission_config` (pdf/docx <= 15 MB; hingga 25 MB bila dikonfigurasi) |
| `identity-docs` | privat | `{user_id}/{uuid}.{ext}` | jpg/png/pdf, <= 5 MB |
| `public-assets` | publik | statis event | hanya aset non-sensitif |

Policy storage mengikuti pemilik/peran seperti tabel. Unduhan lewat signed URL berumur pendek. QRIS pembayaran: gambar diunggah admin ke bucket privat dan ditampilkan ke peserta terautentikasi lewat signed URL.

## 6. Indeks minimum

`registrations(competition_id, status)`, `payments(status)`, `submissions(registration_id, stage_id) where is_latest`, `judge_assignments(judge_id, status)`, `scores(assignment_id)`, `audit_logs(created_at desc)`, `audit_logs(entity_type, entity_id)`, indeks pada setiap FK yang dipakai di policy.

## 7. Seed

`roles` (4), satu `events` ("Permifest x Deforkafest"), satu `themes` (Cybersecurity), lima `competitions` dengan nilai **placeholder** (`fee_idr`, `team_*`, jadwal) bertanda di `description`/`config.is_placeholder = true`. Nilai asli diisi panitia lewat dashboard.
