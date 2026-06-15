import { PagedResponse, PaginationParams } from './types';
import { get, postWithResponse } from './api';
import { withDefaultPagination } from '@/utils/pagination';
import {
  ReportingPassengerRow,
  ReportingPassengersSummary,
  ReportingReserveRow,
  ReportingReservesSummary,
} from '@/interfaces/reporting';
import { ReportingPassengersFilters } from '@/interfaces/filters/reporting-passengers-filters';
import { ReportingReservesFilters } from '@/interfaces/filters/reporting-reserves-filters';

/**
 * Servicios de **Reportería** (namespace `reporting/*`). Distinto del reporte
 * operativo del día (`reserve-report/{date}`). Auth `Admin` (lo enforcea el
 * backend; el guard de ruta lo cubre `middleware.ts` + la entrada de menú).
 *
 * Las grillas usan el helper `get` (que en este repo hace POST para reportes);
 * los summary usan `postWithResponse` porque devuelven un objeto plano (no paginado).
 * El export NO pasa por acá: va por Route Handler (ver ADR 0005 / `services/reporting-export.ts`).
 */

// ─── Por pasajero ────────────────────────────────────────────────────────────

export async function getReportingPassengers(
  params: Partial<PaginationParams> & { filters?: ReportingPassengersFilters }
): Promise<PagedResponse<ReportingPassengerRow>> {
  const finalParams = withDefaultPagination({ ...params, sortBy: params.sortBy ?? 'reservedate' });
  return await get<ReportingPassengersFilters, PagedResponse<ReportingPassengerRow>>(
    '/reporting/passengers',
    finalParams
  );
}

export async function getReportingPassengersSummary(
  filters?: ReportingPassengersFilters
): Promise<ReportingPassengersSummary> {
  return await postWithResponse<
    { filters?: ReportingPassengersFilters },
    ReportingPassengersSummary
  >('/reporting/passengers/summary', { filters });
}

// ─── Por reserva ─────────────────────────────────────────────────────────────

export async function getReportingReserves(
  params: Partial<PaginationParams> & { filters?: ReportingReservesFilters }
): Promise<PagedResponse<ReportingReserveRow>> {
  const finalParams = withDefaultPagination({ ...params, sortBy: params.sortBy ?? 'reservedate' });
  return await get<ReportingReservesFilters, PagedResponse<ReportingReserveRow>>(
    '/reporting/reserves',
    finalParams
  );
}

export async function getReportingReservesSummary(
  filters?: ReportingReservesFilters
): Promise<ReportingReservesSummary> {
  return await postWithResponse<
    { filters?: ReportingReservesFilters },
    ReportingReservesSummary
  >('/reporting/reserves/summary', { filters });
}
