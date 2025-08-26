import type { Metadata } from 'next';
import './globals.css';
import { Geist } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/auth-provider';
import CheckoutProviderWrapper from '@/contexts/CheckoutProviderWrapper';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { CheckoutProvider } from '@/contexts/CheckoutContext';

export const metadata: Metadata = {
  title: 'Zeros Tour - Reserva de Pasajes',
  description: 'Aplicación de Zeros Tour para la reserva de pasajes de transporte. Encuentra y reserva tu viaje de forma rápida y segura.',
  keywords: ['transporte', 'reservas', 'pasajes', 'viajes', 'autobús', 'tour'],
  authors: [{ name: 'Solomillo Inc' }],
  creator: 'Solomillo Inc',
  publisher: 'Solomillo Inc',
  generator: 'Next.js',
};

const geist = Geist({
  subsets: ['latin'],
  weight: ['200', '400', '600', '700'],
  variable: '--font-sans',
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", geist.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CheckoutProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </CheckoutProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}