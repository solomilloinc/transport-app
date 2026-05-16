'use server';

import { TenantBusinessRules, TenantConfig } from '@/interfaces/tenant';
import { resolveTenant } from '@/services/tenant-headers';

const DEFAULT_BUSINESS_RULES: TenantBusinessRules = {
  // Defaults to true to match the backend default — keeps the UI safe if a stale
  // tenant config payload omits the new section.
  roundTripRequiresSameDay: true,
};

export async function getTenantConfig(host?: string): Promise<TenantConfig | null> {
  const resolved = await resolveTenant(host);
  if (!resolved) return null;

  const merged: TenantConfig = {
    code: resolved.code,
    publicKey: resolved.publicKey,
    ...resolved.config,
    businessRules: {
      ...DEFAULT_BUSINESS_RULES,
      ...(resolved.config as Partial<TenantConfig>).businessRules,
    },
  };

  return merged;
}
