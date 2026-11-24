# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/). Versi: SemVer (pra-rilis `0.x`). Waktu UTC.

## [Unreleased]

### Added
- Profil peserta memuat status pendidikan dan alur unggah KTM privat. Mahasiswa perlu mengunggah KTM sebelum mendaftar, sementara koreksi status setelah pendaftaran pertama hanya dapat dilakukan super admin.
- Dashboard juri membaca penugasan dari Supabase, menyamarkan identitas peserta, serta membatasi unduhan karya ke penugasan milik juri. Form penyimpanan skor belum tersambung ke Supabase.
- Penguatan autentikasi dan role: menghapus role-switcher, mengambil profil dan role dari Supabase, menolak akses dashboard lintas role, menambahkan MFA wajib untuk Super Admin, serta menyediakan script provisioning akun demo yang hanya menerima Supabase lokal.
- Seeder demo menolak email Auth yang dipakai akun tanpa `app_metadata.permifest_demo=true`; seeding ulang hanya memperbarui akun demo yang ditandai.
- Profil kini disimpan melalui sesi pengguna; validasi password baru dipakai pada registrasi, reset, dan perubahan password. Password lama tetap dapat dipakai untuk login.
- Modul Pengumpulan Karya Peserta (Submission - T3.1):
  - Modul domain `src/features/submissions/` dengan validasi Zod (`schema.ts`), queries database server-side (`queries.ts`), dan Server Action `submitWorkAction` (`actions.ts`).
  - Penegakan integritas server-side: verifikasi kepemilikan registrasi, pengecekan status pendaftaran terverifikasi, validasi deadline tahapan lomba, penomoran versi otomatis (`version = 1, 2, ...` & `is_latest`), serta pencatatan ke `audit_logs`.
  - Integrasi live halaman pengumpulan peserta di `/dashboard/peserta/submission` (unggah berkas PDF/DOCX ke Supabase Storage bucket `submissions` via signed URL, atau input tautan Figma) dengan dukungan animasi Sakuga Button.
  - Integrasi live halaman pemantauan submission panitia di `/dashboard/admin/submission` (tabel karya masuk, filter cabang lomba, pratinjau, dan unduhan berkas melalui signed download URL bertenggat waktu).
- Integrasi Kalender Acara & Ekspor Mandiri (`src/lib/calendar.ts`):
  - Generator URL Google Calendar otomatis dan file iCalendar (`.ics`) standar RFC 5545 yang kompatibel langsung dengan Google Calendar, Apple Calendar (iPhone/Mac), dan Microsoft Outlook.
  - Penyatuan agenda seminar, webinar teknologi, workshop, dan malam penganugerahan ke dalam kalender publik `TimelineSection.tsx` (grid Desember 2026 dan mode daftar terpadu) lengkap dengan tombol ekspor kalender dan filter kategori (*Semua Acara*, *Tahapan Lomba*, *Seminar & Workshop*).
  - Tombol simpan ke Google Calendar dan unduh file `.ics` pada kartu agenda dan pop-up modal detail di `EventsSection.tsx`.
- Optimasi SEO & Metadata Social Share:
  - Konfigurasi `robots.ts` dengan izin crawling rute publik dan pembatasan area dashboard/api privat.
  - Pembangkitan `sitemap.ts` otomatis untuk seluruh rute publik dan halaman cabang kompetisi (`/kompetisi/[slug]`).
  - Metadata OpenGraph dan Twitter Card lengkap di `src/app/layout.tsx` dengan banner resmi, deskripsi multibahasa, dan tags pengindeksan Googlebot.
- Halaman Fallback Interaktif (Pop-Art Style):
  - Halaman kustom 404 `src/app/not-found.tsx` dengan nuansa pop-art, pesan informatif, dan tombol navigasi kembali ke beranda atau cabang lomba.
  - Komponen Error Boundary `src/app/error.tsx` untuk penanganan error runtime yang anggun dan opsi muat ulang otomatis.
- Modul Agenda Event & Seminar Nasional (`/dashboard/admin/events` & Landing Page):
  - CRUD Agenda Seminar, Webinar Teknologi, Workshop, dan Malam Penganugerahan (Awarding Night) di panel admin dengan dukungan Light/Dark mode, manajemen pembicara dinamis, jadwal, kuota, format daring/luring/hybrid, dan tautan pendaftaran.
  - Section publik `EventsSection` di Landing Page (`src/components/landing/EventsSection.tsx`) dengan kartu pop-art, avatar narasumber, status kuota, dan modal detail interaktif.
  - Tautan navigasi "Agenda Seminar" pada Navbar atas dan menu "Agenda & Seminar" pada sidebar panel admin.
- Pohon Alur Perlombaan yang Dapat Diedit (*Editable Competition Workflow Tree*):
  - Halaman manajemen alur lomba dinamis di panel admin (`/dashboard/admin/alur`) untuk mengatur tahapan alur (registrasi, kurasi, pengumpulan, penjurian, TM, final, awarding), mengubah urutan, menetapkan status (*upcoming, active, completed*), serta menyaring alur per cabang lomba.
  - Mode tampilan "Pohon Alur (Workflow Tree)" interaktif pada `TimelineSection.tsx` di Landing Page publik, lengkap dengan garis alur vertikal, penanda milestone kunci, dan petunjuk aksi bagi peserta.
  - Navigasi "Alur Lomba (Workflow)" di grup Penilaian & Lomba pada Sidebar admin.

### Changed
- Pembersihan data hardcoded secara menyeluruh di seluruh permukaan UI (Landing Page & Dashboard Panel):
  - Footer (`footer.tsx`): Narahubung WhatsApp, email panitia, akun Instagram Permikomnas & IMPSI, alamat resmi kampus UST, dan daftar link lomba kini membaca secara dinamis dari `systemSettings` dan `competitions`.
  - Hitung Mundur (`CountdownTimer.tsx`): Target waktu dan label tanggal deadline kini otomatis terhitung dari konfigurasi `systemSettings.registration_close_at`.
  - Hero Section (`HeroSection.tsx`): Jumlah cabang lomba dan status pendaftaran terbuka membaca dinamis dari state store.
  - Panduan Pendaftaran (`HowToRegisterSection.tsx`): Jumlah pilihan cabang lomba terhubung secara dinamis.
  - Tanya Jawab (`FaqSection.tsx` & `src/app/informasi/page.tsx`): Pertanyaan dan jawaban FAQ serta kontak sekretariat membaca langsung dari state `faqs` dan `systemSettings` terpusat.

### Fixed
<<<<<<< HEAD
- Penghapusan Role Switcher Demo & Pengetatan Akses Hak Peran:
  - Menghapus komponen demo role-switcher ("Ganti Role Demo: DEV ONLY") pada Sidebar dashboard (`src/components/layout/sidebar.tsx`) sehingga pengguna/peserta tidak dapat lagi mengganti peran secara bebas ke panitia, juri, atau super admin.
  - Memperketat `AdminAreaLayout` (`/dashboard/admin`), `JuriAreaLayout` (`/dashboard/juri`), dan `PesertaAreaLayout` (`/dashboard/peserta`) untuk selalu memvalidasi peran pengguna dari sesi server sebelum merender konten, dan mengarahkan otomatis (*redirect*) pengguna yang tidak berwenang kembali ke dashboard peserta.
  - Memperbaiki rekursi RLS pada relasi `team_members` di database Supabase dengan fungsi `is_team_member` bertipe `SECURITY DEFINER` (`20261124000001_fix_team_members_rls_recursion.sql`).
  - Mengamankan query admin `getAllSubmissionsForAdminQuery` agar menggunakan `createAdminClient()` di sisi server setelah verifikasi izin `submissions.read`.
=======
- Navbar: Agenda Seminar tetap tampil di desktop, agenda kosong mempertahankan target `#agenda`, dan penanda Guidebook mengikuti halaman aktif di navbar mobile.
>>>>>>> d43eafe (fix: restore public navbar navigation)
- Audit pra-deployment:
  - Perbaikan 2 error ESLint dan 4 warning: penggantian `any` type pada `src/app/informasi/page.tsx`, perbaikan cascading `setState` dalam effect `src/components/guidebook/PdfViewerModal.tsx` dengan pembungkusan `useCallback`, pembersihan dependensi dan variabel tidak terpakai di `src/components/landing/CompetitionsSection.tsx`, dan penambahan metadata berkas di `src/app/guidebook/page.tsx`.
  - Pengamanan mutlak akun demo dan injeksi cookie demo (`src/features/auth/actions.ts`, `src/proxy.ts`, `src/lib/auth/session.ts`) agar tidak dapat disalahgunakan di lingkungan produksi (hanya aktif di development atau saat flag `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true` sengaja disetel).
  - Pembuatan template variabel lingkungan publik dan server `.env.example`.
  - Verifikasi kebersihan kode: 0 `console.log`, 0 hardcoded secrets, lolos 100% `npm run lint`, `npm run typecheck`, dan `npm run build` (47/47 rute sukses).

### Added
- Fitur Buku Panduan Online (**Guidebook Online**) menyeluruh untuk Panitia, Peserta, dan Publik:
  - Panel Admin & Panitia (`/dashboard/admin/guidebook`): antarmuka CRUD buku panduan teknis umum dan rulebook 5 cabang lomba (Esai Cyber Security, UI/UX, ITSA, PES 2026, MLBB) dengan dukungan upload berkas PDF langsung (drag-and-drop, validasi 15MB) atau tautan URL, status publikasi, dan catatan rilis revisi.
  - Komponen Pembaca Dokumen Terpadu (`PdfViewerModal`): in-browser native frame PDF viewer responsif dengan kontrol fullscreen, buka di tab baru, unduh langsung, dan penanganan fallback perangkat seluler tanpa beban dependensi eksternal.
  - Halaman Publik Buku Panduan (`/guidebook`): katalog terorganisir per cabang lomba dengan kartu interaktif pop-art, tombol "Baca Online" seketika, dan tombol "Unduh PDF".
  - Integrasi terpadu di Landing Page (`CompetitionsSection`): tombol "Baca Rulebook PDF" langsung pada modal rincian tiap cabang lomba.
  - Integrasi di Pusat Informasi (`/informasi`): kartu guidebook dinamis dengan akses cepat baca online dan tautan rulebook.
  - Penambahan menu navigasi "Buku Panduan (Guidebook)" di Sidebar panel admin dan tautan navigasi di Navbar & Footer.

- Background pop-art bertema Landing Page pada halaman autentikasi (`/login` dan `/register`): pola CSS grid diagonal ultra-ringan, ambient atmosphere glow ganda, dan manga pop stamps mengambang statis di luar form card pada layar desktop.
- Pola grid diagonal halus murni CSS dan ambient gradient lembut di latar belakang Hero Section (`SakugaHeroBackground.tsx`) tanpa beban repaint GPU.
- Pengembalian format badge hiasan ber-ikon pop-art (`GameController`, `Trophy`, `MapPin`) di sekitar ilustrasi maskot Hero Section (`HeroSection.tsx`) sesuai konsep visual sebelumnya.
- Penetapan atribut `select-none` pada berbagai elemen teks dekoratif (badge washi-tape, digit hitung mundur, brand title, header kalender, nomor langkah, dan tag kategori) untuk kenyamanan dan kesan interaksi solid layaknya aplikasi profesional.

### Changed
- Penyelarasan antarmuka manajemen Guidebook (`/dashboard/admin/guidebook`) dan modal pembaca PDF (`PdfViewerModal`) dengan standar desain panel admin Permifest:
  - Dukungan penuh untuk mode terang (**light mode**) dan mode gelap (**dark mode**) dengan mengganti hardcoded dark palette menjadi semantic tokens Tailwind CSS (`bg-card`, `bg-background`, `border-border`, `text-foreground`, `text-muted-foreground`, dll.).
  - Penggantian bayangan ganda kartun dengan standar kartu dashboard (`shadow-sm`, border rapi).
  - Penyesuaian form input, dropdown, area upload drag-and-drop, tab kategori, serta badge cabang lomba agar memiliki kontras tinggi dan keterbacaan yang sempurna baik di tema terang maupun tema gelap.
- Penyeragaman warna seluruh ikon pada section Narahubung & Venue serta media sosial di Footer (`footer.tsx`) menjadi warna aksen brand ungu `#9B6BF2` dalam container rounded yang rapi dan konsisten.

- Relokasi `CountdownTimer` menjadi Banner Hitung Mundur Horisontal (`CountdownBanner`) yang ditempatkan secara strategis di antara `HeroSection` dan `PartnersSection` dengan digit waktu tabular kontras tinggi, aksen washi-tape emas-ungu, dan tombol call-to-action cepat.
- Efek playful interaktif pada `HeroSection.tsx`: stiker pop-art manga kinetik bertema washi-tape (*"5 Cabang Lomba!"*, *"Total Hadiah Puluhan Juta!"*, dan *"Arena Kampus UST"*) dengan efek hover kinetik membal (`scale-110 rotate-x`) di sekitar ilustrasi maskot.
- Panduan mekanisme pendaftaran komprehensif di `HowToRegisterSection.tsx`: 4 tahapan alur registrasi yang jelas, callout khusus mekanisme tim beregu & kode undangan (*team invite code*), daftar berkas wajib (KTM/Kartu Pelajar, pas foto, bukti bayar), dan tautan rulebook resmi.
- Redesain halaman autentikasi (`/login` dan `/register`) menyesuaikan tema pop-art Landing Page: latar malam `#0B0720`, kartu pop `#140D33` dengan border komik `#2E2266` dan solid block shadow ganda `[6px_6px_0px_#0B0720,8px_8px_0px_#9B6BF2]`, washi-tape header, mini ilustrasi maskot resmi, dan tombol aksi `<SakugaButton>`.
- Rute API Logout `/api/auth/logout` dan integrasi metode `logout()` pada client store (`src/lib/store.tsx`) untuk pembersihan menyeluruh cookie sesi, state pengguna, dan Supabase Auth session.

### Changed
- Minimalisir penggunaan ikon dekoratif berlebihan di seluruh Landing Page (`HeroSection`, `PartnersSection`, `LeaderboardTeaser`, `HowToRegisterSection`, `FaqSection`, `StickyBottomBar`, dan `footer`) guna meningkatkan keterbacaan, ruang bernapas (*breathing room*), dan kecepatan rendering.
- Perbaikan alur logout pada Sidebar navigasi (`src/components/layout/sidebar.tsx`) dan penambahan tombol aksi cepat keluar di Header Dashboard (`src/components/layout/dashboard-layout.tsx`).
- Penyempurnaan pemeriksaan status login di Navbar (`src/components/layout/navbar.tsx`): tombol Dashboard hanya muncul saat pengguna sudah login, dan tombol Masuk disembunyikan jika sesi aktif.

- Integrasi resmi Web Component Sakuga Button (`<sakuga-button>`) dari `https://sakuga-vfx.vercel.app/button/button.js` di `public/button.js`, dimuat via `<script src="/button.js" defer></script>` di `src/app/layout.tsx` dengan deklarasi TypeScript `src/types/sakuga.d.ts` dan pemanggilan `el.done()` pada aksi sukses di `/dashboard/peserta/submission`.
- Pembesaran proporsional ilustrasi resmi `public/ilustrasi.png` pada `HeroSection.tsx` (hingga 620px) dan `CtaClosingSection.tsx` (hingga 340px) dengan respons drop shadow seimbang.
- Penyempurnaan logika autentikasi Navbar (`src/components/layout/navbar.tsx`): tombol Dashboard disembunyikan jika belum login, dan tombol Masuk disembunyikan jika sudah login (hanya tombol Ke Dashboard yang aktif).
- Fleksibilitas input logo pada CRUD Mitra & Sponsor (`/dashboard/admin/mitra`): mendukung input tautan/link URL atau upload berkas file gambar langsung (PNG, SVG, JPG, WebP) dengan preview instan.
- Pembersihan dan perapian (*decluttering*) UI kartu mitra & sponsor di halaman admin panel dan landing page: penghapusan badge kategori yang menumpuk di atas logo demi tampilan yang bersih, lega, bernapas (*breathing room*), dan profesional.
- Pembersihan dan optimasi performa skala penuh (zero-lag):
  - Penghapusan `scroll-behavior: smooth` di tingkat root CSS dan eliminasi seluruh listener event scroll JS pada `Navbar` dan `StickyBottomBar` (digantikan CSS sticky native dan browser `IntersectionObserver` ringan) sehingga scrolling halaman terasa instan dan bebas stutter.
  - Pelepasan dependensi modul Canvas 2D engine `sakuga-engine.ts` dari `<SakugaButton>` sehingga tombol bekerja 100% via CSS murni tanpa overhead komputasi canvas.
  - Penggantian maskot SVG kompleks 320 baris di `CtaClosingSection` dengan `<Image src="/ilustrasi.png" ... />` teroptimasi Next.js WebP.
  - Penyediaan aset vektor lokal lengkap di `public/brand/` (`nawasena.svg`, `deforkafest.svg`, `sponsor-dicoding.svg`, `sponsor-indosat.svg`) untuk mencegah request berulang 404 pada Next.js image proxy.
  - Pembersihan total class animasi berulang (`animate-pulse` di countdown separator dan status footer, keyframes `.fl`, dan `pulse-dot`).
- Integrasi ilustrasi resmi Permifest x Deforkafest 2026 (`/ilustrasi.png`) via `next/image` dengan kompresi WebP otomatis, eliminasi total CPU overhead, dan tampilan grafis berkualitas tinggi.
- Optimasi ultra-ringan pada Hero Section (`HeroSection.tsx` & `SakugaHeroBackground.tsx`): penghapusan animasi CSS infinite loop repaint (`.fl` floating), pembersihan elemen background berat (repeating 48px grid, oversized transformed slash bars, dan multiple `animate-pulse`), serta penggantian indikator live menjadi badge status statis bersih.
- Standardisasi tombol aksi ke format **Pop-Art Kinetik Berbasis CSS Murni** (`<SakugaButton>`) dengan border komik pekat, hover miring dinamis `rotate(-1.5deg) skewX(-2deg)`, solid manga shadow pop yang membal `hover:shadow-[7px_7px_0px_#0B0720,10px_10px_0px_#FFE359]`, dan tactile press `active:scale-95` yang diproses 100% oleh GPU browser di level *Compositor Thread*.
- Pencopotan total script `public/button.js` dan Web Component `<sakuga-button>` untuk mengeliminasi looping `requestAnimationFrame` abadi, forced synchronous layout thrashing (`getBoundingClientRect`), serta canvas fullscreen 100vw x 100vh yang sebelumnya membebani CPU/GPU pengguna.
- Pembersihan dan optimasi penuh performa rendering: beban CPU saat halaman diam turun drastis ke ~0% dengan respons interaksi instan tanpa jeda.
- Integrasi resmi Web Component Sakuga Button (`<sakuga-button>`) tanpa dependensi eksternal dari `https://sakuga-vfx.vercel.app/button/button.js` tersimpan di `public/button.js`, dimuat melalui plain `<script src="/button.js"></script>` di `src/app/layout.tsx`.
- Deklarasi TypeScript `src/types/sakuga.d.ts` untuk `JSX.IntrinsicElements['sakuga-button']` dan method `el.done(hold)` pada elemen HTML.
- Pengkabelan (wiring) tombol submit form dengan Sakuga Web Component dan pemanggilan method `el.done()` saat aksi berhasil (misal: submit berkas karya di `/dashboard/peserta/submission`, login akun di `/login`, dan registrasi di `/register`).
- Animasi expand/collapse akordion interaktif pada FAQ (`FaqSection.tsx`) dengan transisi grid rows, nomor urut bertema manga kartun, dan rotasi icon panah halus.
- Redesain Footer lebih kaya (*rich style*) di `src/components/layout/footer.tsx`: 5 kolom terstruktur, profil penyelenggara (Permikomnas DIY & IMPSI UST), tautan cabang kompetisi, tautan cepat panduan & bantuan, narahubung WhatsApp resmi & venue offline Kampus UST Yogyakarta, serta status operasional sistem.
- Penghapusan efek letupan onomatopoeia pop text ("EXPLORE!!", "OK!!") pada tombol kartu kompetisi dan tombol modal kalender agar tampilan lebih bersih dan profesional.
- Integrasi penuh data cabang kompetisi Landing Page (`CompetitionsSection.tsx`) langsung dari database Supabase / Backend via `competitionRepository.getAll()`.
- Implementasi penuh Sakuga VFX Button Action Style (`src/components/ui/sakuga-button.tsx`) dengan hard anime border, solid block pop shadow (`shadow-[4px_4px_0px_#0B0720]` membal menjadi `hover:shadow-[7px_7px_0px_#0B0720,10px_10px_0px_#FFE359]`), miring dinamis `rotate(-1.5deg) skewX(-2deg)`, dan sensasi tactile press saat ditekan.
- Pembersihan layout kanan Hero Section (`HeroSection.tsx`) dengan menghapus floating badges yang menumpuk di samping maskot, sehingga maskot Kupu-kupu Deforkafest tampil megah, proporsional, dan seimbang di sebelah kanan.
- Penyesuaian Navbar (`src/components/layout/navbar.tsx`) bergaya anime pop Permifest x Deforkafest dengan tombol Masuk dan Daftar berbasis Sakuga Button.
- Dukungan akun demo seeder dan auto-auth fallback pada `loginAction` (`src/features/auth/actions.ts`), `session.ts`, dan `proxy.ts` yang memungkinkan login instan untuk 4 role (`peserta@permifest.id`, `juri@permifest.id`, `panitia@permifest.id`, `admin@permifest.id`) dengan password `password123`.
- Redesain halaman otentikasi publik (`/login` dan `/register`) bergaya Manga Pop Art Permifest x Deforkafest dengan kotak dialog komik, ambient atmosphere glow, tombol aksi Sakuga, dan tombol cepat One-Click Role Selector untuk pengujian.
- Transformasi section peringkat beranda (`LeaderboardTeaser.tsx`) mengadopsi standar event nasional (referensi Arkavidia) menjadi "Apresiasi & Hadiah Kompetisi (Prize Pool & Benefit Showcase)" dengan 3 kartu benefit (Total Hadiah Puluhan Juta, Rekam Jejak Sertifikat Resmi, Panggung Final & Networking) serta callout transparan jadwal live leaderboard.
- Perbaikan layout Manga Modal Kalender (`TimelineSection.tsx`) agar badge washi tape tidak terpotong tepi container, serta pembersihan elemen visual ikonik dekoratif yang berlebihan pada hero section dan kalender.
- Hard Manga Pop Shadow dan penguatan efek hover kinetik anime (`.comic-card-hover` dan `.comic-card-hover-alt`) dengan transisi `translateY(-6px) rotate(-1.5deg) skewX(-1.5deg)` dan solid block shadow ganda (`7px 7px 0px #9B6BF2, 11px 11px 0px #D56BD9`).
- Efek parallax interaktif pada Maskot Kupu-kupu Deforkafest di Hero Section dengan respons gerakan mouse 3D tilt, pulse neon aura glow, dan floating anime badges ("5 Cabang Lomba", "Hadiah Puluhan Juta", "UST Yogyakarta").
- Peningkatan visual kartu kompetisi (`CompetitionsSection.tsx`) dengan efek manga corner slash flare, border glow hover, transisi scale, dan integrasi tombol aksi `<SakugaButton>` pada modal panduan.
- Peningkatan UI pada alur pendaftaran 4 langkah (`HowToRegisterSection.tsx`), teaser leaderboard podium (`LeaderboardTeaser.tsx`), dan mobile quick-action bar (`StickyBottomBar.tsx`) dengan animasi kinetik bounce dan feedback partikel Sakuga.
- Modul visual kinetik Sakuga VFX (`src/lib/sakuga/sakuga-engine.ts`) berbasis Canvas 2D overlay dengan fisika partikel anime (diamond shards, speed slash lines, shockwave donut, anime kira stars, serta teks onomatopoeia manga dengan outline pekat).
- Komponen interaktif `<SakugaButton>` (`src/components/ui/sakuga-button.tsx`) dengan animasi spring squash & stretch, transisi overshoot, integrasi palet warna Permifest, serta kompatibilitas penuh dengan `prefers-reduced-motion`.
- Integrasi tombol aksi berenergi kinetik Sakuga pada Hero Section CTA Landing Page ("Daftar Sekarang", "Lihat cabang lomba"), Closing CTA Section, dan tombol Kirim Karya Final pada Lembar Pengumpulan Peserta (`/dashboard/peserta/submission`).
- Standardisasi migrasi database Supabase di `supabase/migrations/` (Schema, Functions & Triggers, RLS, Storage).
- Skema 20 tabel PostgreSQL, custom enum, constraints, dan index performa sesuai `docs/SCHEMA.md`.
- Fungsi keamanan dan trigger: `has_role` berlingkup lomba, `handle_new_user` (default registrasi selalu peserta), `guard_locked_scores` (kunci nilai), `admin_override_score` (audit darurat), serta view `v_final_scores`.
- Row Level Security (RLS) aktif pada seluruh tabel dengan kebijakan bertingkat (Peserta, Juri, Panitia, Super Admin).
- Konfigurasi bucket Supabase Storage (`payment-proofs`, `submissions`, `identity-docs`, `public-assets`) dengan storage policies.
- Data awal `supabase/seed.sql` berisi peran, event Permifest x Deforkafest, tema, 5 cabang lomba, tahapan, dan contoh rubrik penilaian berbobot 100%.
- Halaman Lembar Penilaian Juri Dedikasi (`/dashboard/juri/penugasan/[assignmentId]`) dengan split view viewer dokumen karya/Figma dan form rubrik penilaian dengan kalkulasi skor terbobot otomatis.
- Rute Pengaturan Juri (`/dashboard/juri/pengaturan`) untuk navigasi profil akun juri.
- Guard otorisasi khusus peran `super_admin` pada halaman Koreksi Darurat Break-Glass (`/dashboard/admin/koreksi-darurat`) sesuai mandat protokol `docs/SECURITY.md`.
- Mesin validasi form dinamis Zod (`src/lib/config/dynamic-form.ts`) yang membangun validator dari JSONB `form_fields` untuk klien dan server.
- Modul konfigurasi kebijakan event (`src/lib/config/settings.ts`) mematuhi Golden Rule #2 dan DECISIONS.md C-01 s/d C-17 (kebijakan partisipasi ganda, filter benturan instansi juri, mode leaderboard).
- Halaman Detail Pendaftaran Lomba Peserta (`/dashboard/peserta/kompetisi/[id]`) untuk melihat berkas pendaftaran, kode undangan tim, dan anggota tim.
- Hardening keamanan Role Switcher: disembunyikan secara otomatis di environment produksi (`process.env.NODE_ENV === 'production'`) untuk mencegah eskalasi peran demo.
- Server-side Layout Guards (`src/app/dashboard/admin/layout.tsx`, `src/app/dashboard/juri/layout.tsx`, `src/app/dashboard/peserta/layout.tsx`) menerapkan prinsip Defense-in-Depth dengan `requireRole` di level Server Component.
- Halaman Reset Kata Sandi publik (`/reset-password`) terhubung dengan Server Action `updatePasswordAction`.
- Halaman konfirmasi email baru (`/verifikasi-email`) dengan panduan langkah aktivasi akun.
- Security Headers di `next.config.ts` (HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy).
- Modul Supabase Auth SSR lengkap: skema validasi Zod (`src/features/auth/schema.ts`), Server Actions (`loginAction`, `registerAction`, `logoutAction`, `forgotPasswordAction` di `src/features/auth/actions.ts`), serta session helper server-only (`src/lib/auth/session.ts`).
- Penegakan Golden Rule #3: pendaftaran akun publik secara server-side selalu menghasilkan role `peserta`.
- Matriks izin RBAC granular (`src/lib/auth/permissions.ts`) dan helper `hasPermission()`, `can()`, `requireRole()`, `requirePermission()`.
- Lapisan Database Repository (`src/lib/repositories/`): abstraksi antarmuka `ICompetitionRepository`, `IRegistrationRepository`, `ISubmissionRepository`, `IScoreRepository`, `IUserRepository`.
- Implementasi ganda repository: `MockRepository` (dev/offline) dan `SupabaseRepository` (live Postgres query via client SSR & Admin Service Role).
- Next.js Proxy Middleware (`src/proxy.ts`): penyegaran cookie sesi Supabase dan route guard redirection otomatis untuk `/dashboard/*` serta rute auth publik.
- Arsitektur Supabase Storage lengkap untuk 4 bucket (`payment-proofs`, `submissions`, `identity-docs`, `public-assets`) dengan batasan ukuran berkas dan MIME whitelist.
- RLS Policies granular pada `storage.objects` dengan helper Postgres `is_staff()` dan `is_assigned_judge_for_submission()`.
- Validasi Zod skema berkas (`SignedUploadUrlSchema`, `SignedDownloadUrlSchema`, `ConfirmUploadSchema`) dengan verifikasi ukuran, anti path-traversal nama berkas (`sanitizeFilename`), dan kesesuaian ekstensi-MIME.
- Server Actions (`getSignedUploadUrlAction`, `getSignedDownloadUrlAction`, `verifyAndConfirmUploadAction`) dengan arsitektur server-only via `createAdminClient()`.
- Client helper `uploadFileDirectly` (browser -> direct PUT signed URL) dan `getFileDownloadUrl` (signed download URL privat berumur pendek).
- Integrasi direct upload dan indikator progress pada form upload bukti pembayaran (`/dashboard/peserta/pembayaran`) dan form pengumpulan karya (`/dashboard/peserta/submission`).
- Integrasi signed download viewer pada panel pratinjau submission admin (`/dashboard/admin/submission`).
- Integrasi signed download URL & dukungan dokumen PDF pada panel review bukti transfer admin (`/dashboard/admin/pembayaran`).
- Integrasi signed download URL pada lembar penugasan juri (`/dashboard/juri/penugasan`) untuk unduh proposal/karya terproteksi.
- Script `"typecheck": "tsc --noEmit"` pada `package.json`.
- Standardisasi CRUD lewat `Drawer` di seluruh panel admin (Cabang Lomba, Rubrik, Pengguna, Hasil E-Sport, Pengumuman).
- Drawer khusus manajemen Rubrik Penilaian per-lomba dengan validasi total bobot 100% langsung di daftar kompetisi.
- Drawer pratinjau submission karya (`SubmissionPreviewDrawer`) dengan dukungan viewer dokumen PDF dan kartu launcher Figma.
- Analitik dan grafik visual di Admin Overview (tren registrasi 7 hari, komposisi akademik vs non-akademik, dan status pembayaran).
- Format turnamen dan podium visual untuk hasil cabang E-Sport (PES & Mobile Legends).
- Matriks evaluasi rubrik interaktif pada penilaian karya dengan kalkulasi skor terbobot otomatis.
- Kartu ATM rekening bank dan barcode QRIS live preview di halaman Pengaturan Sistem.

### Changed
- Perbaikan token semantic pada komponen `Alert` dan callout status agar kompatibel penuh dengan Light dan Dark mode.
- Tabel `DataTable` diperbarui menjadi mode compact dengan padding sel yang rapat (`compact: true`) dan ekspor CSV yang selaras.
- Eliminasi karakter ASCII mentah (`&rarr;`, `&larr;`) dan redundansi tombol di seluruh halaman dashboard.
- Standardisasi dropdown filter select pada seluruh tabel di dashboard.

### Security
- Daftar temuan audit awal dicatat di `DECISIONS.md` B.2 (RBAC server/RLS, role-switcher, upload, 2FA).

## [0.1.0] - pra-rilis, baseline (dari laporan progres)

### Added
- Landing page publik (Hero, OrganizerStrip, Competitions, Timeline, LeaderboardTeaser, HowToRegister, FAQ, CTA, StickyBottomBar).
- Halaman publik: `/kompetisi`, `/kompetisi/[slug]`, `/leaderboard`, `/pengumuman`, `/informasi`.
- Halaman auth (frontend): `/login`, `/register`, `/forgot-password`.
- Dashboard peserta, juri, admin (UI + store mock), role-switcher demo.
- Draf `schema.sql` 22 tabel.

### Known issues
- Belum ada koneksi Supabase live, RLS, atau Storage; otorisasi baru di UI. Lihat `DECISIONS.md` B.2.
