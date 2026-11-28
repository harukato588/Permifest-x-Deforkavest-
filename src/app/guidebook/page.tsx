'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { PdfViewerModal } from '@/components/guidebook/PdfViewerModal';
import { useAppStore } from '@/lib/store';
import { Guidebook, GuidebookCategory } from '@/lib/types';
import { MOCK_GUIDEBOOKS } from '@/lib/mock-data';
import {
  BookOpen,
  DownloadSimple,
  Eye,
  ShieldCheck,
} from '@phosphor-icons/react';

const CATEGORY_MAP: Record<GuidebookCategory, { label: string; badgeBg: string; textColor: string }> = {
  general: { label: 'Panduan Umum', badgeBg: 'bg-[#9B6BF2]/20 border-[#9B6BF2]/40', textColor: 'text-[#9B6BF2]' },
  esai: { label: 'Esai Cyber Security', badgeBg: 'bg-[#FFE359]/20 border-[#FFE359]/40', textColor: 'text-[#FFE359]' },
  uiux: { label: 'UI/UX Design', badgeBg: 'bg-[#F0A6F2]/20 border-[#F0A6F2]/40', textColor: 'text-[#F0A6F2]' },
  it_system_arch: { label: 'IT System Architecture', badgeBg: 'bg-[#6CC4FF]/20 border-[#6CC4FF]/40', textColor: 'text-[#6CC4FF]' },
  pes: { label: 'PES 2026 e-Football', badgeBg: 'bg-[#C4F15A]/20 border-[#C4F15A]/40', textColor: 'text-[#C4F15A]' },
  ml: { label: 'Mobile Legends: Bang Bang', badgeBg: 'bg-[#FF9B70]/20 border-[#FF9B70]/40', textColor: 'text-[#FF9B70]' },
};

export default function PublicGuidebookPage() {
  const store = useAppStore();
  const rawGuidebooks = store?.guidebooks;
  const guidebooksList = Array.isArray(rawGuidebooks) && rawGuidebooks.length > 0 ? rawGuidebooks : MOCK_GUIDEBOOKS;

  const [activeCategory, setActiveCategory] = useState<'all' | GuidebookCategory>('all');
  const [readingGuidebook, setReadingGuidebook] = useState<Guidebook | null>(null);

  // Ambil hanya guidebook yang dipublikasikan
  const publishedGuidebooks = useMemo(() => {
    return (guidebooksList || []).filter((g) => g && g.is_published);
  }, [guidebooksList]);

  // Filter berdasarkan kategori yang dipilih
  const displayGuidebooks = useMemo(() => {
    if (activeCategory === 'all') return publishedGuidebooks;
    return publishedGuidebooks.filter((g) => g.category === activeCategory);
  }, [publishedGuidebooks, activeCategory]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0720] text-[#F5F2FF] relative overflow-hidden">
      {/* ── Background Layer 1: Subtle CSS Diagonal Grid Pattern ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none opacity-[0.045]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #9B6BF2 0,
            #9B6BF2 1px,
            transparent 1px,
            transparent 28px
          )`,
        }}
      />

      {/* ── Background Layer 2: Ambient Atmosphere Gradients ── */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-[540px] h-[540px] rounded-full pointer-events-none opacity-30 select-none"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(155, 107, 242, 0.35) 0%, rgba(124, 77, 219, 0.1) 50%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 -right-28 w-[500px] h-[500px] rounded-full pointer-events-none opacity-25 select-none"
        style={{
          background: 'radial-gradient(circle at 60% 60%, rgba(213, 107, 217, 0.3) 0%, rgba(108, 196, 255, 0.1) 50%, transparent 70%)',
        }}
      />

      <Navbar activePage="guidebook" />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:pt-28 relative z-10 w-full">
        {/* ── Page Header ── */}
        <div className="max-w-3xl mb-10 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#140D33] text-[#FFE359] border-2 border-[#524112] shadow-[3px_3px_0px_#0B0720] mb-4 select-none -rotate-1">
            <BookOpen size={16} weight="bold" />
            <span>Pusat Regulasi &amp; Buku Panduan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-[family-name:var(--font-bricolage)] text-[#F5F2FF] tracking-tight leading-[1.08]">
            Buku Panduan{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #9B6BF2, #D56BD9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Teknis &amp; Rulebook
            </span>
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-[#A99FD1] leading-relaxed max-w-2xl">
            Pelajari tata tertib perlombaan, format penulisan berkas, kriteria penilaian dewan juri, serta sistem turnamen e-sport. Dokumen dapat dibaca langsung online atau diunduh ke perangkatmu.
          </p>
        </div>

        {/* ── Filter Kategori Tabs (Hanya Cabang Akademik & Umum) ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none select-none">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 min-h-[40px] border ${activeCategory === 'all'
                ? 'bg-[#9B6BF2] text-[#0B0720] border-[#9B6BF2] shadow-[3px_3px_0px_#0B0720]'
                : 'bg-[#140D33] text-[#A99FD1] border-[#2E2266] hover:text-[#F5F2FF] hover:border-[#9B6BF2]'
              }`}
          >
            Semua Dokumen ({publishedGuidebooks.filter((g) => g.category !== 'pes' && g.category !== 'ml').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('general')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 min-h-[40px] border ${activeCategory === 'general'
                ? 'bg-[#9B6BF2] text-[#0B0720] border-[#9B6BF2] shadow-[3px_3px_0px_#0B0720]'
                : 'bg-[#140D33] text-[#A99FD1] border-[#2E2266] hover:text-[#F5F2FF] hover:border-[#9B6BF2]'
              }`}
          >
            Panduan Umum
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('esai')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 min-h-[40px] border ${activeCategory === 'esai'
                ? 'bg-[#FFE359] text-[#0B0720] border-[#FFE359] shadow-[3px_3px_0px_#0B0720]'
                : 'bg-[#140D33] text-[#A99FD1] border-[#2E2266] hover:text-[#F5F2FF] hover:border-[#FFE359]'
              }`}
          >
            Esai Cyber Security
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('uiux')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 min-h-[40px] border ${activeCategory === 'uiux'
                ? 'bg-[#F0A6F2] text-[#0B0720] border-[#F0A6F2] shadow-[3px_3px_0px_#0B0720]'
                : 'bg-[#140D33] text-[#A99FD1] border-[#2E2266] hover:text-[#F5F2FF] hover:border-[#F0A6F2]'
              }`}
          >
            UI/UX Design
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('it_system_arch')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 min-h-[40px] border ${activeCategory === 'it_system_arch'
                ? 'bg-[#6CC4FF] text-[#0B0720] border-[#6CC4FF] shadow-[3px_3px_0px_#0B0720]'
                : 'bg-[#140D33] text-[#A99FD1] border-[#2E2266] hover:text-[#F5F2FF] hover:border-[#6CC4FF]'
              }`}
          >
            IT System Architecture
          </button>
        </div>

        {/* ── Grid Kartu Guidebook ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayGuidebooks.map((item) => {
            const meta = CATEGORY_MAP[item.category] || CATEGORY_MAP.general;
            return (
              <article
                key={item.id}
                className="group relative flex flex-col justify-between rounded-3xl border-2 border-[#2E2266] bg-[#140D33] p-6 shadow-[5px_5px_0px_#0B0720] hover:shadow-[7px_7px_0px_#0B0720,10px_10px_0px_#9B6BF2] hover:-translate-y-1 transition-all duration-200"
              >
                <div>
                  {/* Top Bar: Kategori & Versi */}
                  <div className="flex items-center justify-between gap-2 mb-4 select-none">
                    <span
                      className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${meta.badgeBg} ${meta.textColor}`}
                    >
                      {meta.label}
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-[#FFE359] text-[#0B0720] shadow-sm -rotate-2">
                      {item.version}
                    </span>
                  </div>

                  <h2 className="font-[family-name:var(--font-bricolage)] font-extrabold text-lg sm:text-xl text-[#F5F2FF] group-hover:text-[#F0A6F2] transition-colors leading-snug">
                    {item.title}
                  </h2>

                  <p className="mt-2.5 text-xs sm:text-sm text-[#A99FD1] leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  {item.release_notes && (
                    <div className="mt-4 p-3 rounded-2xl bg-[#0B0720] border border-[#2E2266] text-xs text-[#A99FD1] leading-relaxed">
                      <strong className="text-[#FFE359]">Catatan Pembaruan:</strong> {item.release_notes}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Action Buttons & File Meta */}
                <div className="mt-6 pt-4 border-t border-[#2E2266] flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#A99FD1]">
                    <span>{formatFileSize(item.file_size_bytes)}</span>
                    <span className="truncate max-w-[160px]" title={item.file_name}>{item.file_name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Tombol Baca Online */}
                    <button
                      type="button"
                      onClick={() => setReadingGuidebook(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold text-[#6CC4FF] bg-[#082436] border border-[#144766] hover:border-[#6CC4FF] hover:bg-[#0c334d] transition-all min-h-[42px] cursor-pointer"
                    >
                      <Eye size={16} weight="bold" />
                      <span>Baca Online</span>
                    </button>

                    {/* Tombol Unduh PDF */}
                    <a
                      href={item.file_url}
                      download={item.file_name}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black text-[#0B0720] bg-gradient-to-r from-[#9B6BF2] via-[#D56BD9] to-[#FFE359] shadow-[2px_2px_0px_#0B0720] hover:brightness-110 active:translate-y-0.5 transition-all min-h-[42px] cursor-pointer"
                    >
                      <DownloadSimple size={16} weight="bold" />
                      <span>Unduh PDF</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── Bantuan & FAQ Callout ── */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-[#140D33] border-2 border-[#2E2266] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C4F15A]/15 border border-[#C4F15A]/40 flex items-center justify-center text-[#C4F15A] shrink-0">
              <ShieldCheck size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-[family-name:var(--font-bricolage)] text-[#F5F2FF]">
                Butuh Klarifikasi Regulasi atau Aturan Lomba?
              </h3>
              <p className="text-xs sm:text-sm text-[#A99FD1] mt-0.5">
                Hubungi panitia via WhatsApp helpdesk resmi atau ajukan pertanyaan saat sesi Technical Meeting.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/#panduan"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-[#F5F2FF] bg-[#1E134D] border border-[#2E2266] hover:border-[#9B6BF2] text-center min-h-[42px] flex items-center justify-center"
            >
              Alur Pendaftaran
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-[#0B0720] bg-[#C4F15A] shadow-[3px_3px_0px_#0B0720] hover:brightness-110 text-center min-h-[42px] flex items-center justify-center"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>

        {/* ── Modal PDF Viewer Online ── */}
        <PdfViewerModal
          guidebook={readingGuidebook}
          isOpen={Boolean(readingGuidebook)}
          onClose={() => setReadingGuidebook(null)}
        />
      </main>

      <Footer />
    </div>
  );
}
