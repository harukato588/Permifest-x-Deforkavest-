'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { getKtmDownloadUrlAction, reviewKtmAction } from './actions';
import type { ManagedParticipant } from './queries';
import { CheckCircle, Clock, IdentificationCard, Users, XCircle } from '@phosphor-icons/react';

interface ManagedParticipantsListProps {
  initialParticipants: ManagedParticipant[];
}

function educationLabel(level: string | null): string {
  if (level === 'mahasiswa') return 'Mahasiswa';
  if (level === 'sma_smk') return 'Siswa sekolah';
  if (level === 'umum') return 'Umum';
  return 'Belum diisi';
}

function registrationLabel(status: string): string {
  if (status === 'draft') return 'Draf';
  if (status === 'registered') return 'Terdaftar';
  if (status === 'cancelled') return 'Dibatalkan';
  if (status === 'disqualified') return 'Didiskualifikasi';
  return status;
}

export function ManagedParticipantsList({ initialParticipants }: ManagedParticipantsListProps) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [search, setSearch] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('all');
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [busyIdentityId, setBusyIdentityId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const competitions = useMemo(
    () => [...new Map(participants.map((participant) => [
      participant.competitionId,
      participant.competitionName,
    ])).entries()],
    [participants],
  );
  const visibleParticipants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return participants.filter((participant) => {
      const matchesCompetition =
        competitionFilter === 'all' || participant.competitionId === competitionFilter;
      const matchesSearch =
        !term ||
        [participant.fullName, participant.email, participant.institution]
          .some((value) => value.toLowerCase().includes(term));
      return matchesCompetition && matchesSearch;
    });
  }, [competitionFilter, participants, search]);

  const handleDownload = async (identityId: string) => {
    setAlert(null);
    setBusyIdentityId(identityId);
    try {
      const result = await getKtmDownloadUrlAction(identityId);
      if (!result.success || !result.url) {
        setAlert({ type: 'error', message: result.error || 'Tautan KTM gagal dibuat.' });
        return;
      }
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch {
      setAlert({ type: 'error', message: 'KTM gagal dibuka. Muat ulang halaman lalu coba lagi.' });
    } finally {
      setBusyIdentityId(null);
    }
  };

  const handleReview = async (
    participant: ManagedParticipant,
    decision: 'verified' | 'rejected',
  ) => {
    if (!participant.ktm) return;

    const note = rejectionNotes[participant.ktm.id] || '';
    setAlert(null);
    setBusyIdentityId(participant.ktm.id);
    try {
      const result = await reviewKtmAction({
        identityVerificationId: participant.ktm.id,
        registrationId: participant.registrationId,
        decision,
        note: decision === 'rejected' ? note : undefined,
      });
      if (!result.success) {
        setAlert({ type: 'error', message: result.error || 'Status KTM gagal diperbarui.' });
        return;
      }

      setParticipants((current) => current.map((item) =>
        item.userId === participant.userId && item.ktm
          ? {
              ...item,
              ktm: {
                ...item.ktm,
                status: decision,
                note: decision === 'rejected' ? note.trim() : null,
              },
            }
          : item,
      ));
      setAlert({ type: 'success', message: result.message || 'Pemeriksaan KTM tersimpan.' });
    } catch {
      setAlert({ type: 'error', message: 'Pemeriksaan KTM gagal disimpan. Coba lagi.' });
    } finally {
      setBusyIdentityId(null);
    }
  };

  const handleReject = async (
    event: FormEvent<HTMLFormElement>,
    participant: ManagedParticipant,
  ) => {
    event.preventDefault();
    await handleReview(participant, 'rejected');
  };

  return (
    <div className="space-y-5">
      {alert && (
        <Alert variant={alert.type === 'success' ? 'success' : 'destructive'} role="status">
          <AlertTitle>{alert.type === 'success' ? 'Perubahan tersimpan' : 'Aksi gagal'}</AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Cari peserta"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nama, email, atau instansi"
        />
        <div className="space-y-1.5">
          <label htmlFor="competition-filter" className="block text-sm font-medium text-foreground">
            Cabang lomba
          </label>
          <select
            id="competition-filter"
            value={competitionFilter}
            onChange={(event) => setCompetitionFilter(event.target.value)}
            className="min-h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <option value="all">Semua cakupan</option>
            {competitions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {participants.length === 0 ? (
        <EmptyState
          icon={<Users size={28} weight="duotone" className="text-primary" />}
          title="Belum ada pendaftaran peserta"
          description="Peserta yang mendaftar pada lomba dalam cakupanmu akan muncul di sini."
        />
      ) : visibleParticipants.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground" role="status">
          Tidak ada peserta yang cocok dengan pencarian atau filter ini.
        </p>
      ) : (
        <ul className="space-y-3">
          {visibleParticipants.map((participant) => (
            <li key={participant.registrationId} className="rounded-lg border border-border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-base font-semibold text-foreground">
                      {participant.fullName || 'Nama belum diisi'}
                    </h2>
                    <Badge variant="neutral">{registrationLabel(participant.registrationStatus)}</Badge>
                    <Badge variant="info">{participant.competitionName}</Badge>
                  </div>
                  <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="break-all text-foreground">{participant.email || 'Belum diisi'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Instansi</dt>
                      <dd className="break-words text-foreground">{participant.institution || 'Belum diisi'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Status pendidikan</dt>
                      <dd className="text-foreground">{educationLabel(participant.educationLevel)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Nomor kontak</dt>
                      <dd className="break-all text-foreground">{participant.phone || 'Belum diisi'}</dd>
                    </div>
                  </dl>
                </div>
                {participant.ktm && (
                  <div className="w-full space-y-3 border-t border-border pt-4 lg:max-w-sm lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <IdentificationCard size={18} aria-hidden="true" />
                        KTM
                      </span>
                      <Badge variant={
                        participant.ktm.status === 'verified'
                          ? 'success'
                          : participant.ktm.status === 'rejected'
                            ? 'destructive'
                            : 'warning'
                      }>
                        {participant.ktm.status === 'verified'
                          ? 'Diterima'
                          : participant.ktm.status === 'rejected'
                            ? 'Ditolak'
                            : 'Menunggu'}
                      </Badge>
                    </div>
                    {participant.ktm.note && (
                      <p className="break-words text-sm text-muted-foreground">
                        Alasan: {participant.ktm.note}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full cursor-pointer"
                      disabled={busyIdentityId === participant.ktm.id}
                      isLoading={busyIdentityId === participant.ktm.id}
                      onClick={() => handleDownload(participant.ktm!.id)}
                    >
                      Buka KTM
                    </Button>
                    {participant.ktm.status === 'pending' && (
                      <form className="space-y-3" onSubmit={(event) => handleReject(event, participant)}>
                        <label htmlFor={`reject-note-${participant.ktm.id}`} className="block text-sm font-medium text-foreground">
                          Alasan penolakan
                        </label>
                        <textarea
                          id={`reject-note-${participant.ktm.id}`}
                          value={rejectionNotes[participant.ktm.id] || ''}
                          onChange={(event) => setRejectionNotes((current) => ({
                            ...current,
                            [participant.ktm!.id]: event.target.value,
                          }))}
                          minLength={10}
                          maxLength={500}
                          rows={3}
                          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          aria-describedby={`reject-note-help-${participant.ktm.id}`}
                        />
                        <p id={`reject-note-help-${participant.ktm.id}`} className="text-sm text-muted-foreground">
                          Wajib diisi minimal 10 karakter jika KTM ditolak.
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            variant="primary"
                            className="min-h-11 flex-1 cursor-pointer"
                            disabled={busyIdentityId === participant.ktm.id}
                            isLoading={busyIdentityId === participant.ktm.id}
                            leftIcon={<CheckCircle size={17} aria-hidden="true" />}
                            onClick={() => handleReview(participant, 'verified')}
                          >
                            Terima KTM
                          </Button>
                          <Button
                            type="submit"
                            variant="destructive"
                            className="min-h-11 flex-1 cursor-pointer"
                            disabled={
                              busyIdentityId === participant.ktm.id ||
                              (rejectionNotes[participant.ktm.id] || '').trim().length < 10
                            }
                            leftIcon={<XCircle size={17} aria-hidden="true" />}
                          >
                            Tolak KTM
                          </Button>
                        </div>
                      </form>
                    )}
                    {participant.ktm.status === 'verified' && (
                      <p className="flex items-center gap-2 text-sm text-success" role="status">
                        <CheckCircle size={17} weight="fill" aria-hidden="true" />
                        KTM sudah diperiksa.
                      </p>
                    )}
                    {participant.ktm.status === 'rejected' && (
                      <p className="flex items-center gap-2 text-sm text-destructive" role="status">
                        <Clock size={17} aria-hidden="true" />
                        Menunggu unggahan ulang dari peserta.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
