'use client';

import { useState } from 'react';
import { Users, Bus } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PassengersReportTab } from '@/components/admin/reporting/PassengersReportTab';
import { ReservesReportTab } from '@/components/admin/reporting/ReservesReportTab';
import { useReportingEntityOptions } from '@/hooks/use-reporting-entity-options';

type ReportTab = 'passengers' | 'reserves';

export default function ReportingPage() {
  const [tab, setTab] = useState<ReportTab>('passengers');
  // Se cargan una sola vez a nivel página: así no se re-piden al cambiar de familia
  // (los tabs se desmontan, pero la página no).
  const entityOptions = useReportingEntityOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportería de reservas"
        description="Análisis de ventas y ocupación sobre un rango de fechas, con gráficos y export a Excel."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as ReportTab)}>
        <TabsList>
          <TabsTrigger value="passengers">
            <Users className="mr-2 h-4 w-4" />
            Por pasajero
          </TabsTrigger>
          <TabsTrigger value="reserves">
            <Bus className="mr-2 h-4 w-4" />
            Por reserva
          </TabsTrigger>
        </TabsList>

        <TabsContent value="passengers" className="mt-6">
          <PassengersReportTab entityOptions={entityOptions} />
        </TabsContent>
        <TabsContent value="reserves" className="mt-6">
          <ReservesReportTab entityOptions={entityOptions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
