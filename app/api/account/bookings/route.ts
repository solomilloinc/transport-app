import { NextRequest, NextResponse } from 'next/server';
import { fetchAccountBackend } from '@/app/api/account/_lib/backend-auth';
import { PendingReserve } from '@/interfaces/customerAccount';
import { CurrentUserProfile } from '@/services/user-management';

export async function GET(request: NextRequest) {
  try {
    const profile = await fetchAccountBackend<CurrentUserProfile>(request, '/me');
    const bookings = profile.customerId
      ? await fetchAccountBackend<PendingReserve[]>(
          request,
          `/customer-pending-reserves/${profile.customerId}`
        )
      : [];

    return NextResponse.json(bookings);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las reservas.';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ message }, { status });
  }
}
