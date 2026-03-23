import { get } from '@/services/api';
import { PagedReserveResponse } from '@/services/types';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import ResultsClient from '@/components/results/ResultsClient';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { format } from 'date-fns';

interface ResultsSearchParams {
  tripId?: string;
  returnTripId?: string;
  originName?: string;
  destinationName?: string;
  tripType?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: string;
  pickupDirectionId?: string;
}

const emptyResponse: PagedReserveResponse<ReserveSummaryItem> = {
  Outbound: { Items: [], PageNumber: 1, PageSize: 10, TotalRecords: 0, TotalPages: 0 },
  Return: { Items: [], PageNumber: 1, PageSize: 10, TotalRecords: 0, TotalPages: 0 },
};

async function getReserves(searchParams: ResultsSearchParams): Promise<PagedReserveResponse<ReserveSummaryItem>> {
  const tripId = searchParams.tripId;
  const returnTripId = searchParams.returnTripId;
  const departureDate = searchParams.departureDate || format(new Date(), 'yyyy-MM-dd');
  const returnDate = searchParams.returnDate || '';
  const passengers = searchParams.passengers || '1';
  const pickupDirectionId = searchParams.pickupDirectionId;

  if (!tripId) {
    return emptyResponse;
  }

  try {
    return await get<any, PagedReserveResponse<ReserveSummaryItem>>(
      '/public/reserve-summary',
      {
        pageNumber: 1,
        pageSize: 10,
        filters: {
          tripId: Number(tripId),
          returnTripId: returnTripId ? Number(returnTripId) : null,
          departureDate,
          passengers: Number(passengers),
          returnDate: returnDate || null,
          ...(pickupDirectionId ? { pickupDirectionId: Number(pickupDirectionId) } : {}),
        },
      },
      { skipAuth: true }
    );
  } catch {
    return emptyResponse;
  }
}

export default async function ResultsPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const initialReserves = await getReserves(resolvedSearchParams);

  const clientSearchParams = {
    tripId: resolvedSearchParams.tripId,
    returnTripId: resolvedSearchParams.returnTripId,
    originName: resolvedSearchParams.originName,
    destinationName: resolvedSearchParams.destinationName,
    tripType: resolvedSearchParams.tripType,
    departureDate: resolvedSearchParams.departureDate,
    returnDate: resolvedSearchParams.returnDate,
    passengers: resolvedSearchParams.passengers,
    pickupDirectionId: resolvedSearchParams.pickupDirectionId,
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <ResultsClient initialReserves={initialReserves} searchParams={clientSearchParams} />
      </main>
      <Footer />
    </div>
  );
}
