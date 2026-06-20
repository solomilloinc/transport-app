'use client';

import type { ReactNode } from 'react';
import { Banknote, Coins, HandCoins, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentsSummary, CashBoxesSummary } from '@/interfaces/cobranza';

const money = (n: number) => `$ ${Math.round(n ?? 0).toLocaleString('es-AR')}`;
const num = (n: number) => (n ?? 0).toLocaleString('es-AR');

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        <h3 className={`text-2xl font-bold ${accent ?? ''}`}>{value}</h3>
      </CardContent>
    </Card>
  );
}

function CardsSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-7 w-28" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function PaymentsSummaryCards({
  summary,
  loading,
}: {
  summary: PaymentsSummary | undefined;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {loading && !summary ? (
        <CardsSkeleton count={2} />
      ) : (
        <>
          <StatCard
            label="Pagos"
            value={num(summary?.totals.count ?? 0)}
            icon={<Receipt className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            label="Total cobrado"
            value={money(summary?.totals.amount ?? 0)}
            icon={<HandCoins className="h-5 w-5 text-green-500" />}
            accent="text-green-600"
          />
        </>
      )}
    </div>
  );
}

export function CashBoxesSummaryCards({
  summary,
  loading,
}: {
  summary: CashBoxesSummary | undefined;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {loading && !summary ? (
        <CardsSkeleton count={3} />
      ) : (
        <>
          <StatCard
            label="Cajas"
            value={num(summary?.cashBoxesCount ?? 0)}
            icon={<Coins className="h-5 w-5 text-violet-500" />}
          />
          <StatCard
            label="Pagos"
            value={num(summary?.paymentsCount ?? 0)}
            icon={<Receipt className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            label="Total"
            value={money(summary?.totalAmount ?? 0)}
            icon={<Banknote className="h-5 w-5 text-green-500" />}
            accent="text-green-600"
          />
        </>
      )}
    </div>
  );
}
