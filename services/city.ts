import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { City } from "@/interfaces/city";

export const getCities = (params: Partial<PaginationParams>): UseApiCall<City> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<City>>('/city-report', finalParams),
  };
};
