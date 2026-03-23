'use server';
import { getServerAxios } from './axios';
import { AxiosError } from 'axios';
import { PagedRequest, PagedResponse } from './types';

function rethrowWithCode(error: unknown): never {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as any;
    const code = data.code || data.Code || '';
    if (code) throw new Error(`API_ERROR:${code}`);
  }
  throw error;
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
    const axios = await getServerAxios(options);
    const response = await axios.get<TResponse>(url, { params });
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
