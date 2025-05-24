import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import AuthProvider from '@/components/auth-provider';
import { Geist } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Zeros Tour',
  description: 'Aplicacion de zeros tour para reserva de pasajes',
  generator: 'Solomillo inc',
};

const geist = Geist({
  subsets: ['latin'],
  weight: ['200', '400', '600', '700'], // elegí los pesos que vayas a usar
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
