import { EntityStatus } from './common';

/**
 * Espejo de `OperativeUserReportFilterRequestDto` del backend.
 * Filtros visibles del reporte de usuarios operativos.
 */
export interface OperativeUserReportFilters {
  email?: string;
  status?: EntityStatus;
}

export const emptyOperativeUserReportFilters: OperativeUserReportFilters = {
  email: '',
  status: undefined,
};
