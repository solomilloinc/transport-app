/**
 * Espejo de los filtros de `POST reporting/reserves` (charter §2.1).
 * `statuses` undefined ⇒ se omite ⇒ el backend aplica su default `[1,2,3]`.
 */
import { ReportingDateField } from '@/interfaces/reporting';

export type ReserveReportingSource = 'service' | 'manual';

export interface ReportingReservesFilters {
  dateField?: ReportingDateField;
  dateFrom?: string; // yyyy-MM-dd
  dateTo?: string; // yyyy-MM-dd
  statuses?: number[];
  tripId?: number;
  vehicleId?: number;
  driverId?: number;
  isHoliday?: boolean;
  source?: ReserveReportingSource;
  onlyWithAvailability?: boolean;
  onlyWithPassengers?: boolean;
  minOccupancyPct?: number;
  maxOccupancyPct?: number;
}

export const emptyReportingReservesFilters: ReportingReservesFilters = {
  dateField: 'travel',
  dateFrom: '',
  dateTo: '',
  statuses: undefined,
  tripId: undefined,
  vehicleId: undefined,
  driverId: undefined,
  isHoliday: undefined,
  source: undefined,
  onlyWithAvailability: undefined,
  onlyWithPassengers: undefined,
  minOccupancyPct: undefined,
  maxOccupancyPct: undefined,
};
