'use client';

import { initMercadoPago } from '@mercadopago/sdk-react';
import { useEffect } from 'react';

export default function MercadoPagoInitializer() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

    if (!key) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MP] Falta NEXT_PUBLIC_MP_PUBLIC_KEY en .env.local');
      }
      return;
    }

    initMercadoPago(key, { locale: 'es-AR' });
    console.log('[MP] SDK Initialized globally');
  }, []);

  return null;
}
