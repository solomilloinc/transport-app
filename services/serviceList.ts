import { getPure } from './api';
import { ServiceListItem } from '@/interfaces/serviceList';

/**
 * GET /api/services-list — lista plana de slots activos.
 *
 * Devuelve cada Service con la metadata necesaria para poblar el form de
 * FrequentSubscription (trip, día/hora, allowedDirectionIds). Es la fuente
 * preferida sobre `service-report` cuando solo se necesita el listado para
 * un dropdown — más liviano, sin paginación.
 */
export const getServicesList = async (): Promise<ServiceListItem[]> => {
  return getPure<ServiceListItem[]>('/services-list');
};
