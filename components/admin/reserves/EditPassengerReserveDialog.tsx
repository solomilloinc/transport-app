'use client';

import { useEffect, use } from 'react';
import { post, put } from '@/services/api';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { emptyPassengerCreate, PassengerReserveReport, PassengerReserveUpdate } from '@/interfaces/passengerReserve';
import { reserveValidationSchema } from '@/validations/reservePassengerSchema';
import { CityDirectionsDto } from '@/interfaces/trip';
import { useState, useMemo } from 'react';

interface EditPassengerReserveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passengerReserve: PassengerReserveReport | null;
  onSuccess: () => void;
  directions: SelectOption[];
  relevantCities: CityDirectionsDto[];
  isLoadingDirections: boolean;
}

// We need a base object for the form that matches the validation schema

export function EditPassengerReserveDialog({
  open,
  onOpenChange,
  passengerReserve,
  onSuccess,
  directions,
  relevantCities,
  isLoadingDirections,
}: EditPassengerReserveDialogProps) {
  const { toast } = useToast();
  const form = useFormValidation(emptyPassengerCreate, reserveValidationSchema);

  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const availableCities = useMemo(() => {
    return (relevantCities || []).map(c => ({
      id: c.CityId.toString(),
      label: c.Name,
      value: c.CityId.toString()
    }));
  }, [relevantCities]);

  const availableDirections = useMemo(() => {
    if (!selectedCityId) return [];
    const city = relevantCities?.find(c => c.CityId === selectedCityId);
    return (city?.Directions || []).map(d => ({
      id: d.DirectionId.toString(),
      label: d.Name,
      value: d.DirectionId.toString()
    }));
  }, [selectedCityId, relevantCities]);

  useEffect(() => {
    if (passengerReserve) {
      // When a passenger is selected, populate the form
      form.setField('PickupLocationId', passengerReserve.PickupLocationId);
      form.setField('DropoffLocationId', passengerReserve.DropoffLocationId);

      // Try to find the city for the current DropoffLocationId
      if (passengerReserve.DropoffLocationId) {
        const city = relevantCities.find(c =>
          c.Directions.some(d => d.DirectionId === passengerReserve.DropoffLocationId)
        );
        if (city) {
          setSelectedCityId(city.CityId);
        } else {
          // If not in a sub-direction, maybe it's a generic city price?
          // We don't have CityId directly in PassengerReserveReport usually, 
          // but we can try to find it by name or leave it null if it's 0.
        }
      }
    }
  }, [passengerReserve, relevantCities]);

  const handleSubmit = () => {
    form.handleSubmit(async (data) => {
      if (!passengerReserve) return;
      try {
        const updatePayload: PassengerReserveUpdate = {
          pickupLocationId: data.PickupLocationId,
          dropoffLocationId: data.DropoffLocationId,
          hasTraveled: passengerReserve.HasTraveled,
        };
        const response = await put(`/passenger-reserve-update/${passengerReserve.PassengerId}`, updatePayload);

        if (response) {
          toast({
            title: 'Reserva actualizada',
            description: 'La reserva ha sido actualizada exitosamente',
            variant: 'success',
          });
          onSuccess();
          onOpenChange(false);
        } else {
          toast({
            title: 'Error',
            description: 'Error al actualizar la reserva',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al actualizar la reserva',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Editar Reserva" description={`Edita los detalles de la reserva de ${passengerReserve?.FullName}`} onSubmit={handleSubmit} submitText="Guardar Cambios" isLoading={form.isSubmitting}>
      <FormField label="Dirección de subida" required error={form.errors.PickupLocationId}>
        <ApiSelect value={String(form.data.PickupLocationId)} onValueChange={(value) => form.setField('PickupLocationId', Number(value))} placeholder="Seleccionar dirección de subida" options={directions} loading={isLoadingDirections} error={null} loadingMessage="Cargando direcciones..." errorMessage="Error al cargar las direcciones" emptyMessage="No hay direcciones disponibles" />
      </FormField>
      <FormField label="Destino (Ciudad)" required>
        <ApiSelect
          value={selectedCityId ? String(selectedCityId) : ''}
          onValueChange={(v) => {
            const cityId = Number(v);
            setSelectedCityId(cityId);
            form.setField('DropoffLocationId', 0);
          }}
          placeholder="Seleccionar Ciudad..."
          options={availableCities}
          loading={isLoadingDirections}
          error={null}
        />
      </FormField>

      {availableDirections.length > 0 && (
        <FormField label="Parada (Opcional)" required={false}>
          <ApiSelect
            value={form.data.DropoffLocationId ? String(form.data.DropoffLocationId) : ''}
            onValueChange={(v) => {
              form.setField('DropoffLocationId', Number(v));
            }}
            placeholder="Seleccionar Parada..."
            options={availableDirections}
          />
        </FormField>
      )}
    </FormDialog>
  );
}