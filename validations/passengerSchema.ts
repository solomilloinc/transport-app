import { emailRule, maxLengthRule, minLengthRule, numbersOnlyRule } from "@/utils/validation-rules";
import { ru } from "date-fns/locale";

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
    rules: [minLengthRule(7), maxLengthRule(8), numbersOnlyRule],
  },
  Phone1: {
    required: { message: 'El teléfono 1 es requerido' },
  },
};