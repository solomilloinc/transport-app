
import { VehicleType } from "@/interfaces/vehicleType";
import { PagedResponse, PaginationParams, UseApiCall } from "./types";
import { get } from "./api";
import { withDefaultPagination } from "@/utils/pagination";
import { Vehicle } from "@/interfaces/vehicle";
import { VehicleReportFilters } from "@/interfaces/filters/vehicle-filters";
import { VehicleTypeReportFilters } from "@/interfaces/filters/vehicle-type-filters";

export const getTypesVehicle = (params: Partial<PaginationParams>): UseApiCall<VehicleType> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<VehicleType>>('/vehicle-type-report', finalParams),
  };
};

/** @deprecated usar `getVehicleReport` para trabajar con `useReportFilters`. */
export const getVehicles = (params: Partial<PaginationParams>): UseApiCall<Vehicle> => {
  const finalParams = withDefaultPagination(params);
  return {
    call: get<any, PagedResponse<Vehicle>>('/vehicle-report', finalParams),
  };
}

export async function getVehicleReport(
  params: Partial<PaginationParams> & { filters?: VehicleReportFilters }
): Promise<PagedResponse<Vehicle>> {
  const finalParams = withDefaultPagination(params);
  return await get<VehicleReportFilters, PagedResponse<Vehicle>>('/vehicle-report', finalParams);
}

export async function getVehicleTypeReport(
  params: Partial<PaginationParams> & { filters?: VehicleTypeReportFilters }
): Promise<PagedResponse<VehicleType>> {
  const finalParams = withDefaultPagination(params);
  return await get<VehicleTypeReportFilters, PagedResponse<VehicleType>>('/vehicle-type-report', finalParams);
}

