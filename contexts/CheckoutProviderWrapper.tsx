'use client';

import { ReactNode } from 'react';
import { CheckoutProvider } from './CheckoutContext';

export default function CheckoutProviderWrapper({ children }: { children: ReactNode }) {
  return <CheckoutProvider>{children}</CheckoutProvider>;
}
