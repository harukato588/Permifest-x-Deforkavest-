'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { useAppStore } from '@/lib/store';
import { formatDateShort } from '@/lib/utils';
import { ShieldCheck, Eye, Code } from '@phosphor-icons/react';

interface AuditLogEntry {
  id: string;
  created_at: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, unknown>;
}

export default function AdminAuditLogPage() {
  const { currentUser, auditLogs } = useAppStore();
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  if (currentUser.role !== 'super_admin') {
    return (
      <DashboardLayout
        title="Akses Dibatasi"
        subtitle="Halaman ini membutuhkan hak akses Super Admin."
      >
        <Alert variant="destructive" icon={<ShieldCheck className="w-5 h-5" weight="bold" />}>
          <AlertTitle>Akses Ditolak (403 Forbidden)</AlertTitle>
          <AlertDescription>
            Halaman Audit Trail hanya dapat diakses oleh akun dengan peran Super Admin sesuai aturan keamanan dan spesifikasi use case (RULE_16).
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const getActionBadge = (action: string) => {
    if (action.includes('VERIFY')) return <Badge variant="success">{action}</Badge>;
    if (action.includes('SCORE') || action.includes('OVERRIDE')) return <Badge variant="destructive">{action}</Badge>;
    if (action.includes('REGISTER')) return <Badge variant="primary">{action}</Badge>;
    return <Badge variant="neutral">{action}</Badge>;
  };

  const columns: Column<AuditLogEntry & Record<string, unknown>>[] = [
    {
      key: 'created_at',
      header: 'Stempel Waktu',
      sortable: true,
      cell: (log) => (
        <span className="font-mono text-xs text-[var(--muted-foreground)] whitespace-nowrap">
          {formatDateShort(log.created_at)}
        </span>
      ),
    },
    {
      key: 'user_email',
      header: 'Eksekutor',
      sortable: true,
      accessor: (log) => log.user_email || 'system@permifest.id',
      cell: (log) => (
        <span className="font-semibold text-[var(--foreground)] text-xs">
          {log.user_email || 'system@permifest.id'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Aksi / Event',
      sortable: true,
      cell: (log) => getActionBadge(log.action),
    },
    {
      key: 'entity_type',
      header: 'Entitas Target',
      sortable: true,
      cell: (log) => (
        <span className="font-mono text-xs text-[var(--foreground)]">
          {log.entity_type} <span className="text-[var(--muted-foreground)] text-[10px]">({log.entity_id?.slice(0, 8)})</span>
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Detail',
      cell: (log) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--muted-foreground)] max-w-xs truncate">
            {JSON.stringify(log.details)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLog(log);
            }}
            className="p-1 h-7 min-h-0 text-xs shrink-0"
            title="Lihat Payload Lengkap"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Audit Trail & Rekam Jejak Sistem"
      subtitle="Pencatatan kepatuhan keamanan dan audit forensik seluruh operasi sensitif platform secara real-time."
    >
      <div className="space-y-6">
        <Alert variant="info" icon={<ShieldCheck className="w-5 h-5 text-[var(--info-text)]" weight="bold" />}>
          <AlertTitle>Integritas Log Audit Append-Only (SHA-256)</AlertTitle>
          <AlertDescription>
            Seluruh catatan log bersifat permanen dan tidak dapat dimanipulasi atau dihapus. Seluruh tindakan verifikasi pembayaran, penugasan juri, dan override darurat tersimpan permanen demi transparansi kompetisi.
          </AlertDescription>
        </Alert>

        <DataTable
          data={auditLogs as (AuditLogEntry & Record<string, unknown>)[]}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchPlaceholder="Cari event, eksekutor, entitas..."
          searchableKeys={['action', 'user_email', 'entity_type', 'entity_id']}
          exportFilename="audit_log_permifest"
          onRowClick={(item) => setSelectedLog(item as AuditLogEntry)}
          emptyTitle="Belum Ada Rekaman Audit"
          emptyDescription="Belum ada event audit yang tercatat di sistem."
        />

        {/* Modal Payload Detail */}
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Detail Payload Log Audit"
          description={selectedLog ? `ID Event: ${selectedLog.id} • ${selectedLog.action}` : ''}
          maxWidth="lg"
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="bg-[var(--accent)]/30 border border-[var(--border)] rounded-[var(--radius-md)] p-3 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--muted-foreground)]">Waktu:</span>
                  <span className="font-mono text-[var(--foreground)]">{formatDateShort(selectedLog.created_at)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--muted-foreground)]">Eksekutor:</span>
                  <span className="font-semibold text-[var(--foreground)]">{selectedLog.user_email || 'system'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--muted-foreground)]">Entitas:</span>
                  <span className="font-mono text-[var(--foreground)]">{selectedLog.entity_type} ({selectedLog.entity_id})</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5 mb-2">
                  <Code className="w-4 h-4 text-[var(--primary)]" /> Payload JSON
                </label>
                <pre className="p-4 rounded-[var(--radius-md)] bg-[var(--card)] border border-[var(--border)] font-mono text-xs text-[var(--foreground)] overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
