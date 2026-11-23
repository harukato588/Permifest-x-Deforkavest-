
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { SakugaButton } from '@/components/ui/sakuga-button';
import { CalendarBlank, Question, Trophy, BookOpen, CalendarStar } from '@phosphor-icons/react';

interface NavLinkItem {
  href: string;
  section: string;
  label: string;
  icon: React.ElementType;
}

const NAV_LINKS: NavLinkItem[] = [
  { href: '/#lomba', section: 'lomba', label: 'Lomba', icon: Trophy },
  { href: '/guidebook', section: 'guidebook', label: 'Guidebook', icon: BookOpen },
  { href: '/#jadwal', section: 'jadwal', label: 'Jadwal & Alur', icon: CalendarBlank },
  { href: '/#agenda', section: 'agenda', label: 'Agenda Seminar', icon: CalendarStar },
  { href: '/#faq', section: 'faq', label: 'FAQ', icon: Question },
];

export function Navbar() {
  const { currentUser, events } = useAppStore();
  const [activeSection, setActiveSection] = useState('');
  const isLoggedIn = Boolean(currentUser && currentUser.email && currentUser.role);

  const hasPublishedEvents = useMemo(() => {
    return Array.isArray(events) && events.some((e) => e.is_published);
  }, [events]);

  const navLinks: NavLinkItem[] = useMemo(() => {
    if (hasPublishedEvents) return NAV_LINKS;
    return NAV_LINKS.filter((l) => l.section !== 'agenda');
  }, [hasPublishedEvents]);

  useEffect(() => {
    const sections = navLinks.map(({ section }) => document.getElementById(section)).filter(
      (section): section is HTMLElement => section !== null
    );

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (activeEntry) setActiveSection(activeEntry.target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [navLinks]);

  return (
    <>
      {/* Navbar Atas */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 shadow-sm backdrop-blur-xl md:fixed md:inset-x-0 md:top-4 md:border-0 md:bg-transparent md:px-4 md:shadow-none">
        <div className="max-w-7xl mx-auto min-h-14 md:min-h-16 md:rounded-full md:border md:border-border md:bg-background/75 md:shadow-md md:backdrop-blur-md px-4 sm:px-5 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex shrink-0 translate-y-[1px] items-center gap-0.5 sm:gap-1 font-[family-name:var(--font-bricolage)] font-extrabold text-sm sm:text-base md:text-xl text-foreground tracking-tight hover:opacity-85 transition-opacity select-none whitespace-nowrap"
            aria-label="Permifest x Deforkafest Halaman Utama"
          >
            <span>Permifest</span>
            <span className="text-brand-pink">x</span>
            <span>Deforkafest</span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-1 select-none"
            aria-label="Navigasi utama"
          >
            {navLinks.map((link) => {
              const isActive = activeSection === link.section;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setActiveSection(link.section)}
                  aria-current={isActive ? 'location' : undefined}
                  className={[
                    'min-h-11 flex items-center rounded-xl px-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ].join(' ')}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {!isLoggedIn ? (
              <>
                <SakugaButton
                  href="/login"
                  variant="secondary"
                  size="sm"
                  className="min-h-11 px-2.5 sm:px-4 text-[11px] sm:text-xs"
                >
                  Masuk
                </SakugaButton>

                <SakugaButton
                  href="/register"
                  variant="brand"
                  size="sm"
                  className="min-h-11 px-2.5 sm:px-5 text-[11px] sm:text-xs"
                >
                  Daftar
                </SakugaButton>
              </>
            ) : (
              <SakugaButton
                href="/dashboard"
                variant="brand"
                size="sm"
                className="min-h-11 px-3 sm:px-5 text-[11px] sm:text-xs"
              >
                Dashboard
              </SakugaButton>
            )}
          </div>
        </div>
      </header>

      {/* Navbar Bawah Mobile - TETAP PERSIS */}
      <nav
        className="mobile-floating-nav fixed inset-x-3 z-50 mx-auto max-w-md rounded-full border border-border bg-background/75 p-2 shadow-md backdrop-blur-md md:hidden"
        aria-label="Navigasi bagian"
      >
        <div className="grid grid-cols-5 gap-0">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = activeSection === link.section;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setActiveSection(link.section)}
                aria-current={isActive ? 'location' : undefined}
                className={[
                  'flex min-w-0 min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-0 text-center transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-150',
                    isActive
                      ? '-translate-y-1 bg-primary text-primary-foreground'
                      : 'bg-transparent',
                  ].join(' ')}
                >
                  <Icon size={19} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                </span>
                <span className="whitespace-nowrap text-[9px] font-medium leading-tight">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
