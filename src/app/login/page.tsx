'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SakugaButton } from '@/components/ui/sakuga-button';
import { useAppStore } from '@/lib/store';
import { loginAction } from '@/features/auth/actions';

export default function LoginPage() {
  const router = useRouter();
  const { switchRole } = useAppStore();

  const [email, setEmail] = useState('peserta@permifest.id');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isDemoAllowed =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'true';

  const fillQuickAccount = (demoEmail: string, role: 'peserta' | 'juri' | 'panitia' | 'super_admin') => {
    setEmail(demoEmail);
    setPassword('password123');
    switchRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await loginAction({ email, password });
      if (!result.success || !result.data) {
        setErrorMessage(result.message || 'Gagal masuk akun. Periksa email dan password.');
        return;
      }

      // Sinkronkan role store demo agar konsisten
      const detectedRole = result.data.role;
      if (
        detectedRole === 'peserta' ||
        detectedRole === 'juri' ||
        detectedRole === 'panitia' ||
        detectedRole === 'super_admin'
      ) {
        switchRole(detectedRole);
      } else if (email.includes('juri')) {
        switchRole('juri');
      } else if (email.includes('panitia') || email.includes('admin')) {
        switchRole('panitia');
      } else {
        switchRole('peserta');
      }

      router.push(result.data.redirectUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
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
        className="absolute -top-32 -left-32 w-[560px] h-[560px] rounded-full pointer-events-none opacity-30 select-none"
        style={{
          background: 'radial-gradient(circle at 40% 40%, rgba(155, 107, 242, 0.35) 0%, rgba(124, 77, 219, 0.1) 50%, transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-24 w-[520px] h-[520px] rounded-full pointer-events-none opacity-25 select-none"
        style={{
          background: 'radial-gradient(circle at 60% 60%, rgba(213, 107, 217, 0.3) 0%, rgba(108, 196, 255, 0.1) 50%, transparent 70%)',
        }}
      />

      <div
        aria-hidden="true"
        className="hidden lg:flex flex-col items-end gap-1.5 absolute bottom-28 right-10 xl:right-24 z-0 rotate-3 select-none opacity-75 pointer-events-none"
      >
        <div className="px-4 py-2 rounded-2xl bg-[#140D33]/90 border-2 border-[#2E2266] shadow-[4px_4px_0px_#0B0720] text-right">
          <span className="block text-[11px] font-black uppercase tracking-widest text-[#6CC4FF]">
            2026 EDITION
          </span>
          <span className="block text-[10px] text-[#A99FD1] font-semibold mt-0.5">
            Permifest x Deforkafest
          </span>
        </div>
        <div className="w-12 h-1 bg-[#6CC4FF]/30 rounded-full mr-2" />
      </div>

      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12 md:pt-28 relative z-10">
        <div className="w-full max-w-md">
          {/* Card Box Manga Pop Art */}
          <div className="relative rounded-3xl bg-[#140D33] border-2 border-[#2E2266] p-7 sm:p-9 shadow-[6px_6px_0px_#0B0720,8px_8px_0px_#9B6BF2]">
            {/* Header dengan Maskot Kecil & Washi Tape */}
            <div className="flex items-center justify-between mb-4 select-none">
              <div className="inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider text-[#0B0720] bg-[#FFE359] shadow-sm -rotate-2 select-none border border-black/20">
                Pintu Masuk Arena
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-bricolage)] text-[#F5F2FF] tracking-tight">
              Masuk ke{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #9B6BF2 0%, #D56BD9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Akunmu
              </span>
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#A99FD1]">
              Satu akses terpadu untuk lomba, pengumpulan karya, dan verifikasi.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {errorMessage && (
                <Alert variant="destructive" onClose={() => setErrorMessage(null)}>
                  <AlertTitle>Gagal Masuk</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <Input
                label="Alamat Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="bg-[#0B0720] border-[#2E2266] focus:border-[#9B6BF2]"
              />

              <div>
                <Input
                  label="Kata Sandi (Password)"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0B0720] border-[#2E2266] focus:border-[#9B6BF2]"
                />
                <div className="flex justify-end mt-1.5">
                  <Link href="/forgot-password" className="text-xs text-[#9B6BF2] hover:text-[#D56BD9] transition-colors">
                    Lupa kata sandi?
                  </Link>
                </div>
              </div>

              <div className="pt-2">
                <SakugaButton
                  type="submit"
                  variant="brand"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full justify-center"
                >
                  Masuk Sekarang
                </SakugaButton>
              </div>

              {/* Quick One-Click Demo Accounts Selector (Hanya Tampil di Non-Production / Dev Mode) */}
              {isDemoAllowed && (
                <div className="mt-6 p-3.5 rounded-2xl bg-[#0B0720] border border-[#2E2266] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#A99FD1] uppercase tracking-wider">
                    <span>Pilih Akun Demo Cepat</span>
                    <span className="text-[#FFE359]">Mode Dev / Demo</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => fillQuickAccount('peserta@permifest.id', 'peserta')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#140D33] border border-[#2E2266] hover:border-[#9B6BF2] text-[#F5F2FF] hover:text-[#6CC4FF] transition-all text-left cursor-pointer"
                    >
                      Peserta Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickAccount('juri@permifest.id', 'juri')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#140D33] border border-[#2E2266] hover:border-[#9B6BF2] text-[#F5F2FF] hover:text-[#FFE359] transition-all text-left cursor-pointer"
                    >
                      Dewan Juri
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickAccount('panitia@permifest.id', 'panitia')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#140D33] border border-[#2E2266] hover:border-[#9B6BF2] text-[#F5F2FF] hover:text-[#C4F15A] transition-all text-left cursor-pointer"
                    >
                      Panitia Lomba
                    </button>
                    <button
                      type="button"
                      onClick={() => fillQuickAccount('admin@permifest.id', 'super_admin')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#140D33] border border-[#2E2266] hover:border-[#9B6BF2] text-[#F5F2FF] hover:text-[#D56BD9] transition-all text-left cursor-pointer"
                    >
                      Super Admin
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center text-xs text-[#A99FD1] pt-3 border-t border-[#2E2266]/80">
                Belum punya akun?{' '}
                <Link href="/register" className="text-[#F5F2FF] font-bold hover:text-[#9B6BF2] transition-colors underline">
                  Daftar akun peserta baru
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
