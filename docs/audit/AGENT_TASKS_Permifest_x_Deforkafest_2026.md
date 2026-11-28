---
document_type: qa_remediation_spec
project: Permifest x Deforkafest 2026
target_url: https://permifest-x-deforkavest.vercel.app/
app_version: v2.0-MVP
test_date: 2026-11-28
test_method: black-box (no source code access during testing)
detected_stack: [Next.js (App Router, RSC, Server Actions), Supabase (Auth, Storage, Database), Vercel]
language: id
total_issues: 26
severity_counts: {critical: 2, high: 5, medium: 7, low: 8, info: 4}
---

# AGENT BRIEF: Perbaikan Website Permifest x Deforkafest 2026

## 0. Cara Memakai Dokumen Ini (untuk AI Agent)

**Konteks:** Dokumen ini adalah hasil QA black-box. Penguji TIDAK punya akses ke source code, database, atau panel admin. Semua bagian bertanda `HYPOTHESIS` adalah dugaan, bukan fakta.

**Aturan kerja:**
1. Baca codebase terlebih dahulu. Verifikasi setiap `HYPOTHESIS` di kode/skema nyata sebelum mengubah apa pun. Jangan menebak nama tabel, kolom, atau file; cari dengan grep/search.
2. Kerjakan sesuai urutan di Bagian 2 (Execution Plan). `C-01` wajib pertama karena mungkin menyelesaikan beberapa issue lain.
3. Satu issue = satu perubahan terfokus. Jangan refactor di luar lingkup issue.
4. Setiap issue punya `acceptance_criteria`. Issue dianggap selesai hanya jika semua kriteria terpenuhi dan `verify` lulus.
5. Perubahan RLS/skema database: tulis sebagai file migration, jangan ubah langsung di production. Jelaskan dampaknya.
6. Jika sebuah issue ternyata sudah teratasi oleh issue lain (mis. efek dari C-01), catat dan lewati.
7. Jangan menambahkan data uji nyata ke production. Pakai akun dummy.
8. Setelah selesai, hasilkan ringkasan: issue ID, file yang diubah, bukti verifikasi, dan sisa risiko.

**Akun uji (dummy, dari laporan QA):**
- `tes@gmail.com` — status pendidikan Mahasiswa
- `qa.siswa.permifest.01@example.com` — status pendidikan Siswa sekolah

---

## 1. Peta Sistem Singkat

### 1.1 Rute publik
| Rute | Catatan |
|---|---|
| `/` | Landing: hero, countdown, 3 lomba, jadwal, panduan (`/#panduan`), FAQ |
| `/kompetisi` | Katalog 3 lomba, kuota live |
| `/kompetisi/esai-ilmiah` | Detail + modal pendaftaran |
| `/kompetisi/ui-ux-design` | Detail + modal pendaftaran |
| `/kompetisi/it-systemarchitecture` | Detail + modal pendaftaran |
| `/guidebook` | 4 dokumen PDF (1 dari 4 404) |
| `/informasi`, `/pengumuman`, `/leaderboard` | Statis/hasil |
| `/login`, `/register`, `/forgot-password` | Auth |
| `/dashboard` | Prerender kosong lalu redirect client-side |
| `/admin` | 404 kustom |

### 1.2 Rute dashboard peserta (butuh login)
| Rute | Fungsi | Status saat uji |
|---|---|---|
| `/dashboard/peserta` | Overview: progres 5 tahap, 4 KPI, lomba aktif | BROKEN (data kosong) |
| `/dashboard/peserta/kompetisi` | Daftar pendaftaran | BROKEN (kosong) |
| `/dashboard/peserta/kompetisi/[id]` | Detail pendaftaran | BROKEN ("Pendaftaran Tidak Ditemukan") |
| `/dashboard/peserta/pembayaran` | Tagihan QRIS + upload bukti | Tagihan OK, upload BROKEN |
| `/dashboard/peserta/submission` | Upload karya / link Figma | BROKEN ("Tidak Ada Kompetisi Berbasis Karya") |
| `/dashboard/peserta/hasil` | Klasemen, surat edaran | Berfungsi, ada typo breadcrumb |
| `/dashboard/peserta/profil` | Profil, status pendidikan, KTM | Berfungsi, ada isu UX/validasi |

### 1.3 Perilaku proteksi rute yang sudah benar (JANGAN diubah)
- `/dashboard/peserta` tanpa login: redirect 307 ke `/login?redirect=...`
- `/login` dan `/register` saat sudah login: redirect ke `/dashboard/peserta`
- Pesan error login generik (tidak ada user enumeration)
- Forgot password generik ("Tautan Terkirim!")
- Bucket `payment-proofs` tidak publik (400 "Bucket not found")
- Tidak ada secret/anon key/`NEXT_PUBLIC_*` di bundle JS

### 1.4 Bukti pola bug utama
Pendaftaran berhasil dibuat (INSERT sukses, `registration_id` diterima, muncul di `/kompetisi/<slug>` sebagai "Anda Sudah Terdaftar!" dan di `/pembayaran`), tetapi halaman lain tidak menemukannya. Direproduksi pada 2 akun, 3 cabang lomba, 3 registration ID.

---

## 2. Execution Plan (urutan wajib)

| Urutan | Issue | Alasan |
|---|---|---|
| 1 | C-01 | Blocker; kemungkinan memperbaiki H-01 (penyebab) dan gejala dashboard |
| 2 | Re-test alur E2E (lihat Bagian 5) | Tentukan issue mana yang masih tersisa |
| 3 | H-01, H-02, H-05, C-02 | Fungsional high |
| 4 | H-03, H-04 | Logika pendaftaran |
| 5 | M-01, M-02, M-03, M-05 | Keamanan |
| 6 | M-04, M-06, M-07, L-01, L-02 | UX/validasi |
| 7 | L-03 s.d. L-08 | Minor |
| 8 | Bagian 4 (konten) | Sinkronisasi konten |
| 9 | I-01 s.d. I-04 | Opsional/informasional |

---

## 3. Issue Specifications

Format tiap issue: `id`, `severity`, `title`, `location`, `symptom`, `expected`, `repro`, `hypothesis`, `where_to_look`, `fix`, `acceptance_criteria`, `verify`.

---

### C-01 — Pendaftaran tidak ditemukan (RLS/query)
- **severity:** critical
- **location:** `/dashboard/peserta`, `/dashboard/peserta/kompetisi`, `/dashboard/peserta/kompetisi/[id]`, `/dashboard/peserta/submission`, dan endpoint finalisasi upload bukti bayar (POST #3)
- **symptom:**
  - Overview: progres tertahan di Step 1, semua KPI = 0, tampil "Belum Ada Kompetisi Terdaftar"
  - Kompetisi Saya: "Belum Ada Kompetisi Terdaftar"
  - Detail `[id]`: "Pendaftaran Tidak Ditemukan"
  - Submission: "Tidak Ada Kompetisi Berbasis Karya"
  - Finalisasi bukti bayar: `{"success":false,"error":"Pendaftaran tidak ditemukan."}`
- **expected:** Semua halaman di atas menampilkan pendaftaran milik user yang login, sama seperti halaman `/pembayaran` dan `/kompetisi/<slug>` yang sudah menemukannya.
- **repro:**
  1. Login sebagai `tes@gmail.com` (atau akun siswa).
  2. Isi profil, (Mahasiswa: upload KTM), buka `/kompetisi/<slug>`, klik Daftar Sekarang, submit.
  3. Terjadi redirect ke `/dashboard/peserta/pembayaran` dan tagihan tampil.
  4. Buka `/dashboard/peserta`, `/kompetisi`, `/submission`, dan detail `[id]`; semua menunjukkan data tidak ditemukan.
- **hypothesis:** (belum terverifikasi)
  - H1: SELECT policy RLS pada tabel pendaftaran tidak cocok dengan kondisi INSERT (mis. beda kolom `user_id` vs `auth.uid()`, atau kolom owner berbeda, atau policy SELECT mensyaratkan status tertentu).
  - H2: Query di halaman yang gagal memfilter berdasarkan status (mis. hanya `verified`/`paid`) sementara halaman pembayaran tidak.
  - H3: Halaman yang gagal memakai Supabase client berbeda (anon/service tanpa sesi) dibanding halaman pembayaran.
  - H4: Halaman gagal memakai join/relasi (ke tabel kompetisi, tim, pembayaran) yang menghasilkan nol baris (inner join dengan data yang belum ada).
  - Catatan: kuota di `/kompetisi` tetap "0 Peserta / 50" setelah daftar; mungkin hanya menghitung peserta terverifikasi, mungkin juga gejala yang sama.
- **where_to_look:** cari kode yang melayani rute di atas (server components, server actions, route handlers), definisi tabel pendaftaran dan policy RLS di migrations Supabase, fungsi yang membuat Supabase client server-side, dan fungsi finalisasi upload bukti bayar. Bandingkan query halaman `/pembayaran` (berhasil) dengan query halaman yang gagal.
- **fix:**
  1. Identifikasi akar masalah di antara H1–H4 dengan membaca kode dan policy; jangan asumsikan.
  2. Samakan sumber kebenaran: satu fungsi data-access untuk "pendaftaran milik user" yang dipakai semua halaman.
  3. Pastikan SELECT/INSERT/UPDATE policy konsisten memakai `auth.uid()` terhadap kolom owner yang sama.
  4. Jika perlu perubahan policy, buat migration SQL terpisah.
- **acceptance_criteria:**
  - Setelah mendaftar lomba, `/dashboard/peserta` menampilkan KPI > 0, progres maju dari Step 1, dan daftar lomba aktif.
  - `/dashboard/peserta/kompetisi` menampilkan pendaftaran tersebut.
  - `/dashboard/peserta/kompetisi/[id]` menampilkan detail (termasuk kode tim bila ada).
  - `/dashboard/peserta/submission` menampilkan form untuk lomba berbasis karya (UI/UX, Esai) dan tidak menampilkan "Tidak Ada Kompetisi Berbasis Karya" untuk user yang terdaftar.
  - Finalisasi upload bukti bayar sukses dan status tagihan berubah dari "Belum Ada Bukti".
  - User A tidak bisa membaca pendaftaran milik user B (uji RLS negatif).
- **verify:** jalankan skenario E2E di Bagian 5 pada kedua akun uji dan ketiga cabang.

---

### C-02 — Upload KTM tanpa feedback UI
- **severity:** critical (per laporan; dampak UX tinggi)
- **location:** `/dashboard/peserta/profil`
- **symptom:** Upload KTM `dummy-ktm.png` menghasilkan POST 200 OK, tetapi tidak ada toast, preview, nama file, atau status. Status "Menunggu pemeriksaan panitia." baru muncul setelah user mendaftar lomba.
- **expected:** Setelah upload, user langsung melihat konfirmasi sukses/gagal, nama file atau preview, dan status KTM saat ini.
- **fix:** Tampilkan toast sukses/gagal, nama file/preview, dan status KTM (mis. "Menunggu pemeriksaan panitia") segera setelah upload; tangani state loading dan error.
- **acceptance_criteria:**
  - Upload sukses menampilkan toast dan indikator file/status tanpa reload.
  - Upload gagal (file salah tipe/terlalu besar/network error) menampilkan pesan error jelas.
  - Status KTM terlihat setelah reload halaman.
- **verify:** upload gambar valid dan file tidak valid pada akun Mahasiswa.

---

### H-01 — File orphan di Supabase Storage
- **severity:** high
- **location:** `/dashboard/peserta/pembayaran`, bucket `payment-proofs`, path `payment-proofs/{user_id}/{registration_id}/{file_uuid}.png`
- **symptom:** Urutan: POST #1 buat signed URL (sukses, file diupload) → POST #2 verifikasi file di storage (sukses) → POST #3 finalisasi record (gagal). File tertinggal di storage tanpa record DB.
- **expected:** Jika finalisasi gagal, file dihapus (rollback), atau finalisasi bersifat atomik/idempoten.
- **dependency:** kemungkinan besar terpicu oleh C-01; tetap perlu rollback agar tahan terhadap kegagalan lain.
- **fix:**
  1. Pada kegagalan POST #3, hapus objek storage yang baru diupload.
  2. Pertimbangkan job pembersih berkala untuk objek tanpa record.
  3. Sediakan skrip/query untuk menemukan orphan yang sudah ada (untuk dibersihkan manual, jangan hapus otomatis tanpa konfirmasi).
- **acceptance_criteria:**
  - Simulasi kegagalan finalisasi tidak meninggalkan file di bucket.
  - Alur sukses tetap menyimpan file dan record.
- **verify:** uji kegagalan terkontrol (mis. paksa error di langkah finalisasi pada environment dev) lalu cek isi bucket.

---

### H-02 — Data register tidak tersimpan ke profil
- **severity:** high
- **location:** `/register` → `/dashboard/peserta/profil`
- **symptom:** Field Asal Kampus/Instansi dan Nomor WhatsApp yang diisi saat registrasi tidak muncul di profil; hanya Nama dan Email.
- **expected:** Kedua field tersimpan ke profil dan tampil pre-filled.
- **where_to_look:** server action registrasi, trigger/fungsi DB yang membuat baris profil dari `auth.users` (mungkin hanya menyalin nama dan email), skema tabel profil.
- **acceptance_criteria:**
  - Akun baru yang mengisi kampus dan WA melihat nilai itu di `/dashboard/peserta/profil`.
- **verify:** registrasi akun dummy baru dengan semua field terisi, login, cek profil.

---

### H-03 — Prasyarat profil tidak di-enforce sebelum daftar lomba
- **severity:** high
- **location:** `/kompetisi/<slug>` (modal Daftar Sekarang)
- **symptom:** Modal form terbuka tanpa pemeriksaan (0 API call) meski Status pendidikan, Asal sekolah, dan WhatsApp belum diisi. Pemeriksaan KTM untuk Mahasiswa sudah ada di server (pesan: "Mahasiswa wajib mengunggah KTM di Profil sebelum mendaftar lomba.").
- **expected:** Sebelum modal dibuka (UX) dan sebelum pendaftaran diproses (server-side, wajib), sistem memastikan profil lengkap dan mengarahkan user ke profil jika belum.
- **fix:** Tambahkan pemeriksaan kelengkapan profil di server action pendaftaran (sumber kebenaran) dan di UI (disable/arahkan sebelum modal terbuka).
- **acceptance_criteria:**
  - Server menolak pendaftaran dengan pesan jelas jika profil tidak lengkap, walau UI dilewati.
  - UI mengarahkan user ke profil dengan penjelasan field apa yang kurang.
  - Aturan KTM Mahasiswa tetap berlaku; Siswa sekolah tetap boleh daftar tanpa KTM.

---

### H-04 — Fitur Kode Undangan Tim belum ada
- **severity:** high
- **location:** `/kompetisi/esai-ilmiah` (modal pendaftaran); panduan di `/#panduan`
- **symptom:** Panduan menjelaskan kode undangan agar anggota tim bergabung tanpa bayar ulang, tetapi modal Esai tidak punya input kode undangan.
- **expected:** Ada opsi memasukkan Kode Undangan Tim; anggota yang bergabung tidak diberi tagihan baru.
- **needs_clarification:** Konfirmasi dengan pemilik produk apakah fitur ini benar harus ada atau panduan yang perlu diubah. Jika ragu, implementasikan sesuai panduan dan catat asumsi. Detail pendaftaran `[id]` disebut menampilkan "kode tim" sehingga kemungkinan kode dihasilkan saat ketua mendaftar.
- **acceptance_criteria:**
  - Input kode undangan tersedia di alur Esai (dan lomba bertim lain bila relevan).
  - Kode valid menambahkan user ke tim tanpa tagihan baru; kode tidak valid menampilkan error jelas.
  - Batas ukuran tim dihormati (lihat C-konten T-01).

---

### H-05 — PDF Panduan Umum 404
- **severity:** high
- **location:** `/guidebook`
- **symptom:** `/docs/guidebook-permifest-2026.pdf` mengembalikan 404; Baca Online menampilkan fallback error; Unduh PDF mati. Buku Panduan Teknis Umum (v2.1).
- **fix:** Tambahkan file PDF yang benar di path tersebut (biasanya `public/docs/`), atau perbaiki path di data guidebook. Jangan mengarang isi PDF; file harus disediakan pemilik konten. Jika file tidak ada di repo, laporkan sebagai blocker konten dan sembunyikan/nonaktifkan kartu sementara dengan label "segera hadir".
- **acceptance_criteria:** Baca Online dan Unduh untuk keempat dokumen mengembalikan 200.

---

### M-01 — Tidak ada Content-Security-Policy
- **severity:** medium
- **location:** semua halaman (header respons)
- **fix:** Tambahkan header CSP melalui `next.config` (`headers()`) atau middleware. Mulai dari mode `Content-Security-Policy-Report-Only` untuk menghindari memecah halaman, lalu perketat. Pertimbangkan kebutuhan: script Next.js (nonce atau `'unsafe-inline'`), iframe `blob:` untuk viewer PDF (`frame-src blob:`), gambar dari Supabase signed URL (`img-src`), koneksi ke Supabase (`connect-src`). Sesuaikan dengan sumber yang benar-benar dipakai, jangan menebak.
- **acceptance_criteria:** Header CSP ada; semua fitur (PDF viewer, upload, QRIS, theme toggle) tetap berfungsi tanpa pelanggaran CSP di console.

### M-02 — CORS wildcard
- **severity:** medium
- **symptom:** `Access-Control-Allow-Origin: *` pada respons HTML.
- **fix:** Hapus header wildcard atau batasi ke origin yang dibutuhkan. Periksa konfigurasi di `next.config`, middleware, atau `vercel.json`.
- **acceptance_criteria:** Respons halaman tidak mengirim `*`; tidak ada fitur yang rusak.

### M-03 — Akun aktif tanpa verifikasi email
- **severity:** medium
- **symptom:** Registrasi mengembalikan `requiresVerification: false`; akun langsung aktif; tidak ada auto-login (redirect ke `/login`).
- **fix:** Aktifkan "Confirm email" di Supabase Auth dan sesuaikan alur UI (pesan "cek email Anda", halaman callback verifikasi, resend). Ini perubahan konfigurasi + kode; catat bahwa pengaturan Supabase dashboard tidak bisa diubah dari repo, sertakan langkah manual.
- **needs_clarification:** Konfirmasi pemilik produk sebelum mengaktifkan, karena memengaruhi onboarding peserta.
- **acceptance_criteria:** Akun belum bisa login sebelum verifikasi; email verifikasi terkirim; alur resend tersedia.

### M-04 — Navbar publik tidak sinkron dengan status login
- **severity:** medium
- **location:** `/`, `/kompetisi`, `/guidebook`, `/leaderboard`, `/pengumuman`
- **symptom:** Navbar selalu menampilkan Masuk/Daftar walau user sudah login (0 request cek sesi).
- **fix:** Cek sesi di server (layout/komponen header) dan tampilkan link "Dashboard"/"Keluar" saat login. Waspadai efek pada caching/static rendering.
- **acceptance_criteria:** User login melihat link Dashboard; user anonim melihat Masuk/Daftar; tidak ada flicker yang mengganggu.

### M-05 — robots.txt membocorkan rute internal
- **severity:** medium
- **symptom:** `Disallow: /admin/` dan `/juri/` terlihat publik.
- **fix:** Hapus entri tersebut dari `robots.txt`; pastikan rute dilindungi autentikasi dan otorisasi berbasis role di server (bukan mengandalkan robots). Pertahankan entri yang tidak sensitif sesuai kebutuhan.
- **acceptance_criteria:** `robots.txt` tidak menyebut `/admin/` dan `/juri/`; akses tanpa hak ditolak server-side.

### M-06 — Validasi nomor WhatsApp lemah
- **severity:** medium
- **location:** `/dashboard/peserta/profil` (dan `/register`, dan penyimpanan server)
- **symptom:** `type="tel"` tanpa `pattern`/`minlength`; menerima teks non-angka.
- **fix:** Tambahkan validasi client (pattern, panjang) DAN validasi server (mis. skema Zod). Format yang diterima perlu dikonfirmasi (nomor Indonesia, awalan `08`/`+62`).
- **acceptance_criteria:** Nilai non-angka atau panjang tidak wajar ditolak dengan pesan jelas di client dan server.

### M-07 — Konfirmasi password tidak cocok tanpa pesan
- **severity:** medium
- **location:** `/register`
- **fix:** Tampilkan pesan error inline pada field konfirmasi dan/atau `setCustomValidity`; sertakan validasi server.
- **acceptance_criteria:** Saat tidak cocok, pesan error terlihat dan form tidak terkirim.

### L-01 — `/dashboard` layar kosong sesaat
- **fix:** Ganti redirect client-side dengan server-side `redirect('/dashboard/peserta')` (atau `redirects()` di config, 307).
- **acceptance_criteria:** Request ke `/dashboard` langsung mengembalikan 307 ke `/dashboard/peserta` (saat belum login: lanjut ke login dengan redirect).

### L-02 — `/forgot-password` tidak redirect saat login
- **fix:** Terapkan guard yang sama seperti `/login` dan `/register`.
- **acceptance_criteria:** User login yang membuka `/forgot-password` diarahkan ke `/dashboard/peserta`.

### L-03 — Typo "Nama Tim * *"
- **location:** modal pendaftaran Esai. **fix:** Hapus asterisk ganda. **acceptance:** Label tampil `Nama Tim *`.

### L-04 — Label Status pendidikan tanpa `*`
- **location:** `/dashboard/peserta/profil`. **fix:** Tambahkan indikator wajib sesuai atribut `required`. **acceptance:** `*` terlihat.

### L-05 — `<label>` tidak terhubung ke `<input>`
- **location:** modal pendaftaran. **fix:** Gunakan `htmlFor`/`id` yang unik. **acceptance:** Klik label memfokuskan input; screen reader membaca label.

### L-06 — Tidak ada landmark `<main>`
- **location:** `/kompetisi/<slug>`. **fix:** Bungkus konten utama dengan `<main>`. **acceptance:** Tepat satu `<main>` per halaman.

### L-07 — Breadcrumb "Hasil E-Sport"
- **location:** `/dashboard/peserta/hasil`. **fix:** Ubah menjadi "Hasil & Pengumuman" (sesuai nama menu sidebar). **acceptance:** Breadcrumb sesuai.

### L-08 — sitemap.xml: domain salah dan double slash
- **symptom:** Domain `permifestxeforkavest` (tanpa `-x-`) berbeda dari domain aktual `permifest-x-deforkavest.vercel.app`; semua `<loc>` memiliki `//` ganda (mis. `//kompetisi`).
- **fix:** Gunakan base URL dari satu variabel konfigurasi dan gabungkan path dengan benar (tanpa slash ganda).
- **acceptance_criteria:** Semua `<loc>` berformat `https://<domain-aktual>/<path>` tanpa `//` ganda.

### I-01 s.d. I-04 (informasional, tidak wajib)
- I-01: header `Server: Vercel` (standar, abaikan).
- I-02: tidak ada `X-XSS-Protection` (legacy, abaikan; CSP lebih relevan).
- I-03: tidak ada `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy`; pertimbangkan opsional setelah CSP.
- I-04: `sb-project-ref` terlihat di header Supabase (standar, abaikan). Catatan terkait: signed URL membuka UUID internal (`user_id`, `registration_id`, file UUID) dan URL Supabase; pertimbangkan masa berlaku signed URL yang pendek.

---

## 4. Inkonsistensi Konten (butuh keputusan pemilik konten)

Agent TIDAK boleh memilih nilai yang benar sendiri. Kumpulkan lokasi, ajukan pertanyaan, atau gunakan satu sumber data bersama setelah ada jawaban.

| ID | Aspek | Sumber A | Sumber B | Pertanyaan keputusan |
|---|---|---|---|---|
| T-01 | Ukuran tim IT-SA | Kartu landing, `/kompetisi`, halaman detail | FAQ #1 | Individu (1 orang) atau tim 2–3 orang? |
| T-02 | Biaya IT-SA | `/kompetisi`: Rp 50.000 | Kartu `/guidebook`: Rp 50.000 per tim | Per orang atau per tim? |
| T-03 | E-Sport | Disebut di `/`, `/register`, `/guidebook`, `/informasi`, `/leaderboard` | `/kompetisi` hanya 3 lomba akademik | E-Sport bagian dari acara atau perlu dihapus dari teks? |
| T-04 | Deadline Gelombang 1 | Hero countdown | Daftar jadwal; sidebar `/kompetisi/*` | Tanggal mana yang benar? |
| T-05 | Status leaderboard | `/dashboard/peserta/hasil`: "Hasil akhir telah disahkan dan dikunci" | `/leaderboard`: "Hasil kompetisi resmi belum dirilis" | Apakah hasil sudah dirilis? Sinkronkan ke satu flag data. |

**Rekomendasi teknis:** pusatkan data lomba (nama, biaya, ukuran tim, deadline, status rilis hasil) pada satu sumber (konstanta/tabel) yang dipakai semua halaman.

---

## 5. Skenario Verifikasi E2E (jalankan setelah C-01 dan di akhir)

Jalankan pada KEDUA akun uji dan untuk KETIGA cabang (IT System Architecture, Esai Ilmiah, UI/UX Design).

| # | Langkah | Hasil yang diharapkan |
|---|---|---|
| 1 | Register akun baru dengan kampus dan WA terisi | Berhasil; data tersimpan ke profil (H-02) |
| 2 | Login | Masuk ke `/dashboard/peserta` |
| 3 | Lengkapi profil; Mahasiswa upload KTM | Ada feedback sukses dan status KTM (C-02) |
| 4 | Buka `/kompetisi/<slug>` dengan profil belum lengkap | Diarahkan ke profil, bukan membuka form (H-03) |
| 5 | Daftar lomba | Redirect ke `/pembayaran`; tagihan tampil |
| 6 | Buka Overview, Kompetisi Saya, Detail `[id]`, Submission | Semua menampilkan pendaftaran (C-01) |
| 7 | Upload bukti bayar | Sukses; status tagihan berubah; tidak ada orphan (H-01) |
| 8 | Daftar cabang kedua pada akun yang sama | Dua tagihan tampil; status pendidikan terkunci |
| 9 | Akses data user lain dengan ID pendaftaran milik akun lain | Ditolak/tidak ditemukan (RLS negatif) |
| 10 | Logout lalu akses `/dashboard/peserta` | Redirect ke `/login` |
| 11 | Cek `/guidebook` keempat dokumen | Semua 200 (H-05) |
| 12 | Cek header respons | CSP ada, tidak ada ACAO `*` (M-01, M-02) |
| 13 | Cek `/robots.txt` dan `/sitemap.xml` | Sesuai M-05 dan L-08 |

Catat hasil tiap langkah sebagai PASS/FAIL beserta bukti (respons, tangkapan layar, atau output test).

---

## 6. Format Laporan Akhir yang Diminta dari Agent

```
## Ringkasan
- Issue selesai: [daftar ID]
- Issue dilewati/sudah teratasi oleh issue lain: [ID + alasan]
- Issue butuh keputusan manusia: [ID + pertanyaan]

## Per Issue
### <ID>
- Akar masalah (terverifikasi di kode): ...
- File yang diubah: ...
- Migration/konfigurasi manual diperlukan: ya/tidak (detail)
- Bukti verifikasi: ...
- Sisa risiko: ...
```

---

*Sumber: Laporan QA Testing Permifest x Deforkafest 2026 (28 November 2026), black-box. Diagnosis terkait RLS/database adalah inferensi dan wajib diverifikasi pada kode dan database nyata.*
