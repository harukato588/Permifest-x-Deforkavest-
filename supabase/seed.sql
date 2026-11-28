-- ============================================================================
-- Seed Data: Permifest x Deforkafest Platform
-- Matches docs/SCHEMA.md Section 7 & docs/DECISIONS.md (Placeholder configs)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Default Roles
-- ----------------------------------------------------------------------------

INSERT INTO public.roles (key, label, description)
VALUES
  ('peserta', 'Peserta', 'Peserta lomba - pelajar SMA/SMK hingga mahasiswa'),
  ('juri', 'Juri', 'Juri penilai karya lomba akademik'),
  ('panitia', 'Panitia', 'Panitia pengelola operasional lomba'),
  ('super_admin', 'Super Admin', 'Administrator platform dengan akses penuh')
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description;

-- ----------------------------------------------------------------------------
-- 2. Event & Theme
-- ----------------------------------------------------------------------------

INSERT INTO public.events (id, slug, name, starts_at, ends_at, settings)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'permifest-deforkafest-2026',
  'Permifest x Deforkafest',
  '2026-11-01 00:00:00+00',
  '2026-12-31 23:59:59+00',
  '{
    "leaderboard_mode": "after_release",
    "allow_multiple_competitions": true,
    "panitia_scope": "per_competition",
    "email_announcements": false,
    "role_conflict_policy": "block_assignment"
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  settings = EXCLUDED.settings;

INSERT INTO public.themes (id, event_id, name, subtheme, description)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Cybersecurity',
  'Securing the Digital Frontier: Innovation & Resilience',
  'Tema sentral kompetisi teknologi Permifest x Deforkafest 2026'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subtheme = EXCLUDED.subtheme;

-- ----------------------------------------------------------------------------
-- 3. Five Competitions (with Placeholder Markers in config)
-- ----------------------------------------------------------------------------

-- 1. Esai (Akademik, Individu / Tim maks 2)
INSERT INTO public.competitions (
  id, event_id, theme_id, slug, name, kind, participation,
  description, fee_idr, quota, team_min, team_max, reserve_max,
  requires_identity, registration_opens_at, registration_closes_at,
  form_fields, submission_config, scoring_config, is_published
)
VALUES (
  'c1111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'esai',
  'Kompetisi Esai Nasional',
  'academic',
  'team',
  'Kompetisi esai bertema inovasi dan ketahanan keamanan siber.',
  25000.00, -- [PLACEHOLDER]
  100,
  1, 2, 0,
  TRUE,
  '2026-11-01 00:00:00+00',
  '2026-12-15 23:59:59+00',
  '[
    {"key": "asal_instansi", "label": "Asal Sekolah / Kampus", "type": "text", "required": true},
    {"key": "judul_esai", "label": "Rencana Judul Esai", "type": "text", "required": true}
  ]'::jsonb,
  '{"accepts": ["pdf", "docx"], "max_mb": 15, "is_placeholder": true}'::jsonb,
  '{"judges_per_submission": 2, "blind": false, "aggregation": "mean", "is_placeholder": true}'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  fee_idr = EXCLUDED.fee_idr;

-- 2. UI/UX Design (Akademik, Individu)
INSERT INTO public.competitions (
  id, event_id, theme_id, slug, name, kind, participation,
  description, fee_idr, quota, team_min, team_max, reserve_max,
  requires_identity, registration_opens_at, registration_closes_at,
  form_fields, submission_config, scoring_config, is_published
)
VALUES (
  'c2222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'uiux',
  'UI/UX Design Competition',
  'academic',
  'individual',
  'Perancangan antarmuka dan pengalaman pengguna untuk aplikasi cybersecurity modern.',
  25000.00, -- [PLACEHOLDER]
  75,
  1, 1, 0,
  TRUE,
  '2026-11-01 00:00:00+00',
  '2026-12-15 23:59:59+00',
  '[
    {"key": "portfolio_url", "label": "Tautan Portfolio (Opsional)", "type": "url", "required": false}
  ]'::jsonb,
  '{"accepts": ["link"], "link_type": "figma", "is_placeholder": true}'::jsonb,
  '{"judges_per_submission": 2, "blind": false, "aggregation": "mean", "is_placeholder": true}'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  fee_idr = EXCLUDED.fee_idr;

-- 3. IT System Architecture (Akademik, Individu)
INSERT INTO public.competitions (
  id, event_id, theme_id, slug, name, kind, participation,
  description, fee_idr, quota, team_min, team_max, reserve_max,
  requires_identity, registration_opens_at, registration_closes_at,
  form_fields, submission_config, scoring_config, is_published
)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'it-system-architecture',
  'IT System Architecture',
  'academic',
  'individual',
  'Perancangan arsitektur sistem IT enterprise yang tangguh, terukur, dan aman.',
  50000.00, -- [PLACEHOLDER]
  50,
  1, 1, 0,
  TRUE,
  '2026-11-01 00:00:00+00',
  '2026-12-15 23:59:59+00',
  '[
    {"key": "arsitektur_fokus", "label": "Fokus Domain Arsitektur", "type": "text", "required": true}
  ]'::jsonb,
  '{"accepts": ["pdf", "docx"], "max_mb": 25, "allow_separate_diagram": true, "is_placeholder": true}'::jsonb,
  '{"judges_per_submission": 2, "blind": false, "aggregation": "mean", "is_placeholder": true}'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  fee_idr = EXCLUDED.fee_idr;

-- 4. PES / eFootball (Esport, Individu)
INSERT INTO public.competitions (
  id, event_id, theme_id, slug, name, kind, participation,
  description, fee_idr, quota, team_min, team_max, reserve_max,
  requires_identity, registration_opens_at, registration_closes_at,
  form_fields, submission_config, scoring_config, is_published
)
VALUES (
  'c4444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'pes',
  'eFootball (PES)',
  'esport',
  'individual',
  'Turnamen eFootball / PES antar pelajar dan mahasiswa se-Indonesia.',
  35000.00, -- [PLACEHOLDER]
  64,
  1, 1, 0,
  FALSE,
  '2026-11-01 00:00:00+00',
  '2026-12-15 23:59:59+00',
  '[
    {"key": "nickname", "label": "Nickname Game", "type": "text", "required": true}
  ]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  fee_idr = EXCLUDED.fee_idr;

-- 5. Mobile Legends (Esport, Tim)
INSERT INTO public.competitions (
  id, event_id, theme_id, slug, name, kind, participation,
  description, fee_idr, quota, team_min, team_max, reserve_max,
  requires_identity, registration_opens_at, registration_closes_at,
  form_fields, submission_config, scoring_config, is_published
)
VALUES (
  'c5555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'mobile-legends',
  'Mobile Legends: Bang Bang',
  'esport',
  'team',
  'Turnamen MLBB 5v5 dengan 1 pemain cadangan.',
  100000.00, -- [PLACEHOLDER]
  32,
  5, 5, 1,
  FALSE,
  '2026-11-01 00:00:00+00',
  '2026-12-15 23:59:59+00',
  '[
    {"key": "nama_tim", "label": "Nama Tim / Squad", "type": "text", "required": true}
  ]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  fee_idr = EXCLUDED.fee_idr;

-- ----------------------------------------------------------------------------
-- 4. Stages for Competitions (Penyisihan & Final)
-- ----------------------------------------------------------------------------

INSERT INTO public.stages (competition_id, key, name, position, starts_at, submission_deadline, ends_at)
VALUES
  -- Esai
  ('c1111111-1111-1111-1111-111111111111', 'penyisihan', 'Babak Penyisihan', 1, '2026-11-01 00:00:00+00', '2026-12-16 23:59:59+00', '2026-12-20 23:59:59+00'),
  ('c1111111-1111-1111-1111-111111111111', 'final', 'Babak Final & Presentasi', 2, '2026-12-21 00:00:00+00', '2026-12-25 23:59:59+00', '2026-12-28 23:59:59+00'),
  -- UI/UX
  ('c2222222-2222-2222-2222-222222222222', 'penyisihan', 'Babak Penyisihan', 1, '2026-11-01 00:00:00+00', '2026-12-16 23:59:59+00', '2026-12-20 23:59:59+00'),
  ('c2222222-2222-2222-2222-222222222222', 'final', 'Babak Final & Pitching', 2, '2026-12-21 00:00:00+00', '2026-12-25 23:59:59+00', '2026-12-28 23:59:59+00'),
  -- ITSA
  ('c3333333-3333-3333-3333-333333333333', 'penyisihan', 'Babak Penyisihan', 1, '2026-11-01 00:00:00+00', '2026-12-16 23:59:59+00', '2026-12-20 23:59:59+00'),
  ('c3333333-3333-3333-3333-333333333333', 'final', 'Babak Final & Defense', 2, '2026-12-21 00:00:00+00', '2026-12-25 23:59:59+00', '2026-12-28 23:59:59+00'),
  -- PES
  ('c4444444-4444-4444-4444-444444444444', 'penyisihan', 'Group Stage', 1, '2026-12-20 00:00:00+00', NULL, '2026-12-22 23:59:59+00'),
  ('c4444444-4444-4444-4444-444444444444', 'final', 'Playoff & Grand Final', 2, '2026-12-23 00:00:00+00', NULL, '2026-12-24 23:59:59+00'),
  -- MLBB
  ('c5555555-5555-5555-5555-555555555555', 'penyisihan', 'Kualifikasi Online', 1, '2026-12-20 00:00:00+00', NULL, '2026-12-22 23:59:59+00'),
  ('c5555555-5555-5555-5555-555555555555', 'final', 'Main Event Playoff', 2, '2026-12-23 00:00:00+00', NULL, '2026-12-24 23:59:59+00')
ON CONFLICT (competition_id, position) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Sample Rubric Criteria for Academic Competitions (Total weight = 100)
-- ----------------------------------------------------------------------------

-- Rubrik Esai
INSERT INTO public.rubric_criteria (competition_id, name, description, max_score, weight, position)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Relevansi & Orisinalitas Ide', 'Kesesuaian dengan tema keamanan siber dan kebaruan gagasan', 100, 30.00, 1),
  ('c1111111-1111-1111-1111-111111111111', 'Ketajaman Analisis & Argumen', 'Kedalaman analisis permasalahan dan solusi teknis yang diajukan', 100, 40.00, 2),
  ('c1111111-1111-1111-1111-111111111111', 'Sistematika & Tata Bahasa', 'Struktur penulisan ilmiah, sitasi, dan kaidah bahasa Indonesia yang baik', 100, 30.00, 3)
ON CONFLICT DO NOTHING;

-- Rubrik UI/UX
INSERT INTO public.rubric_criteria (competition_id, name, description, max_score, weight, position)
VALUES
  ('c2222222-2222-2222-2222-222222222222', 'User Research & Problem Solving', 'Pemahaman terhadap kebutuhan pengguna aplikasi keamanan siber', 100, 30.00, 1),
  ('c2222222-2222-2222-2222-222222222222', 'Visual Design & Usability', 'Keindahan visual, konsistensi design system, dan kemudahan navigasi', 100, 40.00, 2),
  ('c2222222-2222-2222-2222-222222222222', 'Inovasi Prototipe Interaktif', 'Kualitas interaksi mikro dan kelengkapan flow interaktif di Figma', 100, 30.00, 3)
ON CONFLICT DO NOTHING;
