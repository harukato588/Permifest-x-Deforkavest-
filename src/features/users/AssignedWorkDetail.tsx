'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowSquareOut, DownloadSimple, FileText } from '@phosphor-icons/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AssignedParticipantWork } from './queries';
import { getAssignedSubmissionDownloadUrlAction } from './actions';

interface AssignedWorkDetailProps {
  work: AssignedParticipantWork;
}

function statusLabel(status: AssignedParticipantWork['status']) {
  if (status === 'submitted') return 'Penilaian dikirim';
  if (status === 'in_progress') return 'Dalam penilaian';
  return 'Menunggu penilaian';
}

function statusVariant(status: AssignedParticipantWork['status']) {
  if (status === 'submitted') return 'success';
  if (status === 'in_progress') return 'info';
  return 'neutral';
}

export function AssignedWorkDetail({ work }: AssignedWorkDetailProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const safeLinkUrl = work.linkUrl && /^https?:\/\//i.test(work.linkUrl) ? work.linkUrl : null;

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const result = await getAssignedSubmissionDownloadUrlAction(work.assignmentId);
      if (!result.success || !result.url) {
        setError(result.error || 'Tautan unduhan tidak tersedia. Coba lagi.');
        return;
      }
      window.location.assign(result.url);
    } catch {
      setError('Karya gagal diunduh. Coba muat ulang halaman, lalu ulangi.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/juri/penugasan"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Kembali ke penugasan
      </Link>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Karya belum bisa dibuka.</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(work.status)}>{statusLabel(work.status)}</Badge>
            <span className="text-sm text-muted-foreground">{work.competitionName}</span>
          </div>
          <CardTitle className="mt-2 break-words">{work.anonymousId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Versi karya {work.version}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {safeLinkUrl && (
              <a
                href={safeLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:bg-muted sm:w-auto"
              >
                <ArrowSquareOut size={18} aria-hidden="true" />
                Buka tautan karya
              </a>
            )}
            {work.hasFile && (
              <Button
                type="button"
                variant="primary"
                className="w-full sm:w-auto"
                leftIcon={<DownloadSimple size={18} />}
                isLoading={downloading}
                onClick={handleDownload}
              >
                Unduh karya
              </Button>
            )}
            {!safeLinkUrl && !work.hasFile && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText size={18} aria-hidden="true" />
                Berkas karya belum tersedia.
              </p>
            )}
          </div>
          <Alert variant="info">
            <AlertDescription>
              <strong>Penilaian belum tersambung.</strong> Halaman ini menampilkan karya yang ditugaskan. Input dan penyimpanan skor belum terhubung ke database.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
