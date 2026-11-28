'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { ROLE_LABELS } from '@/lib/constants';
import {
  House,
  Trophy,
  CreditCard,
  UploadSimple,
  Medal,
  User,
  Users,
  ClipboardText,
  FileText,
  // GameController,
  Bell,
  ClockCounterClockwise,
  SquaresFour,
  ArrowLeft,
  CaretRight,
  SignOut,
  CheckCircle,
  Gear,
  WarningOctagon,
  ListNumbers,
  UserGear,
  Calendar,
  Handshake,
  BookOpen,
  // CalendarStar,
} from '@phosphor-icons/react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

interface MenuItem {
  label: string;
  href: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
}

interface MenuGroup {
  groupTitle?: string;
  items: MenuItem[];
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAppStore();
  const [logoutError, setLogoutError] = React.useState<string | null>(null);
  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      router.push('/login');
    } catch {
      setLogoutError('Sesi belum berhasil diakhiri. Periksa koneksi lalu coba lagi.');
    }
  };

  const getMenuGroups = (): MenuGroup[] => {
    switch (currentUser.role) {
      case 'peserta':
        return [
          {
            items: [
              { label: 'Overview', href: '/dashboard/peserta', icon: House },
              { label: 'Kompetisi Saya', href: '/dashboard/peserta/kompetisi', icon: Trophy },
              { label: 'Pembayaran', href: '/dashboard/peserta/pembayaran', icon: CreditCard },
              { label: 'Submission Karya', href: '/dashboard/peserta/submission', icon: UploadSimple },
              { label: 'Hasil & Pengumuman', href: '/dashboard/peserta/hasil', icon: Medal },
              { label: 'Profil Saya', href: '/dashboard/peserta/profil', icon: User },
            ],
          },
        ];
      case 'juri':
        return [
          {
            items: [
              { label: 'Overview Penugasan', href: '/dashboard/juri', icon: House },
              { label: 'Karya Ditugaskan', href: '/dashboard/juri/penugasan', icon: ClipboardText },
              { label: 'Riwayat Penilaian', href: '/dashboard/juri/riwayat', icon: ClockCounterClockwise },
              { label: 'Profil Saya', href: '/dashboard/juri/profil', icon: User },
            ],
          },
        ];
      case 'panitia':
      case 'super_admin':
      default: {
        const isSuperAdmin = currentUser.role === 'super_admin';

        const groups: MenuGroup[] = [
          {
            groupTitle: 'Operasional Harian',
            items: [
              { label: 'Overview', href: '/dashboard/admin', icon: House },
              { label: 'Profil Saya', href: '/dashboard/admin/profil', icon: User },
              { label: 'Verifikasi Pembayaran', href: '/dashboard/admin/pembayaran', icon: CreditCard },
              { label: 'Pendaftaran & Tim', href: '/dashboard/admin/peserta', icon: Users },
            ],
          },
          {
            groupTitle: 'Penilaian & Lomba',
            items: [
              { label: 'Submission Karya', href: '/dashboard/admin/submission', icon: FileText },
              { label: 'Penilaian & Juri', href: '/dashboard/admin/penilaian', icon: CheckCircle },
              // { label: 'Hasil E-Sport', href: '/dashboard/admin/hasil', icon: GameController },
            ],
          },
          {
            groupTitle: 'Konten & Publikasi',
            items: [
              { label: 'Timeline & Kalender', href: '/dashboard/admin/timeline', icon: Calendar },
              // { label: 'Agenda & Seminar', href: '/dashboard/admin/events', icon: CalendarStar },
              { label: 'Pengumuman Resmi', href: '/dashboard/admin/pengumuman', icon: Bell },
              { label: 'Mitra & Sponsor', href: '/dashboard/admin/mitra', icon: Handshake },
              { label: 'Guidebook', href: '/dashboard/admin/guidebook', icon: BookOpen },
            ],
          },
        ];

        if (isSuperAdmin) {
          groups.push({
            groupTitle: 'Sistem & Tata Kelola',
            items: [
              { label: 'Manajemen Kompetisi', href: '/dashboard/admin/kompetisi', icon: SquaresFour },
              { label: 'Rubrik Penilaian', href: '/dashboard/admin/rubrik', icon: ListNumbers },
              { label: 'Manajemen Pengguna', href: '/dashboard/admin/pengguna', icon: UserGear },
              { label: 'Koreksi Darurat', href: '/dashboard/admin/koreksi-darurat', icon: WarningOctagon },
              { label: 'Audit Trail', href: '/dashboard/admin/audit-log', icon: ClockCounterClockwise },
              { label: 'Pengaturan Sistem', href: '/dashboard/admin/pengaturan', icon: Gear },
            ],
          });
        }

        return groups;
      }
    }
  };

  const menuGroups = getMenuGroups();

  return (
    <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col h-screen shrink-0 text-[var(--foreground)] transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-bold text-xs tracking-tight font-[family-name:var(--font-bricolage)] text-[var(--foreground)]">
            Permifest x Deforkafest
          </span>
        </Link>
        <Link
          href="/"
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-md hover:bg-[var(--accent)] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
          title="Kembali ke Website Utama"
        >
          <ArrowLeft size={16} weight="bold" />
        </Link>
      </div>

      {/* User Card */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--accent)]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)] font-bold text-sm">
            {currentUser.full_name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-[var(--foreground)] truncate">
              {currentUser.full_name}
            </div>
            <div className="text-[11px] text-[var(--primary)] font-mono flex items-center gap-1.5 mt-0.5">
              <span>{ROLE_LABELS[currentUser.role]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {menuGroups.map((group, gIdx) => (
          <div key={`group-${gIdx}`} className="space-y-1">
            {group.groupTitle && (
              <div className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase px-3 py-1 tracking-wider">
                {group.groupTitle}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[38px] ${isActive
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={17}
                      weight={isActive ? 'fill' : 'regular'}
                      className={isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <CaretRight size={13} weight="bold" className="text-[var(--primary)]" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info & Tombol Logout Nyata */}
      <div className="p-3 border-t border-[var(--border)] text-[11px] text-[var(--muted-foreground)] flex items-center justify-between">
        {logoutError && (
          <span role="alert" className="text-[var(--destructive)]">
            {logoutError}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer text-left"
          title="Keluar dari akun Anda"
        >
          <SignOut size={16} weight="bold" />
          <span>Keluar</span>
        </button>
        <span className="font-mono text-[10px] text-[var(--muted-foreground)]/70">v2.0-MVP</span>
      </div>
    </aside>
  );
}
