import { EntityStatus } from './common';

/**
 * Espejo de `DriverReportFilterRequestDto` del backend.
 * - `documentNumber` es PII → no se persiste en URL.
 */
export interface DriverReportFilters {
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  status?: EntityStatus;
}

export const emptyDriverReportFilters: DriverReportFilters = {
  firstName: '',
  lastName: '',
  documentNumber: '',
  status: undefined,
};
