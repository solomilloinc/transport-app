'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { DashboardTable } from '@/components/dashboard/dashboard-table';
import { TablePagination } from '@/components/dashboard/table-pagination';

import { useReportFilters } from '@/hooks/use-report-filters';
import { useReportSummary } from '@/hooks/use-report-summary';
import type { ReportingEntityOptions } from '@/hooks/use-reporting-entity-options';
import {
  dateParser,
  boolParser,
  numberParser,
  piiStringParser,
  stringParser,
  numberArrayParser,
  type UrlParser,
} from '@/hooks/url-parsers';
import { ReportingDateField } from '@/interfaces/reporting';
import {
  getReportingPassengers,
  getReportingPassengersSummary,
} from '@/services/reporting';
import {
  ReportingPassengerRow,
  PASSENGER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/interfaces/reporting';
import { PaymentMethod } from '@/interfaces/payment';
import {
  ReportingPassengersFilters,
  emptyReportingPassengersFilters,
} from '@/interfaces/filters/reporting-passengers-filters';
import { defaultRange } from '@/lib/reporting/date-ranges';

import { ReportingDateRangePicker } from './ReportingDateRangePicker';
import { StatusFilterMulti } from './StatusFilterMulti';
import { EntitySelect } from './EntitySelect';
import { PassengersSummaryCards } from './ReportingSummaryCards';
import { ExportButton } from './ExportButton';
import {
  DayLineChart,
  PaymentMethodPieChart,
  RouteBarChart,
  StatusPieChart,
} from './ReportingCharts';

const parsers = {
  dateField: stringParser as UrlParser<ReportingDateField>,
  dateFrom: dateParser,
  dateTo: dateParser,
  statuses: numberArrayParser,
  tripId: numberParser,
  vehicleId: numberParser,
  driverId: numberParser,
  customerId: numberParser,
  hasTraveled: boolParser,
  onlyFrequent: boolParser,
  search: piiStringParser, // PII
  paymentMethod: numberParser,
};

const STATUS_OPTIONS = Object.entries(PASSENGER_STATUS_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

const money = (n: number | null | undefined) =>
  n == null ? '—' : `$ ${Math.round(n).toLocaleString('es-AR')}`;

function triState(value: boolean | undefined): string {
  return value === undefined ? 'all' : value ? 'true' : 'false';
}
function fromTriState(v: string): boolean | undefined {
  return v === 'all' ? undefined : v === 'true';
}

export function PassengersReportTab({ entityOptions }: { entityOptions: ReportingEntityOptions }) {
  const defaults = useMemo<ReportingPassengersFilters>(
    () => ({ ...emptyReportingPassengersFilters, ...defaultRange() }),
    []
  );

  const {
    draft,
    setDraftField,
    applied,
    apply,
    reset,
    pageNumber,
    setPageNumber,
    sortBy,
    sortDescending,
    setSort,
    data,
    loading,
  } = useReportFilters<ReportingPassengersFilters, ReportingPassengerRow>({
    defaults,
    parsers,
    apiCall: getReportingPassengers,
    initialPageSize: 50,
    initialSortBy: 'reservedate',
    initialSortDescending: true,
  });

  const summary = useReportSummary(applied, getReportingPassengersSummary);
  const [view, setView] = useState<'summary' | 'detail'>('summary');

  const handleSort = (key: string) => {
    const sameKey = sortBy?.toLowerCase() === key.toLowerCase();
    setSort(key, sameKey ? !sortDescending : true);
  };

  const columns = [
    {
      header: 'Fecha',
      accessor: 'reserveDate',
      width: '14%',
      sortKey: 'reservedate',
      cell: (r: ReportingPassengerRow) => (
        <div className="leading-tight">
          <div>{safeDate(r.reserveDate)}</div>
          <div className="text-xs text-muted-foreground">{r.departureHour}</div>
        </div>
      ),
    },
    {
      header: 'Ruta',
      accessor: 'tripName',
      width: '20%',
      sortKey: 'route',
      cell: (r: ReportingPassengerRow) => (
        <div className="leading-tight">
          <div className="font-medium">{r.tripName}</div>
          <div className="text-xs text-muted-foreground">
            {r.originName} → {r.destinationName}
          </div>
        </div>
      ),
    },
    {
      header: 'Pasajero',
      accessor: 'fullName',
      width: '20%',
      sortKey: 'lastname',
      cell: (r: ReportingPassengerRow) => (
        <div className="leading-tight">
          <div className="flex items-center gap-1 font-medium">
            {r.fullName}
            {r.isFrequent && (
              <Badge variant="secondary" className="text-[10px]">
                Frecuente
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">DNI {r.documentNumber}</div>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: 'status',
      width: '12%',
      sortKey: 'status',
      cell: (r: ReportingPassengerRow) => (
        <Badge variant="outline">{PASSENGER_STATUS_LABELS[r.status] ?? r.status}</Badge>
      ),
    },
    {
      header: 'Método',
      accessor: 'paymentMethod',
      width: '12%',
      cell: (r: ReportingPassengerRow) => r.paymentMethod ?? '—',
    },
    {
      header: 'Precio',
      accessor: 'price',
      className: 'text-right',
      width: '11%',
      sortKey: 'price',
      cell: (r: ReportingPassengerRow) => (
        <span className="font-semibold">{money(r.price)}</span>
      ),
    },
    {
      header: 'Deuda vencida',
      accessor: 'overdueBalance',
      className: 'text-right',
      width: '11%',
      cell: (r: ReportingPassengerRow) => (
        <span className={r.overdueBalance ? 'font-medium text-red-600' : 'text-muted-foreground'}>
          {money(r.overdueBalance)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <FilterBar onReset={reset} onApply={apply}>
            <ReportingDateRangePicker
              value={{ dateFrom: draft.dateFrom ?? '', dateTo: draft.dateTo ?? '' }}
              onChange={(r) => {
                setDraftField('dateFrom', r.dateFrom);
                setDraftField('dateTo', r.dateTo);
              }}
            />
            <Select
              value={draft.dateField ?? 'travel'}
              onValueChange={(v) => setDraftField('dateField', v as 'travel' | 'sale')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="travel">Fecha de viaje</SelectItem>
                <SelectItem value="sale">Fecha de venta</SelectItem>
              </SelectContent>
            </Select>
            <StatusFilterMulti
              options={STATUS_OPTIONS}
              value={draft.statuses}
              onChange={(v) => setDraftField('statuses', v)}
              defaultHint="Por defecto: Pendiente, Confirmado, Cancelado y Viajó."
            />
            <EntitySelect
              allLabel="Todas las rutas"
              searchPlaceholder="Buscar ruta..."
              options={entityOptions.tripOptions}
              value={draft.tripId}
              onChange={(v) => setDraftField('tripId', v)}
            />
            <EntitySelect
              allLabel="Todos los vehículos"
              searchPlaceholder="Buscar vehículo..."
              options={entityOptions.vehicleOptions}
              value={draft.vehicleId}
              onChange={(v) => setDraftField('vehicleId', v)}
            />
            <EntitySelect
              allLabel="Todos los choferes"
              searchPlaceholder="Buscar chofer..."
              options={entityOptions.driverOptions}
              value={draft.driverId}
              onChange={(v) => setDraftField('driverId', v)}
            />
            <Input
              placeholder="Buscar nombre / documento / email"
              value={draft.search ?? ''}
              onChange={(e) => setDraftField('search', e.target.value)}
            />
            <Select
              value={draft.paymentMethod != null ? String(draft.paymentMethod) : 'all'}
              onValueChange={(v) =>
                setDraftField('paymentMethod', v === 'all' ? undefined : Number(v))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                {Object.values(PaymentMethod)
                  .filter((v) => typeof v === 'number')
                  .map((v) => (
                    <SelectItem key={v} value={String(v)}>
                      {PAYMENT_METHOD_LABELS[v as number]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={triState(draft.hasTraveled)}
              onValueChange={(v) => setDraftField('hasTraveled', fromTriState(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="¿Viajó?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Viajó: todos</SelectItem>
                <SelectItem value="true">Sólo los que viajaron</SelectItem>
                <SelectItem value="false">Sólo los que no viajaron</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={draft.onlyFrequent ? 'true' : 'all'}
              onValueChange={(v) => setDraftField('onlyFrequent', v === 'true' ? true : undefined)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pasajeros</SelectItem>
                <SelectItem value="true">Sólo frecuentes</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </CardContent>
      </Card>

      {/* Resumen vs Detalle: sub-pestañas para no scrollear todo junto */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'summary' | 'detail')}>
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="detail">Detalle</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-6">
          <PassengersSummaryCards totals={summary.data?.totals} loading={summary.loading} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatusPieChart title="Pasajeros por estado" data={summary.data?.byStatus ?? []} />
            <PaymentMethodPieChart
              title="Pasajeros por método de pago"
              data={summary.data?.byPaymentMethod ?? []}
            />
            <RouteBarChart
              title="Vendido por ruta"
              data={summary.data?.byRoute ?? []}
              valueKey="soldAmount"
            />
            <DayLineChart
              title="Pasajeros por día"
              data={summary.data?.byDay ?? []}
              valueKey="count"
            />
          </div>
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Detalle de pasajeros</h3>
                <ExportButton
                  family="passengers"
                  filters={applied as Record<string, any>}
                  sortBy={sortBy}
                  sortDescending={sortDescending}
                  disabled={loading}
                />
              </div>
              <DashboardTable
                columns={columns}
                data={data?.items ?? []}
                emptyMessage="No se encontraron pasajeros para estos filtros."
                isLoading={loading}
                skeletonRows={10}
                sortBy={sortBy}
                sortDescending={sortDescending}
                onSort={handleSort}
              />
              {(data?.items?.length ?? 0) > 0 && (
                <TablePagination
                  currentPage={pageNumber}
                  totalPages={data?.totalPages ?? 0}
                  totalItems={data?.totalRecords ?? 0}
                  itemsPerPage={data?.pageSize ?? 50}
                  onPageChange={setPageNumber}
                  itemName="pasajeros"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function safeDate(iso: string): string {
  try {
    return format(new Date(iso), 'dd/MM/yyyy', { locale: es });
  } catch {
    return iso;
  }
}
