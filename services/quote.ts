'use server';

import { postWithResponse } from './api';
import { ReserveQuoteRequestDto, ReserveQuoteResponseDto } from '@/interfaces/quote';

export async function getReserveQuote(
  request: ReserveQuoteRequestDto,
): Promise<ReserveQuoteResponseDto> {
  return await postWithResponse<ReserveQuoteRequestDto, ReserveQuoteResponseDto>(
    '/reserves/quote',
    request,
    { skipAuth: true },
  );
}
