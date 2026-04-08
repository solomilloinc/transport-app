/**
 * Espejo de `CustomerTransactionReportFilterRequestDto` del backend.
 */
export interface CustomerTransactionReportFilters {
  transactionType?: number;
  fromDate?: string; // ISO yyyy-mm-dd
  toDate?: string;
}

export const emptyCustomerTransactionReportFilters: CustomerTransactionReportFilters = {
  transactionType: undefined,
  fromDate: '',
  toDate: '',
};
