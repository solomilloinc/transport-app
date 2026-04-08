import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { City } from "@/interfaces/city";
import { CityReportFilters } from "@/interfaces/filters/city-filters";

/** @deprecated usar `getCityReport` para trabajar con `useReportFilters`. */
export const getCities = (
  params: Partial<PaginationParams> & { filters?: CityReportFilters }
): UseApiCall<City> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<CityReportFilters, PagedResponse<City>>('/city-report', finalParams),
  };
};

export async function getCityReport(
  params: Partial<PaginationParams> & { filters?: CityReportFilters }
): Promise<PagedResponse<City>> {
  const finalParams = withDefaultPagination(params);
  return await get<CityReportFilters, PagedResponse<City>>('/city-report', finalParams);
}
