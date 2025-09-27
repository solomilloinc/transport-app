import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { withDefaultPagination } from "@/utils/pagination";
import { get } from "./api";
import { Service } from "@/interfaces/service";


export const getServices = (params: Partial<PaginationParams>): UseApiCall<Service> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<Service>>('/service-report', finalParams),
  };
};
