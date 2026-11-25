'use client';

import { useState, type FormEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ROLE_LABELS } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { updateProfileAction } from './actions';
import { KtmDocumentCard } from './KtmDocumentCard';
import type { ParticipantProfileData } from './queries';

interface ParticipantProfileClientProps {
  profile: ParticipantProfileData;
}

const educationOptions = [
  { value: 'mahasiswa', label: 'Mahasiswa' },
  { value: 'sma_smk', label: 'Siswa sekolah' },
  { value: 'umum', label: 'Umum' },
] as const;

export function ParticipantProfileClient({ profile }: ParticipantProfileClientProps) {
  const { currentUser, setCurrentUser } = useAppStore();
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [institution, setInstitution] = useState(currentUser.institution || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [educationLevel, setEducationLevel] = useState<
    Exclude<ParticipantProfileData['educationLevel'], null> | ''
  >(
    profile.educationLevel || '',
  );
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    setErrorMessage(null);
    setIsSaving(true);
    try {
      const result = await updateProfileAction({
        fullName,
        institution,
        phone,
        educationLevel: educationLevel || undefined,
      });
      if (!result.success || !result.data) {
        setErrorMessage(result.message || 'Profil gagal disimpan. Coba lagi.');
        return;
      }
      setCurrentUser({ ...currentUser, ...result.data });
      setSaved(true);
    } catch {
      setErrorMessage('Profil gagal disimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Profil Peserta"
      subtitle="Lengkapi data yang panitia perlukan untuk memeriksa pendaftaran kamu."
    >
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data akun</CardTitle>
            <p className="text-sm text-muted-foreground">
              Status pendidikan dikunci setelah pendaftaran pertama. Untuk koreksi, hubungi super admin.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>Profil belum tersimpan</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
                <div
                  aria-hidden="true"
                  className="flex size-14 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-xl font-bold text-primary"
                >
                  {currentUser.full_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="break-words text-base font-bold text-foreground">
                    {currentUser.full_name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="primary">{ROLE_LABELS[currentUser.role]}</Badge>
                    <span className="break-all text-sm text-muted-foreground">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              <Input
                label="Nama lengkap"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                helperText="Gunakan nama yang akan dicantumkan pada sertifikat."
              />
              <Input
                label="Alamat email"
                disabled
                value={currentUser.email}
                helperText="Email akun tidak dapat diubah dari halaman profil."
              />
              <Input
                label="Asal sekolah, kampus, atau instansi"
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
              />
              <Input
                label="Nomor WhatsApp"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />

              <div className="space-y-1.5">
                <label htmlFor="education-level" className="block text-sm font-medium text-foreground">
                  Status pendidikan
                </label>
                <select
                  id="education-level"
                  required
                  value={educationLevel}
                  disabled={profile.hasRegistrations}
                  onChange={(event) => {
                    const selected = educationOptions.find((option) => option.value === event.target.value);
                    setEducationLevel(selected?.value || '');
                  }}
                  className="min-h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="" disabled>Pilih status pendidikan</option>
                  {educationOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {profile.hasRegistrations && (
                  <p className="text-sm text-muted-foreground">
                    Status dikunci karena akun ini sudah memiliki pendaftaran lomba.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-success" role="status">
                    <CheckCircle size={17} weight="fill" aria-hidden="true" />
                    Perubahan profil tersimpan.
                  </span>
                )}
                <Button type="submit" variant="primary" className="min-h-11 cursor-pointer sm:ml-auto" isLoading={isSaving}>
                  Simpan profil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {educationLevel === 'mahasiswa' && <KtmDocumentCard verification={profile.ktm} />}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
              Privasi dokumen
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            KTM hanya dapat dibuka peserta pemilik, panitia yang menangani lomba kamu, dan super admin. Juri tidak mendapat akses ke KTM.
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
