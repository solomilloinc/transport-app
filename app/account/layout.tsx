import { ReactNode } from 'react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { AccountSectionNav } from '@/components/account/account-section-nav';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Area cliente"
        description="Consulta tus reservas, mantene tus datos al dia y completa tu perfil cuando haga falta."
      />

      <Card>
        <CardContent className="pt-6">
          <AccountSectionNav />
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
