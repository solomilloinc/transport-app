'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, CalendarIcon, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { TripSelectOption } from '@/app/page';
import { useTenant } from '@/contexts/TenantContext';

export function HeroSection({ trips }: { trips: TripSelectOption[] }) {
  const router = useRouter();
  const [tripType, setTripType] = useState('OneWay');
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedPickupDirectionId, setSelectedPickupDirectionId] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedTrip = useMemo(() => trips.find((trip) => trip.value === selectedTripId), [trips, selectedTripId]);

  useEffect(() => {
    setSelectedPickupDirectionId('');
  }, [selectedTripId]);

  const returnTrip = useMemo(() => {
    if (!selectedTrip) return null;

    return trips.find(
      (trip) =>
        trip.originCityId === selectedTrip.destinationCityId &&
        trip.destinationCityId === selectedTrip.originCityId
    );
  }, [trips, selectedTrip]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!selectedTripId) {
      newErrors.trip = 'Debes seleccionar una ruta.';
    }
    if (!departureDate) {
      newErrors.departureDate = 'La fecha de ida es requerida.';
    }
    if (tripType === 'RoundTrip' && !returnDate) {
      newErrors.returnDate = 'La fecha de vuelta es requerida.';
    }
    if (tripType === 'RoundTrip' && !returnTrip) {
      newErrors.trip = 'No hay ruta de vuelta disponible para esta seleccion.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    if (!selectedTrip) {
      return;
    }

    const params = new URLSearchParams();
    params.append('tripId', selectedTrip.id.toString());
    params.append('originName', selectedTrip.originCityName);
    params.append('destinationName', selectedTrip.destinationCityName);
    params.append('tripType', tripType);
    params.append('passengers', passengers);

    if (departureDate) {
      params.append('departureDate', format(departureDate, 'yyyy-MM-dd'));
    }

    if (tripType === 'RoundTrip' && returnDate && returnTrip) {
      params.append('returnDate', format(returnDate, 'yyyy-MM-dd'));
      params.append('returnTripId', returnTrip.id.toString());
    }

    if (selectedPickupDirectionId) {
      params.append('pickupDirectionId', selectedPickupDirectionId);
    }

    router.push(`/results?${params.toString()}`);
  };

  const { landing, images } = useTenant();

  return (
    <section className="relative overflow-hidden px-3 pb-8 pt-5 sm:px-4 sm:pb-12 sm:pt-8">
      <div className="absolute inset-0 z-0 rounded-[2rem]">
        <Image
          src={images.heroBackground || '/background.jpg'}
          alt="Hero background"
          fill
          className="object-cover brightness-[0.55] saturate-[0.9]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,23,45,0.9),rgba(13,53,110,0.76)_45%,rgba(56,189,248,0.24))]" />
        <div className="route-grid absolute inset-0 opacity-20 mix-blend-soft-light" />
        <div className="absolute -left-16 top-16 h-56 w-56 rounded-full bg-sky-300/14 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-blue-300/18 blur-3xl" />
      </div>

      <div className="container relative z-10 py-8 md:py-14 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              reserva directa y simple
            </div>
            <h1 className="mt-6 text-4xl leading-[0.95] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl font-display">
              {landing.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 md:text-xl">
              {landing.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full bg-[linear-gradient(135deg,#38bdf8,#2563eb)] px-7 text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] hover:opacity-95">
                {landing.hero.ctaPrimary}
              </Button>
              <Button size="lg" variant="outline" className="rounded-full border-white/25 bg-white/10 px-7 text-white hover:bg-white/15 backdrop-blur-sm">
                {landing.hero.ctaSecondary}
              </Button>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">salidas</div>
                <div className="mt-1 font-medium">Rutas activas y claras</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">compra</div>
                <div className="mt-1 font-medium">Pago seguro y directo</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">asistencia</div>
                <div className="mt-1 font-medium">Soporte humano cuando hace falta</div>
              </div>
            </div>
          </div>

          <div className="section-shell">
            <Card className="glass-panel overflow-hidden rounded-[1.75rem] border-0">
              <CardContent className="p-0">
                <div className="border-b border-sky-100/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(240,248,255,0.9))] px-5 py-5 sm:px-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">planifica tu salida</p>
                      <h2 className="mt-2 text-2xl text-slate-900 font-display">Busca tu pasaje</h2>
                    </div>
                    <div className="hidden rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 sm:flex sm:items-center sm:gap-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      pago protegido
                    </div>
                  </div>
                </div>
                <form onSubmit={handleSearch} className="space-y-4 p-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Tipo</label>
                      <RadioGroup defaultValue="OneWay" className="grid grid-cols-2 gap-3" value={tripType} onValueChange={setTripType}>
                        <div className="flex items-center space-x-2 rounded-2xl border border-sky-100/80 bg-[rgba(248,251,255,0.96)] px-4 py-3">
                          <RadioGroupItem value="OneWay" id="OneWay" />
                          <label htmlFor="OneWay" className="text-sm font-medium leading-none text-slate-700">
                            Ida
                          </label>
                        </div>
                        <div className="flex items-center space-x-2 rounded-2xl border border-sky-100/80 bg-[rgba(248,251,255,0.96)] px-4 py-3">
                          <RadioGroupItem value="RoundTrip" id="RoundTrip" />
                          <label htmlFor="RoundTrip" className="text-sm font-medium leading-none text-slate-700">
                            Ida y vuelta
                          </label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Ruta</label>
                      <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                        <SelectTrigger className="h-12 rounded-2xl border-sky-100/80 bg-[rgba(248,251,255,0.96)]">
                          <SelectValue placeholder="Selecciona tu ruta" />
                        </SelectTrigger>
                        <SelectContent>
                          {trips.map((trip) => (
                            <SelectItem key={trip.id} value={trip.value}>
                              {trip.label}
                              {trip.priceFrom && (
                                <span className="ml-2 text-muted-foreground">
                                  (desde ${trip.priceFrom.toLocaleString()})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.trip && <p className="mt-1 text-xs text-red-500">{errors.trip}</p>}
                      {tripType === 'RoundTrip' && selectedTrip && (
                        <div className="mt-1 text-xs text-slate-600">
                          {returnTrip ? (
                            <>Vuelta disponible: {returnTrip.label}</>
                          ) : (
                            <span className="text-sky-700">No hay ruta de vuelta disponible</span>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedTrip && selectedTrip.stopSchedules.length > 0 && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-1 text-sm font-medium text-slate-800">
                          <MapPin className="h-3.5 w-3.5" />
                          Punto de subida
                        </label>
                        <Select value={selectedPickupDirectionId} onValueChange={setSelectedPickupDirectionId}>
                          <SelectTrigger className="h-12 rounded-2xl border-sky-100/80 bg-[rgba(248,251,255,0.96)]">
                            <SelectValue placeholder="Selecciona donde subir (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTrip.stopSchedules.map((stop) => (
                              <SelectItem key={stop.DirectionId} value={stop.DirectionId.toString()}>
                                {stop.DirectionName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className={`grid gap-3 ${tripType === 'RoundTrip' ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-800">Fecha ida</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-12 w-full justify-start rounded-2xl border-sky-100/80 bg-[rgba(248,251,255,0.96)] text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {departureDate ? format(departureDate, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              locale={es}
                              mode="single"
                              selected={departureDate}
                              onSelect={setDepartureDate}
                              initialFocus
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            />
                          </PopoverContent>
                        </Popover>
                        {errors.departureDate && <p className="mt-1 text-xs text-red-500">{errors.departureDate}</p>}
                      </div>

                      {tripType === 'RoundTrip' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-800">Fecha vuelta</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="h-12 w-full justify-start rounded-2xl border-sky-100/80 bg-[rgba(248,251,255,0.96)] text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {returnDate ? format(returnDate, 'PPP', { locale: es }) : <span>Seleccionar fecha</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                locale={es}
                                mode="single"
                                selected={returnDate}
                                onSelect={setReturnDate}
                                initialFocus
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0)) || (departureDate ? date < departureDate : false)
                                }
                              />
                            </PopoverContent>
                          </Popover>
                          {errors.returnDate && <p className="mt-1 text-xs text-red-500">{errors.returnDate}</p>}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-800">Pasajeros</label>
                      <Select value={passengers} onValueChange={setPassengers}>
                        <SelectTrigger className="h-12 rounded-2xl border-sky-100/80 bg-[rgba(248,251,255,0.96)]">
                          <SelectValue placeholder="Cantidad de pasajeros" />
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

                  <Button type="submit" className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#0f3f8f,#2563eb,#38bdf8)] text-white hover:opacity-95">
                    Buscar disponibilidad
                    <ArrowRight className="ml-2 h-4 w-4" />
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
