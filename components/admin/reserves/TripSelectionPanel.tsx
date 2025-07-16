'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { ReserveReport } from '@/interfaces/reserve';

interface TripSelectionPanelProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedTrip: ReserveReport | null;
  onTripSelect: (trip: ReserveReport) => void;
  trips: ReserveReport[] | undefined;
  isLoading: boolean;
}

export function TripSelectionPanel({ selectedDate, onDateChange, selectedTrip, onTripSelect, trips, isLoading }: TripSelectionPanelProps) {
  const [month, setMonth] = useState<Date>(new Date());

  return (
    <Card>
      <CardContent className="p-2 sm:p-4">
        <div className="space-y-2">
          <div className="w-full max-w-full sm:max-w-[300px] mx-auto">
            <Calendar
              className="text-xs sm:text-sm"
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              month={month}
              onMonthChange={setMonth}
              locale={es}
              fromMonth={new Date()}
              classNames={{
                cell: 'h-6 w-6 sm:h-7 sm:w-7 text-center text-[10px] sm:text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-6 w-6 sm:h-7 sm:w-7 p-0 font-normal text-[10px] sm:text-xs aria-selected:opacity-100',
                head_cell: 'text-muted-foreground rounded-md w-6 sm:w-7 font-normal text-[10px] sm:text-xs',
              }}
            />
          </div>
          <div className="space-y-2 p-3">
            <div className="text-lg font-medium text-blue-500">Viajes {selectedDate ? format(selectedDate, 'd MMM', { locale: es }) : ''}</div>
            <div className="space-y-2">
              {isLoading && <div className="text-center py-4 text-gray-500">Cargando viajes...</div>}
              {!isLoading &&
                trips?.map((trip) => (
                  <button
                    key={trip.ReserveId}
                    className={`flex w-full items-center gap-2 justify-between rounded-md border p-3 text-left text-sm ${
                      selectedTrip?.ReserveId === trip.ReserveId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onTripSelect(trip)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-medium">{trip.DepartureHour}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${trip.ReservedQuantity >= trip.AvailableQuantity ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{trip.ReservedQuantity}/{trip.AvailableQuantity}</span>
                    </div>
                    <div className="text-gray-600">{trip.OriginName} → {trip.DestinationName}</div>
                  </button>
                ))}
              {!isLoading && trips?.length === 0 && <div className="text-center py-4 text-gray-500">No hay viajes disponibles.</div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}