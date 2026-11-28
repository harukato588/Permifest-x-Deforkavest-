'use client';

import React from 'react';

export function LeaderboardTeaser() {
  return (
    <section
      id="peringkat"
      aria-labelledby="benefits-heading"
      className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mb-12 text-left">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#140D33] text-[#FFE359] border border-[#524112]/50 mb-3 select-none">
          Apresiasi Kompetisi
        </span>
        <h2
          id="benefits-heading"
          className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-bricolage)] text-foreground tracking-tight leading-tight"
        >
          Apresiasi nyata, untuk yang{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #9B6BF2, #D56BD9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            berani unjuk gigi
          </span>
        </h2>
        <p className="mt-3 text-[#A99FD1] text-base leading-relaxed">
          Bukan cuma adu kemampuan teknis, karyamu diapresiasi dengan panggung nyata dan sertifikat berbobot nasional.
        </p>
      </div>

      {/* Benefit Highlight Cards (Arkavidia Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
        {/* Card 1: Sertifikat Resmi & Pengakuan */}
        <div className="comic-card-hover rounded-3xl border-2 border-[#9B6BF2] bg-[#140D33] p-7 flex flex-col justify-between shadow-[0_12px_36px_rgba(155,107,242,0.2)]">
          <div>
            <div className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#33113a] text-[#F0A6F2] border border-[#5c2466]/50 mb-4 select-none">
              Rekam Jejak
            </div>
            <h3 className="text-3xl sm:text-4xl font-black font-[family-name:var(--font-bricolage)] text-[#F5F2FF] leading-none mb-3">
              Sertifikat Resmi
            </h3>
            <p className="text-sm text-[#A99FD1] leading-relaxed">
              Seluruh peserta dan finalis mendapatkan sertifikat resmi ber-SK penyelenggara yang sah untuk portofolio kampus dan beasiswa.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#2E2266]/70 text-xs font-bold text-[#F0A6F2] select-none">
            Diterbitkan Panitia Bersama
          </div>
        </div>

        {/* Card 3: Panggung & Relasi Komunitas */}
        <div className="comic-card-hover-alt rounded-3xl border border-[#2E2266] bg-[#140D33] p-7 flex flex-col justify-between">
          <div>
            <div className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-[#082436] text-[#6CC4FF] border border-[#144766]/50 mb-4">
              Networking
            </div>
            <h3 className="text-3xl sm:text-4xl font-black font-[family-name:var(--font-bricolage)] text-[#F5F2FF] leading-none mb-3">
              Panggung Final
            </h3>
            <p className="text-sm text-[#A99FD1] leading-relaxed">
              Kesempatan pitching langsung di hadapan dewan juri ahli dan terhubung dengan talenta mahasiswa teknologi se-Yogyakarta.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#2E2266]/70 text-xs font-bold text-[#6CC4FF]">
            Arena UST Yogyakarta
          </div>
        </div>
      </div>
    </section>
  );
}
