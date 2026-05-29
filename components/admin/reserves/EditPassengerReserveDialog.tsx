'use client';

import { useEffect, useState, useMemo } from 'react';
import { put } from '@/services/api';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { PassengerReserveReport, PassengerReserveUpdate } from '@/interfaces/passengerReserve';
import { reserveValidationSchema } from '@/validations/reservePassengerSchema';
import { CityDirectionsDto } from '@/interfaces/trip';
import { getApiErrorMessage, bindApiErrorToForm } from '@/lib/apiErrors';

interface EditPassengerReserveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passengerReserve: PassengerReserveReport | null;
  onSuccess: () => void;
  directions: SelectOption[];
  relevantCities: CityDirectionsDto[];
  isLoadingDirections: boolean;
}

const emptyEditForm = {
  pickupLocationId: 0,
  dropoffLocationId: 0,
};

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
  const form = useFormValidation(emptyEditForm, reserveValidationSchema);

  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const availableCities = useMemo(() => {
    return (relevantCities || []).map((c) => ({
      id: c.cityId.toString(),
      label: c.name,
      value: c.cityId.toString(),
    }));
  }, [relevantCities]);

  const availableDirections = useMemo(() => {
    if (!selectedCityId) return [];
    const city = relevantCities?.find((c) => c.cityId === selectedCityId);
    return (city?.directions || []).map((d) => ({
      id: d.directionId.toString(),
      label: d.name,
      value: d.directionId.toString(),
    }));
  }, [selectedCityId, relevantCities]);

  useEffect(() => {
    if (passengerReserve) {
      form.setField('pickupLocationId', passengerReserve.pickupLocationId);
      form.setField('dropoffLocationId', passengerReserve.dropoffLocationId);

      if (passengerReserve.dropoffLocationId) {
        const city = relevantCities.find((c) =>
          c.directions.some((d) => d.directionId === passengerReserve.dropoffLocationId),
        );
        if (city) {
          setSelectedCityId(city.cityId);
        }
      }
    }
  }, [passengerReserve, relevantCities]);

  const handleSubmit = () => {
    form.handleSubmit(async (data) => {
      if (!passengerReserve) return;
      try {
        const updatePayload: PassengerReserveUpdate = {
          pickupLocationId: data.pickupLocationId,
          dropoffLocationId: data.dropoffLocationId,
          hasTraveled: passengerReserve.hasTraveled,
        };
        const response = await put(`/passenger-reserve-update/${passengerReserve.passengerId}`, updatePayload);

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
        bindApiErrorToForm(error, form.setError);
        toast({
          title: 'Error',
          description: getApiErrorMessage(error).message,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Reserva"
      description={`Edita los detalles de la reserva de ${passengerReserve?.fullName}`}
      onSubmit={handleSubmit}
      submitText="Guardar Cambios"
      isLoading={form.isSubmitting}
    >
      <FormField label="Dirección de subida" required error={form.errors.pickupLocationId}>
        <ApiSelect
          value={String(form.data.pickupLocationId)}
          onValueChange={(value) => form.setField('pickupLocationId', Number(value))}
          placeholder="Seleccionar dirección de subida"
          options={directions}
          loading={isLoadingDirections}
          error={null}
          loadingMessage="Cargando direcciones..."
          errorMessage="Error al cargar las direcciones"
          emptyMessage="No hay direcciones disponibles"
        />
      </FormField>
      <FormField label="Destino (Ciudad)" required>
        <ApiSelect
          value={selectedCityId ? String(selectedCityId) : ''}
          onValueChange={(v) => {
            const cityId = Number(v);
            setSelectedCityId(cityId);
            form.setField('dropoffLocationId', 0);
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
            value={form.data.dropoffLocationId ? String(form.data.dropoffLocationId) : ''}
            onValueChange={(v) => {
              form.setField('dropoffLocationId', Number(v));
            }}
            placeholder="Seleccionar Parada..."
            options={availableDirections}
          />
        </FormField>
      )}
    </FormDialog>
  );
}
