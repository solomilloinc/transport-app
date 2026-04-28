import { ReserveQuoteRequestDto, ReserveQuoteItemRequest } from '@/interfaces/quote';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import { LocationSelectionData } from '@/components/checkout/LocationSelector';

/**
 * El quote con 2 ítems debe pedir siempre Ida (1) + IdaVuelta (2) en el request; el resolver
 * devuelve `applied`/`discountsLost` si la vuelta es otro día. No enviar 1+1 aquí: el API lo rechaza.
 * @see quote-integration-plan.md
 */

interface BuildQuoteRequestInput {
  outboundTrip: ReserveSummaryItem | null | undefined;
  returnTrip?: ReserveSummaryItem | null;
  passengers: number;
  outboundLocation: LocationSelectionData;
  returnLocation?: LocationSelectionData;
}

export function buildQuoteRequest(input: BuildQuoteRequestInput): ReserveQuoteRequestDto | null {
  const { outboundTrip, returnTrip, passengers, outboundLocation, returnLocation } = input;

  if (!outboundTrip) return null;
  const outboundHasDropoff =
    !!outboundLocation?.dropoffDirectionId ||
    !!outboundLocation?.dropoffTripPriceId ||
    !!outboundLocation?.dropoffCityId;
  if (!outboundHasDropoff) return null;

  const isRoundTrip = !!returnTrip;
  const returnHasDropoff =
    !!returnLocation?.dropoffDirectionId ||
    !!returnLocation?.dropoffTripPriceId ||
    !!returnLocation?.dropoffCityId;
  if (isRoundTrip && !returnHasDropoff) return null;

  const outboundDropoffLocationId =
    outboundLocation.dropoffDirectionId ??
    outboundLocation.dropoffTripPriceId ??
    outboundLocation.dropoffCityId ??
    undefined;

  const outboundItem: ReserveQuoteItemRequest = {
    tripId: outboundTrip.TripId,
    reserveDate: outboundTrip.DepartureDate,
    reserveTypeId: 1,
    dropoffLocationId: outboundDropoffLocationId,
    dropoffDirectionId: outboundLocation.dropoffDirectionId ?? undefined,
    dropoffCityId: outboundLocation.dropoffCityId ?? undefined,
    passengerCount: passengers,
  };

  const items: ReserveQuoteItemRequest[] = [outboundItem];

  if (isRoundTrip && returnTrip && returnLocation) {
    const returnDropoffLocationId =
      returnLocation.dropoffDirectionId ??
      returnLocation.dropoffTripPriceId ??
      returnLocation.dropoffCityId ??
      undefined;
    items.push({
      tripId: returnTrip.TripId,
      reserveDate: returnTrip.DepartureDate,
      reserveTypeId: 2,
      dropoffLocationId: returnDropoffLocationId,
      dropoffDirectionId: returnLocation.dropoffDirectionId ?? undefined,
      dropoffCityId: returnLocation.dropoffCityId ?? undefined,
      passengerCount: passengers,
    });
  }

  return { items };
}
