'use client';

import React, { useState } from 'react';
import { SakugaButton } from '@/components/ui/sakuga-button';
import { formatCurrency } from '@/lib/utils';
import { Competition, Guidebook } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { MOCK_GUIDEBOOKS } from '@/lib/mock-data';
import { PdfViewerModal } from '@/components/guidebook/PdfViewerModal';
import { X, CheckCircle, BookOpen } from '@phosphor-icons/react';

interface CompetitionDisplayItem {
  id: string;
  slug: string;
  name: string;
  type: 'academic' | 'non_academic';
  categoryType: 'gold' | 'sky';
  categoryLabel: 'Akademik' | 'Non-akademik';
  iconBg: string;
  desc: string;
  formatText: string;
  feeText: string;
  registrationFee: number;
  participationType: string;
  allowedFormat: string;
}

const DEFAULT_COMPETITIONS: CompetitionDisplayItem[] = [
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    slug: 'uiux',
    name: 'UI/UX Design',
    type: 'academic',
    categoryType: 'gold',
    categoryLabel: 'Akademik',
    iconBg: '#6CC4FF',
    desc: 'Rancang pengalaman yang enak dipakai, dari riset sampai prototipe interaktif.',
    formatText: 'Individu · Desain Figma',
    feeText: 'Rp 75.000',
    registrationFee: 75000,
    participationType: 'Individu (1 orang)',
    allowedFormat: 'Figma Prototype URL & Case Study PDF',
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    slug: 'it_system_arch',
    name: 'IT System Architecture',
    type: 'academic',
    categoryType: 'gold',
    categoryLabel: 'Akademik',
    iconBg: '#E6C978',
    desc: 'Susun arsitektur sistem yang kuat, rapi, terukur, dan siap tumbuh.',
    formatText: 'Tim (1–3 orang) · Proposal PDF',
    feeText: 'Rp 100.000',
    registrationFee: 100000,
    participationType: 'Tim (1–3 orang)',
    allowedFormat: 'Blueprint Dokumen & Diagram Arsitektur (.pdf)',
  },
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    slug: 'esai',
    name: 'Esai Cyber Security',
    type: 'academic',
    categoryType: 'gold',
    categoryLabel: 'Akademik',
    iconBg: '#C4F15A',
    desc: 'Tulis gagasanmu soal keamanan siber dan ketahanan digital secara tajam dan solutif.',
    formatText: 'Individu · Naskah PDF',
    feeText: 'Rp 50.000',
    registrationFee: 50000,
    participationType: 'Individu (1 orang)',
    allowedFormat: 'Naskah Esai Ilmiah (.pdf, maks 15MB)',
  },
];

interface CompetitionsSectionProps {
  id?: string;
  initialCompetitions?: Competition[];
}

export function CompetitionsSection({
  id = 'lomba',
  initialCompetitions,
}: CompetitionsSectionProps) {
  const store = useAppStore();
  const rawGuidebooks = store?.guidebooks;
  const guidebooks = Array.isArray(rawGuidebooks) && rawGuidebooks.length > 0 ? rawGuidebooks : MOCK_GUIDEBOOKS;
  const [selectedComp, setSelectedComp] = useState<CompetitionDisplayItem | null>(null);
  const [readingGuidebook, setReadingGuidebook] = useState<Guidebook | null>(null);

  // Ambil rulebook spesifik untuk cabang yang sedang dibuka di modal
  const currentBranchGuidebook = React.useMemo(() => {
    if (!selectedComp) return null;
    return (
      guidebooks.find(
        (g) =>
          g.is_published &&
          (g.category === selectedComp.slug ||
            g.competition_id === selectedComp.id ||
            g.title.toLowerCase().includes(selectedComp.name.toLowerCase()))
      ) ||
      guidebooks.find((g) => g.category === 'general' && g.is_published) ||
      guidebooks[0]
    );
  }, [selectedComp, guidebooks]);

  // Petakan data dari Backend/Database Supabase bila tersedia
  const displayItems: CompetitionDisplayItem[] = React.useMemo(() => {
    if (!initialCompetitions || initialCompetitions.length === 0) {
      return DEFAULT_COMPETITIONS;
    }

    const bgPalettes = ['#6CC4FF', '#E6C978', '#C4F15A', '#F0A6F2', '#9B6BF2'];

    return initialCompetitions.map((comp, idx) => {
      const isAcademic = comp.type === 'academic';
      const partTypeLabel =
        comp.participation_type === 'individual'
          ? 'Individu (1 orang)'
          : `Tim (${comp.min_team_size || 1}–${comp.max_team_size || 3} orang)`;

      const allowedFormatStr =
        comp.submission_config?.allowedTypes?.length
          ? comp.submission_config.allowedTypes.join(', ')
          : isAcademic
            ? 'Dokumen Proposal / Naskah PDF'
            : 'Turnamen Bracket Match';

      return {
        id: comp.id,
        slug: comp.slug,
        name: comp.name,
        type: comp.type,
        categoryType: isAcademic ? 'gold' : 'sky',
        categoryLabel: isAcademic ? 'Akademik' : 'Non-akademik',
        iconBg: bgPalettes[idx % bgPalettes.length],
        desc: comp.description || 'Kompetisi resmi mahasiswa Permifest x Deforkafest 2026.',
        formatText: `${comp.participation_type === 'individual' ? 'Individu' : 'Tim'} · ${isAcademic ? 'Karya Ilmiah/Desain' : 'E-Sport Arena'
          }`,
        feeText: formatCurrency(comp.registration_fee),
        registrationFee: comp.registration_fee,
        participationType: partTypeLabel,
        allowedFormat: allowedFormatStr,
      };
    });
  }, [initialCompetitions]);

  return (
    <section
      id={id}
      aria-labelledby="competitions-heading"
      className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-2xl mb-10 text-left">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#140D33] text-[#6CC4FF] border border-[#2E2266] mb-3 select-none">
          Cabang Perlombaan Resmi
        </span>
        <h2
          id="competitions-heading"
          className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-bricolage)] text-foreground tracking-tight"
        >
          Pilih arena{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #9B6BF2, #D56BD9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            kamu
          </span>
        </h2>
        <p className="mt-3 text-[#A99FD1] text-base leading-relaxed">
          Seluruh cabang resmi terintegrasi dengan database backend. Pilih cabang yang sesuai minatmu untuk melihat ketentuan dan mendaftar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayItems.map((comp) => (
          <article
            key={comp.id}
            className="group relative flex flex-col justify-between rounded-3xl border-2 border-[#2E2266] bg-[#140D33] p-6 comic-card-hover overflow-hidden"
          >
            <div>
              {/* Category Pill Tag */}
              <div className="flex items-center justify-between mb-4 select-none">
                <span
                  className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${comp.categoryType === 'gold'
                    ? 'bg-[#2a2108] text-[#E6C978] border border-[#524112]/50'
                    : 'bg-[#082436] text-[#6CC4FF] border border-[#144766]/50'
                    }`}
                >
                  {comp.categoryLabel}
                </span>

                <span className="text-xs font-bold font-mono text-[#A99FD1]">
                  {comp.feeText}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-bricolage)] text-[#F5F2FF] mb-2 group-hover:text-[#F0A6F2] transition-colors leading-snug">
                {comp.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#A99FD1] leading-relaxed mb-5">
                {comp.desc}
              </p>

              <div className="pt-3 border-t border-[#2E2266]/70 text-xs text-[#A99FD1]/90 font-medium">
                Format: <strong className="text-[#F5F2FF]">{comp.formatText}</strong>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6 pt-4 border-t border-[#2E2266]/70">
              <button
                type="button"
                onClick={() => setSelectedComp(comp)}
                className="w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 font-bold text-xs sm:text-sm text-[#F5F2FF] bg-[#1d1347] border border-[#2E2266] hover:bg-[#25195c] hover:border-[#9B6BF2] transition-colors min-h-[44px] cursor-pointer"
              >
                Lihat Panduan & Syarat
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* ── Dialog Detail Lomba Modal ── */}
      {selectedComp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setSelectedComp(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-[#140D33] border-2 border-[#9B6BF2] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider select-none ${selectedComp.categoryType === 'gold'
                  ? 'bg-[#2a2108] text-[#E6C978]'
                  : 'bg-[#082436] text-[#6CC4FF]'
                  }`}
              >
                {selectedComp.categoryLabel}
              </span>

              <button
                type="button"
                onClick={() => setSelectedComp(null)}
                className="p-2 rounded-xl text-[#A99FD1] hover:text-[#F5F2FF] hover:bg-[#1d1347] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Tutup"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <h3
              id="modal-title"
              className="text-2xl font-black font-[family-name:var(--font-bricolage)] text-[#F5F2FF] pr-6"
            >
              {selectedComp.name}
            </h3>

            <p className="mt-3 text-sm text-[#A99FD1] leading-relaxed">
              {selectedComp.desc}
            </p>

            <div className="mt-5 space-y-3 pt-4 border-t border-[#2E2266] text-xs sm:text-sm text-[#A99FD1]">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-[#C4F15A] shrink-0" weight="fill" />
                <span>
                  Format Peserta: <strong className="text-[#F5F2FF]">{selectedComp.participationType}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-[#C4F15A] shrink-0" weight="fill" />
                <span>
                  Biaya Pendaftaran:{' '}
                  <strong className="text-[#F5F2FF] tabular-nums">
                    {formatCurrency(selectedComp.registrationFee)}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-[#C4F15A] shrink-0" weight="fill" />
                <span>
                  Ketentuan Berkas: <strong className="text-[#F5F2FF]">{selectedComp.allowedFormat}</strong>
                </span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#2E2266] flex flex-wrap items-center justify-between gap-3">
              {currentBranchGuidebook ? (
                <button
                  type="button"
                  onClick={() => setReadingGuidebook(currentBranchGuidebook)}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#6CC4FF] bg-[#082436] border border-[#144766] hover:border-[#6CC4FF] hover:bg-[#0c334d] transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
                  title="Baca Rulebook & Panduan Teknis Cabang Ini"
                >
                  <BookOpen size={16} weight="bold" />
                  <span>Baca Rulebook PDF ({currentBranchGuidebook.version})</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedComp(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#A99FD1] hover:text-[#F5F2FF] hover:bg-[#1d1347] min-h-[44px] cursor-pointer"
                >
                  Tutup
                </button>
                <SakugaButton
                  href="/register"
                  variant="brand"
                  size="md"
                  sfxText="DAFTAR!!"
                >
                  Daftar Cabang Ini
                </SakugaButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF Viewer Online */}
      <PdfViewerModal
        guidebook={readingGuidebook}
        isOpen={Boolean(readingGuidebook)}
        onClose={() => setReadingGuidebook(null)}
      />
    </section>
  );
}
