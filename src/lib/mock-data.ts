import {
  User,
  Registration,
  Submission,
  RubricCriteria,
  JudgeAssignment,
  Announcement,
  AuditLog,
  MatchResult,
  LeaderboardEntry,
  Guidebook,
  EventItem,
  DynamicFaqItem
} from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'usr-juri',
    email: 'juri.cyber@permifest.id',
    full_name: 'Dr. Hendra Gunawan (Juri Cyber)',
    role: 'juri',
    email_verified: true,
  },
  {
    id: 'usr-peserta-1',
    email: 'budi@uni.ac.id',
    full_name: 'Budi Prasetyo',
    role: 'peserta',
    email_verified: true,
  },
  {
    id: 'usr-peserta-2',
    email: 'demo@gmail.com',
    full_name: 'Siti Aminah',
    role: 'peserta',
    email_verified: true,
  },
  {
    id: 'usr-peserta-3',
    email: 'suti@permifest.id',
    full_name: 'Susanti Dewi',
    role: 'peserta',
    email_verified: true,
  },
];

export const MOCK_REGISTRATIONS: Registration[] = [
  {
    id: 'reg-1',
    user_id: 'usr-peserta-1',
    competition_id: 'comp-1',
    status: 'verified',
    registered_at: '2026-11-25T10:00:00Z',
    form_data: { asal_sekolah: 'UST Yogyakarta', nim_nisn: '20230101', subtema: 'Perlindungan Data Pribadi' },
  },
  {
    id: 'reg-2',
    user_id: 'usr-peserta-2',
    competition_id: 'comp-2',
    status: 'verified',
    registered_at: '2026-11-25T11:00:00Z',
    form_data: { asal_sekolah: 'UGM', nim_nisn: '20230202', subtema: 'Sistem Prediksi Kelulusan', figma_account: 'siti@figma.com' },
  },
  {
    id: 'reg-3',
    user_id: 'usr-peserta-3',
    competition_id: 'comp-3',
    status: 'verified',
    registered_at: '2026-11-25T12:00:00Z',
    form_data: { team_name: 'CyberVanguard', perguruan_tinggi: 'UST', subtema: 'Cloud Security Architecture' },
  },
];

export const MOCK_RUBRIC_CRITERIA: RubricCriteria[] = [
  // Esai Criteria
  { id: 'rubric-1', competition_id: 'comp-1', name: 'Orisinalitas & Kesesuaian Tema', description: 'Keaslian gagasan dan keterkaitan kuat dengan cybersecurity', max_score: 100, weight: 0.25, sort_order: 1 },
  { id: 'rubric-2', competition_id: 'comp-1', name: 'Ketajaman Analisis & Argumen', description: 'Logika berpikir, kedalaman pembahasan teknis/kebijakan', max_score: 100, weight: 0.35, sort_order: 2 },
  { id: 'rubric-3', competition_id: 'comp-1', name: 'Solusi & Kelayakan Implementasi', description: 'Solusi yang ditawarkan realistis dan berdampak', max_score: 100, weight: 0.25, sort_order: 3 },
  { id: 'rubric-4', competition_id: 'comp-1', name: 'Format & Tata Bahasa', description: 'Struktur esai, sitasi akademik, dan kebakuan PUEBI', max_score: 100, weight: 0.15, sort_order: 4 },

  // UI/UX Criteria
  { id: 'rubric-5', competition_id: 'comp-2', name: 'User Research & Problem Definition', description: 'Kejelasan persona dan problem statement keamanan siber', max_score: 100, weight: 0.25, sort_order: 1 },
  { id: 'rubric-6', competition_id: 'comp-2', name: 'Visual Design & Accessibility', description: 'Estetika, tipografi, kontras warna, WCAG compliance', max_score: 100, weight: 0.35, sort_order: 2 },
  { id: 'rubric-7', competition_id: 'comp-2', name: 'Interaktivitas & Prototype Flow', description: 'Prototipe fungsional dengan alur interaksi pengguna yang mulus dan intuitif', max_score: 100, weight: 0.25, sort_order: 3 },
  { id: 'rubric-8', competition_id: 'comp-2', name: 'Security Design Awareness', description: 'Fitur keamanan yang ramah pengguna (2FA, alert, dll)', max_score: 100, weight: 0.15, sort_order: 4 },
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    registration_id: 'reg-1',
    stage_id: 'stage-1-1',
    file_name: 'NSEC2026_Ketahanan_Siber_AI.pdf',
    file_url: '/submissions/esai-karya-01.pdf',
    submitted_at: '2026-11-25T14:30:00Z',
    version: 1,
    is_latest: true,
  },
  {
    id: 'sub-2',
    registration_id: 'reg-2',
    stage_id: 'stage-2-1',
    link_url: 'https://www.figma.com/design/demo-smart-campus-permifest',
    submitted_at: '2026-11-25T15:00:00Z',
    version: 1,
    is_latest: true,
  },
  {
    id: 'sub-3',
    registration_id: 'reg-3',
    stage_id: 'stage-3-1',
    file_name: 'ITSA_Cloud_Hybrid_Resilience.pdf',
    file_url: '/submissions/itsa-arsitektur-enterprise.pdf',
    submitted_at: '2026-11-25T16:00:00Z',
    version: 1,
    is_latest: true,
  },
];

export const MOCK_JUDGE_ASSIGNMENTS: JudgeAssignment[] = [
  {
    id: 'assign-1',
    judge_id: 'usr-juri',
    submission_id: 'sub-1',
    status: 'assigned',
    assigned_at: '2026-11-25T14:35:00Z',
  },
  {
    id: 'assign-2',
    judge_id: 'usr-juri',
    submission_id: 'sub-2',
    status: 'in_progress',
    assigned_at: '2026-11-25T15:05:00Z',
  },
  {
    id: 'assign-3',
    judge_id: 'usr-juri',
    submission_id: 'sub-3',
    status: 'completed',
    assigned_at: '2026-11-25T16:05:00Z',
  },
];

export const MOCK_MATCH_RESULTS: MatchResult[] = [];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    competition_id: null,
    title: 'Pendaftaran Permifest x Deforkafest 2026 Resmi Dibuka!',
    excerpt: 'Pendaftaran untuk 3 cabang perlombaan akademik telah resmi dibuka mulai 24 November 2026.',
    content: `Selamat datang para talenta masa depan!

Panitia Permifest x Deforkafest 2026 mengumumkan bahwa pendaftaran cabang kompetisi akademik telah dibuka:
1. Esai Ilmiah Cybersecurity
2. UI/UX Design Challenge
3. IT System Architecture

Silakan pilih lomba yang sesuai dengan minat dan kemampuan Anda, selesaikan pembayaran dan verifikasi, serta persiapkan karya terbaik Anda.

Salam Cyber,
Panitia Pelaksana Permifest x Deforkafest`,
    is_published: true,
    published_at: '2026-11-01T08:00:00Z',
    author_name: 'Panitia Pusat',
  },
  {
    id: 'ann-2',
    competition_id: 'comp-1',
    competition_name: 'Esai Ilmiah Cybersecurity',
    title: 'Panduan Template Penulisan Esai Babak Penyisihan',
    excerpt: 'Pastikan file esai Anda berformat DOCX atau PDF dengan format sitasi APA/IEEE.',
    content: `Halo peserta Esai Ilmiah!

Mengingatkan kembali format penyerahan karya:
- Format file: DOCX atau PDF
- Ukuran maksimal: 15 MB
- Font: Times New Roman 12pt / Arial 11pt, spasi 1.5
- Wajib menyertakan abstrak dan daftar pustaka terverifikasi

Deadline babak penyisihan: 15 Desember 2026 pukul 23:59 WIB.`,
    is_published: true,
    published_at: '2026-11-08T10:00:00Z',
    author_name: 'Divisi Acara Esai',
  },
  {
    id: 'ann-3',
    competition_id: 'comp-2',
    competition_name: 'UI/UX Design Challenge',
    title: 'Aturan Akses File Figma untuk Juri',
    excerpt: 'Pastikan link Figma Anda disetel ke "Anyone with the link can view".',
    content: `Peserta UI/UX Design Challenge diwajibkan memastikan tautan Figma yang dikumpulkan memiliki izin akses "Can View" publik, agar juri dapat membuka dan melakukan penilaian dengan lancar.`,
    is_published: true,
    published_at: '2026-11-10T11:00:00Z',
    author_name: 'Divisi Juri UI/UX',
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [];

export const MOCK_LEADERBOARDS: LeaderboardEntry[] = [];

export const MOCK_PARTNERS: import('./types').Partner[] = [
  {
    id: 'partner-1',
    name: 'Permikomnas Wilayah VII Yogyakarta',
    category: 'organizer',
    logo_url: '/brand/permikomnas.png',
    website_url: 'https://www.instagram.com/permikomnas_yogyakarta/',
    description: 'Perhimpunan Mahasiswa Informatika dan Komputer Nasional Wilayah VII Daerah Istimewa Yogyakarta.',
    tier: 'utama',
    order_index: 1,
    is_active: true,
  },
  {
    id: 'partner-2',
    name: 'Kabinet Nawasena',
    category: 'kabinet',
    logo_url: '/brand/logo kabinet.jpeg',
    website_url: 'https://www.instagram.com/permikomnas_yogyakarta/',
    description: 'Kabinet kepengurusan resmi Permikomnas Wilayah VII DIY periode berjalan yang mengusung sinergi dan inovasi.',
    tier: 'utama',
    order_index: 2,
    is_active: true,
  },
  {
    id: 'partner-3',
    name: 'Deforkafest 2026',
    category: 'co_host',
    logo_url: '/brand/deforkafest.jpg',
    website_url: 'https://www.instagram.com/deforkafest/',
    description: 'Pekan festival IT dan kompetisi sains teknologi tahunan kolaborasi akbar mahasiswa Yogyakarta.',
    tier: 'utama',
    order_index: 3,
    is_active: true,
  },
  {
    id: 'partner-4',
    name: 'IMPSI UST Yogyakarta',
    category: 'organizer',
    logo_url: '/brand/impsi-ust.png',
    website_url: 'https://instagram.com/impsi_ust',
    description: 'Himpunan Mahasiswa Program Studi Informatika Universitas Sarjanawiyata Tamansiswa Yogyakarta.',
    tier: 'utama',
    order_index: 4,
    is_active: true,
  },
];

export const MOCK_GUIDEBOOKS: Guidebook[] = [
  {
    id: 'guidebook-general',
    title: 'Buku Panduan Teknis Umum Permifest x Deforkafest 2026',
    category: 'general',
    file_url: '/docs/guidebook-permifest-2026.pdf',
    file_name: 'Guidebook_Umum_Permifest_Deforkafest_2026.pdf',
    file_size_bytes: 3450000,
    version: 'v2.1',
    description: 'Panduan induk perlombaan memuat regulasi umum, tata tertib, jadwal timeline lengkap, alur verifikasi berkas, dan ketentuan hak cipta.',
    release_notes: 'Pembaruan jadwal penutupan gelombang 1 dan rincian alur invite code tim.',
    is_published: true,
    created_at: '2026-11-01T08:00:00Z',
    updated_at: '2026-11-20T10:00:00Z',
  },
  {
    id: 'guidebook-esai',
    title: 'Guide Book National Student Essay Competition (NSEC) 2026',
    category: 'esai',
    competition_id: 'c1111111-1111-1111-1111-111111111111',
    file_url: '/docs/guidebooks/essai.pdf',
    file_name: 'essai.pdf',
    file_size_bytes: 1109029,
    version: 'v2026.2',
    description: 'Panduan lengkap National Student Essay Competition (NSEC) 2026 bertema Penguatan Ketahanan dan Keamanan Siber. Ketentuan format artikel populer (800-1500 kata), 6 subtema resmi, dan alur seleksi.',
    release_notes: 'Pembaruan resmi Guide Book National Student Essay Competition (NSEC) 2026.',
    is_published: true,
    created_at: '2026-11-05T08:00:00Z',
    updated_at: '2026-11-28T11:00:00Z',
  },
  {
    id: 'guidebook-uiux',
    title: 'Rulebook & Spesifikasi Desain UI/UX Competition',
    category: 'uiux',
    competition_id: 'c2222222-2222-2222-2222-222222222222',
    file_url: '/docs/guidebooks/ui_ux.pdf',
    file_name: 'ui_ux.pdf',
    file_size_bytes: 1087227,
    version: 'v2026.1',
    description: 'Ketentuan proposal studi kasus Smart Campus, tautan prototipe Figma interaktif, kriteria usability, dan panduan presentasi final.',
    release_notes: 'Pembaruan HTM Rp25.000, batas pengumpulan 3 Desember 2026, dan 3 subtema kampus cerdas.',
    is_published: true,
    created_at: '2026-11-05T08:00:00Z',
    updated_at: '2026-11-23T10:00:00Z',
  },
  {
    id: 'guidebook-itsa',
    title: 'Rulebook & Standar IT System Architecture',
    category: 'it_system_arch',
    competition_id: 'c3333333-3333-3333-3333-333333333333',
    file_url: '/docs/guidebooks/it_system_architecture.pdf',
    file_name: 'it_system_architecture.pdf',
    file_size_bytes: 379655,
    version: 'v2026.1',
    description: 'Panduan penyusunan diagram arsitektur C4/UML/Network, threat modeling, implementasi Zero Trust & cloud security, dan presentasi daring.',
    release_notes: 'Pembaruan HTM Rp50.000 per tim, pendaftaran 24 Nov - 4 Des 2026, dan 6 subtema resmi.',
    is_published: true,
    created_at: '2026-11-08T08:00:00Z',
    updated_at: '2026-11-23T10:00:00Z',
  },
];

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'event-1',
    title: 'Seminar Nasional: Generative AI & Keamanan Siber Menuju Indonesia Emas 2045',
    slug: 'seminar-nasional-ai-cyber-security',
    type: 'seminar',
    format: 'hybrid',
    start_time: '2026-12-14T08:30:00+07:00',
    end_time: '2026-12-14T12:30:00+07:00',
    location_name: 'Auditorium Ki Hadjar Dewantara, Kampus 1 UST Yogyakarta',
    location_url: 'https://maps.google.com/?q=UST+Yogyakarta',
    description: 'Seminar akbar menghadirkan pakar industri dan akademisi nasional untuk membedah strategi mitigasi serangan siber berbasis AI dan peluang karir di era transformasi digital.',
    speakers: [
      {
        name: 'Dr. Pratama Persadha',
        role_title: 'Chairman CISSReC & Pakar Keamanan Siber Nasional',
        organization: 'CISSReC',
      },
      {
        name: 'Rian Kurniawan, M.Kom',
        role_title: 'AI Solution Architect',
        organization: 'Google Cloud Partner Indonesia',
      },
    ],
    price: 35000,
    quota: 250,
    registered_count: 184,
    registration_url: 'https://bit.ly/Semnas-Permifest-2026',
    banner_url: '/brand/event-seminar.jpg',
    is_published: true,
    certificate_provided: true,
    order_index: 1,
  },
  {
    id: 'event-2',
    title: 'Webinar UI/UX: Crafting High-Impact Digital Product Experience',
    slug: 'webinar-uiux-product-design',
    type: 'webinar',
    format: 'online',
    start_time: '2026-12-05T13:30:00+07:00',
    end_time: '2026-12-05T16:00:00+07:00',
    location_name: 'Live Zoom Meeting & YouTube Streaming',
    location_url: 'https://zoom.us/j/permifest-webinar-uiux',
    description: 'Kupas tuntas metodologi Design Thinking, design system enterprise, dan teknik menyusun portofolio studi kasus yang memikat rekruter internasional.',
    speakers: [
      {
        name: 'Annisa Fitriani',
        role_title: 'Lead Product Designer',
        organization: 'Tokopedia / GoTo Financial',
      },
    ],
    price: 0,
    quota: 500,
    registered_count: 342,
    registration_url: 'https://bit.ly/Webinar-UIUX-Permifest',
    banner_url: '',
    is_published: true,
    certificate_provided: true,
    order_index: 2,
  },
  {
    id: 'event-3',
    title: 'Hands-on Tech Workshop: Scalable Microservices with Docker & Kubernetes',
    slug: 'workshop-microservices-kubernetes',
    type: 'workshop',
    format: 'offline',
    start_time: '2026-12-15T09:00:00+07:00',
    end_time: '2026-12-15T15:30:00+07:00',
    location_name: 'Laboratorium Rekayasa Perangkat Lunak, FTI UST Yogyakarta',
    location_url: 'https://maps.google.com/?q=UST+Yogyakarta',
    description: 'Sesi praktik intensif membangun, mendistribusikan, dan melakukan load-balancing kluster microservices modern dari nol hingga production deployment.',
    speakers: [
      {
        name: 'Bagus Wicaksono',
        role_title: 'Principal DevOps & SRE Engineer',
        organization: 'Komunitas DevOps Indonesia',
      },
    ],
    price: 75000,
    quota: 40,
    registered_count: 36,
    registration_url: 'https://bit.ly/Workshop-K8s-Permifest',
    banner_url: '',
    is_published: true,
    certificate_provided: true,
    order_index: 3,
  },
  {
    id: 'event-4',
    title: 'Awarding Night & Pesta Penutupan Permifest x Deforkafest 2026',
    slug: 'awarding-night-penutupan',
    type: 'ceremony',
    format: 'offline',
    start_time: '2026-12-16T18:30:00+07:00',
    end_time: '2026-12-16T22:00:00+07:00',
    location_name: 'Hall Gedung Pusat Kebudayaan UST Yogyakarta',
    location_url: 'https://maps.google.com/?q=UST+Yogyakarta',
    description: 'Malam penganugerahan trofi juara, pameran karya inovasi teknologi mahasiswa, dan penampilan panggung seni budaya.',
    speakers: [],
    price: 0,
    quota: 400,
    registered_count: 280,
    registration_url: '',
    banner_url: '',
    is_published: true,
    certificate_provided: false,
    order_index: 4,
  },
];

export const MOCK_FAQS: DynamicFaqItem[] = [
  {
    id: 'faq-1',
    question: 'Boleh mendaftar sendiri atau harus berkelompok?',
    answer: 'Tergantung cabangnya. Cabang Esai Ilmiah dapat diikuti individu atau tim (maksimal 2 orang), UI/UX bertanding individu (1 orang), dan IT System Architecture bertim 2-3 orang.',
    category: 'lomba',
    order_index: 1,
    is_published: true,
  },
  {
    id: 'faq-2',
    question: 'Bagaimana mekanisme pembayarannya?',
    answer: 'Pembayaran dilakukan praktis menggunakan QRIS Nasional resmi panitia atau transfer bank. Setelah mendaftarkan tim, kamu cukup mengunggah bukti transfer digital di dashboard, dan tim verifikasi panitia akan mengonfirmasi status pembayaran dalam waktu maksimal 24 jam.',
    category: 'pembayaran',
    order_index: 2,
    is_published: true,
  },
  {
    id: 'faq-3',
    question: 'Berkas apa saja yang wajib disiapkan?',
    answer: 'Secara umum: Kartu Tanda Mahasiswa (KTM) aktif atau surat keterangan aktif kuliah, pas foto formal, dan bukti pembayaran pendaftaran. Rincian berkas proposal/karya muncul saat kamu memilih cabang lomba di dashboard.',
    category: 'pendaftaran',
    order_index: 3,
    is_published: true,
  },
  {
    id: 'faq-4',
    question: 'Apakah mahasiswa dari luar D.I. Yogyakarta boleh mendaftar?',
    answer: 'Sangat boleh! Seluruh cabang kompetisi dan seminar terbuka untuk seluruh mahasiswa aktif jenjang D3/D4/S1 dari perguruan tinggi negeri maupun swasta di seluruh wilayah Indonesia.',
    category: 'umum',
    order_index: 4,
    is_published: true,
  },
  {
    id: 'faq-5',
    question: 'Di mana babak final diselenggarakan?',
    answer: 'Babak final dan penganugerahan juara akan diselenggarakan secara luring (offline) di kampus Universitas Sarjanawiyata Tamansiswa (UST) Yogyakarta, lengkap dengan sesi pameran karya dan awarding ceremony.',
    category: 'lomba',
    order_index: 5,
    is_published: true,
  },
  {
    id: 'faq-6',
    question: 'Bagaimana bila berkas karya saya salah unggah?',
    answer: 'Selama periode pengumpulan karya sebelum batas waktu penutupan berakhir, kamu bebas memperbarui atau mengunggah ulang berkas revisi karya langsung dari menu Pengumpulan Karya di dashboard peserta.',
    category: 'teknis',
    order_index: 6,
    is_published: true,
  },
  {
    id: 'faq-7',
    question: 'Apakah semua peserta akan mendapatkan sertifikat?',
    answer: 'Ya! Seluruh peserta yang menyelesaikan berkas karya pada cabang lomba akan mendapatkan e-sertifikat nasional berpredikat resmi dari Permikomnas dan UST Yogyakarta.',
    category: 'umum',
    order_index: 7,
    is_published: true,
  },
];


