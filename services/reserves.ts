import { VehicleType } from "@/interfaces/vehicleType";
import { PagedRequest, PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get, post } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { ReservePaymentSummary, ReserveReport, ReserveReportResponse } from "@/interfaces/reserve";
import { PassengerReserveReport } from "@/interfaces/passengerReserve";

export interface GetReservesParams {
  /** Fecha del reporte en formato `yyyyMMdd`. */
  date: string;
  /** Ruta (`Trip`) por la que filtrar. `null`/omitido ⇒ todas las del día. */
  tripId?: number | null;
}

/**
 * Reporte de reservas del día. Devuelve el wrapper `{ reserves, availableTrips }`.
 * Filtra por Ruta server-side vía `filters.tripId`. El sort y el pageSize se
 * fijan para este endpoint (acepta `reservedate|serviceorigin|servicedest`, no
 * `fecha`); pageSize 50 para que un día entre en una página sin paginador.
 */
export const getReserves = ({ date, tripId }: GetReservesParams): UseApiCall<ReserveReport, ReserveReportResponse> => {
  const finalParams = withDefaultPagination({
    sortBy: 'departurehour',
    sortDescending: false,
    pageSize: 250, // para que el backend no aplique paginación (el endpoint devuelve todo el día)
    filters: tripId ? { tripId } : {},
  });
  return {
    call: get<any, ReserveReportResponse>(`/reserve-report/${date}`, finalParams),
  };
};

export const getPassengerReserves = (id: number): UseApiCall<PassengerReserveReport> => {
  const finalParams = withDefaultPagination();
  return {
    call: get<any, PagedResponse<PassengerReserveReport>>(`/passenger-reserve-report/${id}`, finalParams),
  };
};

export const getReservePaymentSummary = (reserveId: number): UseApiCall<ReservePaymentSummary> => {
  const finalParams = withDefaultPagination();
  return {
    call: get<any, PagedResponse<ReservePaymentSummary>>(`/reserve-payment-summary/${reserveId}`, finalParams),
  };
}
