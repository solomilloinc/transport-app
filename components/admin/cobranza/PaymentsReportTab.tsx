'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
import {
  dateParser,
  numberParser,
  piiStringParser,
  numberArrayParser,
} from '@/hooks/url-parsers';
import { getCashboxPayments, getCashboxPaymentsSummary } from '@/services/cobranza';
import {
  PaymentRow,
  PaymentStatus,
  PAYMENT_STATUS_LABELS,
  COBRANZA_METHOD_LABELS,
} from '@/interfaces/cobranza';
import {
  CashboxPaymentsFilters,
  emptyCashboxPaymentsFilters,
} from '@/interfaces/filters/cashbox-payments-filters';
import { presetRange } from '@/lib/reporting/date-ranges';

import { ReportingDateRangePicker } from '@/components/admin/reporting/ReportingDateRangePicker';
import { StatusFilterMulti } from '@/components/admin/reporting/StatusFilterMulti';
import { ExportButton } from '@/components/admin/reporting/ExportButton';
import { GenericBarChart, GenericPieChart } from '@/components/admin/reporting/ReportingCharts';
import { PaymentsSummaryCards } from './CobranzaSummaryCards';

const parsers = {
  dateFrom: dateParser,
  dateTo: dateParser,
  cashBoxId: numberParser,
  methods: numberArrayParser,
  status: numberParser,
  payerSearch: piiStringParser, // PII
};

const METHOD_OPTIONS = Object.entries(COBRANZA_METHOD_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

const money = (n: number | null | undefined) =>
  n == null ? '—' : `$ ${Math.round(n).toLocaleString('es-AR')}`;

export function PaymentsReportTab({ initialCashBoxId }: { initialCashBoxId?: number }) {
  const defaults = useMemo<CashboxPaymentsFilters>(
    () => ({ ...emptyCashboxPaymentsFilters, ...presetRange('today'), cashBoxId: initialCashBoxId }),
    [initialCashBoxId]
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
  } = useReportFilters<CashboxPaymentsFilters, PaymentRow>({
    defaults,
    parsers,
    apiCall: getCashboxPayments,
    initialPageSize: 50,
    initialSortBy: 'date',
    initialSortDescending: false, // cronológico
  });

  const summary = useReportSummary(applied, getCashboxPaymentsSummary);
  const [view, setView] = useState<'summary' | 'detail'>('detail');

  const handleSort = (key: string) => {
    const sameKey = sortBy?.toLowerCase() === key.toLowerCase();
    setSort(key, sameKey ? !sortDescending : false);
  };

  const columns = [
    {
      header: 'Fecha',
      accessor: 'date',
      width: '16%',
      sortKey: 'date',
      cell: (p: PaymentRow) => {
        try {
          return format(new Date(p.date), 'dd/MM/yyyy HH:mm', { locale: es });
        } catch {
          return p.date;
        }
      },
    },
    {
      header: 'Pagador',
      accessor: 'payerName',
      width: '26%',
      cell: (p: PaymentRow) => (
        <div className="leading-tight">
          <div className="font-medium">{p.payerName || '—'}</div>
          <div className="text-xs text-muted-foreground">
            {p.payerDocumentNumber ? `DNI ${p.payerDocumentNumber}` : p.payerEmail}
          </div>
        </div>
      ),
    },
    {
      header: 'Método',
      accessor: 'method',
      width: '16%',
      sortKey: 'method',
      cell: (p: PaymentRow) => (
        <Badge variant="outline">{COBRANZA_METHOD_LABELS[p.method] ?? p.method}</Badge>
      ),
    },
    {
      header: 'Estado',
      accessor: 'status',
      width: '14%',
      sortKey: 'status',
      cell: (p: PaymentRow) => PAYMENT_STATUS_LABELS[p.status] ?? p.status,
    },
    {
      header: 'Caja',
      accessor: 'cashBoxId',
      width: '10%',
      cell: (p: PaymentRow) => `#${p.cashBoxId}`,
    },
    {
      header: 'Monto',
      accessor: 'amount',
      className: 'text-right',
      width: '18%',
      sortKey: 'amount',
      cell: (p: PaymentRow) => <span className="font-semibold">{money(p.amount)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <FilterBar onReset={reset} onApply={apply} labels={['Fechas', 'Métodos', 'Estado', 'Pagador']}>
            <ReportingDateRangePicker
              value={{ dateFrom: draft.dateFrom ?? '', dateTo: draft.dateTo ?? '' }}
              onChange={(r) => {
                setDraftField('dateFrom', r.dateFrom);
                setDraftField('dateTo', r.dateTo);
              }}
            />
            <StatusFilterMulti
              options={METHOD_OPTIONS}
              value={draft.methods}
              onChange={(v) => setDraftField('methods', v)}
              defaultHint="Por defecto: todos los métodos (el QR entra como Online)."
            />
            <Select
              value={draft.status != null ? String(draft.status) : 'all'}
              onValueChange={(v) => setDraftField('status', v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado del pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.values(PaymentStatus)
                  .filter((v) => typeof v === 'number')
                  .map((v) => (
                    <SelectItem key={v} value={String(v)}>
                      {PAYMENT_STATUS_LABELS[v as number]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Buscar pagador (nombre / doc / email)"
              value={draft.payerSearch ?? ''}
              onChange={(e) => setDraftField('payerSearch', e.target.value)}
            />
          </FilterBar>

          {draft.cashBoxId != null && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                Caja #{draft.cashBoxId}
                <button
                  type="button"
                  onClick={() => {
                    setDraftField('cashBoxId', undefined);
                    apply();
                  }}
                  className="ml-1"
                  aria-label="Quitar filtro de caja"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
              <span className="text-xs text-muted-foreground">Drill-down de una caja</span>
            </div>
          )}
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
                <h3 className="text-lg font-semibold">Pagos</h3>
                <ExportButton
                  endpoint="/api/cashbox/payments/export"
                  filters={applied as Record<string, any>}
                  sortBy={sortBy}
                  sortDescending={sortDescending}
                  disabled={loading}
                />
              </div>
              <DashboardTable
                columns={columns}
                data={data?.items ?? []}
                emptyMessage="No se encontraron pagos para estos filtros."
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
                  itemName="pagos"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4 space-y-6">
          <PaymentsSummaryCards summary={summary.data ?? undefined} loading={summary.loading} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <GenericPieChart
              title="Pagos por método"
              data={summary.data?.byMethod ?? []}
              dataKey="count"
              nameKey="label"
            />
            <GenericBarChart
              title="Monto por método"
              data={summary.data?.byMethod ?? []}
              categoryKey="label"
              valueKey="amount"
              asMoney
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
