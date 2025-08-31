'use client';

import React, { useEffect, useState } from 'react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerId] = useState(() => `walletBrick_container_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('WalletPaymentForm render:', { containerId, disabled, isInitialized });

  useEffect(() => {
    if (disabled) {
      console.log('Wallet disabled, skipping initialization');
      return;
    }

    console.log('Starting wallet initialization for:', containerId);

    // Evitar cargar múltiples veces el SDK
    const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
    
    if (existingScript) {
      // Si el SDK ya está cargado, inicializar directamente
      if ((window as any).MercadoPago) {
        initializeWalletBrick();
      } else {
        // Si el script existe pero no está cargado, esperar
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

    return () => {
      // Limpiar solo el controlador específico, no el SDK global
      if ((window as any).walletBrickController) {
        try {
          (window as any).walletBrickController.unmount();
          console.log('Unmounted wallet controller for:', containerId);
        } catch (e) {
          console.warn('Error unmounting wallet brick controller:', e);
        }
        (window as any).walletBrickController = null;
      }
    };
  }, [disabled, containerId]);

  const initializeWalletBrick = () => {
    try {
      console.log('initializeWalletBrick called for:', containerId);
      
      // Verificar que el container existe antes de crear el brick
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`Container ${containerId} not found, retrying...`);
        setTimeout(initializeWalletBrick, 100);
        return;
      }

      // Si ya hay un wallet brick activo, limpiarlo primero
      if ((window as any).walletBrickController) {
        console.log('Existing wallet brick found, cleaning up...');
        try {
          (window as any).walletBrickController.unmount();
        } catch (e) {
          console.warn('Error unmounting existing controller:', e);
        }
        (window as any).walletBrickController = null;
      }

      // Verificar que el SDK esté disponible
      if (!(window as any).MercadoPago) {
        console.error('MercadoPago SDK not available');
        setError('SDK de MercadoPago no disponible');
        setLoading(false);
        return;
      }

      // Verificar que tenemos la public key
      if (!process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
        console.error('MercadoPago public key not found');
        setError('Clave pública de MercadoPago no configurada');
        setLoading(false);
        return;
      }

      // Limpiar contenido previo del container
      container.innerHTML = '';
      console.log('Creating wallet brick in container:', containerId);

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
              console.log('Wallet brick ready for:', containerId);
              setLoading(false);
              setIsInitialized(true);
              onReady?.();
            },
            onSubmit: () => {
              return new Promise((resolve, reject) => {
                // Llamar al callback onSubmit que viene desde el componente padre
                onSubmit({ payload: { Payment: null, Items: [] } })
                  .then((preference_id) => {
                    // El padre devuelve el preference_id que MP necesita
                    resolve(preference_id);
                  })
                  .catch((err) => {
                    console.error('Error in onSubmit callback:', err);
                    reject(err);
                  });
              });
            },
            onError: (error: any) => {
              console.error('Wallet Brick error:', error);
              setError('Error en el componente Wallet');
              setLoading(false);
              onError?.(error);
            },
          },
        })
        .then((controller: any) => {
          console.log('Wallet brick controller created for:', containerId);
          (window as any).walletBrickController = controller;
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
  };

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