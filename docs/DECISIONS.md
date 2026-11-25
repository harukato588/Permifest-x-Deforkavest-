# DECISIONS.md

Tiga bagian: **A** catatan keputusan (ADR), **B** rekonsiliasi PRD vs laporan progres dan temuan audit, **C** pertanyaan terbuka yang harus **configurable**. Tambahkan ADR baru di bawah; jangan mengubah ADR lama, tandai `Superseded by`.

## A. ADR

| ID | Keputusan | Alasan | Status |
|---|---|---|---|
| ADR-001 | Next.js (App Router) + Supabase + Tailwind v4 + Vercel | Dipilih pemilik; sesuai PRD opsi pertama | Accepted |
| ADR-002 | Otorisasi di server + RLS; UI hanya UX | Tema cybersecurity; PRD 3.3 | Accepted |
| ADR-003 | Lomba, form, rubrik sebagai data (`form_fields` JSONB) | Tambah lomba tanpa deploy | Accepted |
| ADR-004 | Simpan UTC, tampil WIB; buka/tutup dari timestamp | PRD 8.4 | Accepted |
| ADR-005 | Upload via signed URL langsung ke Storage | Batas timeout serverless, lonjakan deadline | Accepted |
| ADR-006 | Tanpa payment gateway; QRIS statis + bukti unggah | Biaya dan kompleksitas; PRD non-goal | Accepted |
| ADR-007 | Nilai tidak ditimpa; koreksi darurat via `admin_override_score` + `score_changes` | PRD 3.2 | Accepted |
| ADR-008 | Satu dashboard admin, menu difilter izin dan scope | Asumsi PRD 3 | Accepted (asumsi) |
| ADR-009 | Publik + peserta dark only; admin + juri terang/gelap | Arahan pemilik | Accepted |
| ADR-010 | Akses data lewat repository; mock hanya dev | Keluar dari store mock sebagai sumber kebenaran | Accepted |
| ADR-011 | Nama resmi **Permifest x Deforkafest** (F) | Arahan pemilik; PRD menulis "Devorkafest" | Accepted; PRD perlu dikoreksi |
| ADR-012 | Leaderboard hanya menampilkan data yang dirilis; mode via konfigurasi | Peserta hanya boleh melihat hasil akhir (PRD 3, 5.5) vs arahan "live" | Proposed, lihat C-09 |
| ADR-013 | Super admin wajib 2FA, jumlah dibatasi | PRD 3.2 | Accepted |
| ADR-014 | Role sesi dibaca dari database; tidak ada role-switcher klien | Cookie dan metadata klien bukan sumber otorisasi | Accepted |
| ADR-015 | Akun demo diprovisikan hanya ke Supabase lokal dari `.env.local` | Mencegah pembuatan akun demo di layanan bersama/production dan menjaga password dari repo | Accepted |
| ADR-016 | Juri hanya melihat karya yang ditugaskan, tanpa identitas peserta atau KTM | Menjaga penilaian tetap anonim dan membatasi data pribadi | Accepted |
| ADR-017 | Status pendidikan peserta dikunci setelah pendaftaran pertama; koreksi dilakukan super admin | Mencegah perubahan syarat peserta tanpa pemeriksaan | Accepted |

## B. Rekonsiliasi dan temuan audit

### B.1 Selisih PRD vs laporan progres

| # | Topik | PRD | Laporan/kode | Keputusan sementara | Tindakan |
|---|---|---|---|---|---|
| R1 | Nama | "Devorkafest" | "Deforkafest" | Pakai Deforkafest | Koreksi PRD |
| R2 | Biaya per lomba | Belum diputuskan | Esai 50rb, UI/UX 75rb, ITSA 100rb, PES 35rb, ML 100rb/tim | Placeholder seed, configurable | T0.5 |
| R3 | Tim ML | Jumlah belum ditentukan | 5 inti + 1 cadangan | Placeholder, configurable | T0.5, C-03 |
| R4 | Partisipasi ganda | Belum diputuskan (asumsi boleh) | `allow_multiple_competitions: true` | Config, default true | C-06 |
| R5 | Jadwal pendaftaran | Belum ada | "Nov-Des 2026" | Tidak dipakai sebagai fakta | C-11 |
| R6 | Leaderboard | "Hasil akhir, sementara" | Live (arahan awal) | Hanya rilis; mode configurable | ADR-012 |
| R7 | Peserta melihat kelolosan | Hanya hasil akhir | "Hasil kelolosan" | Tampilkan hanya flag `advanced`, tanpa skor/komentar | Usulan, konfirmasi |
| R8 | Dashboard admin | Satu dashboard per izin | Satu rute campur | Gating per izin + scope | SITEMAP_RBAC |
| R9 | Notifikasi email | Opsional | Dashboard | Notifikasi dashboard dulu | C-08 |
| R10 | Lokasi skema | - | `schema.sql` di dua tempat | `supabase/migrations/` | Selesai (T0.4, T1.2 dipecah ke 4 migrasi + seed) |

### B.2 Temuan audit sistem saat ini

| Sev | Temuan | Dampak | Tugas |
|---|---|---|---|
| Tinggi | RBAC bertumpu pada store/UI (mock); belum ada RLS atau guard server | Siapa pun bisa mengakses data lintas peran | T1.2, T1.5, T1.7 |
| Tinggi | Role-switcher mengambang di dashboard | Eskalasi peran bila sampai production | T0.6 |
| Tinggi | Upload masih placeholder | Bukti bayar/karya tidak aman | T2.5, T3.1 |
| Tinggi | Registrasi belum dijamin selalu `peserta` di server | Eskalasi role | T1.4 |
| Tinggi | 2FA super admin belum ada | Pengambilalihan akun | T1.6 |
| Sedang | Rute admin campur panitia/super admin tanpa gating per izin | Panitia mengakses fitur super admin | T0.3 |
| Sedang | Rute belum ada: pengguna, rubrik, juri, penilaian, koreksi darurat, reset-password, verifikasi-email, detail penugasan | Alur PRD tidak lengkap | T0.3 |
| Sedang | Konstanta keputusan terbuka di kode | Melanggar aturan "configurable" | T0.5 |
| Sedang | Panel admin hanya dark; kebutuhan terang/gelap | Tidak sesuai arahan | T0.7 |
| Sedang | Dua pustaka ikon, UI belum seragam | Inkonsistensi | T0.7, T0.8 |
| Rendah | Versi dan plugin Tailwind/Next belum diverifikasi (mis. `@tailwindcss/turbopack`) | Build rapuh | T0.9 |
| Rendah | Perubahan uncommitted di `yuum` | Risiko hilang | T0.1 |

Temuan audit tentang role-switcher, sumber role, guard dashboard, role signup, dan 2FA ditangani pada Tahap 2. Uji matriks RLS dan provisioning akun demo lokal tetap perlu dijalankan.

## C. Pertanyaan terbuka -> konfigurasi

Setiap item **tidak boleh** dikodekan mati. Kolom "Kunci" adalah tempat nilainya disimpan; "Default" hanya dipakai sampai pemilik memutuskan.

| ID | Pertanyaan (PRD 9.3) | Kunci konfigurasi | Default sementara | Status |
|---|---|---|---|---|
| C-01 | Hubungan Deforkafest dan Permifest | `events.name` | "Permifest x Deforkafest" | Dijawab pemilik |
| C-02 | Esai dan ITSA: individu/tim, maks anggota | `competitions.participation`, `team_max` | Individu | Terbuka |
| C-03 | ML: inti dan cadangan; kuota PES/ML | `team_min/team_max/reserve_max`, `quota` | 5/5/1 (placeholder), tanpa kuota | Terbuka |
| C-04 | Subtema dan jadwal tahap | `themes.subtheme`, `stages.*` | Kosong | Terbuka |
| C-05 | Jumlah juri per karya, rubrik, nilai akhir | `scoring_config`, `rubric_criteria` | 1 juri, `mean` | Terbuka |
| C-06 | Boleh ikut lebih dari satu lomba | `events.settings.allow_multiple_competitions` | `true` | Asumsi |
| C-07 | Biaya dan siapa memverifikasi bayar | `competitions.fee_idr`; verifikator = panitia lomba | Placeholder | Terbuka |
| C-08 | Pengumuman lewat email | `events.settings.email_announcements` | `false` | Terbuka |
| C-09 | Mode leaderboard | `events.settings.leaderboard_mode` (`after_release`/`live_published`) | `after_release` | Perlu keputusan |
| C-10 | Isi halaman informasi | `announcements`/halaman informasi | Kerangka | Terbuka |
| C-11 | Estimasi peserta, tanggal buka, deadline dev | `stages`, `registration_*` | Kosong | Terbuka |
| C-12 | Jumlah developer dan stack | ADR-001 | Next.js + Supabase | Dijawab |
| C-13 | Nama resmi PES | `competitions.name` | "PES" | Terbuka |
| C-14 | Logo, warna, Figma | `public/brand/`, token | Estimasi dari poster | Menunggu aset |
| C-15 | Satu orang dua peran, benturan kepentingan | `events.settings.role_conflict_policy` | `block_assignment` | Terbuka |
| C-16 | Juri tak boleh menilai instansi sama | `scoring_config.block_same_institution` | `true` | Terbuka |
| C-17 | Panitia per lomba atau semua | `events.settings.panitia_scope` (`per_competition`/`all`) | `per_competition` | Terbuka |

Saat pemilik memutuskan: ubah nilai di dashboard (bukan kode), ubah status di tabel ini, tambahkan ADR bila memengaruhi arsitektur, catat di `CHANGELOG.md`.
