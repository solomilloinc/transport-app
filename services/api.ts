'use server';
import { getServerAxios } from './axios';
import { PagedRequest, PagedResponse } from './types';

export async function get<TFilter = any, TResponseItem = any>(url: string, request?: PagedRequest<TFilter>, options?: { skipAuth?: boolean }): Promise<TResponseItem> {
  const axios = await getServerAxios(options);
  const response = await axios.post<TResponseItem>(url, request);
  return response.data;
}

export async function post<T>(url: string, request?: T, options?: { skipAuth?: boolean }): Promise<number> {
  const axios = await getServerAxios(options);
  const response = await axios.post<number>(url, request);
  return response.data;
}

export async function put<T>(url: string, request?: T, options?: { skipAuth?: boolean }): Promise<boolean> {
  const axios = await getServerAxios(options);
  const response = await axios.put<boolean>(url, request);
  return response.data;
}

export async function deleteLogic(url: string, options?: { skipAuth?: boolean }): Promise<boolean> {
  const axios = await getServerAxios(options);
  const response = await axios.delete<boolean>(url);
  return response.data;
}
