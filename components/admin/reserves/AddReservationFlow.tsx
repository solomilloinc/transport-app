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
import { Calendar } from '@/components/ui/calendar';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { NewClientDialog } from '@/components/admin/reserves/NewClientDialog';

import { ReserveReport, ReserveReportResponse } from '@/interfaces/reserve';
import { Passenger } from '@/interfaces/passengers';
import { Payment } from '@/interfaces/payment';
import { withPriceRetry } from '@/utils/api-errors';
import { getApiErrorMessage, toastMessageFromErrorInfo } from '@/lib/apiErrors';
import { createPassengerReserveAction } from '@/app/admin/reserves/actions';
import { RESERVE_TYPE } from '@/constants/reserveType';
import { shouldUseIdaVueltaTariff } from '@/utils/pricing';
import { buildAdminReservePayloadWithPayments } from '@/utils/bookingPayload';
import type { PassengerBooking } from '@/interfaces/passengerReserve';

import { useFormValidation } from '@/hooks/use-form-validation';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

import { getPassengers } from '@/services/passenger';
import { getReserves, GetReservesParams } from '@/services/reserves';
import { useTrip } from '@/hooks/queries/use-trip';
import { reserveValidationSchema } from '@/validations/reservePassengerSchema';
import { PaginationParams } from '@/services/types';

enum FlowStep {
  SELECT_PASSENGER,
  ADD_DETAILS,
  CONFIRM_PAYMENT,
}

interface ReserveFormState {
  reserveTypeId: 1 | 2;
  pickupLocationId: number;
  dropoffLocationId: number;
  isPayment: boolean;
  paymentMethod: number;
  statusPaymentId: number;
  price: number;
}

const emptyReserveForm: ReserveFormState = {
  reserveTypeId: RESERVE_TYPE.IDA,
  pickupLocationId: 0,
  dropoffLocationId: 0,
  isPayment: true,
  paymentMethod: 1,
  statusPaymentId: 1,
  price: 0,
};

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
  paymentMethods,
}: AddReservationFlowProps) {
  const { toast } = useToast();
  const { businessRules } = useTenant();
  const [step, setStep] = useState<FlowStep | null>(null);

  const reserveForm = useFormValidation<ReserveFormState>(emptyReserveForm, reserveValidationSchema);
  const [passengerSearchQuery, setPassengerSearchQuery] = useState('');
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

  const [month, setMonth] = useState<Date>(new Date());
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTrip, setReturnTrip] = useState<ReserveReport | null>(null);
  const [returnPickupLocationId, setReturnPickupLocationId] = useState<number>(0);

  // Holds the passenger leg(s) ready to send. Built from form state on submit.
  const [bookingPassengers, setBookingPassengers] = useState<PassengerBooking[]>([]);
  const [reservationPayments, setReservationPayments] = useState<Payment[]>([]);

  // Carril 2 (ver docs/adr/0006): el detalle del trip va por React Query.
  // staleTime 0 porque la data es por-reserva y los precios son editables: cada
  // apertura/refetch debe traer lo último (preserva el viejo refetchTrip manual).
  const tripQuery = useTrip(initialTrip?.tripId, initialTrip?.reserveId, {
    enabled: open && !!initialTrip,
    staleTime: 0,
  });
  const tripData = tripQuery.data ?? null;
  const isTripLoading = tripQuery.isFetching;

  // Loaded lazily when a return trip is picked. Used to look up the return
  // trip's per-leg Ida price when the booking downgrades (days differ).
  const returnTripQuery = useTrip(returnTrip?.tripId, returnTrip?.reserveId, {
    enabled: !!returnTrip,
    staleTime: 0,
  });
  const returnTripData = returnTripQuery.data ?? null;
  const [selectedDropoffCityId, setSelectedDropoffCityId] = useState<number | null>(null);

  const isRoundTrip = reserveForm.data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP;

  // Pagador abonado: el cliente del (único) pasajero del flujo viaja sin cobro.
  // Cuando es true ocultamos todo el paso/UI de pagos y mandamos payments: []
  // (el backend ignora payments y deja price 0). Ver CONTEXT.md.
  const isAbonoPayer = selectedPassenger?.hasAbono === true;

  // Decides which dropoff price table to display, accounting for the tenant's
  // same-day rule. Until a return trip is picked, we treat the booking as
  // not-yet-IdaVuelta and fall back to Ida pricing so the user doesn't see a
  // discount that the server will later reject.
  const useIdaVueltaTariff = shouldUseIdaVueltaTariff({
    isRoundTrip,
    outboundDate: initialTrip?.reserveDate ?? null,
    returnDate: returnTrip?.reserveDate ?? null,
    roundTripRequiresSameDay: businessRules.roundTripRequiresSameDay,
  });

  const pickupOptions = useMemo(() => {
    const pickupOrderMap = new Map(
      (tripData?.stopSchedules || []).map((stop) => [stop.directionId, stop.order]),
    );

    const options = tripData?.pickupOptions || [];
    return options
      .filter((opt) => opt && opt.directionId != null)
      .map((opt) => ({
        id: String(opt.directionId),
        value: String(opt.directionId),
        label: opt.displayName || 'Sin nombre',
        sortOrder: pickupOrderMap.get(opt.directionId) ?? Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'es'))
      .map(({ sortOrder: _sortOrder, ...option }) => option);
  }, [tripData]);

  const returnPickupOptions = useMemo(() => {
    const pickupOrderMap = new Map(
      (returnTripData?.stopSchedules || []).map((stop) => [stop.directionId, stop.order]),
    );

    const options = returnTripData?.pickupOptions || [];
    return options
      .filter((opt) => opt && opt.directionId != null)
      .map((opt) => ({
        id: String(opt.directionId),
        value: String(opt.directionId),
        label: opt.displayName || 'Sin nombre',
        sortOrder: pickupOrderMap.get(opt.directionId) ?? Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'es'))
      .map(({ sortOrder: _sortOrder, ...option }) => option);
  }, [returnTripData]);

  const dropoffCityOptions = useMemo(() => {
    const options = useIdaVueltaTariff
      ? tripData?.dropoffOptionsIdaVuelta || []
      : tripData?.dropoffOptionsIda || [];
    return options
      .filter((opt) => opt && opt.cityId != null)
      .map((opt) => ({
        id: String(opt.cityId),
        value: String(opt.cityId),
        label: `${opt.cityName || 'Sin nombre'} - $${(opt.price ?? 0).toLocaleString()}`,
        price: opt.price ?? 0,
        isMainDestination: opt.isMainDestination,
        directions: opt.directions || [],
      }));
  }, [tripData, useIdaVueltaTariff]);

  useEffect(() => {
    if (dropoffCityOptions.length === 0) {
      if (selectedDropoffCityId !== null) {
        setSelectedDropoffCityId(null);
      }
      reserveForm.setField('dropoffLocationId', 0);
      return;
    }

    const currentSelection = selectedDropoffCityId
      ? dropoffCityOptions.find((opt) => opt.id === String(selectedDropoffCityId))
      : null;

    if (currentSelection) {
      reserveForm.setField('price', currentSelection.price);
      return;
    }

    const fallbackOption =
      dropoffCityOptions.find((opt) => opt.isMainDestination) ?? dropoffCityOptions[0];

    if (!fallbackOption) {
      return;
    }

    setSelectedDropoffCityId(Number(fallbackOption.id));
    reserveForm.setField('dropoffLocationId', 0);
    reserveForm.setField('price', fallbackOption.price);
  }, [dropoffCityOptions, selectedDropoffCityId]);

  const dropoffDirectionOptions = useMemo(() => {
    if (!selectedDropoffCityId) return [];

    const dropoffDirectionOrderMap = new Map(
      (tripData?.prices || [])
        .filter(
          (price) =>
            price.cityId === selectedDropoffCityId &&
            price.directionId != null &&
            price.reserveTypeId === RESERVE_TYPE.IDA,
        )
        .map((price) => [price.directionId as number, price.order]),
    );

    const city = dropoffCityOptions.find((opt) => opt.id === String(selectedDropoffCityId));
    if (city?.directions?.length) {
      return city.directions
        .filter((dir) => dir && dir.directionId != null)
        .map((dir) => ({
          id: String(dir.directionId),
          value: String(dir.directionId),
          label: dir.displayName || 'Sin nombre',
          sortOrder: dropoffDirectionOrderMap.get(dir.directionId) ?? Number.MAX_SAFE_INTEGER,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'es'))
        .map(({ sortOrder: _sortOrder, ...option }) => option);
    }
    if (tripData?.relevantCities) {
      const relevantCity = tripData.relevantCities.find(
        (c) => c.cityId?.toString() === String(selectedDropoffCityId),
      );
      if (relevantCity?.directions?.length) {
        return relevantCity.directions
          .map((dir) => ({
            id: String(dir.directionId),
            value: String(dir.directionId),
            label: dir.name || 'Sin nombre',
            sortOrder: dropoffDirectionOrderMap.get(dir.directionId) ?? Number.MAX_SAFE_INTEGER,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, 'es'))
          .map(({ sortOrder: _sortOrder, ...option }) => option);
      }
    }
    return [];
  }, [selectedDropoffCityId, dropoffCityOptions, tripData]);

  const getDefaultDropoffDirectionId = (): number | null => {
    const firstDirection = dropoffDirectionOptions[0];
    if (!firstDirection) return null;

    const directionId = Number(firstDirection.value);
    return Number.isFinite(directionId) && directionId > 0 ? directionId : null;
  };

  // Returns the price currently selected from `dropoffCityOptions`. The shape
  // of that list depends on `useIdaVueltaTariff`:
  // - true  → package price (TOTAL of round-trip, from dropoffOptionsIdaVuelta)
  // - false → outbound's per-leg Ida price (from dropoffOptionsIda)
  const getSelectedDropoffPrice = (): number => {
    if (!selectedDropoffCityId) {
      const mainDest = dropoffCityOptions.find((opt) => opt.isMainDestination);
      return mainDest?.price || 0;
    }
    const selected = dropoffCityOptions.find((opt) => opt.id === String(selectedDropoffCityId));
    return selected?.price || 0;
  };

  // For downgrade (days differ): look up the return trip's per-leg Ida price.
  // Geographically the return's dropoff = the outbound's ORIGIN city (round-trip
  // mirrors endpoints: Lobos → Capital outbound, Capital → Lobos return). The
  // user only picks one city in the admin flow (the outbound dropoff), so we
  // can't reuse `selectedDropoffCityId` here — that's the outbound's destination.
  //
  // Lookup chain (most specific to most permissive):
  //   1) outbound's origin city in return's dropoffOptionsIda
  //   2) return trip's main destination (isMainDestination)
  //   3) any single option if there is only one
  //   4) fall back to the outbound Ida price (assume symmetric pricing)
  const getReturnIdaPrice = (): number => {
    if (!returnTripData) return 0;
    const options = returnTripData.dropoffOptionsIda || [];

    if (initialTrip?.originCityId) {
      const byOrigin = options.find(
        (o) => String(o.cityId) === String(initialTrip.originCityId),
      );
      if (byOrigin?.price) return byOrigin.price;
    }

    const main = options.find((o) => o.isMainDestination);
    if (main?.price) return main.price;

    if (options.length === 1 && options[0].price) return options[0].price;

    // Last-resort fallback: assume the return leg costs the same as the
    // outbound Ida. The server will validate; if it diverges, the user gets
    // the PriceNotAvailable retry flow.
    return getSelectedDropoffPrice();
  };

  // Total to show next to the round-trip summary. Mirrors what the server will
  // charge: package price when IdaVuelta applies, sum of both Ida prices when
  // the booking downgrades because the dates differ.
  const getRoundTripDisplayTotal = (): number => {
    if (useIdaVueltaTariff) return getSelectedDropoffPrice();
    return getSelectedDropoffPrice() + getReturnIdaPrice();
  };

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('1');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('');

  const {
    data: dataPassenger,
    fetch: fetchPassenger,
    reset: resetDataPassenger,
  } = useApi<Passenger, PaginationParams>(getPassengers, { autoFetch: false });
  // Mismo endpoint que el reporte del día: ahora devuelve el wrapper
  // `{ reserves, availableTrips }`. Acá sólo usamos `reserves.items` para el
  // selector de la pata de vuelta; ignoramos `availableTrips` y `hasDeparted`.
  const { data: dataReturnReserves, fetch: fetchReturnReserves } = useApi<ReserveReport, GetReservesParams, ReserveReportResponse>(getReserves, { autoFetch: false });

  // La pata de vuelta es la RUTA INVERSA de la ida: su origen es el destino de la
  // ida y su destino es el origen de la ida (Lobos→Capital ida ⇒ Capital→Lobos
  // vuelta). El reporte del día devuelve TODAS las reservas de la fecha, así que
  // sin este filtro aparecían también las del mismo sentido que la ida. Filtramos
  // por cityId (robusto); si el reporte no trajera cityId, caemos a los nombres.
  const returnTripOptions = useMemo(() => {
    const items = dataReturnReserves?.reserves?.items ?? [];
    if (!initialTrip) return [];
    return items.filter((trip) => {
      if (trip.reserveId === initialTrip.reserveId) return false;
      const haveCityIds =
        trip.originCityId && trip.destinationCityId &&
        initialTrip.originCityId && initialTrip.destinationCityId;
      return haveCityIds
        ? trip.originCityId === initialTrip.destinationCityId &&
            trip.destinationCityId === initialTrip.originCityId
        : trip.originName === initialTrip.destinationName &&
            trip.destinationName === initialTrip.originName;
    });
  }, [dataReturnReserves, initialTrip]);

  // Fuerza traer lo último del trip inicial (precios editables). React Query
  // respeta staleTime:0, así que esto re-fetchea siempre. Se pasa a withPriceRetry
  // para reintentar tras un conflicto de precio.
  const refetchTrip = async () => {
    await tripQuery.refetch();
  };

  // Set initial price from the main destination once the trip (re)loads.
  // El fetch/loading/error los maneja React Query (tripQuery); acá sólo queda
  // el side-effect sobre la data.
  useEffect(() => {
    const mainDest = tripData?.dropoffOptionsIda?.find((opt) => opt.isMainDestination);
    if (mainDest) {
      reserveForm.setField('price', mainDest.price);
    }
  }, [tripData]);

  useEffect(() => {
    if (tripQuery.error) {
      console.error('[AddReservationFlow] Error fetching trip details:', tripQuery.error);
      toast({ title: 'Error', description: getApiErrorMessage(tripQuery.error).message, variant: 'destructive' });
    }
  }, [tripQuery.error]);

  useEffect(() => {
    if (open && initialTrip) {
      setPassengerSearchQuery('');
      resetDataPassenger();
      setStep(FlowStep.SELECT_PASSENGER);
    } else if (!open) {
      resetFlow();
    }
  }, [open, initialTrip]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (passengerSearchQuery.length >= 3) {
        fetchPassenger({ filters: { search: passengerSearchQuery } });
      } else {
        resetDataPassenger();
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [passengerSearchQuery]);

  useEffect(() => {
    setReturnTrip(null);
    setReturnPickupLocationId(0);

    if (returnDate) {
      fetchReturnReserves({ date: format(returnDate, 'yyyyMMdd') });
    }
  }, [returnDate]);

  useEffect(() => {
    if (step === FlowStep.CONFIRM_PAYMENT && reservationPayments.length === 0) {
      setPaymentAmount(getRemainingBalance().toString());
    }
  }, [step, bookingPassengers, reservationPayments, creditAmount]);

  const resetFlow = () => {
    setStep(null);
    reserveForm.resetForm();
    setPassengerSearchQuery('');
    setSelectedPassenger(null);
    setReturnDate(undefined);
    setReturnTrip(null);
    setReturnPickupLocationId(0);
    setBookingPassengers([]);
    setReservationPayments([]);
    setSelectedPaymentMethod('1');
    setPaymentAmount('');
    setCreditAmount('');
    // tripData/returnTripData ya no son estado local: los maneja React Query y
    // se vuelven a evaluar (staleTime:0) al reabrir el diálogo.
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
      if (!data.pickupLocationId || data.pickupLocationId === 0) {
        toast({ title: 'Error', description: 'Por favor, selecciona una dirección de subida.', variant: 'destructive' });
        return;
      }
      if (!selectedDropoffCityId) {
        toast({ title: 'Error', description: 'Por favor, selecciona una ciudad de bajada.', variant: 'destructive' });
        return;
      }
      if (data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP && !returnTrip) {
        toast({ title: 'Error', description: 'Por favor, selecciona un viaje de vuelta.', variant: 'destructive' });
        return;
      }
      if (data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP && !returnPickupLocationId) {
        toast({ title: 'Error', description: 'Por favor, selecciona una direccion de subida para la vuelta.', variant: 'destructive' });
        return;
      }

      const dropoffLocationId = data.dropoffLocationId || getDefaultDropoffDirectionId();
      const isRT = data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP;

      if (isRT && initialTrip!.reserveId === returnTrip!.reserveId) {
        toast({
          title: 'Error',
          description: 'El viaje de ida y vuelta no pueden ser el mismo.',
          variant: 'destructive',
        });
        return;
      }

      // Decide what each leg's price is. The server validates:
      //  - IdaVuelta effective: outbound.price + return.price === packagePrice
      //  - Downgrade (days differ): each leg is validated against ITS trip's Ida
      let outboundLegPrice: number;
      let returnLegPrice: number;

      if (!isRT) {
        outboundLegPrice = getSelectedDropoffPrice();
        returnLegPrice = 0; // unused when there is no return leg
      } else if (useIdaVueltaTariff) {
        // Convención Mayo 2026: el outbound se lleva el precio COMPLETO del
        // package y el return queda en 0. La regla del backend sigue siendo
        // `outbound + return == packagePrice`, pero centralizar el monto en
        // el outbound deja claro a futuros consumers que el ticket de vuelta
        // es parte del bundle, no un cobro separado (se identifica por
        // reserveRelatedId != null && price == 0).
        const pkg = getSelectedDropoffPrice();
        outboundLegPrice = pkg;
        returnLegPrice = 0;
      } else {
        // Downgrade: outbound trip's Ida price + return trip's Ida price for the
        // same dropoff city. Need returnTripData loaded.
        outboundLegPrice = getSelectedDropoffPrice();
        returnLegPrice = getReturnIdaPrice();
        if (returnLegPrice === 0) {
          toast({
            title: 'Error',
            description:
              'No se encontró precio Ida para la ciudad seleccionada en el viaje de vuelta. Probá con otra ciudad o esperá a que cargue.',
            variant: 'destructive',
          });
          return;
        }
      }

      const passenger: PassengerBooking = {
        customerId: selectedPassenger!.customerId,
        isPayment: data.isPayment,
        hasTraveled: false,
        outbound: {
          pickupLocationId: data.pickupLocationId,
          dropoffLocationId,
          price: outboundLegPrice,
        },
        return: isRT
          ? {
              // The pickup is selected from the return trip's own stops.
              pickupLocationId: returnPickupLocationId,
              dropoffLocationId: data.pickupLocationId,
              price: returnLegPrice,
            }
          : null,
      };

      setBookingPassengers([passenger]);
      setReservationPayments([]);
      setSelectedPaymentMethod('1');
      setPaymentAmount('');
      setCreditAmount('');
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

      const methodId = Number(selectedPaymentMethod);
      if (reservationPayments.some((p) => p.paymentMethod === methodId)) {
        toast({
          title: 'Método duplicado',
          description: 'Ya existe un pago con este método. Elimínalo antes de agregar otro.',
          variant: 'destructive',
        });
        return;
      }

      setReservationPayments((prev) => [...prev, { paymentMethod: methodId, transactionAmount: amount }]);
      setSelectedPaymentMethod('1');
      setPaymentAmount('');
    }
  };

  const handleRemovePayment = (index: number) => {
    setReservationPayments((payments) => payments.filter((_, i) => i !== index));
  };

  const getTotalPaymentAmount = () =>
    reservationPayments.reduce((total, payment) => total + payment.transactionAmount, 0);

  const getAppliedCreditAmount = () => Number(creditAmount) || 0;

  // Total of all legs of all passengers. With the new wire shape the discount
  // (when active) is already baked into each leg's `price`, so a straight sum
  // matches what the server expects.
  const getTotalReserveAmount = () =>
    bookingPassengers.reduce(
      (total, p) => total + p.outbound.price + (p.return?.price ?? 0),
      0,
    );

  const getRemainingBalance = () =>
    Math.max(0, getTotalReserveAmount() - getAppliedCreditAmount() - getTotalPaymentAmount());

  const getAvailableCreditAmount = () => {
    const total = getTotalReserveAmount();
    const currentBalance = selectedPassenger?.currentBalance ?? 0;
    return currentBalance < 0 ? Math.min(total, Math.abs(currentBalance)) : 0;
  };

  const handleCreditAmountChange = (value: string) => {
    const numericValue = Number(value);
    if (value !== '' && numericValue < 0) return;

    const maxCredit = Math.min(getAvailableCreditAmount(), getTotalReserveAmount() - getTotalPaymentAmount());
    if (numericValue > maxCredit) {
      setCreditAmount(maxCredit.toString());
      return;
    }

    setCreditAmount(value);
  };

  const finalizeReservation = async () => {
    reserveForm.setIsSubmitting(true);

    let paymentsToSend: Payment[] = [];

    if (reservationPayments.length > 0) {
      const totalPaymentAmount = getTotalPaymentAmount() + getAppliedCreditAmount();
      const totalReserveAmount = getTotalReserveAmount();

      if (totalPaymentAmount > totalReserveAmount) {
        toast({
          title: 'Monto excedido',
          description: `El total de los pagos ($${totalPaymentAmount.toLocaleString()}) supera el total de la reserva ($${totalReserveAmount.toLocaleString()}).`,
          variant: 'destructive',
        });
        reserveForm.setIsSubmitting(false);
        return;
      }
      paymentsToSend = reservationPayments;
    }

    const outboundReserveId = initialTrip!.reserveId;
    const returnReserveId =
      reserveForm.data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP
        ? returnTrip?.reserveId ?? null
        : null;

    const result = await withPriceRetry(
      (payload) => createPassengerReserveAction(payload),
      () =>
        buildAdminReservePayloadWithPayments({
          reserveTypeId: reserveForm.data.reserveTypeId,
          outboundReserveId,
          returnReserveId,
          passengers: bookingPassengers,
          // Abonado: sin cobro. Mandamos payments vacío y sin crédito; el backend
          // ignora payments y deja price 0 (ver CONTEXT.md). No tocamos el price
          // de las patas: lo zera el backend.
          payments: isAbonoPayer
            ? []
            : paymentsToSend.map((p) => ({
                transactionAmount: p.transactionAmount,
                paymentMethod: p.paymentMethod,
              })),
          creditAmount: isAbonoPayer ? 0 : getAppliedCreditAmount(),
        }),
      refetchTrip,
    );

    if (!result.ok) {
      // Wizard multi-step: no hay un form único donde subrayar el campo culpable,
      // así que mostramos los mensajes de validación específicos del backend.
      toast({ title: 'Error', description: toastMessageFromErrorInfo(result), variant: 'destructive' });
      reserveForm.setIsSubmitting(false);
      return;
    }
    if (result.data) {
      toast({ title: 'Reserva creada', description: 'La reserva ha sido creada exitosamente.', variant: 'success' });
      onSuccess();
      resetFlow();
    } else {
      toast({ title: 'Error', description: 'Error al crear la reserva.', variant: 'destructive' });
    }
    reserveForm.setIsSubmitting(false);
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
              {dataPassenger?.items?.map((p) => (
                <div
                  key={p.customerId}
                  className="flex items-center justify-between p-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelectPassenger(p)}
                >
                  <div>
                    <span className="font-medium">
                      {p.lastName} {p.firstName}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">DNI: {p.documentNumber}</span>
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
            <Button onClick={() => setIsNewClientModalOpen(true)}>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NewClientDialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen} onSuccess={handleNewClientSuccess} />

      {/* Step 2: Add Details */}
      <FormDialog
        open={step === FlowStep.ADD_DETAILS}
        onOpenChange={(isOpen) => !isOpen && resetFlow()}
        title="Añadir Pasajero al Viaje"
        description={`Añadiendo a ${selectedPassenger?.firstName} ${selectedPassenger?.lastName}`}
        onSubmit={handleSubmitDetails}
        submitText="Siguiente"
        isLoading={reserveForm.isSubmitting}
        className={reserveForm.data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP ? 'sm:max-w-3xl' : ''}
      >
        <FormField label="Dirección de subida" required error={reserveForm.errors.pickupLocationId}>
          <ApiSelect
            value={String(reserveForm.data.pickupLocationId || '')}
            onValueChange={(v) => reserveForm.setField('pickupLocationId', Number(v))}
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
              reserveForm.setField('dropoffLocationId', 0);
              const selected = dropoffCityOptions.find((opt) => opt.id === v);
              if (selected) {
                reserveForm.setField('price', selected.price);
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
              value={reserveForm.data.dropoffLocationId ? String(reserveForm.data.dropoffLocationId) : ''}
              onValueChange={(v) => reserveForm.setField('dropoffLocationId', v ? Number(v) : 0)}
              placeholder="No seleccionar parada específica"
              options={dropoffDirectionOptions}
            />
          </FormField>
        )}

        {reserveForm.data.reserveTypeId === RESERVE_TYPE.IDA && (
          isAbonoPayer ? (
            <div className="text-right text-sm font-medium text-emerald-700">
              Sin cobro (cliente abonado)
            </div>
          ) : (
            <div className="text-right text-sm font-medium text-blue-600">
              Precio: ${getSelectedDropoffPrice().toLocaleString()}
            </div>
          )
        )}

        <FormField label="Ida y Vuelta">
          <Checkbox
            id="round-trip"
            checked={reserveForm.data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP}
            onCheckedChange={(c) => {
              const newType = c ? RESERVE_TYPE.ROUND_TRIP : RESERVE_TYPE.IDA;
              reserveForm.setField('reserveTypeId', newType);
              setReturnTrip(null);
              setReturnPickupLocationId(0);
              setReturnDate(undefined);

              if (newType === RESERVE_TYPE.ROUND_TRIP) {
                // Same-day discount needs both dates; pre-fill the return-date
                // picker with the outbound date so the discounted table shows.
                const tripDate = new Date(initialTrip!.reserveDate);
                setReturnDate(tripDate);
                setMonth(tripDate);
              }
            }}
          />
          <Label htmlFor="round-trip" className="ml-2 text-sm font-normal">
            Reservar viaje de ida y vuelta
          </Label>
        </FormField>

        {reserveForm.data.reserveTypeId === RESERVE_TYPE.ROUND_TRIP && (
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
              <div className="flex h-full flex-col justify-between gap-4">
                {returnDate && (
                  <div>
                    <Label className="font-medium mb-2 block text-sm">
                      Viajes para {format(returnDate, "d 'de' MMMM", { locale: es })}
                    </Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                      {returnTripOptions.map((trip) => (
                          <button
                            key={trip.reserveId}
                            type="button"
                            className={`flex w-full items-center justify-between rounded-md border p-2 text-left text-sm ${returnTrip?.reserveId === trip.reserveId
                              ? 'border-blue-500 bg-blue-50'
                              : 'hover:bg-gray-50'
                              }`}
                            onClick={() => {
                              setReturnTrip(trip);
                              setReturnPickupLocationId(0);
                            }}
                          >
                            <span className="font-medium">{trip.departureHour}</span>
                            <span className="text-gray-600">
                              {trip.originName} → {trip.destinationName}
                            </span>
                          </button>
                        ))}
                      {returnTripOptions.length === 0 && (
                        <p className="text-center text-sm text-gray-500 p-4">No hay viajes disponibles.</p>
                      )}
                    </div>
                  </div>
                )}
                {returnTrip && (
                  <FormField label="Dirección de subida de vuelta" required>
                    <ApiSelect
                      value={returnPickupLocationId ? String(returnPickupLocationId) : ''}
                      onValueChange={(v) => setReturnPickupLocationId(v ? Number(v) : 0)}
                      placeholder="Seleccionar dirección de subida..."
                      options={returnPickupOptions}
                      loading={returnTripQuery.isFetching}
                      loadingMessage="Cargando paradas..."
                    />
                  </FormField>
                )}
                {returnTrip && (
                  <div className="hidden p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">
                      Vuelta seleccionada: {returnTrip.departureHour} - {returnTrip.originName} → {returnTrip.destinationName}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {returnTrip && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">
                  Vuelta seleccionada: {returnTrip.departureHour} - {returnTrip.originName} → {returnTrip.destinationName}
                </p>
              </div>
            )}
            {isAbonoPayer ? (
              <div className="text-right text-lg font-bold text-emerald-700 pt-2 border-t">
                Sin cobro (cliente abonado)
              </div>
            ) : (
              <div className="text-right text-lg font-bold text-blue-600 pt-2 border-t">
                {useIdaVueltaTariff
                  ? `Total Ida y Vuelta (paquete con descuento): $${getRoundTripDisplayTotal().toLocaleString()}`
                  : `Total Ida y Vuelta (días distintos, sin descuento): $${getRoundTripDisplayTotal().toLocaleString()}`}
              </div>
            )}
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
        disabled={!isAbonoPayer && (getTotalPaymentAmount() + getAppliedCreditAmount()) > getTotalReserveAmount()}
      >
        <div className="space-y-6 py-4">
          <div className="rounded-lg border p-4 bg-gray-50 space-y-4">
            <h3 className="font-semibold">Resumen de la Reserva</h3>
            <p className="text-sm">
              <span className="font-medium">Pasajero:</span> {selectedPassenger?.lastName} {selectedPassenger?.firstName}
            </p>
            {bookingPassengers[0] && (
              <>
                <div className="text-sm pt-2 mt-2 border-t">
                  <p className="font-medium mb-1">Viaje de Ida</p>
                  <p>
                    <strong>Ruta:</strong> {initialTrip?.departureHour} - {initialTrip?.originName} → {initialTrip?.destinationName}
                  </p>
                  <p>
                    <strong>Subida:</strong>{' '}
                    {pickupOptions.find((opt) => opt.id === String(bookingPassengers[0].outbound.pickupLocationId))?.label || 'No especificada'}
                  </p>
                  <p>
                    <strong>Bajada:</strong>{' '}
                    {dropoffCityOptions.find((opt) => opt.id === String(selectedDropoffCityId))?.label?.split(' - ')[0] || 'No especificada'}
                  </p>
                  {!isAbonoPayer && (
                    <p>
                      <strong>Precio:</strong> ${bookingPassengers[0].outbound.price.toLocaleString()}
                    </p>
                  )}
                </div>
                {bookingPassengers[0].return && (
                  <div className="text-sm pt-2 mt-2 border-t">
                    <p className="font-medium mb-1">Viaje de Vuelta</p>
                    <p>
                      <strong>Ruta:</strong> {returnTrip?.departureHour} - {returnTrip?.originName} → {returnTrip?.destinationName}
                    </p>
                    <p>
                      <strong>Subida:</strong>{' '}
                      {returnPickupOptions.find((opt) => opt.id === String(bookingPassengers[0].return?.pickupLocationId))?.label || 'No especificada'}
                    </p>
                    {!isAbonoPayer && (
                      <p>
                        <strong>Precio:</strong>{' '}
                        {bookingPassengers[0].return.price === 0
                          ? // Convención IdaVuelta package: el outbound se lleva el total,
                            // la vuelta va a 0. Evitamos mostrar "$0" sin contexto.
                            <span className="text-muted-foreground">Incluido en el paquete IdaVuelta</span>
                          : `$${bookingPassengers[0].return.price.toLocaleString()}`}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          {isAbonoPayer ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="font-semibold text-emerald-900">Cliente abonado — sin cobro</h3>
              <p className="mt-1 text-sm text-emerald-800">
                Este cliente viaja bajo abono: la reserva se crea sin pagos ni deuda. El viaje queda en $0.
              </p>
            </div>
          ) : (
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
                        {paymentMethods.find((pm) => String(pm.id) === String(payment.paymentMethod))?.label || 'Pago'}: ${payment.transactionAmount.toLocaleString()}
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
              {getAppliedCreditAmount() > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Saldo a favor aplicado:</span>
                  <span className="font-medium text-emerald-700">${getAppliedCreditAmount().toLocaleString()}</span>
                </div>
              )}
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
            {(() => {
              const total = getTotalReserveAmount();
              const paid = getTotalPaymentAmount() + getAppliedCreditAmount();
              if (paid === 0) {
                return (
                  <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm font-medium text-yellow-800">
                    Pendiente
                  </div>
                );
              }
              if (paid < total) {
                return (
                  <div className="rounded-md bg-orange-50 border border-orange-200 p-3 text-sm font-medium text-orange-800">
                    Pago parcial (${paid.toLocaleString()} de ${total.toLocaleString()})
                  </div>
                );
              }
              return (
                <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm font-medium text-green-800">
                  Confirmado
                </div>
              );
            })()}
          </div>
          )}
        </div>
      </FormDialog>
    </>
  );
}
