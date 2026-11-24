'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppStore } from '@/lib/store';
import { ROLE_LABELS } from '@/lib/constants';
import { CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { updateProfileAction } from '@/features/users/actions';

export default function PesertaProfilPage() {
  const { currentUser, setCurrentUser } = useAppStore();

  const [fullName, setFullName] = useState(currentUser.full_name);
  const [institution, setInstitution] = useState(currentUser.institution || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setErrorMessage(null);
    setIsSaving(true);
    try {
      const result = await updateProfileAction({ fullName, institution, phone });
      if (!result.success || !result.data) {
        setErrorMessage(result.message || 'Profil gagal disimpan. Coba lagi.');
        return;
      }
      setCurrentUser({ ...currentUser, ...result.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setErrorMessage('Profil gagal disimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout 
      title="Profil & Pengaturan Akun" 
      subtitle="Kelola informasi identitas akun peserta, instansi asal, dan nomor kontak aktif."
    >
      <div className="max-w-2xl space-y-6">
        
        <Card>
          <CardHeader>
            <CardTitle>Informasi Profil Peserta</CardTitle>
            <p className="text-xs text-muted-foreground">Data ini akan dicantumkan pada sertifikat keikutsertaan dan rekapitulasi lomba</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive" role="alert">
                  <AlertTitle>Gagal menyimpan profil</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-2xl flex items-center justify-center">
                  {currentUser.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground font-[family-name:var(--font-bricolage)]">{currentUser.full_name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="primary">{ROLE_LABELS[currentUser.role]}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              <Input
                label="Nama Lengkap"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                helperText="Pastikan nama sesuai dengan identitas resmi untuk keperluan sertifikat."
              />

              <Input
                label="Alamat Email (Akun Utama)"
                disabled
                value={currentUser.email}
                helperText="Email tidak dapat diubah setelah terdaftar demi integritas data kompetisi."
              />

              <Input
                label="Asal Sekolah / Universitas / Instansi"
                placeholder="Contoh: Universitas Gadjah Mada / SMK Negeri 2 Yogyakarta"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />

              <Input
                label="Nomor WhatsApp / Kontak Aktif"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                helperText="Digunakan panitia untuk koordinasi teknis pertandingan atau pengumuman darurat."
              />

              <div className="pt-2 flex items-center justify-between">
                {saved && (
                  <span className="text-xs text-[var(--success)] font-semibold flex items-center gap-1">
                    <CheckCircle size={16} weight="fill" />
                    Profil berhasil disimpan!
                  </span>
                )}
                <Button type="submit" variant="primary" className="ml-auto" isLoading={isSaving}>
                  Simpan Perubahan
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Status Verifikasi Identitas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              <span>Verifikasi Identitas &amp; Keamanan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p>
              Akun Anda berstatus <strong className="text-[var(--success)]">Terotentikasi</strong>. Verifikasi identitas peserta (KTM / Kartu Pelajar) bersifat opsional dan hanya diperlukan jika diminta khusus oleh dewan juri cabang lomba terkait.
            </p>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
