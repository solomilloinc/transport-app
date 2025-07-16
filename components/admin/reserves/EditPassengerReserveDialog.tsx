'use client';

import { useEffect, use } from 'react';
import { post } from '@/services/api';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { ApiSelect, SelectOption } from '@/components/dashboard/select';
import { emptyPassengerCreate, PassengerReserveReport } from '@/interfaces/passengerReserve';
import { validationConfigEditReserve } from '@/validations/reserveSchema';

interface EditPassengerReserveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passengerReserve: PassengerReserveReport | null;
  onSuccess: () => void;
  directions: SelectOption[];
  isLoadingDirections: boolean;
}

// We need a base object for the form that matches the validation schema

export function EditPassengerReserveDialog({
  open,
  onOpenChange,
  passengerReserve,
  onSuccess,
  directions,
  isLoadingDirections,
}: EditPassengerReserveDialogProps) {
  const { toast } = useToast();
  const form = useFormValidation(emptyPassengerCreate, validationConfigEditReserve);

  useEffect(() => {
    if (passengerReserve) {
      // When a passenger is selected, populate the form
      form.setField('PickupLocationId', passengerReserve.PickupLocationId);
      form.setField('DropoffLocationId', passengerReserve.DropoffLocationId);
    }
  }, [passengerReserve]);

  const handleSubmit = () => {
    form.handleSubmit(async (data) => {
      try {
        const response = await post('/customer-reserve-update', {
          ...data,
          CustomerReserveId: passengerReserve?.CustomerReserveId,
        });

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
      <FormField label="Dirección de Bajada" required error={form.errors.DropoffLocationId}>
        <ApiSelect value={String(form.data.DropoffLocationId)} onValueChange={(value) => form.setField('DropoffLocationId', Number(value))} placeholder="Seleccionar dirección de bajada" options={directions} loading={isLoadingDirections} error={null} loadingMessage="Cargando direcciones..." errorMessage="Error al cargar las direcciones" emptyMessage="No hay direcciones disponibles" />
      </FormField>
    </FormDialog>
  );
}