/**
 * Espejo de `CashBoxReportFilterRequestDto` del backend (charter Caja §2.1).
 * Nota: Status en backend es `string?` (`"Open"`/`"Closed"`), no el enum EntityStatus.
 * Rango opcional y SIN tope de 92 días (a diferencia de reservas/pagos).
 */
export interface CashBoxReportFilters {
  fromDate?: string; // ISO yyyy-mm-dd
  toDate?: string;
  status?: string; // "Open" | "Closed"
  openedByUserId?: number;
  closedByUserId?: number;
}

export const emptyCashBoxReportFilters: CashBoxReportFilters = {
  fromDate: '',
  toDate: '',
  status: '',
  openedByUserId: undefined,
  closedByUserId: undefined,
};
