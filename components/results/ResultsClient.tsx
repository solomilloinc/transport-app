'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateCarousel } from '@/components/date-carousel';
import { format } from 'date-fns';
import { ArrowRight, Bus, ChevronLeft, Calendar, Info, RefreshCw, Users, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { formatWithTimezone } from '@/utils/dates';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import { PagedReserveResponse } from '@/services/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter } from '../ui/card';

// 1. Definimos las props que el componente de cliente recibirá del Server Component.
interface ResultsClientProps {
  initialReserves: PagedReserveResponse<ReserveSummaryItem>;
  searchParams: {
    originId?: string;
    originName?: string;
    destinationId?: string;
    destinationName?: string;
    tripType?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: string;
  };
}

export default function ResultsClient({ initialReserves, searchParams }: ResultsClientProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams(); // Hook para obtener la cadena de query actual

  // 2. Inicializar el estado con los datos recibidos como props.
  const [reserves] = useState<PagedReserveResponse<ReserveSummaryItem>>(initialReserves);
  const [loading, setLoading] = useState(false); // Inicia en false porque los datos iniciales ya están cargados.

  // Leer los parámetros de búsqueda desde las props (para la UI inicial)
  const {
    originName = 'Origen',
    destinationName = 'Destino',
    tripType = 'OneWay',
    departureDate = format(new Date(), 'yyyy-MM-dd'),
    returnDate = '',
    passengers = '1',
  } = searchParams;

  // Formatear fechas para mostrar en la UI
  const formattedDepartureDate = departureDate ? formatWithTimezone(departureDate) : '';
  const formattedReturnDate = returnDate ? formatWithTimezone(returnDate) : '';

  // Estado para la selección de viajes
  const [activeTab, setActiveTab] = useState('outbound');
  const [selectedOutboundTrip, setSelectedOutboundTrip] = useState<ReserveSummaryItem | null>(null);

  // 3. Lógica de cliente para manejar interacciones.
  const handleDateSelect = (date: string) => {
    setLoading(true); // Mostrar estado de carga mientras la página nueva carga.
    const params = new URLSearchParams(searchParamsHook.toString());
    params.set('departureDate', date);
    router.push(`/results?${params.toString()}`);
    // No es necesario llamar a fetchReserves aquí. La navegación recargará la página
    // y el Server Component se encargará de obtener los nuevos datos.
  };

  const handleSelectOutbound = (trip: ReserveSummaryItem) => {
    if (tripType === 'RoundTrip') {
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

  const handleCheckout = (outboundTrip: ReserveSummaryItem, returnTrip?: ReserveSummaryItem) => {
    const params = new URLSearchParams();
    params.append('passengers', passengers);
    params.append('outboundTripId', outboundTrip.ReserveId.toString());
    if (returnTrip) {
      params.append('returnTripId', returnTrip.ReserveId.toString());
    }
    router.push(`/checkout?${params.toString()}`);
  };

  function formatLocation(location: string): string {
    if (!location) return '';
    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  // 4. JSX que fue eliminado de page.tsx.
  return (
    <>
      {/* Resumen de búsqueda y botón de volver */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a la búsqueda
        </Link>
        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center text-2xl font-bold text-blue-800 font-display mb-2">
                {formatLocation(originName)}
                <ArrowRight className="mx-2 h-6 w-6 self-center text-blue-800" />
                {formatLocation(destinationName)}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formattedDepartureDate}</span>
                <span>•</span>
                <Users className="h-4 w-4" />
                <span>
                  {passengers} {Number.parseInt(passengers) === 1 ? 'Pasajero' : 'Pasajeros'}
                </span>
              </div>
              {tripType === 'RoundTrip' && returnDate && (
                <div className="mt-2 text-gray-600">
                  <span className="font-medium">Vuelta:</span> {formattedReturnDate}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Carrusel de fechas */}
      <div className="mb-6">
        <DateCarousel selectedDate={departureDate} onDateSelect={handleDateSelect} className="bg-white rounded-lg border shadow-sm p-4" />
      </div>

      {/* Resultados de viajes */}
      <div className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="outbound">Ida</TabsTrigger>
            {tripType === 'RoundTrip' && returnDate && <TabsTrigger value="return">Vuelta</TabsTrigger>}
          </TabsList>

          {/* Pestaña de Ida */}
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
                  <div className="divide-y">
                    {reserves.Outbound.Items.map((trip) => (
                      <div key={trip.ReserveId} className={cn('p-4 hover:bg-gray-50 transition-colors', selectedOutboundTrip?.ReserveId === trip.ReserveId && 'bg-blue-50')}>
                        {/* Aquí va el JSX de cada item de viaje, como lo tenías antes */}
                        <div className="grid md:grid-cols-4 gap-4 items-center">
                          <div className="text-2xl font-bold text-blue-900">{trip.DepartureHour}</div>
                          <div className="flex items-center gap-2"><Bus className="h-5 w-5 text-blue-600" /><span>Servicio Estándar</span></div>
                          <div className="text-center"><div className="text-2xl font-bold text-blue-800">${trip.Price.toFixed(2)}</div><div className="text-sm text-gray-500">por persona</div></div>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleSelectOutbound(trip)}>Reservar</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {/* Pestaña de Vuelta */}
          {tripType === 'RoundTrip' && returnDate && (
            <TabsContent value="return" className="mt-0">
              {/* ... (Lógica y JSX para el viaje de vuelta, como lo tenías antes) ... */}
            </TabsContent>
          )}
        </Tabs>
      </div>
       {/* Booking information */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-blue-800 font-display mb-4">
              Booking Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-blue-800 mb-2">
                  Payment Methods
                </h3>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span>Credit/Debit Cards</span>
                </div>
                <p className="text-sm text-gray-500">
                  We accept Visa, Mastercard, American Express, and Discover.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-2">
                  Cancellation Policy
                </h3>
                <p className="text-sm text-gray-600">
                  Free cancellation up to 24 hours before departure. A 50% fee
                  applies for cancellations made less than 24 hours before
                  departure.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              Need assistance? Call us at{" "}
              <span className="font-medium">(555) 123-4567</span> or email{" "}
              <span className="font-medium">bookings@familytransit.com</span>
            </div>
          </CardFooter>
        </Card>
    </>
  );
}