import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { CountdownTimer } from '@/components/landing/CountdownTimer';
import { PartnersSection } from '@/components/landing/PartnersSection';
import { CompetitionsSection } from '@/components/landing/CompetitionsSection';
import { TimelineSection } from '@/components/landing/TimelineSection';
import { EventsSection } from '@/components/landing/EventsSection';
import { LeaderboardTeaser } from '@/components/landing/LeaderboardTeaser';
import { HowToRegisterSection } from '@/components/landing/HowToRegisterSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaClosingSection } from '@/components/landing/CtaClosingSection';
import { StickyBottomBar } from '@/components/landing/StickyBottomBar';
import { competitionRepository } from '@/lib/repositories';
import { Competition } from '@/lib/types';

export const instant = false;

export default async function HomePage() {
  // Ambil data kompetisi langsung dari database backend / Supabase
  let competitions: Competition[] = [];
  try {
    competitions = await competitionRepository.getAll();
  } catch {
    // Graceful fallback ke mock data bila Supabase koneksi offline
    competitions = [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0720] text-[#F5F2FF]">
      {/* ── Header / Navbar ── */}
      <Navbar />

      {/* ── Main Landing Content ── */}
      <main id="main-content" className="flex-1">
        <HeroSection />
        <CountdownTimer />
        <PartnersSection />
        <CompetitionsSection id="lomba" initialCompetitions={competitions} />
        <TimelineSection id="jadwal" />
        <EventsSection id="agenda" />
        <LeaderboardTeaser />
        <HowToRegisterSection id="daftar" />
        <FaqSection id="faq" />
        <CtaClosingSection />
      </main>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Mobile Sticky Bottom Bar ── */}
      <StickyBottomBar />
    </div>
  );
}
