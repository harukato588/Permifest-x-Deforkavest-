import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ManagedParticipantsList } from '@/features/users/ManagedParticipantsList';
import { getManagedParticipants } from '@/features/users/queries';

export const instant = false;

export default async function AdminPesertaPage() {
  const participants = await getManagedParticipants();

  return (
    <DashboardLayout
      title="Data peserta"
      subtitle="Daftar ini hanya memuat peserta pada lomba yang berada dalam cakupan aksesmu."
    >
      <ManagedParticipantsList initialParticipants={participants} />
    </DashboardLayout>
  );
}
