'use client';

import { useEffect, useMemo, useState } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import type {
  ICardPaymentFormData,
  ICardPaymentBrickPayer,
} from '@mercadopago/sdk-react/bricks/cardPayment/type';
import { useTenant } from '@/contexts/TenantContext';

type Props = {
  amount: number;
  maxInstallments?: number;
  onSubmit: (data: {
    amount: number;
    email: string;
    installments: number;
    token: string;
    identification?: { type?: string; number?: string };
    paymentMethodId: string;
  }) => Promise<void>;
  onError?: (error: unknown) => void;
  onPayingChange?: (paying: boolean) => void;
  defaultEmail?: string;
  isSubmitting?: boolean;
};

export default function CardPaymentForm({
  amount,
  maxInstallments = 1,
  onSubmit,
  onError,
  onPayingChange,
  defaultEmail,
  isSubmitting = false,
}: Props) {
  const { publicKey } = useTenant();
  const [mpReady, setMpReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // En dev subimos mínimo a 1000 para que habilite métodos de test.
  const effectiveAmount = useMemo(
    () => (process.env.NODE_ENV !== 'production' ? Math.max(Number(amount || 0), 1000) : amount),
    [amount]
  );

  useEffect(() => {
    if (!publicKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MP] Falta publicKey en la configuración del tenant');
      }
      return;
    }
    initMercadoPago(publicKey, { locale: 'es-AR' });
    setMpReady(true);
  }, [publicKey]);

  const handleSubmit = async (data: ICardPaymentFormData<ICardPaymentBrickPayer>) => {
    setIsProcessing(true);
    onPayingChange?.(true);
    try {
      await onSubmit({
        amount: effectiveAmount,
        email: data?.payer?.email ?? '',
        installments: data?.installments,
        token: data?.token,
        identification: data?.payer?.identification,
        paymentMethodId: data.payment_method_id
      });
    } finally {
      setIsProcessing(false);
      onPayingChange?.(false);
    }
  };

  if (!mpReady) return null;

  return (
    <div id="cardPaymentBrick_container" className={isSubmitting || isProcessing ? 'pointer-events-none opacity-70' : ''}>
      <CardPayment
        initialization={{
          amount: effectiveAmount,
          payer: {
            email: defaultEmail ?? '',
          },
        }}
        customization={{
          paymentMethods: {
            minInstallments: 1,
            maxInstallments,
          },
          visual: {
            hidePaymentButton: false,
            hideFormTitle: true,
            style: {
              theme: 'bootstrap',
              customVariables: {
                baseColor: '#2563eb',
              }
            }
          },
        }}
        onSubmit={async (data) => {
          try {
            await handleSubmit(data);
          } catch (err) {
            onError?.(err);
            throw err;
          }
        }}
        onError={(e) => {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[CardPayment Brick Error]', e);
          }
          onError?.(e);
        }}
        onReady={() => {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[CardPayment Brick] ready');
          }
        }}
      />
      {(isSubmitting || isProcessing) && (
        <p className="mt-4 text-sm text-gray-600">Procesando pago...</p>
      )}
    </div>
  );
}
