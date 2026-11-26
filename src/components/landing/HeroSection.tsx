'use client';

import React from 'react';
import Image from 'next/image';
import { GameController, Trophy, MapPin } from '@phosphor-icons/react';
import { SakugaButton } from '@/components/ui/sakuga-button';
import { SakugaHeroBackground } from './SakugaHeroBackground';
import { useAppStore } from '@/lib/store';

export function HeroSection() {
  const { competitions, systemSettings } = useAppStore();
  const compCount = competitions.length || 5;
  const isRegOpen = systemSettings ? systemSettings.registration_open : true;
  const venueShort = systemSettings?.venue_name ? 'UST Yogyakarta' : 'UST Yogyakarta';
  return (
    <section
      id="beranda"
      className="relative overflow-hidden pt-0 pb-12 md:pt-24 lg:pt-28 lg:pb-20"
      aria-labelledby="hero-heading"
    >
      {/* ── Ambient Background Canvas CSS ── */}
      <SakugaHeroBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-14">
          {/* ── Kolom Kiri: Teks & Aksi ── */}
          <div className="flex-1 max-w-2xl text-left">
            {/* Washi-Tape Status Pill (Playful Manga Style) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#140D33] text-[#FFE359] border-2 border-[#524112] shadow-[3px_3px_0px_#0B0720] mb-5 -rotate-1 hover:rotate-0 transition-transform cursor-default select-none">
              <span>{isRegOpen ? 'Pendaftaran Gelombang 1 Dibuka' : 'Pendaftaran Ditutup Sementara'}</span>
            </div>

            <h1
              id="hero-heading"
              className="font-[family-name:var(--font-bricolage)] font-extrabold text-foreground tracking-tight leading-[1.04]"
              style={{ fontSize: 'clamp(42px, 7.5vw, 82px)' }}
            >
              Permifest{' '}
              <span
                className="inline-block relative select-none"
                style={{
                  background: 'linear-gradient(135deg, #9B6BF2 0%, #D56BD9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                x
              </span>{' '}
              Deforkafest
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#A99FD1] leading-relaxed max-w-xl">
              Dua komunitas, satu arena pertarungan teknologi &amp; e-sport mahasiswa. Pilih cabangmu, ajak tim andalanmu, lalu kibarkan karyamu di panggung tertinggi.
            </p>

            {/* CTA Buttons: Pop-Art CSS Murni */}
            <div className="mt-8 flex flex-wrap items-center gap-4 select-none">
              <SakugaButton
                href="/register"
                variant="brand"
                size="lg"
              >
                Daftar sekarang
              </SakugaButton>

              <SakugaButton
                href="#panduan"
                variant="secondary"
                size="lg"
              >
                Panduan pendaftaran
              </SakugaButton>
            </div>
          </div>

          {/* ── Kolom Kanan: Ilustrasi Maskot dengan Floating Badge Ber-Ikon ── */}
          <div className="flex-1 w-full max-w-[560px] lg:max-w-[620px] flex justify-center items-center relative group">
            {/* Ambient Radial Atmosphere */}
            <div
              className="absolute w-[440px] h-[440px] rounded-full pointer-events-none opacity-40 select-none"
              style={{
                background: 'radial-gradient(circle, rgba(155, 107, 242, 0.45) 0%, rgba(213, 107, 217, 0.2) 50%, transparent 70%)',
              }}
            />

            {/* ── Floating Badge 1: 5 Cabang Lomba (Kiri Atas) ── */}
            <div className="absolute top-0 -left-2 sm:-left-6 z-20 px-3.5 py-2 rounded-2xl bg-[#140D33]/95 border-2 border-[#2E2266] shadow-[4px_4px_0px_#0B0720] flex items-center gap-3 transition-transform duration-200 hover:scale-105 select-none cursor-default">
              <div className="w-8 h-8 rounded-xl bg-[#9B6BF2]/20 border border-[#9B6BF2]/40 flex items-center justify-center text-[#9B6BF2] shrink-0">
                <GameController size={20} weight="duotone" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-[#F5F2FF] uppercase tracking-wide leading-none">
                  {compCount} Cabang Lomba
                </span>
                <span className="block text-[10px] text-[#6CC4FF] font-semibold mt-1">
                  Akademik &amp; E-Sport
                </span>
              </div>
            </div>

            {/* ── Floating Badge 2: Total Hadiah (Kanan Bawah) ── */}
            <div className="absolute -bottom-3 -right-2 sm:-right-4 z-20 px-3.5 py-2 rounded-2xl bg-[#140D33]/95 border-2 border-[#2E2266] shadow-[4px_4px_0px_#0B0720] flex items-center gap-3 transition-transform duration-200 hover:scale-105 select-none cursor-default">
              <div className="w-8 h-8 rounded-xl bg-[#FFE359]/20 border border-[#FFE359]/40 flex items-center justify-center text-[#FFE359] shrink-0">
                <Trophy size={20} weight="duotone" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-[#F5F2FF] uppercase tracking-wide leading-none">
                  Hadiah Puluhan Juta
                </span>
                <span className="block text-[10px] text-[#FFE359] font-semibold mt-1">
                  + Sertifikat Resmi
                </span>
              </div>
            </div>

            {/* ── Floating Badge 3: Venue UST (Kanan Tengah) ── */}
            <div className="hidden sm:flex absolute top-1/2 -right-4 sm:-right-8 -translate-y-1/2 z-20 px-3 py-2 rounded-2xl bg-[#140D33]/95 border-2 border-[#2E2266] shadow-[4px_4px_0px_#0B0720] items-center gap-2.5 transition-transform duration-200 hover:scale-105 select-none cursor-default">
              <div className="w-7 h-7 rounded-lg bg-[#6CC4FF]/20 border border-[#6CC4FF]/40 flex items-center justify-center text-[#6CC4FF] shrink-0">
                <MapPin size={17} weight="bold" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#F5F2FF] leading-none">
                  {venueShort}
                </span>
                <span className="block text-[10px] text-[#A99FD1] mt-0.5">
                  Arena Grand Final
                </span>
              </div>
            </div>

            {/* Ilustrasi Maskot Utama (Megah & Halus Hover 3D) */}
            <div className="w-full relative z-10 flex justify-center items-center">
              <Image
                src="/ilustrasi.png"
                alt="Ilustrasi Resmi Permifest x Deforkafest 2026"
                width={640}
                height={640}
                loading="lazy"
                
                className="w-full h-auto max-h-[520px] lg:max-h-[580px] object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.6)] select-none pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
