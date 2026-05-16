import { FormValidationConfig } from '@/hooks/use-form-validation';

export const reserveValidationSchema: FormValidationConfig = {
  pickupLocationId: {
    required: { message: 'La dirección de subida es obligatoria' },
    rules: [
      {
        validate: (value) => value !== 0,
        message: 'Debe seleccionar una dirección de subida',
      },
    ],
  },
  pickupLocationReturnId: {
    rules: [
      {
        validate: (value, formData) =>
          formData?.reserveTypeId === 2 ? value !== '0' : true,
        message: 'Dirección de subida para la vuelta es obligatoria',
      },
    ],
  },
  dropoffLocationReturnId: {
    rules: [
      {
        validate: (value, formData) =>
          formData?.reserveTypeId === 2 ? value !== '0' : true,
        message: 'Dirección de bajada para la vuelta es obligatoria',
      },
    ],
  },
};
