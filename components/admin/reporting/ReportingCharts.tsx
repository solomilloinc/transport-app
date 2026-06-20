'use client';

import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import {
  ReportingDayBucket,
  ReportingOccupancyBucket,
  ReportingPaymentMethodBucket,
  ReportingRouteBucket,
  ReportingStatusBucket,
} from '@/interfaces/reporting';

const COLORS = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
];

const money = (n: number) => `$ ${Math.round(n).toLocaleString('es-AR')}`;
const shortDay = (iso: string) => {
  try {
    return format(new Date(iso), 'dd/MM', { locale: es });
  } catch {
    return iso;
  }
};

function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Sin datos en este rango.
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function StatusPieChart({
  title,
  data,
}: {
  title: string;
  data: ReportingStatusBucket[];
}) {
  return (
    <ChartCard title={title} empty={!data?.length}>
      <ChartContainer config={{}} className="aspect-auto h-[240px] w-full">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString('es-AR')} />
          <Legend />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function PaymentMethodPieChart({
  title,
  data,
}: {
  title: string;
  data: ReportingPaymentMethodBucket[];
}) {
  return (
    <ChartCard title={title} empty={!data?.length}>
      <ChartContainer config={{}} className="aspect-auto h-[240px] w-full">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, _name: any, item: any) =>
              [
                `${v.toLocaleString('es-AR')} · ${money(item?.payload?.soldAmount ?? 0)}`,
                item?.payload?.label,
              ] as [string, string]
            }
          />
          <Legend />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function RouteBarChart({
  title,
  data,
  valueKey = 'count',
}: {
  title: string;
  data: ReportingRouteBucket[];
  valueKey?: 'count' | 'soldAmount';
}) {
  const top = [...(data ?? [])]
    .sort((a, b) => (b[valueKey] ?? 0) - (a[valueKey] ?? 0))
    .slice(0, 8);
  return (
    <ChartCard title={title} empty={!top.length}>
      <ChartContainer config={{}} className="aspect-auto h-[240px] w-full">
        <BarChart data={top} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="tripName"
            width={120}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number) =>
              valueKey === 'soldAmount' ? money(v) : v.toLocaleString('es-AR')
            }
          />
          <Bar dataKey={valueKey} fill={COLORS[0]} radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function DayLineChart({
  title,
  data,
  valueKey = 'count',
}: {
  title: string;
  data: ReportingDayBucket[];
  valueKey?: 'count' | 'soldAmount';
}) {
  return (
    <ChartCard title={title} empty={!data?.length}>
      <ChartContainer config={{}} className="aspect-auto h-[240px] w-full">
        <LineChart data={data} margin={{ left: 8, right: 16 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDay}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11 }} />
          <Tooltip
            labelFormatter={(l) => shortDay(String(l))}
            formatter={(v: number) =>
              valueKey === 'soldAmount' ? money(v) : v.toLocaleString('es-AR')
            }
          />
          <Line type="monotone" dataKey={valueKey} stroke={COLORS[0]} strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function OccupancyHistogram({
  title,
  data,
}: {
  title: string;
  data: ReportingOccupancyBucket[];
}) {
  const empty = !data?.length || data.every((b) => b.count === 0);
  return (
    <ChartCard title={title} empty={empty}>
      <ChartContainer config={{}} className="aspect-auto h-[240px] w-full">
        <BarChart data={data} margin={{ left: 8, right: 16 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} width={40} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => v.toLocaleString('es-AR')} />
          <Bar dataKey="count" fill={COLORS[4]} radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

// ─── Genéricos (reusables por Cobranza u otros) ──────────────────────────────

export function GenericPieChart({
  title,
  data,
  dataKey = 'count',
  nameKey = 'label',
}: {
  title: string;
  data: any[];
  dataKey?: string;
  nameKey?: string;
}) {
  return (
    <ChartCard title={title} empty={!data?.length}>
      <ChartContainer config={{}} className="aspect-auto h-[240px] w-full">
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={50} outerRadius={90}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => v.toLocaleString('es-AR')} />
          <Legend />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function GenericBarChart({
  title,
  data,
  categoryKey,
  valueKey,
  asMoney = false,
}: {
  title: string;
  data: any[];
  categoryKey: string;
  valueKey: string;
  asMoney?: boolean;
}) {
  return (
    <ChartCard title={title} empty={!data?.length}>
      <ChartContainer config={{}} className="aspect-auto h-[240px] w-full">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey={categoryKey}
            width={120}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(v: number) => (asMoney ? money(v) : v.toLocaleString('es-AR'))} />
          <Bar dataKey={valueKey} fill={COLORS[1]} radius={4} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
