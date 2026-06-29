'use client';

import { Fragment, useState, useEffect } from 'react';
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
import { getApiErrorMessage } from '@/lib/apiErrors';

interface DebtSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Passenger | null;
  currentBalance?: number | null;
  paymentMethodOptions: SelectOption[];
  onSuccess: () => void;
}

export function DebtSettlementDialog({ open, onOpenChange, customer, currentBalance, paymentMethodOptions, onSuccess }: DebtSettlementDialogProps) {
  const { toast } = useToast();
  const [pendingReserves, setPendingReserves] = useState<PendingReserve[]>([]);
  const [selectedReserveIds, setSelectedReserveIds] = useState<number[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [creditAmount, setCreditAmount] = useState<string>('');
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
      setCreditAmount('');
      setPaymentAmount('');
      setExpandedReserves([]);
    }
  }, [open, customer]);

  const fetchPendingReserves = async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const data = await getCustomerPendingReserves(customer.customerId);
      if (Array.isArray(data) && data.length > 0) {
        setPendingReserves(data);
        setSelectedReserveIds(data.map((r) => r.reserveId));
      } else {
        setPendingReserves([]);
        setSelectedReserveIds([]);
      }
    } catch (error) {
      toast({ title: 'Error', description: getApiErrorMessage(error).message, variant: 'destructive' });
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
      .filter((r) => selectedReserveIds.includes(r.reserveId))
      .reduce((sum, r) => sum + r.pendingDebt, 0);
  };

  const getTotalPaymentAmount = () => {
    return payments.reduce((sum, p) => sum + p.transactionAmount, 0);
  };

  const getAppliedCreditAmount = () => {
    return Number(creditAmount) || 0;
  };

  const getAvailableCreditAmount = () => {
    const selectedDebt = getSelectedDebt();
    const balance = currentBalance ?? customer?.currentBalance ?? 0;
    return Math.min(selectedDebt, Math.max(0, selectedDebt - Math.max(0, balance)));
  };

  const getRemainingBalance = () => {
    return Math.max(0, getSelectedDebt() - getAppliedCreditAmount() - getTotalPaymentAmount());
  };

  const handleCreditAmountChange = (value: string) => {
    const numericValue = Number(value);
    if (value !== '' && numericValue < 0) return;

    const maxCredit = Math.min(getAvailableCreditAmount(), getSelectedDebt() - getTotalPaymentAmount());
    if (numericValue > maxCredit) {
      setCreditAmount(maxCredit.toString());
      return;
    }

    setCreditAmount(value);
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
    if (payments.some((p) => p.paymentMethod === methodId)) {
      toast({
        title: 'Método duplicado',
        description: 'Ya existe un pago con este método. Elimínalo antes de agregar otro.',
        variant: 'destructive',
      });
      return;
    }

    setPayments((prev) => [...prev, { paymentMethod: methodId, transactionAmount: amount }]);
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

    const appliedCredit = getAppliedCreditAmount();

    if (payments.length === 0 && appliedCredit <= 0) {
      toast({ title: 'Sin pagos', description: 'Agrega un pago o saldo a favor para continuar.', variant: 'destructive' });
      return;
    }

    if (appliedCredit > getAvailableCreditAmount()) {
      toast({
        title: 'Saldo excedido',
        description: 'El saldo a favor supera el disponible para esta deuda.',
        variant: 'destructive',
      });
      return;
    }

    const totalPayment = getTotalPaymentAmount() + appliedCredit;
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
        customerId: customer.customerId,
        reserveIds: selectedReserveIds,
        payments: payments.map((p) => ({ transactionAmount: p.transactionAmount, paymentMethod: p.paymentMethod })),
        creditAmount: appliedCredit,
      });

      toast({ title: 'Deuda saldada', description: 'Los pagos han sido registrados exitosamente.', variant: 'success' });
      setPayments([]);
      setCreditAmount('');
      setPaymentAmount('');
      onSuccess();

      // Re-fetch to update the view
      await fetchPendingReserves();
    } catch (error) {
      toast({ title: 'Error', description: getApiErrorMessage(error).message, variant: 'destructive' });
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
            Saldar deuda de {customer?.firstName} {customer?.lastName}
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
                    <Fragment key={reserve.reserveId}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <Checkbox
                            checked={selectedReserveIds.includes(reserve.reserveId)}
                            onCheckedChange={() => toggleReserveSelection(reserve.reserveId)}
                          />
                        </td>
                        <td className="p-3">
                          {format(new Date(reserve.reserveDate), 'dd/MM/yyyy', { locale: es })}
                        </td>
                        <td className="p-3 font-medium">
                          {reserve.originName} → {reserve.destinationName}
                        </td>
                        <td className="p-3">{reserve.departureHour}</td>
                        <td className="p-3 text-right">${reserve.totalPrice.toLocaleString()}</td>
                        <td className="p-3 text-right text-green-600">${reserve.totalPaid.toLocaleString()}</td>
                        <td className="p-3 text-right font-semibold text-red-600">${reserve.pendingDebt.toLocaleString()}</td>
                        <td className="p-3">
                          {reserve.passengers?.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpanded(reserve.reserveId)}>
                              {expandedReserves.includes(reserve.reserveId)
                                ? <ChevronUp className="h-4 w-4" />
                                : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {expandedReserves.includes(reserve.reserveId) && reserve.passengers?.map((p) => (
                        <tr key={`${reserve.reserveId}-${p.passengerId}`} className="border-b bg-gray-50/50">
                          <td className="p-2"></td>
                          <td className="p-2" colSpan={3}>
                            <span className="text-xs text-gray-500 ml-4">{p.fullName}</span>
                          </td>
                          <td className="p-2 text-right text-xs">${p.price.toLocaleString()}</td>
                          <td className="p-2 text-right text-xs">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                              p.status === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'
                            }`}>
                              {PaymentStatusLabels[p.status] || 'Desconocido'}
                            </span>
                          </td>
                          <td className="p-2" colSpan={2}></td>
                        </tr>
                      ))}
                    </Fragment>
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
              {getAvailableCreditAmount() > 0 && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-emerald-900">Saldo a favor disponible</span>
                    <span className="font-semibold text-emerald-800">${getAvailableCreditAmount().toLocaleString()}</span>
                  </div>
                  <FormField label="Saldo a aplicar">
                    <Input
                      type="number"
                      min={0}
                      max={getAvailableCreditAmount()}
                      placeholder="0"
                      value={creditAmount}
                      onChange={(e) => handleCreditAmountChange(e.target.value)}
                    />
                  </FormField>
                </div>
              )}
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
                          {paymentMethodOptions.find((pm) => String(pm.id) === String(payment.paymentMethod))?.label || 'Pago'}:{' '}
                          ${payment.transactionAmount.toLocaleString()}
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
                  <span className="text-gray-500">Saldo a favor aplicado:</span>
                  <span className="font-medium text-emerald-700">${getAppliedCreditAmount().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Pagos a registrar:</span>
                  <span className="font-medium">${getTotalPaymentAmount().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Restante:</span>
                  <span className="font-medium">${getRemainingBalance().toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-blue-100 text-blue-900">
                  <span className="font-bold text-lg">Total cubierto:</span>
                  <span className="font-bold text-xl">${(getTotalPaymentAmount() + getAppliedCreditAmount()).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (payments.length === 0 && getAppliedCreditAmount() <= 0) || selectedReserveIds.length === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {(payments.length > 0 || getAppliedCreditAmount() > 0) && getRemainingBalance() === 0 ? 'Saldar Deuda' : 'Registrar Pago Parcial'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
