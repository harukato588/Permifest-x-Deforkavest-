'use client';

import React, { useState, useTransition } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { ReasonDialog } from '@/components/ui/reason-dialog';
import { ConfirmDialog } from '@/components/ui/modal';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Registration } from '@/lib/types';
import { getFileDownloadUrl } from '@/lib/supabase/storage-client';
import { isSupabaseLive } from '@/lib/supabase/status';
import { verifyPaymentAction } from '@/features/registrations/actions';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  WarningCircle,
  Clock,
  User,
  Envelope,
  IdentificationCard,
  Buildings,
  Phone,
  PencilSimple,
  Trash,
  CurrencyCircleDollar,
  ArrowSquareOut,
  FileText,
} from '@phosphor-icons/react';

export default function AdminPembayaranPage() {
  const { registrations, verifyPayment, updatePaymentAmount, deleteRegistration } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [activeRegId, setActiveRegId] = useState<string | null>(null);
  const [reviewDrawerReg, setReviewDrawerReg] = useState<Registration | null>(null);
  const [proofResolution, setProofResolution] = useState<{ rawUrl: string; url: string | null } | null>(null);
  const [isProofPending, startProofTransition] = useTransition();
  const [approveConfirmReg, setApproveConfirmReg] = useState<Registration | null>(null);
  const [deleteConfirmReg, setDeleteConfirmReg] = useState<Registration | null>(null);
  const [editAmountReg, setEditAmountReg] = useState<Registration | null>(null);
  const [newAmountInput, setNewAmountInput] = useState<number>(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const closeReviewDrawer = () => {
    setReviewDrawerReg(null);
    setProofResolution(null);
  };

  const rawProofUrl = reviewDrawerReg?.payment?.proof_url ?? null;
  const directProofUrl =
    rawProofUrl?.startsWith('http://') || rawProofUrl?.startsWith('https://')
      ? rawProofUrl
      : null;
  const proofSignedUrl = directProofUrl ??
    (proofResolution?.rawUrl === rawProofUrl ? proofResolution.url : null);
  const loadingProof = Boolean(
    rawProofUrl && !directProofUrl &&
    (isProofPending || proofResolution?.rawUrl !== rawProofUrl)
  );

  React.useEffect(() => {
    if (!rawProofUrl || directProofUrl) return;
    let isCancelled = false;
    startProofTransition(async () => {
      let resolvedUrl: string | null = null;
      try {
        const res = await getFileDownloadUrl('payment-proofs', rawProofUrl, { expiresInSeconds: 1800 });
        if (res.success && res.url) resolvedUrl = res.url;
      } finally {
        if (!isCancelled) {
          setProofResolution({ rawUrl: rawProofUrl, url: resolvedUrl });
        }
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [rawProofUrl, directProofUrl, startProofTransition]);

  const registrationsWithPayment = registrations.filter((r) => r.payment);

  const filtered = registrationsWithPayment.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.payment?.status === filterStatus;
  });

  // Statistik ringkasan
  const pendingCount = registrationsWithPayment.filter((r) => r.payment?.status === 'uploaded').length;
  const verifiedCount = registrationsWithPayment.filter((r) => r.payment?.status === 'verified').length;
  const rejectedCount = registrationsWithPayment.filter((r) => r.payment?.status === 'rejected').length;
  const totalVerifiedAmount = registrationsWithPayment
    .filter((r) => r.payment?.status === 'verified')
    .reduce((sum, r) => sum + (r.payment?.amount || 0), 0);

  const handleApproveConfirm = async () => {
    if (!approveConfirmReg) return;
    if (isSupabaseLive() && approveConfirmReg.payment?.id) {
      await verifyPaymentAction({
        payment_id: approveConfirmReg.payment.id,
        action: 'approve',
      });
    }
    await verifyPayment(approveConfirmReg.id, 'verified');
    setAlertSuccess(`Pembayaran ${approveConfirmReg.user?.full_name} berhasil disetujui! Status pendaftaran kini Terverifikasi.`);
    if (reviewDrawerReg?.id === approveConfirmReg.id) {
      closeReviewDrawer();
    }
    setApproveConfirmReg(null);
  };

  const openRejectDialog = (regId: string) => {
    setActiveRegId(regId);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!activeRegId) return;
    if (isSupabaseLive()) {
      const reg = registrations.find((r) => r.id === activeRegId);
      if (reg?.payment?.id) {
        await verifyPaymentAction({
          payment_id: reg.payment.id,
          action: 'reject',
          reject_reason: reason,
        });
      }
    }
    await verifyPayment(activeRegId, 'rejected', reason);
    if (reviewDrawerReg?.id === activeRegId) {
      closeReviewDrawer();
    }
    setActiveRegId(null);
    setAlertSuccess('Pembayaran telah ditolak. Alasan penolakan telah dicatat dan terkirim ke peserta.');
  };

  const handleSaveAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAmountReg) return;
    await updatePaymentAmount(editAmountReg.id, newAmountInput);
    setAlertSuccess(`Nominal tagihan untuk ${editAmountReg.user?.full_name} berhasil diubah menjadi ${formatCurrency(newAmountInput)}.`);
    setEditAmountReg(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmReg) return;
    await deleteRegistration(deleteConfirmReg.id);
    if (reviewDrawerReg?.id === deleteConfirmReg.id) {
      closeReviewDrawer();
    }
    setAlertSuccess(`Data transaksi pembayaran ${deleteConfirmReg.user?.full_name} telah dihapus.`);
    setDeleteConfirmReg(null);
  };

  const columns: Column<Registration & Record<string, unknown>>[] = [
    {
      key: 'peserta',
      header: 'Peserta & Kontak',
      sortable: true,
      accessor: (r) => r.user?.full_name || '',
      cell: (r) => (
        <div>
          <div className="font-bold text-[var(--foreground)]">{r.user?.full_name}</div>
          <div className="text-[11px] text-[var(--muted-foreground)] font-mono">{r.user?.email}</div>
          <div className="text-[10px] text-[var(--muted-foreground)]">{r.user?.institution || '-'}</div>
        </div>
      ),
    },
    {
      key: 'competition',
      header: 'Kompetisi',
      sortable: true,
      accessor: (r) => r.competition?.name || '',
      cell: (r) => <Badge variant="primary">{r.competition?.name}</Badge>,
    },
    {
      key: 'amount',
      header: 'Nominal',
      sortable: true,
      accessor: (r) => r.payment?.amount || 0,
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-[var(--foreground)] tabular-nums">
            {formatCurrency(r.payment?.amount || 0)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditAmountReg(r);
              setNewAmountInput(r.payment?.amount || 0);
            }}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
            title="Edit Nominal Tagihan"
          >
            <PencilSimple className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Pembayaran',
      sortable: true,
      accessor: (r) => r.payment?.status || '',
      cell: (r) => (
        <div className="space-y-1">
          <StatusBadge status={r.payment?.status || 'pending'} domain="payment" />
          {r.payment?.status === 'rejected' && r.payment?.rejection_reason && (
            <p className="text-[10px] text-[var(--destructive)] truncate max-w-[160px]" title={r.payment.rejection_reason}>
              {r.payment.rejection_reason}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Waktu Transaksi',
      sortable: true,
      accessor: (r) => r.payment?.uploaded_at || r.registered_at,
      cell: (r) => (
        <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
          {formatDateShort(r.payment?.uploaded_at || r.registered_at)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Aksi',
      className: 'text-right',
      cell: (r) => {
        const payment = r.payment;
        const isVerified = payment?.status === 'verified';
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReviewDrawerReg(r)}
              className="h-8 w-8 p-0 text-[var(--foreground)] hover:bg-[var(--accent)]"
              title="Review Bukti & Detail Pembayaran"
              aria-label="Review Pembayaran"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {!isVerified && payment?.proof_url && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setApproveConfirmReg(r)}
                className="h-8 w-8 p-0 text-[var(--success)] hover:bg-[var(--success)]/10"
                title="Setujui Pembayaran Langsung"
                aria-label="Setujui Pembayaran"
              >
                <CheckCircle className="w-4 h-4" weight="bold" />
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteConfirmReg(r)}
              className="h-8 w-8 p-0 text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
              title="Hapus Data Transaksi"
              aria-label="Hapus Transaksi"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout
      title="Verifikasi Pembayaran & Rekapitulasi Kas"
      subtitle="Periksa keabsahan transfer dana, resi QRIS, sesuaikan nominal, dan kelola mutasi biaya pendaftaran."
    >
      <div className="space-y-6">
        {alertSuccess && (
          <Alert variant="success" onClose={() => setAlertSuccess(null)}>
            <AlertTitle>Operasi Berhasil</AlertTitle>
            <AlertDescription>{alertSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Ringkasan Statistik Finansial */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Transaksi"
            value={registrationsWithPayment.length}
            icon={<CreditCard className="w-5 h-5 text-[var(--primary)]" weight="bold" />}
            description="Semua tagihan terdaftar"
          />
          <StatCard
            title="Perlu Review"
            value={pendingCount}
            icon={<Clock className="w-5 h-5 text-[var(--warning-text)]" weight="bold" />}
            description="Menunggu verifikasi bukti"
          />
          <StatCard
            title="Terverifikasi"
            value={verifiedCount}
            icon={<CheckCircle className="w-5 h-5 text-[var(--success-text)]" weight="bold" />}
            description="Pembayaran sah & lunas"
          />
          <StatCard
            title="Total Dana Masuk"
            value={formatCurrency(totalVerifiedAmount)}
            icon={<CurrencyCircleDollar className="w-5 h-5 text-[var(--primary)]" weight="bold" />}
            description="Kas pembayaran disetujui"
          />
        </div>

        {/* Filter status & total counter */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--card)] border border-[var(--border)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--muted-foreground)] mr-1">Filter Status:</span>
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'uploaded', label: `Perlu Review (${pendingCount})` },
              { id: 'verified', label: `Terverifikasi (${verifiedCount})` },
              { id: 'rejected', label: `Ditolak (${rejectedCount})` },
              { id: 'pending', label: 'Belum Unggah' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-colors min-h-[36px] ${
                  filterStatus === st.id
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'bg-[var(--accent)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] border border-[var(--border)]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-[var(--muted-foreground)] font-mono">
            Tampil: <strong className="text-[var(--foreground)]">{filtered.length}</strong> entri
          </div>
        </div>

        {/* Tabel Data Pembayaran */}
        <DataTable
          data={filtered as (Registration & Record<string, unknown>)[]}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Cari nama peserta, email, kampus..."
          searchableKeys={['id', 'status', 'registered_at']}
          exportFilename="transaksi_pembayaran_permifest"
          onRowClick={(item) => setReviewDrawerReg(item as Registration)}
          emptyTitle="Tidak Ada Data Transaksi"
          emptyDescription="Tidak ditemukan pembayaran pendaftaran dengan kriteria filter yang Anda pilih."
        />

        {/* PaymentReviewPanel Drawer */}
        <Drawer
          isOpen={!!reviewDrawerReg}
          onClose={closeReviewDrawer}
          size="xl"
        >
          {reviewDrawerReg && (
            <>
              <DrawerHeader>
                <div className="flex items-center gap-2">
                  <DrawerTitle>Review Bukti Pembayaran</DrawerTitle>
                  <StatusBadge status={reviewDrawerReg.payment?.status || 'pending'} domain="payment" />
                </div>
                <DrawerDescription>ID Registrasi: {reviewDrawerReg.id}</DrawerDescription>
              </DrawerHeader>

              <DrawerContent className="space-y-6">
                {/* Pratinjau Resi Bukti Transfer Besar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                      Bukti Transfer / Resi QRIS
                    </span>
                    {proofSignedUrl && (
                      <a href={proofSignedUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">
                        <span>Buka Tab Baru</span>
                        <ArrowSquareOut className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {loadingProof ? (
                    <div className="p-8 border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--accent)]/10 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin text-[var(--primary)]" />
                      <span>Memuat tautan aman berkas dari Supabase Storage...</span>
                    </div>
                  ) : reviewDrawerReg.payment?.proof_url ? (
                    (() => {
                      const fileName = reviewDrawerReg.payment.proof_name || reviewDrawerReg.payment.proof_url;
                      const isPdf = fileName.toLowerCase().endsWith('.pdf');

                      if (isPdf) {
                        return (
                          <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--card)] p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="truncate">
                                <div className="font-bold text-xs text-[var(--foreground)] truncate">{fileName}</div>
                                <span className="text-[11px] text-[var(--muted-foreground)]">Dokumen PDF Terverifikasi</span>
                              </div>
                            </div>
                            {proofSignedUrl ? (
                              <a href={proofSignedUrl} target="_blank" rel="noreferrer" className="block">
                                <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                                  <ArrowSquareOut className="w-4 h-4" />
                                  <span>Buka &amp; Periksa Dokumen PDF</span>
                                </Button>
                              </a>
                            ) : null}
                          </div>
                        );
                      }

                      return (
                        <div className="border border-[var(--border)] rounded-[var(--radius-lg)] bg-[var(--accent)]/20 p-2 flex flex-col items-center justify-center overflow-hidden max-h-[420px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proofSignedUrl || reviewDrawerReg.payment.proof_url}
                            alt="Bukti Transfer Peserta"
                            className="max-w-full max-h-[360px] object-contain rounded-md shadow-sm"
                          />
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-8 border border-dashed border-[var(--border)] rounded-[var(--radius-lg)] text-center text-xs text-[var(--muted-foreground)]">
                      Peserta belum mengunggah berkas bukti transfer pembayaran.
                    </div>
                  )}
                </div>

                {/* Ringkasan Biaya & Status */}
                <div className="bg-[var(--accent)]/30 border border-[var(--border)] rounded-[var(--radius-md)] p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-[var(--border)]/50">
                    <span className="text-[var(--muted-foreground)]">Nominal Tagihan</span>
                    <span className="font-mono font-bold text-base text-[var(--foreground)]">
                      {formatCurrency(reviewDrawerReg.payment?.amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[var(--border)]/50">
                    <span className="text-[var(--muted-foreground)]">Kompetisi</span>
                    <span className="font-semibold text-[var(--foreground)]">{reviewDrawerReg.competition?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[var(--border)]/50">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Waktu Unggah
                    </span>
                    <span className="font-mono text-[var(--foreground)]">
                      {reviewDrawerReg.payment?.uploaded_at ? formatDateShort(reviewDrawerReg.payment.uploaded_at) : '-'}
                    </span>
                  </div>
                  {reviewDrawerReg.payment?.rejection_reason && (
                    <div className="p-3 bg-[var(--destructive-bg)] border border-[var(--destructive-border)] text-[var(--destructive-text)] rounded-md space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <WarningCircle className="w-4 h-4" /> Alasan Penolakan:
                      </div>
                      <p className="text-xs">&quot;{reviewDrawerReg.payment.rejection_reason}&quot;</p>
                    </div>
                  )}
                </div>

                {/* Data Pendaftar */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[var(--primary)]" />
                    Data Pendaftar
                  </span>
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-md)] p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <IdentificationCard className="w-3.5 h-3.5" /> Nama
                      </span>
                      <span className="font-semibold text-[var(--foreground)]">{reviewDrawerReg.user?.full_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <Envelope className="w-3.5 h-3.5" /> Email
                      </span>
                      <span className="font-mono text-[var(--foreground)]">{reviewDrawerReg.user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <Buildings className="w-3.5 h-3.5" /> Kampus / Sekolah
                      </span>
                      <span className="font-medium text-[var(--foreground)]">{reviewDrawerReg.user?.institution || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> No. WhatsApp
                      </span>
                      <span className="font-mono text-[var(--foreground)]">{reviewDrawerReg.user?.phone || '-'}</span>
                    </div>
                  </div>
                </div>
              </DrawerContent>

              <DrawerFooter>
                <div className="flex items-center justify-between w-full gap-2">
                  <Button variant="outline" size="sm" onClick={closeReviewDrawer}>
                    Tutup
                  </Button>

                  <div className="flex items-center gap-2">
                    {reviewDrawerReg.payment?.status !== 'rejected' && reviewDrawerReg.payment?.status !== 'verified' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        leftIcon={<XCircle className="w-4 h-4" weight="bold" />}
                        onClick={() => openRejectDialog(reviewDrawerReg.id)}
                      >
                        Tolak Bukti
                      </Button>
                    )}

                    {reviewDrawerReg.payment?.status !== 'verified' && (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<CheckCircle className="w-4 h-4" weight="bold" />}
                        onClick={() => setApproveConfirmReg(reviewDrawerReg)}
                        disabled={!reviewDrawerReg.payment?.proof_url}
                      >
                        Setujui Pembayaran
                      </Button>
                    )}
                  </div>
                </div>
              </DrawerFooter>
            </>
          )}
        </Drawer>

        {/* Modal Ubah Nominal Pembayaran Manual */}
        <Modal
          isOpen={Boolean(editAmountReg)}
          onClose={() => setEditAmountReg(null)}
          title="Ubah Nominal Tagihan Pembayaran"
          description={`Sesuaikan nominal tagihan untuk peserta ${editAmountReg?.user?.full_name}.`}
        >
          <form onSubmit={handleSaveAmount} className="space-y-4">
            <Input
              label="Nominal Baru (IDR) *"
              type="number"
              min="0"
              step="1000"
              required
              value={newAmountInput}
              onChange={(e) => setNewAmountInput(Number(e.target.value))}
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditAmountReg(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Simpan Nominal
              </Button>
            </div>
          </form>
        </Modal>

        {/* Dialog Konfirmasi Setujui Pembayaran */}
        <ConfirmDialog
          isOpen={!!approveConfirmReg}
          onClose={() => setApproveConfirmReg(null)}
          onConfirm={handleApproveConfirm}
          title="Setujui Pembayaran Ini?"
          description={`Anda akan memvalidasi bukti transfer pendaftar ${approveConfirmReg?.user?.full_name} sejumlah ${formatCurrency(approveConfirmReg?.payment?.amount || 0)}. Status pendaftaran akan langsung berubah menjadi Terverifikasi.`}
          confirmText="Ya, Setujui"
          cancelText="Batal"
          variant="primary"
        />

        {/* Dialog Konfirmasi Hapus Transaksi */}
        <ConfirmDialog
          isOpen={!!deleteConfirmReg}
          onClose={() => setDeleteConfirmReg(null)}
          onConfirm={handleDeleteConfirm}
          title="Hapus Data Transaksi Ini?"
          description={`Anda akan menghapus catatan pendaftaran dan transaksi ${deleteConfirmReg?.user?.full_name}. Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus Transaksi"
          variant="destructive"
        />

        {/* Dialog Alasan Penolakan Wajib */}
        <ReasonDialog
          isOpen={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={handleConfirmReject}
          title="Konfirmasi Penolakan Bukti Pembayaran"
          description="Sesuai SOP, alasan penolakan wajib dituliskan (minimal 10 karakter) agar peserta dapat memperbaiki bukti transfernya."
          confirmLabel="Tolak Bukti Transfer"
          placeholder="Contoh: Nominal transfer kurang dari tagihan resmi, atau bukti transfer blur/tidak terbaca..."
          isDestructive={true}
        />
      </div>
    </DashboardLayout>
  );
}
