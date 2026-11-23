'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/modal';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { useAppStore } from '@/lib/store';
import { formatDateShort } from '@/lib/utils';
import { Submission } from '@/lib/types';
import { getFileDownloadUrl } from '@/lib/supabase/storage-client';
import { isSupabaseLive } from '@/lib/repositories';
import { getAllSubmissionsForAdminQuery } from '@/features/submissions/queries';
import {
  FileText,
  DownloadSimple,
  ArrowSquareOut,
  Trash,
  CheckCircle,
  Eye,
  Link as LinkIcon,
  Buildings,
  Copy,
  Clock,
  User,
} from '@phosphor-icons/react';

export default function AdminSubmissionPage() {
  const { submissions, deleteSubmission, competitions } = useAppStore();

  const [compFilter, setCompFilter] = useState('all');
  const [liveSubmissions, setLiveSubmissions] = useState<Submission[]>([]);
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<Submission | null>(null);
  const [previewSub, setPreviewSub] = useState<Submission | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openingFile, setOpeningFile] = useState(false);

  React.useEffect(() => {
    if (!isSupabaseLive()) return;
    getAllSubmissionsForAdminQuery()
      .then((rows) => {
        const mapped: Submission[] = rows.map((r) => ({
          id: r.id,
          registration_id: r.registration_id,
          registration: {
            id: r.registration_id,
            user_id: '',
            competition_id: '',
            competition: {
              id: '',
              name: r.competition_name || '',
              slug: r.competition_slug || '',
            } as unknown as NonNullable<Submission['registration']>['competition'],
            user: {
              id: '',
              full_name: r.participant_name || '',
              email: r.participant_email || '',
              role: 'peserta',
              email_verified: true,
            },
            status: 'verified',
            registered_at: r.submitted_at,
            form_data: {},
          },
          stage_id: r.stage_id,
          stage: {
            id: r.stage_id,
            competition_id: '',
            name: r.stage_name || '',
            slug: '',
            stage_order: 1,
            submission_open_at: '',
            submission_close_at: '',
            is_active: true,
          },
          file_name: r.original_filename || undefined,
          file_url: r.storage_path || undefined,
          link_url: r.link_url || undefined,
          version: r.version,
          is_latest: r.is_latest,
          notes: r.notes || undefined,
          submitted_at: r.submitted_at,
        }));
        setLiveSubmissions(mapped);
      })
      .catch((err) => {
        console.error('Failed to load live submissions:', err);
      });
  }, []);

  const currentSubmissions = isSupabaseLive() ? liveSubmissions : submissions;

  const filteredSubmissions = currentSubmissions.filter((s) => {
    if (compFilter === 'all') return true;
    return s.registration?.competition_id === compFilter;
  });

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmSub) return;
    await deleteSubmission(deleteConfirmSub.id);
    setAlertSuccess(`Berkas submission "${deleteConfirmSub.file_name || 'karya'}" telah dihapus.`);
    if (previewSub?.id === deleteConfirmSub.id) {
      setPreviewSub(null);
    }
    setDeleteConfirmSub(null);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenSubmissionFile = async (rawPathOrUrl: string) => {
    if (!rawPathOrUrl) return;
    setOpeningFile(true);
    try {
      if (rawPathOrUrl.startsWith('http://') || rawPathOrUrl.startsWith('https://')) {
        window.open(rawPathOrUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      const res = await getFileDownloadUrl('submissions', rawPathOrUrl, { expiresInSeconds: 1800 });
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        alert(res.error || 'Gagal mendapatkan akses unduh dokumen aman.');
      }
    } finally {
      setOpeningFile(false);
    }
  };

  const columns: Column<Submission & Record<string, unknown>>[] = [
    {
      key: 'file',
      header: 'Karya & Format',
      sortable: true,
      accessor: (s) => s.file_name || s.link_url || '',
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--accent)] text-[var(--primary)] shrink-0">
            {s.link_url ? <LinkIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <span>{s.file_name || (s.link_url ? 'Tautan Desain Figma' : 'Dokumen Karya')}</span>
              <Badge variant="primary" size="sm">v{s.version}</Badge>
            </div>
            {s.notes && (
              <p className="text-[11px] text-[var(--muted-foreground)] italic truncate max-w-xs" title={s.notes}>
                &quot;{s.notes}&quot;
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'peserta',
      header: 'Peserta & Instansi',
      sortable: true,
      accessor: (s) => s.registration?.user?.full_name || '',
      cell: (s) => (
        <div>
          <div className="font-semibold text-[var(--foreground)]">{s.registration?.user?.full_name}</div>
          <div className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1">
            <Buildings className="w-3 h-3" />
            <span>{s.registration?.user?.institution || '-'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'competition',
      header: 'Kompetisi',
      sortable: true,
      accessor: (s) => s.registration?.competition?.name || '',
      cell: (s) => <Badge variant="primary" size="sm">{s.registration?.competition?.name}</Badge>,
    },
    {
      key: 'submitted_at',
      header: 'Waktu Pengumpulan',
      sortable: true,
      cell: (s) => (
        <span className="font-mono text-xs text-[var(--muted-foreground)]">
          {formatDateShort(s.submitted_at)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Aksi Berkas',
      className: 'text-right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPreviewSub(s)}
            className="h-8 w-8 p-0 text-[var(--primary)] hover:bg-[var(--primary)]/10"
            title="Tinjau & Pratinjau Berkas Karya"
            aria-label="Pratinjau Karya"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {s.link_url ? (
            <a href={s.link_url} target="_blank" rel="noreferrer" title="Buka Tautan Desain Figma">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[var(--foreground)] hover:bg-[var(--accent)]" aria-label="Buka Tautan Figma">
                <ArrowSquareOut className="w-4 h-4" />
              </Button>
            </a>
          ) : s.file_url ? (
            <a href={s.file_url} target="_blank" rel="noreferrer" title="Unduh Berkas Dokumen">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[var(--foreground)] hover:bg-[var(--accent)]" aria-label="Unduh Berkas">
                <DownloadSimple className="w-4 h-4" />
              </Button>
            </a>
          ) : null}

          <Link href={`/dashboard/admin/penilaian?sub_id=${s.id}`} title="Penugasan & Penilaian Dewan Juri">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[var(--foreground)] hover:bg-[var(--accent)]" aria-label="Penilaian Juri">
              <CheckCircle className="w-4 h-4" weight="bold" />
            </Button>
          </Link>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteConfirmSub(s)}
            className="h-8 w-8 p-0 text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
            title="Hapus Berkas Karya"
            aria-label="Hapus Berkas Karya"
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Gudang Pengumpulan Karya (Submission Archive)"
      subtitle="Periksa keabsahan dokumen proposal, berkas desain, tautan Figma, dan riwayat revisi karya peserta."
      actions={
        <Link href="/dashboard/admin/penilaian">
          <Button size="sm" variant="primary" leftIcon={<CheckCircle className="w-4 h-4" weight="bold" />}>
            Matriks Penilaian Juri
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {alertSuccess && (
          <Alert variant="success" onClose={() => setAlertSuccess(null)}>
            <AlertTitle>Operasi Berhasil</AlertTitle>
            <AlertDescription>{alertSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)] font-semibold">Filter Lomba:</span>
            <select
              value={compFilter}
              onChange={(e) => setCompFilter(e.target.value)}
              aria-label="Filter cabang lomba"
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 h-9 text-xs text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="all">Semua Cabang Akademik</option>
              {competitions
                .filter((c) => c.type === 'academic')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="text-xs text-[var(--muted-foreground)] font-mono">
            Total Berkas Masuk: <strong className="text-[var(--foreground)]">{filteredSubmissions.length}</strong> karya
          </div>
        </div>

        {/* Tabel Data Submission */}
        <DataTable
          data={filteredSubmissions as (Submission & Record<string, unknown>)[]}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Cari karya, nama peserta, kampus..."
          searchableKeys={['file_name', 'link_url', 'notes', 'submitted_at']}
          exportFilename="submission_karya_permifest"
          onRowClick={(item) => setPreviewSub(item as Submission)}
          emptyTitle="Belum Ada Karya Terkumpul"
          emptyDescription="Belum ada berkas karya atau tautan Figma yang dikumpulkan oleh peserta saat ini."
        />

        {/* DRAWER PRATINJAU KARYA (SUBMISSION PREVIEW DRAWER) */}
        <Drawer
          isOpen={Boolean(previewSub)}
          onClose={() => setPreviewSub(null)}
          size="lg"
        >
          <DrawerHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--primary)]" />
              <DrawerTitle>
                Pratinjau Karya: {previewSub?.file_name || 'Submission Peserta'}
              </DrawerTitle>
            </div>
            <DrawerDescription>
              Detail berkas, catatan pengumpulan, dan verifikasi dokumen sebelum dinilai dewan juri.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerContent className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {previewSub && (
              <>
                {/* Meta Identitas Peserta */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--accent)]/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Badge variant="primary">{previewSub.registration?.competition?.name}</Badge>
                    <Badge variant="neutral" size="sm" className="font-mono">
                      Versi Revisi: v{previewSub.version}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[var(--muted-foreground)] block text-[11px]">Nama Peserta / Ketua Tim</span>
                      <strong className="text-[var(--foreground)] flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                        {previewSub.registration?.user?.full_name}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[var(--muted-foreground)] block text-[11px]">Asal Instansi</span>
                      <strong className="text-[var(--foreground)] flex items-center gap-1.5 mt-0.5">
                        <Buildings className="w-3.5 h-3.5 text-[var(--primary)]" />
                        {previewSub.registration?.user?.institution || '-'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[var(--muted-foreground)] block text-[11px]">Waktu Pengumpulan</span>
                      <span className="text-[var(--foreground)] font-mono flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                        {formatDateShort(previewSub.submitted_at)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[var(--muted-foreground)] block text-[11px]">Nilai Akhir Saat Ini</span>
                      <span className="font-mono font-bold text-sm text-[var(--primary)] mt-0.5 block">
                        {previewSub.final_score !== undefined ? `${previewSub.final_score} / 100` : 'Belum Dinilai'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Catatan / Deskripsi Peserta */}
                {previewSub.notes && (
                  <div className="space-y-1.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Catatan / Abstrak Pengumpulan
                    </h5>
                    <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] italic leading-relaxed">
                      &quot;{previewSub.notes}&quot;
                    </div>
                  </div>
                )}

                {/* Box Pratinjau Tautan / Dokumen */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Tautan &amp; Berkas Karya
                  </h5>

                  {previewSub.link_url ? (
                    <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-5 h-5 text-[var(--primary)]" />
                          <strong className="text-xs text-[var(--foreground)]">Tautan Prototipe Desain Figma</strong>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(previewSub.link_url || '')}
                          className="h-7 px-2.5 text-xs gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedLink ? 'Tersalin!' : 'Salin URL'}</span>
                        </Button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] font-mono text-xs text-[var(--primary)] break-all select-all">
                        {previewSub.link_url}
                      </div>

                      <a href={previewSub.link_url} target="_blank" rel="noreferrer" className="block">
                        <Button size="sm" variant="primary" className="w-full gap-2">
                          <span>Buka Prototipe Figma di Tab Baru</span>
                          <ArrowSquareOut className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  ) : previewSub.file_url ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[var(--foreground)]">{previewSub.file_name}</div>
                            <span className="text-[11px] text-[var(--muted-foreground)]">Format Dokumen Digital</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-8 text-xs"
                          isLoading={openingFile}
                          onClick={() => handleOpenSubmissionFile(previewSub.file_url || '')}
                        >
                          <DownloadSimple className="w-3.5 h-3.5" />
                          <span>Unduh Berkas</span>
                        </Button>
                      </div>

                      {/* Embedded Frame Mockup jika file PDF */}
                      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)] shadow-xs">
                        <div className="bg-[var(--accent)]/50 px-3 py-2 border-b border-[var(--border)] text-xs text-[var(--muted-foreground)] flex items-center justify-between">
                          <span>Viewer Dokumen Interaktif</span>
                          <span className="font-mono text-[10px]">Embedded PDF Viewer</span>
                        </div>
                        <div className="h-64 sm:h-80 flex flex-col items-center justify-center text-center p-6 text-[var(--muted-foreground)] bg-black/5 dark:bg-black/20">
                          <FileText className="w-12 h-12 text-[var(--primary)] opacity-60 mb-2" />
                          <p className="text-xs font-semibold text-[var(--foreground)] mb-1">
                            {previewSub.file_name}
                          </p>
                          <p className="text-[11px] max-w-sm mb-4">
                            Untuk melihat dokumen lengkap dengan format resolusi tinggi, buka berkas langsung melalui tab pembaca.
                          </p>
                          <Button
                            size="sm"
                            variant="primary"
                            className="gap-1.5"
                            isLoading={openingFile}
                            onClick={() => handleOpenSubmissionFile(previewSub.file_url || '')}
                          >
                            <ArrowSquareOut className="w-4 h-4" />
                            <span>Buka Dokumen di Tab Penuh</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-[var(--border)] rounded-xl text-xs text-[var(--muted-foreground)]">
                      Tidak ada lampiran berkas fisik atau tautan eksternal untuk submission ini.
                    </div>
                  )}
                </div>
              </>
            )}
          </DrawerContent>

          <DrawerFooter className="flex items-center justify-between border-t border-[var(--border)] p-4 bg-[var(--card)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewSub(null)}
            >
              Tutup Pratinjau
            </Button>

            {previewSub && (
              <Link href={`/dashboard/admin/penilaian?sub_id=${previewSub.id}`}>
                <Button size="sm" variant="primary" className="gap-1.5">
                  <CheckCircle className="w-4 h-4" weight="bold" />
                  <span>Buka Matriks Penilaian</span>
                </Button>
              </Link>
            )}
          </DrawerFooter>
        </Drawer>

        {/* Dialog Konfirmasi Hapus Berkas */}
        <ConfirmDialog
          isOpen={Boolean(deleteConfirmSub)}
          onClose={() => setDeleteConfirmSub(null)}
          onConfirm={handleDeleteConfirm}
          title="Hapus Berkas Karya Ini?"
          description={`Anda akan menghapus berkas submission "${deleteConfirmSub?.file_name || 'karya'}" milik ${deleteConfirmSub?.registration?.user?.full_name}. Data nilai juri terkait berkas ini akan dibatalkan.`}
          confirmText="Hapus Berkas"
          variant="destructive"
        />
      </div>
    </DashboardLayout>
  );
}
