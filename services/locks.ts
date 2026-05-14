import { postWithResponse } from '@/services/api';

// Exact match with Transport.SharedKernel.Contracts.Reserve.LockReserveSlotsRequestDto
export interface LockReserveSlotsRequest {
  outboundReserveId: number;
  returnReserveId: number | null;
  passengerCount: number;
}

// Exact match with Transport.SharedKernel.Contracts.Reserve.LockReserveSlotsResponseDto
export interface LockReserveSlotsResponse {
  lockToken: string;
  expiresAt: string; // DateTime from API
  timeoutMinutes: number;
}

export const lockReserveSlots = async (
  request: LockReserveSlotsRequest,
): Promise<LockReserveSlotsResponse> => {
  const response = await postWithResponse<LockReserveSlotsRequest, LockReserveSlotsResponse>(
    '/reserve-slots-lock',
    request,
  );
  const responseData = typeof response === 'string' ? JSON.parse(response) : response;
  return responseData;
};
