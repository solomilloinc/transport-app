// services/axios.ts
import axios from 'axios';
import { nextAuthOptions } from '@/auth.config';
import { getServerSession } from 'next-auth';

export async function getServerAxios(options?: { skipAuth?: boolean }) {
  const instance = axios.create({
    baseURL: process.env.BACKEND_URL || 'https://api.midominio.com',
    withCredentials: true,
  });

  // If auth is needed, get the session and add the interceptor.
  if (!options?.skipAuth) {
    const session = await getServerSession(nextAuthOptions);
    instance.interceptors.request.use((config) => {
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
      return config;
    });
  }

  return instance;
}
