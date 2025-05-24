"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroSection() {
  const router = useRouter();
  const [tripType, setTripType] = useState("one-way");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers] = useState("1");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Build query parameters
    const params = new URLSearchParams();
    params.append("origin", origin);
    params.append("destination", destination);
    params.append("tripType", tripType);
    params.append("passengers", passengers);

    if (departureDate) {
      params.append("departureDate", format(departureDate, "yyyy-MM-dd"));
    }

    if (tripType === "round-trip" && returnDate) {
      params.append("returnDate", format(returnDate, "yyyy-MM-dd"));
    }

    // Navigate to results page with query parameters
    router.push(`/results?${params.toString()}`);
  };

  return (
    <section className="relative">
      <div className="absolute inset-0 z-0">
        <Image
          src="/placeholder.svg?height=800&width=1920"
          alt="Transportation"
          fill
          className="object-cover brightness-[0.7]"
          priority
        />
      </div>

      <div className="container relative z-10 py-10 md:py-16 lg:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Hero text */}
          <div className="text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl font-display">
              Safe Journeys with a Family Touch
            </h1>
            <p className="mt-4 text-lg md:text-xl">
              Providing reliable and comfortable short-distance transportation
              for over 25 years. Where every passenger is treated like family.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Book Your Trip
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Right side - Search form */}
          <div>
            <Card className="border-blue-100 shadow-lg bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <h2 className="text-xl font-bold text-blue-800 mb-4 font-display">
                  Busca tu pasaje
                </h2>
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">
                        Tipo
                      </label>
                      <RadioGroup
                        defaultValue="one-way"
                        className="flex gap-4"
                        value={tripType}
                        onValueChange={setTripType}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="one-way" id="one-way" />
                          <label
                            htmlFor="one-way"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Ida
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="round-trip" id="round-trip" />
                          <label
                            htmlFor="round-trip"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Ida y vuelta
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-900">
                          Desde
                        </label>
                        <Select
                          value={origin}
                          onValueChange={setOrigin}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Origen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lobos">Lobos</SelectItem>
                            <SelectItem value="Capital Federal">
                              Capital Federal
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-900">
                          Hasta
                        </label>
                        <Select
                          value={destination}
                          onValueChange={setDestination}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Destino" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lobos">Lobos</SelectItem>
                            <SelectItem value="Capital Federal">
                              Capital Federal
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-blue-900">
                          Fecha Ida
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal border-input"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {departureDate ? (
                                format(departureDate, "PPP")
                              ) : (
                                <span>Select date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={departureDate}
                              onSelect={setDepartureDate}
                              initialFocus
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {tripType === "round-trip" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-900">
                            Feha Vuelta
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal border-input"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {returnDate ? (
                                  format(returnDate, "PPP")
                                ) : (
                                  <span>Seleccionar fecha</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={returnDate}
                                onSelect={setReturnDate}
                                initialFocus
                                disabled={(date) =>
                                  date <
                                    new Date(new Date().setHours(0, 0, 0, 0)) ||
                                  (departureDate ? date < departureDate : false)
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">
                        Pasajeros
                      </label>
                      <Select value={passengers} onValueChange={setPassengers}>
                        <SelectTrigger>
                          <SelectValue placeholder="Number of passengers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Pasajero</SelectItem>
                          <SelectItem value="2">2 Pasajeros</SelectItem>
                          <SelectItem value="3">3 Pasajeros</SelectItem>
                          <SelectItem value="4">4 Pasajeros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Buscar
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
