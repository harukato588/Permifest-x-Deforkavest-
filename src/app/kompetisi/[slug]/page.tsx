import React from 'react';
import { connection } from 'next/server';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { competitionRepository } from '@/lib/repositories';
import { getCurrentUser } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatCurrency, formatDateWIB } from '@/lib/utils';
import { KompetisiRegisterModal } from '@/features/registrations/components/KompetisiRegisterModal';
import { ArrowLeft, WarningCircle } from '@phosphor-icons/react/dist/ssr';

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DetailKompetisiPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;

  const comp = await competitionRepository.getBySlug(slug).catch(() => null);

  if (!comp) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <WarningCircle className="w-12 h-12 text-destructive mb-3" />
          <h2 className="text-xl font-bold text-foreground">Kompetisi Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Slug URL yang Anda masukkan tidak valid atau cabang lomba belum dipublikasikan.
          </p>
          <Link href="/kompetisi" className="mt-4">
            <Button variant="primary">Kembali ke Daftar Kompetisi</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const currentUser = await getCurrentUser().catch(() => null);
  let existingRegistrationId: string | null = null;

  if (currentUser) {
    const admin = createAdminClient();
    const { data: existingReg } = await admin
      .from('registrations')
      .select('id')
      .eq('competition_id', comp.id)
      .eq('user_id', currentUser.id)
      .not('status', 'eq', 'cancelled')
      .maybeSingle();

    existingRegistrationId = existingReg?.id ?? null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Header section */}
      <section className="py-12 bg-card/50 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/kompetisi"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Lomba</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={comp.type === 'academic' ? 'info' : 'warning'}>
                  {comp.type === 'academic' ? 'Kategori Akademik' : 'Kategori E-Sport'}
                </Badge>
                <Badge variant="primary">
                  {comp.participation_type === 'team' ? 'TIM / BEREGU' : 'INDIVIDU'}
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-[family-name:var(--font-bricolage)] text-foreground">
                {comp.name}
              </h1>
              {comp.theme && (
                <p className="text-sm text-primary font-mono mt-1">Tema: {comp.theme}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-card border border-border shrink-0 text-right">
              <span className="text-xs text-muted-foreground block">Biaya Registrasi</span>
              <span className="text-2xl font-bold font-mono text-primary">
                {formatCurrency(comp.registration_fee)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left col: Details & Stages */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deskripsi &amp; Ruang Lingkup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>{comp.description}</p>
                <p>
                  Kompetisi ini diselenggarakan untuk mengasah pemahaman konseptual dan kapabilitas teknis para peserta dalam ekosistem teknologi informasi dan keamanan siber terpadu, sejalan dengan visi Permifest x Deforkafest 2026.
                </p>
              </CardContent>
            </Card>

            {/* Stages */}
            {comp.stages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tahapan Kompetisi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comp.stages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className="p-4 rounded-lg bg-muted/40 border border-border flex items-start gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/40 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        0{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span>{stage.name}</span>
                          {stage.is_active && (
                            <Badge variant="success" size="sm">
                              Sedang Berjalan
                            </Badge>
                          )}
                        </h4>
                        {stage.submission_close_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Batas Waktu: {formatDateWIB(stage.submission_close_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Submission Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Format Pengumpulan Karya</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                {comp.submission_config.allowedTypes.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                      <span>Tipe Berkas / Tautan:</span>
                      <span className="text-primary font-mono font-semibold">
                        {comp.submission_config.allowedTypes.join(', ')}
                      </span>
                    </div>
                    {comp.submission_config.maxSizeBytes && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                        <span>Ukuran Maksimal Berkas:</span>
                        <span className="text-foreground font-mono">
                          {Math.round(comp.submission_config.maxSizeBytes / (1024 * 1024))} MB
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground italic mt-2">
                      * Catatan: Peserta dapat memperbarui unggahan karya hingga batas waktu deadline ditutup. Versi berkas terakhir yang akan dinilai oleh juri.
                    </p>
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-muted/40 border border-border">
                    Ketentuan pengumpulan karya mengikuti panduan resmi cabang lomba ini.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right col: Action Card */}
          <div className="space-y-6">
            <Card className="border-primary/40">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-base text-primary">Pendaftaran Peserta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Status Pendaftaran:</span>
                    <span className="text-[var(--success)] font-semibold">Buka</span>
                  </div>
                  {comp.registration_close_at && (
                    <div className="flex justify-between py-1 border-b border-border">
                      <span className="text-muted-foreground">Batas Pendaftaran:</span>
                      <span className="text-foreground">{formatDateWIB(comp.registration_close_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted-foreground">Verifikasi ID (KTM/Pelajar):</span>
                    <span className="text-foreground">
                      {comp.requires_identity_verification ? 'Wajib' : 'Opsional'}
                    </span>
                  </div>
                </div>

                <KompetisiRegisterModal
                  competition={comp}
                  currentUser={currentUser}
                  existingRegistrationId={existingRegistrationId}
                />

                <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground">Alur Pendaftaran:</div>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    <li>Lengkapi status pendidikan &amp; KTM di Profil</li>
                    <li>Isi formulir pendaftaran cabang lomba</li>
                    <li>Selesaikan pembayaran QRIS &amp; unggah bukti</li>
                    <li>Tunggu verifikasi panitia (maks 24 jam)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
