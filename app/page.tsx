export const revalidate = 86400; // Revalidate every 24 hours
import { SelectOption } from '@/components/dashboard/select';

import { ScrollToSection } from '@/components/scroll-to-section';
import { HeroSection } from '@/components/hero-section';
import Navbar from '@/components/navbar';
import { getPublicTrips, getTripById, PublicTripDto } from '@/services/trip';
import { TripPickupStopReportDto } from '@/interfaces/trip';
import { LandingContent } from '@/components/landing-content';
import Footer from '@/components/footer';

// Extended SelectOption to include trip data
export interface TripSelectOption extends SelectOption {
  originCityId: number;
  originCityName: string;
  destinationCityId: number;
  destinationCityName: string;
  priceFrom: number | null;
  stopSchedules: TripPickupStopReportDto[];
}

async function loadTrips(): Promise<TripSelectOption[]> {
  try {
    const response = await getPublicTrips(1, 100);

    if (response && response.items) {
      // Load full trip data in parallel to get StopSchedules
      const fullTrips = await Promise.all(
        response.items.map(async (trip) => {
          try {
            const fullTrip = await getTripById(trip.tripId);
            return { ...trip, stopSchedules: fullTrip.stopSchedules || [] };
          } catch {
            return { ...trip, stopSchedules: [] as TripPickupStopReportDto[] };
          }
        })
      );

      return fullTrips.map((trip) => ({
        id: trip.tripId,
        value: trip.tripId.toString(),
        label: `${trip.originCityName} → ${trip.destinationCityName}`,
        originCityId: trip.originCityId,
        originCityName: trip.originCityName,
        destinationCityId: trip.destinationCityId,
        destinationCityName: trip.destinationCityName,
        priceFrom: trip.priceFrom,
        stopSchedules: trip.stopSchedules,
      }));
    }
  } catch {
    return [];
  }
  return [];
}

export default async function Home() {
  const trips = await loadTrips();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        middleContent={
          <>
            <ScrollToSection href="#about" className="text-sm font-medium text-blue-900 hover:text-blue-700">
              Nosotros
            </ScrollToSection>
            <ScrollToSection href="#routes" className="text-sm font-medium text-blue-900 hover:text-blue-700">
              Rutas
            </ScrollToSection>
            <ScrollToSection href="#testimonials" className="text-sm font-medium text-blue-900 hover:text-blue-700">
              Testimonios
            </ScrollToSection>
            <ScrollToSection href="#contact" className="text-sm font-medium text-blue-900 hover:text-blue-700">
              Contacto
            </ScrollToSection>
          </>
        }
      />
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection trips={trips} />

        {/* All landing page content sections (About, Routes, Testimonials, CTA, Contact) */}
        <LandingContent />
      </main>
      <Footer />
    </div>
  );
}
