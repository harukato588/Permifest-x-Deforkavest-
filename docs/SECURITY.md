# SECURITY.md

Temanya Cybersecurity: anggap peserta akan menguji sistem. PRD bagian 3 dan 8 adalah dasar dokumen ini.

## 1. Aset dan ancaman utama

| Aset | Ancaman | Kontrol |
|---|---|---|
| Nilai juri | Diubah setelah kunci; dilihat peserta | Trigger `guard_locked_scores`, RLS tanpa akses peserta, `score_changes`, audit |
| Bukti bayar, identitas | IDOR, bucket publik | Bucket privat, path berisi `user_id`, RLS storage, signed URL singkat |
| Role | Eskalasi (kirim `role=super_admin`, ubah metadata/cookie) | Trigger `handle_new_user`, sesi membaca role dari `user_roles`, guard server + RLS, perubahan role hanya super admin |
| Karya peserta | Dibaca peserta lain / juri tak ditugaskan | RLS per `assigned`, tanpa listing publik |
| Upload | Malware, file ganda ekstensi, XSS lewat nama/SVG | Whitelist MIME + ekstensi, cek magic bytes saat konfirmasi, nama uuid, `Content-Disposition: attachment`, tanpa SVG/HTML |
| Sesi | XSS/CSRF/session fixation | Cookie HttpOnly/Secure/SameSite, CSP, escaping, Server Action dengan origin check |
| Login/registrasi | Brute force, enumerasi akun, spam | Rate limit (Vercel Firewall/middleware), pesan error seragam, CAPTCHA bila perlu |
| Deadline | Lonjakan traffic | Upload langsung ke storage, pooler, uji beban |
| Super admin | Akun diambil alih | 2FA wajib, jumlah dibatasi, notifikasi login, audit |

## 2. Checklist implementasi

**Autentikasi dan sesi**
- [x] Password di-hash oleh Supabase Auth; password baru minimal 8 karakter dan mengandung angka; reset via tautan, tidak ada tampilan password.
- [ ] Verifikasi email wajib sebelum mendaftar lomba.
- [x] 2FA untuk `super_admin`, dicek `aal2` di server.
- [x] Signup publik selalu menetapkan `peserta`; metadata dan cookie klien tidak menentukan role.
- [x] Pesan login/reset tidak membocorkan apakah email terdaftar.

**Otorisasi**
- [ ] Semua tabel `enable row level security`; uji penolakan per peran (lihat TESTING).
- [ ] Setiap Server Action memanggil `requirePermission`. Tidak ada endpoint yang hanya mengandalkan UI.
- [ ] Parameter id (`registrationId`, `submissionId`) selalu dicek kepemilikan/scope; tidak percaya klien.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` hanya di `lib/supabase/admin.ts` (`server-only`).

**Upload**
- [ ] Tipe, ukuran, tahap, dan deadline divalidasi **di server** saat membuat signed URL dan saat konfirmasi.
- [ ] Nama file asli hanya disimpan sebagai metadata dan selalu di-escape saat tampil.
- [ ] Link Figma divalidasi (host `figma.com`, skema https).

**Aplikasi web**
- [ ] Header: CSP ketat, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- [ ] Tidak memakai `dangerouslySetInnerHTML` pada input pengguna; konten pengumuman dirender dengan sanitizer.
- [ ] Tanpa PII di log dan Sentry (scrub email, telepon).

**Deployment**
- [ ] Secret hanya env var Vercel; secret scanning GitHub aktif.
- [ ] Tiga lingkungan terpisah; branch utama dilindungi, PR wajib review.
- [ ] CI: lint, typecheck, test, `npm audit`/Dependabot.
- [ ] Backup otomatis + satu kali uji pemulihan sebelum pendaftaran dibuka.
- [ ] Cek ketentuan paket Vercel untuk penggunaan berbiaya (hobby non-komersial).

## 3. Protokol koreksi darurat (break-glass)

Hanya `super_admin`. Langkah dan jaminan:
1. Buka **Koreksi Darurat**, pilih skor/hasil, isi nilai baru dan **alasan (min. 10 karakter)**.
2. Server memanggil `admin_override_score` (tidak menimpa tanpa jejak).
3. Nilai lama, nilai baru, alasan, pelaku, waktu masuk `score_changes` + `audit_logs`.
4. Panitia lomba terkait melihat entri di audit lomba mereka; juri dan panitia menerima notifikasi dashboard.
5. Tinjau berkala: panitia lomba memeriksa entri `scores.override` sebelum rilis hasil.

## 4. Runbook ringkas

| Situasi | Tindakan |
|---|---|
| Upload gagal massal menjelang deadline | Cek status Supabase/Vercel; perpanjang `stages.submission_deadline` lewat dashboard (tercatat di audit); umumkan di `/pengumuman` |
| Dugaan peserta menembus akses | Cabut sesi (Supabase), ambil `audit_logs`, tutup fitur terkait lewat flag konfigurasi, perbaiki policy, tulis ADR |
| Salah verifikasi pembayaran | Ubah status oleh panitia; bila sudah terlanjur dinilai, catat di audit |
| Deploy rusak | Rollback deployment Vercel ke build sebelumnya; migrasi bersifat maju-saja, siapkan migrasi perbaikan |
| Kebocoran secret | Rotasi kunci di Supabase/Vercel, invalidasi sesi, audit akses |

## 4b. Pra-peluncuran (gerbang)

- [ ] Uji RLS lolos untuk seluruh matriks `SCHEMA.md` bagian 4.
- [ ] Uji beban upload dan pendaftaran dilakukan.
- [x] Role-switcher demo dihapus; script provisioning akun demo hanya menerima Supabase lokal.
- [ ] Uji pemulihan backup dilakukan sekali.
- [ ] Penetration test internal/anggota tim terhadap IDOR, upload, dan eskalasi role.
