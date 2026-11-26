import { JuriOverviewPanel } from '@/features/users/JuriOverviewPanel';
import { getAssignedParticipantWork } from '@/features/users/queries';

export const instant = false;

export default async function JuriOverviewPage() {
  const works = await getAssignedParticipantWork();
  return <JuriOverviewPanel works={works} />;
}
