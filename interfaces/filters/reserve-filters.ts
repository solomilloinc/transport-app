/**
 * Espejo de `ReserveReportFilterRequestDto` del backend.
 * Todos los campos clave son requeridos por el backend para calcular disponibilidad.
 */
export interface ReserveReportFilters {
  tripId?: number;
  tripType?: string;
  passengers?: number;
  departureDate?: string; // ISO yyyy-mm-dd
  returnDate?: string;
  pickupDirectionId?: number;
}

export const emptyReserveReportFilters: ReserveReportFilters = {
  tripId: undefined,
  tripType: '',
  passengers: undefined,
  departureDate: '',
  returnDate: '',
  pickupDirectionId: undefined,
};
