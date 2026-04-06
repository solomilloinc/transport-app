'use client';

import { useState } from 'react';
import { format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, CircleSlash, Clock3, X } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="rounded-[1.1rem] border border-blue-200 bg-[linear-gradient(180deg,rgba(226,239,255,0.98),rgba(210,228,251,0.96))] p-1.5 shadow-[0_10px_20px_rgba(59,130,246,0.10),inset_0_1px_0_rgba(255,255,255,0.72)]">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-700">
            <CalendarDays className="h-4 w-4 text-blue-700" />
            Agenda operativa
          </div>
          <div className="mx-auto w-full max-w-[232px]">
            <Calendar
              className="mx-auto w-full !px-0 !py-1 text-xs sm:text-sm"
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              month={month}
              onMonthChange={setMonth}
              locale={es}
              fromMonth={subMonths(new Date(), 1)}
              classNames={{
                months: 'space-y-2',
                month: 'mx-auto w-full space-y-2',
                caption: 'relative flex items-center justify-center pt-1',
                caption_label: 'font-display text-xs text-slate-900',
                nav_button:
                  'flex h-6 w-6 items-center justify-center rounded-full border border-sky-100 bg-white text-slate-700 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-blue-700',
                nav_button_previous: 'absolute left-0',
                nav_button_next: 'absolute right-0',
                table: 'mx-auto w-full border-collapse space-y-1',
                head_row: 'flex w-full justify-between',
                head_cell: 'flex h-6 w-7 items-center justify-center text-[8px] font-semibold uppercase tracking-[0.08em] text-sky-700/70',
                row: 'mt-1.5 flex w-full justify-between',
                cell: 'flex h-6 w-7 items-center justify-center p-0 text-center text-[10px] relative',
                day: 'h-6 w-6 rounded-full p-0 font-medium text-slate-700 transition-colors aria-selected:bg-[linear-gradient(135deg,#0f3f8f,#2563eb)] aria-selected:text-white hover:bg-sky-50 hover:text-blue-700',
                day_today: 'border border-sky-200 bg-sky-50 text-blue-800',
                day_outside: 'text-slate-300',
              }}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-sky-700">Salidas del dia</div>
            <div className="mt-1 font-display text-base text-slate-900">
              {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : 'Selecciona una fecha'}
            </div>
          </div>

          <div className="space-y-2">
            {isLoading && <div className="rounded-[1.1rem] border border-dashed border-sky-200 bg-white/80 px-3 py-5 text-center text-sm text-slate-500">Cargando viajes...</div>}

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
                        ? 'flex w-full items-center justify-between gap-2 rounded-[1rem] border border-sky-200 bg-[linear-gradient(135deg,rgba(233,244,255,0.98),rgba(248,251,255,0.96))] px-2.5 py-2.5 text-left shadow-[0_12px_22px_rgba(37,99,235,0.10)]'
                        : 'flex w-full items-center justify-between gap-2 rounded-[1rem] border border-sky-100 bg-white px-2.5 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/70 hover:shadow-[0_10px_18px_rgba(15,23,42,0.05)]'
                      }
                      onClick={() => onTripSelect(trip)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Clock3 className="h-3.5 w-3.5 text-blue-700" />
                          <span className="font-display text-sm">{trip.DepartureHour}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {trip.OriginName} {'>'} {trip.DestinationName}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={
                            isFull
                            ? 'inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-700'
                            : 'inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700'
                          }
                        >
                          {occupancy}
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-500">{isFull ? 'Sin cupo' : 'Cupo disponible'}</div>
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
              <div className="rounded-[1.1rem] border border-dashed border-sky-200 bg-white/80 px-3 py-7 text-center">
                <CircleSlash className="mx-auto h-5 w-5 text-sky-300" />
                <div className="mt-3 text-sm font-medium text-slate-700">No hay viajes disponibles.</div>
                <div className="mt-1 text-xs text-slate-500">Prueba otra fecha o crea una salida desde el panel.</div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
