'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useApi } from '@/hooks/use-api';
import { ReserveReport, ReservePaymentSummary } from '@/interfaces/reserve';
import { getReservePaymentSummary } from '@/services/reserves';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PaymentSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: ReserveReport | null;
}

export function PaymentSummaryDialog({ open, onOpenChange, trip }: PaymentSummaryDialogProps) {
  const {
    data: summaryResponse,
    loading,
    error,
    fetch: fetchSummary,
  } = useApi<ReservePaymentSummary, number>(getReservePaymentSummary, { autoFetch: false });

  useEffect(() => {
    if (open && trip) {
      fetchSummary(trip.ReserveId);
    }
  }, [open, trip]);

  const summary = summaryResponse?.Items?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle de Pagos</DialogTitle>
          {trip && (
            <DialogDescription>
              Pagos de la reserva para {format(new Date(trip.ReserveDate), "EEEE, d 'de' MMMM", { locale: es })} - {trip.DepartureHour}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {loading && <div className="py-10 text-center">Cargando resumen...</div>}
        {error && <div className="py-10 text-center text-red-500">Error al cargar el resumen.</div>}
        
        {summary && !loading && (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pagos por Método</h4>
              <div className="grid gap-3">
                {summary.paymentsByMethod.length > 0 ? (
                  summary.paymentsByMethod.map((item) => (
                    <div key={item.paymentMethodId} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                      <span className="font-medium">{item.paymentMethodName}</span>
                      <span className="text-lg font-bold text-blue-600">${item.amount.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-400 italic">No hay pagos registrados para esta reserva.</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center px-2">
                <span className="text-lg font-semibold">Total General</span>
                <span className="text-2xl font-bold text-green-600">${summary.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
