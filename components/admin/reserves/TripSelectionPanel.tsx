'use client';

import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, CircleSlash, Clock3, X } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { ReserveReport } from '@/interfaces/reserve';

interface TripSelectionPanelProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedTrip: ReserveReport | null;
  onTripSelect: (trip: ReserveReport) => void;
  onCancelTrip: (trip: ReserveReport) => void;
  trips: ReserveReport[] | undefined;
  isLoading: boolean;
}

export function TripSelectionPanel({ selectedDate, onDateChange, selectedTrip, onTripSelect, onCancelTrip, trips, isLoading }: TripSelectionPanelProps) {
  const [month, setMonth] = useState<Date>(new Date());

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-black/6 bg-white/80 shadow-[0_22px_48px_rgba(22,34,24,0.06)]">
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="rounded-[1.35rem] border border-black/6 bg-[linear-gradient(180deg,rgba(245,246,241,0.96),rgba(237,241,233,0.92))] p-3">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            <CalendarDays className="h-4 w-4 text-emerald-700" />
            Agenda operativa
          </div>
          <div className="w-full max-w-full sm:max-w-[300px] mx-auto">
            <Calendar
              className="text-xs sm:text-sm"
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              month={month}
              onMonthChange={setMonth}
              locale={es}
              fromMonth={subMonths(new Date(), 1)}
              classNames={{
                months: 'space-y-3',
                caption_label: 'font-display text-sm text-slate-900',
                nav_button: 'h-8 w-8 rounded-full border border-black/6 bg-white/80 text-slate-700 hover:bg-white',
                table: 'w-full border-collapse space-y-1',
                head_cell: 'w-8 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400',
                cell: 'h-8 w-8 p-0 text-center text-xs relative',
                day: 'h-8 w-8 rounded-full p-0 font-medium text-slate-700 aria-selected:bg-emerald-700 aria-selected:text-white hover:bg-emerald-50',
                day_today: 'border border-emerald-200 bg-emerald-50 text-emerald-900',
                day_outside: 'text-slate-300',
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Salidas del dia</div>
            <div className="mt-1 font-display text-xl text-slate-900">
              {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona una fecha'}
            </div>
          </div>

          <div className="space-y-2">
            {isLoading && <div className="rounded-[1.25rem] border border-dashed border-black/8 px-4 py-6 text-center text-sm text-slate-500">Cargando viajes...</div>}

            {!isLoading &&
              trips?.map((trip) => {
                const isSelected = selectedTrip?.ReserveId === trip.ReserveId;
                const occupancy = `${trip.ReservedQuantity}/${trip.AvailableQuantity}`;
                const isFull = trip.ReservedQuantity >= trip.AvailableQuantity;

                return (
                  <div key={trip.ReserveId} className="relative group">
                    <button
                      className={
                        isSelected
                          ? 'flex w-full items-center justify-between gap-3 rounded-[1.25rem] border border-emerald-300 bg-[linear-gradient(135deg,rgba(233,244,236,0.98),rgba(248,250,246,0.96))] px-4 py-4 text-left shadow-[0_14px_30px_rgba(30,74,45,0.10)]'
                          : 'flex w-full items-center justify-between gap-3 rounded-[1.25rem] border border-black/6 bg-white/72 px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-black/10 hover:bg-white hover:shadow-[0_14px_28px_rgba(18,28,20,0.06)]'
                      }
                      onClick={() => onTripSelect(trip)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Clock3 className="h-4 w-4 text-emerald-700" />
                          <span className="font-display text-lg">{trip.DepartureHour}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {trip.OriginName} {'>'} {trip.DestinationName}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={
                            isFull
                              ? 'inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-700'
                              : 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700'
                          }
                        >
                          {occupancy}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">{isFull ? 'Sin cupo' : 'Cupo disponible'}</div>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelTrip(trip);
                      }}
                      className="absolute -right-2 -top-2 hidden h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 shadow-sm transition-colors hover:bg-red-50 group-hover:flex"
                      title="Cancelar viaje"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

            {!isLoading && trips?.length === 0 && (
              <div className="rounded-[1.25rem] border border-dashed border-black/8 px-4 py-8 text-center">
                <CircleSlash className="mx-auto h-5 w-5 text-slate-400" />
                <div className="mt-3 text-sm font-medium text-slate-700">No hay viajes disponibles.</div>
                <div className="mt-1 text-xs text-slate-500">Prueba otra fecha o crea una salida desde el panel.</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
