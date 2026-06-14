import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/auth.config';
import { getTenantHeaders } from '@/services/tenant-headers';

const BACKEND_URL = process.env.BACKEND_URL || 'https://api.midominio.com';

function getRequestHost(request: NextRequest): string | undefined {
  return request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? undefined;
}

export async function fetchAccountBackend<T>(request: NextRequest, path: string): Promise<T> {
  return fetchBackendWithSession<T>(request, path);
}

export async function fetchBackendWithSession<T>(
  request: NextRequest,
  path: string,
  init?: RequestInit
): Promise<T> {
  const session = await getServerSession(nextAuthOptions);
  if (!session?.accessToken || session.error === 'RefreshTokenError') {
    throw new Error('UNAUTHORIZED');
  }

  const tenantHeaders = await getTenantHeaders(getRequestHost(request));
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...tenantHeaders,
      ...(init?.headers ?? {}),
    },
    body: init?.body,
    cache: 'no-store',
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(errorBody?.message || 'BACKEND_REQUEST_FAILED');
  }

  return response.json() as Promise<T>;
}
