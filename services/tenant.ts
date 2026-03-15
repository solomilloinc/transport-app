'use server';

import { TenantConfig } from '@/interfaces/tenant';
import { getTenantHeaders } from '@/services/tenant-headers';

/**
 * Fetches tenant configuration from the backend API.
 * Returns null if the API is unavailable or the tenant cannot be resolved.
 */
export async function getTenantConfig(host?: string): Promise<TenantConfig | null> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:7215/api';
    const tenantHeaders = await getTenantHeaders(host);

    const response = await fetch(`${backendUrl}/tenant/config`, {
      next: { revalidate: 3600 },
      headers: tenantHeaders,
    });

    if (!response.ok) return null;

    return await response.json() as TenantConfig;
  } catch {
    return null;
  }
}
