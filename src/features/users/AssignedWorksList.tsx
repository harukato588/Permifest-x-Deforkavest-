'use client';

import Link from 'next/link';
import { ClipboardText } from '@phosphor-icons/react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { AssignedParticipantWork } from './queries';

interface AssignedWorksListProps {
  works: AssignedParticipantWork[];
  emptyTitle?: string;
  emptyDescription?: string;
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

export function AssignedWorksList({
  works,
  emptyTitle = 'Belum ada karya yang ditugaskan',
  emptyDescription = 'Karya akan tampil di sini setelah panitia memberi penugasan kepada kamu.',
}: AssignedWorksListProps) {
  if (works.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardText size={28} weight="duotone" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {works.map((work) => (
        <li key={work.assignmentId}>
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">{work.anonymousId}</h2>
                  <Badge variant={statusVariant(work.status)}>{statusLabel(work.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground break-words">{work.competitionName}</p>
                <p className="text-sm text-muted-foreground">Versi karya {work.version}</p>
              </div>
              <Link
                href={`/dashboard/juri/penugasan/${work.assignmentId}`}
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:bg-muted sm:w-auto"
              >
                Buka karya
              </Link>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
