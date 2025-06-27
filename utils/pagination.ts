import { PaginationParams } from "@/services/types";
import { useMemo } from "react";

export const withDefaultPagination = (params: Partial<PaginationParams> = {}): PaginationParams => ({
  pageNumber: params.pageNumber ?? 1,
  pageSize: params.pageSize ?? 10,
  sortBy: params.sortBy ?? 'fecha',
  sortDescending: params.sortDescending ?? true,
  filters: params.filters ?? {},
});

export function usePaginationParams(params: PaginationParams) {
  return useMemo(() => params, [
    params.pageNumber,
    params.pageSize,
    params.sortBy,
    params.sortDescending,
    JSON.stringify(params.filters),
  ]);
}