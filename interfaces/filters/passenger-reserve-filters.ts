/**
 * Espejo de `PassengerReserveReportFilterRequestDto` del backend.
 * PII (no persistir en URL): documentNumber, email.
 */
export interface PassengerReserveReportFilters {
  passengerFullName?: string;
  documentNumber?: string;
  email?: string;
}

export const emptyPassengerReserveReportFilters: PassengerReserveReportFilters = {
  passengerFullName: '',
  documentNumber: '',
  email: '',
};
