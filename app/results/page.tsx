"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateCarousel } from "@/components/date-carousel";
import { format, addMinutes, parseISO } from "date-fns";
import {
  ArrowRight,
  Bus,
  Clock,
  CreditCard,
  MapPin,
  Users,
  Wifi,
  Coffee,
  ChevronLeft,
  Calendar,
  Info,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { formatWithTimezone } from "@/utils/dates";
import Footer from "@/components/footer";

// Types for our trip data
interface Trip {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  availableSeats: number;
  busType: string;
  amenities: string[];
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Get search parameters
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const tripType = searchParams.get("tripType") || "one-way";
  const departureDate =
    searchParams.get("departureDate") || format(new Date(), "yyyy-MM-dd");
  const returnDate = searchParams.get("returnDate") || "";
  const passengers = searchParams.get("passengers") || "1";

  // Format dates for display
  const formattedDepartureDate = departureDate
    ? formatWithTimezone(departureDate)
    : "";

  const formattedReturnDate = returnDate ? formatWithTimezone(returnDate) : "";

  // Handle date selection from carousel
  const handleDateSelect = (date: string) => {
    // Create new URLSearchParams with the updated date
    const params = new URLSearchParams(searchParams.toString());
    params.set("departureDate", date);

    // Update the URL with the new date
    router.push(`/results?${params.toString()}`);

    // Reset trips and show loading state
    setTrips([]);
    setLoading(true);
  };

  // Handle trip selection
  const handleSelectTrip = (trip: Trip) => {
    // Create URL parameters for checkout
    const params = new URLSearchParams();
    params.append("tripId", trip.id);
    params.append("origin", trip.origin);
    params.append("destination", trip.destination);
    params.append("departureDate", departureDate);
    params.append("departureTime", trip.departureTime);
    params.append("arrivalTime", trip.arrivalTime);
    params.append("duration", trip.duration.toString());
    params.append("price", trip.price.toString());
    params.append("passengers", passengers);
    params.append("busType", trip.busType);

    // Navigate to checkout page
    router.push(`/checkout?${params.toString()}`);
  };

  // Generate mock trip data based on search parameters
  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      const mockTrips = generateMockTrips(origin, destination, departureDate);
      setTrips(mockTrips);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [origin, destination, departureDate]);

  // Helper function to generate mock trips
  function generateMockTrips(
    origin: string,
    destination: string,
    date: string
  ): Trip[] {
    const baseDate = parseISO(date);
    const startHours = [6, 8, 10, 12, 14, 16, 18];

    return startHours.map((hour, index) => {
      const departureTime = new Date(baseDate);
      departureTime.setHours(hour, Math.floor(Math.random() * 60), 0);

      const duration = 30 + Math.floor(Math.random() * 40); // 30-70 minutes
      const arrivalTime = addMinutes(departureTime, duration);

      const amenities = [];
      if (Math.random() > 0.3) amenities.push("wifi");
      if (Math.random() > 0.5) amenities.push("usb");
      if (Math.random() > 0.7) amenities.push("refreshments");

      return {
        id: `trip-${index}`,
        origin: formatLocation(origin),
        destination: formatLocation(destination),
        departureTime: format(departureTime, "HH:mm"),
        arrivalTime: format(arrivalTime, "HH:mm"),
        duration,
        price: 15 + Math.floor(Math.random() * 20), // $15-35
        availableSeats: 5 + Math.floor(Math.random() * 25), // 5-30 seats
        busType: Math.random() > 0.5 ? "Express" : "Standard",
        amenities,
      };
    });
  }

  // Helper to format location names
  function formatLocation(location: string): string {
    return location.charAt(0).toUpperCase() + location.slice(1);
  }

  // Helper to format duration
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-8">
        {/* Back button and search summary */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>

          <div className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="flex items-center text-2xl font-bold text-blue-800 font-display mb-2">
                  {formatLocation(origin)}
                  <ArrowRight className="mx-2 h-6 w-6 self-center text-blue-800" />
                  {formatLocation(destination)}
                </h1>

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDepartureDate}</span>
                  <span>•</span>
                  <Users className="h-4 w-4" />
                  <span>
                    {passengers}{" "}
                    {Number.parseInt(passengers) === 1
                      ? "Pasajero"
                      : "Pasajeros"}
                  </span>
                </div>
                {tripType === "round-trip" && returnDate && (
                  <div className="mt-2 text-gray-600">
                    <span className="font-medium">Vuelta:</span>{" "}
                    {formattedReturnDate}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Date Carousel */}
        <div className="mb-6">
          <DateCarousel
            selectedDate={departureDate}
            onDateSelect={handleDateSelect}
            className="bg-white rounded-lg border shadow-sm p-4"
          />
        </div>

        {/* Trip results */}
        <div className="mb-8">
          <Tabs defaultValue="outbound">
            <TabsList className="mb-4">
              <TabsTrigger value="outbound">Ida</TabsTrigger>
              {tripType === "round-trip" && returnDate && (
                <TabsTrigger value="return">Vuelta</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="outbound" className="mt-0">
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 bg-blue-50 border-b">
                  <h2 className="font-display font-bold text-lg text-blue-800">
                    Reservas Disponibles: {formatLocation(origin)} →{" "}
                    {formatLocation(destination)}
                  </h2>
                  <p className="text-sm text-blue-700">
                    {formattedDepartureDate}
                  </p>
                </div>

                {loading ? (
                  <div className="p-8 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                    <p className="mt-4 text-gray-600">
                      Buscando viajes disponibles
                    </p>
                  </div>
                ) : trips.length === 0 ? (
                  <div className="p-8 text-center">
                    <Info className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay viajes disponibles
                    </h3>
                    <p className="text-gray-600">
                      No encontramos ningún viaje que coincida con tus criterios
                      de búsqueda. Prueba con otras fechas o ubicaciones.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                      {trips.map((trip) => (
                        <div
                          key={trip.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="grid md:grid-cols-4 gap-4">
                            {/* Time and route */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-2xl font-bold text-blue-900">
                                  {trip.departureTime}
                                </div>
                                <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
                                <div className="text-2xl font-bold text-blue-900">
                                  {trip.arrivalTime}
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{formatDuration(trip.duration)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1 text-sm">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  <span className="text-gray-700">
                                    {trip.origin}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-blue-600" />
                                  <span className="text-gray-700">
                                    {trip.destination}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-sm"></div>
                            </div>

                            {/* Bus details */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Bus className="h-5 w-5 text-blue-600" />
                                <span className="font-medium">
                                  {trip.busType} Bus
                                </span>
                                {trip.busType === "Express" && (
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    Express
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                Cantidad disponible:
                                <span className="font-medium">
                                  {trip.availableSeats}
                                </span>{" "}
                              </div>
                            </div>

                            {/* Price */}
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-sm text-gray-500">
                                Precio por persona
                              </div>
                              <div className="text-2xl font-bold text-blue-800">
                                ${trip.price}
                              </div>
                              <div className="text-sm text-gray-500">
                                Total: $
                                {trip.price * Number.parseInt(passengers)}
                              </div>
                            </div>

                            {/* Action */}
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleSelectTrip(trip)}
                              >
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

            {tripType === "round-trip" && returnDate && (
              <TabsContent value="return" className="mt-0">
                <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Return Journey
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {formatLocation(destination)} to {formatLocation(origin)} on{" "}
                    {formattedReturnDate}
                  </p>
                  <p className="text-blue-600">
                    Please select your outbound journey first to view available
                    return options.
                  </p>
                </div>
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
      </main>
      <Footer />
    </div>
  );
}
