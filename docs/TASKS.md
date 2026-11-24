# TASKS.md

Status: `[ ]` belum, `[~]` dikerjakan, `[x]` selesai. Satu tugas = satu branch = satu PR. Ambil tugas yang dependensinya sudah `[x]`. Tugas yang bergantung pada keputusan terbuka (DECISIONS bagian C) dikerjakan dengan **konfigurasi**, bukan nilai tetap.

## Fase 0 - Stabilisasi (kondisi saat ini masih berantakan)

| ID | Tugas | Acceptance | Dep | |
|---|---|---|---|---|
| T0.1 | Rapikan branch `yuum`: pecah perubahan uncommitted jadi commit logis, rebase ke branch utama | Working tree bersih, riwayat bermakna | - | [x] |
| T0.2 | Tempatkan dokumen ini di repo (`AGENTS.md`, `docs/*`), salin PRD ke `docs/PRD.md` | Semua tautan di AGENTS.md valid | - | [x] |
| T0.3 | Inventaris rute kode vs `SITEMAP_RBAC.md`; buat stub rute berstatus `baru` | Tabel selisih di PR; stub dengan guard dan EmptyState | T0.2 | [x] |
| T0.4 | Audit `supabase/schema.sql` vs `SCHEMA.md`; satu sumber di `supabase/migrations/` | Selisih tercatat; satu lokasi skema; migrasi terpisah | T0.2 | [x] |
| T0.5 | Pindahkan nilai keputusan terbuka (biaya, anggota tim, partisipasi ganda, tanggal) dari `constants.ts` ke seed + konfigurasi | Tidak ada angka bisnis di kode; seed bertanda placeholder | T0.4 | [x] |
| T0.6 | Role-switcher: hanya non-production, tidak memengaruhi otorisasi | Build production tidak memuatnya (diverifikasi) | - | [x] |
| T0.7 | Konsolidasi UI: token tunggal di `globals.css`, shell per permukaan (publik, peserta, admin/juri), hapus komponen duplikat | Tanpa hex tertanam; 3 layout shell | T0.2 | [x] |
| T0.8 | Satu pustaka ikon (Phosphor); hapus `lucide-react` bila memungkinkan | Impor lucide nol atau terdokumentasi | T0.7 | [x] |
| T0.9 | Verifikasi dependensi dan versi di `package.json` (Next, Tailwind v4 dan plugin-nya, Supabase) | Ringkasan versi nyata di CHANGELOG | - | [x] |
| T0.10 | CI dasar: lint, typecheck, build, `npm audit`; secret scanning; proteksi branch | PR merah bila gagal | - | [x] |
| T0.11 | `.env.example`, `README` (setup lokal), `docs/` link | Orang baru bisa menjalankan dalam < 15 menit | T0.2 | [x] |
| T0.12 | Terapkan UI kit: ganti halaman publik dan panel dengan komponen `UI_KIT.md` secara bertahap | Checklist komponen (UI_KIT bagian 5) lolos | T0.7 | [x] |

## Fase 1 - Fondasi data dan auth

| ID | Tugas | Acceptance | Dep | |
|---|---|---|---|---|
| T1.1 | Proyek Supabase dev/staging/prod + env Vercel | Tiga lingkungan terpisah, tanpa secret di repo | T0.10 | [ ] |
| T1.2 | Migrasi 22 tabel, enum, RLS, fungsi, trigger, bucket, seed | Semua tabel RLS aktif; seed jalan | T0.4 | [x] |
| T1.3 | Antarmuka repository + implementasi Supabase untuk `users`, `competitions` | Mock dan Supabase lewat satu antarmuka | T1.2 | [x] |
| T1.4 | Auth: register, login, verifikasi email, lupa/reset password | Registrasi selalu `peserta`; password baru tervalidasi; pesan tidak membocorkan akun | T1.2 | [x] |
| T1.5 | `requireRole`, `requirePermission`, guard layout per area | Role dari database; role yang tidak sesuai ditolak; tanpa role-switcher | T1.4 | [x] |
| T1.6 | Akun demo panitia, juri, dan super admin lewat skrip lokal; 2FA wajib | Provisioning lokal saja; akun non-demo ditolak; `aal2` dicek di server | T1.5 | [~] |
| T1.7 | Uji RLS matriks `TESTING.md` bagian 2 | Semua lulus di CI | T1.2 | [ ] |
| T1.8 | Sinkronkan profil dan password dengan Supabase Auth | Profil tersimpan di database; email dari sesi; password baru tervalidasi | T1.5 | [x] |

Script provisioning T1.6 sudah tersedia, tetapi belum dijalankan karena Supabase lokal dan `.env.local` belum tersedia di workspace ini.

## Fase 2 - MVP bagian A (akun, konfigurasi, pendaftaran, pembayaran)

| ID | Tugas | Acceptance | Dep | |
|---|---|---|---|---|
| T2.1 | Admin: CRUD lomba, form builder, tahap, timeline, aturan file | Lomba baru tanpa deploy; audit tercatat | T1.5 | [x] |
| T2.2 | Publik: katalog dan detail dari DB | Menampung 0, 1, N lomba | T1.3 | [x] |
| T2.3 | Pendaftaran individu dengan form dinamis | Zod dibangun dari `form_fields`; jendela dan kuota ditegakkan server | T2.1 | [x] |
| T2.4 | Tim (ML): buat tim, kode undangan, validasi batas | Batas dari konfigurasi | T2.3 | [x] |
| T2.5 | Pembayaran: QR (unggahan admin), bukti via signed URL, status | Peserta lain tak bisa membaca bukti | T2.3 | [x] |
| T2.6 | Panitia: verifikasi bayar (setujui/tolak + alasan), notifikasi dashboard | Audit + alasan wajib saat tolak | T2.5 | [x] |
| T2.7 | Panel peserta: Overview + StatusStepper + Profil | Satu "Langkah berikutnya" | T2.5 | [x] |
| T2.8 | Super admin: pengguna dan peran (naikkan juri/panitia, scope lomba) | Perubahan peran masuk audit | T1.6 | [x] |
| T2.9 | Daftar peserta + filter + pagination + ekspor CSV | CSV tidak memuat data di luar scope | T2.3 | [x] |

## Fase 3 - MVP bagian B (karya, penilaian, hasil)

| ID | Tugas | Acceptance | Dep | |
|---|---|---|---|---|
| T3.1 | Upload karya: signed URL, versi, deadline, validasi Figma | Versi terakhir aktif; tolak setelah deadline | T2.6 | [x] |
| T3.2 | Editor rubrik (bobot total 100) | Publikasi ditolak bila bobot tak 100 | T2.1 | [x] |
| T3.3 | Penugasan juri + cek benturan instansi (konfigurasi) | Juri tak ditugaskan tak bisa membaca karya | T3.1 | [x] |
| T3.4 | Juri: penugasan, viewer anonim, form rubrik, kirim | Penugasan dan viewer tersambung ke Supabase; skor dan draf harus tersimpan ke database | T3.3 | [~] |
| T3.5 | Monitoring penilaian + kunci nilai | Setelah kunci, juri dan panitia tak bisa ubah | T3.4 | [x] |
| T3.6 | `v_final_scores` dengan agregasi dari konfigurasi | Hasil sama dengan perhitungan manual uji | T3.5 | [x] |
| T3.7 | Input hasil PES/ML | `unique(placement)` ditegakkan | T2.6 | [x] |
| T3.8 | Pengumuman + rilis hasil + leaderboard publik | Hanya data dirilis yang tampil | T3.6, T3.7 | [x] |
| T3.9 | Koreksi darurat + UI audit log | Alasan wajib; nilai lama tersimpan; panitia terkait melihat | T3.5 | [x] |

## Fase 4 - Pengerasan

| ID | Tugas | Acceptance | |
|---|---|---|---|
| T4.1 | Header keamanan + CSP + rate limit (login, register, upload) | Diuji | [x] |
| T4.2 | Sentry + log terstruktur + alert | Alert tes terkirim | [ ] |
| T4.3 | Uji beban pendaftaran dan upload | Laporan k6; target ditetapkan setelah estimasi peserta | [ ] |
| T4.4 | Uji pemulihan backup | Terdokumentasi | [ ] |
| T4.5 | Pentest internal (IDOR, upload, eskalasi) | Temuan ditutup | [ ] |
| T4.6 | Audit aksesibilitas penuh | WCAG 2.2 AA pada layar utama | [ ] |
| T4.7 | Runbook final + gerbang pra-peluncuran `SECURITY.md` 4b | Semua centang | [ ] |

## Fase 5 - Fase 2 (setelah MVP)

Notifikasi email (Resend/Supabase), bracket dan skor di sistem, login Google, ekspor laporan lanjutan, audit log lanjutan.
