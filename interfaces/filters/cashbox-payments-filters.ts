/**
 * Espejo de los filtros de `POST cashbox/payments` (charter §1.1).
 * PII (no persistir en URL): `payerSearch`.
 * `methods` undefined ⇒ se omite ⇒ todos los métodos.
 */
export interface CashboxPaymentsFilters {
  dateFrom?: string; // yyyy-MM-dd
  dateTo?: string; // yyyy-MM-dd
  cashBoxId?: number; // drill-down de UNA caja
  methods?: number[];
  status?: number; // PaymentStatus
  payerSearch?: string;
}

export const emptyCashboxPaymentsFilters: CashboxPaymentsFilters = {
  dateFrom: '',
  dateTo: '',
  cashBoxId: undefined,
  methods: undefined,
  status: undefined,
  payerSearch: '',
};
