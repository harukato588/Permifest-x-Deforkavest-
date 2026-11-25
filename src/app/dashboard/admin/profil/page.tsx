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
import { formatDateShort } from '@/lib/utils';
import { changePasswordAction } from '@/features/auth/actions';
import { updateProfileAction } from '@/features/users/actions';
import { 
  ShieldCheck, 
  Key, 
  ClockCounterClockwise, 
  UserGear,
  Buildings,
  Phone
} from '@phosphor-icons/react';

export default function AdminProfilPage() {
  const { currentUser, setCurrentUser, auditLogs } = useAppStore();

  const [fullName, setFullName] = useState(currentUser.full_name);
  const [institution, setInstitution] = useState(currentUser.institution || '');
  const [phone, setPhone] = useState(currentUser.phone || '');

  // State Ubah Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // State Banner Profil
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Filter aktivitas audit log milik admin ini
  const myAuditLogs = auditLogs
    .filter((log) => log.user_id === currentUser.id || log.user_email === currentUser.email)
    .slice(0, 5);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);
    try {
      const result = await updateProfileAction({ fullName, institution, phone });
      if (!result.success || !result.data) {
        setProfileError(result.message || 'Profil gagal disimpan. Coba lagi.');
        return;
      }
      setCurrentUser({ ...currentUser, ...result.data });
      setProfileSuccess(result.message || 'Perubahan profil berhasil disimpan.');
    } catch {
      setProfileError('Profil gagal disimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsChangingPassword(true);
    try {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.success) {
        setPasswordError(result.message || 'Kata sandi gagal diperbarui. Coba lagi.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(result.message || 'Kata sandi berhasil diperbarui.');
    } catch {
      setPasswordError('Kata sandi gagal diperbarui. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <DashboardLayout
      title="Profil & Otoritas Panitia"
      subtitle="Kelola informasi identitas akun operasional, nomor kontak koordinasi, dan kredensial keamanan sistem."
    >
      <div className="max-w-4xl space-y-6">
        
        {/* Banner Sukses */}
        {profileSuccess && (
          <Alert variant="success" onClose={() => setProfileSuccess(null)}>
            <AlertTitle>Pembaruan Tersimpan</AlertTitle>
            <AlertDescription>{profileSuccess}</AlertDescription>
          </Alert>
        )}
        {profileError && (
          <Alert variant="destructive" onClose={() => setProfileError(null)}>
            <AlertTitle>Gagal menyimpan profil</AlertTitle>
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        )}

        {/* Kartu Ringkasan Akun */}
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-xs">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] font-bold text-2xl flex items-center justify-center shrink-0">
                {currentUser.full_name?.charAt(0) || 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-[family-name:var(--font-bricolage)] text-[var(--foreground)]">
                    {currentUser.full_name}
                  </h3>
                  <Badge variant={currentUser.role === 'super_admin' ? 'destructive' : 'primary'}>
                    <ShieldCheck size={12} weight="fill" className="mr-1 inline" />
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

            <div className="p-3 rounded-xl bg-[var(--muted)]/50 border border-[var(--border)] text-xs space-y-1 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-mono text-[var(--muted-foreground)] font-semibold block">
                Hak Otoritas Sistem:
              </span>
              <span className="text-[var(--foreground)] font-semibold block">
                {currentUser.role === 'super_admin'
                  ? 'Akses Penuh (Full Control & Override)'
                  : 'Operasional & Verifikasi Pembayaran'}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Form Informasi Profil */}
          <Card className="border-[var(--border)] bg-[var(--card)] shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserGear size={18} className="text-primary" />
                Informasi Personal Panitia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <Input
                  label="Nama Lengkap *"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  helperText="Nama resmi yang tercatat pada log audit sistem dan surat keputusan."
                />

                <Input
                  label="Alamat Email Utama (Terkunci)"
                  disabled
                  value={currentUser.email}
                  helperText="Email operasional resmi tidak dapat diubah tanpa persetujuan Super Admin."
                />

                <Input
                  label="Divisi / Lembaga Panitia"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Contoh: Divisi Acara / Bendahara Permifest"
                />

                <Input
                  label="Nomor WhatsApp / Kontak Cepat"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  helperText="Digunakan untuk koordinasi darurat antar-panitia dan verifikator."
                />

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                    Simpan Perubahan Profil
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Form Keamanan & Kata Sandi */}
          <div className="space-y-6">
            <Card className="border-[var(--border)] bg-[var(--card)] shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key size={18} className="text-primary" />
                  Keamanan &amp; Kata Sandi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {passwordError && (
                    <Alert variant="destructive" onClose={() => setPasswordError(null)}>
                      <AlertTitle>Gagal Memperbarui</AlertTitle>
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  {passwordSuccess && (
                    <Alert variant="success" onClose={() => setPasswordSuccess(null)}>
                      <AlertTitle>Kata Sandi Diperbarui</AlertTitle>
                      <AlertDescription>{passwordSuccess}</AlertDescription>
                    </Alert>
                  )}

                  <Input
                    label="Kata Sandi Saat Ini"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />

                  <Input
                    label="Kata Sandi Baru (Min. 8 Karakter)"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />

                  <Input
                    label="Konfirmasi Kata Sandi Baru"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" variant="outline" isLoading={isChangingPassword}>
                      Perbarui Kata Sandi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Riwayat Aktivitas Audit Terakhir Akun Ini */}
            <Card className="border-[var(--border)] bg-[var(--card)] shadow-xs">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClockCounterClockwise size={18} className="text-primary" />
                  Aktivitas Operasional Terakhir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {myAuditLogs.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] italic">
                    Belum ada riwayat aktivitas yang tercatat untuk akun ini.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {myAuditLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-[var(--foreground)] block">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            Target: {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          {formatDateShort(log.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
