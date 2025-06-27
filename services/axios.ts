// services/axios.ts
import axios from 'axios';
import { nextAuthOptions } from '@/auth.config';
import { getServerSession } from 'next-auth';

export async function getServerAxios(options?: { skipAuth?: boolean }) {
  const session = await getServerSession(nextAuthOptions);

  const instance = axios.create({
    baseURL: process.env.BACKEND_URL || 'https://api.midominio.com',
    withCredentials: true,
  });

  instance.interceptors.request.use((config) => {
    if (!options?.skipAuth && session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  });

  return instance;
}
