'use client';

import React, { useState, useMemo, useRef } from 'react';
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
import { PdfViewerModal } from '@/components/guidebook/PdfViewerModal';
import { useAppStore } from '@/lib/store';
import { Guidebook, GuidebookCategory } from '@/lib/types';
import { MOCK_GUIDEBOOKS } from '@/lib/mock-data';
import {
  BookOpen,
  Plus,
  PencilSimple,
  Trash,
  DownloadSimple,
  UploadSimple,
  LinkSimple,
  FilePdf,
  Eye,
  CheckCircle,
  WarningCircle,
  MagnifyingGlass,
  Check,
} from '@phosphor-icons/react';

interface GuidebookFormData {
  title: string;
  category: GuidebookCategory;
  file_url: string;
  file_name: string;
  file_size_bytes: number;
  version: string;
  description: string;
  release_notes: string;
  is_published: boolean;
}

const defaultFormData: GuidebookFormData = {
  title: '',
  category: 'general',
  file_url: '/docs/guidebook-permifest-2026.pdf',
  file_name: 'Guidebook_Permifest_Deforkafest_2026.pdf',
  file_size_bytes: 3500000,
  version: 'v1.0',
  description: '',
  release_notes: '',
  is_published: true,
};

const CATEGORY_MAP: Record<GuidebookCategory, { label: string; badgeBg: string; textColor: string }> = {
  general: {
    label: 'Panduan Umum',
    badgeBg: 'bg-primary/10 border-primary/25',
    textColor: 'text-primary',
  },
  esai: {
    label: 'Esai Cyber Security',
    badgeBg: 'bg-amber-500/10 border-amber-500/25',
    textColor: 'text-amber-700 dark:text-amber-400',
  },
  uiux: {
    label: 'UI/UX Design',
    badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/25',
    textColor: 'text-fuchsia-700 dark:text-fuchsia-400',
  },
  it_system_arch: {
    label: 'IT System Architecture',
    badgeBg: 'bg-sky-500/10 border-sky-500/25',
    textColor: 'text-sky-700 dark:text-sky-400',
  },
  pes: {
    label: 'PES 2026 e-Football',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/25',
    textColor: 'text-emerald-700 dark:text-emerald-400',
  },
  ml: {
    label: 'Mobile Legends: Bang Bang',
    badgeBg: 'bg-orange-500/10 border-orange-500/25',
    textColor: 'text-orange-700 dark:text-orange-400',
  },
};

const CATEGORY_FILTER_TABS: { id: 'all' | GuidebookCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'general', label: 'Panduan Umum' },
  { id: 'esai', label: 'Esai Cyber Security' },
  { id: 'uiux', label: 'UI/UX' },
  { id: 'it_system_arch', label: 'ITSA' },
  { id: 'pes', label: 'PES 2026' },
  { id: 'ml', label: 'MLBB' },
];

export default function AdminGuidebookPage() {
  const store = useAppStore();
  const rawGuidebooks = store?.guidebooks;
  const guidebooks = Array.isArray(rawGuidebooks) ? rawGuidebooks : MOCK_GUIDEBOOKS;
  const { addGuidebook, updateGuidebook, deleteGuidebook, toggleGuidebookPublished } = store;

  const [categoryFilter, setCategoryFilter] = useState<'all' | GuidebookCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GuidebookFormData>(defaultFormData);
  const [fileInputMode, setFileInputMode] = useState<'upload' | 'link'>('upload');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<Guidebook | null>(null);
  const [previewGuidebook, setPreviewGuidebook] = useState<Guidebook | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter daftar guidebook
  const filteredGuidebooks = useMemo(() => {
    return guidebooks.filter((g) => {
      const matchCategory = categoryFilter === 'all' || g.category === categoryFilter;
      const matchSearch =
        searchQuery === '' ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [guidebooks, categoryFilter, searchQuery]);

  // Statistik ringkas
  const stats = useMemo(() => {
    return {
      total: guidebooks.length,
      published: guidebooks.filter((g) => g.is_published).length,
      draft: guidebooks.filter((g) => !g.is_published).length,
      categoriesCount: new Set(guidebooks.map((g) => g.category)).size,
    };
  }, [guidebooks]);

  const openCreateDrawer = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setFileInputMode('upload');
    setDrawerError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (guidebook: Guidebook) => {
    setEditingId(guidebook.id);
    setFormData({
      title: guidebook.title,
      category: guidebook.category,
      file_url: guidebook.file_url,
      file_name: guidebook.file_name,
      file_size_bytes: guidebook.file_size_bytes || 3000000,
      version: guidebook.version,
      description: guidebook.description,
      release_notes: guidebook.release_notes || '',
      is_published: guidebook.is_published,
    });
    setFileInputMode(guidebook.file_url.startsWith('data:') || guidebook.file_url.startsWith('/') ? 'upload' : 'link');
    setDrawerError(null);
    setDrawerOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setDrawerError('Berkas harus berformat PDF (.pdf)');
      return;
    }

    const maxSizeBytes = 15 * 1024 * 1024; // 15 MB
    if (file.size > maxSizeBytes) {
      setDrawerError('Ukuran berkas melebihi batas maksimal 15 MB');
      return;
    }

    setDrawerError(null);

    // Baca berkas sebagai data URL lokal untuk pratinjau instan
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        file_url: dataUrl,
        file_name: file.name,
        file_size_bytes: file.size,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError(null);

    if (!formData.title.trim()) {
      setDrawerError('Judul buku panduan wajib diisi');
      return;
    }
    if (!formData.version.trim()) {
      setDrawerError('Nomor versi (misal: v1.0, v2.1) wajib diisi');
      return;
    }
    if (!formData.file_url.trim()) {
      setDrawerError('Berkas PDF atau tautan dokumen wajib disediakan');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateGuidebook(editingId, {
          title: formData.title.trim(),
          category: formData.category,
          file_url: formData.file_url.trim(),
          file_name: formData.file_name.trim() || `${formData.title.replace(/\s+/g, '_')}.pdf`,
          file_size_bytes: formData.file_size_bytes,
          version: formData.version.trim(),
          description: formData.description.trim(),
          release_notes: formData.release_notes.trim(),
          is_published: formData.is_published,
        });
        setAlertSuccess(`Buku panduan "${formData.title}" berhasil diperbarui!`);
      } else {
        await addGuidebook({
          title: formData.title.trim(),
          category: formData.category,
          file_url: formData.file_url.trim(),
          file_name: formData.file_name.trim() || `${formData.title.replace(/\s+/g, '_')}.pdf`,
          file_size_bytes: formData.file_size_bytes,
          version: formData.version.trim(),
          description: formData.description.trim(),
          release_notes: formData.release_notes.trim(),
          is_published: formData.is_published,
        });
        setAlertSuccess(`Buku panduan baru "${formData.title}" berhasil ditambahkan!`);
      }

      setDrawerOpen(false);
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Terjadi kegagalan saat menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await deleteGuidebook(deleteConfirmTarget.id);
      setAlertSuccess(`Guidebook "${deleteConfirmTarget.title}" berhasil dihapus.`);
      setDeleteConfirmTarget(null);
      setTimeout(() => setAlertSuccess(null), 4000);
    } catch {
      setDrawerError('Gagal menghapus buku panduan.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <BookOpen size={22} weight="duotone" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-[family-name:var(--font-bricolage)] text-foreground tracking-tight">
                Manajemen Guidebook
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Kelola dokumen PDF panduan teknis umum dan rulebook per cabang lomba untuk dibaca online atau diunduh peserta.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openCreateDrawer}
            leftIcon={<Plus size={18} weight="bold" />}
          >
            Unggah Guidebook
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
                  Total Guidebook
                </p>
                <p className="text-2xl font-black font-[family-name:var(--font-jetbrains)] text-foreground mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FilePdf size={22} weight="duotone" />
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
                <Check size={22} weight="bold" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Draft / Diarsipkan
                </p>
                <p className="text-2xl font-black font-[family-name:var(--font-jetbrains)] text-amber-600 dark:text-amber-400 mt-1">
                  {stats.draft}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <WarningCircle size={22} weight="duotone" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cakupan Kategori
                </p>
                <p className="text-2xl font-black font-[family-name:var(--font-jetbrains)] text-sky-600 dark:text-sky-400 mt-1">
                  {stats.categoriesCount} / 6
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <BookOpen size={22} weight="duotone" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Search & Filter Tabs ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border">
          {/* Tab Filter Kategori */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORY_FILTER_TABS.map((tab) => {
              const count = tab.id === 'all'
                ? guidebooks.length
                : guidebooks.filter((g) => g.category === tab.id).length;
              const isActive = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 min-h-[36px] cursor-pointer ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  {tab.label} {tab.id === 'all' ? `(${count})` : count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari judul atau versi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* ── Daftar Kartu Guidebook ── */}
        {filteredGuidebooks.length === 0 ? (
          <EmptyState
            title="Tidak ada buku panduan yang cocok"
            description="Coba ubah kata kunci pencarian atau pilih tab kategori lain."
            action={
              <Button variant="primary" size="sm" onClick={openCreateDrawer}>
                Tambah Guidebook Baru
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuidebooks.map((item) => {
              const meta = CATEGORY_MAP[item.category] || CATEGORY_MAP.general;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 bg-card transition-all flex flex-col justify-between ${item.is_published
                      ? 'border-border hover:border-primary/50 shadow-sm hover:shadow'
                      : 'border-border/60 bg-muted/20 opacity-80'
                    }`}
                >
                  <div>
                    {/* Header baris atas */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${meta.badgeBg} ${meta.textColor}`}
                        >
                          {meta.label}
                        </span>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-muted text-foreground border border-border select-none">
                          {item.version}
                        </span>
                      </div>

                      {/* Status Aktif Switcher */}
                      <button
                        type="button"
                        onClick={() => toggleGuidebookPublished(item.id, !item.is_published)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${item.is_published
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                          }`}
                        title="Klik untuk mengubah status publikasi"
                      >
                        <span>{item.is_published ? 'Diterbitkan' : 'Draft / Arsip'}</span>
                      </button>
                    </div>

                    <h3 className="font-[family-name:var(--font-bricolage)] font-bold text-base sm:text-lg text-foreground leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed mt-2 line-clamp-2">
                      {item.description}
                    </p>

                    {item.release_notes && (
                      <div className="mt-3 p-2.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground leading-relaxed">
                        <span className="font-bold text-foreground">Catatan Rilis:</span> {item.release_notes}
                      </div>
                    )}
                  </div>

                  {/* Footer Baris Bawah: Metadata & Actions */}
                  <div className="mt-5 pt-3.5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span>{formatFileSize(item.file_size_bytes)}</span>
                      <span>·</span>
                      <span className="truncate max-w-[150px]" title={item.file_name}>
                        {item.file_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Baca Online (In-Browser Viewer) */}
                      <button
                        type="button"
                        onClick={() => setPreviewGuidebook(item)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-1.5 min-h-[36px] cursor-pointer"
                        title="Baca Online di Viewer"
                      >
                        <Eye size={15} weight="bold" />
                        <span>Pratinjau</span>
                      </button>

                      {/* Unduh */}
                      <a
                        href={item.file_url}
                        download={item.file_name}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        title="Unduh Berkas PDF"
                      >
                        <DownloadSimple size={16} weight="bold" />
                      </a>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => openEditDrawer(item)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        title="Edit Metadata & File"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </button>

                      {/* Hapus */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmTarget(item)}
                        className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 border border-border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        title="Hapus Guidebook"
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

        {/* ── Drawer Form Tambah / Edit ── */}
        <Drawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={editingId ? 'Edit Buku Panduan' : 'Unggah Guidebook'}
          description="Pastikan berkas PDF memiliki teks yang jelas dan rubrik penilaian mutakhir."
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

              {/* Bagian 1: Informasi Dokumen */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/70">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    1. Identitas Buku Panduan
                  </h4>
                </div>

                {/* Judul Guidebook */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Judul Dokumen Guidebook <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="misal: Buku Panduan Teknis Umum Permifest x Deforkafest 2026"
                  />
                </div>

                {/* Baris 2: Kategori & Versi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Kategori / Cabang Lomba <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as GuidebookCategory })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
                    >
                      <option value="general">Panduan Umum Perlombaan</option>
                      <option value="esai">Esai Ilmiah: Cyber Security</option>
                      <option value="uiux">UI/UX Design Competition</option>
                      <option value="it_system_arch">IT System Architecture</option>
                      <option value="pes">PES 2026 e-Football</option>
                      <option value="ml">Mobile Legends: Bang Bang</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Nomor Versi Dokumen <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="misal: v2.1"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Sumber Berkas PDF */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      2. Berkas Dokumen PDF
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setFileInputMode('upload')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${fileInputMode === 'upload'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <UploadSimple size={12} weight="bold" />
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileInputMode('link')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${fileInputMode === 'link'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <LinkSimple size={12} weight="bold" />
                      Tautan URL
                    </button>
                  </div>
                </div>

                {fileInputMode === 'upload' ? (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="guidebook_pdf_file_input"
                    />
                    <label
                      htmlFor="guidebook_pdf_file_input"
                      className="p-5 border-2 border-dashed border-border hover:border-primary rounded-2xl bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 group-hover:scale-105 transition-transform">
                        <UploadSimple size={24} weight="bold" />
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        Pilih atau seret berkas PDF ke sini
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Format: .pdf (Maksimal 15 MB)
                      </p>
                    </label>

                    {formData.file_name && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FilePdf size={18} className="text-primary shrink-0" weight="fill" />
                          <span className="truncate text-foreground font-mono">{formData.file_name}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                          {formatFileSize(formData.file_size_bytes)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Tautan URL Berkas PDF
                      </label>
                      <Input
                        type="url"
                        value={formData.file_url}
                        onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                        placeholder="https://example.com/guidebook.pdf atau /docs/guidebook.pdf"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Nama File Saat Diunduh
                      </label>
                      <Input
                        type="text"
                        value={formData.file_name}
                        onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                        placeholder="Guidebook_Permifest_2026.pdf"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bagian 3: Ringkasan & Catatan */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/70">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    3. Ringkasan &amp; Catatan Versi
                  </h4>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Ringkasan Isi Panduan
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ringkasan poin penting mengenai buku panduan ini..."
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                </div>

                {/* Catatan Rilis */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Catatan Rilis / Perubahan (Opsional)
                  </label>
                  <Input
                    value={formData.release_notes}
                    onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                    placeholder="misal: Pembaruan rubrik penilaian babak final dan penegasan format sitasi"
                  />
                </div>
              </div>

              {/* Bagian 4: Status Publikasi */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border/70">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    4. Status Publikasi
                  </h4>
                </div>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border cursor-pointer hover:bg-muted/60 transition-colors">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 rounded text-primary bg-background border-border focus:ring-primary mt-0.5"
                  />
                  <div className="text-xs select-none">
                    <span className="font-bold text-foreground block">
                      Terbitkan Langsung ke Publik
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      Jika aktif, guidebook dapat dibaca online via viewer dan diunduh langsung oleh peserta
                    </span>
                  </div>
                </label>
              </div>
            </DrawerContent>

            {/* Footer Drawer */}
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
                {submitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan Guidebook'}
              </Button>
            </DrawerFooter>
          </form>
        </Drawer>

        {/* ── Modal Pratinjau PDF Online ── */}
        <PdfViewerModal
          guidebook={previewGuidebook}
          isOpen={Boolean(previewGuidebook)}
          onClose={() => setPreviewGuidebook(null)}
        />

        {/* ── Dialog Konfirmasi Hapus ── */}
        <ConfirmDialog
          isOpen={Boolean(deleteConfirmTarget)}
          onClose={() => setDeleteConfirmTarget(null)}
          onConfirm={handleDelete}
          title="Hapus Buku Panduan?"
          description={`Apakah kamu yakin ingin menghapus "${deleteConfirmTarget?.title}" (${deleteConfirmTarget?.version})? Berkas ini tidak akan dapat diakses lagi oleh peserta.`}
          confirmText="Ya, Hapus Dokumen"
          cancelText="Batal"
          variant="destructive"
        />
      </div>
    </DashboardLayout>
  );
}
