'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { registerCompetitionAction } from '@/features/registrations/actions';
import type { Competition } from '@/lib/types';
import type { AuthSessionUser } from '@/lib/auth/types';
import { CheckCircle, PaperPlaneRight } from '@phosphor-icons/react';

interface Props {
  competition: Competition;
  currentUser: AuthSessionUser | null;
  existingRegistrationId: string | null;
}

export function KompetisiRegisterModal({
  competition: comp,
  currentUser,
  existingRegistrationId,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/login?redirect=/kompetisi/${comp.slug}`);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const trimmedTeamName = teamName.trim();
      const result = await registerCompetitionAction({
        competition_id: comp.id,
        form_data: formData,
        team_name: comp.participation_type === 'team' && trimmedTeamName ? trimmedTeamName : undefined,
      });

      if (!result.success) {
        setErrorMessage(result.error ?? 'Pendaftaran gagal. Silakan periksa kembali data Anda.');
        return;
      }

      setSuccessMessage(true);
      setTimeout(() => {
        setModalOpen(false);
        router.push('/dashboard/peserta/pembayaran');
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kegagalan koneksi.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Jika sudah terdaftar
  if (existingRegistrationId) {
    return (
      <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 text-center">
        <CheckCircle className="w-8 h-8 text-[var(--success)] mx-auto mb-2" weight="fill" />
        <div className="text-xs font-bold text-foreground">Anda Sudah Terdaftar!</div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Pendaftaran Anda untuk lomba ini telah tercatat.
        </p>
        <Link href={`/dashboard/peserta/kompetisi/${existingRegistrationId}`} className="block mt-3">
          <Button size="sm" variant="primary" className="w-full">
            Lihat Detail Pendaftaran
          </Button>
        </Link>
      </div>
    );
  }

  // Jika belum login
  if (!currentUser) {
    return (
      <Link href={`/login?redirect=/kompetisi/${comp.slug}`} className="block">
        <Button size="lg" variant="primary" className="w-full justify-center">
          Masuk untuk Mendaftar
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button
        size="lg"
        variant="primary"
        className="w-full justify-center"
        onClick={() => setModalOpen(true)}
      >
        Daftar Sekarang
      </Button>

      {/* Modal Pendaftaran */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Form Pendaftaran: ${comp.name}`}
        description="Lengkapi data pendaftaran berikut dengan benar."
        maxWidth="lg"
      >
        {successMessage ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-[var(--success)] mx-auto" weight="fill" />
            <h4 className="text-lg font-bold text-foreground">Pendaftaran Berhasil Dikirim!</h4>
            <p className="text-xs text-muted-foreground">
              Mengalihkan Anda ke halaman pembayaran untuk konfirmasi...
            </p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
                <AlertTitle>Pendaftaran Gagal</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Info Akun Peserta */}
            <div className="p-3 rounded-lg bg-muted/60 border border-border text-xs space-y-1">
              <span className="text-muted-foreground block text-[10px] uppercase font-mono">
                Pendaftar:
              </span>
              <div className="font-semibold text-primary">
                {currentUser.full_name} ({currentUser.email})
              </div>
            </div>

            {/* Nama Tim jika kompetisi beregu */}
            {comp.participation_type === 'team' && (
              <Input
                label="Nama Tim *"
                type="text"
                placeholder="Contoh: Tim Garuda Siber"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            )}

            {/* Field Dinamis */}
            {comp.form_fields.map((field) => (
              <div key={field.id} className="space-y-1">
                {field.type === 'select' ? (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <select
                      required={field.required}
                      value={(formData[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Pilih Opsi...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <Input
                    label={field.label}
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={(formData[field.id] as string) || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            {/* Rincian Biaya */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
              <span className="text-foreground">Total Biaya Pendaftaran:</span>
              <span className="text-primary font-bold font-mono text-sm">
                {formatCurrency(comp.registration_fee)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
                rightIcon={<PaperPlaneRight className="w-4 h-4" weight="bold" />}
              >
                Konfirmasi &amp; Lanjut Bayar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
