'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PassengerReserveReport } from '@/interfaces/passengerReserve';

export type DeleteAction = 'delete' | 'favor' | 'debt';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passengerReserve: PassengerReserveReport | null;
  onConfirm: (action: DeleteAction) => void;
  isConfirming: boolean;
}

export function DeleteConfirmationDialog({ open, onOpenChange, passengerReserve, onConfirm, isConfirming }: DeleteConfirmationDialogProps) {
  const [deleteAction, setDeleteAction] = useState<DeleteAction>('delete');

  useEffect(() => {
    // Reset action when modal opens or passenger changes
    if (open) {
      setDeleteAction('delete');
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(deleteAction);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar Pasajero</DialogTitle>
          <DialogDescription>
            {passengerReserve?.IsPayment
              ? `Este pasajero (${passengerReserve.FullName}) ya ha pagado. ¿Qué deseas hacer con el pago?`
              : `Este pasajero (${passengerReserve?.FullName}) no ha pagado. ¿Qué deseas hacer?`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={deleteAction} onValueChange={(value) => setDeleteAction(value as DeleteAction)} className="space-y-3">
            {passengerReserve?.IsPayment ? (
              <>
                <div className="flex items-center space-x-2"><RadioGroupItem value="delete" id="delete" /><Label htmlFor="delete">Eliminar sin guardar el pago</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="favor" id="favor" /><Label htmlFor="favor">Poner el dinero a favor del pasajero</Label></div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2"><RadioGroupItem value="delete" id="delete" /><Label htmlFor="delete">Eliminar sin registrar deuda</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="debt" id="debt" /><Label htmlFor="debt">Registrar como deuda</Label></div>
              </>
            )}
          </RadioGroup>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isConfirming}>{isConfirming ? 'Confirmando...' : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}