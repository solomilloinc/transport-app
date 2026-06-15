/**
 * Espejo de los filtros de `POST reporting/passengers` (charter §1.1).
 * PII (no persistir en URL): `search` (puede contener nombre/documento/email/teléfono).
 * `statuses` undefined ⇒ se omite ⇒ el backend aplica su default `[1,2,3,4]`.
 */
import { ReportingDateField } from '@/interfaces/reporting';

export interface ReportingPassengersFilters {
  dateField?: ReportingDateField;
  dateFrom?: string; // yyyy-MM-dd
  dateTo?: string; // yyyy-MM-dd
  statuses?: number[];
  tripId?: number;
  vehicleId?: number;
  driverId?: number;
  customerId?: number;
  hasTraveled?: boolean;
  onlyFrequent?: boolean;
  search?: string;
  paymentMethod?: number;
}

export const emptyReportingPassengersFilters: ReportingPassengersFilters = {
  dateField: 'travel',
  dateFrom: '',
  dateTo: '',
  statuses: undefined,
  tripId: undefined,
  vehicleId: undefined,
  driverId: undefined,
  customerId: undefined,
  hasTraveled: undefined,
  onlyFrequent: undefined,
  search: '',
  paymentMethod: undefined,
};
