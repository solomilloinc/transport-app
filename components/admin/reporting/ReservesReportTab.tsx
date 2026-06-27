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
  stringParser,
  numberArrayParser,
  type UrlParser,
} from '@/hooks/url-parsers';
import { ReportingDateField } from '@/interfaces/reporting';
import {
  getReportingReserves,
  getReportingReservesSummary,
} from '@/services/reporting';
import { ReportingReserveRow, RESERVE_STATUS_LABELS } from '@/interfaces/reporting';
import {
  ReportingReservesFilters,
  ReserveReportingSource,
  emptyReportingReservesFilters,
} from '@/interfaces/filters/reporting-reserves-filters';
import { defaultRange } from '@/lib/reporting/date-ranges';

import { ReportingDateRangePicker } from './ReportingDateRangePicker';
import { StatusFilterMulti } from './StatusFilterMulti';
import { EntitySelect } from './EntitySelect';
import { ReservesSummaryCards } from './ReportingSummaryCards';
import { ExportButton } from './ExportButton';
import {
  DayLineChart,
  OccupancyHistogram,
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
  isHoliday: boolParser,
  source: stringParser as UrlParser<ReserveReportingSource>,
  onlyWithAvailability: boolParser,
  onlyWithPassengers: boolParser,
  minOccupancyPct: numberParser,
  maxOccupancyPct: numberParser,
};

const STATUS_OPTIONS = Object.entries(RESERVE_STATUS_LABELS).map(([value, label]) => ({
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

export function ReservesReportTab({ entityOptions }: { entityOptions: ReportingEntityOptions }) {
  const defaults = useMemo<ReportingReservesFilters>(
    () => ({ ...emptyReportingReservesFilters, ...defaultRange() }),
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
  } = useReportFilters<ReportingReservesFilters, ReportingReserveRow>({
    defaults,
    parsers,
    apiCall: getReportingReserves,
    initialPageSize: 50,
    initialSortBy: 'reservedate',
    initialSortDescending: true,
  });

  const summary = useReportSummary(applied, getReportingReservesSummary);
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
      cell: (r: ReportingReserveRow) => (
        <div className="leading-tight">
          <div>{safeDate(r.reserveDate)}</div>
          <div className="text-xs text-muted-foreground">{r.departureHour}</div>
        </div>
      ),
    },
    {
      header: 'Ruta',
      accessor: 'tripName',
      width: '22%',
      sortKey: 'route',
      cell: (r: ReportingReserveRow) => (
        <div className="leading-tight">
          <div className="flex items-center gap-1 font-medium">
            {r.tripName}
            {r.isHoliday && (
              <Badge variant="secondary" className="text-[10px]">
                Feriado
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {r.originName} → {r.destinationName}
          </div>
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: 'status',
      width: '12%',
      sortKey: 'status',
      cell: (r: ReportingReserveRow) => (
        <Badge variant="outline">{RESERVE_STATUS_LABELS[r.status] ?? r.status}</Badge>
      ),
    },
    {
      header: 'Coche',
      accessor: 'internalNumber',
      width: '8%',
      cell: (r: ReportingReserveRow) => r.internalNumber || '—',
    },
    {
      header: 'Ocupación',
      accessor: 'occupancyPct',
      width: '16%',
      sortKey: 'occupancy',
      cell: (r: ReportingReserveRow) => (
        <div className="leading-tight">
          <div className="font-medium">{r.occupancyPct}%</div>
          <div className="text-xs text-muted-foreground">
            {r.reservedCount}/{r.capacity} · {r.availableCount} libres
          </div>
        </div>
      ),
    },
    {
      header: 'Vendido',
      accessor: 'soldAmount',
      className: 'text-right',
      width: '14%',
      cell: (r: ReportingReserveRow) => (
        <span className="font-semibold">{money(r.soldAmount)}</span>
      ),
    },
    {
      header: 'Cobrado',
      accessor: 'collectedAmount',
      className: 'text-right',
      width: '14%',
      cell: (r: ReportingReserveRow) => (
        <span className="text-green-600">{money(r.collectedAmount)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <FilterBar onReset={reset} onApply={apply} labels={['Fechas', 'Campo fecha', 'Estados', 'Ruta', 'Vehículo', 'Chofer', 'Origen', 'Feriado', 'Cupo', 'Pasajeros', 'Ocupación']}>
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
              defaultHint="Por defecto: Confirmada, Cancelada y Completada."
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
            <Select
              value={draft.source ?? 'all'}
              onValueChange={(v) =>
                setDraftField('source', v === 'all' ? undefined : (v as 'service' | 'manual'))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                <SelectItem value="service">Servicio</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={triState(draft.isHoliday)}
              onValueChange={(v) => setDraftField('isHoliday', fromTriState(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Feriado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Feriado: todos</SelectItem>
                <SelectItem value="true">Sólo feriados</SelectItem>
                <SelectItem value="false">Sólo no feriados</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={draft.onlyWithAvailability ? 'true' : 'all'}
              onValueChange={(v) =>
                setDraftField('onlyWithAvailability', v === 'true' ? true : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Con o sin cupo</SelectItem>
                <SelectItem value="true">Sólo con cupo disponible</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={draft.onlyWithPassengers ? 'true' : 'all'}
              onValueChange={(v) =>
                setDraftField('onlyWithPassengers', v === 'true' ? true : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Con o sin pasajeros</SelectItem>
                <SelectItem value="true">Sólo con pasajeros</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Ocup. mín %"
                value={draft.minOccupancyPct ?? ''}
                onChange={(e) =>
                  setDraftField(
                    'minOccupancyPct',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
              />
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="Ocup. máx %"
                value={draft.maxOccupancyPct ?? ''}
                onChange={(e) =>
                  setDraftField(
                    'maxOccupancyPct',
                    e.target.value === '' ? undefined : Number(e.target.value)
                  )
                }
              />
            </div>
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
          <ReservesSummaryCards totals={summary.data?.totals} loading={summary.loading} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatusPieChart title="Reservas por estado" data={summary.data?.byStatus ?? []} />
            <OccupancyHistogram
              title="Distribución de ocupación"
              data={summary.data?.occupancyDistribution ?? []}
            />
            <RouteBarChart
              title="Reservas por ruta"
              data={summary.data?.byRoute ?? []}
              valueKey="count"
            />
            <DayLineChart
              title="Reservas por día"
              data={summary.data?.byDay ?? []}
              valueKey="count"
            />
          </div>
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Detalle de reservas</h3>
                <ExportButton
                  endpoint="/api/reporting/reserves/export"
                  filters={applied as Record<string, any>}
                  sortBy={sortBy}
                  sortDescending={sortDescending}
                  disabled={loading}
                />
              </div>
              <DashboardTable
                columns={columns}
                data={data?.items ?? []}
                emptyMessage="No se encontraron reservas para estos filtros."
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
                  itemName="reservas"
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
