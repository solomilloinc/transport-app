'use client';

import { useState, useEffect } from 'react';
import { post } from '@/services/api';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PlusCircleIcon, TrashIcon } from 'lucide-react';
import { emptyPaymentCreate, PassengerPaymentCreate, Payment } from '@/interfaces/payment';
import { validationConfigPayment } from '@/validations/paymentSchema';
import { PassengerReserveReport } from '@/interfaces/passengerReserve';
import { getApiErrorCode } from '@/utils/api-errors';

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passengerReserve: PassengerReserveReport | null;
  paymentMethodOptions: SelectOption[];
  onSuccess: () => void;
}

export function AddPaymentDialog({ open, onOpenChange, passengerReserve, paymentMethodOptions, onSuccess }: AddPaymentDialogProps) {
  const { toast } = useToast();
  const form = useFormValidation(emptyPaymentCreate, validationConfigPayment);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Reset state when the dialog is closed or the passenger changes
  useEffect(() => {
    if (!open) {
      form.resetForm();
      setPayments([]);
    } else if (passengerReserve) {
      // Preload remaining amount
      const remaining = getRemainingBalance();
      if (remaining > 0) {
        form.setField('TransactionAmount', remaining.toString());
      }
    }
  }, [open, passengerReserve]);

  const getTotalReserveAmount = () => {
    return passengerReserve?.PaidAmount || 0;
  };

  const getAlreadyPaidAmount = () => {
    return passengerReserve?.Payments?.reduce((total, p) => total + p.TransactionAmount, 0) || 0;
  };

  const getCurrentAddedAmount = () => {
    return payments.reduce((total, payment) => total + payment.TransactionAmount, 0);
  };

  const getRemainingBalance = () => {
    const total = getTotalReserveAmount();
    const paid = getAlreadyPaidAmount() + getCurrentAddedAmount();
    return Math.max(0, total - paid);
  };

  const handleAddPaymentToList = () => {
    // Basic validation before adding to the list
    if (Number(form.data.TransactionAmount) > 0 && form.data.PaymentMethod) {
      const methodId = Number(form.data.PaymentMethod);
      if (payments.some((p) => p.PaymentMethod === methodId)) {
        toast({
          title: 'Método duplicado',
          description: 'Ya existe un pago con este método. Elimínalo antes de agregar otro.',
          variant: 'destructive',
        });
        return;
      }

      setPayments([
        ...payments,
        {
          PaymentMethod: methodId,
          TransactionAmount: Number(form.data.TransactionAmount),
        },
      ]);
      // Reset form fields for the next payment entry
      form.setField('TransactionAmount', '');
      form.setField('PaymentMethod', 0);
    }
  };

  const handleRemovePaymentFromList = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const getTotalPaymentAmount = () => {
    return payments.reduce((total, payment) => total + payment.TransactionAmount, 0);
  };

  const handleSubmit = async () => {
    if (payments.length === 0) {
      toast({ title: 'Sin pagos', description: 'Agrega al menos un pago para continuar.', variant: 'destructive' });
      return;
    }

    const totalNew = getCurrentAddedAmount();
    const maxAllowed = getTotalReserveAmount() - getAlreadyPaidAmount();
    if (totalNew > maxAllowed) {
      toast({
        title: 'Monto excedido',
        description: 'El monto supera la deuda pendiente.',
        variant: 'destructive',
      });
      return;
    }

    form.setIsSubmitting(true);
    try {
      const payload: PassengerPaymentCreate[] = payments.map((p) => ({
        transactionAmount: p.TransactionAmount,
        paymentMethod: p.PaymentMethod,
      }));

      const response = await post(`/reserve-payments-create/${passengerReserve?.ReserveId}/${passengerReserve?.CustomerId}`, payload);
      if (response) {
        toast({ title: 'Pago cargado', description: 'El pago ha sido cargado exitosamente', variant: 'success' });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({ title: 'Error', description: 'Error al crear el pago', variant: 'destructive' });
      }
    } catch (error) {
      const code = getApiErrorCode(error);
      const msgs: Record<string, string> = {
        'Reserve.AlreadyFullyPaid': 'Esta reserva ya esta completamente pagada.',
        'Reserve.OverPaymentNotAllowed': 'El monto pagado supera la deuda pendiente.',
      };
      toast({ title: 'Error', description: msgs[code] || 'Error al crear el pago', variant: 'destructive' });
    } finally {
      form.setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Agregar pago"
      description={`Agrega pago de la reserva de ${passengerReserve?.FullName}`}
      onSubmit={handleSubmit}
      submitText={payments.length > 0 && getRemainingBalance() === 0 ? 'Saldar Deuda' : 'Registrar Pago Parcial'}
      isLoading={form.isSubmitting}
      disabled={payments.length === 0}
    >
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-6">
          <div className="rounded-lg border p-4 bg-gray-50">
            <h3 className="font-semibold text-lg mb-3">Información del Pasajero</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nombre:</span> <p>{passengerReserve?.FullName}</p>
              </div>
              <div>
                <span className="font-medium">DNI:</span> <p>{passengerReserve?.DocumentNumber}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-lg mb-3">Gestión de Pagos</h3>
            <div className="flex gap-2 mb-4 items-end">
              <FormField label="Medio de pago" required error={form.errors.PaymentMethod} className="flex-1">
                <ApiSelect value={String(form.data.PaymentMethod)} onValueChange={(value) => form.setField('PaymentMethod', Number(value))} placeholder="Seleccionar medio" options={paymentMethodOptions} loading={false} error={null} />
              </FormField>
              <FormField label="Monto" className="flex-1">
                <Input
                  id="monto"
                  type="number"
                  placeholder={`Saldo: $${getRemainingBalance().toLocaleString()}`}
                  value={form.data.TransactionAmount}
                  onChange={(e) => form.setField('TransactionAmount', e.target.value)}
                />
              </FormField>
              <Button
                size="icon"
                onClick={handleAddPaymentToList}
                disabled={!form.data.TransactionAmount || Number(form.data.TransactionAmount) <= 0}
              >
                <PlusCircleIcon className="h-4 w-4" />
              </Button>
            </div>

            {payments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pagos a Registrar:</Label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 space-y-2">
                  {payments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm">{paymentMethodOptions.find((p) => p.id === payment.PaymentMethod)?.label}: <span className="font-medium">${payment.TransactionAmount.toLocaleString()}</span></span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => handleRemovePaymentFromList(index)}><TrashIcon className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Total a Pagar:</span>
                  <span className="font-bold text-lg">${getTotalPaymentAmount().toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-1 pt-4 mt-2 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Monto total de reserva:</span>
                <span className="font-medium">${getTotalReserveAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Pagado anteriormente:</span>
                <span className="font-medium">${getAlreadyPaidAmount().toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-blue-100 text-blue-900">
                <span className="font-bold text-lg">Total a pagar ahora:</span>
                <span className="font-bold text-xl">${getTotalPaymentAmount().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormDialog>
  );
}