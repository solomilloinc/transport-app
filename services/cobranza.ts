import { PagedResponse, PaginationParams } from './types';
import { get, postWithResponse } from './api';
import { withDefaultPagination } from '@/utils/pagination';
import CashBox from '@/interfaces/cash-box';
import { PaymentRow, PaymentsSummary, CashBoxesSummary } from '@/interfaces/cobranza';
import { CashboxPaymentsFilters } from '@/interfaces/filters/cashbox-payments-filters';
import { CashBoxReportFilters } from '@/interfaces/filters/cashbox-filters';

/**
 * Servicios de **Cobranza** (namespace `cashbox/*`): reportes de Pagos y Caja.
 * Auth `Admin` + `Operator` (lo enforcea el backend; el guard de ruta lo cubre
 * `middleware.ts` + la entrada de menú). El export va por Route Handler.
 */

// ─── Pagos (cronológico, grano método) ───────────────────────────────────────

export async function getCashboxPayments(
  params: Partial<PaginationParams> & { filters?: CashboxPaymentsFilters }
): Promise<PagedResponse<PaymentRow>> {
  // Default cronológico: por fecha, ascendente.
  const finalParams = withDefaultPagination({
    sortDescending: false,
    ...params,
    sortBy: params.sortBy ?? 'date',
  });
  return await get<CashboxPaymentsFilters, PagedResponse<PaymentRow>>(
    '/cashbox/payments',
    finalParams
  );
}

export async function getCashboxPaymentsSummary(
  filters?: CashboxPaymentsFilters
): Promise<PaymentsSummary> {
  return await postWithResponse<{ filters?: CashboxPaymentsFilters }, PaymentsSummary>(
    '/cashbox/payments/summary',
    { filters }
  );
}

// ─── Caja (grano caja) ───────────────────────────────────────────────────────

export async function getCashboxReport(
  params: Partial<PaginationParams> & { filters?: CashBoxReportFilters }
): Promise<PagedResponse<CashBox>> {
  const finalParams = withDefaultPagination(params);
  return await get<CashBoxReportFilters, PagedResponse<CashBox>>('/cashbox/report', finalParams);
}

export async function getCashboxReportSummary(
  filters?: CashBoxReportFilters
): Promise<CashBoxesSummary> {
  return await postWithResponse<{ filters?: CashBoxReportFilters }, CashBoxesSummary>(
    '/cashbox/report/summary',
    { filters }
  );
}
