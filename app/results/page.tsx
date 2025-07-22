// Ya no es un componente de cliente, por lo que se elimina 'use client'.
import { get } from '@/services/api';
import { PagedReserveResponse } from '@/services/types';
import { ReserveSummaryItem } from '@/interfaces/reserve';
import ResultsClient from '@/components/results/ResultsClient'; // Este será nuestro nuevo componente de cliente.
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { format } from 'date-fns';
import { se } from 'date-fns/locale';

// 1. Definimos la forma de los searchParams que la página recibe como props.
interface ResultsPageProps {
  searchParams: {
    originId?: string;
    originName?: string;
    destinationId?: string;
    destinationName?: string;
    tripType?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: string;
  };
}

// 2. Creamos una respuesta vacía para usar en caso de error o parámetros faltantes.
const emptyResponse: PagedReserveResponse<ReserveSummaryItem> = {
  Outbound: { Items: [], PageNumber: 1, PageSize: 10, TotalRecords: 0, TotalPages: 0 },
  Return: { Items: [], PageNumber: 1, PageSize: 10, TotalRecords: 0, TotalPages: 0 },
};

// 3. La función de carga de datos ahora se ejecuta en el servidor.
async function getReserves(searchParams: ResultsPageProps['searchParams']): Promise<PagedReserveResponse<ReserveSummaryItem>> {
  // Se accede a las propiedades individualmente para evitar el error de acceso síncrono.
  const originId = searchParams.originId;
  const destinationId = searchParams.destinationId;
  const departureDate = searchParams.departureDate || format(new Date(), 'yyyy-MM-dd');
  // Aseguramos que returnDate sea un string vacío si no está presente, para que la lógica posterior funcione.
  const returnDate = searchParams.returnDate || '';
  const passengers = searchParams.passengers || '1';

  if (!originId || !destinationId) {
    console.error('Error: Faltan originId o destinationId para la búsqueda de reservas.');
    return emptyResponse;
  }

  try {
    const response = await get<any, PagedReserveResponse<ReserveSummaryItem>>(
      '/public/reserve-summary',
      {
        pageNumber: 1, // Obtenemos solo la primera página inicialmente.
        pageSize: 10,
        filters: {
          originId: Number(originId),
          destinationId: Number(destinationId),
          departureDate: departureDate,
          passengers: Number(passengers),
          returnDate: returnDate ? returnDate : null,
        },
      },
      { skipAuth: true }
    );
    return response;
  } catch (error) {
    console.error('Falló la obtención de reservas iniciales:', error);
    return emptyResponse; // Devolvemos un estado vacío en caso de error de la API.
  }
}

// 4. La página ahora es un Server Component asíncrono.
export default async function ResultsPage({ searchParams }:{
 searchParams: { [key: string]: string | undefined }
}) {
  const resolvedSearchParams = await searchParams;
  const initialReserves = await getReserves(resolvedSearchParams);

  const clientSearchParams = {
    originId: resolvedSearchParams.originId,
    originName: resolvedSearchParams.originName,
    destinationId: resolvedSearchParams.destinationId,
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
