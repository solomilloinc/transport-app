'use client';

import type { ComponentType, ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Bus, Loader2, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationSelector, type LocationSelectionData } from '@/components/checkout/LocationSelector';
import { ReserveStopScheduleDto, ReserveSummaryItem } from '@/interfaces/reserve';
import { formatClockHm } from '@/utils/pickup-display-time';
import { useReserveQuote } from '@/hooks/use-reserve-quote';
import { buildQuoteRequest } from '@/utils/build-quote-request';
import { pickReserveSummaryPrice } from '@/utils/reserve-summary-price';
import { cn } from '@/lib/utils';

function stopPickupLabel(stop: ReserveStopScheduleDto): string {
  return `${stop.DirectionName}: ${formatClockHm(stop.PickupTime)}`;
}

export interface ResultsTripRowProps {
  trip: ReserveSummaryItem;
  variant: 'outbound' | 'return';
  isRoundTrip: boolean;
  passengerCount: number;
  initialPickupDirectionId?: number;
  selectedOutboundTrip: ReserveSummaryItem | null;
  outboundLocationForReturnQuote: LocationSelectionData | undefined;
  location: LocationSelectionData | undefined;
  onLocationChange: (data: LocationSelectionData) => void;
  highlight?: boolean;
  onContinue: () => void;
  continueLabel: string;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{children}</p>
  );
}

function MetaInline({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      {children}
    </span>
  );
}

export function ResultsTripRow({
  trip,
  variant,
  isRoundTrip,
  passengerCount,
  initialPickupDirectionId,
  selectedOutboundTrip,
  outboundLocationForReturnQuote,
  location,
  onLocationChange,
  highlight,
  onContinue,
  continueLabel,
}: ResultsTripRowProps) {
  const { quote, data, loading, error, reset } = useReserveQuote();

  const listPrice = useMemo(
    () => pickReserveSummaryPrice(trip as ReserveSummaryItem & Record<string, unknown>),
    [trip],
  );

  const otherStops = useMemo(() => {
    const stops = trip.StopSchedules;
    if (!stops?.length) return [];
    const pid = location?.pickupDirectionId;
    if (pid == null) return [];
    return stops.filter((s) => s.DirectionId !== pid);
  }, [trip.StopSchedules, location?.pickupDirectionId]);

  useEffect(() => {
    const outboundTripResolved = variant === 'outbound' ? trip : selectedOutboundTrip;
    if (!outboundTripResolved?.TripId || !outboundTripResolved?.ReserveId) {
      reset();
      return;
    }

    const outboundLoc = variant === 'outbound' ? location : outboundLocationForReturnQuote;
    const returnLoc = variant === 'return' ? location : undefined;

    if (!outboundLoc) {
      reset();
      return;
    }

    const request = buildQuoteRequest({
      outboundTrip: outboundTripResolved,
      returnTrip: variant === 'return' ? trip : null,
      passengers: passengerCount,
      outboundLocation: outboundLoc,
      returnLocation: returnLoc,
    });

    if (!request) {
      reset();
      return;
    }

    quote(request).catch(() => {});
  }, [
    variant,
    trip.TripId,
    trip.ReserveId,
    trip.DepartureDate,
    selectedOutboundTrip?.TripId,
    selectedOutboundTrip?.ReserveId,
    selectedOutboundTrip?.DepartureDate,
    passengerCount,
    location?.pickupDirectionId,
    location?.dropoffCityId,
    location?.dropoffDirectionId,
    location?.dropoffTripPriceId,
    outboundLocationForReturnQuote?.pickupDirectionId,
    outboundLocationForReturnQuote?.dropoffCityId,
    outboundLocationForReturnQuote?.dropoffDirectionId,
    outboundLocationForReturnQuote?.dropoffTripPriceId,
    quote,
    reset,
  ]);

  const quoteItem = useMemo(
    () => data?.items?.find((i) => i.tripId === trip.TripId) ?? null,
    [data?.items, trip.TripId],
  );

  const quotedUnit = quoteItem && quoteItem.unitPrice > 0 ? quoteItem.unitPrice : null;
  const displayPrice = quotedUnit ?? listPrice;
  const showQuoteSpinner = loading && quotedUnit == null && listPrice > 0;

  const locReady =
    !!location &&
    (!!location.dropoffCityId || !!location.dropoffDirectionId || !!location.dropoffTripPriceId);
  const outboundReady = variant === 'outbound' || !!outboundLocationForReturnQuote;

  const canContinue =
    displayPrice > 0 && trip.AvailableQuantity > 0 && locReady && outboundReady;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200',
        'hover:border-slate-300 hover:shadow',
        highlight && 'border-blue-300 ring-1 ring-blue-200/60',
      )}
    >
      {/*
        Una sola “tabla” de lectura: Subida | Bajada (inline) | Precio + CTA.
        Los separadores verticales unen visualmente; sin cajas flotantes distintas en el centro.
      */}
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* Subida */}
        <div className="flex min-w-0 flex-col border-b border-slate-200 px-3.5 py-3 sm:px-4 lg:w-[min(100%,210px)] lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:py-3.5">
          <FieldLabel>Subida</FieldLabel>
          <div className="flex min-w-0 gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
            <div className="min-w-0">
              {location?.pickupDirectionName ? (
                <>
                  <p className="text-sm font-semibold leading-snug text-slate-900">{location.pickupDirectionName}</p>
                  {location.pickupEstimatedTime ? (
                    <p className="mt-0.5 text-xs text-slate-600">
                      Aprox.{' '}
                      <span className="font-semibold tabular-nums text-slate-800">{location.pickupEstimatedTime}</span>
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-slate-500">Cargando punto de subida…</p>
              )}
            </div>
          </div>
        </div>

        {/* Bajada — mismo tratamiento que subida: etiqueta + control, sin recuadro gris */}
        <div className="min-w-0 flex-1 border-b border-slate-200 px-3.5 py-3 sm:px-4 lg:border-b-0 lg:border-r lg:py-3.5">
          <FieldLabel>Bajada</FieldLabel>
          <p className="mb-1.5 text-[10px] leading-snug text-slate-500">Elegí ciudad o punto · el precio se actualiza</p>
          {trip.TripId && trip.ReserveId ? (
            <LocationSelector
              key={trip.ReserveId}
              tripId={trip.TripId}
              reserveId={trip.ReserveId}
              isRoundTrip={isRoundTrip}
              variant="dropoffOnly"
              compact
              departureHour={trip.DepartureHour}
              initialData={
                initialPickupDirectionId != null
                  ? ({ pickupDirectionId: initialPickupDirectionId } as LocationSelectionData)
                  : undefined
              }
              onSelectionChange={onLocationChange}
            />
          ) : null}
        </div>

        {/* Precio + acción */}
        <div className="flex flex-col justify-center gap-2 px-3.5 py-3 sm:px-4 lg:w-[min(100%,200px)] lg:flex-shrink-0 lg:py-3.5">
          <div className="flex flex-col gap-1">
            {showQuoteSpinner ? (
              <Loader2 className="h-4 w-4 shrink-0 self-start text-blue-500 animate-spin" aria-hidden />
            ) : null}
            {displayPrice > 0 ? (
              <>
                <p className="font-display text-xl font-bold tabular-nums tracking-tight text-blue-900 lg:text-2xl">
                  ${displayPrice.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500">por persona</p>
              </>
            ) : (
              <p className="text-xs leading-snug text-amber-800">Precio no disponible en el listado.</p>
            )}
            {error && location ? (
              <p className="text-[11px] leading-snug text-amber-800">No se pudo cotizar. Probá otra bajada.</p>
            ) : null}
          </div>
          <Button
            type="button"
            className={cn(
              'h-9 w-full rounded-lg text-sm font-semibold shadow-sm',
              'bg-blue-600 hover:bg-blue-700 hover:shadow',
            )}
            disabled={!canContinue}
            onClick={onContinue}
          >
            {continueLabel}
          </Button>
        </div>
      </div>

      {/* Meta: una sola franja, lectura en línea */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 border-t border-slate-200 bg-slate-50/70 px-3.5 py-2 sm:px-4">
        <MetaInline icon={Bus}>
          <span>Servicio estándar</span>
        </MetaInline>
        <span className="hidden text-slate-300 sm:inline" aria-hidden>
          ·
        </span>
        <MetaInline icon={Users}>
          <span className="font-medium text-slate-700">{trip.AvailableQuantity}</span>
          <span className="text-slate-500"> disponibles</span>
        </MetaInline>
      </div>

      {otherStops.length > 0 && (
        <div className="border-t border-slate-200 px-3.5 py-2 sm:px-4">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Otras paradas</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            {otherStops.map((stop, idx) => (
              <span key={stop.DirectionId} className="inline-flex items-center">
                {idx > 0 ? <span className="mx-1.5 text-slate-300" aria-hidden>|</span> : null}
                <span>{stopPickupLabel(stop)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
