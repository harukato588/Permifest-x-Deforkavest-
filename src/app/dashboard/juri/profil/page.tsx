'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/lib/store';
import { ROLE_LABELS } from '@/lib/constants';
import { updateProfileAction } from '@/features/users/actions';
import { 
  Scales, 
  ShieldCheck, 
  Buildings, 
  Phone, 
  ClipboardText, 
  Certificate,
  Handshake
} from '@phosphor-icons/react';

export default function JuriProfilPage() {
  const { currentUser, setCurrentUser, judgeAssignments, competitions } = useAppStore();

  const [fullName, setFullName] = useState(currentUser.full_name);
  const [institution, setInstitution] = useState(currentUser.institution || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Penugasan juri ini
  const myAssignments = judgeAssignments.filter((a) => a.judge_id === currentUser.id);
  const completedCount = myAssignments.filter((a) => a.status === 'completed' || (a.scores && a.scores.length > 0)).length;
  const pendingCount = myAssignments.length - completedCount;

  // Cabang lomba akademik yang relevan
  const academicComps = competitions.filter((c) => c.type === 'academic');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanner(null);
    setErrorMessage(null);
    setIsSaving(true);
    try {
      const result = await updateProfileAction({ fullName, institution, phone });
      if (!result.success || !result.data) {
        setErrorMessage(result.message || 'Profil gagal disimpan. Coba lagi.');
        return;
      }
      setCurrentUser({ ...currentUser, ...result.data });
      setSavedBanner(result.message || 'Perubahan profil berhasil disimpan.');
    } catch {
      setErrorMessage('Profil gagal disimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Profil & Otoritas Dewan Juri"
      subtitle="Identitas resmi penilai, data kepakaran, dan pakta integritas evaluasi karya peserta."
    >
      <div className="max-w-4xl space-y-6">
        
        {savedBanner && (
          <Alert variant="success" onClose={() => setSavedBanner(null)}>
            <AlertTitle>Perubahan Berhasil Disimpan</AlertTitle>
            <AlertDescription>{savedBanner}</AlertDescription>
          </Alert>
        )}
        {errorMessage && (
          <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
            <AlertTitle>Gagal menyimpan profil</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Kartu Profil Utama Juri */}
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-xs">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] font-bold text-2xl flex items-center justify-center shrink-0">
                {currentUser.full_name?.charAt(0) || 'J'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-[family-name:var(--font-bricolage)] text-[var(--foreground)]">
                    {currentUser.full_name}
                  </h3>
                  <Badge variant="primary">
                    <Scales size={12} weight="fill" className="mr-1 inline" />
                    {ROLE_LABELS[currentUser.role]}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--muted-foreground)] font-mono mt-0.5">
                  {currentUser.email}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <Buildings size={13} /> {institution}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={13} /> {phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistik Cepat */}
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <div className="p-3 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)] text-center">
                <span className="text-[10px] uppercase font-mono text-[var(--muted-foreground)] block">Karya Dinilai</span>
                <span className="text-lg font-bold font-mono text-[var(--foreground)]">{completedCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)] text-center">
                <span className="text-[10px] uppercase font-mono text-[var(--muted-foreground)] block">Menunggu</span>
                <span className="text-lg font-bold font-mono text-[var(--primary)]">{pendingCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Form Pembaruan Identitas Juri */}
          <Card className="border-[var(--border)] bg-[var(--card)] shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Certificate size={18} className="text-primary" />
                Data Kepakaran &amp; Kontak Juri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Nama Lengkap & Gelar Akademik *"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Dr. Ir. Budi Santoso, M.Kom."
                  helperText="Nama ini akan dicantumkan pada lembar pengesahan nilai dan sertifikat dewan juri."
                />

                <Input
                  label="Alamat Email Akun Juri (Terkunci)"
                  disabled
                  value={currentUser.email}
                  helperText="Digunakan untuk otentikasi penilaian rubrik karya."
                />

                <Input
                  label="Asal Universitas / Instansi Pakar *"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: Universitas Gadjah Mada / Industri Kreatif"
                />

                <Input
                  label="Nomor WhatsApp Koordinasi Juri"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 0812-9876-5432"
                  helperText="Untuk koordinasi rapat pleno penentuan juara bersama panitia inti."
                />

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Pakta Integritas Dewan Juri */}
          <div className="space-y-6">
            <Card className="border-[var(--border)] bg-[var(--card)] shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Handshake size={18} className="text-primary" />
                  Pakta Integritas &amp; Kerahasiaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
                <div className="p-3.5 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 text-[var(--foreground)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[var(--primary)]">
                    <ShieldCheck size={16} weight="fill" />
                    <span>Komitmen Penilaian Objektif</span>
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Sebagai Dewan Juri resmi Permifest x Deforkafest 2026, Anda menyatakan:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-[var(--foreground)]/90">
                    <li>Menilai karya peserta secara independen dan profesional murni berdasarkan rubrik kriteria bobot.</li>
                    <li>Bebas dari benturan kepentingan (*conflict of interest*) terhadap peserta atau instansi mana pun.</li>
                    <li>Menjaga kerahasiaan naskah karya peserta sebelum diumumkan secara resmi ke publik.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-[var(--muted-foreground)] block mb-1.5">
                    Bidang Lomba Terdaftar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {academicComps.map((c) => (
                      <Badge key={c.id} variant="neutral" className="text-[10px]">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardText size={18} className="text-primary" />
                  Status Penugasan Terkini
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted-foreground)]">Total Penugasan Karya:</span>
                  <span className="font-mono font-bold text-[var(--foreground)]">{myAssignments.length} karya</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted-foreground)]">Evaluasi Selesai:</span>
                  <span className="font-mono font-bold text-[var(--success)]">{completedCount} karya</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--muted-foreground)]">Karya Menunggu:</span>
                  <span className="font-mono font-bold text-[var(--warning)]">{pendingCount} karya</span>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
