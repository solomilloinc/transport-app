'use server';

import { post, put, deleteLogic } from '@/services/api';
import { ActionResult, runServerAction } from '@/lib/apiErrors';

export interface ServiceUpsertPayload {
  name: string;
  tripId: number;
  vehicleId: number;
  dayOfWeek: number;
  departureHour: string;
  estimatedDuration: string;
  isHoliday: boolean;
  allowedDirectionIds: number[];
}

export async function createServiceAction(
  data: ServiceUpsertPayload,
): Promise<ActionResult<number>> {
  return runServerAction(() => post('/service-create', data));
}

export async function updateServiceAction(
  serviceId: number,
  data: ServiceUpsertPayload,
): Promise<ActionResult<boolean>> {
  return runServerAction(() => put(`/service-update/${serviceId}`, data));
}

export async function deleteServiceAction(serviceId: number): Promise<ActionResult<boolean>> {
  return runServerAction(() => deleteLogic(`/service-delete/${serviceId}`));
}

export interface TripReserveCreatePayload {
  tripId: number;
  reserveDate: string;
  vehicleId: number;
  departureHour: string;
  estimatedDuration: string;
  isHoliday: boolean;
  allowedDirectionIds: number[];
}

/** Crea una instancia de viaje (Reserve) puntual desde el modal "Agregar viaje". */
export async function createTripReserveAction(
  data: TripReserveCreatePayload,
): Promise<ActionResult<number>> {
  return runServerAction(() => post('/reserve-create', data));
}
