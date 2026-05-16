export const RESERVE_TYPE = {
  IDA: 1,
  ROUND_TRIP: 2,
} as const;

export type ReserveTypeId = typeof RESERVE_TYPE[keyof typeof RESERVE_TYPE];

export function isRoundTrip(reserveTypeId: ReserveTypeId): boolean {
  return reserveTypeId === RESERVE_TYPE.ROUND_TRIP;
}
