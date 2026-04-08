import { EntityStatus } from './common';

/**
 * Espejo de `CityReportFilterRequestDto` del backend.
 */
export interface CityReportFilters {
  name?: string;
  code?: string;
  status?: EntityStatus;
  withDirections?: boolean;
}

export const emptyCityReportFilters: CityReportFilters = {
  name: '',
  code: '',
  status: undefined,
  withDirections: false,
};
