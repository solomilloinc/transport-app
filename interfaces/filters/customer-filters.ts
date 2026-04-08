import { EntityStatus } from './common';

/**
 * Espejo de `CustomerReportFilterRequestDto` del backend.
 * PII (no persistir en URL): email, documentNumber, phone1, phone2.
 */
export interface CustomerReportFilters {
  firstName?: string;
  lastName?: string;
  email?: string;
  documentNumber?: string;
  phone1?: string;
  phone2?: string;
  createdFrom?: string; // ISO yyyy-mm-dd
  createdTo?: string;
  status?: EntityStatus;
}

export const emptyCustomerReportFilters: CustomerReportFilters = {
  firstName: '',
  lastName: '',
  email: '',
  documentNumber: '',
  phone1: '',
  phone2: '',
  createdFrom: '',
  createdTo: '',
  status: undefined,
};
