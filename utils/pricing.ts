import { isSameDayInArgentinaTZ } from './dates';

export interface ShouldUseIdaVueltaTariffArgs {
  isRoundTrip: boolean;
  outboundDate: string | null | undefined;
  returnDate: string | null | undefined;
  roundTripRequiresSameDay: boolean;
}

// Decides which dropoff price table to use for a booking:
// - DropoffOptionsIdaVuelta (discounted) when round-trip qualifies for the discount
// - DropoffOptionsIda otherwise (one-way price applied to each leg)
//
// Rules (mirror backend):
// - Not a round-trip → false (use Ida)
// - Tenant does NOT require same-day → true (legacy: always IdaVuelta for round-trips)
// - Tenant requires same-day → true only if both legs are on the same ART calendar day
export function shouldUseIdaVueltaTariff(args: ShouldUseIdaVueltaTariffArgs): boolean {
  if (!args.isRoundTrip) return false;
  if (!args.outboundDate || !args.returnDate) return false;
  if (!args.roundTripRequiresSameDay) return true;
  return isSameDayInArgentinaTZ(args.outboundDate, args.returnDate);
}
