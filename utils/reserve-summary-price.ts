import { ReserveSummaryItem } from '@/interfaces/reserve';

export function pickReserveSummaryPrice(trip: ReserveSummaryItem & Record<string, unknown>): number {
  const t = trip as Record<string, unknown>;
  const candidates = [
    trip.Price,
    t.price,
    t.UnitPrice,
    t.unitPrice,
    t.PricePerPerson,
    t.pricePerPerson,
  ];
  for (const v of candidates) {
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}
