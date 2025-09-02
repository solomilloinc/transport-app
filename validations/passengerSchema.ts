import { emailRule } from "@/utils/validation-rules";

export const validationConfigPassenger = {
  FirstName: {
    required: { message: 'El nombre es requerido' },
  },
  LastName: {
    required: { message: 'El apellido es requerido' },
  },
  Email: {
    required: { message: 'El correo electrónico es requerido' },
    rules: [emailRule],
  },
  DocumentNumber: {
    required: { message: 'El número de documento es requerido' },
  },
  Phone1: {
    required: { message: 'El teléfono 1 es requerido' },
  },
};