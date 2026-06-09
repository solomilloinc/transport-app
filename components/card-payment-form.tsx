'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import type {
  ICardPaymentFormData,
  ICardPaymentBrickPayer,
} from '@mercadopago/sdk-react/bricks/cardPayment/type';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
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

// El controller que el SDK guarda en `window.cardPaymentBrickController` es el
// controller CORE del Brick (no el wrapper de React, que sólo tipa update/unmount).
// El core expone `getFormData()`: valida el form, crea el card token y devuelve
// el formData — es la API oficial de MP para usar un botón de submit propio.
type CardPaymentCoreController = {
  getFormData?: () => Promise<ICardPaymentFormData<ICardPaymentBrickPayer> | undefined>;
};

function getBrickController(): CardPaymentCoreController | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { cardPaymentBrickController?: CardPaymentCoreController })
    .cardPaymentBrickController;
}

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

  // Refs para tener siempre el último valor de las props sin volver inestables
  // los callbacks/objetos que recibe el Brick (cada cambio de prop fuerza al
  // SDK a desmontar y re-montar el Brick).
  const onSubmitRef = useRef(onSubmit);
  const onErrorRef = useRef(onError);
  const onPayingChangeRef = useRef(onPayingChange);
  const effectiveAmountRef = useRef(0);

  onSubmitRef.current = onSubmit;
  onErrorRef.current = onError;
  onPayingChangeRef.current = onPayingChange;

  // En dev subimos mínimo a 1000 para que habilite métodos de test.
  const effectiveAmount = useMemo(
    () => (process.env.NODE_ENV !== 'production' ? Math.max(Number(amount || 0), 1000) : amount),
    [amount],
  );
  effectiveAmountRef.current = effectiveAmount;

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

  const handleBrickError = useCallback((e: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[CardPayment Brick Error]', e);
    }
    onErrorRef.current?.(e);
  }, []);

  const handleBrickReady = useCallback(() => {}, []);

  // Requerido por el tipo del Brick, pero inalcanzable: con hidePaymentButton:true
  // no hay botón nativo que lo dispare. El submit real ocurre en handlePayClick.
  const noopSubmit = useCallback(async () => {}, []);

  // Objetos memoizados → el useEffect interno del Brick sólo corre cuando los
  // valores cambian de verdad, no en cada render.
  const initialization = useMemo(() => ({
    amount: effectiveAmount,
    // OJO: si se pre-carga `payer.email`, el Brick OCULTA el campo de email.
    // Lo dejamos vacío a propósito para que el usuario lo vea y complete.
    payer: { email: '' },
  }), [effectiveAmount]);

  const customization = useMemo(() => ({
    paymentMethods: {
      minInstallments: 1,
      maxInstallments,
    },
    visual: {
      // Ocultamos el botón nativo del Brick: disparamos el submit nosotros vía
      // getFormData() desde nuestro propio botón. Esto evita el hack frágil de
      // clickear el botón por querySelector (que agarraba botones huérfanos de
      // Bricks viejos cuyo onSubmit ya no llegaba a React → token 201 sin pago).
      hidePaymentButton: true,
      hideFormTitle: true,
      style: {
        theme: 'bootstrap' as const,
        customVariables: { baseColor: '#2563eb' },
      },
    },
  }), [maxInstallments]);

  const handlePayClick = async () => {
    const controller = getBrickController();
    if (!controller?.getFormData) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[MP] El Brick todavía no está listo (getFormData no disponible).');
      }
      return;
    }

    setIsProcessing(true);
    onPayingChangeRef.current?.(true);
    try {
      // Valida el form + crea el card token. Si el form es inválido, el Brick
      // muestra los errores inline y getFormData rechaza/devuelve undefined.
      const formData = await controller.getFormData();
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[MP] getFormData() OK:', {
          token: formData?.token,
          installments: formData?.installments,
          paymentMethodId: formData?.payment_method_id,
        });
      }
      if (!formData?.token) return;

      await onSubmitRef.current({
        amount: effectiveAmountRef.current,
        email: formData.payer?.email ?? '',
        // Con maxInstallments=1 el Brick puede no exponer el selector y devolver
        // installments undefined; el backend exige un entero positivo.
        installments: formData.installments || 1,
        token: formData.token,
        identification: formData.payer?.identification,
        paymentMethodId: formData.payment_method_id,
      });
    } catch (err) {
      onErrorRef.current?.(err);
    } finally {
      setIsProcessing(false);
      onPayingChangeRef.current?.(false);
    }
  };

  if (!mpReady) return null;

  return (
    <div className="space-y-4">
      {/* `<CardPayment>` renderiza internamente su <div id="cardPaymentBrick_container">.
          No lo envolvemos en otro div con el mismo id. */}
      <CardPayment
        initialization={initialization}
        customization={customization}
        onSubmit={noopSubmit}
        onError={handleBrickError}
        onReady={handleBrickReady}
      />

      <div className="flex justify-end mt-6">
        <Button
          type="button"
          onClick={handlePayClick}
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
  );
}
