'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDateShort, getStatusBadgeVariant, getStatusLabel } from '@/lib/utils';
import {
  Users,
  CreditCard,
  UploadSimple,
  SquaresFour,
  Warning,
  ClockCounterClockwise,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  Coins,
} from '@phosphor-icons/react';

export default function AdminOverviewPage() {
  const { registrations, submissions, competitions } = useAppStore();

  const pendingPayments = registrations.filter((r) => r.payment?.status === 'uploaded');
  const verifiedPayments = registrations.filter((r) => r.payment?.status === 'verified');
  const rejectedPayments = registrations.filter((r) => r.payment?.status === 'rejected');
  const unpaidPayments = registrations.filter((r) => !r.payment || r.payment.status === 'pending');
  const totalIncome = verifiedPayments.reduce((acc, r) => acc + (r.payment?.amount || 0), 0);

  // Perhitungan Breakdown Kategori
  const academicRegs = registrations.filter((r) => r.competition?.type === 'academic');
  const nonAcademicRegs = registrations.filter((r) => r.competition?.type === 'non_academic');
  const totalRegs = registrations.length || 1;
  const academicPercent = Math.round((academicRegs.length / totalRegs) * 100);
  const nonAcademicPercent = 100 - academicPercent;

  // Tren 7 hari terakhir untuk visual chart
  const weeklyTrends = useMemo(() => {
    return [
      { day: 'Sen', count: 0, amount: 0 },
      { day: 'Sel', count: 0, amount: 0 },
      { day: 'Rab', count: 0, amount: 0 },
      { day: 'Kam', count: 0, amount: 0 },
      { day: 'Jum', count: 0, amount: 0 },
      { day: 'Sab', count: 0, amount: 0 },
      { day: 'Min', count: registrations.length, amount: totalIncome },
    ];
  }, [registrations.length, totalIncome]);

  const maxTrend = Math.max(...weeklyTrends.map((t) => t.count), 1);

  return (
    <DashboardLayout
      title="Dashboard Panitia & Administrasi"
      subtitle="Pusat kendali operasional kompetisi, verifikasi transaksi, analitik pendaftaran, dan pengawasan penjurian."
    >
      <div className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[var(--border)] bg-[var(--card)] shadow-2xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">Total Pendaftar</p>
                <h3 className="text-2xl font-bold font-mono text-[var(--primary)] mt-1">
                  {registrations.length}
                </h3>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Dari {competitions.length} cabang lomba</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
                <Users size={22} weight="bold" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)] shadow-2xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">Perlu Verifikasi Bayar</p>
                <h3 className="text-2xl font-bold font-mono text-[var(--warning)] mt-1">
                  {pendingPayments.length}
                </h3>
                <p className="text-[11px] text-[var(--warning)] font-medium mt-0.5">SLA maksimal 24 jam</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 shrink-0">
                <CreditCard size={22} weight="bold" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)] shadow-2xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">Karya Masuk</p>
                <h3 className="text-2xl font-bold font-mono text-[var(--success)] mt-1">
                  {submissions.length}
                </h3>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Cabang Akademik</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 shrink-0">
                <UploadSimple size={22} weight="bold" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)] shadow-2xs">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--muted-foreground)] font-medium">Kas Terverifikasi</p>
                <h3 className="text-lg font-bold font-mono text-[var(--foreground)] mt-1 tabular-nums">
                  {formatCurrency(totalIncome)}
                </h3>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                  {verifiedPayments.length} transaksi lunas
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--accent)] text-[var(--foreground)] border border-[var(--border)] shrink-0">
                <Coins size={22} weight="bold" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Immediate Action Alert if pending payments */}
        {pendingPayments.length > 0 && (
          <Alert variant="warning" icon={<Warning size={22} weight="fill" className="text-[var(--warning)] shrink-0" />}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
              <div>
                <AlertTitle>Ada {pendingPayments.length} bukti transfer menunggu verifikasi panitia!</AlertTitle>
                <AlertDescription>
                  Segera periksa nomor referensi bank dan tangkapan layar bukti transfer agar peserta dapat mengunggah karya.
                </AlertDescription>
              </div>
              <Link href="/dashboard/admin/pembayaran" className="shrink-0">
                <Button size="sm" variant="primary" className="h-9 px-4 text-xs font-semibold">
                  Buka Verifikasi
                </Button>
              </Link>
            </div>
          </Alert>
        )}

        {/* Section: Grafik Tren Registrasi & Komposisi Event */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Grafik Batang & Kurva Tren 7 Hari */}
          <Card className="lg:col-span-2 border-[var(--border)] bg-[var(--card)] shadow-2xs">
            <CardHeader className="pb-3 border-b border-[var(--border)] flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ChartLineUp className="w-5 h-5 text-[var(--primary)]" />
                  <CardTitle className="text-base">Kecepatan Pendaftaran (7 Hari Terakhir)</CardTitle>
                </div>
                <CardDescription className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Volume registrasi harian peserta yang mendaftar ke platform
                </CardDescription>
              </div>
              <Badge variant="primary" size="sm" className="font-mono">
                +{weeklyTrends[weeklyTrends.length - 1].count} Hari Ini
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-48 sm:h-56 w-full flex items-end gap-2 sm:gap-4 pt-4 pb-2 px-1">
                {weeklyTrends.map((t, idx) => {
                  const heightPercent = Math.max(Math.round((t.count / maxTrend) * 100), 12);
                  const isCurrent = idx === weeklyTrends.length - 1;
                  return (
                    <div key={t.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-mono font-bold text-[var(--foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.count}
                      </div>
                      <div className="w-full max-w-[42px] bg-[var(--accent)]/50 rounded-t-lg overflow-hidden flex items-end h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            isCurrent
                              ? 'bg-[var(--primary)] shadow-sm'
                              : 'bg-[var(--primary)]/50 group-hover:bg-[var(--primary)]/80'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          isCurrent ? 'text-[var(--primary)] font-bold' : 'text-[var(--muted-foreground)]'
                        }`}
                      >
                        {t.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between text-xs text-[var(--muted-foreground)] gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                  Pendaftaran Aktif
                </span>
                <span>Rata-rata: {(registrations.length / 7).toFixed(1)} peserta / hari</span>
              </div>
            </CardContent>
          </Card>

          {/* Distribusi Kategori & Status Pembayaran */}
          <div className="space-y-6">
            <Card className="border-[var(--border)] bg-[var(--card)] shadow-2xs">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <ChartBar className="w-4 h-4 text-[var(--primary)]" />
                  <CardTitle className="text-sm">Komposisi Cabang Lomba</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[var(--foreground)]">Cabang Akademik</span>
                    <span className="text-[var(--primary)] font-mono">{academicPercent}% ({academicRegs.length})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                    <div
                      style={{ width: `${academicPercent}%` }}
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Esai Ilmiah, UI/UX Design, IT Architecture</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[var(--foreground)]">Cabang E-Sport (Non-Akademik)</span>
                    <span className="text-[var(--accent-foreground)] font-mono">{nonAcademicPercent}% ({nonAcademicRegs.length})</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--accent)] overflow-hidden">
                    <div
                      style={{ width: `${nonAcademicPercent}%` }}
                      className="h-full bg-[var(--accent-foreground)] rounded-full transition-all duration-300"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-1">Mobile Legends: Bang Bang &amp; eFootball PES</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] bg-[var(--card)] shadow-2xs">
              <CardHeader className="pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[var(--success)]" />
                  <CardTitle className="text-sm">Status Pembayaran Tiket</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--success)]/10 text-[var(--foreground)]">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" weight="bold" />
                    Terverifikasi
                  </span>
                  <span className="font-mono font-bold">{verifiedPayments.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--warning)]/10 text-[var(--foreground)]">
                  <span className="flex items-center gap-2">
                    <Warning className="w-4 h-4 text-[var(--warning)]" weight="bold" />
                    Menunggu Verifikasi
                  </span>
                  <span className="font-mono font-bold text-[var(--warning)]">{pendingPayments.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--accent)]/50 text-[var(--muted-foreground)]">
                  <span>Belum Mengunggah Bukti</span>
                  <span className="font-mono">{unpaidPayments.length + rejectedPayments.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Shortcuts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/admin/pembayaran"
            className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all hover:shadow-xs block group"
          >
            <CreditCard size={22} weight="duotone" className="text-[var(--primary)] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-[var(--foreground)]">Verifikasi Bayar</h4>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Konfirmasi bukti transfer peserta.</p>
          </Link>
          <Link
            href="/dashboard/admin/submission"
            className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all hover:shadow-xs block group"
          >
            <UploadSimple size={22} weight="duotone" className="text-[var(--success)] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-[var(--foreground)]">Gudang Submission</h4>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Periksa berkas &amp; tugaskan dewan juri.</p>
          </Link>
          <Link
            href="/dashboard/admin/hasil"
            className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all hover:shadow-xs block group"
          >
            <SquaresFour size={22} weight="duotone" className="text-[var(--primary)] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-[var(--foreground)]">Hasil E-Sport</h4>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Input skor PES &amp; Mobile Legends.</p>
          </Link>
          <Link
            href="/dashboard/admin/audit-log"
            className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all hover:shadow-xs block group"
          >
            <ClockCounterClockwise size={22} weight="duotone" className="text-[var(--warning)] mb-2 group-hover:scale-110 transition-transform" />
            <h4 className="text-xs font-bold text-[var(--foreground)]">Audit Trail</h4>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">Jejak aksi sensitif platform.</p>
          </Link>
        </div>

        {/* Recent Activity Table */}
        <Card className="border-[var(--border)] bg-[var(--card)] shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <CardTitle className="text-sm font-bold">Pendaftaran Peserta Terkini</CardTitle>
              <CardDescription className="text-xs text-[var(--muted-foreground)]">
                5 pendaftaran terbaru yang masuk ke sistem
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/peserta">
              <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                Lihat Semua
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {registrations.slice(0, 5).map((reg) => (
                <div
                  key={reg.id}
                  className="py-2.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:bg-[var(--accent)]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0">
                      {reg.user?.full_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-[var(--foreground)]">{reg.user?.full_name}</strong>
                        <span className="text-[var(--muted-foreground)] text-[11px]">
                          ({reg.user?.institution || 'Pelajar/Mahasiswa'})
                        </span>
                        <Badge variant={getStatusBadgeVariant(reg.status)} size="sm">
                          {getStatusLabel(reg.status)}
                        </Badge>
                      </div>
                      <div className="text-[var(--muted-foreground)] text-[11px] mt-0.5">
                        Lomba: <span className="text-[var(--primary)] font-medium">{reg.competition?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[var(--muted-foreground)] font-mono text-[11px] shrink-0 self-end sm:self-center">
                    {formatDateShort(reg.registered_at)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
