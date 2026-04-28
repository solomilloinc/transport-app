'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, ArrowDown } from 'lucide-react';
import { getTripById } from '@/services/trip';
import { DropoffCityOption, Trip } from '@/interfaces/trip';
import { estimatedPickupFromDeparture } from '@/utils/pickup-display-time';
import { cn } from '@/lib/utils';

export interface LocationSelectionData {
  pickupDirectionId: number | null;
  /** Etiqueta de la parada de subida (UI / resultados). */
  pickupDirectionName?: string | null;
  /** Hora estimada en reloj (HH:mm) según salida del servicio y offset de la parada. */
  pickupEstimatedTime?: string | null;
  dropoffCityId: number | null;
  dropoffCityName: string | null;
  /** Trip price row id for the selected city (preferred for quoting/charging). */
  dropoffTripPriceId: number | null;
  dropoffDirectionId: number | null;
  dropoffPrice: number;
}

export type LocationSelectorVariant = 'full' | 'dropoffOnly';

interface LocationSelectorProps {
  tripId: number;
  reserveId: number;
  isRoundTrip: boolean;
  onSelectionChange: (data: LocationSelectionData) => void;
  initialData?: LocationSelectionData;
  departureHour?: string;
  /** `dropoffOnly`: sin UI de subida (viene de la búsqueda o se elige la primera opción válida). Solo bajada + precios. */
  variant?: LocationSelectorVariant;
  /** Fila compacta para listados (p. ej. /results), alineada con horario y precio */
  compact?: boolean;
}

function directionsForCity(city: DropoffCityOption, tripData: Trip | null): { DirectionId: number; DisplayName: string }[] {
  if (city.Directions && city.Directions.length > 0) {
    return city.Directions.map((d) => ({ DirectionId: d.DirectionId, DisplayName: d.DisplayName }));
  }
  const relevant = tripData?.RelevantCities?.find((c) => c.CityId === city.CityId);
  if (relevant?.Directions?.length) {
    return relevant.Directions.map((d) => ({ DirectionId: d.DirectionId, DisplayName: d.Name }));
  }
  return [];
}

export function LocationSelector({
  tripId,
  reserveId,
  isRoundTrip,
  onSelectionChange,
  initialData,
  departureHour,
  variant = 'full',
  compact = false,
}: LocationSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripData, setTripData] = useState<Trip | null>(null);

  const [selectedPickupId, setSelectedPickupId] = useState<string>(
    initialData?.pickupDirectionId?.toString() || '',
  );
  const [selectedDropoffCityId, setSelectedDropoffCityId] = useState<string>(
    initialData?.dropoffCityId?.toString() || '',
  );
  const [selectedDropoffDirectionId, setSelectedDropoffDirectionId] = useState<string>(
    initialData?.dropoffDirectionId?.toString() || '',
  );

  const dropoffOptions = tripData?.DropoffOptionsIda || [];
  const DEFAULT_DROP_SENTINEL = '__default__';
  const isDropoffOnly = variant === 'dropoffOnly';

  const mainDropoffCity = useMemo(() => {
    if (!tripData) return null;
    const flagged = dropoffOptions.find((c) => c.IsMainDestination);
    if (flagged) return flagged;
    if (tripData.DestinationCityId) {
      const byDest = dropoffOptions.find((c) => c.CityId === tripData.DestinationCityId);
      if (byDest) return byDest;
    }
    return dropoffOptions[0] ?? null;
  }, [tripData, dropoffOptions]);

  const effectiveDropoffCity = useMemo(() => {
    if (selectedDropoffCityId) {
      return dropoffOptions.find((city) => city.CityId?.toString() === selectedDropoffCityId) ?? null;
    }
    return mainDropoffCity;
  }, [selectedDropoffCityId, dropoffOptions, mainDropoffCity]);

  const selectedCity = effectiveDropoffCity;

  const getDropoffDirections = () => {
    if (selectedCity?.Directions && selectedCity.Directions.length > 0) {
      return selectedCity.Directions;
    }
    const cityIdForDirections = selectedCity?.CityId?.toString();
    if (cityIdForDirections && tripData?.RelevantCities) {
      const relevantCity = tripData.RelevantCities.find((city) => city.CityId?.toString() === cityIdForDirections);
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

  const flatDropoffRows = useMemo(() => {
    if (!tripData || !isDropoffOnly || !dropoffOptions.length) return [];
    const rows: {
      key: string;
      cityId: number;
      directionId: number | null;
      label: string;
      price: number;
    }[] = [];
    for (const city of dropoffOptions) {
      const dirs = directionsForCity(city, tripData);
      if (dirs.length === 0) {
        rows.push({
          key: `c${city.CityId}`,
          cityId: city.CityId,
          directionId: null,
          label: `${city.CityName} — tramo general`,
          price: city.Price,
        });
      } else {
        for (const d of dirs) {
          rows.push({
            key: `c${city.CityId}-d${d.DirectionId}`,
            cityId: city.CityId,
            directionId: d.DirectionId,
            label: `${d.DisplayName} (${city.CityName})`,
            price: city.Price,
          });
        }
      }
    }
    return rows;
  }, [tripData, isDropoffOnly, dropoffOptions]);

  const useFlatDropoffUI =
    isDropoffOnly && flatDropoffRows.length >= 2 && flatDropoffRows.length <= 28;

  useEffect(() => {
    async function loadTripData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTripById(tripId, reserveId);
        setTripData(data);

        if (data.DropoffOptionsIda?.length === 1) {
          const only = data.DropoffOptionsIda[0];
          setSelectedDropoffCityId(only.CityId.toString());
        }
      } catch (err) {
        console.error('[LocationSelector] Error loading trip data:', err);
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
    if (!tripData || !isDropoffOnly) return;
    const picks = tripData.PickupOptions ?? [];
    if (picks.length === 0) return;

    setSelectedPickupId((prev) => {
      if (prev && picks.some((p) => p.DirectionId.toString() === prev)) return prev;
      const initial = initialData?.pickupDirectionId;
      if (initial != null && picks.some((p) => p.DirectionId === initial)) return String(initial);
      return String(picks[0].DirectionId);
    });
  }, [tripData, isDropoffOnly, initialData?.pickupDirectionId]);

  const firstFlatKey = flatDropoffRows[0]?.key;
  useEffect(() => {
    if (useFlatDropoffUI || flatDropoffRows.length !== 1 || !firstFlatKey) return;
    const only = flatDropoffRows[0];
    setSelectedDropoffCityId(String(only.cityId));
    setSelectedDropoffDirectionId(only.directionId != null ? String(only.directionId) : '');
  }, [useFlatDropoffUI, flatDropoffRows.length, firstFlatKey]);

  const handleFlatDropoffChange = (key: string) => {
    const row = flatDropoffRows.find((r) => r.key === key);
    if (!row) return;
    setSelectedDropoffCityId(String(row.cityId));
    setSelectedDropoffDirectionId(row.directionId != null ? String(row.directionId) : '');
  };

  useEffect(() => {
    const dropoffPrice = selectedCity?.Price || 0;
    const dropoffCityName = selectedCity?.CityName || null;
    const explicitCityId = selectedDropoffCityId ? Number(selectedDropoffCityId) : null;
    const effectiveCityId = selectedCity?.CityId ?? null;
    const tripPriceId = selectedCity?.TripPriceId ?? null;

    let pickupDirectionName: string | null = null;
    let pickupEstimatedTime: string | null = null;
    if (selectedPickupId && tripData?.PickupOptions?.length) {
      const opt = tripData.PickupOptions.find((o) => o.DirectionId.toString() === selectedPickupId);
      if (opt) {
        pickupDirectionName = opt.DisplayName ?? null;
        if (departureHour) {
          pickupEstimatedTime =
            estimatedPickupFromDeparture(departureHour, opt.PickupTimeOffset, true) ?? null;
        }
      }
    }

    onSelectionChange({
      pickupDirectionId: selectedPickupId ? Number(selectedPickupId) : null,
      pickupDirectionName,
      pickupEstimatedTime,
      dropoffCityId: explicitCityId ?? effectiveCityId,
      dropoffCityName,
      dropoffTripPriceId: tripPriceId,
      dropoffDirectionId: selectedDropoffDirectionId ? Number(selectedDropoffDirectionId) : null,
      dropoffPrice,
    });
  }, [selectedPickupId, selectedDropoffCityId, selectedDropoffDirectionId, selectedCity, tripData, departureHour]);

  /** Estilo unificado para selects en listados (/results) — definido antes de los returns condicionales */
  const compactTriggerClass =
    'h-8 text-xs rounded-md border-slate-200/90 bg-white shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus:ring-2 focus:ring-blue-200/60 focus:ring-offset-0 data-[placeholder]:text-slate-400';

  if (loading) {
    return compact ? (
      <div className="h-8 w-full max-w-full rounded-md bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse" />
    ) : (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error) {
    return compact ? (
      <p className="text-xs text-red-700 max-w-full rounded-md border border-red-100 bg-red-50/80 px-2.5 py-2 leading-snug">
        {error}
      </p>
    ) : (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (isDropoffOnly && tripData && (!tripData.PickupOptions || tripData.PickupOptions.length === 0)) {
    return compact ? (
      <p className="text-xs text-amber-900 max-w-full rounded-md border border-amber-100 bg-amber-50/90 px-2.5 py-2 leading-snug">
        Sin puntos de subida para este horario.
      </p>
    ) : (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
        Este servicio no tiene puntos de subida configurados. Probá otro horario o contactá a la empresa.
      </div>
    );
  }

  const priceEsAr = (n: number) =>
    `$${n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const renderPickupBufferNote = () => {
    if (!departureHour || !selectedPickupId || !tripData?.PickupOptions?.length) return null;
    const opt = tripData.PickupOptions.find((o) => o.DirectionId.toString() === selectedPickupId);
    if (!opt) return null;
    const t = estimatedPickupFromDeparture(departureHour, opt.PickupTimeOffset, true);
    if (!t) return null;
    return (
      <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
        Hora estimada de subida: <span className="font-medium text-blue-700">{t}</span>
        <span className="text-gray-400"> (según salida del servicio y la parada elegida)</span>
      </p>
    );
  };

  if (isDropoffOnly && useFlatDropoffUI) {
    const cityIdForFlatMatch = selectedDropoffCityId
      ? Number(selectedDropoffCityId)
      : selectedCity?.CityId ?? 0;
    const flatValue =
      flatDropoffRows.find(
        (r) =>
          r.cityId === cityIdForFlatMatch &&
          (r.directionId == null
            ? !selectedDropoffDirectionId
            : String(r.directionId) === selectedDropoffDirectionId),
      )?.key ?? '';

    return (
      <div className={cn(compact ? 'w-full min-w-0' : 'space-y-4')}>
        <div className={cn(!compact && 'space-y-2')}>
          {!compact && (
            <Label className="flex items-center gap-2 text-blue-800">
              <ArrowDown className="h-4 w-4" />
              Punto de bajada
            </Label>
          )}
          <Select value={flatValue || undefined} onValueChange={handleFlatDropoffChange}>
            <SelectTrigger
              aria-label="Punto de bajada"
              className={cn('w-full', compact && compactTriggerClass)}
            >
              <SelectValue placeholder="Elegí bajada" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(70vh,320px)]">
              {flatDropoffRows.map((row) => (
                <SelectItem key={row.key} value={row.key}>
                  <div className="flex justify-between items-center gap-4 w-full min-w-0">
                    <span className="truncate text-left">{row.label}</span>
                    <span className="text-blue-600 font-medium shrink-0">{priceEsAr(row.price)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!compact && (
            <p className="text-xs text-gray-500">
              Precio referencial por persona; el total lo confirma el cotizador al continuar.
            </p>
          )}
        </div>
        {!compact && renderPickupBufferNote()}
      </div>
    );
  }

  return (
    <div className={cn(compact && isDropoffOnly ? 'w-full min-w-0 space-y-1.5' : 'space-y-4')}>
      <div className={cn(compact && isDropoffOnly ? 'space-y-1.5' : 'space-y-2')}>
        {!compact && (
          <Label className="flex items-center gap-2 text-blue-800">
            <ArrowDown className="h-4 w-4" />
            {isDropoffOnly ? 'Ciudad de bajada' : 'Ciudad de Bajada'}
            {!isDropoffOnly && (
              <span className="text-xs font-normal text-gray-500">(opcional)</span>
            )}
          </Label>
        )}
        <Select
          value={selectedDropoffCityId ? selectedDropoffCityId : DEFAULT_DROP_SENTINEL}
          onValueChange={(value) => {
            if (value === DEFAULT_DROP_SENTINEL) {
              setSelectedDropoffCityId('');
              setSelectedDropoffDirectionId('');
              return;
            }
            setSelectedDropoffCityId(value);
            setSelectedDropoffDirectionId('');
          }}
          disabled={dropoffOptions.length === 1}
        >
          <SelectTrigger
            aria-label="Ciudad de bajada"
            className={cn('w-full', compact && isDropoffOnly && compactTriggerClass)}
          >
            <SelectValue placeholder="Ciudad de bajada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_DROP_SENTINEL}>
              <div className="flex justify-between items-center w-full gap-2">
                <span>Destino principal del servicio</span>
                {mainDropoffCity?.Price != null && (
                  <span className="text-blue-600 font-medium shrink-0">
                    {priceEsAr(mainDropoffCity.Price)}
                  </span>
                )}
              </div>
            </SelectItem>
            {dropoffOptions.map((city) => (
              <SelectItem key={city.CityId} value={city.CityId.toString()}>
                <div className="flex justify-between items-center w-full gap-2">
                  <span className="truncate">{city.CityName}</span>
                  <span className="text-blue-600 font-medium shrink-0">{priceEsAr(city.Price)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isDropoffOnly && !compact && (
          <p className="text-xs text-gray-500">
            Si no elegís una ciudad intermedia, se usa el destino principal del servicio para cotizar y reservar.
          </p>
        )}
        {selectedCity && !compact && (
          <p className="text-xs text-gray-500">
            Precio referencial por persona:{' '}
            <span className="font-medium text-blue-600">{priceEsAr(selectedCity.Price)}</span>
            <span className="text-gray-400"> · el precio final lo confirma el cotizador</span>
          </p>
        )}
        {isDropoffOnly && !compact && renderPickupBufferNote()}
      </div>

      {!isDropoffOnly && (
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
                <SelectItem key={option.DirectionId} value={option.DirectionId.toString()}>
                  {option.DisplayName}
                  {option.PickupTimeOffset ? ` (+${option.PickupTimeOffset.substring(0, 5)})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPickupId && departureHour && (() => {
            const selectedOption = tripData?.PickupOptions?.find(
              (o) => o.DirectionId.toString() === selectedPickupId,
            );
            if (!selectedOption) return null;
            const estimatedTime = estimatedPickupFromDeparture(
              departureHour,
              selectedOption.PickupTimeOffset,
              true,
            );
            if (!estimatedTime) return null;
            return (
              <p className="text-xs text-gray-500">
                Hora estimada de subida: <span className="font-medium text-blue-600">{estimatedTime}</span>
                <span className="text-gray-400"> (salida del micro + offset de la parada)</span>
              </p>
            );
          })()}
        </div>
      )}

      {dropoffDirections.length > 0 && (
        <div className={cn(compact && isDropoffOnly ? 'space-y-1.5' : 'space-y-2')}>
          {!compact && (
            <Label className="flex items-center gap-2 text-blue-800">
              <MapPin className="h-4 w-4" />
              {isDropoffOnly ? 'Punto específico de bajada' : 'Punto de Bajada'}
              <span className="text-xs font-normal text-gray-500">(opcional)</span>
            </Label>
          )}
          <Select value={selectedDropoffDirectionId} onValueChange={setSelectedDropoffDirectionId}>
            <SelectTrigger
              aria-label="Punto específico de bajada"
              className={cn('w-full', compact && isDropoffOnly && compactTriggerClass)}
            >
              <SelectValue placeholder={compact ? 'Punto de bajada (opc.)' : 'Elegí dirección o terminal (opcional)'} />
            </SelectTrigger>
            <SelectContent>
              {dropoffDirections.map((dir) => (
                <SelectItem key={dir.DirectionId} value={dir.DirectionId.toString()}>
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <span className="truncate">
                      {dir.DisplayName}
                      {selectedCity?.CityName ? (
                        <span className="text-gray-500"> ({selectedCity.CityName})</span>
                      ) : null}
                    </span>
                    {selectedCity?.Price != null && (
                      <span className="text-blue-600 font-medium shrink-0 text-sm">
                        {priceEsAr(selectedCity.Price)}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
