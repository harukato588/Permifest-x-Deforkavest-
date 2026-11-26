'use client';

import React from 'react';
import Image from 'next/image';

export function OrganizerStrip() {
  return (
    <section aria-label="Penyelenggara Event" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="rounded-2xl border border-[#2E2266] bg-[#140D33] p-5 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-center">
        <span className="text-sm font-bold text-[#A99FD1]">
          Diselenggarakan oleh
        </span>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center rounded-xl overflow-hidden border border-[#2E2266] hover:border-[#7c4ddb] transition-colors">
            <Image
              src="/brand/permikomnas.svg"
              alt="Logo Permikomnas Wilayah Yogyakarta"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="inline-flex items-center rounded-xl overflow-hidden border border-[#2E2266] hover:border-[#7c4ddb] transition-colors">
            <Image
              src="/brand/impsi-ust.png"
              alt="Logo IMPSI Program Studi Informatika UST"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
