'use client';

import { useEffect, useState } from 'react';
import { PendingReserve } from '@/interfaces/customerAccount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ClientAccountBookings() {
  const [bookings, setBookings] = useState<PendingReserve[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        const response = await fetch('/api/account/bookings', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { message?: string } | null;
          throw new Error(payload?.message || 'No se pudieron cargar las reservas.');
        }

        const nextBookings = (await response.json()) as PendingReserve[];
        if (isMounted) {
          setBookings(nextBookings);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las reservas.');
        }
      }
    };

    void loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-600">{error}</CardContent>
      </Card>
    );
  }

  if (!bookings) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-slate-600">
          No encontramos reservas pendientes para este usuario.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {bookings.map((reserve) => (
        <Card key={`${reserve.reserveId}-${reserve.reserveDate}`}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-lg">Reserva #{reserve.reserveId}</CardTitle>
              <p className="text-sm text-slate-600">
                {reserve.originName} a {reserve.destinationName}
              </p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <div>{reserve.reserveDate}</div>
              <div>{reserve.departureHour}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <div className="text-slate-500">Total</div>
                <div className="font-medium">${reserve.totalPrice}</div>
              </div>
              <div>
                <div className="text-slate-500">Pagado</div>
                <div className="font-medium">${reserve.totalPaid}</div>
              </div>
              <div>
                <div className="text-slate-500">Pendiente</div>
                <div className="font-medium">${reserve.pendingDebt}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
