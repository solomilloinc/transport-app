'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateCarousel } from '@/components/date-carousel';
import { format } from 'date-fns';
import { ArrowRight, ChevronLeft, Calendar, Info, RefreshCw, Users, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { formatWithTimezone } from '@/utils/dates';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import { PagedReserveResponse } from '@/services/types';
import { Card, CardContent, CardFooter } from '../ui/card';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useTenant } from '@/contexts/TenantContext';
import type { LocationSelectionData } from '@/components/checkout/LocationSelector';
import { ResultsTripRow } from '@/components/results/ResultsTripRow';

interface ResultsClientProps {
  initialReserves: PagedReserveResponse<ReserveSummaryItem>;
  searchParams: {
    tripId?: string;
    returnTripId?: string;
    originName?: string;
    destinationName?: string;
    tripType?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: string;
    pickupDirectionId?: string;
  };
}

export default function ResultsClient({ initialReserves, searchParams }: ResultsClientProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const { contact, legal } = useTenant();
  const [reserves, setReserves] = useState<PagedReserveResponse<ReserveSummaryItem>>(initialReserves);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReserves(initialReserves);
    setLoading(false);
  }, [initialReserves]);

  const {
    tripId = '',
    originName = 'Origen',
    destinationName = 'Destino',
    tripType = 'OneWay',
    departureDate = format(new Date(), 'yyyy-MM-dd'),
    returnDate = '',
    passengers = '1',
    pickupDirectionId: pickupDirectionIdParam = '',
  } = searchParams;

  const formattedDepartureDate = departureDate ? formatWithTimezone(departureDate) : '';
  const formattedReturnDate = returnDate ? formatWithTimezone(returnDate) : '';

  const [activeTab, setActiveTab] = useState('outbound');
  const [selectedOutboundTrip, setSelectedOutboundTrip] = useState<ReserveSummaryItem | null>(null);
  const [outboundLocByReserve, setOutboundLocByReserve] = useState<Record<number, LocationSelectionData>>({});
  const [returnLocByReserve, setReturnLocByReserve] = useState<Record<number, LocationSelectionData>>({});

  const { setCheckout } = useCheckout();

  const pickupFromUrl = useMemo(() => {
    const parsed = Number.parseInt(pickupDirectionIdParam, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }, [pickupDirectionIdParam]);

  useEffect(() => {
    setSelectedOutboundTrip(null);
    setActiveTab('outbound');
    setOutboundLocByReserve({});
    setReturnLocByReserve({});
  }, [departureDate, returnDate, tripId, tripType, pickupDirectionIdParam]);

  const isRoundTrip = tripType === 'RoundTrip' && !!returnDate;

  /** Carrusel: en pestaña Vuelta edita la fecha de vuelta elegida en el home, no la de ida. */
  const carouselSelectedDate = useMemo(() => {
    if (isRoundTrip && activeTab === 'return' && returnDate) {
      return returnDate;
    }
    return departureDate;
  }, [isRoundTrip, activeTab, returnDate, departureDate]);

  const handleDateSelect = (date: string) => {
    setLoading(true);
    const params = new URLSearchParams(searchParamsHook.toString());
    if (isRoundTrip && activeTab === 'return') {
      params.set('returnDate', date);
    } else {
      params.set('departureDate', date);
      if (isRoundTrip && returnDate && date > returnDate) {
        params.set('returnDate', date);
      }
    }
    router.push(`/results?${params.toString()}`);
  };

  const handleCheckout = (outboundTrip: ReserveSummaryItem, returnTrip?: ReserveSummaryItem) => {
    const obLoc = outboundLocByReserve[outboundTrip.ReserveId];
    const retLoc = returnTrip ? returnLocByReserve[returnTrip.ReserveId] : undefined;
    setCheckout({
      outboundTrip,
      returnTrip: returnTrip || null,
      passengers: Number.parseInt(passengers, 10) || 1,
      ...(obLoc ? { outboundLocation: obLoc } : {}),
      ...(retLoc ? { returnLocation: retLoc } : {}),
      ...(pickupFromUrl != null && obLoc?.pickupDirectionId == null ? { initialPickupDirectionId: pickupFromUrl } : {}),
    });
    router.push('/checkout');
  };

  const handleSelectOutbound = (trip: ReserveSummaryItem) => {
    if (isRoundTrip) {
      setSelectedOutboundTrip(trip);
      setActiveTab('return');
    } else {
      handleCheckout(trip, undefined);
    }
  };

  const handleSelectReturn = (returnTrip: ReserveSummaryItem) => {
    if (!selectedOutboundTrip) {
      console.error('No se puede seleccionar un viaje de vuelta sin uno de ida.');
      return;
    }
    handleCheckout(selectedOutboundTrip, returnTrip);
  };

  function formatLocation(location: string): string {
    if (!location) return '';
    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a la búsqueda
        </Link>
        <div className="bg-white rounded-lg border p-3 sm:p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-center sm:justify-start">
              <h1 className="flex flex-wrap justify-center items-center gap-x-1 text-sm sm:text-xl md:text-2xl font-bold text-blue-800 font-display text-center leading-tight">
                <span>{formatLocation(originName)}</span>
                <ArrowRight className="h-3 w-3 sm:h-5 sm:w-5 md:h-6 md:w-6 flex-shrink-0 text-blue-800" />
                <span>{formatLocation(destinationName)}</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{formattedDepartureDate}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>
                  {passengers} {Number.parseInt(passengers) === 1 ? 'Pasajero' : 'Pasajeros'}
                </span>
              </div>
              {isRoundTrip && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Vuelta:</span>
                    <span>{formattedReturnDate}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        {isRoundTrip && (
          <p className="mb-2 text-center text-xs text-slate-600 sm:text-left">
            {activeTab === 'return' ? (
              <>
                Cambiando fechas acá se ajusta la <span className="font-semibold text-blue-800">vuelta</span> (ida:{' '}
                {formattedDepartureDate}).
              </>
            ) : (
              <>
                Cambiando fechas acá se ajusta la <span className="font-semibold text-blue-800">ida</span>
                {returnDate ? (
                  <>
                    {' '}
                    (vuelta: {formattedReturnDate}).
                  </>
                ) : null}
              </>
            )}
          </p>
        )}
        <DateCarousel
          selectedDate={carouselSelectedDate}
          onDateSelect={handleDateSelect}
          className="bg-white rounded-lg border shadow-sm p-4"
        />
      </div>

      <div className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="outbound">Ida</TabsTrigger>
            {isRoundTrip && <TabsTrigger value="return">Vuelta</TabsTrigger>}
          </TabsList>

          <TabsContent value="outbound" className="mt-0">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 bg-blue-50 border-b">
                <h2 className="font-display font-bold text-lg text-blue-800">
                  Reservas Disponibles: {formatLocation(originName)} → {formatLocation(destinationName)}
                </h2>
                <p className="text-sm text-blue-700">{formattedDepartureDate}</p>
              </div>

              {loading ? (
                <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="mt-4 text-gray-600">Buscando viajes...</p>
                </div>
              ) : reserves.Outbound.Items.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <Info className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay viajes disponibles</h3>
                  <p className="text-gray-600">No encontramos viajes para la fecha seleccionada.</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 p-2.5 sm:p-3">
                    {reserves.Outbound.Items.map((trip) => (
                      <ResultsTripRow
                        key={trip.ReserveId}
                        trip={trip}
                        variant="outbound"
                        isRoundTrip={isRoundTrip}
                        passengerCount={Number.parseInt(passengers, 10) || 1}
                        initialPickupDirectionId={pickupFromUrl}
                        selectedOutboundTrip={selectedOutboundTrip}
                        outboundLocationForReturnQuote={undefined}
                        location={outboundLocByReserve[trip.ReserveId]}
                        onLocationChange={(data) =>
                          setOutboundLocByReserve((prev) => ({ ...prev, [trip.ReserveId]: data }))
                        }
                        highlight={selectedOutboundTrip?.ReserveId === trip.ReserveId}
                        onContinue={() => handleSelectOutbound(trip)}
                        continueLabel="Reservar"
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {isRoundTrip && (
            <TabsContent value="return" className="mt-0">
              {!selectedOutboundTrip ? (
                <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] bg-white rounded-lg border shadow-sm">
                  <Info className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Seleccioná un viaje de ida</h3>
                  <p className="text-gray-600">Primero elegí un horario de ida (botón Reservar) para poder elegir tu vuelta.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className="p-4 bg-blue-50 border-b">
                    <h2 className="font-display font-bold text-lg text-blue-800">
                      Reservas Disponibles: {formatLocation(destinationName)} → {formatLocation(originName)}
                    </h2>
                    <p className="text-sm text-blue-700">{formattedReturnDate}</p>
                  </div>
                  {reserves.Return.Items.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                      <Info className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay viajes de vuelta disponibles</h3>
                      <p className="text-gray-600">No encontramos viajes para la fecha de vuelta seleccionada.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-2 p-2.5 sm:p-3">
                        {reserves.Return.Items.map((trip) => (
                          <ResultsTripRow
                            key={trip.ReserveId}
                            trip={trip}
                            variant="return"
                            isRoundTrip={isRoundTrip}
                            passengerCount={Number.parseInt(passengers, 10) || 1}
                            initialPickupDirectionId={pickupFromUrl}
                            selectedOutboundTrip={selectedOutboundTrip}
                            outboundLocationForReturnQuote={
                              selectedOutboundTrip
                                ? outboundLocByReserve[selectedOutboundTrip.ReserveId]
                                : undefined
                            }
                            location={returnLocByReserve[trip.ReserveId]}
                            onLocationChange={(data) =>
                              setReturnLocByReserve((prev) => ({ ...prev, [trip.ReserveId]: data }))
                            }
                            onContinue={() => handleSelectReturn(trip)}
                            continueLabel="Seleccionar Vuelta"
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-blue-800 font-display mb-4">
            Información de la Reserva
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">
                Métodos de Pago
              </h3>
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CreditCard className="h-4 w-4" />
                <span>Tarjetas de Crédito/Débito</span>
              </div>
              <p className="text-sm text-gray-500">
                Aceptamos Visa, Mastercard, American Express y Discover.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">
                Política de Cancelación
              </h3>
              <p className="text-sm text-gray-600">
                {legal.cancellationPolicy}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-6 py-4 border-t">
          <div className="text-sm text-gray-600">
            ¿Necesitas ayuda? Llámanos al{' '}
            <span className="font-medium">{contact.phone}</span> o envíanos un correo electrónico a{' '}
            <span className="font-medium">{contact.bookingsEmail}</span>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
