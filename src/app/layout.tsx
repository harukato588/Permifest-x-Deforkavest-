import type { Metadata } from 'next';
import Script from 'next/script';
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/store';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
  weight: ['400', '500', '600', '700', '800'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
  weight: ['400', '500', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://permifest.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Permifest x Deforkafest 2026 — Kompetisi IT & Agenda Akbar Nasional',
    template: '%s | Permifest x Deforkafest 2026',
  },
  description:
    'Platform perlombaan satu pintu Permifest x Deforkafest (Permikomnas Yogyakarta x IMPSI UST Yogyakarta). 3 Cabang Lomba Akademik: Esai Ilmiah, UI/UX Design, dan IT System Architecture, serta Seminar Nasional & Tech Workshop.',
  keywords: [
    'Permifest',
    'Deforkafest',
    'Permikomnas',
    'IMPSI UST',
    'Kompetisi IT',
    'Lomba UI/UX',
    'Lomba Esai Ilmiah',
    'IT System Architecture',
    'Mobile Legends Tournament',
    'PES eFootball',
    'Seminar AI',
    'Yogyakarta 2026',
  ],
  authors: [{ name: 'Panitia Permifest x Deforkafest 2026' }],
  creator: 'Permikomnas DIY x IMPSI UST',
  publisher: 'Universitas Sarjanawiyata Tamansiswa (UST)',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'Permifest x Deforkafest 2026',
    title: 'Permifest x Deforkafest 2026 — Kompetisi IT & Agenda Akbar Nasional',
    description:
      'Daftarkan timmu sekarang! 5 cabang perlombaan bergengsi, total hadiah jutaan rupiah, e-sertifikat nasional, dan seminar teknologi.',
    images: [
      {
        url: '/ilustrasi.png',
        width: 1200,
        height: 630,
        alt: 'Permifest x Deforkafest 2026 Banner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Permifest x Deforkafest 2026',
    description:
      'Platform resmi perlombaan IT & Seminar Nasional Permikomnas DIY x IMPSI UST Yogyakarta.',
    images: ['/ilustrasi.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`dark ${bricolage.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <Script src="/button.js" strategy="afterInteractive" />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased min-h-screen">
        <a href="#main-content" className="skip-link">
          Lewati ke konten utama
        </a>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
