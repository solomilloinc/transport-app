import { VehicleType } from "@/interfaces/vehicleType";
import { PagedRequest, PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get, getPure, post } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { ReservePaymentSummary, ReserveReport } from "@/interfaces/reserve";
import { PassengerReserveReport } from "@/interfaces/passengerReserve";
import { PassengerPaymentCreate } from "@/interfaces/payment";
import { AxiosError } from "axios";

export const getReserves = (date: string): UseApiCall<ReserveReport> => {
  const finalParams = withDefaultPagination();
  return {
    call: get<any, PagedResponse<ReserveReport>>(`/reserve-report/${date}`, finalParams),
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

const getFirstItem = <T>(response: any): T | null => {
  const items = response?.Items ?? response?.items;
  if (Array.isArray(items) && items.length > 0) {
    const first = items[0];
    if (first && typeof first === 'object') {
      return {
        ...first,
        ReserveId: first.ReserveId ?? first.reserveId,
        BookingId: first.BookingId ?? first.bookingId ?? null,
        CashBoxId: first.CashBoxId ?? first.cashBoxId,
        PaymentsByMethod: first.PaymentsByMethod ?? first.paymentsByMethod ?? [],
        TotalAmount: first.TotalAmount ?? first.totalAmount ?? 0,
      } as T;
    }
    return first as T;
  }
  if (response && typeof response === 'object' && ('ReserveId' in response || 'reserveId' in response)) {
    return {
      ...response,
      ReserveId: response.ReserveId ?? response.reserveId,
      BookingId: response.BookingId ?? response.bookingId ?? null,
      CashBoxId: response.CashBoxId ?? response.cashBoxId,
      PaymentsByMethod: response.PaymentsByMethod ?? response.paymentsByMethod ?? [],
      TotalAmount: response.TotalAmount ?? response.totalAmount ?? 0,
    } as T;
  }
  return null;
};

const isMethodFallbackError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return status === 404 || status === 405;
  }
  const maybeAxios = error as { response?: { status?: number } };
  return maybeAxios?.response?.status === 404 || maybeAxios?.response?.status === 405;
};

export async function getReservePaymentSummaryCompat(reserveId: number): Promise<ReservePaymentSummary | null> {
  const finalParams = withDefaultPagination();
  try {
    const report = await get<any, PagedResponse<ReservePaymentSummary>>(`/reserve-payment-summary/${reserveId}`, finalParams);
    return getFirstItem<ReservePaymentSummary>(report);
  } catch (error) {
    if (!isMethodFallbackError(error)) throw error;
    const legacy = await getPure<any>(`/reserve-payment-summary/${reserveId}`);
    return getFirstItem<ReservePaymentSummary>(legacy);
  }
}

export async function getBookingPaymentSummary(bookingId: number): Promise<ReservePaymentSummary | null> {
  const finalParams = withDefaultPagination();
  const response = await get<any, PagedResponse<ReservePaymentSummary>>(`/booking-payment-summary/${bookingId}`, finalParams);
  return getFirstItem<ReservePaymentSummary>(response);
}

export async function createReserveOrBookingPayments({
  reserveId,
  customerId,
  bookingId,
  payments,
}: {
  reserveId: number;
  customerId: number;
  bookingId?: number | null;
  payments: PassengerPaymentCreate[];
}): Promise<number> {
  if (bookingId) {
    return post(`/booking-payments-create/${bookingId}/${customerId}`, payments);
  }
  return post(`/reserve-payments-create/${reserveId}/${customerId}`, payments);
}
