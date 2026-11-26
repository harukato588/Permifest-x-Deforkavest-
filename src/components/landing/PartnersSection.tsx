'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';
import { Partner } from '@/lib/types';

export function PartnersSection() {
  const { partners } = useAppStore();

  // Filter mitra yang berstatus aktif dan urutkan
  const activePartners = useMemo(() => {
    return partners
      .filter((p: Partner) => p.is_active)
      .sort((a: Partner, b: Partner) => a.order_index - b.order_index);
  }, [partners]);

  // Kelompokkan: Penyelenggara & Kabinet vs Sponsor & Media Partner
  const organizers = useMemo(() => {
    return activePartners.filter(
      (p) => p.category === 'organizer' || p.category === 'kabinet' || p.category === 'co_host'
    );
  }, [activePartners]);

  return (
    <section
      id="mitra"
      aria-labelledby="partners-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-[#2E2266]"
    >
      {/* ── Heading Terstruktur & Bersih (Antislop Design) ── */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#140D33] text-[#FFE359] border border-[#524112] mb-3 select-none">
          Penyelenggara &amp; Kolaborator
        </div>
        <h2
          id="partners-heading"
          className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-bricolage)] text-[#F5F2FF] tracking-tight"
        >
          Kolaborasi Akbar &amp; Mitra Resmi
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#A99FD1] leading-relaxed">
          Sinergi antar komunitas mahasiswa teknologi Daerah Istimewa Yogyakarta bersama mitra industri untuk memajukan talenta digital nasional.
        </p>
      </div>

      {/* ── 1. Penyelenggara Inti (Permikomnas DIY, Kabinet Nawasena, Deforkafest, IMPSI UST) ── */}
      <div className="mb-10">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#6CC4FF] mb-5">
          Entitas Penyelenggara
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {organizers.map((org) => {
            const isClickable = !!org.website_url && org.website_url !== '#beranda';
            const Wrapper = isClickable ? 'a' : 'div';
            const wrapperProps = isClickable
              ? { href: org.website_url, target: '_blank', rel: 'noopener noreferrer' }
              : {};

            return (
              <Wrapper
                key={org.id}
                {...wrapperProps}
                className="group relative flex flex-col items-center justify-between p-6 rounded-2xl border border-[#2E2266] bg-[#140D33]/90 hover:bg-[#140D33] hover:border-[#9B6BF2] transition-all text-center"
              >
                {/* Logo Box: Bersih tanpa badge tumpuk */}
                <div className="w-full h-16 flex items-center justify-center px-2 py-1">
                  {org.logo_url ? (
                    <Image
                      src={org.logo_url}
                      alt={org.name}
                      width={160}
                      height={48}
                      loading="lazy"
                      unoptimized
                      style={{ width: 'auto', height: 'auto' }}
                      className="max-h-12 max-w-[160px] object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-sm font-black text-[#F5F2FF] tracking-wide">
                      {org.name}
                    </div>
                  )}
                </div>

                <div className="mt-3 w-full">
                  <span className="text-xs font-bold text-[#F5F2FF] group-hover:text-[#6CC4FF] transition-colors line-clamp-1 block">
                    {org.name}
                  </span>

                  {org.description ? (
                    <p className="mt-1 text-[11px] text-[#A99FD1] line-clamp-2 leading-relaxed">
                      {org.description}
                    </p>
                  ) : (
                    <span className="mt-1 text-[10px] text-[#A99FD1]/70 block">
                      {org.category === 'kabinet'
                        ? 'Kabinet Wilayah'
                        : org.category === 'co_host'
                        ? 'Event Co-Host'
                        : 'Penyelenggara'}
                    </span>
                  )}
                </div>

                {isClickable && (
                  <span className="mt-3 text-[10px] text-[#6CC4FF] font-semibold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Kunjungi tautan &rarr;
                  </span>
                )}
              </Wrapper>
            );
          })}
        </div>
      </div>


      {/* ── Callout Sponsoring & Media Partnership ── */}
      <div className="mt-10 p-5 rounded-2xl bg-[#0B0720] border border-[#2E2266] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <span className="text-xs font-bold text-[#F5F2FF] block">
            Ingin Berkolaborasi atau Menjadi Sponsor Permifest x Deforkafest 2026?
          </span>
          <span className="text-[11px] text-[#A99FD1] block mt-0.5">
            Dapatkan eksposur luas ke ribuan mahasiswa dan pegiat teknologi di D.I. Yogyakarta dan nasional.
          </span>
        </div>

        <a
          href="mailto:partnership@permifest.id?subject=Kerjasama%20Sponsorship%20Permifest%20x%20Deforkafest%202026"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-[#0B0720] bg-[#FFE359] hover:bg-[#ffd83d] transition-colors shrink-0 shadow-[2px_2px_0px_#0B0720]"
        >
          Hubungi Divisi Partnership
        </a>
      </div>
    </section>
  );
}
