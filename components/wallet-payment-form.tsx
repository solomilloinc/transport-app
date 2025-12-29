'use client';

import React, { useEffect, useRef, useCallback } from 'react';

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

// Debug logging solo en desarrollo
const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[WalletPayment]', ...args);
  }
};

function WalletPaymentForm({ 
  amount,
  onSubmit,
  onError, 
  onReady,
  disabled = false 
}: WalletPaymentFormProps) {
  // Usar useRef para el ID del contenedor (estable entre renders)
  const containerIdRef = useRef(`walletBrick_${Math.random().toString(36).substr(2, 9)}`);
  const containerId = containerIdRef.current;
  
  // Guard para evitar doble inicialización (especialmente en React Strict Mode)
  const isInitializedRef = useRef(false);
  const controllerRef = useRef<any>(null);
  
  // Estados para UI
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Callback estable para inicializar el brick
  const initializeWalletBrick = useCallback(() => {
    // Verificar que el container existe
    const container = document.getElementById(containerId);
    if (!container) {
      debugLog('Container not found, retrying...');
      setTimeout(() => initializeWalletBrick(), 100);
      return;
    }

    // Si ya hay un controller, no reinicializar
    if (controllerRef.current) {
      debugLog('Controller already exists, skipping init');
      return;
    }

    // Verificar SDK disponible
    if (!(window as any).MercadoPago) {
      setError('SDK de MercadoPago no disponible');
      setLoading(false);
      return;
    }

    // Verificar public key
    if (!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
      setError('Clave pública de MercadoPago no configurada');
      setLoading(false);
      return;
    }

    // Limpiar contenido previo
    container.innerHTML = '';
    debugLog('Initializing wallet brick in:', containerId);

    try {
      const mp = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY, { 
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
              debugLog('Wallet brick ready');
              setLoading(false);
              onReady?.();
            },
            onSubmit: () => {
              return new Promise((resolve, reject) => {
                onSubmit({ payload: { Payment: null, Items: [] } })
                  .then((preference_id) => {
                    resolve(preference_id);
                  })
                  .catch((err) => {
                    console.error('Error in onSubmit callback:', err);
                    reject(err);
                  });
              });
            },
            onError: (err: any) => {
              console.error('Wallet Brick error:', err);
              setError('Error en el componente Wallet');
              setLoading(false);
              onError?.(err);
            },
          },
        })
        .then((controller: any) => {
          debugLog('Wallet controller created');
          controllerRef.current = controller;
        })
        .catch((err: any) => {
          console.error('Error initializing Wallet Brick:', err);
          setError('Error al inicializar el componente Wallet');
          setLoading(false);
          onError?.(err);
        });
    } catch (err) {
      console.error('Error in initializeWalletBrick:', err);
      setError('Error al configurar MercadoPago');
      setLoading(false);
      onError?.(err);
    }
  }, [containerId, onSubmit, onError, onReady]);

  useEffect(() => {
    // No hacer nada si está deshabilitado o ya inicializado
    if (disabled || isInitializedRef.current) {
      return;
    }
    
    // Marcar como inicializado ANTES de hacer cualquier cosa
    // Esto previene doble ejecución en React Strict Mode
    isInitializedRef.current = true;
    debugLog('Starting wallet initialization');

    // Verificar si el script ya existe
    const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
    
    if (existingScript) {
      if ((window as any).MercadoPago) {
        initializeWalletBrick();
      } else {
        existingScript.addEventListener('load', initializeWalletBrick);
      }
    } else {
      // Cargar el SDK por primera vez
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

    // Cleanup
    return () => {
      if (controllerRef.current) {
        try {
          controllerRef.current.unmount();
          debugLog('Unmounted wallet controller');
        } catch (e) {
          // Silently ignore unmount errors
        }
        controllerRef.current = null;
      }
    };
  }, [disabled, initializeWalletBrick, onError]);

  if (disabled) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}
      
      <div id={containerId} className={loading ? 'opacity-0' : 'opacity-100'} />
    </div>
  );
}

export default React.memo(WalletPaymentForm);