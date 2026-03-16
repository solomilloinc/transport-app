import { TenantConfig } from '@/interfaces/tenant';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7215/api';

/** Shape returned by GET /tenant/resolve?host={host} */
interface TenantResolveResponse {
  code: string;
  publicKey: string | null;
  config: Omit<TenantConfig, 'code' | 'publicKey'>;
}

// In-memory cache: host → full resolved tenant
const tenantCache = new Map<string, TenantResolveResponse>();

/**
 * Resolves a hostname to the full tenant payload via GET /tenant/resolve?host={host}.
 * The API matches by the Domain column in the Tenant table.
 * Called once per host, then cached in-memory.
 */
export async function resolveTenant(host?: string): Promise<TenantResolveResponse | null> {
  if (!host) return null;
  if (tenantCache.has(host)) return tenantCache.get(host)!;

  try {
    const res = await fetch(`${BACKEND_URL}/tenant/resolve?host=${encodeURIComponent(host)}`);
    if (!res.ok) return null;

    const data: TenantResolveResponse = await res.json();
    if (data.code) {
      tenantCache.set(host, data);
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves tenant headers for the backend API.
 * Returns { X-Tenant-Code: <code> } or {} if resolution fails.
 */
export async function getTenantHeaders(host?: string): Promise<Record<string, string>> {
  const tenant = await resolveTenant(host);
  if (!tenant) return {};
  return { 'X-Tenant-Code': tenant.code };
}
