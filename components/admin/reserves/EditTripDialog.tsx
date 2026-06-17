'use client';

import { useEffect, useState } from 'react';
import { put, get } from '@/services/api';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { Input } from '@/components/ui/input';
import { emptyEditReserve, ReserveReport, ReserveUpdate } from '@/interfaces/reserve';
import { validationConfigEditReserve } from '@/validations/reserveSchema';
import { Vehicle } from '@/interfaces/vehicle';
import { PagedResponse } from '@/services/types';
import { EntityStatus } from '@/interfaces/filters/common';
import { getApiErrorMessage, bindApiErrorToForm } from '@/lib/apiErrors';

interface EditTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: ReserveReport | null;
  onSuccess: () => void;
}

export function EditTripDialog({ open, onOpenChange, trip, onSuccess }: EditTripDialogProps) {
  const { toast } = useToast();
  const form = useFormValidation(emptyEditReserve, validationConfigEditReserve);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    setVehiclesError(null);
    try {
      const response = await get<any, PagedResponse<Vehicle>>('/vehicle-report', {
        pageNumber: 1,
        pageSize: 100, // Fetch more vehicles
        sortBy: 'name',
        sortDescending: false,
        // Combo de edición de viaje — sólo Vehículos Active.
        filters: { status: EntityStatus.Active },
      });
      if (response && response.items) {
        const formattedVehicles: SelectOption[] = response.items.map((vehicle) => ({
          id: vehicle.vehicleId,
          value: vehicle.vehicleId.toString(),
          label: `${vehicle.vehicleTypeName} (${vehicle.internalNumber})`,
          availableQuantity: vehicle.availableQuantity,
        }));
        setVehicles(formattedVehicles);
      }
    } catch (error) {
      setVehiclesError('Error al cargar los vehículos');
      setVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchVehicles();
    }
  }, [open]);

  useEffect(() => {
    if (trip) {
      form.setField('vehicleId', trip.vehicleId);
      form.setField('departureHour', trip.departureHour);
    }
  }, [trip]);

  const handleSubmit = () => {
    form.handleSubmit(async (data) => {
      if (!trip) return;
      try {
        const selectedVehicle = vehicles.find((vehicle) => Number(vehicle.value) === data.vehicleId);
        const selectedVehicleCapacity = Number(selectedVehicle?.availableQuantity ?? 0);

        if (selectedVehicle && selectedVehicleCapacity < trip.reservedQuantity) {
          form.setError(
            'vehicleId',
            `El vehículo seleccionado tiene ${selectedVehicleCapacity} asientos y el viaje ya tiene ${trip.reservedQuantity} pasajero(s).`,
          );
          toast({
            title: 'Capacidad insuficiente',
            description: 'No podés asignar un vehículo con menos capacidad que los pasajeros ya reservados.',
            variant: 'destructive',
          });
          return;
        }

        const updatePayload: ReserveUpdate = {
          vehicleId: data.vehicleId,
          departureHour: data.departureHour ? `${data.departureHour}:00` : data.departureHour,
          status: trip.status,
        };
        const response = await put(`/reserve-update/${trip.reserveId}`, updatePayload);

        if (response) {
          toast({ title: 'Viaje actualizado', description: 'El viaje ha sido actualizado exitosamente.', variant: 'success' });
          onSuccess();
          onOpenChange(false);
        } else {
          toast({ title: 'Error', description: 'Error al actualizar el viaje.', variant: 'destructive' });
        }
      } catch (error) {
        bindApiErrorToForm(error, form.setError);
        toast({ title: 'Error', description: getApiErrorMessage(error).message, variant: 'destructive' });
      }
    });
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Editar Viaje" description="Realiza cambios en los detalles del viaje a continuación." onSubmit={handleSubmit} submitText="Guardar Cambios" isLoading={form.isSubmitting}>
      <FormField label="Vehículo" required error={form.errors.vehicleId}>
        <ApiSelect value={String(form.data.vehicleId)} onValueChange={(value) => form.setField('vehicleId', Number(value))} placeholder="Seleccionar vehículo" options={vehicles} loading={isLoadingVehicles} error={vehiclesError} loadingMessage="Cargando vehículos..." errorMessage="Error al cargar los vehículos" emptyMessage="No hay vehículos disponibles" />
      </FormField>
      <FormField label="Hora de partida" required error={form.errors.departureHour}>
        <Input id="departure-hour" type="text" placeholder="Hora de partida" value={form.data.departureHour} onChange={(e) => form.setField('departureHour', e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
