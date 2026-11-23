'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/lib/store';
import { formatCurrency, formatDateWIB } from '@/lib/utils';
import { isSupabaseLive } from '@/lib/supabase/status';
import { registerCompetitionAction } from '@/features/registrations/actions';
import { 
  ArrowLeft, 
  CheckCircle as CheckCircle2, 
  WarningCircle as AlertCircle, 
  PaperPlaneRight as Send
} from '@phosphor-icons/react';

function DetailKompetisiContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { competitions, registerCompetition, currentUser, registrations } = useAppStore();

  const comp = competitions.find(c => c.slug === slug);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!comp) {
    return (
      <div className="min-h-screen flex flex-col bg-[#090d16]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
          <h2 className="text-xl font-bold text-white">Kompetisi Tidak Ditemukan</h2>
          <p className="text-sm text-slate-400 mt-1">Slug URL yang Anda masukkan tidak valid.</p>
          <Link href="/kompetisi" className="mt-4">
            <Button variant="primary">Kembali ke Daftar Kompetisi</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if current user already registered for this competition
  const existingRegistration = registrations.find(r => r.competition_id === comp.id && r.user_id === currentUser.id);

  const handleInputChange = (fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (isSupabaseLive()) {
        const res = await registerCompetitionAction({
          competition_id: comp.id,
          form_data: formData,
        });
        if (!res.success) {
          throw new Error(res.error || 'Pendaftaran gagal');
        }
      }
      await registerCompetition(comp.id, formData);
      setSuccessMessage(true);
      setTimeout(() => {
        setModalOpen(false);
        router.push('/dashboard/peserta/pembayaran');
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mendaftar';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16]">
      <Navbar />

      {/* Header section */}
      <section className="py-12 bg-slate-950 border-b border-slate-900 cyber-grid">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/kompetisi" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Lomba</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={comp.type === 'academic' ? 'info' : 'warning'}>
                  {comp.type === 'academic' ? 'Kategori Akademik' : 'Kategori E-Sport'}
                </Badge>
                <Badge variant="cyber">{comp.participation_type.toUpperCase()}</Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{comp.name}</h1>
              <p className="text-sm text-cyan-400 font-mono mt-1">Tema: {comp.theme}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0 text-right">
              <span className="text-xs text-slate-400 block">Biaya Registrasi</span>
              <span className="text-2xl font-bold font-mono text-cyan-400">{formatCurrency(comp.registration_fee)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Details */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left col: Details & Stages */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deskripsi & Ruang Lingkup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>{comp.description}</p>
                <p>
                  Kompetisi ini diselenggarakan untuk mengasah pemahaman konseptual dan kapabilitas teknis para peserta dalam ekosistem teknologi informasi dan keamanan siber terpadu, sejalan dengan visi Permifest x Deforkafest 2026.
                </p>
              </CardContent>
            </Card>

            {/* Stages */}
            <Card>
              <CardHeader>
                <CardTitle>Tahapan Kompetisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comp.stages.map((stage, idx) => (
                  <div key={stage.id} className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <span>{stage.name}</span>
                        {stage.is_active && <Badge variant="success" size="sm">Sedang Berjalan</Badge>}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Batas Waktu: {formatDateWIB(stage.submission_close_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Submission Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Format Pengumpulan Karya</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                {comp.submission_config.allowedTypes.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Tipe Berkas / Tautan:</span>
                      <span className="text-cyan-400 font-mono font-semibold">
                        {comp.submission_config.allowedTypes.join(', ')}
                      </span>
                    </div>
                    {comp.submission_config.maxSizeBytes && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Ukuran Maksimal Berkas:</span>
                        <span className="text-slate-200 font-mono">
                          {Math.round(comp.submission_config.maxSizeBytes / (1024 * 1024))} MB
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 italic mt-2">
                      * Catatan: Peserta dapat memperbarui unggahan karya hingga batas waktu deadline ditutup. Versi berkas terakhir yang akan dinilai oleh juri.
                    </p>
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                    Lomba e-sport ini tidak memerlukan pengumpulan berkas karya di platform. Pertandingan dilaksanakan sesuai jadwal dan bracket yang ditentukan panitia, dan hasil akhir akan diinput langsung oleh panitia ke sistem.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right col: Action Card */}
          <div className="space-y-6">
            <Card className="border-cyan-500/40 glow-cyan">
              <CardHeader className="bg-slate-900/80">
                <CardTitle className="text-base text-cyan-300">Pendaftaran Peserta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Status Pendaftaran:</span>
                    <span className="text-emerald-400 font-semibold">Buka</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Batas Pendaftaran:</span>
                    <span className="text-slate-200">10 Des 2026</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Verifikasi ID (KTM/Pelajar):</span>
                    <span className="text-slate-200">{comp.requires_identity_verification ? 'Wajib' : 'Opsional'}</span>
                  </div>
                </div>

                {existingRegistration ? (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-xs font-bold text-emerald-300">Anda Sudah Terdaftar!</div>
                    <p className="text-[11px] text-slate-400 mt-1">Status: {existingRegistration.status}</p>
                    <Link href="/dashboard/peserta/pembayaran" className="block mt-3">
                      <Button size="sm" variant="primary" className="w-full">
                        Buka Dashboard Pembayaran
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full justify-center shadow-lg shadow-cyan-500/20"
                    onClick={() => setModalOpen(true)}
                  >
                    Daftar Sekarang
                  </Button>
                )}

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Alur Pendaftaran:</div>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    <li>Isi formulir online ini</li>
                    <li>Selesaikan pembayaran transfer/QRIS</li>
                    <li>Unggah bukti transfer</li>
                    <li>Tunggu verifikasi panitia (maks 24 jam)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      {/* Registration Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Form Pendaftaran: ${comp.name}`}
        description="Lengkapi data pendaftaran berikut dengan benar."
        maxWidth="lg"
      >
        {successMessage ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-lg font-bold text-white">Pendaftaran Berhasil Dikirim!</h4>
            <p className="text-xs text-slate-400">
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
            
            {/* Auto-filled user info */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Peserta Terdaftar:</span>
              <div className="font-semibold text-cyan-400">{currentUser.full_name} ({currentUser.email})</div>
            </div>

            {/* Dynamic Form Fields */}
            {comp.form_fields.map((field) => (
              <div key={field.id} className="space-y-1">
                {field.type === 'select' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {field.label} {field.required && <span className="text-cyan-400">*</span>}
                    </label>
                    <select
                      required={field.required}
                      value={(formData[field.id] as string) || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-md)] px-3.5 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">Pilih Opsi...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
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

            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs">
              <span className="text-slate-300">Total Biaya Pendaftaran:</span>
              <span className="text-cyan-300 font-bold font-mono text-sm">{formatCurrency(comp.registration_fee)}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={submitting} rightIcon={<Send className="w-4 h-4" />}>
                Konfirmasi & Lanjut Bayar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Footer />
    </div>
  );
}

export default function DetailKompetisiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090d16] flex items-center justify-center text-cyan-400 font-mono text-sm">Memuat detail kompetisi...</div>}>
      <DetailKompetisiContent />
    </Suspense>
  );
}
