<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md - Permifest x Deforkafest

Kontrak kerja untuk agent AI (Antigravity, Claude Code, Cursor, dll). **Baca seluruh file ini sebelum menyentuh kode.** Dokumen berbahasa Indonesia; kode, nama variabel, dan pesan commit berbahasa Inggris.

## 1. Proyek dalam lima baris

- Platform web satu pintu untuk lomba **Permifest x Deforkafest** (Permikomnas Yogyakarta x IMPSI UST Yogyakarta). Tulis **Deforkafest** (pakai F) di semua UI dan dokumen.
- Lima cabang: Esai, UI/UX, IT System Architecture (akademik, dinilai juri) dan PES, Mobile Legends (non-akademik, hasil diinput panitia).
- Alur: daftar akun -> pilih lomba -> bayar via QRIS (unggah bukti) -> verifikasi panitia -> unggah karya -> juri menilai -> panitia kunci nilai -> rilis hasil.
- Empat peran: `peserta`, `juri`, `panitia`, `super_admin`.
- Stack: Next.js (App Router) + React + Tailwind CSS v4 + Supabase (Postgres, Auth, Storage) + Vercel. Versi pasti: lihat `package.json`.

## 2. Sumber kebenaran (urutan prioritas)

1. Instruksi eksplisit pemilik proyek di sesi ini.
2. `docs/DECISIONS.md` (keputusan dan pertanyaan terbuka).
3. `docs/PRD.md`.
4. `docs/SITEMAP_RBAC.md`, `docs/SCHEMA.md`, `docs/SECURITY.md`.
5. `docs/DESIGN_SYSTEM.md`, `docs/UI_KIT.md`, dan skill `permifest-deforkafest-ui`.
6. Kode yang sudah ada.

Jika kode bertentangan dengan dokumen di atasnya, itu **bug atau dokumen perlu diperbarui**. Jangan diam-diam memilih salah satu: catat di `docs/DECISIONS.md`.

## 3. Peta dokumen

| File | Isi | Baca saat |
|---|---|---|
| `docs/ARCHITECTURE.md` | Lapisan, alur data, struktur folder target, migrasi mock -> live | Menambah fitur atau modul |
| `docs/SITEMAP_RBAC.md` | Rute, penjaga akses, matriks izin | Menyentuh rute atau izin |
| `docs/SCHEMA.md` | 22 tabel, constraint, RLS, storage | Menyentuh database |
| `docs/SECURITY.md` | Ancaman, checklist, break-glass, runbook | Upload, auth, nilai, deploy |
| `docs/DESIGN_SYSTEM.md` | Token, tipografi, komponen, copy | Menyentuh UI |
| `docs/UI_KIT.md` | Komponen dan template layar per permukaan | Membangun halaman |
| `docs/TESTING.md` | Strategi dan matriks uji | Sebelum menandai selesai |
| `docs/TASKS.md` | Backlog bertahap | Memilih pekerjaan |
| `docs/DECISIONS.md`, `CHANGELOG.md` | ADR, pertanyaan terbuka, riwayat | Setiap perubahan bermakna |

## 4. Aturan emas (tidak boleh dilanggar)

1. **Otorisasi dijalankan di server dan RLS.** Menyembunyikan tombol bukan keamanan. Setiap Server Action, route handler, dan query memanggil `requirePermission()` dan tetap dilindungi RLS. Tolak secara default.
2. **Jangan hardcode keputusan terbuka.** Biaya, jumlah anggota tim, jumlah juri, aturan blind, aturan nilai akhir, partisipasi ganda, jadwal: baca dari konfigurasi di database (`docs/DECISIONS.md` bagian C).
3. **Registrasi publik selalu menghasilkan `peserta`.** Peran lain hanya dibuat oleh `super_admin`. Jangan pernah menerima `role` dari body request atau metadata klien.
4. **Nilai tidak pernah ditimpa setelah dikunci.** Koreksi darurat lewat fungsi `admin_override_score` dengan alasan wajib, tercatat di `score_changes` dan `audit_logs`.
5. **Upload langsung ke Supabase Storage lewat signed URL.** Validasi tipe, ukuran, nama acak (uuid). File tidak pernah dieksekusi atau disajikan inline dari bucket privat.
6. **Rahasia tidak masuk repo.** `SUPABASE_SERVICE_ROLE_KEY` hanya di server (`lib/supabase/admin.ts` dengan `import "server-only"`). Hanya `NEXT_PUBLIC_*` yang boleh sampai ke klien.
7. **Waktu: simpan UTC, tampilkan WIB (UTC+7).** Buka dan tutup pendaftaran dihitung dari timestamp, bukan cron.
8. **Peserta tidak pernah melihat nilai atau komentar juri.** Hanya hasil akhir yang sudah dirilis.
9. **Jangan mengarang data publik**: statistik, testimoni, tanggal resmi, harga resmi, logo, tautan sosial. Pakai placeholder bertanda `[ISI]`.
10. **Satu tugas = satu branch = satu PR kecil.** Perbarui dokumen terkait dan `CHANGELOG.md` di PR yang sama.
11. **Selalu commit dan push ke branch `main`.** Vercel Production memantau `origin/main`; pastikan branch aktif adalah `main` sebelum commit dan push, dan jangan push ke `master` atau branch lain kecuali diminta eksplisit oleh pemilik proyek.

## 5. Perintah

Sesuaikan dengan `package.json` bila berbeda.

```bash
npm run dev          # dev server
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # unit + komponen
npm run test:e2e     # Playwright per role
npm run build        # harus lolos sebelum PR
npx supabase db reset   # terapkan migrasi + seed lokal
```

## 6. Konvensi kode

- TypeScript `strict`. Dilarang `any` tanpa komentar alasan.
- Validasi semua input di batas sistem dengan **zod** (skema di `features/*/schema.ts`). Form dinamis lomba dibangun dari `competitions.form_fields`.
- Server Component secara default; `"use client"` hanya bila perlu interaksi.
- Akses data lewat **repository** (`lib/repositories/*`), bukan memanggil Supabase langsung dari komponen. Implementasi: `supabase` (produksi) dan `mock` (dev saja).
- Tailwind memakai token dari `globals.css`; **tanpa hex tertanam** di JSX. Ikon Phosphor.
- Penamaan: berkas komponen `PascalCase.tsx`, utilitas `kebab-case.ts`, tabel/kolom `snake_case`.
- Commit: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- Tanpa `console.log` di commit. Log lewat helper `lib/log.ts` (tanpa data pribadi).

## 7. Alur kerja agent

1. Baca `docs/TASKS.md`; ambil satu tugas berstatus `[ ]` yang dependensinya selesai. Ubah menjadi `[~]`.
2. Baca dokumen yang relevan (peta di bagian 3). Jika tugas menyentuh keputusan terbuka, **berhenti dan tanya** (bagian 9).
3. Buat rencana singkat (file yang disentuh, risiko keamanan).
4. Implementasi + uji. Untuk perubahan skema: migrasi baru di `supabase/migrations/`, jangan mengedit migrasi lama.
5. Jalankan `lint`, `typecheck`, `test`, `build`. Untuk UI: cek di 375px, 768px, 1280px.
6. Perbarui `docs/*`, `CHANGELOG.md`, tandai tugas `[x]`.
7. Laporan akhir singkat: apa yang berubah, apa yang belum, risiko.

## 8. Definition of Done

- [ ] Acceptance criteria di `TASKS.md` terpenuhi.
- [ ] Otorisasi diuji untuk peran yang diizinkan **dan** yang ditolak (`docs/TESTING.md`).
- [ ] Ada state loading, kosong, error, sukses untuk setiap data async.
- [ ] Aksesibilitas: fokus terlihat, label terhubung, kontras AA, `prefers-reduced-motion`.
- [ ] Tidak ada rahasia, `console.log`, `TODO` tanpa nomor tugas.
- [ ] Dokumen dan `CHANGELOG.md` diperbarui.

## 9. Berhenti dan tanya jika

- Tugas bergantung pada pertanyaan terbuka yang belum punya nilai konfigurasi.
- Perubahan menyentuh RLS, role, atau penilaian dan dokumen tidak jelas.
- Dokumen dan kode bertentangan dan tidak ada ADR yang menjelaskan.
- Ada kebutuhan data resmi yang belum ada (logo, tanggal, biaya).

## 10. Skill dan util anti-slop

- Skill desain: `.agents/skills/ui/SKILL.md` (dan `.agent/skills/ui/SKILL.md`).
- Util `antislop`, `antislop-ui`, `antislop-layoutmobile`, `antislop-copywriting`, `antislop-code`, `antislop-human`. Jawaban untuk pertanyaan antislop: **mode 1 (selama pengerjaan)**; jalankan Delivery Gate di akhir.
- Konflik: identitas visual ikut skill dan `DESIGN_SYSTEM.md`; kualitas dan anti-klise ikut antislop.

## 11. Dilarang

- Menambah payment gateway, login Google, bracket e-sport di sistem, chat/forum (non-goals MVP).
- Membiarkan role-switcher demo aktif di production.
- Menyimpan password atau menampilkannya; hanya reset.
- Mengubah migrasi yang sudah diterapkan; membuat tabel di luar `docs/SCHEMA.md` tanpa ADR.
- Melakukan commit atau push ke branch `master` maupun branch selain `main` tanpa instruksi eksplisit pemilik proyek.
