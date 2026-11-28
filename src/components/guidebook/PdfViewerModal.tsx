'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Guidebook } from '@/lib/types';
import {
  X,
  DownloadSimple,
  ArrowSquareOut,
  FilePdf,
  WarningCircle,
  ArrowsOut,
  ArrowsIn,
} from '@phosphor-icons/react';

interface PdfViewerModalProps {
  guidebook: Guidebook | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PdfViewerModal({ guidebook, isOpen, onClose }: PdfViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setIsFullscreen(false);
    setLoadError(false);
    onClose();
  }, [onClose]);

  // Fetch PDF lokal sebagai Blob URL agar tidak diblokir oleh X-Frame-Options / cache browser
  useEffect(() => {
    if (!isOpen || !guidebook?.file_url || !guidebook.file_url.startsWith('/')) {
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      try {
        const res = await fetch(guidebook.file_url, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to load PDF');
        const rawBlob = await res.blob();
        const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(pdfBlob);
        if (!controller.signal.aborted) {
          setLoadError(false);
          setBlobUrl(objectUrl);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError' && !controller.signal.aborted) {
          setLoadError(true);
        }
      }
    };

    void loadPdf();

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, guidebook?.file_url]);

  // Tangani tombol ESC untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen || !guidebook) return null;

  const isLocalPdf = guidebook.file_url.startsWith('/');
  const viewerSrc = isLocalPdf ? blobUrl : guidebook.file_url;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full flex flex-col rounded-2xl sm:rounded-3xl bg-card border border-border shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'h-[96vh] max-w-[98vw]'
            : 'h-[88vh] max-w-5xl'
        }`}
      >
        {/* ── Modal Header: Quick Actions & Title ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border bg-card select-none gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <FilePdf size={22} weight="duotone" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-muted text-foreground border border-border">
                  {guidebook.version}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {formatFileSize(guidebook.file_size_bytes)}
                </span>
              </div>
              <h2
                id="pdf-viewer-title"
                className="font-[family-name:var(--font-bricolage)] font-bold text-sm sm:text-base text-foreground truncate mt-0.5"
                title={guidebook.title}
              >
                {guidebook.title}
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Toggle Fullscreen button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-card border border-border hover:bg-muted transition-all min-h-[38px] min-w-[38px] flex items-center justify-center gap-1.5 cursor-pointer"
              title={isFullscreen ? 'Perkecil Tampilan' : 'Layar Penuh'}
            >
              {isFullscreen ? (
                <>
                  <ArrowsIn size={16} weight="bold" />
                  <span className="hidden sm:inline">Normal</span>
                </>
              ) : (
                <>
                  <ArrowsOut size={16} weight="bold" />
                  <span className="hidden sm:inline">Penuh</span>
                </>
              )}
            </button>

            {/* Buka di Tab Baru */}
            <a
              href={guidebook.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-primary hover:text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center gap-1.5 cursor-pointer"
              title="Buka PDF di Tab Baru"
            >
              <ArrowSquareOut size={16} weight="bold" />
              <span className="hidden sm:inline">Tab Baru</span>
            </a>

            {/* Unduh Berkas PDF */}
            <a
              href={guidebook.file_url}
              download={guidebook.file_name}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              title="Unduh Berkas PDF"
            >
              <DownloadSimple size={16} weight="bold" />
              <span className="hidden sm:inline">Unduh</span>
            </a>

            {/* Tutup Modal */}
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer ml-1"
              aria-label="Tutup jendela pembaca"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* ── Modal Body: In-Browser Native PDF Frame Viewer ── */}
        <div className="flex-1 bg-muted/30 relative flex flex-col items-center justify-center overflow-hidden">
          {loadError ? (
            <div className="p-8 text-center max-w-md space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
                <WarningCircle size={28} weight="duotone" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Pratinjau PDF tidak dapat dimuat langsung
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Beberapa peramban ponsel membatasi tampilan berkas dokumen di dalam frame. Kamu tetap dapat membuka atau mengunduh dokumen secara langsung:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={guidebook.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground bg-card border border-border hover:bg-muted"
                >
                  Buka di Tab Baru
                </a>
                <a
                  href={guidebook.file_url}
                  download={guidebook.file_name}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  Unduh PDF ({guidebook.version})
                </a>
              </div>
            </div>
          ) : !viewerSrc ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Memuat dokumen PDF...</p>
            </div>
          ) : (
            <iframe
              src={`${viewerSrc}#toolbar=1&navpanes=0`}
              title={guidebook.title}
              className="w-full h-full border-none select-auto"
              onError={() => setLoadError(true)}
            />
          )}
        </div>

        {/* ── Modal Footer: Info Catatan Revisi & Navigasi ── */}
        {guidebook.release_notes && (
          <div className="px-4 sm:px-6 py-2.5 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground select-none">
            <span className="truncate pr-4">
              <strong className="text-foreground">Catatan Rilis:</strong> {guidebook.release_notes}
            </span>
            <span className="shrink-0 text-[11px] font-mono">
              Diperbarui: {new Date(guidebook.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
