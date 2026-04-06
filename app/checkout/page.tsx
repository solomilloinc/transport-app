'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft, ArrowRight, Calendar, Clock, Bus, Users, CreditCard, Shield, MapPin,
} from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatWithTimezone } from '@/utils/dates';
import { useCheckout } from '@/contexts/CheckoutContext';
import { lockReserveSlots } from '@/services/locks';
import { LockTimer } from '@/components/LockTimer';
import { PassengerForm } from '@/components/passenger-form';
import CardPaymentForm from '@/components/card-payment-form';
import WalletPaymentForm from '@/components/wallet-payment-form';
import { post } from '@/services/api';
import { CreateReserveExternalResult } from '@/interfaces/reserve';
import { LocationSelector, LocationSelectionData } from '@/components/checkout/LocationSelector';
import { useTenant } from '@/contexts/TenantContext';
import {
  buildReservePayloadItems,
  CheckoutPassengerData,
  CheckoutStep,
  clearCheckoutDraftFromStorage,
  getEffectiveTripPrice,
  loadCheckoutDraftFromStorage,
  saveCheckoutDraftToStorage,
  validatePassengerData,
} from '@/utils/checkout';

export default function CheckoutPage() {
  const router = useRouter();
  const { checkout, setLockState, isLockValid, isHydrated } = useCheckout();
  const { identity, legal } = useTenant();

  // If there's no outbound trip, there's nothing to check out. Redirect to home.
  useEffect(() => {
    if (isHydrated && !checkout.outboundTrip) {
      router.replace('/');
    }
  }, [checkout.outboundTrip, isHydrated, router]);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('passengers');
  const [passengerData, setPassengerData] = useState<CheckoutPassengerData[]>(() =>
    Array(checkout.passengers || 1).fill(0).map(() => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      documentNumber: '',
      specialRequests: '',
    })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [lockError, setLockError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const [formattedDepartureDate, setFormattedDepartureDate] = useState('');
  const [formattedReturnDate, setFormattedReturnDate] = useState('');

  // Location selection state
  const [outboundLocation, setOutboundLocation] = useState<LocationSelectionData>({
    pickupDirectionId: null,
    dropoffCityId: null,
    dropoffCityName: null,
    dropoffDirectionId: null,
    dropoffPrice: 0,
  });
  const [returnLocation, setReturnLocation] = useState<LocationSelectionData>({
    pickupDirectionId: null,
    dropoffCityId: null,
    dropoffCityName: null,
    dropoffDirectionId: null,
    dropoffPrice: 0,
  });

  // Check if it's a round trip
  const isRoundTrip = !!checkout.returnTrip;

  useEffect(() => {
    if (checkout.outboundTrip) {
      setFormattedDepartureDate(formatWithTimezone(checkout.outboundTrip.DepartureDate ?? ''));
    }
    if (checkout.returnTrip) {
      setFormattedReturnDate(formatWithTimezone(checkout.returnTrip.DepartureDate ?? ''));
    }
  }, [checkout.outboundTrip, checkout.returnTrip]);

  useEffect(() => {
    if (!isHydrated || !checkout.outboundTrip || draftHydrated) {
      return;
    }

    const draft = loadCheckoutDraftFromStorage();
    if (
      draft &&
      draft.outboundReserveId === checkout.outboundTrip.ReserveId &&
      draft.returnReserveId === (checkout.returnTrip?.ReserveId ?? null)
    ) {
      setCurrentStep(draft.currentStep);
      setPassengerData(draft.passengerData);
      setPaymentMethod(draft.paymentMethod);
      setOutboundLocation(draft.outboundLocation);
      setReturnLocation(draft.returnLocation);
    }

    setDraftHydrated(true);
  }, [checkout.outboundTrip, draftHydrated, isHydrated]);

  useEffect(() => {
    if (!draftHydrated || !checkout.outboundTrip) {
      return;
    }

    saveCheckoutDraftToStorage({
      outboundReserveId: checkout.outboundTrip.ReserveId,
      returnReserveId: checkout.returnTrip?.ReserveId ?? null,
      currentStep,
      passengerData,
      paymentMethod,
      outboundLocation,
      returnLocation,
    });
  }, [
    checkout.outboundTrip,
    currentStep,
    draftHydrated,
    outboundLocation,
    passengerData,
    paymentMethod,
    returnLocation,
  ]);

  // Use dynamic dropoff price if selected, otherwise use default trip price
  const outboundPrice = getEffectiveTripPrice(outboundLocation.dropoffPrice, checkout.outboundTrip?.Price || 0);
  const returnPrice = getEffectiveTripPrice(returnLocation.dropoffPrice, checkout.returnTrip?.Price || 0);
  const totalPrice = (outboundPrice + returnPrice) * checkout.passengers;
  const serviceFee = 0;
  const finalTotal = useMemo(() => totalPrice + serviceFee, [totalPrice, serviceFee]);

  const reserveItems = useMemo(() => {
    if (!checkout.outboundTrip) return [];

    return buildReservePayloadItems({
      passengers: passengerData,
      outboundTrip: checkout.outboundTrip,
      returnTrip: checkout.returnTrip,
      outboundLocation,
      returnLocation,
      outboundPrice,
      returnPrice,
    });
  }, [
    checkout.outboundTrip,
    checkout.returnTrip,
    outboundLocation,
    outboundPrice,
    passengerData,
    returnLocation,
    returnPrice,
  ]);

  const handlePassengerDataChange = (data: CheckoutPassengerData[]) => {
    if (JSON.stringify(data) !== JSON.stringify(passengerData)) {
      setPassengerData(data);
      if (validationError) {
        setValidationError(null);
      }
    }
  };

  const validateCurrentCheckout = () => {
    const passengerValidationError = validatePassengerData(passengerData, checkout.passengers);
    if (passengerValidationError) {
      setValidationError(passengerValidationError);
      return false;
    }

    setValidationError(null);
    return true;
  };

  // Función para bloquear slots
  const lockSlots = async (): Promise<boolean> => {
    try {
      setLockError(null);
      const lockResponse = await lockReserveSlots({
        outboundReserveId: checkout.outboundTrip?.ReserveId || 0,
        returnReserveId: checkout.returnTrip?.ReserveId || null,
        passengerCount: checkout.passengers,
      });

      const lockState = {
        lockToken: lockResponse.LockToken,
        expiresAt: lockResponse.ExpiresAt,
        timeoutMinutes: lockResponse.TimeoutMinutes,
      };

      setLockState(lockState);
      return true;
    } catch {
      setLockError('No se pudieron reservar los asientos. Intente nuevamente.');
      return false;
    }
  };

  const goToNextStep = async () => {
    if (currentStep === 'passengers') {
      if (!validateCurrentCheckout()) {
        return;
      }
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      // Verificar si tenemos un lock válido
      if (checkout.lockState && isLockValid()) {
        setCurrentStep('payment');
      } else {
        // Lock slots antes de proceder al pago
        const success = await lockSlots();
        if (success) {
          setCurrentStep('payment');
        }
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 'review') setCurrentStep('passengers');
    else if (currentStep === 'payment') setCurrentStep('review');
  };

  const isCurrentStepComplete = () => {
    if (currentStep === 'passengers') {
      return !validatePassengerData(passengerData, checkout.passengers);
    }
    return true;
  };

  // Procesar el pago con Wallet - devuelve preference_id para MP
  const handleWalletSubmit = useCallback(async (data: {
    payload: {
      Payment: null;
      Items: Array<any>;
    };
  }): Promise<string> => {
    if (!finalTotal || finalTotal <= 0) {
      throw new Error('El total debe ser mayor a 0.');
    }

    if (!checkout.lockState?.lockToken || !isLockValid()) {
      throw new Error('No hay una reserva válida. Por favor, inicie el proceso nuevamente.');
    }

      const payloadWithLock = {
        lockToken: checkout.lockState.lockToken,
        items: reserveItems,
        payment: null,
      };

    const response = await post('/passenger-reserves-create-with-lock', payloadWithLock);
    const responseData = typeof response === 'string' ? JSON.parse(response) : response;

    // La API debe devolver PreferenceId cuando Payment es null
    if (!responseData.PreferenceId) {
      throw new Error('No se recibió PreferenceId del servidor');
    }

    // Devolver el PreferenceId para que MP abra el wallet
    return responseData.PreferenceId;
  }, [checkout.lockState, finalTotal, isLockValid, reserveItems]);

  // Procesar el pago con tarjeta (el Brick llama esto y espera una Promise)
  const handleCardSubmit = async (data: {
    amount: number;
    email: string;
    installments: number;
    token: string;
    identification?: { type?: string; number?: string };
    paymentMethodId: string
  }) => {
    setIsSubmitting(true);
    try {
      if (!finalTotal || finalTotal <= 0) {
        throw new Error('El total debe ser mayor a 0.');
      }

      if (!checkout.lockState?.lockToken || !isLockValid()) {
        throw new Error('No hay una reserva válida. Por favor, inicie el proceso nuevamente.');
      }

      const compraDescripcion = checkout.returnTrip ? 'Pasaje ida y vuelta' : 'Pasaje de ida';

      const payload = {
        lockToken: checkout.lockState.lockToken,
        items: reserveItems,
        payment: {
          transactionAmount: Number(finalTotal.toFixed(2)),
          token: data.token,
          description: compraDescripcion,
          installments: data.installments,
          paymentMethodId: data.paymentMethodId,
          payerEmail: data.email,
          identificationType: data?.identification?.type,
          identificationNumber: data?.identification?.number,
        },
      };

      const response = await post('/passenger-reserves-create-with-lock', payload);
      const responseData: CreateReserveExternalResult =
        typeof response === 'string' ? JSON.parse(response) : response;

      if (responseData.Status === 'approved') {
        const reserveId = checkout.outboundTrip?.ReserveId;
        clearCheckoutDraftFromStorage();
        router.push(`/booking-confirmation?success=true&reserveId=${reserveId}`);
      } else {
        router.push(`/booking-confirmation?status=${encodeURIComponent(responseData.Status || 'unknown')}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If there's no trip, don't render the checkout form to prevent errors while redirecting
  if (!isHydrated || !checkout.outboundTrip) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.28),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_48%,#f8fbff_100%)]">
      <Navbar />
      <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="link"
            onClick={() => router.back()}
            className="inline-flex h-auto items-center p-0 text-sm text-slate-600 hover:text-blue-700 sm:text-base"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative w-full rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(244,249,255,0.98))] p-4 shadow-[0_22px_52px_rgba(15,23,42,0.08)] sm:p-6">

              {/* Overlay de loading durante el pago */}
              {isSubmitting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[2rem] bg-white/60 backdrop-blur-[1px]">
                  <span className="text-sm text-gray-700">Procesando pago…</span>
                </div>
              )}

              <div className="mb-6 border-b border-sky-100 pb-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">checkout protegido</p>
                <h1 className="mt-2 text-2xl font-display text-slate-900 sm:text-3xl">Completa tu reserva</h1>
              </div>

              {/* Timer Component - Aislado para evitar re-renders */}
              <LockTimer
                lockToken={checkout.lockState?.lockToken}
                expiresAt={checkout.lockState?.expiresAt}
                onExpire={() => {
                  // No limpiar inmediatamente para permitir mostrar el mensaje de expiración
                  
                }}
                onRestart={() => {
                  setLockState(null);
                  setCurrentStep('passengers');
                  setLockError(null);
                }}
              />

              {/* Lock Error Display */}
              {lockError && (
                <div className="mb-4 rounded-[1.25rem] border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center">
                    <div className="text-sm text-red-600">{lockError}</div>
                  </div>
                </div>
              )}

              {validationError && (
                <div className="mb-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center">
                    <div className="text-sm text-amber-700">{validationError}</div>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="mb-8 rounded-[1.5rem] border border-sky-100 bg-sky-50/60 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex flex-col items-center ${currentStep === 'passengers' ? 'text-slate-900' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'passengers' ? 'bg-blue-700 text-white'
                      : currentStep === 'payment' || currentStep === 'review' ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                      }`}>
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Pasajeros</span>
                  </div>

                  <div className="mx-2 h-1 flex-1 bg-sky-100">
                    <div className={`h-full bg-blue-600 ${currentStep !== 'passengers' ? 'w-full' : 'w-0'}`} />
                  </div>

                  <div className={`flex flex-col items-center ${currentStep === 'review' ? 'text-slate-900' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'review' ? 'bg-blue-700 text-white'
                      : currentStep === 'payment' ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                      }`}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Revisar</span>
                  </div>

                  <div className="mx-2 h-1 flex-1 bg-sky-100">
                    <div className={`h-full bg-blue-600 ${currentStep === 'payment' ? 'w-full' : 'w-0'}`} />
                  </div>

                  <div className={`flex flex-col items-center ${currentStep === 'payment' ? 'text-slate-900' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep === 'payment' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Pago</span>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div>
                {currentStep === 'passengers' && (
                  <div className="space-y-8">
                    {/* Passenger Information */}
                    <div>
                      <h2 className="mb-4 text-lg font-display font-medium text-slate-900 sm:text-xl">Informacion de los pasajeros</h2>
                      <p className="mb-6 text-sm text-gray-600 sm:text-base">Ingresa los datos de cada pasajero tal como deben figurar en la reserva.</p>
                      <PassengerForm
                        passengerCount={checkout.passengers}
                        onDataChange={handlePassengerDataChange}
                        initialData={passengerData}
                      />
                    </div>

                    {/* Location Selection - Outbound */}
                    {checkout.outboundTrip?.TripId && checkout.outboundTrip?.ReserveId && (
                      <div className="border-t border-sky-100 pt-6">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-display font-medium text-slate-900 sm:text-xl">
                          <MapPin className="h-5 w-5" />
                          Puntos de subida y bajada - ida
                        </h2>
                        <p className="text-gray-600 mb-4 text-sm sm:text-base">
                          Seleccione dónde desea subir y bajar del vehículo.
                        </p>
                        <LocationSelector
                          tripId={checkout.outboundTrip.TripId}
                          reserveId={checkout.outboundTrip.ReserveId}
                          isRoundTrip={isRoundTrip}
                          onSelectionChange={setOutboundLocation}
                          initialData={outboundLocation}
                          departureHour={checkout.outboundTrip.DepartureHour}
                        />
                      </div>
                    )}

                    {/* Location Selection - Return (only for round trips) */}
                    {isRoundTrip && checkout.returnTrip?.TripId && (
                      <div className="border-t border-sky-100 pt-6">
                        <h2 className="mb-4 flex items-center gap-2 text-lg font-display font-medium text-slate-900 sm:text-xl">
                          <MapPin className="h-5 w-5" />
                          Puntos de subida y bajada - vuelta
                        </h2>
                        <p className="text-gray-600 mb-4 text-sm sm:text-base">
                          Seleccione dónde desea subir y bajar en el viaje de vuelta.
                        </p>
                        <LocationSelector
                          tripId={checkout.returnTrip.TripId}
                          reserveId={checkout.returnTrip.ReserveId}
                          isRoundTrip={isRoundTrip}
                          onSelectionChange={setReturnLocation}
                          initialData={returnLocation}
                          departureHour={checkout.returnTrip?.DepartureHour}
                        />
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 'review' && (
                  <div>
                    <h2 className="mb-4 text-lg font-display font-medium text-slate-900 sm:text-xl">Revisa tu reserva</h2>
                    <p className="mb-6 text-sm text-gray-600 sm:text-base">
                      Revisa los detalles del viaje y el total antes de pasar al pago.
                    </p>

                    <div className="space-y-6">
                      {/* Ida */}
                      <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50/55 p-4">
                        <h3 className="mb-2 font-medium text-slate-900">Detalle del viaje de ida</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-600">Ruta:</div>
                          <div className="font-medium flex items-center">
                            {checkout.outboundTrip?.OriginName}
                            <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                            {checkout.outboundTrip?.DestinationName}
                          </div>
                          {!isRoundTrip && outboundLocation.dropoffCityName &&
                           outboundLocation.dropoffCityName !== checkout.outboundTrip?.DestinationName && (
                            <>
                              <div className="text-gray-600">Bajada:</div>
                              <div className="font-medium text-amber-600">{outboundLocation.dropoffCityName}</div>
                            </>
                          )}
                          <div className="text-gray-600">Fecha:</div>
                          <div className="font-medium">{formattedDepartureDate}</div>
                          <div className="text-gray-600">Hora de Salida:</div>
                          <div className="font-medium">{checkout.outboundTrip?.DepartureHour}</div>
                        </div>
                      </div>

                      {/* Vuelta */}
                      {checkout.returnTrip && (
                        <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50/55 p-4">
                          <h3 className="mb-2 font-medium text-slate-900">Detalle del viaje de vuelta</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-600">Ruta:</div>
                            <div className="font-medium flex items-center">
                              {checkout.returnTrip?.OriginName}
                              <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                              {checkout.returnTrip?.DestinationName}
                            </div>
                            <div className="text-gray-600">Fecha:</div>
                            <div className="font-medium">{formattedReturnDate}</div>
                            <div className="text-gray-600">Hora de Salida:</div>
                            <div className="font-medium">{checkout.returnTrip?.DepartureHour}</div>
                          </div>
                        </div>
                      )}

                      {/* Pasajeros */}
                      <div>
                        <h3 className="mb-2 font-medium text-slate-900">Informacion de pasajeros</h3>
                        <div className="space-y-3">
                          {passengerData.map((p, idx) => (
                            <div key={idx} className="rounded-[1.1rem] border border-sky-100 bg-white p-3 text-sm shadow-sm">
                              <div className="font-medium">
                                Pasajero {idx + 1}: {p.firstName} {p.lastName}
                              </div>
                              {p.email && <div className="text-gray-600">{p.email}</div>}
                              {p.specialRequests && (
                                <div className="text-gray-600 mt-1">
                                  <span className="font-medium">Solicitudes Especiales:</span> {p.specialRequests}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Términos */}
                      <div className="rounded-[1.25rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.95),rgba(219,234,254,0.88))] p-4 text-sm">
                        <h3 className="mb-2 font-medium text-blue-800">Terminos y condiciones</h3>
                        <p className="mb-2 text-slate-700">
                          {legal.termsText.replace('los términos y condiciones', `los términos y condiciones de ${identity.companyName}`)}
                        </p>
                        <p className="text-slate-700">
                          {legal.cancellationPolicy}
                        </p>
                      </div>
                      {/* Resumen de Precio - SOLO MOBILE */}
                      <div className="mt-4 rounded-[1.25rem] border border-sky-100 bg-white p-4 shadow-sm lg:hidden">
                        <h3 className="mb-3 font-medium text-slate-900">Resumen de precio</h3>
                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Precio (ida)</span>
                            <span>${(outboundPrice * checkout.passengers).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {checkout.returnTrip && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Precio (vuelta)</span>
                              <span>${(returnPrice * checkout.passengers).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-100">
                          <span>Total</span>
                          <span>${finalTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'payment' && (
                  <div>
                    <h2 className="mb-4 text-lg font-display font-medium text-slate-900 sm:text-xl">Detalles del pago</h2>
                    <p className="mb-6 text-sm text-gray-600 sm:text-base">Tu información de pago viaja de forma segura y protegida.</p>

                    {/* Payment Method Selector */}
                    <div className="mb-6">
                      <h3 className="mb-3 font-medium text-slate-900">Selecciona tu método de pago</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('card')}
                          className={`rounded-[1.25rem] p-4 border text-left transition-colors ${paymentMethod === 'card'
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-sky-100 bg-white hover:border-sky-200 hover:bg-sky-50'
                            }`}
                          disabled={isSubmitting}
                        >
                          <div className="flex items-center">
                            <CreditCard className="h-5 w-5 mr-2" />
                            <span className="font-medium">Tarjeta de Crédito/Débito</span>
                          </div>
                          <p className={`mt-1 text-sm ${paymentMethod === 'card' ? 'text-white/70' : 'text-gray-500'}`}>Pago seguro con tarjeta</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('wallet')}
                          className={`rounded-[1.25rem] p-4 border text-left transition-colors ${paymentMethod === 'wallet'
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-sky-100 bg-white hover:border-sky-200 hover:bg-sky-50'
                            }`}
                          disabled={isSubmitting}
                        >
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 mr-2" />
                            <span className="font-medium">MercadoPago Wallet</span>
                          </div>
                          <p className={`mt-1 text-sm ${paymentMethod === 'wallet' ? 'text-white/70' : 'text-gray-500'}`}>Pago con cuenta de MP</p>
                        </button>
                      </div>
                    </div>

                    {/* Payment Form */}
                    <div className="mt-6">
                      {paymentMethod === 'card' ? (
                        <CardPaymentForm
                          amount={finalTotal}
                          maxInstallments={1}
                          onSubmit={handleCardSubmit}
                          onError={() => { }}
                          onPayingChange={(p) => setIsSubmitting(p)}
                          defaultEmail={passengerData?.[0]?.email}
                          isSubmitting={isSubmitting}
                        />
                      ) : (
                        <WalletPaymentForm
                          key="wallet-payment-form"
                          amount={finalTotal}
                          onSubmit={handleWalletSubmit}
                          onError={() => {}}
                          disabled={isSubmitting}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navegación - Solo mostrar botones en pasos que no sean payment */}
              {currentStep !== 'payment' && (
                <div className="flex justify-between mt-8">
                  {currentStep !== 'passengers' ? (
                    <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isSubmitting} className="rounded-full px-6">
                      Volver
                    </Button>
                  ) : <div />}

                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!isCurrentStepComplete() || isSubmitting}
                    className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700"
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* Navegación para el paso de payment con botón Volver solamente */}
              {currentStep === 'payment' && (
                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isSubmitting} className="rounded-full px-6">
                    Volver
                  </Button>
                  <div />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Oculto en mobile, visible en LG */}
          <div className="hidden lg:block">
            <div className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(244,249,255,0.98))] shadow-[0_22px_52px_rgba(15,23,42,0.08)] md:sticky md:top-24">
              <div className="border-b border-sky-100 bg-sky-50/70 p-5">
                <h2 className="font-display text-2xl text-slate-900">Resumen de la reserva</h2>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-medium flex items-center">
                    {checkout.outboundTrip?.OriginName}
                    <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                    {checkout.outboundTrip?.DestinationName}
                  </div>
                </div>

                <div className="space-y-3 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-700" />
                    <span>{formattedDepartureDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-700" />
                    <div className="flex items-center">
                      <span>{checkout.outboundTrip?.DepartureHour}</span>
                      <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                      <span>{checkout.outboundTrip?.ArrivalHour}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-slate-700" />
                    <span>{checkout.outboundTrip?.VehicleName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-700" />
                    <span>
                      {checkout.passengers} Pasajero{checkout.passengers > 1 ? 's' : ''}
                    </span>
                  </div>
                  {/* Show dropoff city if different from destination (only for one-way trips) */}
                  {!isRoundTrip && outboundLocation.dropoffCityName &&
                   outboundLocation.dropoffCityName !== checkout.outboundTrip?.DestinationName && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <MapPin className="h-4 w-4" />
                      <span>Bajada: {outboundLocation.dropoffCityName}</span>
                    </div>
                  )}
                </div>

                {checkout.returnTrip && (
                  <>
                    <Separator className="my-4 bg-sky-100" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-medium flex items-center">
                        {checkout.returnTrip?.OriginName}
                        <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                        {checkout.returnTrip?.DestinationName}
                      </div>
                    </div>
                    <div className="space-y-3 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-700" />
                        <span>{formattedReturnDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-700" />
                        <div className="flex items-center">
                          <span>{checkout.returnTrip?.DepartureHour}</span>
                          <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                          <span>{checkout.returnTrip?.ArrivalHour}</span>

                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-slate-700" />
                        <span>{checkout.returnTrip?.VehicleName}</span>

                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-4 bg-sky-100" />

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio (ida)</span>
                    <span>${(outboundPrice * checkout.passengers).toFixed(2)}</span>
                  </div>
                  {checkout.returnTrip && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio (vuelta)</span>
                      <span>${(returnPrice * checkout.passengers).toFixed(2)}</span>
                    </div>
                  )}
                  {/* <div className="flex justify-between">
                    <span className="text-gray-600">Tasa de servicio</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div> */}
                </div>

                <Separator className="my-4" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p>
                    By proceeding with this booking, you agree to our{' '}
                    <Link href="#" className="text-blue-600 hover:underline">Terms of Service</Link>{' '}
                    and{' '}
                    <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
