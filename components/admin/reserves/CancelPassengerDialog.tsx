'use client';

import { useEffect, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PassengerReserveReport, PaymentStatusEnum } from '@/interfaces/passengerReserve';

export type CancelPassengerPolicy = 'credit' | 'no-credit';

interface CancelPassengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passenger: PassengerReserveReport | null;
  onConfirm: (policy: CancelPassengerPolicy) => void;
  isConfirming: boolean;
}

export function CancelPassengerDialog({
  open,
  onOpenChange,
  passenger,
  onConfirm,
  isConfirming,
}: CancelPassengerDialogProps) {
  const [policy, setPolicy] = useState<CancelPassengerPolicy>('credit');

  useEffect(() => {
    if (!open || !passenger) return;
    setPolicy('credit');
  }, [open, passenger?.passengerId]);

  if (!passenger) return null;

  const isRoundTrip = passenger.reserveRelatedId != null;
  const hasPaid =
    passenger.status === PaymentStatusEnum.Confirmed || (passenger.paidAmount ?? 0) > 0;
  const paidAmount = passenger.paidAmount ?? 0;

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
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Tiene ida y vuelta: se cancelarán <strong>ambos tramos</strong>.</span>
            </div>
          )}

          {hasPaid ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900">
              Ya pagó: el monto
              {paidAmount > 0 ? ` ($${paidAmount.toLocaleString('es-AR')})` : ''}{' '}
              puede quedar como <strong>saldo a favor</strong> si así lo definís abajo.
              <span className="text-blue-700"> La plata ya ingresó a la caja.</span>
            </div>
          ) : (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-700">
              No había pagado: su <strong>deuda queda en cero</strong>.
            </div>
          )}

          {hasPaid && (
            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="font-medium text-slate-900">Política de cancelación</div>
              <RadioGroup
                value={policy}
                onValueChange={(value) => setPolicy(value as CancelPassengerPolicy)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="credit" id="cancel-credit" className="mt-0.5" />
                  <Label htmlFor="cancel-credit" className="font-normal leading-5">
                    Cancelar y dejar el importe como <strong>saldo a favor</strong> en la cuenta corriente.
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="no-credit" id="cancel-no-credit" className="mt-0.5" />
                  <Label htmlFor="cancel-no-credit" className="font-normal leading-5">
                    Cancelar <strong>sin saldo a favor</strong>, para cancelaciones sobre la hora según política de la empresa.
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(policy)}
            disabled={isConfirming}
          >
            {isConfirming ? 'Cancelando...' : 'Cancelar pasajero'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
