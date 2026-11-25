'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck } from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  beginSuperAdminMfaAction,
  verifySuperAdminMfaAction,
} from './mfa-actions';
import type { MfaSetupResult } from './mfa-types';

export function MfaClient() {
  const router = useRouter();
  const [setup, setSetup] = useState<MfaSetupResult['data'] | null>(null);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    setErrorMessage(null);
    try {
      const result = await beginSuperAdminMfaAction();
      if (!result.success || !result.data) {
        setErrorMessage(result.message || 'Autentikator tidak dapat disiapkan.');
        return;
      }
      setSetup(result.data);
    } catch {
      setErrorMessage('Autentikator tidak dapat disiapkan. Coba lagi.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!setup) return;

    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const result = await verifySuperAdminMfaAction({ factorId: setup.factorId, code });
      if (!result.success) {
        setErrorMessage(result.message || 'Verifikasi gagal. Periksa kode dan coba lagi.');
        return;
      }
      router.replace('/dashboard/admin');
      router.refresh();
    } catch {
      setErrorMessage('Verifikasi gagal. Periksa kode dan coba lagi.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)]">
      <CardHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
          <ShieldCheck size={24} weight="fill" aria-hidden="true" />
        </div>
        <CardTitle>Verifikasi dua langkah</CardTitle>
        <CardDescription>
          Akun Super Admin memerlukan kode dari aplikasi autentikator.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" role="alert">
            <AlertTitle>Verifikasi gagal</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!setup ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Hubungkan akun ke aplikasi autentikator untuk melanjutkan ke dashboard.
            </p>
            <Button type="button" onClick={handleStart} isLoading={isStarting}>
              Siapkan autentikator
            </Button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {setup.setupRequired && setup.qrCode && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Pindai kode QR dengan aplikasi autentikator. Kamu juga bisa memasukkan kunci
                  berikut secara manual.
                </p>
                <Image
                  src={setup.qrCode.trim()}
                  alt="Kode QR untuk menautkan akun Super Admin ke aplikasi autentikator"
                  width={220}
                  height={220}
                  unoptimized
                  className="mx-auto rounded-md bg-white p-2"
                />
                <p className="break-all rounded-md border border-[var(--border)] bg-[var(--muted)] p-3 font-mono text-sm text-[var(--foreground)]">
                  {setup.secret}
                </p>
              </div>
            )}
            <Input
              label="Kode autentikator"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              helperText="Masukkan kode 6 digit yang sedang tampil di aplikasi autentikator."
            />
            <Button type="submit" isLoading={isVerifying} className="w-full">
              Verifikasi dan lanjutkan
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
