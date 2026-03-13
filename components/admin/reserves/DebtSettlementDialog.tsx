'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircleIcon, TrashIcon, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/dashboard/form-field';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { Passenger } from '@/interfaces/passengers';
import { PendingReserve } from '@/interfaces/customerAccount';
import { PaymentStatusLabels } from '@/interfaces/passengerReserve';
import { Payment } from '@/interfaces/payment';
import { getCustomerPendingReserves, settleCustomerDebt } from '@/services/customerAccount';
import { getApiErrorCode } from '@/utils/api-errors';

interface DebtSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Passenger | null;
  paymentMethodOptions: SelectOption[];
  onSuccess: () => void;
}

export function DebtSettlementDialog({ open, onOpenChange, customer, paymentMethodOptions, onSuccess }: DebtSettlementDialogProps) {
  const { toast } = useToast();
  const [pendingReserves, setPendingReserves] = useState<PendingReserve[]>([]);
  const [selectedReserveIds, setSelectedReserveIds] = useState<number[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('1');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReserves, setExpandedReserves] = useState<number[]>([]);

  useEffect(() => {
    if (open && customer) {
      fetchPendingReserves();
    }
    if (!open) {
      setPendingReserves([]);
      setSelectedReserveIds([]);
      setPayments([]);
      setPaymentAmount('');
      setExpandedReserves([]);
    }
  }, [open, customer]);

  const fetchPendingReserves = async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const data = await getCustomerPendingReserves(customer.CustomerId);
      if (Array.isArray(data) && data.length > 0) {
        setPendingReserves(data);
        setSelectedReserveIds(data.map((r) => r.ReserveId));
      } else {
        setPendingReserves([]);
        setSelectedReserveIds([]);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al cargar reservas pendientes.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReserveSelection = (reserveId: number) => {
    setSelectedReserveIds((prev) =>
      prev.includes(reserveId) ? prev.filter((id) => id !== reserveId) : [...prev, reserveId]
    );
  };

  const toggleExpanded = (reserveId: number) => {
    setExpandedReserves((prev) =>
      prev.includes(reserveId) ? prev.filter((id) => id !== reserveId) : [...prev, reserveId]
    );
  };

  const getSelectedDebt = () => {
    return pendingReserves
      .filter((r) => selectedReserveIds.includes(r.ReserveId))
      .reduce((sum, r) => sum + r.PendingDebt, 0);
  };

  const getTotalPaymentAmount = () => {
    return payments.reduce((sum, p) => sum + p.TransactionAmount, 0);
  };

  const getRemainingBalance = () => {
    return Math.max(0, getSelectedDebt() - getTotalPaymentAmount());
  };

  const handleAddPayment = () => {
    const amount = Number(paymentAmount) || getRemainingBalance();
    const remaining = getRemainingBalance();

    if (amount <= 0) return;

    if (amount > remaining) {
      toast({
        title: 'Monto excedido',
        description: `El monto ($${amount.toLocaleString()}) no puede superar la deuda seleccionada ($${remaining.toLocaleString()}).`,
        variant: 'destructive',
      });
      return;
    }

    const methodId = Number(selectedPaymentMethod);
    if (payments.some((p) => p.PaymentMethod === methodId)) {
      toast({
        title: 'Método duplicado',
        description: 'Ya existe un pago con este método. Elimínalo antes de agregar otro.',
        variant: 'destructive',
      });
      return;
    }

    setPayments((prev) => [...prev, { PaymentMethod: methodId, TransactionAmount: amount }]);
    setSelectedPaymentMethod('1');
    setPaymentAmount('');
  };

  const handleRemovePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!customer) return;

    if (selectedReserveIds.length === 0) {
      toast({ title: 'Sin selección', description: 'Selecciona al menos una reserva.', variant: 'destructive' });
      return;
    }

    if (payments.length === 0) {
      toast({ title: 'Sin pagos', description: 'Agrega al menos un pago para continuar.', variant: 'destructive' });
      return;
    }

    const totalPayment = getTotalPaymentAmount();
    const totalDebt = getSelectedDebt();
    if (totalPayment > totalDebt) {
      toast({
        title: 'Monto excedido',
        description: 'El monto total supera la deuda seleccionada.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await settleCustomerDebt({
        customerId: customer.CustomerId,
        reserveIds: selectedReserveIds,
        payments: payments.map((p) => ({ transactionAmount: p.TransactionAmount, paymentMethod: p.PaymentMethod })),
      });

      toast({ title: 'Deuda saldada', description: 'Los pagos han sido registrados exitosamente.', variant: 'success' });
      setPayments([]);
      setPaymentAmount('');
      onSuccess();

      // Re-fetch to update the view
      await fetchPendingReserves();
    } catch (error) {
      const code = getApiErrorCode(error);
      const msgs: Record<string, string> = {
        'Customer.NotFound': 'Cliente no encontrado.',
        'Reserve.NotFound': 'Reserva no encontrada.',
        'Reserve.NoDebtToSettle': 'No hay deuda pendiente para saldar.',
        'Reserve.OverPaymentNotAllowed': 'El monto supera la deuda pendiente.',
        'Payments.InvalidAmount': 'Monto de pago inválido.',
        'Payments.DuplicatedMethod': 'Método de pago duplicado.',
        'CashBox.NotFound': 'Caja no encontrada. Abra una caja antes de continuar.',
      };
      toast({ title: 'Error', description: msgs[code] || 'Error al saldar la deuda.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] sm:w-[90%] md:w-[80%] lg:w-[60%] max-w-none">
        <DialogHeader>
          <DialogTitle className="text-blue-500">Saldar Deuda</DialogTitle>
          <DialogDescription>
            Saldar deuda de {customer?.FirstName} {customer?.LastName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : pendingReserves.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Este cliente no tiene reservas con deuda pendiente.</div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Reserves table */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="p-3 w-8"></th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Ruta</th>
                    <th className="p-3">Hora</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Pagado</th>
                    <th className="p-3 text-right">Deuda</th>
                    <th className="p-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReserves.map((reserve) => (
                    <>
                      <tr key={reserve.ReserveId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <Checkbox
                            checked={selectedReserveIds.includes(reserve.ReserveId)}
                            onCheckedChange={() => toggleReserveSelection(reserve.ReserveId)}
                          />
                        </td>
                        <td className="p-3">
                          {format(new Date(reserve.ReserveDate), 'dd/MM/yyyy', { locale: es })}
                        </td>
                        <td className="p-3 font-medium">
                          {reserve.OriginName} → {reserve.DestinationName}
                        </td>
                        <td className="p-3">{reserve.DepartureHour}</td>
                        <td className="p-3 text-right">${reserve.TotalPrice.toLocaleString()}</td>
                        <td className="p-3 text-right text-green-600">${reserve.TotalPaid.toLocaleString()}</td>
                        <td className="p-3 text-right font-semibold text-red-600">${reserve.PendingDebt.toLocaleString()}</td>
                        <td className="p-3">
                          {reserve.Passengers?.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpanded(reserve.ReserveId)}>
                              {expandedReserves.includes(reserve.ReserveId)
                                ? <ChevronUp className="h-4 w-4" />
                                : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {expandedReserves.includes(reserve.ReserveId) && reserve.Passengers?.map((p) => (
                        <tr key={`${reserve.ReserveId}-${p.PassengerId}`} className="border-b bg-gray-50/50">
                          <td className="p-2"></td>
                          <td className="p-2" colSpan={3}>
                            <span className="text-xs text-gray-500 ml-4">{p.FullName}</span>
                          </td>
                          <td className="p-2 text-right text-xs">${p.Price.toLocaleString()}</td>
                          <td className="p-2 text-right text-xs">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                              p.Status === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                            }`}>
                              {PaymentStatusLabels[p.Status] || 'Desconocido'}
                            </span>
                          </td>
                          <td className="p-2" colSpan={2}></td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected debt summary */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-800">Deuda seleccionada ({selectedReserveIds.length} reservas):</span>
                <span className="text-xl font-bold text-blue-900">${getSelectedDebt().toLocaleString()}</span>
              </div>
            </div>

            {/* Payments section */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">Pagos</h3>
              <div className="flex gap-2 items-end">
                <FormField label="Método de Pago" className="flex-1">
                  <ApiSelect
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                    placeholder="Seleccionar..."
                    options={paymentMethodOptions}
                  />
                </FormField>
                <FormField label="Monto" className="flex-1">
                  <Input
                    type="number"
                    placeholder={`Restante: $${getRemainingBalance().toLocaleString()}`}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </FormField>
                <Button size="icon" onClick={handleAddPayment} disabled={getRemainingBalance() <= 0 || selectedReserveIds.length === 0}>
                  <PlusCircleIcon className="h-4 w-4" />
                </Button>
              </div>

              {payments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pagos a Registrar:</Label>
                  <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 space-y-1">
                    {payments.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-1 bg-white rounded">
                        <span className="text-sm">
                          {paymentMethodOptions.find((pm) => String(pm.id) === String(payment.PaymentMethod))?.label || 'Pago'}:{' '}
                          ${payment.TransactionAmount.toLocaleString()}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemovePayment(index)}>
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1 pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Deuda seleccionada:</span>
                  <span className="font-medium">${getSelectedDebt().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Restante:</span>
                  <span className="font-medium">${getRemainingBalance().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-blue-100 text-blue-900">
                  <span className="font-bold text-lg">Total a pagar:</span>
                  <span className="font-bold text-xl">${getTotalPaymentAmount().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || payments.length === 0 || selectedReserveIds.length === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {payments.length > 0 && getRemainingBalance() === 0 ? 'Saldar Deuda' : 'Registrar Pago Parcial'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
