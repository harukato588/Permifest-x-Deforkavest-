import React, { Suspense } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { CountdownTimer } from '@/components/landing/CountdownTimer';
import { PartnersSection } from '@/components/landing/PartnersSection';
import { CompetitionsSection } from '@/components/landing/CompetitionsSection';
import { TimelineSection } from '@/components/landing/TimelineSection';
// import { EventsSection } from '@/components/landing/EventsSection';
import { LeaderboardTeaser } from '@/components/landing/LeaderboardTeaser';
import { HowToRegisterSection } from '@/components/landing/HowToRegisterSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaClosingSection } from '@/components/landing/CtaClosingSection';
import { StickyBottomBar } from '@/components/landing/StickyBottomBar';
import { connection } from 'next/server';
import { competitionRepository } from '@/lib/repositories';
import { Competition } from '@/lib/types';

async function CompetitionsDataSection() {
  await connection();

  let competitions: Competition[] = [];
  try {
    competitions = await competitionRepository.getAll();
  } catch {
    competitions = [];
  }

  return <CompetitionsSection id="lomba" initialCompetitions={competitions} />;
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0B0720] text-[#F5F2FF]">
      {/* ── Header / Navbar ── */}
      <Navbar />

      {/* ── Main Landing Content ── */}
      <main id="main-content" className="flex-1">
        <HeroSection />
        <CountdownTimer />
        <PartnersSection />
        <Suspense fallback={<CompetitionsSection id="lomba" initialCompetitions={[]} />}>
          <CompetitionsDataSection />
        </Suspense>
        <TimelineSection id="jadwal" />
        {/* <EventsSection id="agenda" /> */}
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
