import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FRANTANA - Motor de Reservas Musical',
  description: 'Reserva tu sesión musical con FRANTANA. Servicios profesionales de grabación, shows en vivo, ensayos y clases personalizadas.',
  keywords: 'música, artista, reservas, grabación, shows, clases, FRANTANA',
  authors: [{ name: 'FRANTANA' }],
  icons: {
    icon: [
      { url: '/icon.png?v=3', type: 'image/png', sizes: '32x32' },
      { url: '/icon.png?v=3', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: [{ url: '/favicon.ico?v=3', type: 'image/x-icon' }],
    apple: [{ url: '/icon.png?v=3', type: 'image/png' }],
  },
  openGraph: {
    title: 'FRANTANA - Motor de Reservas Musical',
    description: 'Reserva tu sesión musical con FRANTANA. Servicios profesionales de grabación, shows en vivo, ensayos y clases personalizadas.',
    type: 'website',
    locale: 'es_ES',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}