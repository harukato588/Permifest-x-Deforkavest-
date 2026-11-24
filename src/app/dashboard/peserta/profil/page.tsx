import { ParticipantProfileClient } from '@/features/users/ParticipantProfileClient';
import { getParticipantProfileData } from '@/features/users/queries';

export default async function PesertaProfilPage() {
  const profile = await getParticipantProfileData();
  return <ParticipantProfileClient profile={profile} />;
}
