'use client';

import type { ReactNode } from 'react';
import {
  Ban,
  Bus,
  DollarSign,
  Gauge,
  HandCoins,
  Receipt,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ReportingPassengersTotals,
  ReportingReservesTotals,
} from '@/interfaces/reporting';

const money = (n: number) => `$ ${Math.round(n ?? 0).toLocaleString('es-AR')}`;
const num = (n: number) => (n ?? 0).toLocaleString('es-AR');

function StatCard({
  label,
  value,
  icon,
  accent,
  hint,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon}
        </div>
        <h3 className={`text-2xl font-bold ${accent ?? ''}`}>{value}</h3>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
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

export function PassengersSummaryCards({
  totals,
  loading,
}: {
  totals: ReportingPassengersTotals | undefined;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {loading && !totals ? (
        <CardsSkeleton count={4} />
      ) : (
        <>
          <StatCard
            label="Vendido"
            value={money(totals?.soldAmount ?? 0)}
            icon={<DollarSign className="h-5 w-5 text-blue-500" />}
            accent="text-blue-600"
            hint={`${num(totals?.passengers ?? 0)} pasajeros · ${num(totals?.traveled ?? 0)} viajaron`}
          />
          <StatCard
            label="Cobrado"
            value={money(totals?.collectedAmount ?? 0)}
            icon={<HandCoins className="h-5 w-5 text-green-500" />}
            accent="text-green-600"
          />
          <StatCard
            label="Deuda"
            value={money(totals?.debt ?? 0)}
            icon={<Receipt className="h-5 w-5 text-amber-500" />}
            accent="text-amber-600"
            hint="Vendido − Cobrado"
          />
          <StatCard
            label="Cancelado"
            value={money(totals?.cancelledAmount ?? 0)}
            icon={<Ban className="h-5 w-5 text-red-500" />}
            accent="text-red-600"
            hint={`${num(totals?.cancelled ?? 0)} cancelados · no suma en Vendido`}
          />
        </>
      )}
    </div>
  );
}

export function ReservesSummaryCards({
  totals,
  loading,
}: {
  totals: ReportingReservesTotals | undefined;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {loading && !totals ? (
        <CardsSkeleton count={4} />
      ) : (
        <>
          <StatCard
            label="Reservas"
            value={num(totals?.reserves ?? 0)}
            icon={<Bus className="h-5 w-5 text-blue-500" />}
            hint={`${num(totals?.passengers ?? 0)} pasajeros · ${num(totals?.capacity ?? 0)} cupos`}
          />
          <StatCard
            label="Ocupación promedio"
            value={`${(totals?.averageOccupancyPct ?? 0).toLocaleString('es-AR', {
              maximumFractionDigits: 1,
            })}%`}
            icon={<Gauge className="h-5 w-5 text-violet-500" />}
            accent="text-violet-600"
          />
          <StatCard
            label="Vendido"
            value={money(totals?.soldAmount ?? 0)}
            icon={<DollarSign className="h-5 w-5 text-blue-500" />}
            accent="text-blue-600"
          />
          <StatCard
            label="Cobrado"
            value={money(totals?.collectedAmount ?? 0)}
            icon={<HandCoins className="h-5 w-5 text-green-500" />}
            accent="text-green-600"
          />
        </>
      )}
    </div>
  );
}
