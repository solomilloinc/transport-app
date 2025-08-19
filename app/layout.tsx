import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import dynamic from 'next/dynamic';
import AuthProvider from '@/components/auth-provider';
import CheckoutProviderWrapper from '@/contexts/CheckoutProviderWrapper';

export const metadata: Metadata = {
  title: 'Zeros Tour',
  description: 'Aplicacion de zeros tour para reserva de pasajes',
  generator: 'Solomillo inc',
};

const geist = Geist({
  subsets: ['latin'],
  weight: ['200', '400', '600', '700'], // elegí los pesos que vayas a usar
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Aquí envolvemos solo los children con los providers de cliente */}
        <CheckoutProviderWrapper>
          <AuthProvider>
            {children}
          </AuthProvider>
        </CheckoutProviderWrapper>
        <Toaster />
      </body>
    </html>
  );
}
