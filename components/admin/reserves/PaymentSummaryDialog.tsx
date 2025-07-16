'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircleIcon } from 'lucide-react';

import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { get, post } from '@/services/api';
import { ReserveReport } from '@/interfaces/reserve';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Interfaces para los datos que esperamos del API
interface PaymentTotal {
  PaymentMethodName: string;
  TotalAmount: number;
}

interface OtherPayment {
  OtherPaymentId: number;
  Name: string;
  PaymentMethod: string;
  Amount: number;
}

interface PaymentSummaryResponse {
  byMethod: PaymentTotal[];
  otherPayments: OtherPayment[];
}

interface PaymentSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: ReserveReport | null;
}

export function PaymentSummaryDialog({ open, onOpenChange, trip }: PaymentSummaryDialogProps) {
  const { toast } = useToast();
  const {
    data: summary,
    loading,
    error,
    fetch: fetchSummary,
  } = useApi<PaymentSummaryResponse, number>((reserveId) => get(`/reserve-payment-summary/${reserveId}`), { autoFetch: false });

  // Estado para el formulario de "Otros Pagos"
  const [name, setName] = useState('');
  const [method, setMethod] = useState('Efectivo');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && trip) {
      fetchSummary(trip.ReserveId);
    }
  }, [open, trip]);

  const handleAddPayment = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0 || !trip) return;

    setIsSubmitting(true);
    try {
      await post('/reserve-other-payment', {
        ReserveId: trip.ReserveId,
        Name: name,
        PaymentMethod: method,
        Amount: Number(amount),
      });
      toast({ title: 'Pago agregado', description: 'El pago ha sido agregado exitosamente.', variant: 'success' });
      // Limpiar formulario y recargar el resumen
      setName('');
      setMethod('Efectivo');
      setAmount('');
      fetchSummary(trip.ReserveId);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo agregar el pago.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalByMethod = summary?.byMethod.reduce((acc, item) => acc + item.TotalAmount, 0) || 0;
  const totalOtherPayments = summary?.otherPayments.reduce((acc, item) => acc + item.Amount, 0) || 0;
  const grandTotal = totalByMethod + totalOtherPayments;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resumen de Pagos</DialogTitle>
          {trip && (
            <DialogDescription>
              Resumen de pagos para {format(new Date(trip.Date), "EEEE, d 'de' MMMM", { locale: es })} - {trip.DepartureHour}
            </DialogDescription>
          )}
        </DialogHeader>
        {loading && <div className="py-10 text-center">Cargando resumen...</div>}
        {error && <div className="py-10 text-center text-red-500">Error al cargar el resumen.</div>}
        {summary && !loading && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {summary.byMethod.map((item) => (
                <div key={item.PaymentMethodName} className="rounded-lg border p-4">
                  <div className="text-sm text-gray-500">{item.PaymentMethodName}</div>
                  <div className="text-2xl font-bold text-blue-500">${item.TotalAmount.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-500">Otros Pagos</div>
                <div className="text-lg font-bold text-blue-500">${totalOtherPayments.toLocaleString()}</div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {summary.otherPayments.map((payment) => (
                  <div key={payment.OtherPaymentId} className="flex items-center text-sm p-1">
                    <span className="w-3/5">{payment.Name}</span>
                    <span className="w-1/5 text-center text-gray-500">{payment.PaymentMethod}</span>
                    <span className="w-1/5 text-right font-medium">${payment.Amount.toLocaleString()}</span>
                  </div>
                ))}
                {summary.otherPayments.length === 0 && <p className="text-xs text-center text-gray-400 py-2">No hay otros pagos registrados.</p>}
              </div>
              <div className="flex gap-2 mt-2 items-end">
                <div className="w-3/5">
                  <Label htmlFor="other-payment-name" className="text-xs">
                    Nombre
                  </Label>
                  <Input id="other-payment-name" placeholder="Ej: Peaje" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="w-1/5">
                  <Label htmlFor="other-payment-method" className="text-xs">
                    Método
                  </Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger id="other-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex gap-1 items-end">
                  <div className="w-full">
                    <Label htmlFor="other-payment-amount" className="text-xs">
                      Monto
                    </Label>
                    <Input id="other-payment-amount" placeholder="Monto" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <Button size="icon" onClick={handleAddPayment} disabled={isSubmitting || !name.trim() || !amount || Number(amount) <= 0}>
                    <PlusCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-blue-50 p-4">
              <div className="text-sm text-blue-700">Total General</div>
              <div className="text-2xl font-bold text-blue-700">${grandTotal.toLocaleString()}</div>
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
