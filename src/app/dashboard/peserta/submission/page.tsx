'use client';

import React, { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppStore } from '@/lib/store';
import { formatDateWIB } from '@/lib/utils';
import { uploadFileDirectly } from '@/lib/supabase/storage-client';
import { isSupabaseLive } from '@/lib/supabase/env';
import { submitWorkAction } from '@/features/submissions/actions';
import {
  UploadSimple,
  FileText,
  Link as LinkIcon,
  Clock,
  ArrowSquareOut,
} from '@phosphor-icons/react';

export default function PesertaSubmissionPage() {
  const { currentUser, registrations, submissions, submitWork } = useAppStore();

  // Hanya kompetisi akademik yang memerlukan pengumpulan berkas/karya
  const myAcademicRegistrations = registrations.filter(
    (r) => r.user_id === currentUser.id && r.competition?.submission_config.allowedTypes.length
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [activeRegId, setActiveRegId] = useState<string | null>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [figmaLink, setFigmaLink] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const submitBtnRef = useRef<HTMLElement | null>(null);

  const selectedReg = registrations.find((r) => r.id === activeRegId);
  const isFigmaRequired = selectedReg?.competition?.submission_config.allowedTypes.includes('figma_url');

  const openSubmitModal = (regId: string, stageId: string) => {
    setActiveRegId(regId);
    setActiveStageId(stageId);
    setSelectedFile(null);
    setFileName('');
    setFigmaLink('');
    setNotes('');
    setUploadProgress(null);
    setModalError(null);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (!fileName) {
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegId || !activeStageId) return;

    setSubmitting(true);
    setModalError(null);
    setUploadProgress(null);

    try {
      let finalStoragePath: string | undefined = undefined;

      // Jika bukan lomba desain Figma, lakukan direct upload berkas ke bucket submissions
      if (!isFigmaRequired) {
        if (!selectedFile) {
          throw new Error('Silakan pilih berkas dokumen karya (PDF, DOCX, atau ZIP) terlebih dahulu.');
        }

        setUploadProgress(15);
        const uploadRes = await uploadFileDirectly(selectedFile, {
          bucket: 'submissions',
          registrationId: activeRegId,
          stageId: activeStageId,
          competitionId: selectedReg?.competition?.id,
          onProgress: (pct) => setUploadProgress(pct),
        });

        if (!uploadRes.success || !uploadRes.storagePath) {
          throw new Error(uploadRes.error || 'Gagal mengunggah berkas karya ke penyimpanan Supabase.');
        }

        finalStoragePath = uploadRes.storagePath;
      }

      if (isSupabaseLive()) {
        const subRes = await submitWorkAction({
          registration_id: activeRegId,
          stage_id: activeStageId,
          kind: isFigmaRequired ? 'link' : 'file',
          storage_path: isFigmaRequired ? undefined : finalStoragePath,
          original_filename: isFigmaRequired ? undefined : (fileName || selectedFile?.name),
          mime: selectedFile?.type,
          size_bytes: selectedFile?.size,
          link_url: isFigmaRequired ? figmaLink : undefined,
          notes: notes,
        });

        if (!subRes.success) {
          throw new Error(subRes.error || 'Gagal menyimpan karya ke sistem.');
        }
      }

      await submitWork(activeRegId, activeStageId, {
        fileName: isFigmaRequired ? undefined : (fileName || selectedFile?.name || 'karya_permifest.pdf'),
        fileUrl: isFigmaRequired ? undefined : finalStoragePath,
        linkUrl: isFigmaRequired ? figmaLink : undefined,
        notes: notes,
      });

      // Panggil .done() pada Web Component Sakuga Button saat aksi berhasil
      submitBtnRef.current?.done?.();

      setTimeout(() => {
        setModalOpen(false);
        setSelectedFile(null);
        setSuccessBanner('Karya Anda berhasil dikumpulkan dan tersimpan aman! Anda dapat memperbarui berkas sebelum batas waktu berakhir.');
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengirimkan karya';
      setModalError(message);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <DashboardLayout
      title="Pengumpulan Karya (Submission)"
      subtitle="Kumpulkan dokumen proposal, berkas karya, atau tautan Figma sesuai ketentuan cabang lomba."
    >
      <div className="space-y-6">
        {successBanner && (
          <Alert variant="success" onClose={() => setSuccessBanner(null)}>
            <AlertTitle>Pengumpulan Berhasil</AlertTitle>
            <AlertDescription>{successBanner}</AlertDescription>
          </Alert>
        )}

        {myAcademicRegistrations.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-7 h-7 text-[var(--primary)]" weight="duotone" />}
            title="Tidak Ada Kompetisi Berbasis Karya"
            description="Anda belum mendaftar di cabang lomba akademik (Esai, UI/UX, IT Architecture). Silakan mendaftar terlebih dahulu."
          />
        ) : (
          myAcademicRegistrations.map((reg) => {
            const comp = reg.competition;
            const currentSubmissions = submissions.filter((s) => s.registration_id === reg.id);

            return (
              <Card key={reg.id} className="overflow-hidden border-[var(--border)] bg-[var(--card)]">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-[var(--foreground)]">{comp?.name}</CardTitle>
                      <Badge variant="primary">{comp?.category.toUpperCase()}</Badge>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Tema: <strong className="text-[var(--foreground)]">{comp?.theme}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)] font-mono">Status Bayar:</span>
                    <StatusBadge status={reg.payment?.status || reg.status} domain="payment" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Tahapan Lomba (Penyisihan / Final) */}
                  <div className="space-y-3">
                    {comp?.stages.map((stage) => {
                      const stageSub = currentSubmissions.find((s) => s.stage_id === stage.id && s.is_latest);

                      return (
                        <div key={stage.id} className="p-4 rounded-[var(--radius-lg)] bg-[var(--accent)]/30 border border-[var(--border)] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-[var(--foreground)]">Tahap: {stage.name}</h4>
                                {stage.is_active ? (
                                  <Badge variant="success" size="sm">Tahap Berjalan</Badge>
                                ) : (
                                  <Badge variant="neutral" size="sm">Belum Dibuka</Badge>
                                )}
                              </div>
                              <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5 mt-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                                <span>Batas Pengumpulan: {formatDateWIB(stage.submission_close_at)}</span>
                              </div>
                            </div>

                            <div>
                              {(() => {
                                const isPaymentVerified =
                                  reg.payment?.status === 'verified' ||
                                  reg.status === 'verified';

                                if (!isPaymentVerified) {
                                  return (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      disabled
                                      title="Karya hanya dapat dikumpulkan setelah pembayaran diverifikasi oleh panitia."
                                    >
                                      Menunggu Verifikasi Bayar
                                    </Button>
                                  );
                                }

                                if (!stage.is_active) {
                                  return (
                                    <Button size="sm" variant="secondary" disabled>
                                      Tahapan Belum Dibuka
                                    </Button>
                                  );
                                }

                                return (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    leftIcon={<UploadSimple className="w-4 h-4" weight="bold" />}
                                    onClick={() => openSubmitModal(reg.id, stage.id)}
                                  >
                                    {stageSub ? `Unggah Versi Baru (v${stageSub.version + 1})` : 'Kumpul Karya'}
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Detail Berkas Terakhir yang Diserahkan */}
                          {stageSub ? (
                            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--card)] border border-[var(--border)] space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
                                  {stageSub.link_url ? (
                                    <LinkIcon className="w-4 h-4 text-[var(--primary)]" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-[var(--primary)]" />
                                  )}
                                  <span>
                                    {stageSub.link_url ? 'Tautan Desain Figma' : stageSub.file_name}
                                  </span>
                                  <Badge variant="primary" size="sm">v{stageSub.version}</Badge>
                                </div>
                                <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                                  Diunggah: {formatDateWIB(stageSub.submitted_at)}
                                </span>
                              </div>

                              {stageSub.link_url && (
                                <a
                                  href={stageSub.link_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 break-all font-mono"
                                >
                                  <span>{stageSub.link_url}</span>
                                  <ArrowSquareOut className="w-3.5 h-3.5 shrink-0" />
                                </a>
                              )}

                              {stageSub.notes && (
                                <p className="text-xs text-[var(--muted-foreground)] italic">
                                  Catatan pengantar: &quot;{stageSub.notes}&quot;
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-[var(--muted-foreground)] italic p-3 rounded-[var(--radius-md)] bg-[var(--card)]/60 border border-[var(--border)]">
                              Belum ada berkas karya yang dikumpulkan untuk tahap ini.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Form Submission */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Formulir Penyerahan Karya"
        description="Pastikan karya mematuhi batasan format, ukuran berkas, dan kaidah orisinalitas."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <Alert variant="destructive" onClose={() => setModalError(null)}>
              <AlertTitle>Gagal Menyimpan</AlertTitle>
              <AlertDescription>{modalError}</AlertDescription>
            </Alert>
          )}
          {isFigmaRequired ? (
            <Input
              label="Tautan Berkas Figma (Public Viewable)"
              type="url"
              required
              placeholder="https://www.figma.com/design/..."
              value={figmaLink}
              onChange={(e) => setFigmaLink(e.target.value)}
              helperText="Pastikan akses proyek Figma disetel ke 'Anyone with the link can view'."
            />
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                  Pilih Berkas Dokumen Karya (PDF, DOCX, ZIP, maks. 25 MB)
                </label>
                <input
                  type="file"
                  accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed"
                  onChange={handleFileChange}
                  disabled={submitting}
                  className="w-full text-xs text-[var(--foreground)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary)] file:text-white hover:file:opacity-90 cursor-pointer disabled:opacity-50"
                />
                {selectedFile && (
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                    Ukuran: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Tipe: {selectedFile.type || 'file'}
                  </p>
                )}
              </div>

              <Input
                label="Nama Judul Dokumen (Opsional)"
                placeholder="Contoh: Esai_CyberSecurity_NamaPeserta.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                disabled={submitting}
              />
            </>
          )}

          {uploadProgress !== null && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] font-mono">
                <span>Mengunggah dokumen ke Supabase Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
              Catatan Pengantar untuk Dewan Juri (Opsional)
            </label>
            <textarea
              rows={3}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
              placeholder="Jelaskan ringkasan pendekatan metodologi atau lampiran diagram sistem..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Alert variant="info">
            <AlertTitle>Ketentuan Versi</AlertTitle>
            <AlertDescription>
              Peserta dapat mengunggah ulang versi terbaru kapan saja sebelum batas waktu penutupan. Versi terakhir yang akan dinilai juri.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <sakuga-button
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </sakuga-button>
            <sakuga-button
              ref={(node: HTMLElement | null) => {
                submitBtnRef.current = node;
              }}
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Mengirim...' : 'Kirim Karya'}
            </sakuga-button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
