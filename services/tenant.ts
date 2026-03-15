'use server';

import { TenantConfig } from '@/interfaces/tenant';
import { resolveTenant } from '@/services/tenant-headers';

/**
 * Gets the full tenant configuration for the current host.
 * Uses the cached resolve response (single API call per host).
 */
export async function getTenantConfig(host?: string): Promise<TenantConfig | null> {
  const resolved = await resolveTenant(host);
  if (!resolved) return null;

  return {
    code: resolved.code,
    publicKey: resolved.publicKey,
    ...resolved.config,
  };
}
