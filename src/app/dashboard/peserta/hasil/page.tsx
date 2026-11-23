'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { formatDateShort } from '@/lib/utils';
import { Trophy, Medal, Megaphone, ArrowRight, Sparkle, SealCheck } from '@phosphor-icons/react';
import { MOCK_LEADERBOARDS } from '@/lib/mock-data';

export default function PesertaHasilPage() {
  const { currentUser, registrations, announcements } = useAppStore();
  const myRegistrations = registrations.filter((r) => r.user_id === currentUser.id);

  // Cocokkan data peserta dengan peringkat hasil akhir yang dirilis
  const myResults = currentUser?.full_name
    ? MOCK_LEADERBOARDS.filter((l) =>
        l.participant_name.toLowerCase().includes(currentUser.full_name.toLowerCase())
      )
    : [];

  return (
    <DashboardLayout 
      title="Hasil Akhir & Pengumuman" 
      subtitle="Pantau status kelulusan babak penyisihan dan klasemen akhir resmi perlombaan."
    >
      <div className="space-y-6">
        
        {/* Banner Klasemen Resmi */}
        <div className="p-6 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Trophy size={32} weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground font-[family-name:var(--font-bricolage)]">
                  Klasemen &amp; Surat Keputusan Juara
                </h3>
                <Badge variant="gold">RESMI</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                Hasil akhir telah disahkan dan dikunci oleh panitia. Seluruh peserta yang berpartisipasi berhak mengunduh sertifikat digital.
              </p>
            </div>
          </div>
          <Link href="/leaderboard" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} weight="bold" />} className="w-full sm:w-auto">
              Buka Leaderboard Publik
            </Button>
          </Link>
        </div>

        {/* Status Capaian Peserta (Sesuai Aturan Emas: Tanpa Menampilkan Nilai/Komentar Juri) */}
        <Card>
          <CardHeader>
            <CardTitle>Capaian Perlombaan Anda</CardTitle>
            <p className="text-xs text-muted-foreground">
              Rekapitulasi status babak akhir yang telah dipublikasikan panitia
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {myRegistrations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Belum ada data kompetisi yang Anda ikuti.
              </p>
            ) : (
              myRegistrations.map((reg) => {
                const matchedEntry = myResults.find((r) => r.category === reg.competition?.category);

                return (
                  <div
                    key={reg.id}
                    className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{reg.competition?.name}</h4>
                        <Badge variant="primary">{reg.competition?.type === 'academic' ? 'Akademik' : 'E-Sport'}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>Status Partisipasi:</span>
                        <strong className="text-foreground">Terdaftar &amp; Berkas Terverifikasi</strong>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      {matchedEntry ? (
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--brand-gold)]/15 border border-[var(--brand-gold)]/30 text-[var(--brand-gold-soft)] font-bold text-xs">
                          <Medal size={16} weight="fill" />
                          <span>Peringkat #{matchedEntry.rank}: {matchedEntry.notes || 'Juara'}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium border border-border">
                          <SealCheck size={16} className="text-primary" />
                          <span>Tahap Penilaian Berjalan</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Pengumuman & Berita Terkini */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone size={18} className="text-primary" />
              <span>Surat Edaran &amp; Pengumuman Kepanitiaan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">{ann.title}</span>
                  <span className="text-muted-foreground font-mono text-[10px]">{formatDateShort(ann.published_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ann.content}</p>
                <div className="text-[11px] text-primary font-medium flex items-center gap-1 mt-1">
                  <Sparkle size={12} weight="fill" />
                  <span>Diterbitkan oleh: {ann.author_name}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
