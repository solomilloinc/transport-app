'use client';

import { useFormValidation } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { emptyPassenger, Passenger } from '@/interfaces/passengers';
import { validationConfigPassenger } from '@/validations/passengerSchema';
import { FormDialog } from '@/components/dashboard/form-dialog';
import { FormField } from '@/components/dashboard/form-field';
import { Input } from '@/components/ui/input';
import { bindErrorInfoToForm } from '@/lib/apiErrors';
import { createCustomerAction } from '@/app/admin/customers/actions';

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
      const result = await createCustomerAction(data);
      if (!result.ok) {
        bindErrorInfoToForm(result, addFormPassenger.setError);
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Pasajero creado',
        description: 'El pasajero ha sido creado exitosamente',
        variant: 'success',
      });
      // Call the success callback with the new passenger data
      onSuccess({
        ...data,
        customerId: result.data,
      });
      onOpenChange(false); // Close the dialog on success
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
          onChange={(e) => addFormPassenger.setField('firstName', e.target.value)}
        />
      </FormField>
      <FormField label="Apellido" required error={addFormPassenger.errors.lastName}>
        <Input
          id="last-name"
          value={addFormPassenger.data.lastName}
          placeholder="Apellido"
          type="text"
          onChange={(e) => addFormPassenger.setField('lastName', e.target.value)}
        />
      </FormField>
      <FormField label="Email" required error={addFormPassenger.errors.email}>
        <Input id="email" value={addFormPassenger.data.email} onChange={(e) => addFormPassenger.setField('email', e.target.value)} />
      </FormField>
      <FormField label="Número de documento" required error={addFormPassenger.errors.documentNumber}>
        <Input
          id="documentNumber"
          value={addFormPassenger.data.documentNumber}
          placeholder="Número de documento"
          type="number"
          onChange={(e) => addFormPassenger.setField('documentNumber', e.target.value)}
        />
      </FormField>
      <FormField label="Teléfono 1" required error={addFormPassenger.errors.phone1}>
        <Input id="phone1" value={addFormPassenger.data.phone1} onChange={(e) => addFormPassenger.setField('phone1', e.target.value)} />
      </FormField>
      <FormField label="Teléfono 2">
        <Input id="phone2" value={addFormPassenger.data.phone2} onChange={(e) => addFormPassenger.setField('phone2', e.target.value)} />
      </FormField>
    </FormDialog>
  );
}
