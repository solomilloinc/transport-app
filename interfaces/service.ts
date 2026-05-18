import { emptyServiceSchedule, ServiceSchedule } from './serviceSchedule';
import { Vehicle } from './vehicle';

export interface ServiceDirection {
  directionId: number;
  name: string;
  cityId: number;
}

export interface Service {
  serviceId: number;
  name: string;
  tripId: number;
  /**
   * Descripción comercial del Trip ya armada por el backend
   * (e.g. "Lobos a CABA"). Es el reemplazo canónico de `tripName` —
   * lo devuelve `service-report` desde el refactor Mayo 2026.
   */
  tripDescription?: string;
  /** @deprecated Usar `tripDescription`. Se mantiene por backward-compat. */
  tripName?: string;
  estimatedDuration: string;
  /**
   * Día de la semana del slot. 0=Domingo, 1=Lunes, ..., 6=Sábado.
   * Reemplaza al par `startDay`/`endDay` del modelo viejo: un Service
   * ahora es UN slot único (ver ADR 0003), no un bundle de días.
   */
  dayOfWeek?: number;
  /** Hora de partida en formato "HH:mm:ss". Reemplaza a `schedulers[0].departureHour`. */
  departureHour?: string;
  /** @deprecated Modelo viejo (Service como bundle). Se mantiene para el form de edición. */
  startDay?: number;
  /** @deprecated Modelo viejo (Service como bundle). Se mantiene para el form de edición. */
  endDay?: number;
  /** @deprecated `schedulers[]` ya no existe en el response del backend. */
  schedules?: ServiceSchedule[];
  /** @deprecated `schedulers[]` ya no existe en el response del backend. */
  schedulers?: ServiceSchedule[];
  vehicle: Vehicle;
  status: string;
  allowedDirections: ServiceDirection[];
  allowedDirectionIds?: number[];
}

/**
 * Nombres de días en español, indexados 0=Domingo..6=Sábado (alineado con
 * `Service.dayOfWeek` y con `Date.prototype.getDay()`).
 */
export const DAY_OF_WEEK_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/**
 * Forma corta de día + hora "HH:mm" a partir de los campos flat de Service.
 * Devuelve cadena vacía si faltan datos (para que el caller decida placeholder).
 */
export function formatServiceSlot(service: Pick<Service, 'dayOfWeek' | 'departureHour'>): string {
  const dayName =
    service.dayOfWeek != null ? DAY_OF_WEEK_LABELS[service.dayOfWeek] ?? '' : '';
  const hourShort = service.departureHour ? service.departureHour.slice(0, 5) : '';
  return [dayName, hourShort].filter(Boolean).join(' ');
}

export const emptyService = {
  name: '',
  tripId: 0,
  estimatedDuration: '01:00',
  vehicleId: 0,
  startDay: 0,
  endDay: 0,
  schedules: [emptyServiceSchedule],
  schedulers: [emptyServiceSchedule],
  status: 'Activo',
  allowedDirections: [] as ServiceDirection[],
  allowedDirectionIds: [] as number[],
};
