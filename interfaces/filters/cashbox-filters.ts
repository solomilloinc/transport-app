/**
 * Espejo de `CashBoxReportFilterRequestDto` del backend.
 * Nota: Status en backend es `string?` (no el enum EntityStatus).
 */
export interface CashBoxReportFilters {
  fromDate?: string; // ISO yyyy-mm-dd
  toDate?: string;
  status?: string;
}

export const emptyCashBoxReportFilters: CashBoxReportFilters = {
  fromDate: '',
  toDate: '',
  status: '',
};
