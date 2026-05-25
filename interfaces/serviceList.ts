/**
 * Espejo de `GET /api/services-list` (Mayo 2026, aditivo no-breaking).
 *
 * Cada item es un slot semanal individual del Service post-refactor ADR 0003
 * (un Service = un día + una hora; no es un bundle).
 *
 * Trae toda la metadata necesaria para poblar el form de FrequentSubscription
 * sin tener que pedir el reporte paginado pesado: trip info, slot info y
 * whitelist de directions habilitadas.
 */
export interface ServiceListItem {
  serviceId: number;
  name: string;
  tripId: number;
  tripDescription: string;

  /** Ciudad origen del Trip — sirve para emparejar Inbound (inverso). */
  originCityId: number;
  /** Ciudad destino del Trip — sirve para emparejar Inbound (inverso). */
  destinationCityId: number;

  /** 0=Domingo, 1=Lunes, ..., 6=Sábado. */
  dayOfWeek: number;
  /** Mismo valor pre-formateado en español (ej. "Lunes"). */
  dayOfWeekName: string;
  /** "HH:mm:ss" — hora de salida del slot. */
  departureHour: string;

  /**
   * IDs de las Directions habilitadas para este Service (whitelist de pickup/dropoff).
   * Si está vacío, **todas** las Directions del sistema son válidas para este Service.
   */
  allowedDirectionIds: number[];
}

/**
 * @deprecated Legacy del modelo viejo de Service-bundle. Usar `ServiceListItem`.
 * Se mantiene exportado por si algún consumer antiguo aún lo referencia.
 */
export interface ServiceIdNameDto {
  serviceId: number;
  name: string;
}

/**
 * @deprecated Vivía en el viejo Customer.services[]. La asociación
 * Customer⇄Service ahora pasa por FrequentSubscription.
 */
export interface CustomerServiceDto {
  serviceId: number;
  serviceName: string;
}
