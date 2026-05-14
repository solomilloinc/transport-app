'use client';

import { post } from '@/services/api';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { emptyPassenger, Passenger } from '@/interfaces/passengers';
import { validationConfigPassenger } from '@/validations/passengerSchema';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { Input } from '@/components/ui/input';

interface NewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newPassenger: Passenger) => void;
}

export function NewClientDialog({ open, onOpenChange, onSuccess }: NewClientDialogProps) {
  const { toast } = useToast();
  const addFormPassenger = useFormValidation(emptyPassenger, validationConfigPassenger);

  const submitAddNewClient = () => {
    addFormPassenger.handleSubmit(async (data) => {
      try {
        const response = await post('/customer-create', data);
        if (response) {
          toast({
            title: 'Pasajero creado',
            description: 'El pasajero ha sido creado exitosamente',
            variant: 'success',
          });
          // Call the success callback with the new passenger data
          onSuccess({
            ...data,
            customerId: response,
          });
          onOpenChange(false); // Close the dialog on success
        } else {
          toast({
            title: 'Error',
            description: 'Error al crear el pasajero',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el pasajero',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Añadir Nuevo Cliente"
      description="Crea un nuevo cliente completando el formulario a continuación"
      onSubmit={submitAddNewClient}
      submitText="Crear Cliente"
      isLoading={addFormPassenger.isSubmitting}
    >
      <FormField label="Nombre" required error={addFormPassenger.errors.firstName}>
        <Input
          id="first-name"
          value={addFormPassenger.data.firstName}
          type="text"
          placeholder="Nombre"
          onChange={(e) => addFormPassenger.setField('FirstName', e.target.value)}
        />
      </FormField>
      <FormField label="Apellido" required error={addFormPassenger.errors.lastName}>
        <Input
          id="last-name"
          value={addFormPassenger.data.lastName}
          placeholder="Apellido"
          type="text"
          onChange={(e) => addFormPassenger.setField('LastName', e.target.value)}
        />
      </FormField>
      <FormField label="Email" required error={addFormPassenger.errors.email}>
        <Input id="email" value={addFormPassenger.data.email} onChange={(e) => addFormPassenger.setField('Email', e.target.value)} />
      </FormField>
      <FormField label="Número de documento" required error={addFormPassenger.errors.documentNumber}>
        <Input
          id="documentNumber"
          value={addFormPassenger.data.documentNumber}
          placeholder="Número de documento"
          type="number"
          onChange={(e) => addFormPassenger.setField('DocumentNumber', e.target.value)}
        />
      </FormField>
      <FormField label="Teléfono 1" required error={addFormPassenger.errors.phone1}>
        <Input id="phone1" value={addFormPassenger.data.phone1} onChange={(e) => addFormPassenger.setField('Phone1', e.target.value)} />
      </FormField>
      <FormField label="Teléfono 2">
        <Input id="phone2" value={addFormPassenger.data.phone2} onChange={(e) => addFormPassenger.setField('Phone2', e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
