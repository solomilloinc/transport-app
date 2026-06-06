'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PassengerReserveReport, PaymentStatusEnum } from '@/interfaces/passengerReserve';

interface CancelPassengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passenger: PassengerReserveReport | null;
  onConfirm: () => void;
  isConfirming: boolean;
}

/**
 * Confirmación de `Cancelar` un Pasajero (passenger-cancel). A diferencia de
 * `DeleteConfirmationDialog` (Eliminar), NO ofrece elegir el destino de la plata:
 * el backend lo decide (pagó → saldo a favor; no pagó → deuda a cero). Este
 * dialog sólo informa qué va a pasar. Ver CONTEXT.md "Cancelar vs Eliminar".
 */
export function CancelPassengerDialog({
  open,
  onOpenChange,
  passenger,
  onConfirm,
  isConfirming,
}: CancelPassengerDialogProps) {
  if (!passenger) return null;

  const isRoundTrip = passenger.reserveRelatedId != null;
  const hasPaid =
    passenger.status === PaymentStatusEnum.Confirmed || (passenger.paidAmount ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar pasajero</DialogTitle>
          <DialogDescription>
            ¿Confirmás dar de baja a <span className="font-medium">{passenger.fullName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {isRoundTrip && (
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Tiene ida y vuelta: se cancelarán <strong>ambos tramos</strong>.</span>
            </div>
          )}

          {hasPaid ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900">
              Ya pagó: el monto
              {(passenger.paidAmount ?? 0) > 0
                ? ` ($${(passenger.paidAmount ?? 0).toLocaleString('es-AR')})`
                : ''}{' '}
              volverá como <strong>saldo a favor</strong> en su cuenta corriente.{' '}
              <span className="text-blue-700">No se devuelve efectivo: la plata ya entró a la caja.</span>
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-700">
              No había pagado: su <strong>deuda queda en cero</strong>.
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Volver
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Cancelando...' : 'Cancelar pasajero'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
