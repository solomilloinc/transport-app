import { EntityStatus } from './common';

/**
 * Espejo de `ServiceReportFilterRequestDto` del backend.
 */
export interface ServiceReportFilters {
  name?: string;
  originId?: number;
  destinationId?: number;
  isHoliday?: boolean;
  vehicleId?: number;
  status?: EntityStatus;
}

export const emptyServiceReportFilters: ServiceReportFilters = {
  name: '',
  originId: undefined,
  destinationId: undefined,
  isHoliday: undefined,
  vehicleId: undefined,
  status: undefined,
};
