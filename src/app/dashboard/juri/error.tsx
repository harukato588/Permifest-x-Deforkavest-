'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface JuriErrorProps {
  reset: () => void;
}

export default function JuriError({ reset }: JuriErrorProps) {
  return (
    <DashboardLayout title="Data penugasan gagal dimuat">
      <div className="max-w-xl space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Penugasan belum bisa ditampilkan.</strong> Data gagal dimuat. Coba lagi. Jika masalah berlanjut, hubungi panitia.
          </AlertDescription>
        </Alert>
        <Button type="button" onClick={reset}>Coba lagi</Button>
      </div>
    </DashboardLayout>
  );
}
