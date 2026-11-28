'use client';

import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
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
import { Partner, PartnerCategory } from '@/lib/types';
import {
  Handshake,
  Plus,
  PencilSimple,
  Trash,
  ArrowSquareOut,
  UploadSimple,
  LinkSimple,
} from '@phosphor-icons/react';

interface PartnerFormData {
  name: string;
  category: PartnerCategory;
  logo_url: string;
  website_url: string;
  description: string;
  tier: 'utama' | 'platinum' | 'gold' | 'silver' | 'partner';
  order_index: number;
  is_active: boolean;
}

const CATEGORY_FILTERS: { id: 'all' | PartnerCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'organizer', label: 'Penyelenggara' },
  { id: 'kabinet', label: 'Kabinet Permi' },
  { id: 'co_host', label: 'Co-Host' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'media_partner', label: 'Media Partner' },
];

const defaultFormData: PartnerFormData = {
  name: '',
  category: 'organizer',
  logo_url: '/brand/permikomnas.svg',
  website_url: '',
  description: '',
  tier: 'utama',
  order_index: 1,
  is_active: true,
};

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  organizer: 'Penyelenggara Utama',
  kabinet: 'Kabinet Wilayah',
  co_host: 'Co-Host Deforka',
  sponsor: 'Sponsor Komersial',
  media_partner: 'Media Partner',
};

export default function AdminMitraPage() {
  const { partners, addPartner, updatePartner, deletePartner, togglePartnerActive } = useAppStore();

  const [categoryFilter, setCategoryFilter] = useState<'all' | PartnerCategory>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>(defaultFormData);
  const [logoInputMode, setLogoInputMode] = useState<'url' | 'file'>('url');
  const [deleteConfirmPartner, setDeleteConfirmPartner] = useState<Partner | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter daftar mitra
  const filteredPartners = useMemo(() => {
    return partners
      .filter((p) => {
        if (categoryFilter === 'all') return true;
        return p.category === categoryFilter;
      })
      .sort((a, b) => a.order_index - b.order_index);
  }, [partners, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: partners.length,
      active: partners.filter((p) => p.is_active).length,
      organizers: partners.filter(
        (p) => p.category === 'organizer' || p.category === 'kabinet' || p.category === 'co_host'
      ).length,
      sponsors: partners.filter((p) => p.category === 'sponsor' || p.category === 'media_partner').length,
    };
  }, [partners]);

  const openCreateDrawer = () => {
    setEditingPartnerId(null);
    setFormData({
      ...defaultFormData,
      order_index: partners.length + 1,
    });
    setLogoInputMode('url');
    setDrawerError(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (partner: Partner) => {
    setEditingPartnerId(partner.id);
    setFormData({
      name: partner.name,
      category: partner.category,
      logo_url: partner.logo_url,
      website_url: partner.website_url || '',
      description: partner.description || '',
      tier: partner.tier || 'utama',
      order_index: partner.order_index,
      is_active: partner.is_active,
    });
    setLogoInputMode(partner.logo_url.startsWith('data:') ? 'file' : 'url');
    setDrawerError(null);
    setDrawerOpen(true);
  };

  // Handler Upload File Gambar Logo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDrawerError('Harap unggah berkas gambar (PNG, SVG, JPG, atau WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setDrawerError('Ukuran berkas logo maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, logo_url: result }));
        setDrawerError(null);
      }
    };
    reader.onerror = () => {
      setDrawerError('Gagal membaca berkas gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setDrawerError(null);

    try {
      if (!formData.name.trim()) {
        throw new Error('Nama mitra / instansi wajib diisi.');
      }
      if (!formData.logo_url.trim()) {
        throw new Error('Logo mitra wajib diisi (berupa URL atau unggahan file).');
      }

      if (editingPartnerId) {
        await updatePartner(editingPartnerId, {
          name: formData.name.trim(),
          category: formData.category,
          logo_url: formData.logo_url.trim(),
          website_url: formData.website_url.trim() || undefined,
          description: formData.description.trim() || undefined,
          tier: formData.tier,
          order_index: Number(formData.order_index) || 1,
          is_active: formData.is_active,
        });
        setAlertSuccess(`Data mitra "${formData.name}" berhasil diperbarui!`);
      } else {
        await addPartner({
          name: formData.name.trim(),
          category: formData.category,
          logo_url: formData.logo_url.trim(),
          website_url: formData.website_url.trim() || undefined,
          description: formData.description.trim() || undefined,
          tier: formData.tier,
          order_index: Number(formData.order_index) || 1,
          is_active: formData.is_active,
        });
        setAlertSuccess(`Mitra baru "${formData.name}" berhasil ditambahkan!`);
      }

      setDrawerOpen(false);
    } catch (err) {
      setDrawerError(err instanceof Error ? err.message : 'Gagal menyimpan data mitra.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmPartner) return;
    try {
      await deletePartner(deleteConfirmPartner.id);
      setAlertSuccess(`Mitra "${deleteConfirmPartner.name}" berhasil dihapus.`);
    } catch {
      // Ignored
    } finally {
      setDeleteConfirmPartner(null);
    }
  };

  return (
    <DashboardLayout
      title="Manajemen Mitra &amp; Sponsor"
      subtitle="Kelola logo Permikomnas DIY, Kabinet Nawasena, Deforkafest, IMPSI UST, serta sponsor resmi event."
    >
      <div className="space-y-6">
        {alertSuccess && (
          <Alert variant="success" onClose={() => setAlertSuccess(null)}>
            <AlertTitle>Operasi Berhasil</AlertTitle>
            <AlertDescription>{alertSuccess}</AlertDescription>
          </Alert>
        )}

        {/* ── KPI Ringkasan ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Mitra
              </span>
              <span className="text-2xl font-black text-foreground font-[family-name:var(--font-jetbrains)] mt-1 block">
                {stats.total}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Mitra Aktif
              </span>
              <span className="text-2xl font-black text-emerald-400 font-[family-name:var(--font-jetbrains)] mt-1 block">
                {stats.active}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Penyelenggara
              </span>
              <span className="text-2xl font-black text-sky-400 font-[family-name:var(--font-jetbrains)] mt-1 block">
                {stats.organizers}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Sponsor &amp; Media
              </span>
              <span className="text-2xl font-black text-amber-400 font-[family-name:var(--font-jetbrains)] mt-1 block">
                {stats.sponsors}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* ── Action & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Tab Filter */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-card border border-border text-xs">
            {CATEGORY_FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${categoryFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openCreateDrawer}
          >
            <Plus size={16} weight="bold" />
            Tambah Mitra Baru
          </Button>
        </div>

        {/* ── Grid Mitra Bersih & Bernapas (Anti-Clutter) ── */}
        {filteredPartners.length === 0 ? (
          <EmptyState
            icon={<Handshake className="w-8 h-8 text-primary" weight="duotone" />}
            title="Belum Ada Data Mitra"
            description="Tidak ada entitas mitra atau sponsor pada filter kategori yang dipilih."
            action={
              <Button type="button" variant="primary" size="sm" onClick={openCreateDrawer}>
                Tambah Mitra Pertama
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.map((item) => (
              <Card
                key={item.id}
                className={`border transition-all hover:border-primary/50 ${item.is_active
                  ? 'border-border bg-card'
                  : 'border-border/40 bg-card/40 opacity-60'
                  }`}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div>
                    {/* Header: Status Indikator Halus & Order Index */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 pb-2 border-b border-border/50">
                      <span className="font-semibold text-[11px] text-muted-foreground tracking-wide">
                        {CATEGORY_LABELS[item.category] || 'Mitra'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePartnerActive(item.id)}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${item.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-zinc-700/20 text-zinc-400 hover:bg-zinc-700/30'
                          }`}
                      >
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>

                    {/* Logo & Info Utama: Tampilan Rapi */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-14 rounded-xl bg-background border border-border flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-sm">
                        {item.logo_url.startsWith('data:') || item.logo_url.startsWith('http') || item.logo_url.startsWith('/') ? (
                          <Image
                            src={item.logo_url}
                            alt={item.name}
                            width={64}
                            height={56}
                            unoptimized
                            style={{ width: 'auto', height: 'auto' }}
                            className="max-h-10 max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs font-black text-primary">
                            {item.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-sm text-foreground truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>Urutan #{item.order_index}</span>
                          {item.tier && (
                            <>
                              <span>·</span>
                              <span className="capitalize text-primary font-medium">{item.tier}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.description && (
                      <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar Bersih */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <div>
                      {item.website_url ? (
                        <a
                          href={item.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                        >
                          <ArrowSquareOut size={13} weight="bold" />
                          <span>Website</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 italic">Tanpa tautan</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDrawer(item)}
                        className="text-xs h-7 px-2"
                      >
                        <PencilSimple size={16} className="mr-1" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmPartner(item)}
                        className="text-xs h-7 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      >
                        <Trash size={16} className="mr-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Drawer Form Tambah / Edit Mitra ── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingPartnerId ? 'Ubah Informasi Mitra' : 'Tambah Mitra / Sponsor Baru'}
        description="Kelola profil instansi mitra, kategori, serta tautan atau upload file logo resmi."
      >
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <DrawerContent className="space-y-4 flex-1 overflow-y-auto">
            {drawerError && (
              <Alert variant="destructive">
                <AlertDescription>{drawerError}</AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Nama Mitra / Instansi <span className="text-rose-400">*</span>
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Kabinet Nawasena / Permikomnas DIY"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Kategori Entitas <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as PartnerCategory })}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="organizer">Penyelenggara Utama (Permikomnas/IMPSI)</option>
                  <option value="kabinet">Kabinet Nawasena</option>
                  <option value="co_host">Deforkafest (Co-Host)</option>
                  <option value="sponsor">Sponsor Komersial</option>
                  <option value="media_partner">Media Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Tier / Tingkatan Sponsor
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) => {
                    const tier = e.target.value;
                    if (
                      tier === 'utama' ||
                      tier === 'platinum' ||
                      tier === 'gold' ||
                      tier === 'silver' ||
                      tier === 'partner'
                    ) {
                      setFormData({ ...formData, tier });
                    }
                  }}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="utama">Utama / Penyelenggara</option>
                  <option value="platinum">Platinum Partner</option>
                  <option value="gold">Gold Partner</option>
                  <option value="silver">Silver Partner</option>
                  <option value="partner">Supporting Partner</option>
                </select>
              </div>
            </div>

            {/* ── Input Logo: Pilihan Link URL atau Upload File Langsung ── */}
            <div className="p-3.5 rounded-2xl bg-background border border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Logo Instansi / Brand <span className="text-rose-400">*</span>
                </label>

                {/* Tab Pemilih Mode: Link atau Upload */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-card border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('url')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${logoInputMode === 'url'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <LinkSimple size={12} weight="bold" />
                    Input Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('file')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition-colors ${logoInputMode === 'file'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <UploadSimple size={12} weight="bold" />
                    Upload File
                  </button>
                </div>
              </div>

              {logoInputMode === 'url' ? (
                <div>
                  <Input
                    type="text"
                    required={!formData.logo_url}
                    value={formData.logo_url.startsWith('data:') ? '' : formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="/brand/nawasena.svg atau URL HTTPS gambar"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Gunakan file path lokal seperti <code className="text-primary font-mono">/brand/nawasena.svg</code> atau tautan online langsung.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.svg,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="partner_logo_file_input"
                  />
                  <label
                    htmlFor="partner_logo_file_input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border hover:border-primary rounded-xl cursor-pointer bg-card/50 hover:bg-card transition-colors text-center"
                  >
                    <UploadSimple size={24} className="text-primary mb-1" />
                    <span className="text-xs font-bold text-foreground">
                      Pilih berkas logo dari perangkat
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Format SVG, PNG, JPG, WebP (maks. 2 MB)
                    </span>
                  </label>
                </div>
              )}

              {/* Preview Logo yang Terpasang */}
              {formData.logo_url && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[11px] text-muted-foreground">Preview:</span>
                  <div className="h-10 w-24 rounded-lg bg-card border border-border p-1.5 flex items-center justify-center overflow-hidden">
                    <Image
                      src={formData.logo_url}
                      alt="Preview logo"
                      width={96}
                      height={40}
                      unoptimized
                      style={{ width: 'auto', height: 'auto' }}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Tautan Website / Medsos
                </label>
                <Input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://instagram.com/permikomnas.diy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Urutan Tampil (Order Index)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 1 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Deskripsi Singkat Entitas
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Jelaskan peran instansi atau bentuk kerjasama..."
                className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active_checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <label htmlFor="is_active_checkbox" className="text-xs font-bold text-foreground cursor-pointer">
                Tampilkan di Halaman Utama (Status Aktif)
              </label>
            </div>
          </DrawerContent>

          <DrawerFooter className="p-4 sm:p-5 border-t border-border flex flex-row items-center justify-end gap-3 bg-card shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : editingPartnerId ? 'Simpan Perubahan' : 'Tambah Mitra'}
            </Button>
          </DrawerFooter>
        </form>
      </Drawer>

      {/* ── Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={!!deleteConfirmPartner}
        onClose={() => setDeleteConfirmPartner(null)}
        onConfirm={handleDelete}
        title="Hapus Data Mitra"
        description={`Apakah kamu yakin ingin menghapus data mitra "${deleteConfirmPartner?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Mitra"
      />
    </DashboardLayout>
  );
}