import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { Direction } from "@/interfaces/direction";
import { DirectionReportFilters } from "@/interfaces/filters/direction-filters";

/** @deprecated usar `getDirectionReport` para trabajar con `useReportFilters`. */
export const getDirections = (params: Partial<PaginationParams>): UseApiCall<Direction> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<Direction>>('/direction-report', finalParams),
  };
};

export async function getDirectionReport(
  params: Partial<PaginationParams> & { filters?: DirectionReportFilters }
): Promise<PagedResponse<Direction>> {
  const finalParams = withDefaultPagination(params);
  return await get<DirectionReportFilters, PagedResponse<Direction>>('/direction-report', finalParams);
}
