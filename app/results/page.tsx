// Ya no es un componente de cliente, por lo que se elimina 'use client'.
import { get } from '@/services/api';
import { PagedReserveResponse } from '@/services/types';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import ResultsClient from '@/components/results/ResultsClient'; // Este será nuestro nuevo componente de cliente.
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { format } from 'date-fns';

// 1. Definimos la forma de los searchParams que la página recibe como props.
interface ResultsSearchParams {
  tripId?: string;
  returnTripId?: string;
  originName?: string;
  destinationName?: string;
  tripType?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: string;
}

// 2. Creamos una respuesta vacía para usar en caso de error o parámetros faltantes.
const emptyResponse: PagedReserveResponse<ReserveSummaryItem> = {
  Outbound: { Items: [], PageNumber: 1, PageSize: 10, TotalRecords: 0, TotalPages: 0 },
  Return: { Items: [], PageNumber: 1, PageSize: 10, TotalRecords: 0, TotalPages: 0 },
};

// 3. La función de carga de datos ahora se ejecuta en el servidor.
async function getReserves(searchParams: ResultsSearchParams): Promise<PagedReserveResponse<ReserveSummaryItem>> {
  const tripId = searchParams.tripId;
  const returnTripId = searchParams.returnTripId;
  const departureDate = searchParams.departureDate || format(new Date(), 'yyyy-MM-dd');
  const returnDate = searchParams.returnDate || '';
  const passengers = searchParams.passengers || '1';

  if (!tripId) {
    console.error('Error: Falta tripId para la búsqueda de reservas.');
    return emptyResponse;
  }

  try {
    const response = await get<any, PagedReserveResponse<ReserveSummaryItem>>(
      '/public/reserve-summary',
      {
        pageNumber: 1,
        pageSize: 10,
        filters: {
          tripId: Number(tripId),
          returnTripId: returnTripId ? Number(returnTripId) : null,
          departureDate: departureDate,
          passengers: Number(passengers),
          returnDate: returnDate || null,
        },
      },
      { skipAuth: true }
    );
    return response;
  } catch (error) {
    console.error('Falló la obtención de reservas iniciales:', error);
    return emptyResponse;
  }
}

// 4. La página ahora es un Server Component asíncrono.
export default async function ResultsPage({ searchParams }: {
  searchParams: { [key: string]: string | undefined }
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-8">
        {/* La UI interactiva ahora se delega a un Componente de Cliente. */}
        <ResultsClient initialReserves={initialReserves} searchParams={clientSearchParams} />
      </main>
      <Footer />
    </div>
  );
}
