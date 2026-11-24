'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppStore } from '@/lib/store';
import type { AppRole } from '@/lib/auth/types';
import type { ManagedUser, RoleCompetitionOption } from './queries';
import {
  grantUserRoleAction,
  revokeUserRoleAction,
  updateEducationLevelAsAdminAction,
} from './actions';
import { ShieldCheck, UserPlus, Users } from '@phosphor-icons/react';

interface ManagedUsersPanelProps {
  initialUsers: ManagedUser[];
  competitions: RoleCompetitionOption[];
}

const roleOptions: Array<{ value: 'juri' | 'panitia' | 'super_admin'; label: string }> = [
  { value: 'juri', label: 'Juri' },
  { value: 'panitia', label: 'Panitia' },
  { value: 'super_admin', label: 'Super admin' },
];

const educationOptions = [
  { value: 'mahasiswa', label: 'Mahasiswa' },
  { value: 'sma_smk', label: 'Siswa sekolah' },
  { value: 'umum', label: 'Umum' },
] as const;

const roleLabels: Record<AppRole, string> = {
  peserta: 'Peserta',
  juri: 'Juri',
  panitia: 'Panitia',
  super_admin: 'Super admin',
};

function roleBadgeVariant(role: AppRole): 'neutral' | 'info' | 'cyber' | 'primary' {
  if (role === 'super_admin') return 'primary';
  if (role === 'panitia') return 'info';
  if (role === 'juri') return 'cyber';
  return 'neutral';
}

function educationLabel(level: string | null): string {
  return educationOptions.find((option) => option.value === level)?.label || 'Belum diisi';
}

export function ManagedUsersPanel({ initialUsers, competitions }: ManagedUsersPanelProps) {
  const router = useRouter();
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'juri' | 'panitia' | 'super_admin'>('juri');
  const [competitionId, setCompetitionId] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) =>
      !term || [user.fullName, user.email, user.institution].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [search, users]);

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const handleGrantRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) {
      setAlert({ type: 'error', message: 'Pilih akun yang sudah terdaftar.' });
      return;
    }

    setAlert(null);
    setBusy(true);
    try {
      const result = await grantUserRoleAction({
        userId: selectedUserId,
        role: selectedRole,
        competitionId: selectedRole === 'super_admin' ? undefined : competitionId || undefined,
      });
      if (!result.success) {
        setAlert({ type: 'error', message: result.error || 'Peran gagal diberikan.' });
        return;
      }
      setAlert({ type: 'success', message: result.message || 'Peran berhasil diberikan.' });
      router.refresh();
    } catch {
      setAlert({ type: 'error', message: 'Peran gagal diberikan. Muat ulang halaman lalu coba lagi.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeRole = async (assignmentId: string, label: string) => {
    if (!window.confirm(`Cabut peran ${label} dari akun ini?`)) return;
    setAlert(null);
    setBusy(true);
    try {
      const result = await revokeUserRoleAction({ userRoleId: assignmentId });
      if (!result.success) {
        setAlert({ type: 'error', message: result.error || 'Peran gagal dicabut.' });
        return;
      }
      setUsers((current) => current.map((user) => ({
        ...user,
        roles: user.roles.filter((role) => role.assignmentId !== assignmentId),
      })));
      setAlert({ type: 'success', message: result.message || 'Peran berhasil dicabut.' });
      router.refresh();
    } catch {
      setAlert({ type: 'error', message: 'Peran gagal dicabut. Muat ulang halaman lalu coba lagi.' });
    } finally {
      setBusy(false);
    }
  };

  const handleEducationUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId || !educationLevel) {
      setAlert({ type: 'error', message: 'Pilih akun dan status pendidikan terlebih dahulu.' });
      return;
    }

    setAlert(null);
    setBusy(true);
    try {
      const result = await updateEducationLevelAsAdminAction({
        userId: selectedUserId,
        educationLevel,
      });
      if (!result.success) {
        setAlert({ type: 'error', message: result.error || 'Status pendidikan gagal diubah.' });
        return;
      }
      setUsers((current) => current.map((user) =>
        user.id === selectedUserId ? { ...user, educationLevel } : user,
      ));
      setAlert({ type: 'success', message: result.message || 'Status pendidikan berhasil diubah.' });
      router.refresh();
    } catch {
      setAlert({ type: 'error', message: 'Status pendidikan gagal diubah. Muat ulang halaman lalu coba lagi.' });
    } finally {
      setBusy(false);
    }
  };

  const selectedUserCanChange = Boolean(selectedUser && selectedUser.id !== currentUser.id);

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'success' ? 'success' : 'destructive'} role="status">
          <AlertTitle>{alert.type === 'success' ? 'Perubahan tersimpan' : 'Aksi gagal'}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <section className="rounded-lg border border-border bg-card p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <UserPlus size={19} aria-hidden="true" />
          Berikan peran kerja
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pendaftaran akun otomatis memberi peran peserta. Peran juri dan panitia dibatasi per lomba.
        </p>
        <form onSubmit={handleGrantRole} className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="role-user" className="block text-sm font-medium text-foreground">Akun</label>
            <select
              id="role-user"
              required
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                setEducationLevel('');
              }}
              className="min-h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="" disabled>Pilih akun terdaftar</option>
              {users.map((user) => (
                <option key={user.id} value={user.id} disabled={user.id === currentUser.id}>
                  {user.fullName || user.email || user.id}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="role-to-grant" className="block text-sm font-medium text-foreground">Peran</label>
            <select
              id="role-to-grant"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as 'juri' | 'panitia' | 'super_admin')}
              className="min-h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          {selectedRole !== 'super_admin' && (
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="role-competition" className="block text-sm font-medium text-foreground">Cakupan lomba</label>
              <select
                id="role-competition"
                required
                value={competitionId}
                onChange={(event) => setCompetitionId(event.target.value)}
                className="min-h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <option value="" disabled>Pilih lomba</option>
                {competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>{competition.name}</option>
                ))}
              </select>
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            className="min-h-11 cursor-pointer md:col-span-2 md:justify-self-start"
            disabled={busy || !selectedUserCanChange || (selectedRole !== 'super_admin' && !competitionId)}
            isLoading={busy}
          >
            Berikan peran
          </Button>
        </form>

        <form onSubmit={handleEducationUpdate} className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <p className="text-sm font-medium text-foreground">Koreksi status pendidikan</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Peserta tidak dapat mengubah status setelah mendaftar.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="admin-education-level" className="block text-sm font-medium text-foreground">Status pendidikan baru</label>
            <select
              id="admin-education-level"
              required
              value={educationLevel}
              onChange={(event) => setEducationLevel(event.target.value)}
              className="min-h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="" disabled>Pilih status</option>
              {educationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            variant="outline"
            className="min-h-11 cursor-pointer"
            disabled={busy || !selectedUserCanChange || !educationLevel}
            isLoading={busy}
          >
            Simpan status
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Users size={19} aria-hidden="true" />
              Akun terdaftar
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Perubahan peran tercatat di audit log. Pengguna tidak dapat mengubah perannya sendiri.
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <Input
              label="Cari akun"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nama, email, atau instansi"
            />
          </div>
        </div>

        {users.length === 0 ? (
          <EmptyState
            icon={<Users size={28} weight="duotone" className="text-primary" />}
            title="Belum ada akun peserta"
            description="Akun yang mendaftar akan muncul di sini untuk dikelola super admin."
          />
        ) : visibleUsers.length === 0 ? (
          <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground" role="status">
            Tidak ada akun yang cocok dengan pencarian.
          </p>
        ) : (
          <ul className="space-y-3">
            {visibleUsers.map((user) => (
              <li key={user.id} className="rounded-lg border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-foreground">{user.fullName || 'Nama belum diisi'}</h3>
                      <p className="break-all text-sm text-muted-foreground">{user.email || 'Email belum tersedia'}</p>
                    </div>
                    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div><dt className="text-muted-foreground">Instansi</dt><dd className="break-words text-foreground">{user.institution || 'Belum diisi'}</dd></div>
                      <div><dt className="text-muted-foreground">Kontak</dt><dd className="break-all text-foreground">{user.phone || 'Belum diisi'}</dd></div>
                      <div><dt className="text-muted-foreground">Pendidikan</dt><dd className="text-foreground">{educationLabel(user.educationLevel)}</dd></div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((assignment) => (
                        <div key={assignment.assignmentId} className="flex min-h-11 items-center gap-2 rounded-md border border-border px-2">
                          <Badge variant={roleBadgeVariant(assignment.role)}>{roleLabels[assignment.role]}</Badge>
                          {assignment.competitionName && (
                            <span className="max-w-40 truncate text-sm text-muted-foreground">
                              {assignment.competitionName}
                            </span>
                          )}
                          {assignment.role !== 'peserta' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="min-h-11 cursor-pointer"
                              disabled={busy || user.id === currentUser.id}
                              onClick={() => handleRevokeRole(
                                assignment.assignmentId,
                                `${roleLabels[assignment.role]}${assignment.competitionName ? ` (${assignment.competitionName})` : ''}`,
                              )}
                            >
                              Cabut
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {user.id === currentUser.id && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck size={18} aria-hidden="true" />
                      Akun aktif tidak dapat diubah dari halaman ini.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
