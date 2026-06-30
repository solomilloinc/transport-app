'use client';

import { useEffect, useState } from 'react';
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
  selectedLegSinglePrice?: number | null;
  onConfirm: (policy: CancelPassengerPolicy, scope: CancelPassengerScope) => void;
  isConfirming: boolean;
}

export function CancelPassengerDialog({
  open,
  onOpenChange,
  passenger,
  selectedLegSinglePrice,
  onConfirm,
  isConfirming,
}: CancelPassengerDialogProps) {
  const [policy, setPolicy] = useState<CancelPassengerPolicy>('credit');
  const [scope, setScope] = useState<CancelPassengerScope>('full-round-trip');
  const isRoundTrip = passenger?.reserveRelatedId != null;

  useEffect(() => {
    if (!open || !passenger) return;
    setPolicy('credit');
    setScope('full-round-trip');
  }, [open, passenger?.passengerId]);

  if (!passenger) return null;

  const totalAmount = Number(passenger.totalAmount ?? 0);
  const selectedLegCreditAmount =
    isRoundTrip && scope === 'selected-leg-only' && selectedLegSinglePrice != null
      ? Math.max(0, totalAmount - Number(selectedLegSinglePrice))
      : totalAmount;
  const formattedCredit = `$${selectedLegCreditAmount.toLocaleString('es-AR')}`;

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
            <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <RadioGroup
                value={scope}
                onValueChange={(value) => setScope(value as CancelPassengerScope)}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="full-round-trip" id="cancel-full-round-trip" className="mt-0.5" />
                  <Label htmlFor="cancel-full-round-trip" className="font-normal leading-5">
                    Cancelar ida y vuelta
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="selected-leg-only" id="cancel-selected-leg" className="mt-0.5" />
                  <Label htmlFor="cancel-selected-leg" className="font-normal leading-5">
                    Cancelar solo este tramo
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <RadioGroup
              value={policy}
              onValueChange={(value) => setPolicy(value as CancelPassengerPolicy)}
              className="space-y-3"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="credit" id="cancel-credit" className="mt-0.5" />
                <Label htmlFor="cancel-credit" className="font-normal leading-5">
                  Dejar {formattedCredit} saldo a favor
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="no-credit" id="cancel-no-credit" className="mt-0.5" />
                <Label htmlFor="cancel-no-credit" className="font-normal leading-5">
                  Cancelar sin dejar saldo a favor
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
