import type { Metadata, Viewport } from 'next';
import { Poppins, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

import { ConfirmProvider } from '@/components/common/confirm-dialog';
import { Toaster } from '@/components/ui/sonner';

import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const siteTitle =
  'GastroNic Tour | Turismo gastronómico en Nicaragua';

const siteDescription =
  'Descubre restaurantes, rutas y experiencias gastronómicas de Nicaragua, conectando sabores locales, cultura y turismo en una sola plataforma.';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  applicationName: 'GastroNic Tour',

  title: {
    default: siteTitle,
    template: '%s | GastroNic Tour',
  },

  description: siteDescription,

  generator: 'GastroNic Tour',

  keywords: [
    'GastroNic Tour',
    'gastronomía nicaragüense',
    'turismo gastronómico',
    'restaurantes en Nicaragua',
    'rutas gastronómicas',
    'comida nicaragüense',
    'Nicaragua',
  ],

  openGraph: {
    type: 'website',
    locale: 'es_NI',
    siteName: 'GastroNic Tour',
    title: siteTitle,
    description: siteDescription,
  },

  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${inter.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="bg-background font-sans text-foreground antialiased">
        {/* Diálogo de confirmación accesible (reemplaza window.confirm) */}
        <ConfirmProvider>
          {children}
        </ConfirmProvider>

        {/* Avisos de éxito y error (lib/notify.ts) */}
        <Toaster />

        {process.env.NODE_ENV === 'production' && (
          <Analytics />
        )}
      </body>
    </html>
  );
}
