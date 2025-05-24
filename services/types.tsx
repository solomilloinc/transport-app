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

// declare module 'axios' {
//   export interface AxiosRequestConfig {
//     skipAuth?: boolean;
//   }
// }

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
  }
}
