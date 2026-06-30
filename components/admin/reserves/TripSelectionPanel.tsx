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
    <Card className="w-full min-w-0 md:w-[292px]">
      <CardContent className="p-2">
        <div className="space-y-3">
          <div className="mx-auto flex w-[276px] justify-center">
            <Calendar
              className="w-[276px] p-1.5"
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              month={month}
              onMonthChange={setMonth}
              locale={es}
              fromMonth={subMonths(new Date(), 1)}
              classNames={{
                months: 'flex justify-center',
                month: 'w-[264px] space-y-3',
                caption: 'relative flex h-8 items-center justify-center',
                caption_label: 'text-sm font-medium',
                nav: 'flex items-center',
                nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-[264px] border-collapse',
                head_row: 'flex',
                head_cell: 'w-[37.714px] rounded-md text-[0.75rem] font-normal text-muted-foreground',
                row: 'mt-1 flex w-full',
                cell: 'relative h-8 w-[37.714px] p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
                day: 'inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-selected:opacity-100',
              }}
            />
          </div>
          <div className="space-y-2 px-1">
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
