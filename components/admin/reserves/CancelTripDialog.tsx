'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReserveReport } from '@/interfaces/reserve';

interface CancelTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: ReserveReport | null;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function CancelTripDialog({ open, onOpenChange, trip, onConfirm, isConfirming }: CancelTripDialogProps) {
  if (!trip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Viaje</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas cancelar el viaje de las <strong>{trip.DepartureHour}</strong> de <strong>{trip.OriginName}</strong> a <strong>{trip.DestinationName}</strong>?
            Esta acción no se puede deshacer y afectará a todas las reservas asociadas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            Volver
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Cancelando...' : 'Confirmar Cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
