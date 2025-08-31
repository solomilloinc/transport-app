import { Passenger } from "@/interfaces/passengers";
import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { withDefaultPagination } from "@/utils/pagination";
import { get } from "./api";

export const getPassengers = (params: Partial<PaginationParams>): UseApiCall<Passenger> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<Passenger>>('/customer-report', finalParams),
  };
};