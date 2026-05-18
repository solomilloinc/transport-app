'use server';
import { getServerAxios } from './axios';
import { AxiosError } from 'axios';
import { PagedRequest, PagedResponse } from './types';

/**
 * Normaliza errores HTTP del backend a un único formato:
 *   `Error('API_ERROR:<code>')`   o
 *   `Error('API_ERROR:<code>|<details-json>')`
 *
 * El backend usa al menos 3 envelopes según el endpoint/feature:
 *   1. ProblemDetails (RFC 7807):
 *      `{ title: 'Cat.Code', detail: '...', status, type, details? }`
 *      → FrequentSubscription, mejoras nuevas (Mayo 2026).
 *   2. Result<T> con error nested:
 *      `{ isSuccess: false, error: { code: 'Cat.Code', message: '...' } }`
 *   3. Flat legacy:
 *      `{ code: 'Cat.Code', message: '...', details? }`
 *
 * Estrategia: probar en orden y tomar el primero que aparezca. Si ninguno
 * matchea, dejar pasar el AxiosError sin reescribir (fallback al mensaje
 * genérico de `getApiErrorMessage`).
 *
 * Nota Next.js: como este archivo es 'use server', cuando un Server Action
 * arroja un Error hacia el cliente, sólo `message` y `digest` cruzan la red.
 * Por eso serializo los `details` dentro del message como JSON.
 */
function rethrowWithCode(error: unknown): never {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as any;
    const code = extractErrorCode(data);
    if (code) {
      const details = extractErrorDetails(data);
      const payload = details ? `${code}|${safeStringify(details)}` : code;
      throw new Error(`API_ERROR:${payload}`);
    }
  }
  throw error;
}

function extractErrorCode(data: any): string {
  // 1. Flat legacy `{ code }` (también: ProblemDetails que además trajera `code`)
  if (typeof data.code === 'string' && data.code) return data.code;
  // 2. Result<T> `{ isSuccess: false, error: { code } }`
  if (data.error && typeof data.error.code === 'string' && data.error.code) {
    return data.error.code;
  }
  // 3. ProblemDetails `{ title }` — el title del backend convencionalmente
  //    es la clave de error tipo "Cat.SubCode" (ver docs/FRONTEND_SERVICIOS_CLIENTE.md).
  //    Sólo lo aceptamos como code si parece un error code (tiene un punto y nada de espacios).
  if (typeof data.title === 'string' && /^\w+(\.\w+)+$/.test(data.title)) {
    return data.title;
  }
  return '';
}

function extractErrorDetails(data: any): unknown | null {
  // Tanto ProblemDetails como envelopes legacy usan `details` con la misma key.
  if (data && typeof data === 'object' && 'details' in data && data.details) {
    return data.details;
  }
  return null;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export async function get<TFilter = any, TResponseItem = any>(url: string, request?: PagedRequest<TFilter>, options?: { skipAuth?: boolean }): Promise<TResponseItem> {
  try {
    const axios = await getServerAxios(options);
    const response = await axios.post<TResponseItem>(url, request);
    return response.data;
  } catch (error) {
    rethrowWithCode(error);
  }
}

/**
 * Standard GET request (not for reports).
 */
export async function getPure<TResponse = any>(url: string, params?: any, options?: { skipAuth?: boolean }): Promise<TResponse> {
  try {
    console.log('[getPure] Calling URL:', url, 'with params:', params);
    const axios = await getServerAxios(options);
    const response = await axios.get<TResponse>(url, { params });
    console.log('[getPure] Response:', response.data);
    return response.data;
  } catch (error) {
    rethrowWithCode(error);
  }
}

export async function post<T>(url: string, request?: T, options?: { skipAuth?: boolean }): Promise<number> {
  try {
    const axios = await getServerAxios(options);
    const response = await axios.post<number>(url, request);
    return response.data;
  } catch (error) {
    rethrowWithCode(error);
  }
}

export async function put<T>(url: string, request?: T, options?: { skipAuth?: boolean }): Promise<boolean> {
  try {
    const axios = await getServerAxios(options);
    const response = await axios.put<boolean>(url, request);
    return response.data;
  } catch (error) {
    rethrowWithCode(error);
  }
}

export async function postWithResponse<T, R>(url: string, request?: T, options?: { skipAuth?: boolean }): Promise<R> {
  try {
    const axios = await getServerAxios(options);
    const response = await axios.post<R>(url, request);
    return response.data;
  } catch (error) {
    rethrowWithCode(error);
  }
}

export async function deleteLogic(url: string, options?: { skipAuth?: boolean }): Promise<boolean> {
  try {
    const axios = await getServerAxios(options);
    const response = await axios.delete<boolean>(url);
    return response.data;
  } catch (error) {
    rethrowWithCode(error);
  }
}
