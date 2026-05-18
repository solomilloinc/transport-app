'use client';

import { DeleteDialog } from '@/components/dashboard/delete-dialog';

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  /** Nombre completo del cliente, para personalizar la copy del cascade. */
  customerFullName: string;
  /**
   * Datos del preview (GET /frequent-subscription/{id}/cancel-preview).
   * Si están presentes, la copy muestra números concretos.
   * Si son `null` (aún cargando, o preview falló), cae al copy genérico.
   */
  preview: { passengersToCancel: number; totalRefundAmount: number } | null;
}

/**
 * Confirmación de cancelación de FrequentSubscription.
 *
 * Copy con preview cargado:
 *   "Esto cancelará 4 reservas futuras de María Pérez y reembolsará $12.500
 *    a su cuenta corriente. ¿Confirmar?"
 *
 * Copy genérico (sin preview):
 *   "Esto cancelará las reservas futuras de {cliente} y reembolsará los cargos
 *    correspondientes a su cuenta corriente. ¿Confirmar?"
 *
 * La operación de cancel es atómica y no reversible vía API.
 */
export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  customerFullName,
  preview,
}: CancelSubscriptionDialogProps) {
  const description = preview
    ? buildConcreteCopy(customerFullName, preview)
    : buildGenericCopy(customerFullName);

  // Caso degenerado: preview confirma que no hay nada que cancelar. Permitimos
  // confirmar igual (el DELETE va a marcar la sub como Cancelled aunque no
  // tenga Passengers futuros) pero el copy lo deja claro.
  const nothingToCancel = preview?.passengersToCancel === 0;
  const confirmText = nothingToCancel ? 'Cancelar de todos modos' : 'Cancelar suscripción';

  return (
    <DeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="¿Cancelar suscripción?"
      description={description}
      cancelText="Volver"
      confirmText={confirmText}
    />
  );
}

function buildGenericCopy(customerFullName: string): string {
  return (
    `Esto cancelará las reservas futuras de ${customerFullName} y reembolsará los cargos ` +
    `correspondientes a su cuenta corriente. ¿Confirmar?`
  );
}

function buildConcreteCopy(
  customerFullName: string,
  { passengersToCancel, totalRefundAmount }: { passengersToCancel: number; totalRefundAmount: number }
): string {
  if (passengersToCancel === 0) {
    return (
      `${customerFullName} no tiene reservas futuras pendientes en esta suscripción. ` +
      `Igual podés cancelarla para que deje de generar nuevas. ¿Confirmar?`
    );
  }
  const noun = passengersToCancel === 1 ? 'reserva futura' : 'reservas futuras';
  const refundLabel = formatAmount(totalRefundAmount);
  return (
    `Esto cancelará ${passengersToCancel} ${noun} de ${customerFullName} y reembolsará ` +
    `${refundLabel} a su cuenta corriente. ¿Confirmar?`
  );
}

/**
 * El backend no trackea moneda hoy (ver FRONTEND_SERVICIOS_CLIENTE.md:103).
 * Formateamos con separador de miles es-AR y `$` literal. Si más adelante
 * el tenant define moneda, sumar el código acá.
 */
function formatAmount(amount: number): string {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}
