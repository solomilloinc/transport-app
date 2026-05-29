import { emailRule, maxLengthRule, minLengthRule, numbersOnlyRule } from "@/utils/validation-rules";

export const validationConfigPassenger = {
  firstName: {
    required: { message: 'El nombre es requerido' },
  },
  lastName: {
    required: { message: 'El apellido es requerido' },
  },
  email: {
    required: { message: 'El correo electrónico es requerido' },
    rules: [emailRule],
  },
  documentNumber: {
    required: { message: 'El número de documento es requerido' },
    rules: [minLengthRule(7), maxLengthRule(8), numbersOnlyRule],
  },
  phone1: {
    required: { message: 'El teléfono 1 es requerido' },
  },
};