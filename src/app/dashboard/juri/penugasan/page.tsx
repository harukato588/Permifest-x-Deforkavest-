import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AssignedWorksList } from '@/features/users/AssignedWorksList';
import { getAssignedParticipantWork } from '@/features/users/queries';

export const instant = false;

export default async function JuriPenugasanPage() {
  const works = await getAssignedParticipantWork();

  return (
    <DashboardLayout
      title="Karya yang ditugaskan"
      subtitle="Daftar hanya memuat karya yang ditugaskan kepada akun juri ini. Identitas peserta tidak ditampilkan."
    >
      <AssignedWorksList works={works} />
    </DashboardLayout>
  );
}
