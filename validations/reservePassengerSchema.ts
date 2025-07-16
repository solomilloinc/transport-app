import { FormValidationConfig } from "@/hooks/use-form-validation";
import { minValueRule } from "@/utils/validation-rules";

export const reserveValidationSchema: FormValidationConfig = {
  // Campos obligatorios siempre
   PickupLocationId: {  
    required: { message: 'La dirección de subida es obligatoria' },
    rules: [
      {
        validate: (value) => value !== 0,
        message: 'Debe seleccionar una dirección de subida',
      },
    ],
  },
  DropoffLocationId: {
    required: { message: 'La dirección de bajada es obligatoria' },
    rules: [
      {
        validate: (value) => value !== 0,
        message: 'Debe seleccionar una dirección de bajada',
      },
    ],
  },
  
  // PickupLocationReturnId: {
  //   rules: [
  //     {
  //       validate: (value, formData) => formData?.ReserveTypeId === 2 && value !== 0,
  //       message: 'Dirección de subida para la vuelta es obligatoria',
  //     },
  //   ],
  // },
  // DropoffLocationReturnId: {
  //   rules: [
  //     {
  //       validate: (value, formData) => formData?.ReserveTypeId === 2 && value !== 0,
  //       message: 'Dirección de bajada para la vuelta es obligatoria',
  //     },
  //   ],
  // },

  // // Campos de pago (si hay pago activado)
  // PaymentMethod: {
  //   required: false,
  //   rules: [
  //     {
  //       validate: (value, formData) => formData?.IsPayment ? !!value : true,
  //       message: 'Debe seleccionar un método de pago',
  //     },
  //   ],
  // },
  // TransactionAmount: {
  //   required: false,
  //   rules: [
  //     {
  //       validate: (value, formData) =>
  //         formData?.IsPayment ? Number(value) > 0 : true,
  //       message: 'El monto debe ser mayor a cero',
  //     },
  //   ],
  // },
};
