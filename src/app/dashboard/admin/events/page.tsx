'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/modal';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppStore } from '@/lib/store';
import { EventItem, EventType, EventFormat, EventSpeaker } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  CalendarStar,
  Plus,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  CheckCircle,
  VideoCamera,
  Buildings,
  GraduationCap,
  Sparkle,
  User,
  Clock,
  MapPin,
  Ticket,
} from '@phosphor-icons/react';

interface EventFormData {
  title: string;
  slug: string;
  type: EventType;
  format: EventFormat;
  start_time: string;
  end_time: string;
  location_name: string;
  location_url: string;
  description: string;
  speakers: EventSpeaker[];
  price: number;
  quota: number;
  registration_url: string;
  banner_url: string;
  is_published: boolean;
  certificate_provided: boolean;
  order_index: number;
}

const defaultFormData: EventFormData = {
  title: '',
  slug: '',
  type: 'seminar',
  format: 'hybrid',
  start_time: '2026-12-14T08:30',
  end_time: '2026-12-14T12:30',
  location_name: 'Auditorium Kampus 1 UST Yogyakarta',
  location_url: '',
  description: '',
  speakers: [{ name: '', role_title: '', organization: '' }],
  price: 0,
  quota: 200,
  registration_url: '',
  banner_url: '',
  is_published: true,
  certificate_provided: true,
  order_index: 1,
};

const EVENT_TYPE_MAP: Record<EventType, { label: string; badgeClass: string }> = {
  seminar: { label: 'Seminar Nasional', badgeClass: 'bg-primary/10 border-primary/25 text-primary' },
  webinar: { label: 'Webinar Online', badgeClass: 'bg-sky-500/10 border-sky-500/25 text-sky-700 dark:text-sky-400' },
  workshop: { label: 'Hands-on Workshop', badgeClass: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400' },
  ceremony: { label: 'Ceremony & Penutupan', badgeClass: 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400' },
};

const FORMAT_MAP: Record<EventFormat, { label: string; icon: React.ElementType }> = {
  online: { label: 'Daring (Online)', icon: VideoCamera },
  offline: { label: 'Luring (Kampus UST)', icon: Buildings },
  hybrid: { label: 'Hybrid (Online + Offline)', icon: Sparkle },
};

export default function AdminEventsPage() {
  const store = useAppStore();
  const rawEvents = store?.events;
  const events = useMemo(() => (Array.isArray(rawEvents) ? rawEvents : []), [rawEvents]);
  const { addEvent, updateEvent, deleteEvent, toggleEventPublished } = store;

  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(defaultFormData);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<EventItem | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter daftar event
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchType = typeFilter === 'all' || ev.type === typeFilter;
      const matchSearch =
        searchQuery === '' ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.speakers.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchSearch;
    }).sort((a, b) => a.order_index - b.order_index);
  }, [events, typeFilter, searchQuery]);

  // Statistik ringkas
  const stats = useMemo(() => {
    return {
      total: events.length,
      published: events.filter((e) => e.is_published).length,
      webinars: events.filter((e) => e.format === 'online').length,
      totalRegistrants: events.reduce((acc, curr) => acc + (curr.registered_count || 0), 0),
    };
  }, [events]);

  const openCreateDrawer = () => {
    setEditingId(null);
    setFormData({
      ...defaultFormData,
      order_index: events.length + 1,
    });
    setDrawerError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (ev: EventItem) => {
    setEditingId(ev.id);
    setFormData({
      title: ev.title,
      slug: ev.slug,
      type: ev.type,
      format: ev.format,
      start_time: ev.start_time.slice(0, 16),
      end_time: ev.end_time ? ev.end_time.slice(0, 16) : '',
      location_name: ev.location_name,
      location_url: ev.location_url || '',
      description: ev.description,
      speakers: ev.speakers.length > 0 ? ev.speakers : [{ name: '', role_title: '', organization: '' }],
      price: ev.price,
      quota: ev.quota || 100,
      registration_url: ev.registration_url || '',
      banner_url: ev.banner_url || '',
      is_published: ev.is_published,
      certificate_provided: ev.certificate_provided,
      order_index: ev.order_index,
    });
    setDrawerError(null);
    setDrawerOpen(true);
  };

  // Speaker row handlers
  const handleSpeakerChange = (index: number, field: keyof EventSpeaker, val: string) => {
    const updated = [...formData.speakers];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, speakers: updated });
  };

  const addSpeakerRow = () => {
    setFormData({
      ...formData,
      speakers: [...formData.speakers, { name: '', role_title: '', organization: '' }],
    });
  };

  const removeSpeakerRow = (index: number) => {
    const updated = formData.speakers.filter((_, i) => i !== index);
    setFormData({ ...formData, speakers: updated.length > 0 ? updated : [{ name: '', role_title: '', organization: '' }] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError(null);

    if (!formData.title.trim()) {
      setDrawerError('Judul agenda wajib diisi');
      return;
    }

    const cleanSpeakers = formData.speakers.filter((s) => s.name.trim() !== '');

    setSubmitting(true);
    try {
      const slug = formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (editingId) {
        await updateEvent(editingId, {
          title: formData.title.trim(),
          slug,
          type: formData.type,
          format: formData.format,
          start_time: formData.start_time,
          end_time: formData.end_time || undefined,
          location_name: formData.location_name.trim(),
          location_url: formData.location_url.trim() || undefined,
          description: formData.description.trim(),
          speakers: cleanSpeakers,
          price: Number(formData.price) || 0,
          quota: Number(formData.quota) || undefined,
          registration_url: formData.registration_url.trim() || undefined,
          banner_url: formData.banner_url.trim() || undefined,
          is_published: formData.is_published,
          certificate_provided: formData.certificate_provided,
          order_index: Number(formData.order_index) || 1,
        });
        setAlertSuccess(`Agenda "${formData.title}" berhasil diperbarui.`);
      } else {
        await addEvent({
          title: formData.title.trim(),
          slug,
          type: formData.type,
          format: formData.format,
          start_time: formData.start_time,
          end_time: formData.end_time || undefined,
          location_name: formData.location_name.trim(),
          location_url: formData.location_url.trim() || undefined,
          description: formData.description.trim(),
          speakers: cleanSpeakers,
          price: Number(formData.price) || 0,
          quota: Number(formData.quota) || undefined,
          registration_url: formData.registration_url.trim() || undefined,
          banner_url: formData.banner_url.trim() || undefined,
          is_published: formData.is_published,
          certificate_provided: formData.certificate_provided,
          order_index: Number(formData.order_index) || events.length + 1,
        });
        setAlertSuccess(`Agenda baru "${formData.title}" berhasil ditambahkan.`);
      }

      setDrawerOpen(false);
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Gagal menyimpan agenda event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await deleteEvent(deleteConfirmTarget.id);
      setAlertSuccess(`Agenda "${deleteConfirmTarget.title}" berhasil dihapus.`);
      setDeleteConfirmTarget(null);
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch {
      setDrawerError('Gagal menghapus agenda event.');
    }
  };

  const formatEventDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <CalendarStar size={22} weight="duotone" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-bricolage)] text-foreground tracking-tight">
                Agenda &amp; Seminar Nasional
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Kelola agenda non-kompetisi seperti Seminar Nasional, Webinar Teknologi, Workshop, dan Malam Penganugerahan (Awarding Night).
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openCreateDrawer}
            leftIcon={<Plus size={18} weight="bold" />}
          >
            Tambah Agenda Baru
          </Button>
        </div>

        {/* ── Feedback Alert ── */}
        {alertSuccess && (
          <Alert variant="default" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
            <AlertTitle>Operasi Berhasil</AlertTitle>
            <AlertDescription>{alertSuccess}</AlertDescription>
          </Alert>
        )}

        {/* ── Statistik Ringkas ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Agenda
                </p>
                <p className="text-2xl font-black font-[family-name:var(--font-jetbrains)] text-foreground mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CalendarStar size={22} weight="duotone" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Diterbitkan (Aktif)
                </p>
                <p className="text-2xl font-black font-[family-name:var(--font-jetbrains)] text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.published}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <GraduationCap size={22} weight="duotone" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sesi Daring / Hybrid
                </p>
                <p className="text-2xl font-black font-[family-name:var(--font-jetbrains)] text-sky-600 dark:text-sky-400 mt-1">
                  {stats.webinars}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <VideoCamera size={22} weight="duotone" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Pendaftar
                </p>
                <p className="text-2xl font-black font-[family-name:var(--font-jetbrains)] text-amber-600 dark:text-amber-400 mt-1">
                  {stats.totalRegistrants}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Ticket size={22} weight="duotone" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Search & Filter Tabs ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Semua Agenda' },
              { id: 'seminar', label: 'Seminar' },
              { id: 'webinar', label: 'Webinar' },
              { id: 'workshop', label: 'Workshop' },
              { id: 'ceremony', label: 'Ceremony' },
            ].map((tab) => {
              const isActive = typeFilter === tab.id;
              const count = tab.id === 'all' ? events.length : events.filter((e) => e.type === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id as 'all' | EventType)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[36px] cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari judul atau pembicara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* ── Daftar Kartu Event ── */}
        {filteredEvents.length === 0 ? (
          <EmptyState
            title="Tidak ada agenda yang cocok"
            description="Coba ubah kata kunci pencarian atau pilih kategori agenda lain."
            action={
              <Button variant="primary" size="sm" onClick={openCreateDrawer}>
                Tambah Agenda Baru
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((item) => {
              const meta = EVENT_TYPE_MAP[item.type] || EVENT_TYPE_MAP.seminar;
              const formatInfo = FORMAT_MAP[item.format] || FORMAT_MAP.offline;
              const FormatIcon = formatInfo.icon;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 bg-card transition-all flex flex-col justify-between ${
                    item.is_published
                      ? 'border-border hover:border-primary/50 shadow-sm hover:shadow'
                      : 'border-border/60 bg-muted/20 opacity-80'
                  }`}
                >
                  <div>
                    {/* Header baris atas */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground border border-border">
                          <FormatIcon size={12} weight="bold" />
                          <span>{formatInfo.label}</span>
                        </span>
                      </div>

                      {/* Status Aktif Switcher */}
                      <button
                        type="button"
                        onClick={() => toggleEventPublished(item.id, !item.is_published)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                          item.is_published
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                        }`}
                        title="Klik untuk mengubah status publikasi"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.is_published ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        <span>{item.is_published ? 'Publik' : 'Draft'}</span>
                      </button>
                    </div>

                    <h3 className="font-[family-name:var(--font-bricolage)] font-bold text-base sm:text-lg text-foreground leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Metadata Waktu & Lokasi */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-primary shrink-0" weight="bold" />
                        <span>{formatEventDate(item.start_time)} WIB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-primary shrink-0" weight="bold" />
                        <span className="truncate">{item.location_name}</span>
                      </div>
                    </div>

                    {/* Speakers Section */}
                    {item.speakers && item.speakers.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/70">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Narasumber / Pemateri:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.speakers.map((sp, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs"
                            >
                              <User size={13} className="text-primary" />
                              <span className="font-semibold text-foreground">{sp.name}</span>
                              {sp.organization && (
                                <span className="text-[11px] text-muted-foreground font-normal">
                                  ({sp.organization})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Baris Bawah: Harga, Pendaftar, & Actions */}
                  <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-xs font-extrabold text-foreground">
                        {item.price === 0 ? 'Gratis' : formatCurrency(item.price)}
                      </span>
                      <span className="text-muted-foreground ml-2 text-[11px]">
                        · {item.registered_count} / {item.quota || '∞'} peserta
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditDrawer(item)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        title="Edit Agenda"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTarget(item)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 border border-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        title="Hapus Agenda"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Drawer Form Tambah / Edit Event ── */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={editingId ? 'Edit Agenda Acara' : 'Tambah Agenda Seminar / Webinar'}
          description="Atur informasi narasumber, format online/offline, jadwal, dan link pendaftaran."
          size="lg"
        >
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
            <DrawerContent className="space-y-5 p-5 sm:p-6 overflow-y-auto">
              {drawerError && (
                <Alert variant="destructive">
                  <AlertTitle>Kesalahan Formulir</AlertTitle>
                  <AlertDescription>{drawerError}</AlertDescription>
                </Alert>
              )}

              {/* Bagian 1: Informasi Utama */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/70">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1. Informasi Dasar Acara
                  </h4>
                </div>

                {/* Judul Event */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Judul Agenda Acara <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="misal: Seminar Nasional AI & Keamanan Siber 2026"
                  />
                </div>

                {/* Tipe & Format */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Jenis Agenda <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
                    >
                      <option value="seminar">Seminar Nasional</option>
                      <option value="webinar">Webinar Online</option>
                      <option value="workshop">Hands-on Workshop</option>
                      <option value="ceremony">Ceremony & Penutupan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Format Pelaksanaan <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value as EventFormat })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
                    >
                      <option value="hybrid">Hybrid (Daring & Luring)</option>
                      <option value="offline">Luring di Kampus UST</option>
                      <option value="online">Daring (Zoom / Streaming)</option>
                    </select>
                  </div>
                </div>

                {/* Jadwal Mulai & Selesai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Waktu Mulai <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Waktu Selesai (Opsional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Lokasi, Biaya & Pendaftaran */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/70">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    2. Lokasi, Biaya &amp; Kuota
                  </h4>
                </div>

                {/* Lokasi & Tautan Maps/Stream */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Nama Lokasi / Ruang <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={formData.location_name}
                      onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                      placeholder="misal: Auditorium Ki Hadjar Dewantara UST"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Tautan Lokasi / URL Zoom (Opsional)
                    </label>
                    <Input
                      type="url"
                      value={formData.location_url}
                      onChange={(e) => setFormData({ ...formData, location_url: e.target.value })}
                      placeholder="https://maps.app.goo.gl/... atau https://zoom.us/..."
                    />
                  </div>
                </div>

                {/* Biaya, Kuota, Urutan Tampil */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Biaya Registrasi (IDR)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="0 = Gratis"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Kapasitas / Kuota
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.quota}
                      onChange={(e) => setFormData({ ...formData, quota: Number(e.target.value) })}
                      placeholder="misal: 250"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Urutan Tampil
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Tautan Pendaftaran Eksternal */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Tautan Formulir Pendaftaran / Registrasi (Opsional)
                  </label>
                  <Input
                    type="url"
                    value={formData.registration_url}
                    onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                    placeholder="https://bit.ly/Pendaftaran-Semnas atau tautan Google Form"
                  />
                </div>
              </div>

              {/* Bagian 3: Pembicara & Deskripsi */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      3. Narasumber &amp; Ringkasan Materi
                    </h4>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSpeakerRow}
                    className="text-xs h-7 px-2.5 rounded-lg"
                  >
                    + Tambah Pembicara
                  </Button>
                </div>

                {/* Narasumber Dinamis */}
                <div className="space-y-2.5">
                  {formData.speakers.map((sp, idx) => (
                    <div key={idx} className="flex items-start sm:items-center gap-2 bg-muted/40 p-2.5 rounded-xl border border-border">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Nama Lengkap & Gelar *"
                          value={sp.name}
                          onChange={(e) => handleSpeakerChange(idx, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Jabatan / Peran"
                          value={sp.role_title}
                          onChange={(e) => handleSpeakerChange(idx, 'role_title', e.target.value)}
                        />
                        <Input
                          placeholder="Instansi / Perusahaan"
                          value={sp.organization}
                          onChange={(e) => handleSpeakerChange(idx, 'organization', e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpeakerRow(idx)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer shrink-0 mt-1 sm:mt-0"
                        title="Hapus Pembicara"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Deskripsi &amp; Ringkasan Materi
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Uraikan topik pembahasan, target audiens, dan fasilitas yang didapatkan..."
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                </div>
              </div>

              {/* Bagian 4: Pengaturan Tambahan & Publikasi */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/70">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    4. Sertifikat &amp; Publikasi
                  </h4>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border cursor-pointer hover:bg-muted/60 transition-colors">
                  <input
                    type="checkbox"
                    id="cert_provided"
                    checked={formData.certificate_provided}
                    onChange={(e) => setFormData({ ...formData, certificate_provided: e.target.checked })}
                    className="w-4 h-4 rounded text-primary bg-background border-border focus:ring-primary mt-0.5"
                  />
                  <div className="text-xs select-none">
                    <span className="font-bold text-foreground block">
                      Menyediakan E-Sertifikat Nasional
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Peserta yang hadir akan mendapatkan e-sertifikat berpredikat resmi dari panitia
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border cursor-pointer hover:bg-muted/60 transition-colors">
                  <input
                    type="checkbox"
                    id="is_pub"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 rounded text-primary bg-background border-border focus:ring-primary mt-0.5"
                  />
                  <div className="text-xs select-none">
                    <span className="font-bold text-foreground block">
                      Publikasikan Agenda ke Publik Sekarang
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Jika aktif, agenda akan langsung tampil di landing page, navbar, dan kalender acara
                    </span>
                  </div>
                </label>
              </div>
            </DrawerContent>

            <DrawerFooter className="p-4 sm:p-5 border-t border-border flex flex-row items-center justify-end gap-3 bg-card shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDrawerOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan Agenda'}
              </Button>
            </DrawerFooter>
          </form>
        </Drawer>

        {/* ── Dialog Konfirmasi Hapus ── */}
        <ConfirmDialog
          isOpen={Boolean(deleteConfirmTarget)}
          onClose={() => setDeleteConfirmTarget(null)}
          onConfirm={handleDelete}
          title="Hapus Agenda Acara?"
          description={`Apakah kamu yakin ingin menghapus agenda "${deleteConfirmTarget?.title}"?`}
          confirmText="Ya, Hapus Agenda"
          cancelText="Batal"
          variant="destructive"
        />
      </div>
    </DashboardLayout>
  );
}
