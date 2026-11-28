'use client';

import React, { useState, useEffect } from 'react';
import { SakugaButton } from '@/components/ui/sakuga-button';

export function StickyBottomBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroEl = document.getElementById('beranda');
    if (!heroEl) {
      const frameId = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frameId);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Tampilkan sticky bar hanya saat user sudah scroll melewati hero section
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(heroEl);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <aside
      aria-label="Aksi Cepat Pendaftaran"
      className="mobile-sticky-cta fixed inset-x-3 z-30 md:hidden max-w-md mx-auto p-3 bg-card border border-border rounded-2xl shadow-md safe-bottom transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto select-none">
        <div>
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-support-lime" />
            <span className="text-xs font-bold text-foreground leading-tight">
              Pendaftaran Dibuka
            </span>
          </div>
          <span className="block text-[11px] text-muted-foreground mt-0.5">
            3 Cabang Kompetisi Akademik
          </span>
        </div>

        <SakugaButton
          href="/register"
          variant="brand"
          size="sm"
          className="min-h-11 shrink-0 px-4 py-2 text-xs"
        >
          Daftar Sekarang
        </SakugaButton>
      </div>
    </aside>
  );
}
