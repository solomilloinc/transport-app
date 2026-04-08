import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { Driver } from "@/interfaces/driver";
import { DriverReportFilters } from "@/interfaces/filters/driver-filters";

/** @deprecated usar `getDriverReport` para trabajar con `useReportFilters`. */
export const getDrivers = (
  params: Partial<PaginationParams> & { filters?: DriverReportFilters }
): UseApiCall<Driver> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<DriverReportFilters, PagedResponse<Driver>>('/driver-report', finalParams),
  };
};

export async function getDriverReport(
  params: Partial<PaginationParams> & { filters?: DriverReportFilters }
): Promise<PagedResponse<Driver>> {
  const finalParams = withDefaultPagination(params);
  return await get<DriverReportFilters, PagedResponse<Driver>>('/driver-report', finalParams);
}