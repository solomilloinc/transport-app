'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, ArrowDown } from 'lucide-react';
import { getTripById } from '@/services/trip';
import { Trip, PickupOption, DropoffCityOption, DropoffDirectionOption } from '@/interfaces/trip';

export interface LocationSelectionData {
    pickupDirectionId: number | null;
    dropoffCityId: number | null;
    dropoffDirectionId: number | null;
    dropoffPrice: number;
}

interface LocationSelectorProps {
    tripId: number;
    reserveId: number;
    isRoundTrip: boolean;
    onSelectionChange: (data: LocationSelectionData) => void;
    initialData?: LocationSelectionData;
}

export function LocationSelector({
    tripId,
    reserveId,
    isRoundTrip,
    onSelectionChange,
    initialData,
}: LocationSelectorProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tripData, setTripData] = useState<Trip | null>(null);

    // Selection state
    const [selectedPickupId, setSelectedPickupId] = useState<string>(
        initialData?.pickupDirectionId?.toString() || ''
    );
    const [selectedDropoffCityId, setSelectedDropoffCityId] = useState<string>(
        initialData?.dropoffCityId?.toString() || ''
    );
    const [selectedDropoffDirectionId, setSelectedDropoffDirectionId] = useState<string>(
        initialData?.dropoffDirectionId?.toString() || ''
    );

    // Get the appropriate dropoff options based on trip type
    const dropoffOptions = isRoundTrip
        ? tripData?.DropoffOptionsIdaVuelta || []
        : tripData?.DropoffOptionsIda || [];

    // Get the selected city's directions
    const selectedCity = dropoffOptions.find(
        (city) => city.cityId.toString() === selectedDropoffCityId
    );
    const dropoffDirections = selectedCity?.directions || [];

    // Load trip data
    useEffect(() => {
        async function loadTripData() {
            try {
                setLoading(true);
                setError(null);
                const data = await getTripById(tripId, reserveId);
                setTripData(data);

                // If round trip, auto-select the only dropoff option (main destination)
                if (isRoundTrip && data.DropoffOptionsIdaVuelta?.length === 1) {
                    const mainDest = data.DropoffOptionsIdaVuelta[0];
                    setSelectedDropoffCityId(mainDest.cityId.toString());
                }
            } catch (err) {
                console.error('Error loading trip data:', err);
                setError('Error al cargar las opciones de ubicación');
            } finally {
                setLoading(false);
            }
        }

        if (tripId && reserveId) {
            loadTripData();
        }
    }, [tripId, reserveId, isRoundTrip]);

    // Notify parent when selection changes
    useEffect(() => {
        const dropoffPrice = selectedCity?.price || 0;

        onSelectionChange({
            pickupDirectionId: selectedPickupId ? Number(selectedPickupId) : null,
            dropoffCityId: selectedDropoffCityId ? Number(selectedDropoffCityId) : null,
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
                        {tripData?.PickupOptions?.map((option) => (
                            <SelectItem key={option.directionId} value={option.directionId.toString()}>
                                {option.displayName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                        setSelectedDropoffDirectionId(''); // Reset direction when city changes
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
                        Punto de Bajada (opcional)
                    </Label>
                    <Select value={selectedDropoffDirectionId} onValueChange={setSelectedDropoffDirectionId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona punto específico (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Sin especificar</SelectItem>
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
