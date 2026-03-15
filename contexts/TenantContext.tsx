'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { TenantConfig } from '@/interfaces/tenant';

const TenantContext = createContext<TenantConfig | null>(null);

export function TenantProvider({
  config,
  children,
}: {
  config: TenantConfig;
  children: ReactNode;
}) {
  return (
    <TenantContext.Provider value={config}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantConfig {
  const config = useContext(TenantContext);
  if (!config) {
    throw new Error('useTenant() must be used within a TenantProvider. Is the tenant API available?');
  }
  return config;
}
