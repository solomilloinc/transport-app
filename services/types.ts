import 'axios';
import NextAuth from 'next-auth';

export interface PagedRequest<TFilter = any> {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDescending?: boolean;
  filters?: TFilter;
}

export interface PagedResponse<T = any> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface PagedReserveResponse<T = any> {
  outbound: PagedResponse<T>;
  return: PagedResponse<T>;
}

export interface UseApiCall<T, R = PagedResponse<T>> {
  call: Promise<R>;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  filters?: Record<string, any>;
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      email: string;
      role: string;
      name?: string;
      customerId?: number | null;
      needsProfileCompletion?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user?: {
      id: string;
      email: string;
      role: string;
      name?: string;
      customerId?: number | null;
      needsProfileCompletion?: boolean;
    };
  }
}
