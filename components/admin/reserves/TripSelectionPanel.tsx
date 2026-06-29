'use client';

import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { X } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { AvailableTrip, ReserveReport } from '@/interfaces/reserve';

interface TripSelectionPanelProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedTrip: ReserveReport | null;
  onTripSelect: (trip: ReserveReport) => void;
  onCancelTrip: (trip: ReserveReport) => void;
  trips: ReserveReport[] | undefined;
  /** Rutas (Trip) con reservas ese día — opciones del Select de filtro. */
  availableTrips: AvailableTrip[] | undefined;
  /** Ruta seleccionada (tripId) o `null` = todas. */
  selectedRuta: number | null;
  onRutaChange: (tripId: number | null) => void;
  isLoading: boolean;
}

// Valor sentinela del Select para "sin filtro" (ApiSelect trabaja con strings).
const ALL_RUTAS = '0';

export function TripSelectionPanel({
  selectedDate,
  onDateChange,
  selectedTrip,
  onTripSelect,
  onCancelTrip,
  trips,
  availableTrips,
  selectedRuta,
  onRutaChange,
  isLoading,
}: TripSelectionPanelProps) {
  const [month, setMonth] = useState<Date>(new Date());

  const rutaOptions: SelectOption[] = [
    { id: ALL_RUTAS, value: ALL_RUTAS, label: 'Todas las rutas' },
    ...(availableTrips ?? []).map((t) => ({
      id: t.tripId,
      value: t.tripId.toString(),
      label: t.description,
    })),
  ];

  const handleRutaSelect = (value: string) => {
    const id = Number(value);
    onRutaChange(id > 0 ? id : null);
  };

  return (
    <Card className="w-full min-w-0">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          <div className="mx-auto w-full max-w-[320px]">
            <Calendar
              className="w-full"
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              month={month}
              onMonthChange={setMonth}
              locale={es}
              fromMonth={subMonths(new Date(), 1)}
            />
          </div>
          <div className="space-y-2 px-1 sm:px-3">
            <div className="text-lg font-medium text-blue-500">Viajes {selectedDate ? format(selectedDate, 'd MMM', { locale: es }) : ''}</div>
            {availableTrips && availableTrips.length > 0 && (
              <ApiSelect
                options={rutaOptions}
                value={selectedRuta != null ? selectedRuta.toString() : ALL_RUTAS}
                onValueChange={handleRutaSelect}
                placeholder="Todas las rutas"
                triggerClassName="h-8 text-xs"
              />
            )}
            <div className="scrollbar-none -mr-3 max-h-[19rem] space-y-2 overflow-y-auto overflow-x-hidden pr-3 pt-2">
              {isLoading && <div className="text-center py-4 text-gray-500">Cargando viajes...</div>}
              {!isLoading &&
                trips?.map((trip) => (
                  <div key={trip.reserveId} className="relative group">
                    <button
                      className={`flex w-full min-w-0 items-center gap-2 justify-between rounded-md border p-3 text-left text-sm ${
                        selectedTrip?.reserveId === trip.reserveId ? 'border-blue-500' : ''
                      } ${
                        // Fondo = "ya salió" (amarillo) tiene prioridad sobre la selección;
                        // el borde azul sigue marcando la selección. Ambas señales visibles.
                        trip.hasDeparted
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : selectedTrip?.reserveId === trip.reserveId
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                      }`}
                      onClick={() => onTripSelect(trip)}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="font-medium">{trip.departureHour}</span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-md ${
                            trip.reservedQuantity >= trip.availableQuantity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {trip.reservedQuantity}/{trip.availableQuantity}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 text-gray-600">
                        {trip.originName} → {trip.destinationName}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelTrip(trip);
                      }}
                      className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-200 transition-colors z-10 border border-red-200"
                      title="Cancelar viaje"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              {!isLoading && trips?.length === 0 && <div className="text-center py-4 text-gray-500">No hay viajes disponibles.</div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
