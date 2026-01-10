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
  Items: T[];
  PageNumber: number;
  PageSize: number;
  TotalRecords: number;
  TotalPages: number;
}

export interface PagedReserveResponse<T = any> {
  Outbound: PagedResponse<T>;
  Return: PagedResponse<T>;
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

// declare module 'axios' {
//   export interface AxiosRequestConfig {
//     skipAuth?: boolean;
//   }
// }

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string; // 'RefreshTokenError' cuando la renovación falla
    user: {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user?: {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
  }
}
