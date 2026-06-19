'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, ArrowDown } from 'lucide-react';
import { DropoffDirectionOption } from '@/interfaces/trip';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { useTrip } from '@/hooks/queries/use-trip';

export interface LocationSelectionData {
    pickupDirectionId: number | null;
    dropoffCityId: number | null;
    dropoffCityName: string | null;
    dropoffDirectionId: number | null;
    dropoffPrice: number;
}

interface LocationSelectorProps {
    tripId: number;
    reserveId: number;
    isRoundTrip: boolean;
    // Which price table to display. Computed by the parent from the tenant's
    // same-day rule + outbound/return dates. When the booking is one-way this
    // is forced to false. See utils/pricing.ts → shouldUseIdaVueltaTariff.
    useIdaVueltaTariff: boolean;
    onSelectionChange: (data: LocationSelectionData) => void;
    initialData?: LocationSelectionData;
    departureHour?: string;
}

function addTimeOffset(departureHour: string, offset: string): string {
    const [dh, dm] = departureHour.split(':').map(Number);
    const [oh, om] = offset.split(':').map(Number);
    let totalMinutes = dh * 60 + dm + oh * 60 + om;
    return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

export function LocationSelector({
    tripId,
    reserveId,
    isRoundTrip,
    useIdaVueltaTariff,
    onSelectionChange,
    initialData,
    departureHour,
}: LocationSelectorProps) {
    // Carril 2 (ver docs/adr/0006): la lectura del trip va por React Query.
    // `staleTime` por default del provider (60s) basta para no refetchear al
    // re-montar durante el checkout. La data es por-reserva (incluye reserveId),
    // así que la key incluye reserveId y no se mezcla entre reservas.
    const { data: tripData, isLoading: loading, error: queryError } = useTrip(tripId, reserveId, {
        enabled: !!tripId && !!reserveId,
    });
    const error = queryError ? getApiErrorMessage(queryError).message : null;

    const [selectedPickupId, setSelectedPickupId] = useState<string>(
        initialData?.pickupDirectionId?.toString() || ''
    );
    const [selectedDropoffCityId, setSelectedDropoffCityId] = useState<string>(
        initialData?.dropoffCityId?.toString() || ''
    );
    const [selectedDropoffDirectionId, setSelectedDropoffDirectionId] = useState<string>(
        initialData?.dropoffDirectionId?.toString() || ''
    );

    const dropoffOptions = useIdaVueltaTariff
        ? tripData?.dropoffOptionsIdaVuelta || []
        : tripData?.dropoffOptionsIda || [];

    const selectedCity = dropoffOptions.find(
        (city) => city.cityId?.toString() === selectedDropoffCityId
    );

    const getDropoffDirections = (): DropoffDirectionOption[] => {
        if (selectedCity?.directions && selectedCity.directions.length > 0) {
            return selectedCity.directions;
        }
        if (selectedDropoffCityId && tripData?.relevantCities) {
            const relevantCity = tripData.relevantCities.find(
                (city) => city.cityId?.toString() === selectedDropoffCityId
            );
            if (relevantCity?.directions) {
                return relevantCity.directions.map((dir) => ({
                    directionId: dir.directionId,
                    displayName: dir.name,
                }));
            }
        }
        return [];
    };
    const dropoffDirections = getDropoffDirections();

    // Auto-select main destination when there is only one IdaVuelta option.
    // Derivado de la data de React Query (en vez de hacerlo dentro del fetch).
    useEffect(() => {
        if (useIdaVueltaTariff && tripData?.dropoffOptionsIdaVuelta?.length === 1) {
            const mainDest = tripData.dropoffOptionsIdaVuelta[0];
            setSelectedDropoffCityId(mainDest.cityId.toString());
        }
    }, [tripData, useIdaVueltaTariff]);

    useEffect(() => {
        const dropoffPrice = selectedCity?.price || 0;
        const dropoffCityName = selectedCity?.cityName || null;

        onSelectionChange({
            pickupDirectionId: selectedPickupId ? Number(selectedPickupId) : null,
            dropoffCityId: selectedDropoffCityId ? Number(selectedDropoffCityId) : null,
            dropoffCityName,
            dropoffDirectionId: selectedDropoffDirectionId ? Number(selectedDropoffDirectionId) : null,
            dropoffPrice,
        });
    }, [selectedPickupId, selectedDropoffCityId, selectedDropoffDirectionId, selectedCity]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Pickup Location */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-800">
                    <MapPin className="h-4 w-4" />
                    Punto de Subida
                </Label>
                <Select value={selectedPickupId} onValueChange={setSelectedPickupId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona dónde subir" />
                    </SelectTrigger>
                    <SelectContent>
                        {tripData?.pickupOptions?.map((option) => (
                            <SelectItem key={option.directionId} value={option.directionId.toString()}>
                                {option.displayName}
                                {option.pickupTimeOffset ? ` (+${option.pickupTimeOffset.substring(0, 5)})` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedPickupId && departureHour && (() => {
                    const selectedOption = tripData?.pickupOptions?.find(
                        (o) => o.directionId.toString() === selectedPickupId
                    );
                    if (selectedOption?.pickupTimeOffset) {
                        const estimatedTime = addTimeOffset(departureHour, selectedOption.pickupTimeOffset);
                        return (
                            <p className="text-xs text-gray-500">
                                Hora estimada de subida: <span className="font-medium text-blue-600">{estimatedTime}</span>
                            </p>
                        );
                    }
                    return null;
                })()}
            </div>

            {/* Dropoff City */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-blue-800">
                    <ArrowDown className="h-4 w-4" />
                    Ciudad de Bajada
                    {isRoundTrip && (
                        <span className="text-xs text-amber-600 font-normal">
                            (Solo destino final para Ida y Vuelta)
                        </span>
                    )}
                </Label>
                <Select
                    value={selectedDropoffCityId}
                    onValueChange={(value) => {
                        setSelectedDropoffCityId(value);
                        setSelectedDropoffDirectionId('');
                    }}
                    disabled={isRoundTrip && dropoffOptions.length === 1}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecciona ciudad de bajada" />
                    </SelectTrigger>
                    <SelectContent>
                        {dropoffOptions.map((city) => (
                            <SelectItem key={city.cityId} value={city.cityId.toString()}>
                                <div className="flex justify-between items-center w-full">
                                    <span>{city.cityName}</span>
                                    <span className="text-blue-600 font-medium ml-4">
                                        ${city.price.toLocaleString('es-AR')}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedCity && (
                    <p className="text-xs text-gray-500">
                        Precio por persona: <span className="font-medium text-blue-600">${selectedCity.price.toLocaleString('es-AR')}</span>
                    </p>
                )}
            </div>

            {/* Dropoff Direction (only if city is selected and has directions) */}
            {selectedDropoffCityId && dropoffDirections.length > 0 && (
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-blue-800">
                        <MapPin className="h-4 w-4" />
                        Punto de Bajada
                    </Label>
                    <Select value={selectedDropoffDirectionId} onValueChange={setSelectedDropoffDirectionId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona punto específico (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {dropoffDirections.map((dir) => (
                                <SelectItem key={dir.directionId} value={dir.directionId.toString()}>
                                    {dir.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}
