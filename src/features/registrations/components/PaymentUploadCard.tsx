'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { uploadFileDirectly } from '@/lib/supabase/storage-client';
import { submitPaymentProofAction } from '@/features/registrations/actions';
import type { RegistrationWithRelations } from '@/features/registrations/queries';
import { useAppStore } from '@/lib/store';
import { QrCode, UploadSimple, CheckCircle, Clock, Copy, ArrowSquareOut, Bank, ShieldCheck } from '@phosphor-icons/react';

interface Props {
  registration: RegistrationWithRelations;
  onSuccess: () => void;
}

export function PaymentUploadCard({ registration: reg, onSuccess }: Props) {
  const { systemSettings } = useAppStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedNmid, setCopiedNmid] = useState(false);

  const comp = reg.competition;
  const payment = reg.payment;

  const qrisUrl = comp?.payment_qr_url || systemSettings?.qris_image_url || '/brand/qris.jpg';
  const qrisNmid = systemSettings?.qris_nmid || 'ID1026518731546';
  const merchantName = systemSettings?.bank_account_holder || 'IMPS_INFORMATIKA';
  const bankName = systemSettings?.bank_name || 'BCA (Bank Central Asia)';
  const bankNumber = systemSettings?.bank_account_number || '8820 1928 37';

  const canUpload =
    payment &&
    (payment.status === 'awaiting_proof' || payment.status === 'rejected');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleCopyBank = useCallback(() => {
    navigator.clipboard.writeText(bankNumber.replace(/\s/g, '')).catch(() => {});
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  }, [bankNumber]);

  const handleCopyNmid = useCallback(() => {
    navigator.clipboard.writeText(qrisNmid).catch(() => {});
    setCopiedNmid(true);
    setTimeout(() => setCopiedNmid(false), 2000);
  }, [qrisNmid]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Silakan pilih berkas bukti transfer (JPG, PNG, WEBP, atau PDF).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUploadProgress(10);

    try {
      const uploadRes = await uploadFileDirectly(selectedFile, {
        bucket: 'payment-proofs',
        registrationId: reg.id,
        onProgress: (pct) => setUploadProgress(pct),
      });

      if (!uploadRes.success || !uploadRes.storagePath) {
        throw new Error(uploadRes.error ?? 'Gagal mengunggah berkas bukti transfer.');
      }

      const result = await submitPaymentProofAction({
        registration_id: reg.id,
        proof_path: uploadRes.storagePath,
      });

      if (!result.success) {
        throw new Error(result.error ?? 'Gagal menyimpan status pembayaran.');
      }

      setSelectedFile(null);
      setUploadProgress(null);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-[family-name:var(--font-bricolage)]">
            {comp?.name ?? 'Kompetisi'}
          </CardTitle>
          {payment && <StatusBadge status={payment.status} domain="payment" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Info tagihan */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
          <span className="text-sm text-muted-foreground">Jumlah Tagihan</span>
          <span className="font-mono font-bold text-primary text-lg">
            {formatCurrency(payment?.amount ?? comp?.registration_fee ?? 0)}
          </span>
        </div>

        {/* Sudah diverifikasi */}
        {payment?.status === 'verified' && (
          <div className="flex items-center gap-2 text-sm text-[var(--success)] bg-[var(--success)]/10 rounded-lg p-3">
            <CheckCircle size={18} weight="fill" />
            <span>Pembayaran telah diverifikasi. Anda resmi terdaftar!</span>
          </div>
        )}

        {/* Menunggu review */}
        {payment?.status === 'pending_review' && (
          <div className="flex flex-col gap-1 text-sm bg-muted/40 rounded-lg p-3">
            <div className="flex items-center gap-2 text-foreground">
              <Clock size={16} className="text-muted-foreground" />
              <span>Menunggu verifikasi panitia (maks. 24 jam kerja).</span>
            </div>
            {payment.proof_uploaded_at && (
              <span className="text-xs text-muted-foreground pl-6">
                Diunggah: {formatDateShort(payment.proof_uploaded_at)}
              </span>
            )}
          </div>
        )}

        {/* Ditolak */}
        {payment?.status === 'rejected' && payment.reject_reason && (
          <Alert variant="destructive">
            <AlertDescription>
              <span className="font-semibold">Pembayaran ditolak: </span>
              {payment.reject_reason}
            </AlertDescription>
          </Alert>
        )}

        {/* Form upload — hanya jika bisa unggah */}
        {canUpload && (
          <>
            {/* Instruksi Pembayaran QRIS Resmi */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <QrCode size={20} weight="bold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      QRIS Standar Pembayaran Nasional (GPN)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Merchant: <span className="font-semibold text-foreground">{merchantName}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    NMID: {qrisNmid}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={handleCopyNmid}
                    leftIcon={<Copy size={13} />}
                  >
                    {copiedNmid ? 'Disalin!' : 'Salin'}
                  </Button>
                </div>
              </div>

              {/* Tampilan Barcode QRIS Resmi */}
              <div className="flex flex-col items-center justify-center gap-3 pt-1">
                <div className="relative group p-3 bg-white rounded-xl border border-border shadow-xs max-w-[260px] sm:max-w-[280px] w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisUrl}
                    alt={`QRIS Resmi ${merchantName} - Permifest x Deforkafest`}
                    className="w-full h-auto object-contain rounded"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={qrisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                  >
                    <ArrowSquareOut size={14} weight="bold" />
                    <span>Buka Barcode Ukuran Penuh / Unduh</span>
                  </a>
                </div>
              </div>

              {/* Panduan Pembayaran */}
              <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs space-y-1.5 text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-primary" weight="fill" />
                  Panduan Pembayaran QRIS:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                  <li>
                    Buka aplikasi <strong>Mobile Banking</strong> (BCA, Mandiri, BRI, BNI, BSI, dll) atau <strong>E-Wallet</strong> (GoPay, OVO, DANA, ShopeePay, LinkAja).
                  </li>
                  <li>
                    Pilih menu <strong>Scan / Bayar QRIS</strong> dan arahkan kamera ke barcode di atas.
                  </li>
                  <li>
                    Pastikan nama merchant tertera: <strong className="text-foreground">{merchantName}</strong>.
                  </li>
                  <li>
                    Masukkan nominal tagihan: <strong className="text-primary">{formatCurrency(payment?.amount ?? comp?.registration_fee ?? 0)}</strong>.
                  </li>
                  <li>
                    Simpan bukti transfer / struk pembayaran, lalu unggah berkasnya pada formulir di bawah ini.
                  </li>
                </ol>
              </div>

              {/* Opsi Rekening Bank Transfer (Alternatif) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Bank size={18} className="text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Alternatif Transfer Bank</p>
                    <p className="text-xs font-mono font-bold text-foreground">
                      {bankName} : {bankNumber} <span className="font-sans font-normal text-muted-foreground">(a.n. {merchantName})</span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5 self-start sm:self-center"
                  onClick={handleCopyBank}
                  leftIcon={<Copy size={13} />}
                >
                  {copiedBank ? 'Rekening Disalin!' : 'Salin Rekening'}
                </Button>
              </div>
            </div>

            {/* Form upload */}
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Bukti Transfer <span className="text-destructive">*</span>
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileSelect}
                  disabled={isSubmitting}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: JPG, PNG, WEBP, atau PDF. Maks. 5 MB.
                </p>
              </div>

              {selectedFile && (
                <div className="text-xs text-muted-foreground bg-muted/40 rounded px-3 py-2 font-mono">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </div>
              )}

              {/* Progress bar */}
              {uploadProgress !== null && (
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !selectedFile}
                leftIcon={<UploadSimple size={16} weight="bold" />}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
