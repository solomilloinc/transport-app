'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, ArrowDown } from 'lucide-react';
import { getTripById } from '@/services/trip';
import { Trip } from '@/interfaces/trip';

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
  onSelectionChange: (data: LocationSelectionData) => void;
  initialData?: LocationSelectionData;
  departureHour?: string;
}

function addTimeOffset(departureHour: string, offset: string): string {
  const [dh, dm] = departureHour.split(':').map(Number);
  const [oh, om] = offset.split(':').map(Number);
  const totalMinutes = dh * 60 + dm + oh * 60 + om;

  return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

export function LocationSelector({
  tripId,
  reserveId,
  isRoundTrip,
  onSelectionChange,
  initialData,
  departureHour,
}: LocationSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState<Trip | null>(null);

  const [selectedPickupId, setSelectedPickupId] = useState<string>(
    initialData?.pickupDirectionId?.toString() || ''
  );
  const [selectedDropoffCityId, setSelectedDropoffCityId] = useState<string>(
    initialData?.dropoffCityId?.toString() || ''
  );
  const [selectedDropoffDirectionId, setSelectedDropoffDirectionId] = useState<string>(
    initialData?.dropoffDirectionId?.toString() || ''
  );

  const dropoffOptions = isRoundTrip
    ? tripData?.DropoffOptionsIdaVuelta || []
    : tripData?.DropoffOptionsIda || [];

  const selectedCity = dropoffOptions.find(
    (city) => city.CityId?.toString() === selectedDropoffCityId
  );

  const getDropoffDirections = () => {
    if (selectedCity?.Directions && selectedCity.Directions.length > 0) {
      return selectedCity.Directions;
    }

    if (selectedDropoffCityId && tripData?.RelevantCities) {
      const relevantCity = tripData.RelevantCities.find(
        (city) => city.CityId?.toString() === selectedDropoffCityId
      );

      if (relevantCity?.Directions) {
        return relevantCity.Directions.map((dir) => ({
          DirectionId: dir.DirectionId,
          DisplayName: dir.Name,
        }));
      }
    }

    return [];
  };

  const dropoffDirections = getDropoffDirections();

  useEffect(() => {
    async function loadTripData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTripById(tripId, reserveId);
        setTripData(data);

        if (isRoundTrip && data.DropoffOptionsIdaVuelta?.length === 1) {
          const mainDest = data.DropoffOptionsIdaVuelta[0];
          setSelectedDropoffCityId(mainDest.CityId.toString());
        }
      } catch {
        setError('Error al cargar las opciones de ubicación');
      } finally {
        setLoading(false);
      }
    }

    if (tripId && reserveId) {
      loadTripData();
    }
  }, [tripId, reserveId, isRoundTrip]);

  useEffect(() => {
    const dropoffPrice = selectedCity?.Price || 0;
    const dropoffCityName = selectedCity?.CityName || null;

    onSelectionChange({
      pickupDirectionId: selectedPickupId ? Number(selectedPickupId) : null,
      dropoffCityId: selectedDropoffCityId ? Number(selectedDropoffCityId) : null,
      dropoffCityName,
      dropoffDirectionId: selectedDropoffDirectionId ? Number(selectedDropoffDirectionId) : null,
      dropoffPrice,
    });
  }, [selectedPickupId, selectedDropoffCityId, selectedDropoffDirectionId, selectedCity, onSelectionChange]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 rounded-xl bg-sky-100" />
        <div className="h-10 rounded-xl bg-sky-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[1.4rem] border border-sky-100 bg-white/80 p-4 shadow-sm">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-blue-800">
          <MapPin className="h-4 w-4" />
          Punto de Subida
        </Label>
        <Select value={selectedPickupId} onValueChange={setSelectedPickupId}>
          <SelectTrigger className="border-sky-100 bg-white">
            <SelectValue placeholder="Selecciona dónde subir" />
          </SelectTrigger>
          <SelectContent>
            {tripData?.PickupOptions?.map((option) => (
              <SelectItem key={option.DirectionId} value={option.DirectionId.toString()}>
                {option.DisplayName}
                {option.PickupTimeOffset ? ` (+${option.PickupTimeOffset.substring(0, 5)})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPickupId && departureHour && (() => {
          const selectedOption = tripData?.PickupOptions?.find(
            (o) => o.DirectionId.toString() === selectedPickupId
          );
          if (selectedOption?.PickupTimeOffset) {
            const estimatedTime = addTimeOffset(departureHour, selectedOption.PickupTimeOffset);
            return (
              <p className="text-xs text-gray-500">
                Hora estimada de subida: <span className="font-medium text-blue-600">{estimatedTime}</span>
              </p>
            );
          }
          return null;
        })()}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-blue-800">
          <ArrowDown className="h-4 w-4" />
          Ciudad de Bajada
          {isRoundTrip && (
            <span className="text-xs font-normal text-amber-600">
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
          <SelectTrigger className="border-sky-100 bg-white">
            <SelectValue placeholder="Selecciona ciudad de bajada" />
          </SelectTrigger>
          <SelectContent>
            {dropoffOptions.map((city) => (
              <SelectItem key={city.CityId} value={city.CityId.toString()}>
                <div className="flex w-full items-center justify-between">
                  <span>{city.CityName}</span>
                  <span className="ml-4 font-medium text-blue-600">
                    ${city.Price.toLocaleString('es-AR')}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedDropoffCityId && dropoffDirections.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-blue-800">
            <MapPin className="h-4 w-4" />
            Dirección de Bajada
          </Label>
          <Select value={selectedDropoffDirectionId} onValueChange={setSelectedDropoffDirectionId}>
            <SelectTrigger className="border-sky-100 bg-white">
              <SelectValue placeholder="Selecciona dirección de bajada" />
            </SelectTrigger>
            <SelectContent>
              {dropoffDirections.map((direction) => (
                <SelectItem key={direction.DirectionId} value={direction.DirectionId.toString()}>
                  {direction.DisplayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
