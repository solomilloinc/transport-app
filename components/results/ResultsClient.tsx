'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateCarousel } from '@/components/date-carousel';
import { format } from 'date-fns';
import { ArrowRight, Bus, ChevronLeft, Calendar, Info, RefreshCw, Users, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { formatWithTimezone } from '@/utils/dates';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import { PagedReserveResponse } from '@/services/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '../ui/card';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useTenant } from '@/contexts/TenantContext';

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
    originName = 'Origen',
    destinationName = 'Destino',
    tripType = 'OneWay',
    departureDate = format(new Date(), 'yyyy-MM-dd'),
    returnDate = '',
    passengers = '1',
  } = searchParams;

  const formattedDepartureDate = departureDate ? formatWithTimezone(departureDate) : '';
  const formattedReturnDate = returnDate ? formatWithTimezone(returnDate) : '';

  const [activeTab, setActiveTab] = useState('outbound');
  const [selectedOutboundTrip, setSelectedOutboundTrip] = useState<ReserveSummaryItem | null>(null);

  const handleDateSelect = (date: string) => {
    setLoading(true);
    const params = new URLSearchParams(searchParamsHook.toString());
    params.set('departureDate', date);
    router.push(`/results?${params.toString()}`);
  };

  const { setCheckout } = useCheckout();

  const handleCheckout = (outboundTrip: ReserveSummaryItem, returnTrip?: ReserveSummaryItem) => {
    setCheckout({
      outboundTrip,
      returnTrip: returnTrip || null,
      passengers: Number(passengers),
    });
    router.push('/checkout');
  };

  const handleSelectOutbound = (trip: ReserveSummaryItem) => {
    if (tripType === 'RoundTrip') {
      setSelectedOutboundTrip(trip);
      setActiveTab('return');
      return;
    }

    handleCheckout(trip, undefined);
  };

  const handleSelectReturn = (returnTripSelection: ReserveSummaryItem) => {
    if (!selectedOutboundTrip) return;
    handleCheckout(selectedOutboundTrip, returnTripSelection);
  };

  function formatLocation(location: string): string {
    if (!location) return '';
    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  const renderTripList = (items: ReserveSummaryItem[], isReturnList = false) => {
    if (loading) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-700" />
          <p className="mt-4 text-slate-600">Actualizando salidas disponibles...</p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
          <Info className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900">No encontramos opciones para esa fecha</h3>
          <p className="mt-2 text-slate-600">Prueba otra fecha o cambia la ruta elegida.</p>
        </div>
      );
    }

    return (
      <ScrollArea className="max-h-[620px]">
        <div className="space-y-4 p-4">
          {items.map((trip) => (
            <article
              key={trip.ReserveId}
              className={cn(
                'rounded-[1.6rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,255,0.96))] p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-sky-200',
                selectedOutboundTrip?.ReserveId === trip.ReserveId && 'ring-2 ring-blue-200'
              )}
            >
              <div className="grid gap-5 lg:grid-cols-[0.7fr_1fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">salida</p>
                  <div className="mt-2 text-4xl font-display text-slate-900">{trip.DepartureHour}</div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-4 w-4" />
                    {isReturnList ? formattedReturnDate : formattedDepartureDate}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-white">
                      <Bus className="h-3.5 w-3.5" />
                      Servicio estandar
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      {trip.AvailableQuantity} disponibles
                    </div>
                  </div>

                  {trip.StopSchedules && trip.StopSchedules.length > 0 && (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-xs text-slate-600">
                      <div className="mb-2 flex items-center gap-2 font-medium text-slate-800">
                        <MapPin className="h-3.5 w-3.5 text-blue-600" />
                        Puntos de subida
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {trip.StopSchedules.map((stop) => (
                          <span key={stop.DirectionId}>
                            {stop.DirectionName}: {stop.PickupTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[1.4rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(219,234,254,0.94))] p-5 text-slate-900">
                  <div className="text-xs uppercase tracking-[0.28em] text-blue-700/70">por pasajero</div>
                  <div className="mt-2 text-3xl font-display">${trip.Price.toFixed(2)}</div>
                  <Button
                    className="mt-5 h-11 w-full rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => (isReturnList ? handleSelectReturn(trip) : handleSelectOutbound(trip))}
                  >
                    {isReturnList ? 'Elegir vuelta' : 'Reservar'}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <>
      <section className="mb-6">
        <div className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,255,0.98))] px-5 py-6 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:px-7">
          <Link href="/" className="inline-flex items-center text-sm text-slate-600 transition-colors hover:text-slate-900">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a la busqueda
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">resultado de viaje</p>
              <h1 className="mt-3 flex flex-wrap items-center gap-2 text-3xl text-slate-900 sm:text-4xl font-display">
                <span>{formatLocation(originName)}</span>
                <ArrowRight className="h-5 w-5 text-slate-400" />
                <span>{formatLocation(destinationName)}</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <div className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2">{formattedDepartureDate}</div>
              {tripType === 'RoundTrip' && returnDate && (
                <div className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2">Vuelta: {formattedReturnDate}</div>
              )}
              <div className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2">
                {passengers} {Number.parseInt(passengers, 10) === 1 ? 'pasajero' : 'pasajeros'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,255,0.96))] p-4 shadow-[0_16px_38px_rgba(15,23,42,0.06)]">
          <DateCarousel selectedDate={departureDate} onDateSelect={handleDateSelect} />
        </div>
      </section>

      <section className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 rounded-full border border-sky-100 bg-white/90 p-1 shadow-sm">
            <TabsTrigger value="outbound" className="rounded-full">Ida</TabsTrigger>
            {tripType === 'RoundTrip' && returnDate && <TabsTrigger value="return" className="rounded-full">Vuelta</TabsTrigger>}
          </TabsList>

          <TabsContent value="outbound" className="mt-0">
            <div className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,247,255,0.96))] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="border-b border-sky-100 px-5 py-5 sm:px-6">
                <h2 className="text-2xl text-slate-900 font-display">
                  Salidas disponibles: {formatLocation(originName)} a {formatLocation(destinationName)}
                </h2>
                <p className="mt-2 text-sm text-slate-600">{formattedDepartureDate}</p>
              </div>
              {renderTripList(reserves.Outbound.Items, false)}
            </div>
          </TabsContent>

          {tripType === 'RoundTrip' && returnDate && (
            <TabsContent value="return" className="mt-0">
              {!selectedOutboundTrip ? (
                <div className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,255,0.96))] p-10 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                  <Info className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">Primero elige la salida de ida</h3>
                  <p className="mt-2 text-slate-600">Despues de elegirla vas a poder completar la vuelta.</p>
                </div>
              ) : (
                <div className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,247,255,0.96))] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <div className="border-b border-sky-100 px-5 py-5 sm:px-6">
                    <h2 className="text-2xl text-slate-900 font-display">
                      Vuelta disponible: {formatLocation(destinationName)} a {formatLocation(originName)}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{formattedReturnDate}</p>
                  </div>
                  {renderTripList(reserves.Return.Items, true)}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </section>

      <Card className="rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,255,0.98))] shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
        <CardContent className="p-6">
          <h2 className="text-2xl text-slate-900 font-display">Antes de confirmar tu viaje</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-medium text-slate-900">Medios de pago</h3>
              <div className="mb-1 flex items-center gap-2 text-slate-700">
                <CreditCard className="h-4 w-4" />
                <span>Tarjetas de credito, debito y Mercado Pago Wallet</span>
              </div>
              <p className="text-sm text-slate-500">
                El checkout mantiene la reserva temporal mientras completas el pago.
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-medium text-slate-900">Politica de cancelacion</h3>
              <p className="text-sm text-slate-600">{legal.cancellationPolicy}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-sky-100 bg-sky-50/60 px-6 py-4 text-sm text-slate-600">
          ¿Necesitas ayuda? Llámanos al <span className="mx-1 font-medium text-slate-900">{contact.phone}</span> o escribe a
          <span className="ml-1 font-medium text-slate-900">{contact.bookingsEmail}</span>.
        </CardFooter>
      </Card>
    </>
  );
}
