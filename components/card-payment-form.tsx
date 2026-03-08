'use client';

import { useEffect, useMemo, useState } from 'react';
import { CardPayment } from '@mercadopago/sdk-react';
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
  const [isProcessing, setIsProcessing] = useState(false);

  // En dev subimos mínimo a 1000 para que habilite métodos de test.
  const effectiveAmount = useMemo(
    () => {
      const val = process.env.NODE_ENV !== 'production' ? Math.max(Number(amount || 0), 1000) : amount;
      return isNaN(val) ? 1000 : val;
    },
    [amount]
  );

  const handleSubmit = async (data: ICardPaymentFormData<ICardPaymentBrickPayer>) => {
    if (isProcessing || isSubmitting) return;
    
    setIsProcessing(true);
    onPayingChange?.(true);
    try {
      await onSubmit({
        amount: effectiveAmount,
        email: data?.payer?.email ?? defaultEmail ?? '',
        installments: data?.installments,
        token: data?.token,
        identification: data?.payer?.identification,
        paymentMethodId: data.payment_method_id
      });
    } catch (err) {
      console.error('[CardPayment] Submit error:', err);
      onError?.(err);
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

  if (!effectiveAmount || effectiveAmount <= 0) return null;

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
            key={`mp-brick-${effectiveAmount}`} // Force re-render if amount changes to avoid internal SDK issues
            initialization={{
              amount: effectiveAmount,
              payer: {
                email: defaultEmail || '',
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