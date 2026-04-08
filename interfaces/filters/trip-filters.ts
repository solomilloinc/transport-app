import { EntityStatus } from './common';

/**
 * Espejo de `TripReportFilterDto` del backend.
 */
export interface TripReportFilters {
  originCityId?: number;
  destinationCityId?: number;
  status?: EntityStatus;
}

export const emptyTripReportFilters: TripReportFilters = {
  originCityId: undefined,
  destinationCityId: undefined,
  status: undefined,
};
