'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft, ArrowRight, Calendar, Clock, Bus, Users, CreditCard, Shield,
} from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { formatWithTimezone } from '@/utils/dates';
import { useCheckout } from '@/contexts/CheckoutContext';
import { PassengerForm } from '@/components/passenger-form';
import CardPaymentForm from '@/components/card-payment-form';
import { post } from '@/services/api';
import { CreateReserveExternalResult } from '@/interfaces/reserve';

export default function CheckoutPage() {
  const router = useRouter();
  const { checkout } = useCheckout();

  const [currentStep, setCurrentStep] =
    useState<'passengers' | 'payment' | 'review'>('passengers');
  const [passengerData, setPassengerData] = useState<Record<string, any>[]>(() =>
    Array(checkout.passengers || 1).fill(0).map(() => ({})),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formattedDepartureDate, setFormattedDepartureDate] = useState('');
  const [formattedReturnDate, setFormattedReturnDate] = useState('');
  
  useEffect(() => {
    setFormattedDepartureDate(formatWithTimezone(checkout.outboundTrip?.DepartureDate ?? ''));
    setFormattedReturnDate(formatWithTimezone(checkout.returnTrip?.DepartureDate ?? ''));
  }, [checkout.outboundTrip?.DepartureDate, checkout.returnTrip?.DepartureDate]);

  const outboundPrice = checkout.outboundTrip?.Price || 0;
  const returnPrice  = checkout.returnTrip?.Price  || 0;
  const totalPrice   = (outboundPrice + returnPrice) * checkout.passengers;
  const serviceFee   = 2.5 * checkout.passengers;
  const finalTotal   = useMemo(() => totalPrice + serviceFee, [totalPrice, serviceFee]);

  const handlePassengerDataChange = (data: Record<string, any>[]) => {
    if (JSON.stringify(data) !== JSON.stringify(passengerData)) {
      setPassengerData(data);
    }
  };

  const goToNextStep = () => {
    if (currentStep === 'passengers') setCurrentStep('review');
    else if (currentStep === 'review') setCurrentStep('payment');
  };
  
  const goToPreviousStep = () => {
    if (currentStep === 'review') setCurrentStep('passengers');
    else if (currentStep === 'payment') setCurrentStep('review');
  };
  
  const isCurrentStepComplete = () => {
    if (currentStep === 'passengers') {
      return (
        passengerData.length === checkout.passengers &&
        passengerData.every((p) => p.firstName && p.lastName && p.email)
      );
    }
    return true;
  };

  // Procesar el pago (el Brick llama esto y espera una Promise)
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

      const compraDescripcion = checkout.returnTrip ? 'Pasaje ida y vuelta' : 'Pasaje de ida';

      const items = passengerData.map((p) => ({
        reserveId: checkout.outboundTrip?.ReserveId ?? 0,
        reserveTypeId: 1,
        customerId: null,
        isPayment: true,
        pickupLocationId: null,
        dropoffLocationId: null,
        hasTraveled: false,
        price: Number(finalTotal.toFixed(2)),
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone1: p.phone,
        documentNumber: p.documentNumber,
      }));

      if (checkout.returnTrip) {
        items.push(
          ...passengerData.map((p) => ({
            reserveId: checkout.returnTrip?.ReserveId ?? 0,
            reserveTypeId: 2,
            customerId: null,
            isPayment: true,
            pickupLocationId: null,
            dropoffLocationId: null,
            hasTraveled: false,
            price: Number(finalTotal.toFixed(2)),
firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone1: p.phone,
        documentNumber: p.documentNumber,
          })),
        );
      }

      const payload = {
        Payment: {
          transactionAmount: Number(finalTotal.toFixed(2)),
          token: data.token,
          description: compraDescripcion,
          installments: data.installments,
          paymentMethodId: data.paymentMethodId,
          payerEmail: data.email,
          identificationType: data?.identification?.type,
          identificationNumber: data?.identification?.number,
        },
        Items: items,
      };

      const response = await post('/passenger-reserves-create-external', payload);
      const responseData: CreateReserveExternalResult =
        typeof response === 'string' ? JSON.parse(response) : response;

      if (responseData.status === 'approved') {
        router.push('/booking-confirmation?success=true');
      } else {
        router.push(`/booking-confirmation?status=${encodeURIComponent(responseData.status || 'unknown')}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6">
          <Button
            variant="link"
            onClick={() => router.back()}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 p-0 h-auto"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border shadow-sm p-6 relative">

              {/* Overlay de loading durante el pago */}
              {isSubmitting && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
                  <span className="text-sm text-gray-700">Procesando pago…</span>
                </div>
              )}

              <h1 className="text-2xl font-bold text-blue-800 font-display mb-4">Complete su reserva</h1>

              {/* Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className={`flex flex-col items-center ${currentStep === 'passengers' ? 'text-blue-600' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      currentStep === 'passengers' ? 'bg-blue-600 text-white'
                        : currentStep === 'payment' || currentStep === 'review' ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Pasajeros</span>
                  </div>

                  <div className="flex-1 h-1 mx-2 bg-gray-200">
                    <div className={`h-full bg-blue-600 ${currentStep !== 'passengers' ? 'w-full' : 'w-0'}`} />
                  </div>

                  <div className={`flex flex-col items-center ${currentStep === 'review' ? 'text-blue-600' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      currentStep === 'review' ? 'bg-blue-600 text-white'
                        : currentStep === 'payment' ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span className="text-xs">Revisar</span>
                  </div>

                  <div className="flex-1 h-1 mx-2 bg-gray-200">
                    <div className={`h-full bg-blue-600 ${currentStep === 'payment' ? 'w-full' : 'w-0'}`} />
                  </div>

                  <div className={`flex flex-col items-center ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
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
                  <div>
                    <h2 className="text-xl font-medium text-blue-800 mb-4">Información de los Pasajeros</h2>
                    <p className="text-gray-600 mb-6">Por favor ingrese los detalles de cada pasajero.</p>
                    <PassengerForm
                      passengerCount={checkout.passengers}
                      onDataChange={handlePassengerDataChange}
                      initialData={passengerData}
                    />
                  </div>
                )}

                {currentStep === 'review' && (
                  <div>
                    <h2 className="text-xl font-medium text-blue-800 mb-4">Revise su Reserva</h2>
                    <p className="text-gray-600 mb-6">
                      Por favor, revise los detalles de su reserva antes de confirmar la compra.
                    </p>

                    <div className="space-y-6">
                      {/* Ida */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-medium text-blue-800 mb-2">Detalle del Viaje de Ida</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-600">Ruta:</div>
                          <div className="font-medium flex items-center">
                            {checkout.outboundTrip?.OriginName}
                            <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                            {checkout.outboundTrip?.DestinationName}
                          </div>
                          <div className="text-gray-600">Fecha:</div>
                          <div className="font-medium">{formattedDepartureDate}</div>
                          <div className="text-gray-600">Hora de Salida:</div>
                          <div className="font-medium">{checkout.outboundTrip?.DepartureHour}</div>
                        </div>
                      </div>

                      {/* Vuelta */}
                      {checkout.returnTrip && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-medium text-blue-800 mb-2">Detalle del Viaje de Vuelta</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
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
                        <h3 className="font-medium text-blue-800 mb-2">Información de Pasajeros</h3>
                        <div className="space-y-3">
                          {passengerData.map((p, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                              <div className="font-medium">
                                Pasajero {idx + 1}: {p.firstName} {p.lastName}
                              </div>
                              <div className="text-gray-600">{p.email}</div>
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
                      <div className="bg-yellow-50 p-4 rounded-lg text-sm">
                        <h3 className="font-medium text-yellow-800 mb-2">Términos y Condiciones</h3>
                        <p className="text-yellow-700 mb-2">
                          Al completar esta reserva, usted acepta los términos y condiciones de Zeros Tour, incluida
                          nuestra política de cancelación.
                        </p>
                        <p className="text-yellow-700">
                          Cancelación gratuita hasta 24 horas antes de la salida. Se aplica una tarifa del 50% para
                          cancelaciones realizadas con menos de 24 horas de antelación.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'payment' && (
                  <div>
                    <h2 className="text-xl font-medium text-blue-800 mb-4">Detalles del Pago</h2>
                    <p className="text-gray-600 mb-6">Su información de pago es segura y está encriptada.</p>

                    <CardPaymentForm
                      amount={finalTotal}
                      maxInstallments={1}
                      onSubmit={handleCardSubmit}
                      onError={() => {}}
                      onPayingChange={(p) => setIsSubmitting(p)}
                      defaultEmail={passengerData?.[0]?.email}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                )}
              </div>

              {/* Navegación - Solo mostrar botones en pasos que no sean payment */}
              {currentStep !== 'payment' && (
                <div className="flex justify-between mt-8">
                  {currentStep !== 'passengers' ? (
                    <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isSubmitting}>
                      Volver
                    </Button>
                  ) : <div />}

                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!isCurrentStepComplete() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* Navegación para el paso de payment con botón Volver solamente */}
              {currentStep === 'payment' && (
                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={isSubmitting}>
                    Volver
                  </Button>
                  <div />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - sin cambios */}
          <div>
            <div className="bg-white rounded-lg border shadow-sm sticky top-24">
              <div className="p-4 border-b bg-blue-50">
                <h2 className="font-bold text-blue-800 font-display">Resumen de la Reserva</h2>
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
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>{formattedDepartureDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div className="flex items-center">
                      <span>{checkout.outboundTrip?.DepartureHour}</span>
                      <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bus className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>
                      {checkout.passengers} Pasajero{checkout.passengers > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {checkout.returnTrip && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-medium flex items-center">
                        {checkout.returnTrip?.OriginName}
                        <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                        {checkout.returnTrip?.DestinationName}
                      </div>
                    </div>
                    <div className="space-y-3 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{formattedReturnDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div className="flex items-center">
                          <span>{checkout.returnTrip?.DepartureHour}</span>
                          <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-4" />

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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasa de servicio</span>
                    <span>${serviceFee.toFixed(2)}</span>
                  </div>
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