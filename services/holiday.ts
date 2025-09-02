import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { Holiday } from "@/interfaces/holiday";

export const getHolidays = (params: Partial<PaginationParams>): UseApiCall<Holiday> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<Holiday>>('/holiday-report', finalParams),
  };
};