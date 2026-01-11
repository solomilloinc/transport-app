'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useApi } from '@/hooks/use-api';
import { ReserveReport } from '@/interfaces/reserve';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { closeCashBox, getCurrentCashBox } from '@/services/cash-box';
import CashBox from '@/interfaces/cash-box';
import { useState } from 'react';
import { toast } from 'sonner';

interface PaymentSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCashBox: CashBox | null;
  onSuccess?: () => void;
  loading?: boolean;
}

const formatSafeDate = (dateStr: string | undefined | null, formatStr: string) => {
  if (!dateStr) return '--:--';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '--:--';
  return format(date, formatStr, { locale: es });
};

export function PaymentSummaryDialog({ open, onOpenChange, currentCashBox, onSuccess, loading: loadingCashBox }: PaymentSummaryDialogProps) {
  const { fetch: fetchClose, loading: closing } = useApi<any, { description: string }, number>(closeCashBox, { autoFetch: false });

  const [closingMode, setClosingMode] = useState(false);
  const [description, setDescription] = useState('');

  const handleCloseCashBox = async () => {
    if (!description.trim()) return;

    try {
      await fetchClose({ description });
      toast.success('Caja cerrada correctamente');
      setClosingMode(false);
      setDescription('');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (e) {
      toast.error('Error al cerrar la caja');
    }
  };

  const handleCancelClosing = () => {
    setClosingMode(false);
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle de Pagos de Caja</DialogTitle>
          <DialogDescription>
            Resumen acumulado de los pagos recibidos en la caja actual.
          </DialogDescription>
        </DialogHeader>

        {currentCashBox && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
            <div className="flex justify-between items-center text-xs text-blue-600 font-semibold uppercase tracking-wider">
              <span>Caja Actual</span>
              <span className="bg-blue-100 px-2 py-0.5 rounded-full">{currentCashBox.Status}</span>
            </div>
            <p className="text-sm font-medium text-blue-900">{currentCashBox.Description}</p>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-blue-700">Abierta: {formatSafeDate(currentCashBox.OpenedAt, "HH:mm")}hs</span>
              <span className="font-bold text-blue-800">${currentCashBox.TotalAmount?.toLocaleString() ?? '0'}</span>
            </div>
          </div>
        )}

        {loadingCashBox && <div className="py-10 text-center">Cargando información de caja...</div>}

        {currentCashBox && !loadingCashBox && (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pagos por Método</h4>
              <div className="grid gap-3">
                {currentCashBox.PaymentsByMethod && currentCashBox.PaymentsByMethod.length > 0 ? (
                  currentCashBox.PaymentsByMethod.map((item) => (
                    <div key={item.PaymentMethodId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                      <span className="font-medium">{item.PaymentMethodName}</span>
                      <span className="text-lg font-bold text-blue-600">${item.Amount?.toLocaleString() ?? '0'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-400 italic">No hay pagos registrados en esta caja.</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center px-2">
                <span className="text-lg font-semibold">Total General</span>
                <span className="text-2xl font-bold text-green-600">${currentCashBox.TotalAmount?.toLocaleString() ?? '0'}</span>
              </div>
            </div>
          </div>
        )}

        {currentCashBox && closingMode && (
          <div className="space-y-4 py-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Cierre</Label>
              <Input
                id="description"
                placeholder="Ej. Cierre de jornada, cambio de turno..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={closing}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!closingMode ? (
            <>
              {currentCashBox?.CashBoxId && (
                <Button variant="destructive" onClick={() => setClosingMode(true)} disabled={loadingCashBox}>
                  Cerrar Caja
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelClosing} disabled={closing}>
                Cancelar
              </Button>
              <Button onClick={handleCloseCashBox} disabled={closing || !description.trim()}>
                {closing ? 'Cerrando...' : 'Confirmar Cierre'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
