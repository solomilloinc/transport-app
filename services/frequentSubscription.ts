import {
  FrequentSubscriptionCancelPreview,
  FrequentSubscriptionCreateRequest,
  FrequentSubscriptionResponseDto,
  FrequentSubscriptionUpdateRequest,
} from '@/interfaces/frequentSubscription';
import { FrequentSubscriptionReportFilters } from '@/interfaces/filters/frequent-subscription-filters';
import { withDefaultPagination } from '@/utils/pagination';
import { deleteLogic, get, getPure, post, put } from './api';
import { PagedResponse, PaginationParams } from './types';

const ENDPOINTS = {
  create: '/frequent-subscription-create',
  update: (id: number) => `/frequent-subscription-update/${id}`,
  cancel: (id: number) => `/frequent-subscription-cancel/${id}`,
  cancelPreview: (id: number) => `/frequent-subscription/${id}/cancel-preview`,
  byId: (id: number) => `/frequent-subscription/${id}`,
  report: '/frequent-subscription-report',
} as const;

export async function createFrequentSubscription(
  request: FrequentSubscriptionCreateRequest
): Promise<number> {
  return await post<FrequentSubscriptionCreateRequest>(ENDPOINTS.create, request);
}

/**
 * El backend devuelve el DTO completo en update. Usamos `postWithResponse`-like
 * pero el wrapper actual de api.ts solo expone `put<T>` que devuelve boolean.
 * Aceptamos esa limitación: si el caller necesita el dto post-update, vuelve a
 * pedirlo con `getFrequentSubscription(id)`. Hoy el caller siempre refetcha la
 * grilla, así que con boolean alcanza.
 */
export async function updateFrequentSubscription(
  id: number,
  request: FrequentSubscriptionUpdateRequest
): Promise<boolean> {
  return await put<FrequentSubscriptionUpdateRequest>(ENDPOINTS.update(id), request);
}

/**
 * Operación atómica que cancela la suscripción + Passengers futuros + reembolso.
 * El backend no devuelve resumen; resolvemos void al éxito.
 *
 * Errores conocidos:
 *  - 404 FrequentSubscription.NotFound — id inexistente
 *  - 409 FrequentSubscription.AlreadyCancelled — ya estaba cancelada (idempotencia segura)
 */
export async function cancelFrequentSubscription(id: number): Promise<void> {
  await deleteLogic(ENDPOINTS.cancel(id));
}

/**
 * Preview read-only del cancel. Devuelve cantidad de Passengers que se van
 * a cancelar y monto total a reembolsar — para mostrar en el modal de
 * confirmación con números concretos.
 *
 * Sin side effects. Si la sub ya está Cancelled, devuelve 409
 * FrequentSubscription.AlreadyCancelled (el caller decide si refresca grilla).
 */
export async function getFrequentSubscriptionCancelPreview(
  id: number
): Promise<FrequentSubscriptionCancelPreview> {
  return await getPure<FrequentSubscriptionCancelPreview>(ENDPOINTS.cancelPreview(id));
}

export async function getFrequentSubscription(
  id: number
): Promise<FrequentSubscriptionResponseDto> {
  return await getPure<FrequentSubscriptionResponseDto>(ENDPOINTS.byId(id));
}

export async function getFrequentSubscriptionReport(
  params: Partial<PaginationParams> & { filters?: FrequentSubscriptionReportFilters }
): Promise<PagedResponse<FrequentSubscriptionResponseDto>> {
  const finalParams = withDefaultPagination({
    ...params,
    sortBy: params.sortBy ?? 'startdate',
    sortDescending: params.sortDescending ?? true,
  });
  return await get<FrequentSubscriptionReportFilters, PagedResponse<FrequentSubscriptionResponseDto>>(
    ENDPOINTS.report,
    finalParams
  );
}

