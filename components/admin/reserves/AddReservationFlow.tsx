'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircleIcon, TrashIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { NewClientDialog } from '@/components/admin/reserves/NewClientDialog';

import { post } from '@/services/api';
import { ReserveReport } from '@/interfaces/reserve';
import { Passenger } from '@/interfaces/passengers';
import { emptyPassengerCreate, PassengerReserveCreate } from '@/interfaces/passengerReserve';
import { Payment } from '@/interfaces/payment';

import { useFormValidation } from '@/hooks/use-form-validation';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

import { getPassengers } from '@/services/passenger';
import { getReserves } from '@/services/reserves';
import { reserveValidationSchema } from '@/validations/reservePassengerSchema';
import { PaginationParams } from '@/services/types';

enum FlowStep {
  SELECT_PASSENGER,
  ADD_DETAILS,
  SELECT_RETURN_TRIP,
  CONFIRM_PAYMENT,
}

interface AddReservationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialTrip: ReserveReport | null;
  directions: SelectOption[];
  paymentMethods: SelectOption[];
  isLoadingOptions: boolean;
  optionsError: string | null;
}

export function AddReservationFlow({
  open,
  onOpenChange,
  onSuccess,
  initialTrip,
  directions,
  paymentMethods,
  isLoadingOptions,
  optionsError,
}: AddReservationFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<FlowStep | null>(null);

  // Form and data state
  const reserveForm = useFormValidation(emptyPassengerCreate, reserveValidationSchema);
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  // Round-trip state
  const [month, setMonth] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTrip, setReturnTrip] = useState<ReserveReport | null>(null);

  // Data aggregation state
  const [passengerReserves, setPassengerReserves] = useState<PassengerReserveCreate[]>([]);
  const [reservationPayments, setReservationPayments] = useState<Payment[]>([]);

  // Payment form state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('1');
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  // API Hooks
  const {
    data: dataPassenger,
    fetch: fetchPassenger,
    reset: resetDataPassenger,
  } = useApi<Passenger, PaginationParams>(getPassengers, { autoFetch: false });
  const { data: dataReturnReserves, fetch: fetchReturnReserves } = useApi<ReserveReport, string>(getReserves, { autoFetch: false });

  // Effect to start and reset the flow
  useEffect(() => {
    if (open && initialTrip) {
      setStep(FlowStep.SELECT_PASSENGER);
    } else {
      resetFlow();
    }
  }, [open, initialTrip]);

  // Effect to handle passenger search debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (passengerSearchQuery.length >= 3) {
        fetchPassenger({ filters: { documentNumber: passengerSearchQuery } });
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [passengerSearchQuery]);

  // Effect to fetch return trips when return date changes
  useEffect(() => {
    if (returnDate) {
      fetchReturnReserves(format(returnDate, 'yyyyMMdd'));
    }
  }, [returnDate]);

  // Effect to preload paymentAmount when entering CONFIRM_PAYMENT step
  useEffect(() => {
    if (step === FlowStep.CONFIRM_PAYMENT && !paymentAmount && reservationPayments.length === 0) {
      setPaymentAmount(getRemainingBalance().toString());
    }
  }, [step]);

  const resetFlow = () => {
    setStep(null);
    reserveForm.resetForm();
    setPassengerSearchQuery('');
    setSelectedPassenger(null);
    setReturnDate(undefined);
    setReturnTrip(null);
    setPassengerReserves([]);
    setReservationPayments([]);
    onOpenChange(false);
  };

  const handleSelectPassenger = (passenger: Passenger) => {
    setSelectedPassenger(passenger);
    setStep(FlowStep.ADD_DETAILS);
    setPassengerSearchQuery('');
    resetDataPassenger();
  };

  const handleNewClientSuccess = (newPassenger: Passenger) => {
    setSelectedPassenger(newPassenger);
    setIsNewClientModalOpen(false);
    setStep(FlowStep.ADD_DETAILS);
  };

  const handleSubmitDetails = () => {
    reserveForm.handleSubmit(async (data) => {
      const reserveData: PassengerReserveCreate = {
        ...data,
        ReserveId: initialTrip!.ReserveId,
        CustomerId: selectedPassenger!.CustomerId,
        Price: initialTrip!.Prices.find((price) => price.ReserveTypeId === data.ReserveTypeId)?.Price || 0,
      };

      console.log(initialTrip)
      setPassengerReserves([reserveData]);

      if (data.ReserveTypeId === 2) {
        // Round trip - usar la fecha del viaje de ida como fecha inicial de vuelta
        reserveForm.setField('IsPayment', true);
        const tripDate = new Date(initialTrip!.ReserveDate);
        setReturnDate(tripDate);
        setMonth(tripDate);
        setStep(FlowStep.SELECT_RETURN_TRIP);
      } else {
        // One way
        setStep(FlowStep.CONFIRM_PAYMENT);
      }
    });
  };

  const handleSubmitReturnTrip = () => {
    reserveForm.handleSubmit(async (data) => {
      if (!returnTrip) {
        toast({ title: 'Error', description: 'Por favor, selecciona un viaje de vuelta.', variant: 'destructive' });
        return;
      }

      console.log(returnTrip)

      console.log(data)
      const returnReserveData: PassengerReserveCreate = {
        ...data,
        ReserveId: returnTrip.ReserveId,
        CustomerId: selectedPassenger!.CustomerId,
        PickupLocationId: Number(reserveForm.data.PickupLocationReturnId),
        DropoffLocationId: Number(reserveForm.data.DropoffLocationReturnId),
        Price: 0, // El precio ya se cobra en el viaje de ida (ReserveTypeId: 2)
      };

      setPassengerReserves((prev) => [...prev, returnReserveData]);
      setStep(FlowStep.CONFIRM_PAYMENT);
    });
  };

  const handleAddPayment = () => {
    const amount = Number(paymentAmount) || getRemainingBalance();
    const remaining = getRemainingBalance();

    if (amount > 0) {
      if (amount > remaining) {
        toast({
          title: 'Monto excedido',
          description: `El monto ($${amount.toLocaleString()}) no puede superar el saldo restante ($${remaining.toLocaleString()}).`,
          variant: 'destructive',
        });
        return;
      }

      const newPayment = { PaymentMethod: Number(selectedPaymentMethod), TransactionAmount: amount };
      console.log('➕ Agregando pago:', newPayment);
      setReservationPayments((prev) => [...prev, newPayment]);
      setSelectedPaymentMethod('1');
      setPaymentAmount('');
    }
  };

  const handleRemovePayment = (index: number) => {
    setReservationPayments((payments) => payments.filter((_, i) => i !== index));
  };

  const getTotalPaymentAmount = () => {
    return reservationPayments.reduce((total, payment) => total + payment.TransactionAmount, 0);
  };

  const getTotalReserveAmount = () => {
    return passengerReserves.reduce((total, reserve) => total + reserve.Price, 0);
  };

  const getRemainingBalance = () => {
    return Math.max(0, getTotalReserveAmount() - getTotalPaymentAmount());
  };

  const finalizeReservation = async () => {
    reserveForm.setIsSubmitting(true);
    
    console.log('🏁 Finalizando reserva...');
    console.log('📦 Reservas de pasajeros:', passengerReserves);
    console.log('💰 Pagos existentes:', reservationPayments);
    console.log('✅ Tiene pago habilitado:', reserveForm.data.IsPayment);
    
    let paymentsToSend: Payment[] = [];
    
    if (reserveForm.data.IsPayment) {
      const totalReserveAmount = getTotalReserveAmount();
      const totalPaymentAmount = getTotalPaymentAmount();

      // Si hay pagos cargados manualmente, deben coincidir con el total
      if (reservationPayments.length > 0) {
        if (totalPaymentAmount !== totalReserveAmount) {
          toast({
            title: 'Error en el pago',
            description: `El total de los pagos ($${totalPaymentAmount.toLocaleString()}) debe coincidir exactamente con el total de la reserva ($${totalReserveAmount.toLocaleString()}).`,
            variant: 'destructive',
          });
          reserveForm.setIsSubmitting(false);
          return;
        }
        paymentsToSend = reservationPayments;
        console.log('👤 Usando pagos manuales:', paymentsToSend);
      } else {
        // Auto-crear pago con el total si no hay pagos agregados
        paymentsToSend = [{ PaymentMethod: Number(selectedPaymentMethod), TransactionAmount: totalReserveAmount }];
        console.log('🤖 Auto-creando pago con total:', paymentsToSend[0]);
      }
    }
    
    try {
      const response = await post('/passenger-reserves-create', { items: passengerReserves, payments: paymentsToSend });
      if (response) {
        toast({ title: 'Reserva creada', description: 'La reserva ha sido creada exitosamente.', variant: 'success' });
        onSuccess();
        resetFlow();
      } else {
        toast({ title: 'Error', description: 'Error al crear la reserva.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Ocurrió un error al crear la reserva.', variant: 'destructive' });
    } finally {
      reserveForm.setIsSubmitting(false);
    }
  };

  if (!open || !initialTrip) return null;

  return (
    <>
      {/* Step 1: Select Passenger */}
      <Dialog open={step === FlowStep.SELECT_PASSENGER} onOpenChange={(isOpen) => !isOpen && resetFlow()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seleccionar Pasajero</DialogTitle>
            <DialogDescription>Busca un pasajero existente o crea uno nuevo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Buscar por nombre o DNI..." value={passengerSearchQuery} onChange={(e) => setPassengerSearchQuery(e.target.value)} />
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {dataPassenger?.Items?.map((p) => (
                <div
                  key={p.CustomerId}
                  className="flex items-center justify-between p-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelectPassenger(p)}
                >
                  <div>
                    <span className="font-medium">
                      {p.FirstName} {p.LastName}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">DNI: {p.DocumentNumber}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Seleccionar
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={resetFlow}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setIsNewClientModalOpen(true);
              }}
            >
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Client Dialog (part of Step 1) */}
      <NewClientDialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen} onSuccess={handleNewClientSuccess} />

      {/* Step 2: Add Details */}
      <FormDialog
        open={step === FlowStep.ADD_DETAILS}
        onOpenChange={(isOpen) => !isOpen && resetFlow()}
        title="Añadir Pasajero al Viaje"
        description={`Añadiendo a ${selectedPassenger?.FirstName} ${selectedPassenger?.LastName}`}
        onSubmit={handleSubmitDetails}
        submitText="Siguiente"
        isLoading={reserveForm.isSubmitting}
      >
        <FormField label="Dirección de subida" required error={reserveForm.errors.PickupLocationId}>
          <ApiSelect
            value={String(reserveForm.data.PickupLocationId)}
            onValueChange={(v) => reserveForm.setField('PickupLocationId', Number(v))}
            placeholder="Seleccionar..."
            options={directions}
            loading={isLoadingOptions}
            error={optionsError}
          />
        </FormField>
        <FormField label="Dirección de Bajada" required error={reserveForm.errors.DropoffLocationId}>
          <ApiSelect
            value={String(reserveForm.data.DropoffLocationId)}
            onValueChange={(v) => reserveForm.setField('DropoffLocationId', Number(v))}
            placeholder="Seleccionar..."
            options={directions}
            loading={isLoadingOptions}
            error={optionsError}
          />
        </FormField>
        <FormField label="Ida y Vuelta">
          <Checkbox
            id="round-trip"
            checked={reserveForm.data.ReserveTypeId === 2}
            onCheckedChange={(c) => reserveForm.setField('ReserveTypeId', c ? 2 : 1)}
          />
          <Label htmlFor="round-trip" className="ml-2 text-sm font-normal">
            Reservar viaje de ida y vuelta
          </Label>
        </FormField>
      </FormDialog>

      {/* Step 3: Select Return Trip */}
      <FormDialog
        open={step === FlowStep.SELECT_RETURN_TRIP}
        onOpenChange={(isOpen) => !isOpen && resetFlow()}
        title="Seleccionar Viaje de Vuelta"
        description={`Para ${selectedPassenger?.FirstName}`}
        onSubmit={handleSubmitReturnTrip}
        submitText="Siguiente"
        isLoading={reserveForm.isSubmitting}
        className="sm:max-w-3xl"
      >
        <div className="grid md:grid-cols-2 gap-6 py-4">
          <div>
            <Label className="font-medium mb-2 block">Fecha de vuelta</Label>
            <Calendar
              mode="single"
              selected={returnDate}
              onSelect={setReturnDate}
              month={month}
              onMonthChange={setMonth}
              locale={es}
              fromMonth={new Date()}
            />
          </div>
          <div className="space-y-4">
            {returnDate && (
              <div>
                <Label className="font-medium mb-2 block">Viajes para {format(returnDate, 'd MMM', { locale: es })}</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {dataReturnReserves?.Items?.map((trip) => (
                    <button
                      key={trip.ReserveId}
                      className={`flex w-full items-center justify-between rounded-md border p-2 text-left text-sm ${
                        returnTrip?.ReserveId === trip.ReserveId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setReturnTrip(trip)}
                    >
                      <span>{trip.DepartureHour}</span>
                      <span>
                        {trip.OriginName} → {trip.DestinationName}
                      </span>
                    </button>
                  ))}
                  {dataReturnReserves?.Items?.length === 0 && <p className="text-center text-sm text-gray-500 p-4">No hay viajes.</p>}
                </div>
              </div>
            )}
            <FormField label="Dirección de subida (Vuelta)" error={reserveForm.errors.PickupLocationReturnId}>
              <ApiSelect
                value={String(reserveForm.data.PickupLocationReturnId)}
                onValueChange={(v) => reserveForm.setField('PickupLocationReturnId', v)}
                placeholder="Seleccionar..."
                options={directions}
                loading={isLoadingOptions}
                error={optionsError}
              />
            </FormField>
            <FormField label="Dirección de bajada (Vuelta)" error={reserveForm.errors.DropoffLocationReturnId}>
              <ApiSelect
                value={String(reserveForm.data.DropoffLocationReturnId)}
                onValueChange={(v) => reserveForm.setField('DropoffLocationReturnId', v)}
                placeholder="Seleccionar..."
                options={directions}
                loading={isLoadingOptions}
                error={optionsError}
              />
            </FormField>
          </div>
        </div>
      </FormDialog>

      {/* Step 4: Confirm and Pay */}
      <FormDialog
        open={step === FlowStep.CONFIRM_PAYMENT}
        onOpenChange={(isOpen) => !isOpen && resetFlow()}
        title="Confirmar y Pagar"
        description="Revisa los detalles y añade el pago."
        onSubmit={finalizeReservation}
        submitText="Confirmar Reserva"
        isLoading={reserveForm.isSubmitting}
        onSubmit={finalizeReservation}
        submitText="Confirmar Reserva"
        isLoading={reserveForm.isSubmitting}
        disabled={reserveForm.data.IsPayment && reservationPayments.length > 0 && Math.abs(getTotalPaymentAmount() - getTotalReserveAmount()) > 1}
      >
        <div className="space-y-6 py-4">
          <div className="rounded-lg border p-4 bg-gray-50 space-y-4">
            <h3 className="font-semibold">Resumen de la Reserva</h3>
            <p className="text-sm">
              <span className="font-medium">Pasajero:</span> {selectedPassenger?.FirstName} {selectedPassenger?.LastName}
            </p>
            {passengerReserves.map((r, i) => {
              const trip = i === 0 ? initialTrip : returnTrip;
              const pickupAddress = directions.find((d) => d.id === r.PickupLocationId)?.label;
              const dropoffAddress = directions.find((d) => d.id === r.DropoffLocationId)?.label;

              return (
                <div key={i} className="text-sm pt-2 mt-2 border-t first:border-t-0 first:pt-0 first:mt-0">
                  <p className="font-medium mb-1">{i === 0 ? 'Viaje de Ida' : 'Viaje de Vuelta'}</p>
                  {/* <p>{format(new Date(trip!.Date), "EEEE, d 'de' MMMM", { locale: es })}</p> */}
                  <p>
                    <strong>Ruta:</strong> {trip?.DepartureHour} - {trip?.OriginName} → {trip?.DestinationName}
                  </p>
                  <p>
                    <strong>Subida:</strong> {pickupAddress || 'No especificada'}
                  </p>
                  <p>
                    <strong>Bajada:</strong> {dropoffAddress || 'No especificada'}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="rounded-lg border p-4 space-y-4">
            <FormField>
              <Checkbox
                id="payment-enabled"
                checked={reserveForm.data.IsPayment}
                onCheckedChange={(c) => reserveForm.setField('IsPayment', c)}
                disabled={reserveForm.data.ReserveTypeId === 2}
              />
              <Label htmlFor="payment-enabled" className="ml-2 text-sm font-medium">
                Registrar pago con la reserva {reserveForm.data.ReserveTypeId === 2 && '(Obligatorio para ida y vuelta)'}
              </Label>
            </FormField>
            {reserveForm.data.IsPayment && (
              <>
                <div className="flex gap-2 items-end">
                  <FormField label="Método de Pago" className="flex-1">
                    <ApiSelect
                      value={selectedPaymentMethod}
                      onValueChange={setSelectedPaymentMethod}
                      placeholder="Seleccionar..."
                      options={paymentMethods}
                    />
                  </FormField>
                  <FormField label="Monto" className="flex-1">
                    <Input
                      type="number"
                      placeholder={`Saldo: $${getRemainingBalance().toLocaleString()}`}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </FormField>
                  <Button size="icon" onClick={handleAddPayment} disabled={getRemainingBalance() <= 0}>
                    <PlusCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
                {reservationPayments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Pagos Agregados:</Label>
                    <div className="max-h-32 overflow-y-auto border rounded p-2 bg-gray-50 space-y-1">
                      {reservationPayments.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-1 bg-white rounded">
                          <span className="text-sm">
                            {paymentMethods.find((pm) => pm.id === payment.PaymentMethod)?.label}: ${payment.TransactionAmount.toLocaleString()}
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
                    <span className="text-gray-500">Monto total de reserva:</span>
                    <span className="font-medium font-mono">${getTotalReserveAmount().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-blue-100 text-blue-900">
                    <span className="font-bold text-lg">Total a pagar:</span>
                    <span className="font-bold text-xl font-mono">${getTotalPaymentAmount().toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </FormDialog>
    </>
  );
}
