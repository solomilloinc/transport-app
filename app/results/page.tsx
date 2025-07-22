'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateCarousel } from '@/components/date-carousel';
import { format, addMinutes, parseISO } from 'date-fns';
import { ArrowRight, Bus, Clock, CreditCard, MapPin, Users, Wifi, Coffee, ChevronLeft, Calendar, Info, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar';
import { formatWithTimezone } from '@/utils/dates';
import Footer from '@/components/footer';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import { get } from '@/services/api';
import { PagedReserveResponse } from '@/services/types';
import { cn } from '@/lib/utils';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [reserves, setReserves] = useState<PagedReserveResponse<ReserveSummaryItem>>({
    Outbound: {
      Items: [],
      PageNumber: 1,
      PageSize: 10,
      TotalRecords: 0,
      TotalPages: 0,
    },
    Return: {
      Items: [],
      PageNumber: 1,
      PageSize: 10,
      TotalRecords: 0,
      TotalPages: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  // Get search parameters
  const originId = searchParams.get('originId') || '';
  const originName = searchParams.get('originName') || 'Origen';
  const destinationId = searchParams.get('destinationId') || '';
  const destinationName = searchParams.get('destinationName') || 'Destino';
  const tripType = searchParams.get('tripType') || 'OneWay';
  const departureDate = searchParams.get('departureDate') || format(new Date(), 'yyyy-MM-dd');
  const returnDate = searchParams.get('returnDate') || '';
  const passengers = searchParams.get('passengers') || '1';

  // Format dates for display
  const formattedDepartureDate = departureDate ? formatWithTimezone(departureDate) : '';

  const formattedReturnDate = returnDate ? formatWithTimezone(returnDate) : '';

  // State for trip selection
  const [activeTab, setActiveTab] = useState('outbound');
  const [selectedOutboundTrip, setSelectedOutboundTrip] = useState<ReserveSummaryItem | null>(null);

  // Handle date selection from carousel
  const handleDateSelect = (date: string) => {
    // Create new URLSearchParams with the updated date
    const params = new URLSearchParams(searchParams.toString());
    params.set('departureDate', date);

    // Update the URL with the new date
    router.push(`/results?${params.toString()}`);

    // Reset trips and show loading state
    setReserves({
      Outbound: {
        Items: [],
        PageNumber: 1,
        PageSize: 10,
        TotalRecords: 0,
        TotalPages: 0,
      },
      Return: {
        Items: [],
        PageNumber: 1,
        PageSize: 10,
        TotalRecords: 0,
        TotalPages: 0,
      },
    });
    setLoading(true);
    setSelectedOutboundTrip(null); // Reset selection
    setActiveTab('outbound'); // Go back to outbound tab
  };

  // Step 1: Select the outbound trip
  const handleSelectOutbound = (trip: ReserveSummaryItem) => {
    if (tripType === 'RoundTrip') {
      setSelectedOutboundTrip(trip);
      setActiveTab('return'); // Move to the return selection tab
    } else {
      // If it's a one-way trip, proceed directly to checkout
      handleCheckout(trip, undefined);
    }
  };

  // Step 2: Select the return trip and proceed to checkout
  const handleSelectReturn = (returnTrip: ReserveSummaryItem) => {
    if (!selectedOutboundTrip) {
      // This should not happen in the normal flow, but it's a safeguard
      console.error('Cannot select a return trip without an outbound trip.');
      return;
    }
    handleCheckout(selectedOutboundTrip, returnTrip);
  };

  // Final step: Gather all info and navigate to checkout
  const handleCheckout = (outboundTrip: ReserveSummaryItem, returnTrip?: ReserveSummaryItem) => {
    const params = new URLSearchParams();
    params.append('passengers', passengers);

    // Add outbound trip info
    params.append('outboundTripId', outboundTrip.ReserveId.toString());

    // Add return trip info if it exists
    if (returnTrip) {
      params.append('returnTripId', returnTrip.ReserveId.toString());
    }

    // Navigate to checkout page
    router.push(`/checkout?${params.toString()}`);
  };

  const fetchReserves = async (pageToFetch = currentPage, pageSizeToFetch = 10) => {
    setLoading(true);
    try {
      const response = await get<any, PagedReserveResponse<ReserveSummaryItem>>(
        '/api/public/reserve-summary',
        {
          pageNumber: pageToFetch,
          pageSize: pageSizeToFetch,
          filters: {
            originId: Number(originId),
            destinationId: Number(destinationId),
            departureDate: departureDate,
            passengers: Number(passengers),
            tripType: tripType,
            returnDate: returnDate,
          },
        },
        { skipAuth: true }
      );
      setReserves(response);
    } catch (error) {
      console.error('Failed to fetch reserves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (originId && destinationId && departureDate) {
      fetchReserves(1, 10);
    }
  }, [originId, destinationId, departureDate, returnDate, passengers, tripType]);

  // Helper to format location names
  function formatLocation(location: string): string {
    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-8">
        {/* Back button and search summary */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
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

        {/* Date Carousel */}
        <div className="mb-6">
          <DateCarousel selectedDate={departureDate} onDateSelect={handleDateSelect} className="bg-white rounded-lg border shadow-sm p-4" />
        </div>

        {/* Trip results */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="outbound">Ida</TabsTrigger>
              {tripType === 'RoundTrip' && returnDate && <TabsTrigger value="return">Vuelta</TabsTrigger>}
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
                  <div className="p-8 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <p className="mt-4 text-gray-600">Buscando viajes disponibles</p>
                  </div>
                ) : reserves.Outbound.Items.length === 0 ? (
                  <div className="p-8 text-center">
                    <Info className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay viajes disponibles</h3>
                    <p className="text-gray-600">
                      No encontramos ningún viaje que coincida con tus criterios de búsqueda. Prueba con otras fechas o ubicaciones.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                      {reserves.Outbound.Items.map((trip) => (
                        <div
                          key={trip.ReserveId}
                          className={cn('p-4 hover:bg-gray-50 transition-colors', selectedOutboundTrip?.ReserveId === trip.ReserveId && 'bg-blue-50')}
                        >
                          <div className="grid md:grid-cols-4 gap-4">
                            {/* Time and route */}
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <div className="text-2xl font-bold text-blue-900">{trip.DepartureHour}</div>
                              </div>
                              <div className="flex items-center justify-between gap-1 text-sm">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  <span className="text-gray-700">{trip.OriginName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  <span className="text-gray-700">{trip.DestinationName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm"></div>
                            </div>

                            {/* Bus details */}
                            <div className="space-y-2 flex items-center">
                              <div className="flex items-center gap-2">
                                <Bus className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">Servicio Estándar</span>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-sm text-gray-500">Precio por persona</div>
                              <div className="text-2xl font-bold text-blue-800">${trip.Price.toFixed(2)}</div>
                              <div className="text-sm text-gray-500">Total: ${(trip.Price * Number.parseInt(passengers)).toFixed(2)}</div>
                            </div>

                            {/* Action */}
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleSelectOutbound(trip)}>
                                Reservar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>

            {tripType === 'RoundTrip' && returnDate && (
              <TabsContent value="return" className="mt-0">
                {!selectedOutboundTrip ? (
                  <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
                    <Info className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona tu viaje de ida</h3>
                    <p className="text-gray-600">Para ver las opciones de vuelta, primero debes seleccionar un viaje de la pestaña "Ida".</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-4 bg-blue-50 border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="font-display font-bold text-lg text-blue-800">
                            Selecciona tu viaje de vuelta: {formatLocation(destinationName)} → {formatLocation(originName)}
                          </h2>
                          <p className="text-sm text-blue-700">{formattedReturnDate}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('outbound')}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Cambiar ida
                        </Button>
                      </div>
                      <div className="mt-2 p-2 bg-white border rounded-md text-sm">
                        <span className="font-semibold">Ida seleccionada:</span> {selectedOutboundTrip.OriginName} →{' '}
                        {selectedOutboundTrip.DestinationName} a las {selectedOutboundTrip.DepartureHour} por ${selectedOutboundTrip.Price.toFixed(2)}
                      </div>
                    </div>

                    {loading ? (
                      <div className="p-8 text-center">
                        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                      </div>
                    ) : reserves.Return.Items.length === 0 ? (
                      <div className="p-8 text-center">
                        <Info className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay viajes de vuelta disponibles</h3>
                        <p className="text-gray-600">No encontramos ningún viaje de regreso para la fecha seleccionada.</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[600px]">
                        <div className="divide-y">
                          {reserves.Return.Items.map((trip) => (
                            <div key={trip.ReserveId} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="grid md:grid-cols-4 gap-4">
                                {/* Time and route */}
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <div className="text-2xl font-bold text-blue-900">{trip.DepartureHour}</div>
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-sm">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4 text-blue-600" />
                                      <span className="text-gray-700">{trip.OriginName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4 text-blue-600" />
                                      <span className="text-gray-700">{trip.DestinationName}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Bus details */}
                                <div className="space-y-2 flex items-center">
                                  <div className="flex items-center gap-2">
                                    <Bus className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium">Servicio Estándar</span>
                                  </div>
                                </div>

                                {/* Price */}
                                <div className="flex flex-col items-center justify-center">
                                  <div className="text-sm text-gray-500">Precio por persona</div>
                                  <div className="text-2xl font-bold text-blue-800">${trip.Price.toFixed(2)}</div>
                                </div>

                                {/* Action */}
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleSelectReturn(trip)}>
                                    Seleccionar Vuelta
                                  </Button>
                                </div>
                              </div>
                            </div>
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

        {/* Booking information */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-blue-800 font-display mb-4">Booking Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-blue-800 mb-2">Payment Methods</h3>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <CreditCard className="h-4 w-4" />
                  <span>Credit/Debit Cards</span>
                </div>
                <p className="text-sm text-gray-500">We accept Visa, Mastercard, American Express, and Discover.</p>
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-2">Cancellation Policy</h3>
                <p className="text-sm text-gray-600">
                  Free cancellation up to 24 hours before departure. A 50% fee applies for cancellations made less than 24 hours before departure.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              Need assistance? Call us at <span className="font-medium">(555) 123-4567</span> or email{' '}
              <span className="font-medium">bookings@familytransit.com</span>
            </div>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
