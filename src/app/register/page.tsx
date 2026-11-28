'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SakugaButton } from '@/components/ui/sakuga-button';
import { registerAction } from '@/features/auth/actions';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerAction({
        fullName,
        email,
        institution,
        phone,
        password,
        confirmPassword,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Pendaftaran gagal.');
        return;
      }

      setSuccessInfo(res.message || 'Pendaftaran akun berhasil!');

      setTimeout(() => {
        router.push(res.data?.requiresVerification ? '/verifikasi-email' : '/dashboard/peserta');
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan koneksi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0720] text-[#F5F2FF] relative overflow-hidden">
      {/* ── Background Layer 1: Subtle CSS Diagonal Grid Pattern (Ringan Murni CSS) ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #9B6BF2 0,
            #9B6BF2 1px,
            transparent 1px,
            transparent 28px
          )`,
        }}
      />

      {/* ── Background Layer 2: Ambient Atmosphere Gradients (Ringan & Halus) ── */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-[580px] h-[580px] rounded-full pointer-events-none opacity-30 select-none"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(196, 241, 90, 0.25) 0%, rgba(155, 107, 242, 0.12) 50%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-24 w-[540px] h-[540px] rounded-full pointer-events-none opacity-25 select-none"
        style={{
          background: 'radial-gradient(circle at 60% 60%, rgba(108, 196, 255, 0.28) 0%, rgba(213, 107, 217, 0.1) 50%, transparent 70%)',
        }}
      />

      <div
        aria-hidden="true"
        className="hidden lg:flex flex-col items-end gap-1.5 absolute bottom-28 right-10 xl:right-24 z-0 rotate-3 select-none opacity-75 pointer-events-none"
      >
        <div className="px-4 py-2 rounded-2xl bg-[#140D33]/90 border-2 border-[#2E2266] shadow-[4px_4px_0px_#0B0720] text-right">
          <span className="block text-[11px] font-black uppercase tracking-widest text-[#FFE359]">
            3 CABANG LOMBA AKADEMIK
          </span>
          <span className="block text-[10px] text-[#A99FD1] font-semibold mt-0.5">
            Akademik &amp; E-Sport
          </span>
        </div>
        <div className="w-12 h-1 bg-[#FFE359]/30 rounded-full mr-2" />
      </div>

      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12 md:pt-28 relative z-10">
        <div className="w-full max-w-lg">
          {/* Card Box Manga Pop Art */}
          <div className="relative rounded-3xl bg-[#140D33] border-2 border-[#2E2266] p-7 sm:p-9 shadow-[6px_6px_0px_#0B0720,8px_8px_0px_#C4F15A]">
            {/* Header dengan Maskot & Washi Tape */}
            <div className="flex items-center justify-between mb-4 select-none">
              <div className="inline-block px-3.5 py-1 rounded-md text-xs font-black uppercase tracking-wider text-[#0B0720] bg-[#C4F15A] shadow-sm -rotate-2 select-none border border-black/20">
                Pendaftaran Peserta
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-bricolage)] text-[#F5F2FF] tracking-tight">
              Daftar{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #C4F15A 0%, #6CC4FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Akun Baru
              </span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#A99FD1]">
              Satu akun untuk seluruh cabang akademik (UI/UX, ITSA, Esai) dan turnamen e-sport (PES, MLBB).
            </p>

            {successInfo ? (
              <div className="mt-6 p-6 rounded-2xl bg-[#0B0720] border border-[#2E2266] text-center space-y-3">
                <span className="w-10 h-10 rounded-full bg-[#C4F15A] text-[#0B0720] font-black text-xl flex items-center justify-center mx-auto">
                  ✓
                </span>
                <h4 className="text-base font-bold text-[#F5F2FF]">Pendaftaran Berhasil!</h4>
                <p className="text-xs text-[#A99FD1] leading-relaxed">
                  {successInfo}
                </p>
                <p className="text-[11px] text-[#6CC4FF]">
                  Mengalihkan kamu ke Dashboard Peserta...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {errorMessage && (
                  <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
                    <AlertTitle>Pendaftaran Gagal</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <Input
                  label="Nama Lengkap"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Lengkap Peserta"
                  className="bg-[#0B0720] border-[#2E2266] focus:border-[#9B6BF2]"
                />

                <Input
                  label="Alamat Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="bg-[#0B0720] border-[#2E2266] focus:border-[#9B6BF2]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Asal Kampus / Instansi"
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Contoh: UST Yogyakarta"
                    className="bg-[#0B0720] border-[#2E2266] focus:border-[#9B6BF2]"
                  />
                  <Input
                    label="Nomor WhatsApp"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="bg-[#0B0720] border-[#2E2266] focus:border-[#9B6BF2]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Kata Sandi (Password)"
                    type="password"
                    required
                    minLength={8}
                    pattern="(?=.*[0-9]).*"
                    title="Password minimal 8 karakter dan harus mengandung angka."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 karakter"
                    helperText="Password minimal 8 karakter dan harus mengandung angka."
                    className="bg-[#0B0720] border-[#2E2266] focus:border-[#9B6BF2]"
                  />
                  <Input
                    label="Konfirmasi Kata Sandi"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="bg-[#0B0720] border-[#2E2266] focus:border-[#9B6BF2]"
                  />
                </div>

                <div className="pt-2">
                  <SakugaButton
                    type="submit"
                    variant="brand"
                    size="lg"
                    isLoading={isLoading}
                    className="w-full justify-center"
                  >
                    Daftar Akun Sekarang
                  </SakugaButton>
                </div>

                <div className="text-center text-xs text-[#A99FD1] pt-3 border-t border-[#2E2266]/80">
                  Sudah memiliki akun?{' '}
                  <Link href="/login" className="text-[#F5F2FF] font-bold hover:text-[#9B6BF2] transition-colors underline">
                    Masuk ke akunmu
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
