'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { EventItem, EventType, EventFormat } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { createGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar';
import {
  Clock,
  MapPin,
  VideoCamera,
  Buildings,
  Sparkle,
  User,
  ArrowSquareOut,
  X,
  Ticket,
  CheckCircle,
  CalendarPlus,
  DownloadSimple,
} from '@phosphor-icons/react';

const EVENT_TYPE_MAP: Record<EventType, { label: string; badgeBg: string; textColor: string }> = {
  seminar: { label: 'Seminar Nasional', badgeBg: 'bg-[#9B6BF2]/20 border-[#9B6BF2]/40', textColor: 'text-[#9B6BF2]' },
  webinar: { label: 'Webinar Teknologi', badgeBg: 'bg-[#6CC4FF]/20 border-[#6CC4FF]/40', textColor: 'text-[#6CC4FF]' },
  workshop: { label: 'Hands-on Workshop', badgeBg: 'bg-[#C4F15A]/20 border-[#C4F15A]/40', textColor: 'text-[#C4F15A]' },
  ceremony: { label: 'Ceremony & Penutupan', badgeBg: 'bg-[#FFE359]/20 border-[#FFE359]/40', textColor: 'text-[#FFE359]' },
};

const FORMAT_MAP: Record<EventFormat, { label: string; icon: React.ElementType }> = {
  online: { label: 'Daring (Online)', icon: VideoCamera },
  offline: { label: 'Luring (Kampus UST)', icon: Buildings },
  hybrid: { label: 'Hybrid (Online + Offline)', icon: Sparkle },
};

interface EventsSectionProps {
  id?: string;
}

export function EventsSection({ id = 'agenda' }: EventsSectionProps) {
  const store = useAppStore();
  const rawEvents = store?.events;
  const events = useMemo(() => (Array.isArray(rawEvents) ? rawEvents : []), [rawEvents]);

  const [activeType, setActiveType] = useState<'all' | EventType>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Ambil hanya event yang dipublikasikan
  const publishedEvents = useMemo(() => {
    return events.filter((e) => e.is_published);
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeType === 'all') return publishedEvents;
    return publishedEvents.filter((e) => e.type === activeType);
  }, [publishedEvents, activeType]);

  const formatEventDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const handleDownloadIcs = (item: EventItem) => {
    downloadIcsFile(`${item.slug}-permifest`, {
      title: `[Permifest x Deforkafest] ${item.title}`,
      description: item.description,
      location: item.location_name,
      startTime: item.start_time,
      endTime: item.end_time,
      url: item.registration_url,
    });
  };

  return (
    <section
      id={id}
      aria-labelledby="agenda-heading"
      className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="text-center mb-12">
        {publishedEvents.length === 0 ? (
          <div
            role="status"
            className="mx-auto max-w-3xl rounded-2xl border border-border bg-card px-6 py-10 text-center sm:px-10"
          >
            <p className="text-sm font-bold uppercase tracking-wider text-brand-pink">
              Agenda Seminar
            </p>
            <h2
              id="agenda-heading"
              className="mt-3 font-[family-name:var(--font-bricolage)] text-2xl font-black tracking-tight text-foreground sm:text-3xl"
            >
              Jadwal seminar belum diumumkan
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Informasi agenda akan tampil di sini setelah dipublikasikan oleh panitia.
            </p>
          </div>
        ) : (
          <>
            <div className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#140D33] border border-[#2E2266] text-[#D56BD9] mb-3 select-none">
              Agenda Unggulan &amp; Seminar
            </div>
            <h2
              id="agenda-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-black font-[family-name:var(--font-bricolage)] text-[#F5F2FF] tracking-tight"
            >
              Seminar Nasional &amp; <span className="text-[#6CC4FF]">Workshop AI</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#A99FD1] max-w-2xl mx-auto">
              Perluas wawasan dan jejaring profesionalmu lewat sesi inspiratif bersama praktisi industri, pakar siber, dan arsitek AI terkemuka.
            </p>

            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              {[
                { id: 'all', label: 'Semua Agenda' },
                { id: 'seminar', label: 'Seminar Nasional' },
                { id: 'webinar', label: 'Webinar Online' },
                { id: 'workshop', label: 'Tech Workshop' },
              ].map((tab) => {
                const isActive = activeType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveType(tab.id as 'all' | EventType)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all min-h-[38px] border cursor-pointer ${
                      isActive
                        ? 'bg-[#9B6BF2] text-[#0B0720] border-[#9B6BF2] shadow-[3px_3px_0px_#0B0720]'
                        : 'bg-[#140D33] text-[#A99FD1] border-[#2E2266] hover:text-[#F5F2FF] hover:border-[#9B6BF2]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedEvents.length > 0 && filteredEvents.map((item) => {
          const typeMeta = EVENT_TYPE_MAP[item.type] || EVENT_TYPE_MAP.seminar;
          const formatInfo = FORMAT_MAP[item.format] || FORMAT_MAP.offline;
          const FormatIcon = formatInfo.icon;

          return (
            <article
              key={item.id}
              className="group relative flex flex-col justify-between rounded-3xl border-2 border-[#2E2266] bg-[#140D33] p-6 shadow-[5px_5px_0px_#0B0720] hover:shadow-[7px_7px_0px_#0B0720,10px_10px_0px_#9B6BF2] hover:-translate-y-1 transition-all duration-200"
            >
              <div>
                {/* Badges Baris Atas */}
                <div className="flex items-center justify-between gap-2 mb-4 select-none flex-wrap">
                  <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${typeMeta.badgeBg} ${typeMeta.textColor}`}>
                    {typeMeta.label}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0B0720] border border-[#2E2266] text-[#6CC4FF]">
                    <FormatIcon size={14} weight="bold" />
                    <span>{formatInfo.label}</span>
                  </span>
                </div>

                <h3 className="font-[family-name:var(--font-bricolage)] font-extrabold text-lg sm:text-xl text-[#F5F2FF] group-hover:text-[#F0A6F2] transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="mt-2.5 text-xs text-[#A99FD1] leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Info Waktu & Tempat */}
                <div className="mt-4 space-y-2 text-xs text-[#A99FD1]">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-[#FFE359] shrink-0" weight="bold" />
                    <span className="font-mono text-[11px] text-[#F5F2FF]">{formatEventDate(item.start_time)} WIB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-[#C4F15A] shrink-0" weight="bold" />
                    <span className="truncate">{item.location_name}</span>
                  </div>
                </div>

                {/* Narasumber Chip */}
                {item.speakers && item.speakers.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-[#2E2266]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#A99FD1] mb-2">
                      Pemateri:
                    </p>
                    <div className="space-y-1.5">
                      {item.speakers.map((sp, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#F5F2FF]">
                          <div className="w-5 h-5 rounded-full bg-[#9B6BF2]/20 border border-[#9B6BF2]/40 flex items-center justify-center text-[#9B6BF2] shrink-0">
                            <User size={12} weight="bold" />
                          </div>
                          <span className="font-bold truncate">{sp.name}</span>
                          {sp.organization && (
                            <span className="text-[11px] text-[#A99FD1] truncate">({sp.organization})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-[#2E2266] flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-[#FFE359] block font-mono">
                    {item.price === 0 ? 'GRATIS' : formatCurrency(item.price)}
                  </span>
                  <span className="text-[10px] text-[#A99FD1]">
                    {item.quota ? `Kuota: ${item.quota} peserta` : 'Kuota Terbuka'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={createGoogleCalendarUrl({
                      title: `[Permifest x Deforkafest] ${item.title}`,
                      description: item.description,
                      location: item.location_name,
                      startTime: item.start_time,
                      endTime: item.end_time,
                      url: item.registration_url,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-[#A99FD1] hover:text-[#6CC4FF] hover:bg-[#1d1347] border border-[#2E2266] transition-all"
                    title="Simpan ke Google Calendar"
                  >
                    <CalendarPlus size={16} weight="bold" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelectedEvent(item)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0B0720] bg-gradient-to-r from-[#C4F15A] to-[#6CC4FF] hover:brightness-110 active:translate-y-0.5 transition-all shadow-[2px_2px_0px_#0B0720] cursor-pointer"
                  >
                    Detail &amp; Daftar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Modal Detail Agenda Interaktif ── */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-[#140D33] border-2 border-[#2E2266] shadow-[6px_6px_0px_#0B0720,10px_10px_0px_#9B6BF2] overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FFE359] text-[#0B0720] shadow-sm mb-2 select-none">
                  {EVENT_TYPE_MAP[selectedEvent.type]?.label || 'Agenda Resmi'}
                </span>
                <h3 className="font-[family-name:var(--font-bricolage)] font-black text-xl sm:text-2xl text-[#F5F2FF] leading-snug">
                  {selectedEvent.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-xl text-[#A99FD1] hover:text-[#F5F2FF] hover:bg-[#2E2266] transition-colors cursor-pointer shrink-0"
                aria-label="Tutup Detail"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Deskripsi */}
            <p className="text-xs sm:text-sm text-[#A99FD1] leading-relaxed">
              {selectedEvent.description}
            </p>

            {/* Rincian Waktu & Lokasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#0B0720] border border-[#2E2266] text-xs">
              <div className="space-y-1">
                <span className="text-[#FFE359] font-bold block">Waktu Pelaksanaan:</span>
                <span className="text-[#F5F2FF] font-mono">{formatEventDate(selectedEvent.start_time)} WIB</span>
              </div>
              <div className="space-y-1">
                <span className="text-[#6CC4FF] font-bold block">Lokasi / Media:</span>
                <span className="text-[#F5F2FF]">{selectedEvent.location_name}</span>
              </div>
            </div>

            {/* Narasumber */}
            {selectedEvent.speakers && selectedEvent.speakers.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#A99FD1] mb-2.5">
                  Narasumber Terpilih:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEvent.speakers.map((sp, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[#0B0720] border border-[#2E2266] flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#9B6BF2]/20 border border-[#9B6BF2]/40 flex items-center justify-center text-[#9B6BF2] shrink-0 font-bold">
                        <User size={18} weight="bold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#F5F2FF] truncate">{sp.name}</p>
                        <p className="text-[11px] text-[#A99FD1] truncate">{sp.role_title}</p>
                        {sp.organization && (
                          <p className="text-[10px] text-[#6CC4FF] truncate">{sp.organization}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fasilitas / Benefit */}
            <div className="flex items-center gap-4 text-xs text-[#A99FD1] flex-wrap">
              {selectedEvent.certificate_provided && (
                <div className="flex items-center gap-1.5 text-[#C4F15A]">
                  <CheckCircle size={16} weight="fill" />
                  <span>E-Sertifikat Nasional</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[#6CC4FF]">
                <Ticket size={16} weight="bold" />
                <span>Materi &amp; Rekaman Sesi</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-[#2E2266] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#A99FD1] block">Biaya Investasi:</span>
                <span className="text-base font-black text-[#FFE359] font-mono">
                  {selectedEvent.price === 0 ? 'GRATIS / FREE' : formatCurrency(selectedEvent.price)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Tombol Kalender */}
                <a
                  href={createGoogleCalendarUrl({
                    title: `[Permifest x Deforkafest] ${selectedEvent.title}`,
                    description: selectedEvent.description,
                    location: selectedEvent.location_name,
                    startTime: selectedEvent.start_time,
                    endTime: selectedEvent.end_time,
                    url: selectedEvent.registration_url,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F5F2FF] bg-[#1d1347] border border-[#2E2266] hover:bg-[#25195c] hover:border-[#6CC4FF] transition-all min-h-[38px]"
                  title="Simpan langsung ke Google Calendar"
                >
                  <CalendarPlus size={15} weight="bold" />
                  <span>Google Cal</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleDownloadIcs(selectedEvent)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#F5F2FF] bg-[#1d1347] border border-[#2E2266] hover:bg-[#25195c] hover:border-[#C4F15A] transition-all min-h-[38px] cursor-pointer"
                  title="Unduh file .ics kalender"
                >
                  <DownloadSimple size={15} weight="bold" />
                  <span>.ics</span>
                </button>

                {selectedEvent.registration_url && (
                  <a
                    href={selectedEvent.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black text-[#0B0720] bg-gradient-to-r from-[#9B6BF2] via-[#D56BD9] to-[#FFE359] shadow-[3px_3px_0px_#0B0720] hover:brightness-110 active:translate-y-0.5 transition-all min-h-[38px]"
                  >
                    <span>Daftar Sekarang</span>
                    <ArrowSquareOut size={16} weight="bold" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
