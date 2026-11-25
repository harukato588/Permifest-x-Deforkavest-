import React from 'react';
import { connection } from 'next/server';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { getCompetitionsQuery } from '@/features/competitions';
import { KompetisiListClient } from '@/features/competitions/components/KompetisiListClient';

export const instant = false;

export default async function KompetisiPage() {
  await connection();
  const competitions = await getCompetitionsQuery();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <section className="py-12 border-b border-border bg-card/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" className="mb-3">
            CABANG PERLOMBAAN
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-bricolage)] text-foreground">
            Daftar Kompetisi 2026
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2">
            Pilih cabang kompetisi akademik sesuai keahlianmu dan daftarkan dirimu langsung melalui platform.
          </p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <KompetisiListClient competitions={competitions} />
      </section>

      <Footer />
    </div>
  );
}
