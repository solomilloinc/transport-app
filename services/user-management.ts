'use server';

import { get, getPure, post, postWithResponse, put } from '@/services/api';
import { PagedRequest, PagedResponse } from '@/services/types';

export interface CurrentUserProfile {
  userId: number;
  customerId?: number | null;
  email: string;
  role: string;
  status: number;
  needsProfileCompletion: boolean;
  firstName?: string | null;
  lastName?: string | null;
  documentNumber?: string | null;
  phone1?: string | null;
  phone2?: string | null;
}

export interface ClientProfileCompleteRequest {
  firstName: string;
  lastName: string;
  documentNumber: string;
  phone1: string;
  phone2?: string | null;
}

export interface OperativeUserItem {
  userId: number;
  email: string;
  role: string;
  status: number;
  customerId?: number | null;
  createdDate: string;
}

export interface OperativeUserFilters {
  email?: string;
  search?: string;
  status?: number;
}

export interface OperativeUserCreateRequest {
  email: string;
  password: string;
  role: string;
}

export interface OperativeUserUpdateRequest {
  email: string;
  role: string;
  status: number;
}

export async function getCurrentUserProfile() {
  return getPure<CurrentUserProfile>('/me');
}

export async function completeCurrentUserProfile(request: ClientProfileCompleteRequest) {
  return postWithResponse<ClientProfileCompleteRequest, CurrentUserProfile>('/client-profile-complete', request);
}

export async function getOperativeUsers(request?: PagedRequest<OperativeUserFilters>) {
  return get<OperativeUserFilters, PagedResponse<OperativeUserItem>>('/operative-user-report', request);
}

export async function createOperativeUser(request: OperativeUserCreateRequest) {
  return post('/operative-user-create', request);
}

export async function updateOperativeUser(userId: number, request: OperativeUserUpdateRequest) {
  return put(`/operative-user-update/${userId}`, request);
}
