
import { VehicleType } from "@/interfaces/vehicleType";
import { PagedRequest, PaginationParams, UseApiCall } from "./types";
import { get, post } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { Vehicle } from "@/interfaces/vehicle";

export const getTypesVehicle = (params: Partial<PaginationParams>): UseApiCall<VehicleType> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, VehicleType>('/vehicle-type-report', finalParams),
  };
};

export const getVehicles = (params: Partial<PaginationParams>): UseApiCall<Vehicle> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, Vehicle>('/vehicle-report', finalParams),
  };
}

