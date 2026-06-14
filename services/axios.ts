import axios from 'axios';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { nextAuthOptions } from '@/auth.config';
import { getRequestHost } from '@/lib/get-host';
import { getTenantHeaders } from '@/services/tenant-headers';

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.midominio.com';

async function getCookieHeader(): Promise<string> {
  try {
    const cookieStore = await cookies();
    return cookieStore.getAll().map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  } catch {
    return '';
  }
}

export async function getServerAxios(options?: { skipAuth?: boolean }) {
  const instance = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
  });

  const isPublicRequest = options?.skipAuth === true;
  const session = !isPublicRequest ? await getServerSession(nextAuthOptions) : null;
  const cookieHeader = !isPublicRequest ? await getCookieHeader() : '';

  let tenantHeaders: Record<string, string> = {};
  try {
    const tenantHost = await getRequestHost();
    tenantHeaders = await getTenantHeaders(tenantHost);
  } catch {
    tenantHeaders = await getTenantHeaders();
  }

  instance.interceptors.request.use((config) => {
    if (!isPublicRequest && session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    if (!isPublicRequest && cookieHeader) {
      config.headers.Cookie = cookieHeader;
    }

    for (const [key, value] of Object.entries(tenantHeaders)) {
      config.headers[key] = value;
    }

    return config;
  });

  return instance;
}
