'use client';

import { useState } from 'react';
import { Receipt, Coins } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentsReportTab } from '@/components/admin/cobranza/PaymentsReportTab';
import { CashBoxesReportTab } from '@/components/admin/cobranza/CashBoxesReportTab';

type CobranzaTab = 'payments' | 'cashboxes';

export default function CobranzaPage() {
  const [tab, setTab] = useState<CobranzaTab>('payments');
  const [drillCashBoxId, setDrillCashBoxId] = useState<number | undefined>(undefined);

  const handleDrill = (cashBoxId: number) => {
    setDrillCashBoxId(cashBoxId);
    setTab('payments');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobranza"
        description="Pagos en orden cronológico y reporte de cajas, con totales por método y export a Excel."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as CobranzaTab)}>
        <TabsList>
          <TabsTrigger value="payments">
            <Receipt className="mr-2 h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="cashboxes">
            <Coins className="mr-2 h-4 w-4" />
            Caja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-6">
          <PaymentsReportTab initialCashBoxId={drillCashBoxId} />
        </TabsContent>
        <TabsContent value="cashboxes" className="mt-6">
          <CashBoxesReportTab onDrillToPayments={handleDrill} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
