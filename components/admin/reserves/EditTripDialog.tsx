'use client';

import { useEffect, useState } from 'react';
import { post, get } from '@/services/api';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { Input } from '@/components/ui/input';
import { emptyEditReserve, ReserveReport } from '@/interfaces/reserve';
import { validationConfigEditReserve } from '@/validations/reserveSchema';
import { Vehicle } from '@/interfaces/vehicle';

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
      const response = await get<any, Vehicle>('/vehicle-report', {
        pageNumber: 1,
        pageSize: 100, // Fetch more vehicles
        sortBy: 'name',
        sortDescending: false,
        filters: {},
      });
      if (response && response.Items) {
        const formattedVehicles: SelectOption[] = response.Items.map((vehicle) => ({
          id: vehicle.VehicleId,
          value: vehicle.VehicleId.toString(),
          label: `${vehicle.VehicleTypeName} (${vehicle.InternalNumber})`,
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
      form.setField('VehicleId', trip.VehicleId);
      form.setField('DepartureHour', trip.DepartureHour);
    }
  }, [trip]);

  const handleSubmit = () => {
    form.handleSubmit(async (data) => {
      try {
        const response = await post('/reserve-update', { ...trip, ...data });

        if (response) {
          toast({ title: 'Viaje actualizado', description: 'El viaje ha sido actualizado exitosamente.', variant: 'success' });
          onSuccess();
          onOpenChange(false);
        } else {
          toast({ title: 'Error', description: 'Error al actualizar el viaje.', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Ocurrió un error al actualizar el viaje.', variant: 'destructive' });
      }
    });
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Editar Viaje" description="Realiza cambios en los detalles del viaje a continuación." onSubmit={handleSubmit} submitText="Guardar Cambios" isLoading={form.isSubmitting}>
      <FormField label="Vehículo" required error={form.errors.VehicleId}>
        <ApiSelect value={String(form.data.VehicleId)} onValueChange={(value) => form.setField('VehicleId', Number(value))} placeholder="Seleccionar vehículo" options={vehicles} loading={isLoadingVehicles} error={vehiclesError} loadingMessage="Cargando vehículos..." errorMessage="Error al cargar los vehículos" emptyMessage="No hay vehículos disponibles" />
      </FormField>
      <FormField label="Hora de partida" required error={form.errors.DepartureHour}>
        <Input id="departure-hour" type="text" placeholder="Hora de partida" value={form.data.DepartureHour} onChange={(e) => form.setField('DepartureHour', e.target.value)} />
      </FormField>
    </FormDialog>
  );
}