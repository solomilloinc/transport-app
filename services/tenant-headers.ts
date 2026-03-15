const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7215/api';

// In-memory cache: host → tenant code
const tenantCodeCache = new Map<string, string>();

/**
 * Resolves a hostname to a tenant code.
 * - localhost/127.0.0.1: uses TENANT_SLUG env var (dev convenience)
 * - Any other host: calls GET /tenant/resolve?host={host} and caches the result
 */
export async function resolveTenantCode(host?: string): Promise<string | null> {
  const isLocalDev = !host || host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (isLocalDev) {
    return process.env.TENANT_SLUG || null;
  }

  if (tenantCodeCache.has(host)) {
    return tenantCodeCache.get(host)!;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/tenant/resolve?host=${encodeURIComponent(host)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const code = data.code || data.Code;
    if (code) {
      tenantCodeCache.set(host, code);
      return code;
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
  const code = await resolveTenantCode(host);
  if (!code) return {};
  return { 'X-Tenant-Code': code };
}
