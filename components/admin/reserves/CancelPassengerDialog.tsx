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
import { PassengerReserveReport } from '@/interfaces/passengerReserve';

export type CancelPassengerPolicy = 'credit' | 'no-credit';
export type CancelPassengerScope = 'full-round-trip' | 'selected-leg-only';

interface CancelPassengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passenger: PassengerReserveReport | null;
  onConfirm: (policy: CancelPassengerPolicy, scope: CancelPassengerScope) => void;
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
  const [scope, setScope] = useState<CancelPassengerScope>('full-round-trip');

  useEffect(() => {
    if (!open || !passenger) return;
    setPolicy('credit');
    setScope('full-round-trip');
  }, [open, passenger?.passengerId]);

  if (!passenger) return null;

  const isRoundTrip = passenger.reserveRelatedId != null;
  const paidAmount = passenger.paidAmount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar pasajero</DialogTitle>
          <DialogDescription>
            Confirmas dar de baja a <span className="font-medium">{passenger.fullName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {isRoundTrip && (
            <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Este pasajero pertenece a un paquete ida y vuelta.</span>
              </div>
              <RadioGroup
                value={scope}
                onValueChange={(value) => setScope(value as CancelPassengerScope)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="full-round-trip" id="cancel-full-round-trip" className="mt-0.5" />
                  <Label htmlFor="cancel-full-round-trip" className="font-normal leading-5">
                    Cancelar <strong>ida y vuelta completa</strong>.
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="selected-leg-only" id="cancel-selected-leg" className="mt-0.5" />
                  <Label htmlFor="cancel-selected-leg" className="font-normal leading-5">
                    Cancelar <strong>solo este tramo</strong> y convertir el otro en ida simple.
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-900">
            {paidAmount > 0
              ? `Ya pago $${paidAmount.toLocaleString('es-AR')}.`
              : 'Puede existir deuda pendiente en cuenta corriente.'}{' '}
            La cancelacion normal no mueve caja.
          </div>

          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="font-medium text-slate-900">Cuenta corriente</div>
            <RadioGroup
              value={policy}
              onValueChange={(value) => setPolicy(value as CancelPassengerPolicy)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="credit" id="cancel-credit" className="mt-0.5" />
                <Label htmlFor="cancel-credit" className="font-normal leading-5">
                  Actualizar cuenta corriente con el reintegro/ajuste correspondiente.
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no-credit" id="cancel-no-credit" className="mt-0.5" />
                <Label htmlFor="cancel-no-credit" className="font-normal leading-5">
                  Cancelar sin tocar cuenta corriente.
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(policy, isRoundTrip ? scope : 'full-round-trip')}
            disabled={isConfirming}
          >
            {isConfirming ? 'Cancelando...' : 'Cancelar pasajero'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
