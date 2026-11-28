'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, IdentificationCard, UploadSimple, XCircle } from '@phosphor-icons/react';
import {
  confirmKtmUploadAction,
  createKtmUploadUrlAction,
} from './actions';
import type { ParticipantProfileData } from './queries';

interface KtmDocumentCardProps {
  verification: ParticipantProfileData['ktm'];
}

export function KtmDocumentCard({ verification: initialVerification }: KtmDocumentCardProps) {
  const [verification, setVerification] = useState(initialVerification);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage('Pilih berkas KTM yang ingin diunggah.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      const effectiveMimeType = file.type || (
        file.name.toLowerCase().endsWith('.pdf')
          ? 'application/pdf'
          : file.name.toLowerCase().endsWith('.png')
            ? 'image/png'
            : file.name.toLowerCase().endsWith('.webp')
              ? 'image/webp'
              : 'image/jpeg'
      );

      const signed = await createKtmUploadUrlAction({
        originalFilename: file.name,
        fileSizeBytes: file.size,
        mimeType: effectiveMimeType,
      });
      if (!signed.success || !signed.data) {
        setErrorMessage(signed.error || 'Tautan unggah gagal dibuat. Coba lagi.');
        return;
      }

      const uploadResponse = await fetch(signed.data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': effectiveMimeType },
        body: file,
      });
      if (!uploadResponse.ok) {
        setErrorMessage('KTM gagal diunggah ke penyimpanan. Periksa koneksi lalu coba lagi.');
        return;
      }

      const confirmed = await confirmKtmUploadAction({
        storagePath: signed.data.storagePath,
        originalFilename: file.name,
        fileSizeBytes: file.size,
        mimeType: effectiveMimeType,
      });
      if (!confirmed.success) {
        setErrorMessage(confirmed.error || 'KTM gagal dikonfirmasi. Coba unggah ulang.');
        return;
      }

      setVerification({
        id: confirmed.data?.identityVerificationId || '',
        status: 'pending',
        note: null,
        updatedAt: new Date().toISOString(),
      });
      setFile(null);
      setSuccessMessage(confirmed.message || 'KTM berhasil dikirim dan menunggu pemeriksaan panitia.');
    } catch {
      setErrorMessage('KTM gagal diunggah. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsUploading(false);
    }
  };

  const status = verification?.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdentificationCard size={19} className="text-primary" aria-hidden="true" />
          KTM
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          KTM wajib untuk mahasiswa. Siswa sekolah tidak perlu mengunggah kartu pelajar.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Unggah KTM gagal</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert variant="success" role="status">
            <AlertTitle>KTM terkirim</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {status === 'pending' && (
          <div className="flex items-center gap-2 text-sm text-warning" role="status">
            <Clock size={18} aria-hidden="true" />
            <span>Menunggu pemeriksaan panitia.</span>
          </div>
        )}
        {status === 'verified' && (
          <div className="flex items-center gap-2 text-sm text-success" role="status">
            <CheckCircle size={18} weight="fill" aria-hidden="true" />
            <span>KTM sudah diterima panitia.</span>
          </div>
        )}
        {status === 'rejected' && (
          <div className="space-y-2" role="status">
            <Badge variant="destructive" className="gap-1">
              <XCircle size={14} aria-hidden="true" />
              KTM perlu diunggah ulang
            </Badge>
            {verification?.note && (
              <p className="text-sm text-muted-foreground">
                Alasan panitia: {verification.note}
              </p>
            )}
          </div>
        )}

        {status !== 'pending' && status !== 'verified' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="ktm-file" className="block text-sm font-medium text-foreground">
                Berkas KTM
              </label>
              <input
                id="ktm-file"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setErrorMessage(null);
                }}
                aria-describedby="ktm-file-help"
                className="block min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
              <p id="ktm-file-help" className="text-sm text-muted-foreground">
                JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.
              </p>
              {file && <p className="break-all text-sm text-foreground">Dipilih: {file.name}</p>}
            </div>
            <Button
              type="button"
              variant="primary"
              className="min-h-11 cursor-pointer"
              isLoading={isUploading}
              disabled={isUploading || !file}
              onClick={handleUpload}
              leftIcon={<UploadSimple size={17} aria-hidden="true" />}
            >
              Kirim KTM
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
