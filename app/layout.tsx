import type { Metadata } from 'next';
import './globals.css';
import { Fraunces, Manrope } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/auth-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { TenantStyles } from '@/components/tenant-styles';
import { getTenantConfig } from '@/services/tenant';
import { getRequestHost } from '@/lib/get-host';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
});

export async function generateMetadata(): Promise<Metadata> {
  const host = await getRequestHost();
  const tenant = await getTenantConfig(host);
  if (!tenant) {
    return { title: 'Error - Tenant no disponible' };
  }
  return {
    title: `${tenant.identity.companyName} - ${tenant.seo.title}`,
    description: tenant.seo.description,
    keywords: tenant.seo.keywords,
    authors: [{ name: tenant.identity.companyNameLegal }],
    creator: tenant.identity.companyNameLegal,
    publisher: tenant.identity.companyNameLegal,
    generator: 'Next.js',
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = await getRequestHost();
  const tenantConfig = await getTenantConfig(host);

  if (!tenantConfig) {
    return (
      <html lang="es">
        <body className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Servicio no disponible</h1>
            <p className="text-gray-600">No se pudo cargar la configuración del sitio. Intente nuevamente más tarde.</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="es">
      <body className={cn("min-h-screen bg-background font-sans antialiased", manrope.variable, fraunces.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TenantProvider config={tenantConfig}>
            <TenantStyles />
            <CheckoutProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </CheckoutProvider>
            <Toaster />
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
