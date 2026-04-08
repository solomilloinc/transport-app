import { EntityStatus } from './common';

/**
 * Espejo de `VehicleReportFilterRequestDto` del backend.
 * Nota: el backend define la propiedad como `status` (minúscula).
 */
export interface VehicleReportFilters {
  vehicleTypeId?: number;
  internalNumber?: string;
  status?: EntityStatus;
}

export const emptyVehicleReportFilters: VehicleReportFilters = {
  vehicleTypeId: undefined,
  internalNumber: '',
  status: undefined,
};
