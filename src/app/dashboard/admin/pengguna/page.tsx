import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ManagedUsersPanel } from '@/features/users/ManagedUsersPanel';
import { getManagedUsers, getRoleCompetitionOptions } from '@/features/users/queries';

export const instant = false;

export default async function AdminMasterPenggunaPage() {
  const [users, competitions] = await Promise.all([
    getManagedUsers(),
    getRoleCompetitionOptions(),
  ]);

  return (
    <DashboardLayout
      title="Pengguna dan peran"
      subtitle="Kelola peran kerja dan status pendidikan akun yang sudah terdaftar."
    >
      <ManagedUsersPanel initialUsers={users} competitions={competitions} />
    </DashboardLayout>
  );
}
