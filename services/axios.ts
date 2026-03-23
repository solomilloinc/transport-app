// services/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { nextAuthOptions } from '@/auth.config';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { getTenantHeaders } from '@/services/tenant-headers';
import { getRequestHost } from '@/lib/get-host';

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.midominio.com';

/**
 * Error que indica que el usuario debe re-autenticarse
 * Este error se propaga al cliente para redirigir al login
 */
export class SessionExpiredError extends Error {
  constructor(message: string = 'Sesión expirada. Por favor, inicie sesión nuevamente.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

/**
 * Intenta renovar el accessToken usando el refreshToken de las cookies
 */
async function tryRenewToken(cookieHeader: string): Promise<string | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/renew-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.token || null;
  } catch {
    return null;
  }
}

/**
 * Obtiene las cookies del request actual como string
 */
async function getCookieHeader(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    return allCookies.map(c => `${c.name}=${c.value}`).join('; ');
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

  // Obtener sesión y cookies una vez (solo si no es público)
  const session = !isPublicRequest ? await getServerSession(nextAuthOptions) : null;
  const cookieHeader = !isPublicRequest ? await getCookieHeader() : '';

  // Variable para almacenar el token actual (puede actualizarse si se renueva)
  let currentToken = session?.accessToken || null;

  // Resolver tenant headers desde el host del request
  let tenantHeaders: Record<string, string> = {};
  try {
    const tenantHost = await getRequestHost();
    tenantHeaders = await getTenantHeaders(tenantHost);
  } catch {
    tenantHeaders = await getTenantHeaders();
  }

  // Interceptor de request: agregar Authorization y tenant headers
  instance.interceptors.request.use((config) => {
    if (!isPublicRequest && currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    // Agregar cookies al request (solo si no es público)
    if (!isPublicRequest && cookieHeader) {
      config.headers.Cookie = cookieHeader;
    }
    // Agregar tenant resolution headers a todas las requests
    for (const [key, value] of Object.entries(tenantHeaders)) {
      config.headers[key] = value;
    }
    return config;
  });

  // Interceptor de response: manejar 401 con retry automático (solo si no es público)
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // Para endpoints públicos, no manejar errores de auth
      if (isPublicRequest) {
        throw error;
      }

      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Si es 401 y no es un retry, intentar renovar el token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Intentar renovar el token
        const newToken = await tryRenewToken(cookieHeader);

        if (newToken) {
          // Actualizar el token para este request y futuros
          currentToken = newToken;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Reintentar la petición original con el nuevo token
          return instance(originalRequest);
        }

        // Si no se pudo renovar, lanzar error de sesión expirada
        throw new SessionExpiredError();
      }

      // Para otros errores, re-lanzar
      throw error;
    }
  );

  return instance;
}

