'use client';

import { CheckCircle, ClipboardText, Clock } from '@phosphor-icons/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { AssignedWorksList } from './AssignedWorksList';
import type { AssignedParticipantWork } from './queries';

interface JuriOverviewPanelProps {
  works: AssignedParticipantWork[];
}

export function JuriOverviewPanel({ works }: JuriOverviewPanelProps) {
  const submittedCount = works.filter((work) => work.status === 'submitted').length;
  const pendingCount = works.length - submittedCount;

  return (
    <DashboardLayout
      title="Dashboard Dewan Juri"
      subtitle="Karya yang ditugaskan panitia tampil di sini dengan identitas peserta disamarkan."
    >
      <div className="space-y-6">
        <section aria-label="Ringkasan penugasan" className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <ClipboardText size={22} aria-hidden="true" className="shrink-0 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total penugasan</p>
                <p className="text-2xl font-semibold tabular-nums">{works.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <Clock size={22} aria-hidden="true" className="shrink-0 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Belum dikirim</p>
                <p className="text-2xl font-semibold tabular-nums">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4 sm:p-5">
              <CheckCircle size={22} aria-hidden="true" className="shrink-0 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Sudah dikirim</p>
                <p className="text-2xl font-semibold tabular-nums">{submittedCount}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="latest-assignments-heading" className="space-y-3">
          <h2 id="latest-assignments-heading" className="text-lg font-semibold">
            Penugasan terbaru
          </h2>
          <AssignedWorksList works={works.slice(0, 5)} />
        </section>
      </div>
    </DashboardLayout>
  );
}
