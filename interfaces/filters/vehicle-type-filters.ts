/**
 * Espejo de `VehicleTypeReportFilterRequestDto` del backend.
 */
export interface VehicleTypeReportFilters {
  vehicleTypeId?: number;
  name?: string;
}

export const emptyVehicleTypeReportFilters: VehicleTypeReportFilters = {
  vehicleTypeId: undefined,
  name: '',
};
