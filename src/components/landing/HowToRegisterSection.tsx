'use client';

import React from 'react';
import { SakugaButton } from '@/components/ui/sakuga-button';
import { useAppStore } from '@/lib/store';

interface StepItem {
  num: string;
  title: string;
  desc: string;
  highlight: string;
}

interface HowToRegisterSectionProps {
  id?: string;
}

export function HowToRegisterSection({ id = 'panduan' }: HowToRegisterSectionProps) {
  const { competitions } = useAppStore();
  const totalCompetitions = competitions.length || 3;

  const STEPS: StepItem[] = [
    {
      num: '01',
      title: 'Buat Akun Peserta',
      desc: 'Daftarkan dirimu dengan email aktif dan data perguruan tinggi. Prosesnya cepat dan akun langsung siap digunakan.',
      highlight: 'Gratis & Langsung Aktif',
    },
    {
      num: '02',
      title: 'Pilih Cabang Lomba',
      desc: 'Pilih cabang lomba akademik (Esai Ilmiah, UI/UX Design, atau IT System Architecture) sesuai minat dan timmu.',
      highlight: `${totalCompetitions} Pilihan Cabang`,
    },
    {
      num: '03',
      title: 'Isi Tim & Berkas Syarat',
      desc: 'Untuk lomba beregu, ketua tim akan mendapatkan Kode Undangan Tim untuk dibagikan ke anggota. Unggah KTM aktif.',
      highlight: 'Sistem Kode Undangan',
    },
    {
      num: '04',
      title: 'Pembayaran QRIS & Verifikasi',
      desc: 'Selesaikan biaya pendaftaran via QRIS resmi panitia. Unggah bukti transfer di dashboard, verifikasi maks 1x24 jam.',
      highlight: 'QRIS Satu Pintu',
    },
  ];
  return (
    <section
      id={id}
      aria-labelledby="how-to-register-heading"
      className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* ── Section Header (Bersih Tanpa Ikon) ── */}
      <div className="max-w-3xl mb-12 text-left">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#140D33] text-[#FFE359] border border-[#524112] mb-3 select-none -rotate-1">
          Panduan Resmi Pendaftaran
        </span>
        <h2
          id="how-to-register-heading"
          className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-bricolage)] text-foreground tracking-tight leading-tight"
        >
          Mekanisme alur pendaftaran,{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #9B6BF2, #D56BD9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            empat langkah mudah
          </span>
        </h2>
        <p className="mt-3 text-[#A99FD1] text-base leading-relaxed">
          Simak alur satu pintu mulai dari pembuatan akun hingga verifikasi panitia. Seluruh proses dilakukan secara transparan di dashboard peserta.
        </p>
      </div>

      {/* ── 4 Langkah Terstruktur (Manga Pop Art Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((st, i) => (
          <div
            key={st.num}
            className={`group relative flex flex-col justify-between rounded-3xl border border-[#2E2266] bg-[#140D33] p-6 sm:p-7 ${
              i % 2 === 0 ? 'comic-card-hover' : 'comic-card-hover-alt'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4 select-none">
                <span className="font-[family-name:var(--font-jetbrains)] font-black text-3xl sm:text-4xl leading-none text-[#FFE359]">
                  {st.num}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B0720] text-[#6CC4FF] border border-[#2E2266]">
                  {st.highlight}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold font-[family-name:var(--font-bricolage)] text-[#F5F2FF] mb-2.5 group-hover:text-[#F0A6F2] transition-colors leading-snug">
                {st.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#A99FD1] leading-relaxed">
                {st.desc}
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#2E2266]/60 text-[11px] font-mono text-[#A99FD1]/70 select-none">
              Langkah {i + 1} dari 4
            </div>
          </div>
        ))}
      </div>

      {/* ── Callout Box Panduan Teknis & Mekanisme Tim ── */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Box 1: Ketentuan Tim Beregu */}
        <div className="rounded-2xl bg-[#0B0720] border border-[#2E2266] p-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C4F15A] block mb-1 select-none">
            Ketentuan Tim Beregu
          </span>
          <h4 className="text-base font-bold text-[#F5F2FF] mb-2 font-[family-name:var(--font-bricolage)]">
            Cara Bergabung dengan Tim yang Sudah Ada
          </h4>
          <p className="text-xs text-[#A99FD1] leading-relaxed">
            Ketua tim mendaftar terlebih dahulu dan akan menerima <strong>Kode Undangan Tim</strong> unik di dashboard. Anggota tim cukup membuat akun, memilih cabang yang sama, dan memasukkan kode tersebut tanpa perlu membayar ulang.
          </p>
        </div>

        {/* Box 2: Dokumen Persyaratan & Rulebook */}
        <div className="rounded-2xl bg-[#0B0720] border border-[#2E2266] p-6 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6CC4FF] block mb-1 select-none">
              Dokumen Persyaratan
            </span>
            <h4 className="text-base font-bold text-[#F5F2FF] mb-2 font-[family-name:var(--font-bricolage)]">
              Berkas yang Wajib Disiapkan
            </h4>
            <p className="text-xs text-[#A99FD1] leading-relaxed">
              Siapkan Kartu Tanda Mahasiswa (KTM) aktif atau surat keterangan aktif kuliah, pas foto 3x4, dan berkas karya sesuai ketentuan cabang lomba (proposal PDF atau tautan prototipe Figma).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2E2266]/70 flex flex-wrap items-center justify-between gap-2">
            <a
              href="#lomba"
              className="text-xs font-bold text-[#FFE359] hover:underline inline-flex items-center gap-1"
            >
              Lihat Rincian Syarat Lomba &rarr;
            </a>
            <a
              href="/guidebook"
              className="text-xs font-bold text-[#6CC4FF] hover:underline inline-flex items-center gap-1"
            >
              Buka Buku Panduan (Guidebook) &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* ── Action CTA ── */}
      <div className="mt-12 text-center">
        <SakugaButton
          href="/register"
          variant="brand"
          size="lg"
          className="px-8 py-3.5"
        >
          Mulai Pendaftaran Sekarang
        </SakugaButton>
      </div>
    </section>
  );
}
