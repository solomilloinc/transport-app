import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { Direction } from "@/interfaces/direction";

export const getDirections = (params: Partial<PaginationParams>): UseApiCall<Direction> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<Direction>>('/direction-report', finalParams),
  };
};
