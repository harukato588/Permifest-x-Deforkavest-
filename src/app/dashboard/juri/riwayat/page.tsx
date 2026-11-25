import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AssignedWorksList } from '@/features/users/AssignedWorksList';
import { getAssignedParticipantWork } from '@/features/users/queries';

export default async function JuriRiwayatPage() {
  const works = await getAssignedParticipantWork();
  const submittedWorks = works.filter((work) => work.status === 'submitted');

  return (
    <DashboardLayout
      title="Riwayat penilaian"
      subtitle="Karya dengan penilaian yang sudah dikirim. Identitas peserta tetap disamarkan."
    >
      <AssignedWorksList
        works={submittedWorks}
        emptyTitle="Belum ada penilaian yang dikirim"
        emptyDescription="Penilaian yang selesai akan muncul di sini setelah kamu mengirimkannya."
      />
    </DashboardLayout>
  );
}
