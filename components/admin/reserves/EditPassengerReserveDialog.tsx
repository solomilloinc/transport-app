'use client';

import { useEffect, useMemo, useState } from 'react';
import { put } from '@/services/api';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { ApiSelect } from '@/components/dashboard/select';
import { PassengerReserveReport, PassengerReserveUpdate } from '@/interfaces/passengerReserve';
import { reserveValidationSchema } from '@/validations/reservePassengerSchema';
import { CityDirectionsDto, DropoffCityOption, PickupOption } from '@/interfaces/trip';
import { getApiErrorMessage, bindApiErrorToForm } from '@/lib/apiErrors';

interface EditPassengerReserveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passengerReserve: PassengerReserveReport | null;
  onSuccess: () => void;
  pickupOptions: PickupOption[];
  dropoffOptions: DropoffCityOption[];
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
  pickupOptions,
  dropoffOptions,
  isLoadingDirections,
}: EditPassengerReserveDialogProps) {
  const { toast } = useToast();
  const form = useFormValidation(emptyEditForm, reserveValidationSchema);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  const availablePickupOptions = useMemo(
    () =>
      (pickupOptions || [])
        .filter((option) => option && option.directionId != null)
        .map((option) => ({
          id: option.directionId.toString(),
          label: option.displayName || 'Sin nombre',
          value: option.directionId.toString(),
        })),
    [pickupOptions],
  );

  const availableCities = useMemo(
    () =>
      (dropoffOptions || [])
        .filter((city) => city && city.cityId != null)
        .map((city) => ({
          id: city.cityId.toString(),
          label: city.cityName,
          value: city.cityId.toString(),
        })),
    [dropoffOptions],
  );

  const availableDirections = useMemo(() => {
    if (!selectedCityId) return [];

    const city = dropoffOptions?.find((item) => item.cityId === selectedCityId);
    return (city?.directions || []).map((direction) => ({
      id: direction.directionId.toString(),
      label: direction.displayName || 'Sin nombre',
      value: direction.directionId.toString(),
    }));
  }, [selectedCityId, dropoffOptions]);

  useEffect(() => {
    if (!passengerReserve) return;

    form.setField('pickupLocationId', passengerReserve.pickupLocationId);
    form.setField('dropoffLocationId', passengerReserve.dropoffLocationId);

    const selectedCity = dropoffOptions.find((city) =>
      (city.directions || []).some(
        (direction) => direction.directionId === passengerReserve.dropoffLocationId,
      ),
    );

    setSelectedCityId(selectedCity?.cityId ?? null);
  }, [passengerReserve, dropoffOptions]);

  const handleSubmit = () => {
    form.handleSubmit(async (data) => {
      if (!passengerReserve) return;

      try {
        const updatePayload: PassengerReserveUpdate = {
          pickupLocationId: data.pickupLocationId,
          dropoffLocationId: data.dropoffLocationId,
          hasTraveled: passengerReserve.hasTraveled,
        };

        const response = await put(
          `/passenger-reserve-update/${passengerReserve.passengerId}`,
          updatePayload,
        );

        if (response) {
          toast({
            title: 'Reserva actualizada',
            description: 'La reserva se actualizó correctamente.',
            variant: 'success',
          });
          onSuccess();
          onOpenChange(false);
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
      title="Editar reserva"
      description={`Edita los detalles de la reserva de ${passengerReserve?.fullName}`}
      onSubmit={handleSubmit}
      submitText="Guardar cambios"
      isLoading={form.isSubmitting}
    >
      <FormField label="Dirección de subida" required error={form.errors.pickupLocationId}>
        <ApiSelect
          value={String(form.data.pickupLocationId || '')}
          onValueChange={(value) => form.setField('pickupLocationId', Number(value))}
          placeholder="Seleccionar dirección de subida"
          options={availablePickupOptions}
          loading={isLoadingDirections}
          error={null}
          loadingMessage="Cargando direcciones..."
          errorMessage="Error al cargar las direcciones"
          emptyMessage="No hay direcciones válidas para esta ruta"
        />
      </FormField>

      <FormField label="Destino (ciudad)" required>
        <ApiSelect
          value={selectedCityId ? String(selectedCityId) : ''}
          onValueChange={(value) => {
            const cityId = Number(value);
            setSelectedCityId(cityId);
            form.setField('dropoffLocationId', 0);
          }}
          placeholder="Seleccionar ciudad..."
          options={availableCities}
          loading={isLoadingDirections}
          error={null}
          emptyMessage="No hay ciudades válidas para esta ruta"
        />
      </FormField>

      {availableDirections.length > 0 && (
        <FormField label="Parada (opcional)">
          <ApiSelect
            value={form.data.dropoffLocationId ? String(form.data.dropoffLocationId) : ''}
            onValueChange={(value) =>
              form.setField('dropoffLocationId', value ? Number(value) : 0)
            }
            placeholder="No seleccionar parada específica"
            options={availableDirections}
          />
        </FormField>
      )}
    </FormDialog>
  );
}
