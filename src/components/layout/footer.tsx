'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import {
  InstagramLogo,
  WhatsappLogo,
  MapPin,
  EnvelopeSimple,
} from '@phosphor-icons/react';

const FAST_LINKS = [
  { href: '/guidebook', label: 'Buku Panduan & Rulebook' },
  { href: '/#jadwal', label: 'Kalender & Alur Lomba' },
  // { href: '/#agenda', label: 'Seminar & Workshop' },
  { href: '/#daftar', label: 'Alur & Panduan Pendaftaran' },
  { href: '/#faq', label: 'Pertanyaan Umum (FAQ)' },
  { href: '/login', label: 'Portal Masuk Peserta' },
  { href: '/register', label: 'Registrasi Akun Baru' },
];

export function Footer() {
  const { systemSettings, competitions } = useAppStore();

  const waRaw = (systemSettings?.whatsapp_helpdesk || '0812-3456-7890').replace(/[^0-9]/g, '');
  const waUrl = waRaw.startsWith('0') ? `https://wa.me/62${waRaw.slice(1)}` : `https://wa.me/${waRaw}`;
  const emailHelpdesk = systemSettings?.email_helpdesk || 'helpdesk@permifest.id';
  const venueAddress = systemSettings?.venue_address || 'Kampus Pusat UST Yogyakarta, Jl. Batikan, Tahunan, Umbulharjo, Kota Yogyakarta 55167';

  return (
    <footer className="relative border-t border-[#2E2266] bg-[#080517] text-[#A99FD1] text-sm overflow-hidden">
      {/* Subtle Glow Backdrop */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-[#9B6BF2]/10 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Kolom 1 & 2: Brand, Kolaborasi & Narasi */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="select-none">
                <span className="font-[family-name:var(--font-bricolage)] font-extrabold text-xl text-[#F5F2FF] tracking-tight block">
                  Permifest <span className="text-[#D56BD9]">x</span> Deforkafest
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#A99FD1] leading-relaxed max-w-sm">
              Kolaborasi akbar tahunan antara <strong>Permikomnas Wilayah VII Yogyakarta</strong>{' '}
              dan <strong>Himpunan Mahasiswa Informatika (IMPSI) UST Yogyakarta</strong>.
              Wadah kompetisi teknologi dan e-sport terpadu bagi generasi muda berdaya saing.
            </p>

            {/* Social badges */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <a
                href={systemSettings?.instagram_permikomnas || 'https://instagram.com/permikomnas.diy'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-[#F5F2FF] bg-[#140D33] border border-[#2E2266] hover:border-[#9B6BF2] hover:bg-[#1E134D] transition-all min-h-[36px]"
              >
                <InstagramLogo size={16} weight="bold" className="text-[#9B6BF2]" />
                @permikomnas.diy
              </a>
              <a
                href={systemSettings?.instagram_impsi || 'https://instagram.com/impsi_ust'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-[#F5F2FF] bg-[#140D33] border border-[#2E2266] hover:border-[#9B6BF2] hover:bg-[#1E134D] transition-all min-h-[36px]"
              >
                <InstagramLogo size={16} weight="bold" className="text-[#9B6BF2]" />
                @impsi_ust
              </a>
            </div>
          </div>

          {/* Kolom 3: Cabang Kompetisi Dinamis */}
          <div>
            <h4 className="font-bold text-[#F5F2FF] mb-4 uppercase tracking-wider text-xs select-none">
              Cabang Lomba ({competitions.length})
            </h4>
            <ul className="space-y-2.5">
              {competitions.map((comp) => (
                <li key={comp.id}>
                  <Link
                    href={`/kompetisi/${comp.slug}`}
                    className="text-xs sm:text-sm text-[#A99FD1] hover:text-[#F5F2FF] hover:underline underline-offset-4 transition-colors"
                  >
                    {comp.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 4: Navigasi Cepat & Dokumen */}
          <div>
            <h4 className="font-bold text-[#F5F2FF] mb-4 uppercase tracking-wider text-xs select-none">
              Tautan &amp; Panduan
            </h4>
            <ul className="space-y-2.5">
              {FAST_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-[#A99FD1] hover:text-[#6CC4FF] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 5: Sekretariat & Helpdesk */}
          <div>
            <h4 className="font-bold text-[#F5F2FF] mb-4 uppercase tracking-wider text-xs select-none">
              Narahubung &amp; Venue
            </h4>
            <div className="space-y-3 text-xs text-[#A99FD1] leading-relaxed">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#9B6BF2]/10 border border-[#9B6BF2]/25 flex items-center justify-center shrink-0 mt-0.5 select-none">
                  <MapPin size={14} weight="bold" className="text-[#9B6BF2]" />
                </div>
                <span>
                  {venueAddress}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#9B6BF2]/10 border border-[#9B6BF2]/25 flex items-center justify-center shrink-0 select-none">
                  <WhatsappLogo size={14} weight="bold" className="text-[#9B6BF2]" />
                </div>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Helpdesk WA: {systemSettings?.whatsapp_helpdesk || '+62 812-3456-7890'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-[#9B6BF2]/10 border border-[#9B6BF2]/25 flex items-center justify-center shrink-0 select-none">
                  <EnvelopeSimple size={14} weight="bold" className="text-[#9B6BF2]" />
                </div>
                <a href={`mailto:${emailHelpdesk}`} className="hover:text-white transition-colors">
                  {emailHelpdesk}
                </a>
              </div>
            </div>

            {/* CTA Daftar di Footer */}
            <div className="mt-5 select-none">
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-xl text-xs font-black text-[#0B0720] bg-gradient-to-r from-[#9B6BF2] via-[#D56BD9] to-[#FFE359] shadow-[3px_3px_0px_#0B0720] hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 transition-all min-h-[44px]"
              >
                Daftar Akun Peserta Sekarang
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#2E2266]/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none">
          <p>© 2026 Permifest x Deforkafest. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/guidebook" className="hover:text-white transition-colors">
              Rulebook Resmi
            </Link>
            <Link href="/informasi" className="hover:text-white transition-colors">
              Pusat Informasi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
