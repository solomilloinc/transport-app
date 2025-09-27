import { postWithResponse } from '@/services/api';

// Exact match with Transport.SharedKernel.Contracts.Reserve.LockReserveSlotsRequestDto
export interface LockReserveSlotsRequest {
  outboundReserveId: number;
  returnReserveId: number | null;
  passengerCount: number;
}

// Exact match with Transport.SharedKernel.Contracts.Reserve.LockReserveSlotsResponseDto
export interface LockReserveSlotsResponse {
  LockToken: string;
  ExpiresAt: string; // DateTime from API
  TimeoutMinutes: number;
}

export const lockReserveSlots = async (
  request: LockReserveSlotsRequest
): Promise<LockReserveSlotsResponse> => {
  const response = await postWithResponse<LockReserveSlotsRequest, LockReserveSlotsResponse>(
    '/reserve-slots-lock',
    request
  );

  // Handle response the same way as other endpoints in the app
  const responseData = typeof response === 'string' ? JSON.parse(response) : response;

  return responseData;
};