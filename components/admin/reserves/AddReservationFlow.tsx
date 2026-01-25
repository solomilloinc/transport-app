'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Trip } from '@/interfaces/trip';

import { useFormValidation } from '@/hooks/use-form-validation';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

import { getPassengers } from '@/services/passenger';
import { getReserves } from '@/services/reserves';
import { getTripById } from '@/services/trip';
import { reserveValidationSchema } from '@/validations/reservePassengerSchema';
import { PaginationParams } from '@/services/types';

enum FlowStep {
  SELECT_PASSENGER,
  ADD_DETAILS,
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

  // Trip data state - enriched with pickup/dropoff options from API
  const [tripData, setTripData] = useState<Trip | null>(null);
  const [isTripLoading, setIsTripLoading] = useState(false);

  // Selected dropoff city (to show directions if available)
  const [selectedDropoffCityId, setSelectedDropoffCityId] = useState<number | null>(null);

  // Pickup options from Trip API (ready to use)
  const pickupOptions = useMemo(() => {
    const options = tripData?.PickupOptions || (tripData as any)?.pickupOptions || [];
    return options
      .filter((opt: any) => opt && (opt.directionId != null || opt.DirectionId != null))
      .map((opt: any) => ({
        id: String(opt.directionId || opt.DirectionId),
        value: String(opt.directionId || opt.DirectionId),
        label: opt.displayName || opt.DisplayName || 'Sin nombre'
      }));
  }, [tripData]);

  // Dropoff CITY options based on reserve type
  // Ida = DropoffOptionsIda, IdaVuelta = DropoffOptionsIdaVuelta
  const dropoffCityOptions = useMemo(() => {
    const isRoundTrip = reserveForm.data.ReserveTypeId === 2;
    const options = isRoundTrip
      ? (tripData?.DropoffOptionsIdaVuelta || (tripData as any)?.dropoffOptionsIdaVuelta || [])
      : (tripData?.DropoffOptionsIda || (tripData as any)?.dropoffOptionsIda || []);
    return options
      .filter((opt: any) => opt && (opt.cityId != null || opt.CityId != null))
      .map((opt: any) => ({
        id: String(opt.cityId || opt.CityId),
        value: String(opt.cityId || opt.CityId),
        label: `${opt.cityName || opt.CityName || 'Sin nombre'} - $${(opt.price ?? opt.Price ?? 0).toLocaleString()}`,
        price: opt.price ?? opt.Price ?? 0,
        isMainDestination: opt.isMainDestination ?? opt.IsMainDestination,
        directions: opt.directions || opt.Directions || []
      }));
  }, [tripData, reserveForm.data.ReserveTypeId]);

  // Get directions for selected dropoff city
  const dropoffDirectionOptions = useMemo(() => {
    if (!selectedDropoffCityId) return [];
    const city = dropoffCityOptions.find((opt: any) => opt.id === String(selectedDropoffCityId));
    if (!city?.directions?.length) return [];
    return city.directions
      .filter((dir: any) => dir && (dir.directionId != null || dir.DirectionId != null))
      .map((dir: any) => ({
        id: String(dir.directionId || dir.DirectionId),
        value: String(dir.directionId || dir.DirectionId),
        label: dir.displayName || dir.DisplayName || 'Sin nombre'
      }));
  }, [selectedDropoffCityId, dropoffCityOptions]);

  // Get price for selected dropoff city
  const getSelectedDropoffPrice = () => {
    if (!selectedDropoffCityId) {
      // Return main destination price if nothing selected
      const mainDest = dropoffCityOptions.find((opt: any) => opt.isMainDestination);
      return mainDest?.price || 0;
    }
    const selected = dropoffCityOptions.find((opt: any) => opt.id === String(selectedDropoffCityId));
    return selected?.price || 0;
  };

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

  // Effect to fetch trip details when dialog opens
  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!initialTrip?.TripId) return;

      console.log('[AddReservationFlow] Fetching trip details for TripId:', initialTrip.TripId, 'ReserveId:', initialTrip.ReserveId);
      setIsTripLoading(true);
      try {
        const data = await getTripById(initialTrip.TripId, initialTrip.ReserveId);
        console.log('[AddReservationFlow] Trip data received:', data);
        setTripData(data);

        // Auto-select main destination price
        const dropoffIda = data?.DropoffOptionsIda || [];
        const mainDest = dropoffIda.find((opt: any) => opt.IsMainDestination);
        if (mainDest) {
          reserveForm.setField('DropoffLocationId', mainDest.TripPriceId);
          reserveForm.setField('Price', mainDest.Price);
        }
      } catch (error) {
        console.error('[AddReservationFlow] Error fetching trip details:', error);
        toast({ title: 'Error', description: 'Error al cargar los precios del viaje', variant: 'destructive' });
      } finally {
        setIsTripLoading(false);
      }
    };

    if (open && initialTrip) {
      fetchTripDetails();
    }
  }, [open, initialTrip?.TripId]);

  // Effect to start the flow
  useEffect(() => {
    if (open && initialTrip) {
      setStep(FlowStep.SELECT_PASSENGER);
    } else if (!open) {
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
    setTripData(null);
    setSelectedDropoffCityId(null);
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
      // Validate pickup location
      if (!data.PickupLocationId || data.PickupLocationId === 0) {
        toast({ title: 'Error', description: 'Por favor, selecciona una dirección de subida.', variant: 'destructive' });
        return;
      }

      // Validate dropoff city is selected
      if (!selectedDropoffCityId) {
        toast({ title: 'Error', description: 'Por favor, selecciona una ciudad de bajada.', variant: 'destructive' });
        return;
      }

      // Validate return trip if IdaVuelta
      if (data.ReserveTypeId === 2 && !returnTrip) {
        toast({ title: 'Error', description: 'Por favor, selecciona un viaje de vuelta.', variant: 'destructive' });
        return;
      }

      // Use direction if selected, otherwise use city ID as fallback
      const dropoffLocationId = data.DropoffLocationId || selectedDropoffCityId;

      // Get the outbound ReserveId from initialTrip
      const outboundReserveId = initialTrip!.ReserveId;

      const reserveData: PassengerReserveCreate = {
        ...data,
        ReserveId: outboundReserveId,
        CustomerId: selectedPassenger!.CustomerId,
        DropoffLocationId: dropoffLocationId,
        Price: getSelectedDropoffPrice(),
      };

      console.log('[handleSubmitDetails] Outbound ReserveId:', outboundReserveId);
      console.log('[handleSubmitDetails] Reserve data:', reserveData);

      if (data.ReserveTypeId === 2) {
        // Round trip - create both reserves
        reserveForm.setField('IsPayment', true);

        // Get the return ReserveId from returnTrip
        const returnReserveId = returnTrip!.ReserveId;

        console.log('[handleSubmitDetails] Return ReserveId:', returnReserveId);

        if (outboundReserveId === returnReserveId) {
          console.warn('[handleSubmitDetails] Outbound and Return ReserveId are the same - blocking submission');
          toast({
            title: 'Error',
            description: 'El viaje de ida y vuelta no pueden ser el mismo. Por favor selecciona un viaje de vuelta diferente.',
            variant: 'destructive'
          });
          return;
        }

        // Both items use the same price (IdaVuelta price from selected dropoff city)
        const idaVueltaPrice = getSelectedDropoffPrice();

        const returnReserveData: PassengerReserveCreate = {
          ...data,
          ReserveId: returnReserveId,
          CustomerId: selectedPassenger!.CustomerId,
          PickupLocationId: dropoffLocationId, // Pickup en vuelta = dropoff de ida
          DropoffLocationId: data.PickupLocationId, // Dropoff en vuelta = pickup de ida
          Price: idaVueltaPrice, // Same price as outbound
        };

        console.log('[handleSubmitDetails] Return reserve data:', returnReserveData);
        setPassengerReserves([reserveData, returnReserveData]);
      } else {
        // One way
        setPassengerReserves([reserveData]);
      }

      // Go directly to payment
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
    // Para IdaVuelta, el precio ya incluye ambos viajes (no sumar)
    // Solo tomar el precio del primer item
    if (passengerReserves.length === 0) return 0;
    return passengerReserves[0].Price;
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
        className={reserveForm.data.ReserveTypeId === 2 ? "sm:max-w-3xl" : ""}
      >
        <FormField label="Dirección de subida" required error={reserveForm.errors.PickupLocationId}>
          <ApiSelect
            value={String(reserveForm.data.PickupLocationId || '')}
            onValueChange={(v) => reserveForm.setField('PickupLocationId', Number(v))}
            placeholder="Seleccionar..."
            options={pickupOptions}
            loading={isTripLoading}
            loadingMessage="Cargando opciones..."
          />
        </FormField>

        <FormField label="Ciudad de bajada" required>
          <ApiSelect
            value={selectedDropoffCityId ? String(selectedDropoffCityId) : ''}
            onValueChange={(v) => {
              const cityId = Number(v);
              setSelectedDropoffCityId(cityId);
              // Reset direction when city changes
              reserveForm.setField('DropoffLocationId', 0);
              // Update price from selected city
              const selected = dropoffCityOptions.find((opt: any) => opt.id === v);
              if (selected) {
                reserveForm.setField('Price', selected.price);
              }
            }}
            placeholder="Seleccionar ciudad..."
            options={dropoffCityOptions}
            loading={isTripLoading}
            loadingMessage="Cargando ciudades..."
          />
        </FormField>

        {dropoffDirectionOptions.length > 0 && (
          <FormField label="Parada específica (opcional)">
            <ApiSelect
              value={String(reserveForm.data.DropoffLocationId || '')}
              onValueChange={(v) => reserveForm.setField('DropoffLocationId', Number(v))}
              placeholder="Seleccionar parada..."
              options={dropoffDirectionOptions}
            />
          </FormField>
        )}

        {/* Helper to show current price - only show for Ida (one-way) */}
        {reserveForm.data.ReserveTypeId === 1 && (
          <div className="text-right text-sm font-medium text-blue-600">
            Precio: ${getSelectedDropoffPrice().toLocaleString()}
          </div>
        )}

        <FormField label="Ida y Vuelta">
          <Checkbox
            id="round-trip"
            checked={reserveForm.data.ReserveTypeId === 2}
            onCheckedChange={(c) => {
              const newType = c ? 2 : 1;
              reserveForm.setField('ReserveTypeId', newType);
              // Reset dropoff selections when type changes
              setSelectedDropoffCityId(null);
              reserveForm.setField('DropoffLocationId', 0);
              // Reset return trip selection
              setReturnTrip(null);
              setReturnDate(undefined);

              // Auto-select city if IdaVuelta has only one option
              if (newType === 2) {
                const idaVueltaOptions = tripData?.DropoffOptionsIdaVuelta || (tripData as any)?.dropoffOptionsIdaVuelta || [];
                if (idaVueltaOptions.length === 1) {
                  const opt = idaVueltaOptions[0];
                  const cityId = opt.cityId || opt.CityId;
                  setSelectedDropoffCityId(cityId);
                  reserveForm.setField('Price', opt.price ?? opt.Price ?? 0);
                }
                // Set initial return date to trip date
                const tripDate = new Date(initialTrip!.ReserveDate);
                setReturnDate(tripDate);
                setMonth(tripDate);
              }
            }}
          />
          <Label htmlFor="round-trip" className="ml-2 text-sm font-normal">
            Reservar viaje de ida y vuelta
          </Label>
        </FormField>

        {/* Return trip selection - shown when IdaVuelta is checked */}
        {reserveForm.data.ReserveTypeId === 2 && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <h4 className="font-medium text-blue-600">Viaje de Vuelta</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="font-medium mb-2 block text-sm">Fecha de vuelta</Label>
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={setReturnDate}
                  month={month}
                  onMonthChange={setMonth}
                  locale={es}
                  fromMonth={new Date()}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-4">
                {returnDate && (
                  <div>
                    <Label className="font-medium mb-2 block text-sm">
                      Viajes para {format(returnDate, "d 'de' MMMM", { locale: es })}
                    </Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                      {dataReturnReserves?.Items
                        ?.filter((trip) => trip.ReserveId !== initialTrip?.ReserveId)
                        .map((trip) => (
                          <button
                            key={trip.ReserveId}
                            type="button"
                            className={`flex w-full items-center justify-between rounded-md border p-2 text-left text-sm ${returnTrip?.ReserveId === trip.ReserveId
                              ? 'border-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                              }`}
                            onClick={() => setReturnTrip(trip)}
                          >
                            <span className="font-medium">{trip.DepartureHour}</span>
                            <span className="text-gray-600">
                              {trip.OriginName} → {trip.DestinationName}
                            </span>
                          </button>
                        ))}
                      {dataReturnReserves?.Items?.filter((trip) => trip.ReserveId !== initialTrip?.ReserveId).length === 0 && (
                        <p className="text-center text-sm text-gray-500 p-4">No hay viajes disponibles.</p>
                      )}
                    </div>
                  </div>
                )}
                {returnTrip && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">
                      Vuelta seleccionada: {returnTrip.DepartureHour} - {returnTrip.OriginName} → {returnTrip.DestinationName}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {/* Total price for round trip (price already includes both legs) */}
            <div className="text-right text-lg font-bold text-blue-600 pt-2 border-t">
              Total Ida y Vuelta: ${getSelectedDropoffPrice().toLocaleString()}
            </div>
          </div>
        )}
      </FormDialog>

      {/* Step 3: Confirm and Pay */}
      <FormDialog
        open={step === FlowStep.CONFIRM_PAYMENT}
        onOpenChange={(isOpen) => !isOpen && resetFlow()}
        title="Confirmar y Pagar"
        description="Revisa los detalles y añade el pago."
        onSubmit={finalizeReservation}
        submitText="Confirmar Reserva"
        isLoading={reserveForm.isSubmitting}
        disabled={reserveForm.data.IsPayment && Math.abs(getTotalPaymentAmount() - getTotalReserveAmount()) > 1}
      >
        <div className="space-y-6 py-4">
          <div className="rounded-lg border p-4 bg-gray-50 space-y-4">
            <h3 className="font-semibold">Resumen de la Reserva</h3>
            <p className="text-sm">
              <span className="font-medium">Pasajero:</span> {selectedPassenger?.FirstName} {selectedPassenger?.LastName}
            </p>
            {passengerReserves.map((r, i) => {
              const trip = i === 0 ? initialTrip : returnTrip;

              // For outbound: pickup from options, dropoff from city/direction
              // For return: pickup = outbound dropoff, dropoff = outbound pickup (swapped)
              const pickupLabel = i === 0
                ? pickupOptions.find((opt: any) => opt.id === String(r.PickupLocationId))?.label
                : dropoffCityOptions.find((opt: any) => opt.id === String(selectedDropoffCityId))?.label?.split(' - ')[0];

              const dropoffLabel = i === 0
                ? dropoffCityOptions.find((opt: any) => opt.id === String(selectedDropoffCityId))?.label?.split(' - ')[0]
                : pickupOptions.find((opt: any) => opt.id === String(r.DropoffLocationId))?.label;

              return (
                <div key={i} className="text-sm pt-2 mt-2 border-t first:border-t-0 first:pt-0 first:mt-0">
                  <p className="font-medium mb-1">{i === 0 ? 'Viaje de Ida' : 'Viaje de Vuelta'}</p>
                  <p>
                    <strong>Ruta:</strong> {trip?.DepartureHour} - {trip?.OriginName} → {trip?.DestinationName}
                  </p>
                  <p>
                    <strong>Subida:</strong> {pickupLabel || 'No especificada'}
                  </p>
                  <p>
                    <strong>Bajada:</strong> {dropoffLabel || 'No especificada'}
                  </p>
                  <p>
                    <strong>Precio:</strong> ${r.Price?.toLocaleString() || 0}
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
                            {paymentMethods.find((pm) => String(pm.id) === String(payment.PaymentMethod))?.label || 'Pago'}: ${payment.TransactionAmount.toLocaleString()}
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
                    <span className="font-medium">${getTotalReserveAmount().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-blue-100 text-blue-900">
                    <span className="font-bold text-lg">Total a pagar:</span>
                    <span className="font-bold text-xl">${getTotalPaymentAmount().toLocaleString()}</span>
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
