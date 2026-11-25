import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';

export default function JuriLoading() {
  return (
    <DashboardLayout title="Memuat penugasan" subtitle="Mengambil karya yang ditugaskan kepada kamu.">
      <div aria-busy="true" className="space-y-3">
        <p role="status" className="text-sm text-muted-foreground">Memuat daftar karya...</p>
        {[0, 1, 2].map((item) => (
          <Card key={item} className="h-28 bg-muted/50" />
        ))}
      </div>
    </DashboardLayout>
  );
}
