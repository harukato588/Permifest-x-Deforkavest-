'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ListBullets,
  Alarm,
  Trophy,
  X,
  ArrowSquareOut,
  DownloadSimple,
  Sparkle,
  User,
} from '@phosphor-icons/react';
import { useAppStore } from '@/lib/store';
import { TimelineEvent, TimelineEventType /* , EventItem */ } from '@/lib/types';
import { createGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendar';

interface AgendaItem {
  id: string;
  source: 'lomba' | 'event';
  day: number;
  month: number; // 1-12
  year: number;
  isoDate: string;
  endDateIso?: string;
  title: string;
  stickerBg: string;
  badgeType: string;
  desc: string;
  dateStr: string;
  timeStr: string;
  locationStr: string;
  isDeadline?: boolean;
  cabangNama?: string;
  speakers?: { name: string; role_title: string; organization: string }[];
  registrationUrl?: string;
}

const EVENT_TYPE_MAP: Record<TimelineEventType, { stickerBg: string; badgeType: string }> = {
  daftar: { stickerBg: '#F0A6F2', badgeType: 'Pendaftaran' },
  'technical-meeting': { stickerBg: '#6CC4FF', badgeType: 'Pengarahan TM' },
  penyisihan: { stickerBg: '#9B6BF2', badgeType: 'Babak Lomba' },
  final: { stickerBg: '#C4F15A', badgeType: 'Puncak Acara' },
  pengumuman: { stickerBg: '#E6C978', badgeType: 'Pengumuman' },
};

/*
const SEMINAR_TYPE_MAP: Record<string, { stickerBg: string; badgeType: string }> = {
  seminar: { stickerBg: '#9B6BF2', badgeType: 'Seminar Nasional' },
  webinar: { stickerBg: '#6CC4FF', badgeType: 'Webinar Online' },
  workshop: { stickerBg: '#C4F15A', badgeType: 'Tech Workshop' },
  ceremony: { stickerBg: '#FFE359', badgeType: 'Awarding Night' },
};
*/

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface TimelineSectionProps {
  id?: string;
}

export function TimelineSection({ id = 'jadwal' }: TimelineSectionProps) {
  const store = useAppStore();
  const rawTimelineEvents = store?.timelineEvents;
  const timelineEvents = useMemo(
    () => (Array.isArray(rawTimelineEvents) ? rawTimelineEvents : []),
    [rawTimelineEvents]
  );
  // const rawEvents = store?.events;
  // const events = useMemo(() => (Array.isArray(rawEvents) ? rawEvents : []), [rawEvents]);

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeMonth, setActiveMonth] = useState<11 | 12>(12);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'lomba' | 'event'>('all');
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaItem | null>(null);

  // Ubah timelineEvents (tahapan lomba) ke AgendaItem
  const lombaAgendaList: AgendaItem[] = useMemo(() => {
    const formatSingleDate = (iso: string) => {
      const p = iso.split('-');
      const yy = parseInt(p[0], 10) || 2026;
      const mm = parseInt(p[1], 10) || 12;
      const dd = parseInt(p[2], 10) || 1;
      return `${dd} ${MONTH_NAMES[mm - 1] || 'Desember'} ${yy}`;
    };

    return timelineEvents.map((ev: TimelineEvent) => {
      const parts = ev.tanggal_mulai.split('-');
      const y = parseInt(parts[0], 10) || 2026;
      const m = parseInt(parts[1], 10) || 12;
      const d = parseInt(parts[2], 10) || 1;

      const meta = EVENT_TYPE_MAP[ev.jenis] || { stickerBg: '#E6C978', badgeType: 'Agenda Event' };
      const startFormatted = formatSingleDate(ev.tanggal_mulai);
      const dateFormatted = ev.tanggal_selesai
        ? `${startFormatted.replace(` ${y}`, '')} - ${formatSingleDate(ev.tanggal_selesai)}`
        : startFormatted;

      return {
        id: `tl-${ev.id}`,
        source: 'lomba' as const,
        day: d,
        month: m,
        year: y,
        isoDate: ev.tanggal_mulai,
        endDateIso: ev.tanggal_selesai,
        title: ev.judul.replace(
          /^(Buka Pendaftaran: |Tutup Pendaftaran & Pembayaran: |Batas Pengumpulan Berkas: |Babak Final & Presentasi: )/,
          ''
        ),
        stickerBg: meta.stickerBg,
        badgeType: meta.badgeType,
        desc: ev.deskripsi || ev.judul,
        dateStr: dateFormatted,
        timeStr: ev.jam ? (ev.jam.startsWith('Pukul') ? ev.jam : `Pukul ${ev.jam}`) : 'Sepanjang Hari',
        locationStr: ev.lokasi || 'Online Platform',
        isDeadline: ev.is_deadline,
        cabangNama: ev.cabang_nama,
      };
    });
  }, [timelineEvents]);

  // Fitur seminar dikomen sementara
  const seminarAgendaList: AgendaItem[] = useMemo(() => [], []);
  /*
  const seminarAgendaList: AgendaItem[] = useMemo(() => {
    return events
      .filter((ev: EventItem) => ev.is_published)
      .map((ev: EventItem) => {
        const dObj = new Date(ev.start_time);
        const y = isNaN(dObj.getFullYear()) ? 2026 : dObj.getFullYear();
        const m = isNaN(dObj.getMonth()) ? 12 : dObj.getMonth() + 1;
        const d = isNaN(dObj.getDate()) ? 1 : dObj.getDate();

        const meta = SEMINAR_TYPE_MAP[ev.type] || { stickerBg: '#9B6BF2', badgeType: 'Agenda Seminar' };
        const dateFormatted = `${d} ${MONTH_NAMES[m - 1] || 'Desember'} ${y}`;

        const hours = isNaN(dObj.getHours()) ? '08' : String(dObj.getHours()).padStart(2, '0');
        const minutes = isNaN(dObj.getMinutes()) ? '00' : String(dObj.getMinutes()).padStart(2, '0');
        const timeFormatted = `Pukul ${hours}:${minutes} WIB`;

        return {
          id: `ev-${ev.id}`,
          source: 'event' as const,
          day: d,
          month: m,
          year: y,
          isoDate: ev.start_time,
          endDateIso: ev.end_time,
          title: ev.title,
          stickerBg: meta.stickerBg,
          badgeType: meta.badgeType,
          desc: ev.description,
          dateStr: dateFormatted,
          timeStr: timeFormatted,
          locationStr: ev.location_name || 'Online Platform',
          speakers: ev.speakers,
          registrationUrl: ev.registration_url,
        };
      });
  }, [events]);
  */

  // Gabungkan seluruh agenda sesuai filter kategori
  const unifiedAgendaList: AgendaItem[] = useMemo(() => {
    let combined: AgendaItem[] = [];
    if (categoryFilter === 'all') {
      combined = [...lombaAgendaList, ...seminarAgendaList];
    } else if (categoryFilter === 'lomba') {
      combined = lombaAgendaList;
    } else {
      combined = seminarAgendaList;
    }

    // Urutkan berdasarkan tanggal
    return combined.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [lombaAgendaList, seminarAgendaList, categoryFilter]);

  // Petakan event ke hari pada bulan aktif (November / Desember 2026)
  const agendaMap = useMemo(() => {
    const map: Record<number, AgendaItem[]> = {};
    for (const a of unifiedAgendaList) {
      if (a.month === activeMonth && a.year === 2026) {
        if (!map[a.day]) {
          map[a.day] = [];
        }
        map[a.day].push(a);
      }
    }
    return map;
  }, [unifiedAgendaList, activeMonth]);

  const leadingDays = activeMonth === 11 ? [26, 27, 28, 29, 30, 31] : [30];
  const daysInMonth = activeMonth === 11 ? 30 : 31;

  // Handler Download .ics
  const handleDownloadIcs = (item: AgendaItem) => {
    downloadIcsFile(`${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-permifest`, {
      title: `[Permifest x Deforkafest] ${item.title}`,
      description: item.desc,
      location: item.locationStr,
      startTime: item.isoDate,
      endTime: item.endDateIso,
      url: item.registrationUrl,
    });
  };

  return (
    <section
      id={id}
      aria-labelledby="timeline-heading"
      className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="max-w-2xl text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#140D33] text-[#D56BD9] border border-[#2E2266] mb-3">
            Jadwal Rangkaian Acara 2026
          </span>
          <h2
            id="timeline-heading"
            className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-bricolage)] text-foreground tracking-tight"
          >
            Tanggal penting,{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #9B6BF2, #D56BD9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              jangan kelewat
            </span>
          </h2>
          <p className="mt-3 text-[#A99FD1] text-base leading-relaxed">
            Klik pada tanggal mana pun di kalender untuk membuka rincian agenda, countdown, serta opsi simpan langsung ke Google Calendar atau unduh file kalender (.ics).
          </p>
        </div>

        {/* View Toggle */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#140D33] border border-[#2E2266] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors min-h-[44px] cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-[#7c4ddb] text-[#F5F2FF] shadow-sm'
                : 'text-[#A99FD1] hover:text-[#F5F2FF]'
            }`}
          >
            <CalendarIcon size={16} weight="bold" />
            <span>Kalender</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors min-h-[44px] cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#7c4ddb] text-[#F5F2FF] shadow-sm'
                : 'text-[#A99FD1] hover:text-[#F5F2FF]'
            }`}
          >
            <ListBullets size={16} weight="bold" />
            <span>Daftar ({unifiedAgendaList.length})</span>
          </button>
        </div>
      </div>

      {/* ── Filter Kategori Jadwal: Hanya muncul jika ada agenda khusus / seminar ── */}
      {seminarAgendaList.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none select-none">
          {[
            { id: 'all', label: `Semua Acara (${lombaAgendaList.length + seminarAgendaList.length})` },
            { id: 'lomba', label: `Tahapan Lomba (${lombaAgendaList.length})` },
            { id: 'event', label: `Seminar & Workshop (${seminarAgendaList.length})` },
          ].map((tab) => {
            const isActive = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id as 'all' | 'lomba' | 'event')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] border cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#9B6BF2] text-[#0B0720] border-[#9B6BF2] shadow-[2px_2px_0px_#0B0720]'
                    : 'bg-[#140D33] text-[#A99FD1] border-[#2E2266] hover:text-[#F5F2FF]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="rounded-2xl border border-[#2E2266] bg-[#140D33] p-4 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-[#2E2266]/70">
            <div>
              <p className="font-[family-name:var(--font-bricolage)] font-extrabold text-xl sm:text-2xl text-[#F5F2FF]">
                {MONTH_NAMES[activeMonth - 1]} 2026
              </p>
              <p className="text-xs text-[#A99FD1]">Klik kotak tanggal atau agenda untuk melihat rincian &amp; ekspor kalender</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center p-1 rounded-xl bg-[#0B0720] border border-[#2E2266]">
                {([11, 12] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setActiveMonth(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      activeMonth === m
                        ? 'bg-[#9B6BF2] text-[#0B0720]'
                        : 'text-[#A99FD1] hover:text-[#F5F2FF]'
                    }`}
                  >
                    {MONTH_NAMES[m - 1]}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-[#A99FD1] font-mono bg-[#0B0720] px-2.5 py-1.5 rounded-lg border border-[#2E2266]">
                WIB (UTC+7)
              </span>
            </div>
          </div>

          {/* Day Headers (Sen - Min) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 text-center text-xs font-bold text-[#A99FD1] font-[family-name:var(--font-jetbrains)] mb-2.5 select-none">
            <span className="text-[#A99FD1]">Sen</span>
            <span className="text-[#A99FD1]">Sel</span>
            <span className="text-[#A99FD1]">Rab</span>
            <span className="text-[#A99FD1]">Kam</span>
            <span className="text-[#A99FD1]">Jum</span>
            <span className="text-[#6CC4FF]">Sab</span>
            <span className="text-[#D56BD9]">Min</span>
          </div>

          {/* Grid Hari */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 select-none">
            {leadingDays.map((prevDay) => (
              <div
                key={`prev-${prevDay}`}
                className="min-h-[70px] sm:min-h-[96px] rounded-xl border border-transparent bg-[#140D33]/30 p-2 opacity-30 select-none"
              >
                <span className="font-[family-name:var(--font-jetbrains)] text-xs text-[#A99FD1]/40">
                  {prevDay}
                </span>
              </div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayAgendas = agendaMap[day] || [];
              const primaryAgenda = dayAgendas[0];
              const hasEvents = dayAgendas.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (primaryAgenda) setSelectedAgenda(primaryAgenda);
                  }}
                  className={`min-h-[70px] sm:min-h-[96px] rounded-xl border p-1.5 sm:p-2.5 transition-all duration-200 flex flex-col justify-between ${
                    hasEvents
                      ? 'bg-[#18103c] border-[#7c4ddb]/70 hover:border-[#9B6BF2] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(155,107,242,0.3)] cursor-pointer'
                      : 'bg-[#140D33]/60 border-[#2E2266]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-[family-name:var(--font-jetbrains)] font-bold text-xs sm:text-sm tabular-nums ${
                        hasEvents ? 'text-[#F5F2FF] font-black' : 'text-[#A99FD1]/80'
                      }`}
                    >
                      {day}
                    </span>
                    {dayAgendas.length > 1 && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#9B6BF2] text-[#0B0720]">
                        {dayAgendas.length}
                      </span>
                    )}
                  </div>

                  {dayAgendas.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayAgendas.slice(0, 3).map((agenda) => (
                        <button
                          key={agenda.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgenda(agenda);
                          }}
                          className="w-full block px-1.5 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-extrabold text-[#0B0720] truncate text-center leading-tight shadow-sm transition-transform hover:scale-105 cursor-pointer"
                          style={{
                            backgroundColor: agenda.stickerBg,
                          }}
                          title={`${agenda.title} (${agenda.badgeType})`}
                        >
                          {agenda.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="space-y-3.5">
          {unifiedAgendaList.map((ag) => (
            <div
              key={ag.id}
              onClick={() => setSelectedAgenda(ag)}
              className="p-5 rounded-2xl border border-[#2E2266] bg-[#140D33] hover:border-[#9B6BF2] hover:-translate-y-1 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span
                    className="px-2.5 py-0.5 rounded-md text-xs font-bold text-[#0B0720]"
                    style={{ backgroundColor: ag.stickerBg }}
                  >
                    {ag.badgeType}
                  </span>
                  {ag.source === 'event' && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#6CC4FF]/20 text-[#6CC4FF] border border-[#6CC4FF]/40 flex items-center gap-1">
                      <Sparkle size={12} weight="fill" />
                      Agenda Khusus
                    </span>
                  )}
                  {ag.cabangNama && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#2E2266] text-[#A99FD1] flex items-center gap-1">
                      <Trophy size={12} className="text-[#E6C978]" />
                      {ag.cabangNama}
                    </span>
                  )}
                  {ag.isDeadline && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                      <Alarm size={13} weight="fill" />
                      Deadline
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-[#F5F2FF]">{ag.title}</h3>
                <p className="text-xs sm:text-sm text-[#A99FD1] mt-1">{ag.desc}</p>
              </div>
              <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2E2266]">
                <span className="text-xs font-bold text-[#F5F2FF] block">{ag.dateStr}</span>
                <span className="text-xs text-[#A99FD1] block">{ag.timeStr}</span>
                <span className="text-xs text-[#A99FD1]/80 block">{ag.locationStr}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Manga Event Interactive Modal Dialog ── */}
      {selectedAgenda && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-modal-title"
          onClick={() => setSelectedAgenda(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-[#140D33] border-2 border-[#9B6BF2] p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header dengan Badge Washi Tape & Tombol Tutup */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div
                className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-[#0B0720] shadow-sm select-none border border-black/20"
                style={{
                  backgroundColor: selectedAgenda.stickerBg,
                  transform: 'rotate(-2deg)',
                }}
              >
                ★ {selectedAgenda.badgeType}
              </div>

              <button
                type="button"
                onClick={() => setSelectedAgenda(null)}
                className="p-2 rounded-xl text-[#A99FD1] hover:text-[#F5F2FF] hover:bg-[#1d1347] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Tutup Detail"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {selectedAgenda.cabangNama && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#2E2266] text-[#6CC4FF]">
                    {selectedAgenda.cabangNama}
                  </span>
                )}
                {selectedAgenda.isDeadline && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/40">
                    Batas Akhir / Deadline
                  </span>
                )}
              </div>

              <h3
                id="calendar-modal-title"
                className="text-2xl font-extrabold font-[family-name:var(--font-bricolage)] text-[#F5F2FF] leading-snug"
              >
                {selectedAgenda.title}
              </h3>

              <p className="mt-3 text-sm text-[#A99FD1] leading-relaxed">
                {selectedAgenda.desc}
              </p>

              {/* Rincian Narasumber Jika Ada */}
              {selectedAgenda.speakers && selectedAgenda.speakers.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-[#0B0720] border border-[#2E2266]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#D56BD9] mb-2">
                    Narasumber &amp; Instruktur
                  </p>
                  <div className="space-y-2">
                    {selectedAgenda.speakers.map((spk, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs">
                        <div className="p-1 rounded-lg bg-[#9B6BF2]/20 text-[#9B6BF2] mt-0.5">
                          <User size={13} weight="bold" />
                        </div>
                        <div>
                          <p className="font-bold text-[#F5F2FF]">{spk.name}</p>
                          <p className="text-[#A99FD1] text-[11px]">{spk.role_title} • {spk.organization}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rincian Waktu & Tempat Box yang Bersih */}
              <div className="mt-4 p-4 rounded-xl bg-[#0B0720] border border-[#2E2266] space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-[#A99FD1]">Tanggal</span>
                  <span className="font-bold text-[#F5F2FF]">{selectedAgenda.dateStr}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-[#A99FD1]">Waktu Pelaksanaan</span>
                  <span className="font-bold text-[#F5F2FF]">{selectedAgenda.timeStr}</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-[#A99FD1]">Lokasi / Saluran</span>
                  <span className="font-bold text-[#6CC4FF]">{selectedAgenda.locationStr}</span>
                </div>
              </div>

              {/* Actions Footer: Google Calendar, Download .ics, Registration */}
              <div className="mt-6 pt-4 border-t border-[#2E2266] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={createGoogleCalendarUrl({
                      title: `[Permifest x Deforkafest] ${selectedAgenda.title}`,
                      description: selectedAgenda.desc,
                      location: selectedAgenda.locationStr,
                      startTime: selectedAgenda.isoDate,
                      endTime: selectedAgenda.endDateIso,
                      url: selectedAgenda.registrationUrl,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#F5F2FF] bg-[#1d1347] border border-[#2E2266] hover:bg-[#25195c] hover:border-[#6CC4FF] transition-all min-h-[40px]"
                    title="Simpan langsung ke Google Calendar"
                  >
                    <ArrowSquareOut size={15} weight="bold" />
                    <span>Google Cal</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDownloadIcs(selectedAgenda)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#F5F2FF] bg-[#1d1347] border border-[#2E2266] hover:bg-[#25195c] hover:border-[#C4F15A] transition-all min-h-[40px] cursor-pointer"
                    title="Unduh file .ics untuk Apple Calendar / Outlook / Android"
                  >
                    <DownloadSimple size={15} weight="bold" />
                    <span>Unduh .ics</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedAgenda.registrationUrl && (
                    <a
                      href={selectedAgenda.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#0B0720] bg-[#C4F15A] border border-[#C4F15A] hover:bg-[#b2e245] transition-all min-h-[40px] inline-flex items-center"
                    >
                      Daftar Agenda
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedAgenda(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#F5F2FF] bg-[#2E2266] border border-[#6CC4FF]/40 hover:bg-[#3D2D85] transition-all min-h-[40px] cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
