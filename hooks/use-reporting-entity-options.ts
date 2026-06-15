'use client';

import { useEffect, useState } from 'react';
import type { SelectOption } from '@/components/dashboard/select';
import { getTripsForSelect } from '@/services/trip';
import { getVehicleReport } from '@/services/vehicle';
import { getDriverReport } from '@/services/driver';

export interface ReportingEntityOptions {
  tripOptions: SelectOption[];
  vehicleOptions: SelectOption[];
  driverOptions: SelectOption[];
  loading: boolean;
}

/**
 * Carga (una vez) las opciones de Ruta / Vehículo / Chofer para los filtros de
 * la Reportería, reusando los services/endpoints que ya existen
 * (`/trip-report`, `/vehicle-report`, `/driver-report`). Son conjuntos acotados,
 * así que se traen completos (pageSize 100) y el `ApiSelect` filtra client-side.
 */
export function useReportingEntityOptions(): ReportingEntityOptions {
  const [tripOptions, setTripOptions] = useState<SelectOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<SelectOption[]>([]);
  const [driverOptions, setDriverOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [trips, vehicles, drivers] = await Promise.all([
          getTripsForSelect(),
          getVehicleReport({ pageSize: 100 }),
          getDriverReport({ pageSize: 100 }),
        ]);
        if (!active) return;
        setTripOptions(
          (trips.items ?? []).map((t) => ({
            id: t.tripId,
            value: String(t.tripId),
            label: t.description,
          }))
        );
        setVehicleOptions(
          (vehicles.items ?? []).map((v) => ({
            id: v.vehicleId,
            value: String(v.vehicleId),
            label: v.internalNumber ? `Coche ${v.internalNumber}` : `Coche #${v.vehicleId}`,
          }))
        );
        setDriverOptions(
          (drivers.items ?? []).map((d) => ({
            id: d.driverId,
            value: String(d.driverId),
            label: `${d.firstName} ${d.lastName}`.trim() || `Chofer #${d.driverId}`,
          }))
        );
      } catch {
        // Si falla la carga, los selects quedan vacíos (sólo la opción "Todas").
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { tripOptions, vehicleOptions, driverOptions, loading };
}
