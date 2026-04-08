import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { withDefaultPagination } from "@/utils/pagination";
import { get } from "./api";
import { Service } from "@/interfaces/service";
import { ServiceReportFilters } from "@/interfaces/filters/service-filters";

/** @deprecated usar `getServiceReport` para trabajar con `useReportFilters`. */
export const getServices = (
  params: Partial<PaginationParams> & { filters?: ServiceReportFilters }
): UseApiCall<Service> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<ServiceReportFilters, PagedResponse<Service>>('/service-report', finalParams),
  };
};

export async function getServiceReport(
  params: Partial<PaginationParams> & { filters?: ServiceReportFilters }
): Promise<PagedResponse<Service>> {
  const finalParams = withDefaultPagination(params);
  return await get<ServiceReportFilters, PagedResponse<Service>>('/service-report', finalParams);
}
