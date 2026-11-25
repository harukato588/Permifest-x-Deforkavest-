import React from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { getMyRegistrations } from '@/features/registrations/queries';
import { PembayaranClientWrapper } from '@/features/registrations/components/PembayaranClientWrapper';
import { CreditCard } from '@phosphor-icons/react/dist/ssr';

export const instant = false;

export default async function PesertaPembayaranPage() {
  await connection();
  const registrations = await getMyRegistrations();
  const payableRegistrations = registrations.filter((r) => r.payment !== null);

  return (
    <DashboardLayout
      title="Pembayaran & Verifikasi"
      subtitle="Selesaikan pembayaran biaya pendaftaran lomba via QRIS dan unggah bukti transfer untuk diverifikasi panitia."
    >
      {payableRegistrations.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={28} weight="duotone" className="text-primary" />}
          title="Belum Ada Tagihan Pembayaran"
          description="Anda belum memiliki pendaftaran lomba yang memerlukan pembayaran. Daftarkan diri Anda terlebih dahulu di halaman daftar lomba."
          action={
            <Link href="/kompetisi">
              <Button variant="primary">Lihat Daftar Lomba</Button>
            </Link>
          }
        />
      ) : (
        <PembayaranClientWrapper initialRegistrations={payableRegistrations} />
      )}
    </DashboardLayout>
  );
}
