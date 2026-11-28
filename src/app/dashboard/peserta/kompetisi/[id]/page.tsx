'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import {
  Trophy,
  ArrowLeft,
  Users,
  CreditCard,
  UploadSimple,
  ArrowSquareOut,
  IdentificationCard,
  Copy,
} from '@phosphor-icons/react';

function PesertaKompetisiDetailContent() {
  const params = useParams();
  const regId = params?.id as string;
  const { registrations, currentUser } = useAppStore();

  const [copiedCode, setCopiedCode] = React.useState(false);

  const reg = registrations.find((r) => r.id === regId && r.user_id === currentUser.id);

  if (!reg) {
    return (
      <DashboardLayout
        title="Detail Pendaftaran Lomba"
        subtitle="Memuat informasi berkas dan rincian partisipasi kompetisi Anda."
      >
        <EmptyState
          icon={<Trophy size={32} className="text-primary" weight="duotone" />}
          title="Pendaftaran Tidak Ditemukan"
          description="Data pendaftaran kompetisi dengan ID tersebut tidak ditemukan pada akun Anda."
          action={
            <Link href="/dashboard/peserta/kompetisi">
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Kembali ke Daftar Kompetisi
              </Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  const comp = reg.competition;
  const isTeam = comp?.participation_type === 'team';
  const hasSubmission = Boolean(comp?.submission_config.allowedTypes.length);

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <DashboardLayout
      title={`Detail: ${comp?.name || 'Kompetisi'}`}
      subtitle="Pantau rincian formulir pendaftaran, verifikasi administrasi, dan koordinasi tim."
    >
      <div className="space-y-6">
        <Link
          href="/dashboard/peserta/kompetisi"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors font-medium"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Kompetisi Saya</span>
        </Link>

        {/* Ringkasan Header Kompetisi */}
        <Card className="overflow-hidden border-[var(--border)] bg-[var(--card)]">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge status={reg.status} domain="registration" />
                  <Badge variant="primary">{comp?.type === 'academic' ? 'Akademik' : 'E-Sport'}</Badge>
                  <Badge variant="neutral">{isTeam ? 'Beregu / Tim' : 'Individu'}</Badge>
                </div>
                <h3 className="text-2xl font-bold text-[var(--foreground)] font-[family-name:var(--font-bricolage)]">
                  {comp?.name}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Tema: <strong className="text-[var(--foreground)]">{comp?.theme}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-[var(--muted-foreground)] block">Biaya Registrasi</span>
                <span className="text-xl font-bold font-mono text-[var(--primary)] tabular-nums">
                  {formatCurrency(comp?.registration_fee || 0)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 p-4 rounded-xl bg-[var(--accent)]/30 border border-[var(--border)] text-xs">
              <div>
                <span className="text-[var(--muted-foreground)] block text-[11px]">Tanggal Mendaftar:</span>
                <span className="text-[var(--foreground)] font-medium font-mono">{formatDateShort(reg.registered_at)}</span>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block text-[11px]">Status Pembayaran:</span>
                <div className="mt-0.5">
                  {reg.payment ? (
                    <StatusBadge status={reg.payment.status} domain="payment" />
                  ) : (
                    <span className="text-[var(--success-text)] font-medium">Bebas Biaya</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)] block text-[11px]">Format Partisipasi:</span>
                <span className="text-[var(--foreground)] font-medium capitalize">
                  {comp?.participation_type} ({comp?.min_team_size}-{comp?.max_team_size} orang)
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Informasi Tim (Khusus Perlombaan Beregu seperti IT Architecture / Esai Tim) */}
        {isTeam && (
          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-[var(--primary)]" />
                <CardTitle className="text-base">Informasi Roster &amp; Anggota Tim</CardTitle>
              </div>
              <Badge variant="info">Maksimal {comp?.max_team_size} Anggota</Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[var(--muted-foreground)]">Kode Undangan Tim (Invite Code):</div>
                  <div className="font-mono text-base font-bold text-[var(--primary)] mt-0.5 tracking-wider">
                    {reg.team?.invite_code || `PERMI-${reg.id.toUpperCase().slice(-5)}`}
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                    Bagikan kode ini kepada calon rekan tim Anda agar mereka dapat bergabung ke roster ini.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={() => handleCopyInviteCode(reg.team?.invite_code || `PERMI-${reg.id.toUpperCase().slice(-5)}`)}
                >
                  <Copy size={14} />
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                </Button>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Daftar Anggota:
                </span>
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold flex items-center justify-center">
                      {currentUser.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">{currentUser.full_name} (Anda)</div>
                      <span className="text-[11px] text-[var(--muted-foreground)] font-mono">{currentUser.email}</span>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">Kapten Tim</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Formulir yang Diisikan Saat Registrasi */}
        {reg.form_data && Object.keys(reg.form_data).length > 0 && (
          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <IdentificationCard size={20} className="text-[var(--primary)]" />
                <CardTitle className="text-base">Data Isian Formulir Pendaftaran</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(reg.form_data).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-lg bg-[var(--accent)]/20 border border-[var(--border)]">
                    <span className="text-[var(--muted-foreground)] uppercase text-[10px] font-bold block mb-0.5">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-[var(--foreground)] font-mono font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigasi Cepat & CTA Lanjutan */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border)]">
          <Link
            href={`/kompetisi/${comp?.slug}`}
            className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 font-medium"
          >
            <span>Buka Silabus &amp; Buku Panduan Lomba</span>
            <ArrowSquareOut size={14} />
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/peserta/pembayaran">
              <Button size="sm" variant="outline" leftIcon={<CreditCard size={16} />}>
                Status Pembayaran
              </Button>
            </Link>

            {hasSubmission && (
              <Link href="/dashboard/peserta/submission">
                <Button size="sm" variant="primary" leftIcon={<UploadSimple size={16} weight="bold" />}>
                  Kirim Karya / Berkas
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PesertaKompetisiDetailPage() {
  return (
    <React.Suspense fallback={null}>
      <PesertaKompetisiDetailContent />
    </React.Suspense>
  );
}
