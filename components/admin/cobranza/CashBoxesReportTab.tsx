'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReceiptText } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { dateParser, numberParser, stringParser } from '@/hooks/url-parsers';
import { getCashboxReport, getCashboxReportSummary } from '@/services/cobranza';
import CashBox from '@/interfaces/cash-box';
import { CASHBOX_STATUS_LABELS } from '@/interfaces/cobranza';
import {
  CashBoxReportFilters,
  emptyCashBoxReportFilters,
} from '@/interfaces/filters/cashbox-filters';
import { presetRange } from '@/lib/reporting/date-ranges';

import { ReportingDateRangePicker } from '@/components/admin/reporting/ReportingDateRangePicker';
import { ExportButton } from '@/components/admin/reporting/ExportButton';
import { GenericBarChart, GenericPieChart } from '@/components/admin/reporting/ReportingCharts';
import { CashBoxesSummaryCards } from './CobranzaSummaryCards';

const parsers = {
  fromDate: dateParser,
  toDate: dateParser,
  status: stringParser,
  openedByUserId: numberParser,
  closedByUserId: numberParser,
};

const money = (n: number | null | undefined) =>
  n == null ? '—' : `$ ${Math.round(n).toLocaleString('es-AR')}`;
const safeDateTime = (iso?: string) => {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return iso;
  }
};

export function CashBoxesReportTab({
  onDrillToPayments,
}: {
  onDrillToPayments: (cashBoxId: number) => void;
}) {
  const defaults = useMemo<CashBoxReportFilters>(() => {
    const r = presetRange('last30');
    return { ...emptyCashBoxReportFilters, fromDate: r.dateFrom, toDate: r.dateTo };
  }, []);

  const { draft, setDraftField, applied, apply, reset, pageNumber, setPageNumber, data, loading } =
    useReportFilters<CashBoxReportFilters, CashBox>({
      defaults,
      parsers,
      apiCall: getCashboxReport,
      initialPageSize: 50,
    });

  const summary = useReportSummary(applied, getCashboxReportSummary);
  const [view, setView] = useState<'summary' | 'detail'>('detail');

  const columns = [
    {
      header: 'Apertura',
      accessor: 'openedAt',
      width: '15%',
      cell: (c: CashBox) => safeDateTime(c.openedAt),
    },
    {
      header: 'Cierre',
      accessor: 'closedAt',
      width: '15%',
      cell: (c: CashBox) => safeDateTime(c.closedAt),
    },
    {
      header: 'Estado',
      accessor: 'status',
      width: '10%',
      cell: (c: CashBox) => (
        <Badge variant={c.status === 'Open' ? 'default' : 'outline'}>
          {CASHBOX_STATUS_LABELS[c.status as 'Open' | 'Closed'] ?? c.status}
        </Badge>
      ),
    },
    {
      header: 'Abrió / Cerró',
      accessor: 'openedByUserEmail',
      width: '22%',
      cell: (c: CashBox) => (
        <div className="leading-tight">
          <div className="text-xs">{c.openedByUserEmail || '—'}</div>
          <div className="text-xs text-muted-foreground">{c.closedByUserEmail || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Pagos',
      accessor: 'totalPayments',
      className: 'text-right',
      width: '9%',
      cell: (c: CashBox) => (c.totalPayments ?? 0).toLocaleString('es-AR'),
    },
    {
      header: 'Total',
      accessor: 'totalAmount',
      className: 'text-right',
      width: '14%',
      cell: (c: CashBox) => <span className="font-semibold">{money(c.totalAmount)}</span>,
    },
    {
      header: '',
      accessor: 'actions',
      className: 'text-right',
      width: '15%',
      cell: (c: CashBox) => (
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => onDrillToPayments(c.cashBoxId)}
        >
          <ReceiptText className="mr-1 h-3.5 w-3.5" />
          Ver pagos
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <FilterBar onReset={reset} onApply={apply}>
            <ReportingDateRangePicker
              value={{ dateFrom: draft.fromDate ?? '', dateTo: draft.toDate ?? '' }}
              onChange={(r) => {
                setDraftField('fromDate', r.dateFrom);
                setDraftField('toDate', r.dateTo);
              }}
            />
            <Select
              value={draft.status || 'all'}
              onValueChange={(v) => setDraftField('status', v === 'all' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado de caja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cajas</SelectItem>
                <SelectItem value="Open">Abiertas</SelectItem>
                <SelectItem value="Closed">Cerradas</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </CardContent>
      </Card>

      <Tabs value={view} onValueChange={(v) => setView(v as 'summary' | 'detail')}>
        <TabsList>
          <TabsTrigger value="detail">Detalle</TabsTrigger>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent value="detail" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Cajas</h3>
                <ExportButton
                  endpoint="/api/cashbox/report/export"
                  filters={applied as Record<string, any>}
                  disabled={loading}
                />
              </div>
              <DashboardTable
                columns={columns}
                data={data?.items ?? []}
                emptyMessage="No se encontraron cajas para estos filtros."
                isLoading={loading}
                skeletonRows={10}
              />
              {(data?.items?.length ?? 0) > 0 && (
                <TablePagination
                  currentPage={pageNumber}
                  totalPages={data?.totalPages ?? 0}
                  totalItems={data?.totalRecords ?? 0}
                  itemsPerPage={data?.pageSize ?? 50}
                  onPageChange={setPageNumber}
                  itemName="cajas"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4 space-y-6">
          <CashBoxesSummaryCards summary={summary.data ?? undefined} loading={summary.loading} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <GenericPieChart
              title="Monto por método"
              data={summary.data?.byMethod ?? []}
              dataKey="amount"
              nameKey="paymentMethodName"
            />
            <GenericBarChart
              title="Monto por método"
              data={summary.data?.byMethod ?? []}
              categoryKey="paymentMethodName"
              valueKey="amount"
              asMoney
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
