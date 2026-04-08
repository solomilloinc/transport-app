import { Passenger } from "@/interfaces/passengers";
import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { withDefaultPagination } from "@/utils/pagination";
import { get } from "./api";
import { CustomerReportFilters } from "@/interfaces/filters/customer-filters";

/** @deprecated usar `getCustomerReport` para trabajar con `useReportFilters`. */
export const getPassengers = (
  params: Partial<PaginationParams> & { filters?: CustomerReportFilters }
): UseApiCall<Passenger> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<CustomerReportFilters, PagedResponse<Passenger>>('/customer-report', finalParams),
  };
};

export async function getCustomerReport(
  params: Partial<PaginationParams> & { filters?: CustomerReportFilters }
): Promise<PagedResponse<Passenger>> {
  const finalParams = withDefaultPagination(params);
  return await get<CustomerReportFilters, PagedResponse<Passenger>>('/customer-report', finalParams);
}