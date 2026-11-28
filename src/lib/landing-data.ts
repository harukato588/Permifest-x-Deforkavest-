/**
 * Data helper untuk Landing Page Permifest x Deforkafest
 *
 * Semua data dinamis disiapkan di sini sebagai placeholder realistis
 * sehingga nanti sangat mudah dialihkan ke query Supabase langsung.
 * Ditandai jelas dengan [PLACEHOLDER] untuk hal-hal yang butuh data asli.
 */

import { INITIAL_COMPETITIONS } from './constants';
import type { Competition, CompetitionType } from './types';

export type CompetitionStatus = 'buka' | 'hampir_penuh' | 'penuh' | 'segera';

export interface LandingCompetition extends Competition {
  status: CompetitionStatus;
  fillPercent: number;
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

export interface FaqItem {
  id: string;
  pertanyaan: string;
  jawaban: string;
  kategori: 'pendaftaran' | 'kompetisi' | 'pembayaran' | 'teknis';
}

export interface LeaderboardEntry {
  rank: number;
  nama: string;
  instansi: string;
  skor: number;
  cabang_id: string;
  cabang_nama: string;
}

export interface OrganizerInfo {
  name: string;
  role: string;
  isPlaceholder: boolean;
  logoUrl?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function computeStatus(comp: Competition): CompetitionStatus {
  const quota = comp.quota ?? 0;
  const registered = comp.registered_count ?? 0;
  if (quota === 0) return 'segera';
  if (registered >= quota) return 'penuh';
  if (registered / quota > 0.8) return 'hampir_penuh';
  return 'buka';
}

function computeFillPercent(comp: Competition): number {
  if (!comp.quota || comp.quota === 0) return 0;
  return Math.min(100, Math.round((comp.registered_count / comp.quota) * 100));
}

export function formatDateId(isoString: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

// ─── Competitions ──────────────────────────────────────────────────────────

/**
 * [PLACEHOLDER] Data kompetisi contoh
 * Meliputi kategori akademik (Esai, UI/UX, IT Arch) dan non-akademik (PES, Mobile Legends / Machine Learning)
 */
export function getLandingCompetitions(): LandingCompetition[] {
  return INITIAL_COMPETITIONS.filter((c) => c.is_published).map((c) => ({
    ...c,
    status: computeStatus(c),
    fillPercent: computeFillPercent(c),
  }));
}

export function filterCompetitions(
  competitions: LandingCompetition[],
  filter: 'semua' | CompetitionType
): LandingCompetition[] {
  if (filter === 'semua') return competitions;
  return competitions.filter((c) => c.type === filter);
}

// ─── Deadlines & Countdown ─────────────────────────────────────────────────

export interface NearestDeadline {
  id: string;
  label: string;
  date: string;
  dateFormatted: string;
  isDeadline: boolean;
}

export function getNextDeadline(referenceIso = '2026-11-01T00:00:00Z'): NearestDeadline | null {
  const comps = getLandingCompetitions();
  const deadlines: NearestDeadline[] = [];

  for (const c of comps) {
    if (c.registration_close_at && c.registration_close_at > referenceIso) {
      deadlines.push({
        id: `${c.id}-close`,
        label: `Deadline pendaftaran ${c.name}`,
        date: c.registration_close_at,
        dateFormatted: formatDateId(c.registration_close_at),
        isDeadline: true,
      });
    }
  }

  deadlines.sort((a, b) => (a.date > b.date ? 1 : -1));
  return deadlines[0] ?? null;
}

export function getNearestRegistrationClose(): NearestDeadline | null {
  return getNextDeadline();
}

// ─── Timeline Events (Playful Calendar & List) ─────────────────────────────

/**
 * [PLACEHOLDER] Agenda timeline realistis untuk event
 * Dinamis dan terstruktur, mencakup tahap pendaftaran, TM, penyisihan, dan final
 */
export function getTimelineEvents(): TimelineEvent[] {
  return [
    // ── Lomba IT Arsitektur ───────────────────────────────────────────────
    {
      id: 'tl-itsa-1',
      judul: 'Registrasi Awal IT Arsitektur',
      deskripsi: 'Pendaftaran awal peserta Lomba IT System Architecture (24 November - 4 Desember 2026).',
      tanggal_mulai: '2026-11-24',
      tanggal_selesai: '2026-12-04',
      jam: '00:00 WIB',
      jenis: 'daftar',
      cabang_id: 'comp-3',
      cabang_nama: 'IT Arsitektur',
      lokasi: 'Online Platform',
    },
    {
      id: 'tl-itsa-2',
      judul: 'Registrasi Ulang IT Arsitektur',
      deskripsi: 'Batas akhir registrasi ulang peserta Lomba IT System Architecture.',
      tanggal_mulai: '2026-12-04',
      jam: '23:59 WIB',
      jenis: 'daftar',
      cabang_id: 'comp-3',
      cabang_nama: 'IT Arsitektur',
      lokasi: 'Online Platform',
      is_deadline: true,
    },
    {
      id: 'tl-itsa-3',
      judul: 'Pengumuman Finalis IT Arsitektur',
      deskripsi: 'Pengumuman peserta yang lolos ke babak Final Presentation IT System Architecture.',
      tanggal_mulai: '2026-12-05',
      jam: '15:00 WIB',
      jenis: 'pengumuman',
      cabang_id: 'comp-3',
      cabang_nama: 'IT Arsitektur',
      lokasi: 'Leaderboard & Pengumuman',
    },
    {
      id: 'tl-itsa-4',
      judul: 'Final Presentation IT Arsitektur',
      deskripsi: 'Babak presentasi finalis Lomba IT System Architecture di hadapan dewan juri.',
      tanggal_mulai: '2026-12-07',
      jam: '09:00 WIB',
      jenis: 'final',
      cabang_id: 'comp-3',
      cabang_nama: 'IT Arsitektur',
      lokasi: 'Platform / Ruang Final',
    },

    // ── Lomba Esai ────────────────────────────────────────────────────────
    {
      id: 'tl-esai-1',
      judul: 'Pendaftaran & Pengumpulan Dibuka (Esai)',
      deskripsi: 'Pembukaan pendaftaran sekaligus unggah karya Lomba Esai.',
      tanggal_mulai: '2026-11-24',
      jam: '00:00 WIB',
      jenis: 'daftar',
      cabang_id: 'comp-1',
      cabang_nama: 'Lomba Esai',
      lokasi: 'Online Platform',
    },
    {
      id: 'tl-esai-2',
      judul: 'Penutupan & Batas Akhir Pengumpulan (Esai)',
      deskripsi: 'Penutupan pendaftaran dan batas akhir pengumpulan naskah Lomba Esai.',
      tanggal_mulai: '2026-12-03',
      jam: '23:59 WIB',
      jenis: 'penyisihan',
      cabang_id: 'comp-1',
      cabang_nama: 'Lomba Esai',
      lokasi: 'Online Dashboard',
      is_deadline: true,
    },
    {
      id: 'tl-esai-3',
      judul: 'Pengumuman Juara (Esai)',
      deskripsi: 'Pengumuman resmi pemenang Lomba Esai.',
      tanggal_mulai: '2026-12-06',
      jam: '15:00 WIB',
      jenis: 'pengumuman',
      cabang_id: 'comp-1',
      cabang_nama: 'Lomba Esai',
      lokasi: 'Leaderboard & Pengumuman',
    },

    // ── Lomba UI/UX ───────────────────────────────────────────────────────
    {
      id: 'tl-uiux-1',
      judul: 'Pendaftaran & Pengumpulan (UI/UX)',
      deskripsi: 'Periode pendaftaran dan pengumpulan karya Lomba UI/UX (24 November - 3 Desember 2026).',
      tanggal_mulai: '2026-11-24',
      tanggal_selesai: '2026-12-03',
      jam: '00:00 WIB',
      jenis: 'daftar',
      cabang_id: 'comp-2',
      cabang_nama: 'Lomba UI/UX',
      lokasi: 'Online Platform',
    },
    {
      id: 'tl-uiux-2',
      judul: 'Pengumuman TOP 3 Finalis (UI/UX)',
      deskripsi: 'Pengumuman TOP 3 finalis terbaik Lomba UI/UX.',
      tanggal_mulai: '2026-12-05',
      jam: '15:00 WIB',
      jenis: 'pengumuman',
      cabang_id: 'comp-2',
      cabang_nama: 'Lomba UI/UX',
      lokasi: 'Leaderboard & Pengumuman',
    },
    {
      id: 'tl-uiux-3',
      judul: 'Presentasi Finalis & Pengumuman Juara (UI/UX)',
      deskripsi: 'Sesi presentasi finalis TOP 3 sekaligus pengumuman juara Lomba UI/UX.',
      tanggal_mulai: '2026-12-06',
      jam: '09:00 WIB',
      jenis: 'final',
      cabang_id: 'comp-2',
      cabang_nama: 'Lomba UI/UX',
      lokasi: 'Platform / Ruang Final',
    },
  ];
}

// ─── Leaderboard Teaser Data ───────────────────────────────────────────────

/**
 * [PLACEHOLDER] Cuplikan peringkat top 3 per cabang
 */
export function getLeaderboardTeaser(): LeaderboardEntry[] {
  return [];
}

// ─── FAQ Items ─────────────────────────────────────────────────────────────

/**
 * [PLACEHOLDER] FAQ spesifik untuk Permifest x Deforkafest
 * Tidak menggunakan pertanyaan generik SaaS, langsung relevan untuk mahasiswa & peserta
 */
export function getFaqItems(): FaqItem[] {
  return [
    {
      id: 'faq-1',
      pertanyaan: 'Apakah mahasiswa dari luar D.I. Yogyakarta boleh mendaftar?',
      jawaban:
        'Boleh banget! Seluruh cabang kompetisi terbuka untuk mahasiswa aktif D3/D4/S1 dari seluruh perguruan tinggi di Indonesia. Babak penyisihan berlangsung secara online.',
      kategori: 'pendaftaran',
    },
    {
      id: 'faq-2',
      pertanyaan: 'Bagaimana cara konfirmasi pembayaran pendaftaran?',
      jawaban:
        'Setelah kamu transfer melalui QRIS di platform, unggah bukti transfer ke formulir pendaftaran. Panitia akan memverifikasi dalam waktu maksimal 1x24 jam dan status akunmu otomatis berubah menjadi Terverifikasi.',
      kategori: 'pembayaran',
    },
    {
      id: 'faq-3',
      pertanyaan: 'Bolehkah mendaftar lebih dari satu cabang lomba?',
      jawaban:
        'Boleh, asalkan jadwal tahapan final tidak bentrok dan kamu mendaftarkan tiap cabang dengan formulir terpisah di akunmu.',
      kategori: 'kompetisi',
    },
    {
      id: 'faq-4',
      pertanyaan: 'Apakah anggota tim harus berasal dari kampus yang sama?',
      jawaban:
        'Untuk cabang lomba beregu (IT System Architecture dan Mobile Legends), anggota tim diperbolehkan berasal dari jurusan yang berbeda namun tetap dalam satu institusi/kampus yang sama.',
      kategori: 'kompetisi',
    },
    {
      id: 'faq-5',
      pertanyaan: 'Di mana babak final diselenggarakan?',
      jawaban:
        'Babak final dan penyerahan penghargaan direncanakan berlangsung di kampus Universitas Sarjanawiyata Tamansiswa (UST) Yogyakarta. Finalis yang lolos akan mendapat panduan akomodasi dari panitia.',
      kategori: 'teknis',
    },
    {
      id: 'faq-6',
      pertanyaan: 'Bagaimana bila berkas karya saya salah unggah?',
      jawaban:
        'Selama periode pengumpulan karya (sebelum deadline berakhir), kamu masih bisa mengubah tautan atau mengunggah ulang berkas revisi langsung dari dashboard peserta.',
      kategori: 'teknis',
    },
    {
      id: 'faq-7',
      pertanyaan: 'Apakah setiap peserta akan mendapatkan sertifikat?',
      jawaban:
        'Ya, seluruh peserta yang mengumpulkan karya lengkap atau hadir bertanding akan mendapatkan e-sertifikat nasional ber-SK resmi dari Permikomnas DIY & IMPSI UST.',
      kategori: 'pendaftaran',
    },
  ];
}

// ─── Organizers ────────────────────────────────────────────────────────────

/**
 * Info penyelenggara resmi
 * Ditandai bahwa file logo fisik belum tersedia di public/brand/,
 * sehingga komponen menggunakan visual placeholder tipografi yang rapi.
 */
export function getOrganizers(): OrganizerInfo[] {
  return [
    {
      name: 'Permikomnas Wilayah VIII DIY',
      role: 'Penyelenggara Bersama',
      isPlaceholder: true,
    },
    {
      name: 'IMPSI UST Yogyakarta',
      role: 'Himpunan Mahasiswa Sistem Informasi UST',
      isPlaceholder: true,
    },
  ];
}
