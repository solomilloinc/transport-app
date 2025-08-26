'use client';

import { useEffect, useMemo, useState } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import type {
  ICardPaymentFormData,
  ICardPaymentBrickPayer,
} from '@mercadopago/sdk-react/bricks/cardPayment/type';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

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
  const [mpReady, setMpReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // En dev subimos mínimo a 1000 para que habilite métodos de test.
  const effectiveAmount = useMemo(
    () => (process.env.NODE_ENV !== 'production' ? Math.max(Number(amount || 0), 1000) : amount),
    [amount]
  );

  useEffect(() => {
    const key =
      process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ||
      process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

    if (!key) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MP] Falta NEXT_PUBLIC_MP_PUBLIC_KEY (o NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) en .env.local');
      }
      return;
    }
    initMercadoPago(key, { locale: 'es-AR' });
    setMpReady(true);
  }, []);

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

  const handleCustomButtonClick = () => {
    // Buscar el botón por los selectores específicos del HTML que compartiste
    const selectors = [
      '#cardPaymentBrick_submit',
      '[data-testid="submit-button"] button',
      '[data-testid="submit-wrapper"] button',
      '#cardPaymentBrick_container button[type="submit"]',
      '.button-container-8cRhpK button',
      'button.primary-1pmA6_'
    ];
    
    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLButtonElement;
      if (button) {
        button.click();
        break;
      }
    }
  };

  if (!mpReady) return null;

  return (
    <>
      {/* Estilos para ocultar el botón nativo */}
      <style dangerouslySetInnerHTML={{
        __html: `
          #cardPaymentBrick_container [data-testid="submit-wrapper"],
          #cardPaymentBrick_container [data-testid="submit-button"],
          #cardPaymentBrick_container button[type="submit"],
          #cardPaymentBrick_container .button-container-8cRhpK,
          #cardPaymentBrick_container .primary-1pmA6_ {
            position: absolute !important;
            left: -9999px !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `
      }} />

      <div className="space-y-4">
        <div id="cardPaymentBrick_container">
          <CardPayment
            initialization={{
              amount: effectiveAmount,
              ...(defaultEmail ? { payer: { email: defaultEmail } } : {}),
            }}
            customization={{
              paymentMethods: { 
                minInstallments: 1, 
                maxInstallments,
              },
              visual: { 
                hidePaymentButton: false,
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
              console.log('Payment brick ready');
            }}
          />
        </div>
        
        {/* Botón personalizado */}
        <div className="flex justify-end mt-6">
          <Button
            type="button"
            onClick={handleCustomButtonClick}
            disabled={isSubmitting || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 flex items-center"
          >
            {(isSubmitting || isProcessing) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando pago...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Confirmar y Pagar
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}