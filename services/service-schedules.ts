'use server';

import { put, getPure } from './api';
import {
  ServiceScheduleSyncRequest,
  ServiceSchedule,
} from '@/interfaces/serviceSchedule';

/**
 * Bulk sync — replaces the service's complete schedule list in a single
 * transaction. See PUT /api/service-schedules-sync/{serviceId}.
 *
 * Items with `serviceScheduleId: null` are created. Items with an existing
 * id are updated (and reactivated if previously soft-deleted). Items
 * missing from the payload are soft-deleted.
 */
export async function syncServiceSchedules(
  serviceId: number,
  request: ServiceScheduleSyncRequest,
): Promise<boolean> {
  return await put<ServiceScheduleSyncRequest>(
    `/service-schedules-sync/${serviceId}`,
    request,
  );
}

/**
 * Fetches the active schedules for a service. Called after a bulk sync
 * so the editor picks up the real server-assigned ids.
 */
export async function getServiceSchedules(
  serviceId: number,
): Promise<ServiceSchedule[]> {
  return await getPure<ServiceSchedule[]>(`/service-schedules/${serviceId}`);
}
