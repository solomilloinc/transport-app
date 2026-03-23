'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useTenant } from '@/contexts/TenantContext';

interface WalletPaymentFormProps {
  amount: number;
  onSubmit: (data: {
    payload: {
      Payment: null;
      Items: Array<{
        reserveId: number;
        reserveTypeId: number;
        customerId?: number | null;
        isPayment: boolean;
        pickupLocationId?: number | null;
        dropoffLocationId?: number | null;
        hasTraveled: boolean;
        price: number;
        firstName: string;
        lastName: string;
        email?: string;
        phone1?: string;
        documentNumber: string;
      }>;
    };
  }) => Promise<string>;
  onError?: (error: unknown) => void;
  onReady?: () => void;
  disabled?: boolean;
}

function WalletPaymentForm({
  amount,
  onSubmit,
  onError,
  onReady,
  disabled = false
}: WalletPaymentFormProps) {
  const { publicKey: mpPublicKey } = useTenant();
  const containerIdRef = useRef(`walletBrick_${Math.random().toString(36).substr(2, 9)}`);
  const containerId = containerIdRef.current;
  const isInitializedRef = useRef(false);
  const controllerRef = useRef<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const initializeWalletBrick = useCallback(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      setTimeout(() => initializeWalletBrick(), 100);
      return;
    }

    if (controllerRef.current) {
      return;
    }

    if (!(window as any).MercadoPago) {
      setError('SDK de MercadoPago no disponible');
      setLoading(false);
      return;
    }

    if (!mpPublicKey) {
      setError('Clave pública de MercadoPago no configurada');
      setLoading(false);
      return;
    }

    container.innerHTML = '';

    try {
      const mp = new (window as any).MercadoPago(mpPublicKey, {
        locale: 'es-AR'
      });
      const bricksBuilder = mp.bricks();

      bricksBuilder
        .create('wallet', containerId, {
          initialization: {
            redirectMode: 'self'
          },
          callbacks: {
            onReady: () => {
              setLoading(false);
              onReady?.();
            },
            onSubmit: () => {
              return new Promise((resolve, reject) => {
                onSubmit({ payload: { Payment: null, Items: [] } })
                  .then(resolve)
                  .catch(reject);
              });
            },
            onError: (err: any) => {
              setError('Error en el componente Wallet');
              setLoading(false);
              onError?.(err);
            },
          },
        })
        .then((controller: any) => {
          controllerRef.current = controller;
        })
        .catch((err: any) => {
          setError('Error al inicializar el componente Wallet');
          setLoading(false);
          onError?.(err);
        });
    } catch (err) {
      setError('Error al configurar MercadoPago');
      setLoading(false);
      onError?.(err);
    }
  }, [containerId, mpPublicKey, onSubmit, onError, onReady]);

  useEffect(() => {
    if (disabled || isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');

    if (existingScript) {
      if ((window as any).MercadoPago) {
        initializeWalletBrick();
      } else {
        existingScript.addEventListener('load', initializeWalletBrick);
      }
    } else {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => initializeWalletBrick();
      script.onerror = () => {
        setError('Error al cargar el SDK de MercadoPago');
        setLoading(false);
        onError?.('Error al cargar el SDK de MercadoPago');
      };
      document.body.appendChild(script);
    }

    return () => {
      if (controllerRef.current) {
        try {
          controllerRef.current.unmount();
        } catch {}
        controllerRef.current = null;
      }
    };
  }, [disabled, initializeWalletBrick, onError]);

  if (disabled) {
    return (
      <div className="rounded-lg bg-gray-100 p-4 text-center text-gray-500">
        Wallet payment not available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="text-sm text-gray-600">Cargando Wallet de MercadoPago...</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      <div id={containerId} className={loading ? 'opacity-0' : 'opacity-100'} />
    </div>
  );
}

export default React.memo(WalletPaymentForm);
