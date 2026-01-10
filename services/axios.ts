// services/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { nextAuthOptions } from '@/auth.config';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';

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
      console.error('Token renewal failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Error en tryRenewToken:', error);
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

  // Obtener sesión y cookies una vez
  const session = !options?.skipAuth ? await getServerSession(nextAuthOptions) : null;
  const cookieHeader = await getCookieHeader();

  // Variable para almacenar el token actual (puede actualizarse si se renueva)
  let currentToken = session?.accessToken || null;

  // Interceptor de request: agregar Authorization header
  instance.interceptors.request.use((config) => {
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    // Agregar cookies al request
    if (cookieHeader) {
      config.headers.Cookie = cookieHeader;
    }
    return config;
  });

  // Interceptor de response: manejar 401 con retry automático
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
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
