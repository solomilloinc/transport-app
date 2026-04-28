export interface ReserveQuoteItemRequest {
  tripId: number;
  reserveDate: string;
  reserveTypeId: 1 | 2;
  dropoffLocationId?: number;
  dropoffDirectionId?: number;
  dropoffCityId?: number;
  passengerCount: number;
}

export interface ReserveQuoteRequestDto {
  items: ReserveQuoteItemRequest[];
}

export interface ReserveQuoteItemResponse {
  tripId: number;
  requestedReserveTypeId: number;
  appliedReserveTypeId: number;
  unitPrice: number;
  subtotal: number;
  reason?: number;
  reasonCode?: string;
}

export interface ReserveQuoteDiscountLost {
  code: string;
  message: string;
}

export interface ReserveQuoteResponseDto {
  items: ReserveQuoteItemResponse[];
  total: number;
  discountsLost: ReserveQuoteDiscountLost[];
}
