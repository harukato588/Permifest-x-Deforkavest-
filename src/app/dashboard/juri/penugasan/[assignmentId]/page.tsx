import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { AssignedWorkDetail } from '@/features/users/AssignedWorkDetail';
import {
  getAssignedParticipantWorkDetail,
} from '@/features/users/queries';

export const instant = false;

export default async function JuriAssignmentDetailPage({
  params,
}: PageProps<'/dashboard/juri/penugasan/[assignmentId]'>) {
  const { assignmentId } = await params;
  const work = await getAssignedParticipantWorkDetail(assignmentId);

  return (
    <DashboardLayout
      title="Detail karya"
      subtitle="Informasi identitas peserta dan dokumen pribadi tidak tersedia pada tampilan juri."
    >
      {work ? (
        <AssignedWorkDetail work={work} />
      ) : (
        <EmptyState
          title="Penugasan tidak ditemukan"
          description="Karya ini tidak ada dalam daftar tugas akun juri kamu."
        />
      )}
    </DashboardLayout>
  );
}
