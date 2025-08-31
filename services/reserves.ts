
import { VehicleType } from "@/interfaces/vehicleType";
import { PagedRequest, PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get, post } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { ReserveReport } from "@/interfaces/reserve";
import { PassengerReserveReport } from "@/interfaces/passengerReserve";

export const getReserves = (date: string): UseApiCall<ReserveReport> => {
  const finalParams = withDefaultPagination();
  return {
    call: get<any, PagedResponse<ReserveReport>>( `/reserve-report/${date}`, finalParams),
  };
};

export const getPassengerReserves = (id: number): UseApiCall<PassengerReserveReport> => {
  const finalParams = withDefaultPagination();
  return {
    call: get<any, PagedResponse<PassengerReserveReport>>( `/passenger-reserve-report/${id}`, finalParams),
  };
};