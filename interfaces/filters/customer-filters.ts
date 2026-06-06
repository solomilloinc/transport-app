import { EntityStatus } from './common';

/**
 * Espejo de `CustomerReportFilterRequestDto` del backend.
 * PII (no persistir en URL): search, email.
 * `search` busca por DNI y nombre completo con OR en el backend.
 */
export interface CustomerReportFilters {
  search?: string;
  email?: string;
  createdFrom?: string; // ISO yyyy-mm-dd
  createdTo?: string;
  status?: EntityStatus;
}

export const emptyCustomerReportFilters: CustomerReportFilters = {
  search: '',
  email: '',
  createdFrom: '',
  createdTo: '',
  status: undefined,
};
