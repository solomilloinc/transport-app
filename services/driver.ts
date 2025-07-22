import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { Driver } from "@/interfaces/driver";

export const getDrivers = (params: Partial<PaginationParams>): UseApiCall<Driver> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<Driver>>('/driver-report', finalParams),
  };
};